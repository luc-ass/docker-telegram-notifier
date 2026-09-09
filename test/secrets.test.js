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

// Setups that keep the token in the environment stay supported; they are
// pointed at the alternative once per start, and never told off for a setup
// that is already correct.
const { secretHint } = require('../app');

function withEnv(env, run) {
  const before = { ...process.env };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return run();
  } finally {
    process.env = before;
  }
}

test('a token in the environment is pointed at the file variant', () => {
  const hint = withEnv({
    TELEGRAM_NOTIFIER_BOT_TOKEN: '123:secret-token',
    TELEGRAM_NOTIFIER_BOT_TOKEN_FILE: undefined
  }, secretHint);

  assert.match(hint, /TELEGRAM_NOTIFIER_BOT_TOKEN_FILE/);
  // Whatever else the hint says, it must not carry the token into the log.
  assert.doesNotMatch(hint, /123:secret-token/);
});

test('a token handed over as a file draws no hint', () => {
  const hint = withEnv({
    TELEGRAM_NOTIFIER_BOT_TOKEN: '123:secret-token',
    TELEGRAM_NOTIFIER_BOT_TOKEN_FILE: '/run/secrets/telegram_bot_token'
  }, secretHint);

  assert.strictEqual(hint, null);
});

test('no hint when there is no token to talk about', () => {
  const hint = withEnv({
    TELEGRAM_NOTIFIER_BOT_TOKEN: undefined,
    TELEGRAM_NOTIFIER_BOT_TOKEN_FILE: undefined
  }, secretHint);

  assert.strictEqual(hint, null);
});

// The hint belongs to start-up alone. The healthcheck enters through the same
// file every 30 seconds, and a hint printed there would bury the log it is
// supposed to be read in.
function runApp(args) {
  return spawnSync(process.execPath, [path.join(__dirname, '..', 'app.js'), ...args], {
    env: {
      PATH: process.env.PATH,
      TELEGRAM_NOTIFIER_BOT_TOKEN: '123:secret-token',
      TELEGRAM_NOTIFIER_CHAT_ID: '-100',
      // Refused at once, so neither path waits on a daemon that isn't there.
      DOCKER_HOST: 'tcp://127.0.0.1:1'
    },
    encoding: 'utf8',
    timeout: 20000
  });
}

test('start-up prints the hint once', () => {
  const run = runApp([]);
  assert.match(run.stdout + run.stderr, /Note: TELEGRAM_NOTIFIER_BOT_TOKEN is set in the environment/);
});

test('the healthcheck stays quiet about it', () => {
  const run = runApp(['healthcheck']);
  const output = run.stdout + run.stderr;

  // It got far enough to have printed a hint, had one been there to print.
  assert.match(output, /Docker is unavailable/);
  assert.doesNotMatch(output, /Note: TELEGRAM_NOTIFIER_BOT_TOKEN/);
});
