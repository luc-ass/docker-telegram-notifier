const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
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

// loadFileSettings ends the process rather than throwing, so that a
// misconfigured secret stops the container instead of letting it run on with
// half a configuration. Testing that means running it in a child.
function runWith(env) {
  const module = path.join(__dirname, '..', 'secrets.js');
  return spawnSync(process.execPath, [
    '-e', `require(${JSON.stringify(module)}).loadFileSettings(['DTN_TEST_TOKEN'])`
  ], { env: { ...process.env, ...env }, encoding: 'utf8' });
}

test('an empty file is reported as such, not as a missing variable', () => {
  const file = path.join(os.tmpdir(), `dtn-empty-${process.pid}`);
  fs.writeFileSync(file, '\n');

  const run = runWith({ DTN_TEST_TOKEN_FILE: file });

  assert.strictEqual(run.status, 100);
  assert.match(run.stderr, /is empty/);
  assert.match(run.stderr, new RegExp(file));
  fs.unlinkSync(file);
});

test('an unreadable file stops the process and names the path', () => {
  const file = path.join(os.tmpdir(), `dtn-absent-${process.pid}`);

  const run = runWith({ DTN_TEST_TOKEN_FILE: file });

  assert.strictEqual(run.status, 100);
  assert.match(run.stderr, new RegExp(`Could not read DTN_TEST_TOKEN_FILE at ${file}`));
});
