const Docker = require('dockerode');
const TelegramClient = require('./telegram');
const JSONStream = require('JSONStream');
const templates = require('./templates');

const { ONLY_WHITELIST } = process.env;
const docker = new Docker();
const telegram = new TelegramClient();

const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 60000;

let stream = null;
let reconnectTimer = null;
let reconnectDelay = RECONNECT_MIN_MS;
let shuttingDown = false;

// `since` has one-second resolution and is inclusive, so a reconnect replays
// the whole second we stopped in. Remember which events of that second were
// already handled and drop them when they come back.
let lastEventTime = null;
let handledInLastSecond = new Set();

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

      // Only add threadId if explicitly set via label. topic-id wins over
      // thread-id; an empty value, 'false' or '0' turns the globally
      // configured topic off for this container, which is what you need when
      // its chat has no topics at all.
      const labelTopicId = attributes['telegram-notifier.topic-id'];
      const labelThreadId = attributes['telegram-notifier.thread-id'];
      const labelValue = labelTopicId !== undefined ? labelTopicId : labelThreadId;

      if (labelValue !== undefined) {
        const value = labelValue.trim();
        const isDisabled = value === '' ||
                           value.toLowerCase() === 'false' ||
                           value === '0';
        overrides.threadId = isDisabled ? '' : value;
      }

      const attachment = template(event);
      console.log(attachment, "\n");
      await telegram.send(attachment, overrides);
    }
  }
}

function eventKey(event) {
  return `${event.timeNano}|${event.Type}|${event.Action}|${event.Actor?.ID}`;
}

// Returns false for an event we already handled before a reconnect.
function isNewEvent(event) {
  if (typeof event.time !== 'number') return true;

  if (lastEventTime === null || event.time > lastEventTime) {
    lastEventTime = event.time;
    handledInLastSecond = new Set([eventKey(event)]);
    return true;
  }
  if (event.time < lastEventTime) return false;

  const key = eventKey(event);
  if (handledInLastSecond.has(key)) return false;
  handledInLastSecond.add(key);
  return true;
}

function scheduleReconnect(reason) {
  if (shuttingDown || reconnectTimer) return;

  if (stream) {
    stream.destroy();
    stream = null;
  }

  // Jitter keeps a fleet of notifiers from reconnecting in lockstep after a
  // daemon restart.
  const delay = Math.round(reconnectDelay * (1 + Math.random() * 0.25));
  console.error(`${reason}. Reconnecting in ${Math.round(delay / 1000)}s.`);
  reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectEventStream().catch(e => scheduleReconnect(`Reconnect failed: ${e.message}`));
  }, delay);
}

async function connectEventStream() {
  const options = {};
  if (lastEventTime !== null) {
    options.since = lastEventTime;
  }

  stream = await docker.getEvents(options);
  reconnectDelay = RECONNECT_MIN_MS;
  console.log(lastEventTime === null ?
    "Listening for docker events." :
    `Listening for docker events again, replaying from ${lastEventTime}.`);

  stream.pipe(JSONStream.parse())
    .on('data', event => {
      if (isNewEvent(event)) sendEvent(event).catch(handleError);
    })
    .on('error', e => scheduleReconnect(`Could not parse the event stream: ${e.message}`));

  // A docker restart ends the stream without an error. Without this the
  // process kept running and silently stopped reporting anything.
  stream.on('end', () => scheduleReconnect("The docker event stream ended"));
  stream.on('close', () => scheduleReconnect("The docker event stream closed"));
  stream.on('error', e => scheduleReconnect(`The docker event stream failed: ${e.message}`));
}

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, shutting down.`);

  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (stream) stream.destroy();
  process.exit(0);
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
    memory: Math.floor(info.MemTotal / (1024 * 1024)) + ' MB',
    version: version.Version
  });
  console.log(text, "\n");
  await telegram.send(text);
}

async function main() {
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));

  // Connect first. A failing start-up message must not cost us the event
  // stream: main() rejected before the listener was ever set up, and the
  // container then sat there doing nothing.
  await connectEventStream();

  try {
    await sendVersion();
  } catch (e) {
    console.error("Could not send the start-up message:", e.message);
  }
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
