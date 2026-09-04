const test = require('node:test');
const assert = require('node:assert');

process.env.TELEGRAM_NOTIFIER_BOT_TOKEN = '000:test';
process.env.TELEGRAM_NOTIFIER_CHAT_ID = '-100test';
const TelegramClient = require('../telegram');
const { HttpsProxyAgent } = require('https-proxy-agent');

// telegraf always supplies an agent of its own (a keep-alive https.Agent), so
// "no proxy" means that default is left in place rather than no agent at all.
const usesProxy = (client) => client.telegram.options.agent instanceof HttpsProxyAgent;

test('no proxy configured means no agent, and no crash', () => {
  // The whole point: HttpsProxyAgent throws on an empty value, so building it
  // unconditionally would take the container down for everyone.
  delete process.env.HTTPS_PROXY;
  delete process.env.https_proxy;

  const client = new TelegramClient();
  assert.strictEqual(usesProxy(client), false);
  assert.ok(client.telegram.options.agent, "telegraf's own default agent stays");
});

test('an empty HTTPS_PROXY is treated as unset', () => {
  process.env.HTTPS_PROXY = '';
  const client = new TelegramClient();
  assert.strictEqual(usesProxy(client), false);
  delete process.env.HTTPS_PROXY;
});

test('a configured proxy becomes an agent', () => {
  process.env.HTTPS_PROXY = 'http://proxy.example.com:8080';
  const client = new TelegramClient();

  assert.strictEqual(usesProxy(client), true);
  assert.strictEqual(client.telegram.options.agent.proxy.href, 'http://proxy.example.com:8080/');
  delete process.env.HTTPS_PROXY;
});

test('the lowercase spelling works too', () => {
  process.env.https_proxy = 'http://proxy.example.com:3128';
  const client = new TelegramClient();

  assert.strictEqual(usesProxy(client), true);
  assert.strictEqual(client.telegram.options.agent.proxy.port, '3128');
  delete process.env.https_proxy;
});
