const { Telegram } = require('telegraf');
const { escapeHtml } = require('./escape');

/**
 * Telegram expects message_thread_id to be a positive integer. parseInt on a
 * label like 'general' yields NaN, which is serialised as null and answered
 * with a 400 that says nothing about the actual mistake.
 */
function parseThreadId(value) {
  const id = Number.parseInt(String(value).trim(), 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Telegram accepts roughly 20 messages per minute into one group. A
// crash-looping container produces far more than that, so sends are spaced
// out instead of being fired as fast as docker reports them.
const configuredInterval = Number.parseInt(process.env.TELEGRAM_NOTIFIER_SEND_INTERVAL_MS, 10);
const SEND_INTERVAL_MS = Number.isSafeInteger(configuredInterval) && configuredInterval >= 0 ?
  configuredInterval : 1000;

// A burst that outruns the queue is dropped rather than kept in memory
// forever: by the time a backlog this long drains, the notifications are of
// no use anyway.
const MAX_QUEUED = 200;
const MAX_RATE_LIMIT_RETRIES = 3;

// Every failed send used to produce another notification, so one bad topic id
// could turn a restart loop into a stream of error messages.
const ERROR_WINDOW_MS = 300000;
const MAX_ERRORS_PER_WINDOW = 5;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class TelegramClient {
  constructor() {
    this.telegram = new Telegram(process.env.TELEGRAM_NOTIFIER_BOT_TOKEN);
    this.queue = Promise.resolve();
    this.queued = 0;
    this.lastSentAt = 0;
    this.recentErrors = [];
    this.suppressionAnnounced = false;
    this.dropped = 0;
    this.threadId =
      process.env.TELEGRAM_NOTIFIER_TOPIC_ID ||
      process.env.TELEGRAM_NOTIFIER_THREAD_ID ||
      null;
  }

  // Runs tasks one at a time, never closer together than SEND_INTERVAL_MS.
  enqueue(task) {
    if (this.queued >= MAX_QUEUED) {
      // One line per drop would bury the log during exactly the burst that
      // caused it, so report the first drop and the total once it clears.
      if (this.dropped === 0) {
        console.error(`Send queue is full (${MAX_QUEUED} waiting), dropping notifications.`);
      }
      this.dropped++;
      return Promise.resolve(null);
    }

    if (this.dropped > 0) {
      console.error(`Send queue has room again, ${this.dropped} notification(s) were dropped.`);
      this.dropped = 0;
    }

    this.queued++;
    const run = this.queue.then(async () => {
      const wait = SEND_INTERVAL_MS - (Date.now() - this.lastSentAt);
      if (wait > 0) await sleep(wait);
      try {
        return await task();
      } finally {
        this.lastSentAt = Date.now();
        this.queued--;
      }
    });

    // The chain must survive a failed send, or nothing is ever sent again.
    this.queue = run.catch(() => {});
    return run;
  }

  // Honours the retry_after Telegram sends with a 429 instead of hammering it.
  async withRateLimitRetry(call) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await call();
      } catch (e) {
        const retryAfter = e.response?.parameters?.retry_after;
        if (retryAfter === undefined || attempt >= MAX_RATE_LIMIT_RETRIES) throw e;
        console.error(`Rate limited by Telegram, retrying in ${retryAfter}s.`);
        await sleep((retryAfter + 1) * 1000);
      }
    }
  }

  async send(message, overrides = {}) {
    const options = {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    // Check if threadId was explicitly provided in overrides (even if empty)
    const threadId = 'threadId' in overrides
      ? overrides.threadId
      : this.threadId;

    // Only set message_thread_id if threadId has a truthy value
    if (threadId) {
      const parsedThreadId = parseThreadId(threadId);
      if (parsedThreadId === null) {
        console.error(
          `Ignoring invalid topic/thread id ${JSON.stringify(threadId)}: ` +
          `expected a positive integer. Sending to the chat without a topic.`
        );
      } else {
        options.message_thread_id = parsedThreadId;
      }
    }

    const chatId = overrides.chatId || process.env.TELEGRAM_NOTIFIER_CHAT_ID;

    return this.enqueue(() => this.withRateLimitRetry(
      () => this.telegram.sendMessage(chatId, message, options)
    ));
  }

  // True while the error budget for the current window still has room.
  mayReportError() {
    const now = Date.now();
    this.recentErrors = this.recentErrors.filter(at => now - at < ERROR_WINDOW_MS);

    if (this.recentErrors.length >= MAX_ERRORS_PER_WINDOW) {
      if (!this.suppressionAnnounced) {
        console.error(
          `More than ${MAX_ERRORS_PER_WINDOW} errors in ${ERROR_WINDOW_MS / 1000}s; ` +
          `further error notifications are suppressed until the rate drops. ` +
          `They are still written to the log.`
        );
        this.suppressionAnnounced = true;
      }
      return false;
    }

    this.recentErrors.push(now);
    this.suppressionAnnounced = false;
    return true;
  }

  async sendError(e, overrides = {}) {
    if (!this.mayReportError()) return null;

    const options = {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    const chatId = overrides.chatId || process.env.TELEGRAM_NOTIFIER_CHAT_ID;

    // Extract error details from TelegramError response JSON. Errors that did
    // not come from the Telegram API carry neither response nor on, so the
    // method and payload are left out rather than mislabelled.
    const errorCode = e.response?.error_code || '0';
    const errorDescription = e.response?.description || e.message || 'Unknown error';
    const failedMethod = e.on?.method;
    const failedPayload = e.on?.payload;

    let errorMessage = failedMethod
      ? `[Error ${escapeHtml(failedMethod)}] ${escapeHtml(errorCode)} - ${escapeHtml(errorDescription)}`
      : `[Error] ${escapeHtml(errorCode)} - ${escapeHtml(errorDescription)}`;

    // The payload contains the original message text, which is our own HTML
    // template output. Unescaped it would either be rendered instead of shown,
    // or break the error report itself.
    if (failedPayload !== undefined) {
      errorMessage += `\n<pre>${escapeHtml(JSON.stringify(failedPayload, null, 2))}</pre>`;
    }

    try {
      // Try to send error WITHOUT the topic_id to avoid recursive errors
      // This ensures the message reaches the chat even if topic_id is wrong
      return await this.enqueue(() => this.withRateLimitRetry(
        () => this.telegram.sendMessage(chatId, errorMessage, options)
      ));
    } catch (fallbackError) {
      // If even this fails, log to console only
      console.error('Failed to send error notification to Telegram:', {
        originalError: {
          code: errorCode,
          description: errorDescription,
          chatId: chatId
        },
        fallbackError: fallbackError.message
      });
      // Re-throw so it's visible in logs
      throw fallbackError;
    }
  }

  check() {
    return this.telegram.getMe();
  }
}

module.exports = TelegramClient;
