const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadFileSettings } = require('../secrets');

test('a value handed over as a file replaces the variable', () => {
  const file = path.join(os.tmpdir(), `dtn-secret-${process.pid}`);
  fs.writeFileSync(file, '  123:secret-token\n');

  process.env.DTN_TEST_TOKEN = 'from-environment';
  process.env.DTN_TEST_TOKEN_FILE = file;
  loadFileSettings(['DTN_TEST_TOKEN']);

  // Trailing newlines are what trips people up when they echo into a file.
  assert.strictEqual(process.env.DTN_TEST_TOKEN, '123:secret-token');
  fs.unlinkSync(file);
  delete process.env.DTN_TEST_TOKEN;
  delete process.env.DTN_TEST_TOKEN_FILE;
});

test('without the _FILE variant the environment is left alone', () => {
  process.env.DTN_TEST_PLAIN = 'unchanged';
  loadFileSettings(['DTN_TEST_PLAIN']);
  assert.strictEqual(process.env.DTN_TEST_PLAIN, 'unchanged');
  delete process.env.DTN_TEST_PLAIN;
});

test('a name that is set nowhere stays unset', () => {
  loadFileSettings(['DTN_TEST_ABSENT']);
  assert.strictEqual(process.env.DTN_TEST_ABSENT, undefined);
});
