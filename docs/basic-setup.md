# Basic setup

## 1. Set up a Telegram bot

- [Create a Telegram bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot) and obtain the bot token
- Optionally add the bot to a group and allow it to post messages
- Extract the [chat ID](https://stackoverflow.com/a/32572159/882223)

## 2. Run the container

Using `docker-compose.yaml`:

```yaml
services:
  telegram-notifier:
    image: lorcas/docker-telegram-notifier:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro # for local instance
    environment:
      TELEGRAM_NOTIFIER_BOT_TOKEN: <bot_token>
      TELEGRAM_NOTIFIER_CHAT_ID: <chat_id>
```

Using `docker run`:

```sh
docker run -d \
  --env TELEGRAM_NOTIFIER_BOT_TOKEN=<bot_token> \
  --env TELEGRAM_NOTIFIER_CHAT_ID=<chat_id> \
  --volume /var/run/docker.sock:/var/run/docker.sock:ro \
  --hostname my_host \
  lorcas/docker-telegram-notifier
```

The `--hostname` shows up in the start-up message, which helps when several
hosts report into the same chat.

> [!WARNING]
> Mounting the docker socket read-only protects the socket file, not the API
> behind it. See [Securing the docker socket](securing-the-docker-socket.md).

## 3. Add a healthcheck to your containers (optional)

The notifier reports healthcheck transitions, but only for containers that
define one:

```yaml
services:
  example:
    image: hello-world
    healthcheck:
      test: ["CMD", "curl", "-sS", "http://127.0.0.1:8545", "||", "exit", "1"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## What you get

The notifier reports when a container starts, when it stops (including the
exit code and how long it ran) and when its healthcheck status changes. A
restart arrives as a stop followed by a start, because that is what docker
emits.

From here, see [Environment variables](environment-variables.md) and
[Container labels](container-labels.md) for the full set of knobs.
