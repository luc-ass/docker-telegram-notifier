const test = require('node:test');
const assert = require('node:assert');

process.env.TELEGRAM_NOTIFIER_BOT_TOKEN = '000:test';
process.env.TELEGRAM_NOTIFIER_CHAT_ID = '-100test';
const app = require('../app');

test('envFlag treats the string "false" as off', () => {
  // The bug this replaced: any non-empty string counted as on, so
  // ONLY_WHITELIST=false switched whitelist mode on.
  assert.strictEqual(app.envFlag('false'), false);
  assert.strictEqual(app.envFlag('FALSE'), false);
  assert.strictEqual(app.envFlag(' false '), false);
  assert.strictEqual(app.envFlag('0'), false);
  assert.strictEqual(app.envFlag('no'), false);
  assert.strictEqual(app.envFlag('off'), false);
  assert.strictEqual(app.envFlag(''), false);
  assert.strictEqual(app.envFlag(undefined), false);
});

test('envFlag treats anything else as on', () => {
  assert.strictEqual(app.envFlag('true'), true);
  assert.strictEqual(app.envFlag('1'), true);
  assert.strictEqual(app.envFlag('yes'), true);
});

test('the event filter is derived from the template names', () => {
  const filters = app.eventFilters();
  assert.deepStrictEqual(filters.type, ['container']);
  assert.deepStrictEqual(filters.event.sort(), ['die', 'health_status', 'start']);
});

test('the event filter leaves out connection_message', () => {
  assert.ok(!app.eventFilters().type.includes('connection'));
});

test('attributes are escaped before a template sees them', () => {
  const event = {
    Type: 'container',
    Action: 'start',
    Actor: { ID: 'abc', Attributes: { name: '<b>x</b>', info: 'a & b' } }
  };
  const escaped = app.withEscapedAttributes(event);

  assert.strictEqual(escaped.Actor.Attributes.name, '&lt;b&gt;x&lt;/b&gt;');
  assert.strictEqual(escaped.Actor.Attributes.info, 'a &amp; b');
  // The original must not be touched; the label checks read it unescaped.
  assert.strictEqual(event.Actor.Attributes.name, '<b>x</b>');
  assert.strictEqual(escaped.Actor.ID, 'abc');
});

test('an event without an actor passes through untouched', () => {
  const event = { Type: 'container', Action: 'start' };
  assert.strictEqual(app.withEscapedAttributes(event), event);
});

test('a replayed event is recognised after a reconnect', () => {
  app.resetEventTracking();
  const first = { time: 100, timeNano: 100_000_000_100, Type: 'container', Action: 'start', Actor: { ID: 'a' } };
  const second = { time: 100, timeNano: 100_000_000_200, Type: 'container', Action: 'die', Actor: { ID: 'a' } };

  assert.strictEqual(app.isNewEvent(first), true);
  assert.strictEqual(app.isNewEvent(second), true);
  // `since` is inclusive, so a reconnect delivers both of them again.
  assert.strictEqual(app.isNewEvent(first), false);
  assert.strictEqual(app.isNewEvent(second), false);
});

test('a later event is still accepted after a replay', () => {
  app.resetEventTracking();
  app.isNewEvent({ time: 100, timeNano: 1, Type: 'container', Action: 'start', Actor: { ID: 'a' } });
  assert.strictEqual(
    app.isNewEvent({ time: 101, timeNano: 2, Type: 'container', Action: 'start', Actor: { ID: 'b' } }),
    true
  );
});

test('two different containers in the same second are both new', () => {
  app.resetEventTracking();
  const at = 500;
  assert.strictEqual(app.isNewEvent({ time: at, timeNano: 1, Type: 'container', Action: 'start', Actor: { ID: 'a' } }), true);
  assert.strictEqual(app.isNewEvent({ time: at, timeNano: 2, Type: 'container', Action: 'start', Actor: { ID: 'b' } }), true);
});

test('an event older than the marker is dropped', () => {
  app.resetEventTracking();
  app.isNewEvent({ time: 200, timeNano: 1, Type: 'container', Action: 'start', Actor: { ID: 'a' } });
  assert.strictEqual(
    app.isNewEvent({ time: 199, timeNano: 0, Type: 'container', Action: 'start', Actor: { ID: 'a' } }),
    false
  );
});

// A replicated swarm task, as it arrives on the event stream.
const swarmEvent = (attributes) => ({
  Type: 'container',
  Action: 'start',
  Actor: {
    ID: 'abc',
    Attributes: {
      name: 'web_server.3.n31jwutl4l33kcuz20taem4p4',
      image: 'nginx:alpine',
      'com.docker.swarm.service.name': 'web_server',
      'com.docker.swarm.task.name': 'web_server.3.n31jwutl4l33kcuz20taem4p4',
      'com.docker.swarm.node.id': 'p8x1qk2m',
      'com.docker.stack.namespace': 'web',
      ...attributes
    }
  }
});

test('a swarm task is reduced to its service and slot', () => {
  const context = app.withContext(swarmEvent(), 'node2').swarm;

  assert.strictEqual(context.name, 'web_server.3');
  assert.strictEqual(context.service, 'web_server');
  assert.strictEqual(context.slot, '3');
  assert.strictEqual(context.stack, 'web');
  assert.strictEqual(context.nodeId, 'p8x1qk2m');
});

test('the node is the daemon we listen to, not a label', () => {
  assert.strictEqual(app.withContext(swarmEvent(), 'node2').node, 'node2');
  // Its id is no substitute for a name, so no name means no node.
  assert.strictEqual(app.withContext(swarmEvent(), null).node, undefined);
});

test('a node name is escaped like every other value in a message', () => {
  assert.strictEqual(app.withContext(swarmEvent(), 'a<b>').node, 'a&lt;b&gt;');
});

test('a global service has no slot to report', () => {
  // Where a replicated service puts its slot, a global one puts the node id.
  const event = swarmEvent({
    'com.docker.swarm.task.name': 'web_server.p8x1qk2m.n31jwutl4l33kcuz20taem4p4'
  });
  const context = app.withContext(event, 'node2').swarm;

  assert.strictEqual(context.slot, undefined);
  assert.strictEqual(context.name, 'web_server');
});

test('a service started outside a stack has no namespace', () => {
  const event = swarmEvent({ 'com.docker.stack.namespace': undefined });
  assert.strictEqual(app.withContext(event, 'node2').swarm.stack, undefined);
});

test('a task name that does not match its service is not guessed at', () => {
  const event = swarmEvent({ 'com.docker.swarm.task.name': 'something.else.1' });
  assert.strictEqual(app.withContext(event, 'node2').swarm.name, 'web_server');
});

test('an event without swarm labels gains no swarm context', () => {
  const event = { Type: 'container', Action: 'start', Actor: { ID: 'a', Attributes: { name: 'kimai' } } };
  const context = app.withContext(event, 'node2');

  assert.strictEqual(context.swarm, undefined);
  // The node is still offered, so a custom template can name it anywhere.
  assert.strictEqual(context.node, 'node2');
});

test('an event without an actor survives the context lookup', () => {
  const event = { Type: 'container', Action: 'start' };
  assert.strictEqual(app.withContext(event, null), event);
  assert.strictEqual(app.withContext(event, 'node2').swarm, undefined);
});
