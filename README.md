# Docker Telegram Notifier

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/luc-ass/docker-telegram-notifier/docker-image.yml?branch=main&style=for-the-badge)](https://github.com/luc-ass/docker-telegram-notifier/actions) [![Docker Pulls](https://img.shields.io/docker/pulls/lorcas/docker-telegram-notifier?logo=docker&style=for-the-badge)](https://hub.docker.com/r/lorcas/docker-telegram-notifier) [![Docker Image Version (latest semver)](https://img.shields.io/docker/v/lorcas/docker-telegram-notifier?logo=docker&style=for-the-badge)](https://github.com/luc-ass/docker-telegram-notifier/releases) [![Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fluc-ass%2Fdocker-telegram-notifier%2Fbadges%2Fcoverage.json&style=for-the-badge)](https://github.com/luc-ass/docker-telegram-notifier/actions/workflows/test.yml)

Get a Telegram message when a docker container starts, stops or changes its
healthcheck status. Stop notifications carry the exit code and how long the
container ran; a restart arrives as a stop followed by a start, because that is
what docker emits. Every message text is customisable.

Runs on `linux/amd64`, `linux/arm64` and `linux/arm/v7`.

## Quick start

[Create a Telegram bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot),
grab its token and your [chat ID](https://stackoverflow.com/a/32572159/882223),
then:

```yaml
services:
  telegram-notifier:
    image: lorcas/docker-telegram-notifier:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      TELEGRAM_NOTIFIER_BOT_TOKEN: <bot_token>
      TELEGRAM_NOTIFIER_CHAT_ID: <chat_id>
```

That's it — every container on the host is reported from now on.

## Documentation

| Page | What it covers |
| :--- | :--- |
| [Basic setup](docs/basic-setup.md) | Create the bot, run the container, add a healthcheck |
| [Environment variables](docs/environment-variables.md) | Every variable the notifier reads |
| [Container labels](docs/container-labels.md) | Every label the notifier reads |
| [Filtering containers](docs/filtering-containers.md) | Blacklisting and whitelisting |
| [Chats, topics and threads](docs/chats-and-topics.md) | Global routing and per-container overrides |
| [Remote docker and proxies](docs/remote-docker-and-proxy.md) | `DOCKER_HOST`, TLS certificates, outbound proxy |
| [Secrets](docs/secrets.md) | Keeping the bot token out of the environment |
| [Custom message templates](docs/custom-templates.md) | Rewriting the notification texts |
| [Securing the docker socket](docs/securing-the-docker-socket.md) | Why `:ro` is not enough, and what to do instead |

> [!WARNING]
> Mounting the docker socket read-only protects the socket file, not the API
> behind it — anything that reaches it can take over the host. See
> [Securing the docker socket](docs/securing-the-docker-socket.md) for the
> socket-proxy setup.

## Contributing

Found a bug or missing a feature? Open an
[issue](https://github.com/luc-ass/docker-telegram-notifier/issues) or a
[pull request](https://github.com/luc-ass/docker-telegram-notifier/pulls).
Security reports go through [SECURITY.md](SECURITY.md).

## Notes

The image is built on `node:22-slim` rather than `node:lts-slim`. Node 24
dropped support for 32-bit ARM, so tracking the `lts` tag would silently drop
`linux/arm/v7`. Node 22 receives security support until April 2027;
`linux/arm/v7` support will be reconsidered before then.

## Credits

Based on the [container by
poma](https://hub.docker.com/r/poma/docker-telegram-notifier), originally an
idea of [arefaslani](https://github.com/arefaslani). Licensed under
[Apache 2.0](LICENSE).
