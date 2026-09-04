const { Telegram } = require('telegraf');

/**
 * Messages are sent with parse_mode HTML, so every value interpolated into
 * message text has to be escaped. Container names, image tags and custom
 * labels are arbitrary strings: a single stray '<' makes Telegram reject the
 * whole message.
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Telegram expects message_thread_id to be a positive integer. parseInt on a
 * label like 'general' yields NaN, which is serialised as null and answered
 * with a 400 that says nothing about the actual mistake.
 */
function parseThreadId(value) {
  const id = Number.parseInt(String(value).trim(), 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

class TelegramClient {
  constructor() {
    this.telegram = new Telegram(process.env.TELEGRAM_NOTIFIER_BOT_TOKEN);
    this.threadId =
      process.env.TELEGRAM_NOTIFIER_TOPIC_ID ||
      process.env.TELEGRAM_NOTIFIER_THREAD_ID ||
      null;
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

    return this.telegram.sendMessage(
      chatId,
      message,
      options
    );
  }

  async sendError(e, overrides = {}) {
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
      return await this.telegram.sendMessage(
        chatId,
        errorMessage,
        options
      );
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
