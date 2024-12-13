const Docker = require('dockerode');
const TelegramClient = require('./telegram');
const JSONStream = require('JSONStream');
const templates = require('./templates');

const { ONLY_WHITELIST } = process.env;
const docker = new Docker();
const telegram = new TelegramClient();

async function sendEvent(event) {
  const template = templates[`${event.Type}_${event.Action}`];
  if (template) {
    const attributes = event.Actor?.Attributes || {};
    
    // Check monitoring status
    const monitorLabel = attributes['telegram-notifier.monitor'];
    const shouldMonitor = monitorLabel === undefined ? 
      undefined : 
      monitorLabel.toLowerCase().trim() !== 'false';

    if (shouldMonitor || !ONLY_WHITELIST && shouldMonitor !== false) {
      // Get container-specific channel settings
      const overrides = {};

      // Only add chatId if explicitly set via label
      const labelChatId = attributes['telegram-notifier.chat-id'];
      if (labelChatId) {
        overrides.chatId = labelChatId;
      }

      // Only add threadId if explicitly set via label
      const labelThreadId = attributes['telegram-notifier.topic-id'] || 
                            attributes['telegram-notifier.thread-id'];
      if (labelThreadId) {
        overrides.threadId = labelThreadId;
      }

      const attachment = template(event);
      console.log(attachment, "\n");
      await telegram.send(attachment, overrides);
    }
  }
}

async function sendEventStream() {
  const eventStream = await docker.getEvents();
  eventStream.pipe(JSONStream.parse())
    .on('data', event => sendEvent(event).catch(handleError))
    .on('error', handleError);
}

async function sendVersion() {
  const version = await docker.version();
  const info = await docker.info();
  let text = templates.connection_message({
    hostname: info.Name,
    os: info.OperatingSystem,
    type: info.OSType,
    architecture: info.Architecture,
    cpu: info.NCPU,
    memory: (info.MemTotal / (1024 * 1024)).toFixed(2) + 'MB',
    version: version.Version
  });
  console.log(text, "\n");
  await telegram.send(text);
}

async function main() {
  await sendVersion();
  await sendEventStream();
}

async function healthcheck() {
  try {
    await docker.version();
  } catch (e) {
    console.error(e);
    console.error("Docker is unavailable");
    process.exit(101);
  }

  try {
    console.log(await telegram.check());
  } catch (e) {
    console.error(e);
    console.error("Telegram API is unavailable");
    process.exit(102);
  }

  console.log("OK");
  process.exit(0);
}

function handleError(e) {
  console.error(e);
  telegram.sendError(e).catch(console.error);
}

if (process.argv.includes("healthcheck")) {
  healthcheck();
} else {
  main().catch(handleError);
}
