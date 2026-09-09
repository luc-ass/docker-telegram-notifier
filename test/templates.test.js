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

const swarmEvent = (attributes) => ({
  node: 'node2',
  swarm: { service: 'web_server', slot: '3', name: 'web_server.3', stack: 'web' },
  Actor: { Attributes: { name: 'web_server.3.n31jwutl4l33kcuz20taem4p4', image: 'nginx:alpine', ...attributes } }
});

test('a swarm task is named by its service and slot, not its task id', () => {
  const message = templates.container_start(swarmEvent());
  assert.match(message, /<b>web_server\.3<\/b> started/);
  assert.doesNotMatch(message, /n31jwutl4l33kcuz20taem4p4/);
});

test('a swarm message names the node the task runs on', () => {
  assert.match(templates.container_start(swarmEvent()), /\nNode: node2$/);
  assert.match(templates['container_health_status: healthy'](swarmEvent()), /\nNode: node2$/);
  assert.match(templates.container_die(swarmEvent({ exitCode: '0' })), /\nNode: node2$/);
  assert.match(templates.container_die(swarmEvent({ exitCode: '137' })), /\nNode: node2$/);
  assert.match(templates.container_die(swarmEvent({ exitCode: '42' })), /\nNode: node2$/);
});

test('a single host is not named on every message', () => {
  // The node is known here, but without swarm the line says the same thing
  // every time.
  assert.doesNotMatch(templates.container_start({ node: 'srv1', ...event() }), /Node:/);
});

test('the digest swarm pins an image to is dropped', () => {
  const digest = '@sha256:72ba65eb42c10344912a84ff42408db7d34f2feb642204570ab8fc5ffd29f1d3';
  const message = templates.container_start(swarmEvent({ image: `nginx:alpine${digest}` }));

  assert.match(message, /<code>nginx:alpine<\/code>/);
});

test('a registry port is not mistaken for a tag', () => {
  const digest = '@sha256:72ba65eb42c10344912a84ff42408db7d34f2feb642204570ab8fc5ffd29f1d3';
  const tagged = templates.container_start(swarmEvent({ image: `registry:5000/nginx:alpine${digest}` }));
  assert.match(tagged, /<code>registry:5000\/nginx:alpine<\/code>/);

  // Nothing but the digest says which image this is, so it stays.
  const untagged = templates.container_start(swarmEvent({ image: `registry:5000/nginx${digest}` }));
  assert.match(untagged, /sha256:72ba65eb/);
});

test('an image pinned by digest alone keeps it', () => {
  const image = 'nginx@sha256:72ba65eb42c10344912a84ff42408db7d34f2feb642204570ab8fc5ffd29f1d3';
  assert.match(templates.container_start(swarmEvent({ image })), /sha256:72ba65eb/);
});
