const test = require('node:test');
const assert = require('node:assert');
const templates = require('../templates');

const event = (attributes) => ({ Actor: { Attributes: { name: 'web', image: 'nginx', ...attributes } } });

test('a start message names the container and the image', () => {
  const message = templates.container_start(event());
  assert.match(message, /<b>web<\/b> started/);
  assert.match(message, /<code>nginx<\/code>/);
});

test('exit code 0 is reported as a clean shutdown', () => {
  const message = templates.container_die(event({ exitCode: '0' }));
  assert.match(message, /Successful shutdown/);
  // The stop symbol, not the red circle reserved for failures.
  assert.match(message, /&#9209;/);
});

test('SIGTERM counts as a normal shutdown', () => {
  assert.match(templates.container_die(event({ exitCode: '143' })), /Graceful termination/);
});

test('a failure exit code is explained and marked', () => {
  const message = templates.container_die(event({ exitCode: '137' }));
  assert.match(message, /SIGKILL/);
  assert.match(message, /&#128308;/);
});

test('an unknown exit code still reports the number', () => {
  const message = templates.container_die(event({ exitCode: '42' }));
  assert.match(message, /Exit code: 42/);
  assert.match(message, /&#128308;/);
});

test('health status has a template for both directions', () => {
  assert.match(templates['container_health_status: healthy'](event()), /healthy/);
  assert.match(templates['container_health_status: unhealthy'](event()), /unhealthy!/);
});

test('the connection message carries the host details', () => {
  const message = templates.connection_message({
    hostname: 'srv1', version: '29.7.2', os: 'Debian', type: 'linux',
    architecture: 'x86_64', cpu: 8, memory: '7934 MB'
  });
  assert.match(message, /<b>srv1<\/b>/);
  assert.match(message, /docker v29\.7\.2/);
  assert.match(message, /8 Cores/);
});
