const fs = require('fs');
const os = require('os');
const path = require('path');
const Docker = require('dockerode');
const TelegramClient = require('./telegram');
const JSONStream = require('JSONStream');
const templates = require('./templates');
const { escapeHtml } = require('./escape');
const { loadFileSettings } = require('./secrets');

// Before anything reads them: a token handed over as a file must be in place
// before the Telegram client is constructed below.
loadFileSettings(['TELEGRAM_NOTIFIER_BOT_TOKEN', 'TELEGRAM_NOTIFIER_CHAT_ID']);

/**
 * Environment values are strings, so the plain truthiness check this used to
 * do turned ONLY_WHITELIST=false into "whitelist on" — the exact opposite of
 * what the compose file said.
 */
function envFlag(value) {
  if (value === undefined) return false;
  const flag = String(value).trim().toLowerCase();
  return flag !== '' && flag !== 'false' && flag !== '0' &&
         flag !== 'no' && flag !== 'off';
}

const ONLY_WHITELIST = envFlag(process.env.ONLY_WHITELIST);
const docker = new Docker();
const telegram = new TelegramClient();

/**
 * Ask docker only for the events we have a template for. Derived from the
 * template keys rather than hard-coded, so a mounted templates.js that adds
 * events keeps receiving them.
 */
function eventFilters() {
  const types = new Set();
  const events = new Set();

  for (const key of Object.keys(templates)) {
    // Not an event template — sendVersion calls it directly.
    if (key === 'connection_message') continue;

    const separator = key.indexOf('_');
    if (separator === -1) continue;

    types.add(key.slice(0, separator));
    // 'health_status: healthy' is filtered on the action name alone.
    events.add(key.slice(separator + 1).split(':')[0].trim());
  }

  // Filtering on nothing would mean receiving nothing, so an unusable set of
  // templates falls back to the unfiltered stream.
  if (types.size === 0 || events.size === 0) return null;
  return { type: [...types], event: [...events] };
}

const EVENT_FILTERS = eventFilters();

/**
 * Attributes carry arbitrary user input: container names, image tags and any
 * custom label the README encourages people to add. Escaping them here covers
 * every template, including the ones people mount themselves, instead of
 * asking each template to remember.
 */
function withEscapedAttributes(event) {
  const attributes = event.Actor?.Attributes;
  if (!attributes) return event;

  const escaped = {};
  for (const [key, value] of Object.entries(attributes)) {
    escaped[key] = escapeHtml(value);
  }
  return { ...event, Actor: { ...event.Actor, Attributes: escaped } };
}

// Swarm labels every task container it starts. They are ordinary container
// labels, so they reach us in the event stream like any other attribute.
const SWARM_SERVICE_NAME = 'com.docker.swarm.service.name';
const SWARM_TASK_NAME = 'com.docker.swarm.task.name';
const SWARM_NODE_ID = 'com.docker.swarm.node.id';
const STACK_NAMESPACE = 'com.docker.stack.namespace';

/**
 * Swarm names a task container `<service>.<slot>.<task id>`, and that name is
 * what a message ends up quoting: 'web_server.3.n31jwutl4l33kcuz20taem4p4'.
 * Split it back into the parts worth reading so a template can say
 * 'web_server.3' and name the node the task is running on.
 *
 * The node is not read from the event. `com.docker.swarm.node.id` holds an id
 * rather than a name, and resolving it would need the swarm API a worker does
 * not have — but the event stream only ever carries containers of the daemon
 * we are connected to, so that daemon's hostname already is the node.
 *
 * Attributes arrive escaped from withEscapedAttributes; the node name comes
 * from the daemon and is escaped here for the same reason. An event without
 * swarm labels keeps the shape it has always had.
 */
function withContext(event, node) {
  const contextual = node ? { ...event, node: escapeHtml(node) } : event;

  const attributes = event.Actor?.Attributes;
  const service = attributes?.[SWARM_SERVICE_NAME];
  if (!service) return contextual;

  // A replicated service puts its slot number between the service name and
  // the task id. A global service puts the node id there instead, which is no
  // more readable than the task id, so only a number counts as a slot.
  const taskName = attributes[SWARM_TASK_NAME] || '';
  const candidate = taskName.startsWith(`${service}.`) ?
    taskName.slice(service.length + 1).split('.')[0] :
    '';
  const slot = /^\d+$/.test(candidate) ? candidate : undefined;

  return {
    ...contextual,
    swarm: {
      service,
      slot,
      name: slot ? `${service}.${slot}` : service,
      stack: attributes[STACK_NAMESPACE],
      nodeId: attributes[SWARM_NODE_ID]
    }
  };
}

// The healthcheck runs as its own process and cannot see the state of the
// event loop, so the listener leaves a heartbeat file behind instead. It is
// refreshed while the stream is connected and the daemon answers, and goes
// stale as soon as either stops being true.
const HEARTBEAT_FILE = process.env.TELEGRAM_NOTIFIER_HEARTBEAT_FILE ||
  path.join(os.tmpdir(), 'docker-telegram-notifier.heartbeat');
const HEARTBEAT_INTERVAL_MS = 30000;
const HEARTBEAT_MAX_AGE_MS = 90000;

const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 60000;

let stream = null;
let nodeName = null;
let heartbeatTimer = null;
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

      const attachment = template(withContext(withEscapedAttributes(event), nodeName));
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

// Not fatal: without a name the messages simply carry no node line.
async function refreshNodeName() {
  try {
    nodeName = (await docker.info()).Name || null;
  } catch (e) {
    console.error("Could not read the node name:", e.message);
  }
}

function writeHeartbeat() {
  try {
    fs.writeFileSync(HEARTBEAT_FILE, String(Date.now()));
  } catch (e) {
    console.error("Could not write the heartbeat file:", e.message);
  }
}

function startHeartbeat() {
  stopHeartbeat();
  writeHeartbeat();
  heartbeatTimer = setInterval(async () => {
    try {
      // An open stream is not proof on its own — a half-open socket still
      // looks connected from here. Ask the daemon before refreshing.
      await docker.ping();
      writeHeartbeat();
    } catch (e) {
      console.error("Docker did not answer, heartbeat not refreshed:", e.message);
    }
  }, HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function scheduleReconnect(reason) {
  if (shuttingDown || reconnectTimer) return;

  stopHeartbeat();
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
  if (EVENT_FILTERS) {
    options.filters = EVENT_FILTERS;
  }
  if (lastEventTime !== null) {
    options.since = lastEventTime;
  }

  stream = await docker.getEvents(options);
  await refreshNodeName();
  reconnectDelay = RECONNECT_MIN_MS;
  startHeartbeat();
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
  stopHeartbeat();
  if (stream) stream.destroy();
  try {
    fs.unlinkSync(HEARTBEAT_FILE);
  } catch (e) {
    // Nothing to clean up.
  }
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

function heartbeatAge() {
  try {
    const written = Number.parseInt(fs.readFileSync(HEARTBEAT_FILE, 'utf8').trim(), 10);
    return Number.isSafeInteger(written) ? Date.now() - written : null;
  } catch (e) {
    return null;
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

  // Reaching the daemon is not the same as still listening to it. The stream
  // can end while the daemon stays up, and that is the failure that used to
  // go unnoticed.
  const age = heartbeatAge();
  if (age === null) {
    console.error(`No heartbeat at ${HEARTBEAT_FILE}`);
    console.error("Not listening for docker events");
    process.exit(103);
  }
  if (age > HEARTBEAT_MAX_AGE_MS) {
    console.error(`Heartbeat is ${Math.round(age / 1000)}s old, expected at most ${HEARTBEAT_MAX_AGE_MS / 1000}s`);
    console.error("Not listening for docker events");
    process.exit(103);
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

function checkConfiguration() {
  const missing = ['TELEGRAM_NOTIFIER_BOT_TOKEN', 'TELEGRAM_NOTIFIER_CHAT_ID']
    .filter(name => !process.env[name] || process.env[name].trim() === '');

  if (missing.length > 0) {
    console.error(`Missing required configuration: ${missing.join(', ')}`);
    console.error('See https://github.com/luc-ass/docker-telegram-notifier#1-basic-setup');
    process.exit(100);
  }
}

function handleError(e) {
  console.error(e);
  telegram.sendError(e).catch(console.error);
}

// Only take over the process when run directly, so the tests can import the
// pure helpers below without starting a listener.
if (require.main === module) {
  checkConfiguration();

  if (process.argv.includes("healthcheck")) {
    healthcheck();
  } else {
    main().catch(handleError);
  }
}

module.exports = {
  envFlag,
  eventFilters,
  withEscapedAttributes,
  withContext,
  isNewEvent,
  // isNewEvent deliberately keeps its state across calls; the tests need a
  // way back to a clean slate.
  resetEventTracking() {
    lastEventTime = null;
    handledInLastSecond = new Set();
  }
};
