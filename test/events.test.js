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
