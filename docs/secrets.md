# Secrets

Environment variables are readable by anyone who can run `docker inspect` on
the container — a wider circle than it looks, given this container is usually
the one holding the docker socket. To keep the bot token out of them, append
`_FILE` to the variable name and point it at a file:

```yaml
services:
  telegram-notifier:
    image: lorcas/docker-telegram-notifier:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      TELEGRAM_NOTIFIER_BOT_TOKEN_FILE: /run/secrets/telegram_bot_token
      TELEGRAM_NOTIFIER_CHAT_ID: <chat_id>
    secrets:
      - telegram_bot_token

secrets:
  telegram_bot_token:
    file: ./telegram_bot_token.txt
```

`TELEGRAM_NOTIFIER_CHAT_ID_FILE` works the same way, and `_FILE` wins over the
plain variable if both are set. A trailing newline in the file is ignored.

If the file cannot be read, the container stops immediately with exit code 100
and names the file it tried to open.
