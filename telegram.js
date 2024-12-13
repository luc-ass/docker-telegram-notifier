const { Telegram } = require('telegraf');

class TelegramClient {
  constructor() {
    this.telegram = new Telegram(process.env.TELEGRAM_NOTIFIER_BOT_TOKEN);
    this.threadId = process.env.TELEGRAM_NOTIFIER_TOPIC_ID || process.env.TELEGRAM_NOTIFIER_THREAD_ID || null;
  }

  send(message) {
    const options = {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    if (this.threadId) {
      options.message_thread_id = parseInt(this.threadId);
    }

    return this.telegram.sendMessage(
      process.env.TELEGRAM_NOTIFIER_CHAT_ID,
      message,
      options
    );
  }

  sendError(e) {
    const options = {};
    if (this.threadId) {
      options.message_thread_id = parseInt(this.threadId);
    }

    return this.telegram.sendMessage(
      process.env.TELEGRAM_NOTIFIER_CHAT_ID,
      `Error: ${e}`,
      options
    );
  }

  check() {
    return this.telegram.getMe();
  }
}

module.exports = TelegramClient;
