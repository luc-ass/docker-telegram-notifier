const { Telegram } = require('telegraf');

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
      options.message_thread_id = parseInt(threadId);
      if (overrides.threadIsTopic) {
        options.is_topic_message = true;
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

    // Extract error details from TelegramError response JSON
    const errorCode = e.response?.error_code || '0';
    const errorDescription = e.response?.description || e.message || 'Unknown error';
    const failedMethod = e.on?.method || 'sendMessage';
    const failedPayloadJson = JSON.stringify(e.on?.payload, null, 2);
    let errorMessage = `[Error ${failedMethod}] ${errorCode} - ${errorDescription}\n<pre>${failedPayloadJson}</pre>`;

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
