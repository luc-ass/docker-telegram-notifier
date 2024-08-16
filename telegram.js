const { Telegram } = require('telegraf');

class TelegramClient {
  constructor() {
    this.telegram = new Telegram(process.env.TELEGRAM_NOTIFIER_BOT_TOKEN);
  }

  send(message) {
    return this.telegram.sendMessage(
      process.env.TELEGRAM_NOTIFIER_CHAT_ID,
      message,
      { 
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        message_thread_id: process.env.TELEGRAM_NOTIFIER_TOPIC_ID,
      }
    );
  }

  sendError(e) {
    return this.telegram.sendMessage(
        process.env.TELEGRAM_NOTIFIER_CHAT_ID,
        `Error: ${e}`,
    );
  }

  check() {
    return this.telegram.getMe();
  }
}

module.exports = TelegramClient;
