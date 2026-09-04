const test = require('node:test');
const assert = require('node:assert');
const { escapeHtml } = require('../escape');

test('escapes the characters Telegram parses as markup', () => {
  assert.strictEqual(escapeHtml('<b>x</b>'), '&lt;b&gt;x&lt;/b&gt;');
  assert.strictEqual(escapeHtml('a & b'), 'a &amp; b');
});

test('escapes the ampersand first, so entities are not double-escaped wrongly', () => {
  assert.strictEqual(escapeHtml('&lt;'), '&amp;lt;');
});

test('leaves ordinary text alone', () => {
  assert.strictEqual(escapeHtml('nginx:1.27-alpine'), 'nginx:1.27-alpine');
  assert.strictEqual(escapeHtml('web_server-1'), 'web_server-1');
});

test('accepts values that are not strings', () => {
  assert.strictEqual(escapeHtml(137), '137');
  assert.strictEqual(escapeHtml(undefined), 'undefined');
});
