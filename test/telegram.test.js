const test = require('node:test');
const assert = require('node:assert');

process.env.TELEGRAM_NOTIFIER_BOT_TOKEN = '000:test';
process.env.TELEGRAM_NOTIFIER_CHAT_ID = '-100test';
process.env.TELEGRAM_NOTIFIER_SEND_INTERVAL_MS = '0';
const TelegramClient = require('../telegram');

// Records what would have gone to Telegram instead of sending it.
function recording() {
  const client = new TelegramClient();
  const sent = [];
  client.telegram.sendMessage = async (chatId, text, options) => {
    sent.push({ chatId, text, options });
    return {};
  };
  return { client, sent };
}

test('a numeric thread id is passed through', async () => {
  const { client, sent } = recording();
  await client.send('x', { threadId: '42' });
  assert.strictEqual(sent[0].options.message_thread_id, 42);
});

test('surrounding whitespace in a thread id is tolerated', async () => {
  const { client, sent } = recording();
  await client.send('x', { threadId: '  42  ' });
  assert.strictEqual(sent[0].options.message_thread_id, 42);
});

test('an unusable thread id is dropped, not sent as NaN', async () => {
  const { client, sent } = recording();
  const errors = [];
  const original = console.error;
  console.error = (m) => errors.push(String(m));
  await client.send('x', { threadId: 'general' });
  console.error = original;

  assert.ok(!('message_thread_id' in sent[0].options));
  assert.strictEqual(sent[0].text, 'x', 'the message itself must still go out');
  assert.match(errors[0], /general/);
});

test('an explicitly empty thread id turns the global topic off', async () => {
  process.env.TELEGRAM_NOTIFIER_TOPIC_ID = '99';
  const { client, sent } = recording();
  await client.send('x', { threadId: '' });
  delete process.env.TELEGRAM_NOTIFIER_TOPIC_ID;
  assert.ok(!('message_thread_id' in sent[0].options));
});

test('is_topic_message is never sent — it is a response field', async () => {
  const { client, sent } = recording();
  await client.send('x', { threadId: '42' });
  assert.ok(!('is_topic_message' in sent[0].options));
});

test('the failed payload is escaped before it goes into the error message', async () => {
  const { client, sent } = recording();
  await client.sendError({
    response: { error_code: 400, description: 'Bad Request: message thread not found' },
    on: { method: 'sendMessage', payload: { text: '<b>web</b> started & running' } }
  });

  const body = sent[0].text;
  const payload = body.slice(body.indexOf('<pre>') + 5, body.indexOf('</pre>'));
  assert.ok(!payload.includes('<b>'), 'raw markup would break the error report');
  assert.match(payload, /&lt;b&gt;web&lt;\/b&gt;/);
  assert.match(payload, /&amp;/);
});

test('an error that did not come from Telegram is not labelled sendMessage', async () => {
  const { client, sent } = recording();
  await client.sendError(new Error('docker socket closed'));

  assert.match(sent[0].text, /\[Error\] 0 - docker socket closed/);
  assert.ok(!sent[0].text.includes('<pre>'), 'there is no payload to show');
  assert.ok(!sent[0].text.includes('undefined'));
});

test('error notifications stop after five in a window', async () => {
  const { client, sent } = recording();
  const original = console.error;
  console.error = () => {};
  for (let i = 0; i < 12; i++) await client.sendError(new Error('boom'));
  console.error = original;
  assert.strictEqual(sent.length, 5);
});

test('a rate limit is retried, honouring retry_after', async () => {
  const client = new TelegramClient();
  let calls = 0;
  client.telegram.sendMessage = async () => {
    if (++calls === 1) {
      const e = new Error('Too Many Requests');
      e.response = { parameters: { retry_after: 0 } };
      throw e;
    }
    return { ok: true };
  };

  const original = console.error;
  console.error = () => {};
  const result = await client.send('x');
  console.error = original;

  assert.strictEqual(calls, 2);
  assert.deepStrictEqual(result, { ok: true });
});

test('a failed send does not stop the ones behind it', async () => {
  const client = new TelegramClient();
  let calls = 0;
  client.telegram.sendMessage = async () => {
    if (++calls === 1) throw new Error('nope');
    return { ok: true };
  };

  await assert.rejects(() => client.send('first'));
  await client.send('second');
  assert.strictEqual(calls, 2);
});
