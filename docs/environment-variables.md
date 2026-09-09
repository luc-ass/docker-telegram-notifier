# Environment variables

## Required

| Variable | Description |
| :--- | :--- |
| `TELEGRAM_NOTIFIER_BOT_TOKEN` | Token of the bot that sends the messages |
| `TELEGRAM_NOTIFIER_CHAT_ID` | Chat the messages go to |

Both accept a `_FILE` suffix instead, pointing at a file that holds the value.
See [Secrets](secrets.md).

## Routing

| Variable | Default | Description |
| :--- | :--- | :--- |
| `TELEGRAM_NOTIFIER_TOPIC_ID` | — | Forum topic to post into. Use either this or `THREAD_ID`, not both |
| `TELEGRAM_NOTIFIER_THREAD_ID` | — | Message thread to post into |

Individual containers can override both. See
[Chats, topics and threads](chats-and-topics.md).

## Filtering

| Variable | Default | Description |
| :--- | :--- | :--- |
| `ONLY_WHITELIST` | off | Report only containers labelled `telegram-notifier.monitor: true` |

The flag counts as off when unset, empty, `false`, `0`, `no` or `off` — every
other value turns it on. See [Filtering containers](filtering-containers.md).

## Docker connection

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DOCKER_HOST` | local socket | Remote daemon, e.g. `tcp://example.com:2376` |
| `DOCKER_CERT_PATH` | — | Directory holding `ca.pem`, `cert.pem` and `key.pem` for TLS |

See [Remote docker and proxies](remote-docker-and-proxy.md).

## Network

| Variable | Default | Description |
| :--- | :--- | :--- |
| `HTTPS_PROXY` | — | Proxy for the connection to Telegram. Lowercase `https_proxy` works too |

An unusable proxy URL stops the container with exit code 100.

## Tuning

| Variable | Default | Description |
| :--- | :--- | :--- |
| `TELEGRAM_NOTIFIER_SEND_INTERVAL_MS` | `1000` | Minimum gap between two messages |
| `TELEGRAM_NOTIFIER_HEARTBEAT_FILE` | `<tmpdir>/docker-telegram-notifier.heartbeat` | Where the healthcheck's liveness marker is written |

Telegram accepts roughly 20 messages per minute into one group, so sends are
spaced out rather than fired as fast as docker reports them. A backlog longer
than 200 messages is dropped instead of kept in memory. Lower the interval only
if you know the chat can take it.

The heartbeat file is refreshed every 30 seconds by asking the daemon for a
ping; the container's healthcheck fails once it is older than 90 seconds. This
catches a docker connection that has gone quiet without the process exiting.
Point the variable elsewhere if `/tmp` is read-only in your setup.
