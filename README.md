# ⚠️ UNDER CONSTRUCTION - NOT PRODUCTION READY ⚠️

# Docker Telegram Notifier 'buildstatus-missing'

A Telegram integration to notify Docker events. This service notifies about container `start`, `stop`, `restart` events, and changes of Docker `healthcheck status`. If you wish you can add more event notifications in `templates.js` file.

## How to Run

1. [Set up a telegram bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot) and get the `Bot Token`. then add the bot to a group and make it admin and [extract the Chat ID](https://stackoverflow.com/a/32572159/882223).

2. Run a container:
```sh
# docker run
docker run -d --env TELEGRAM_NOTIFIER_BOT_TOKEN=token --env TELEGRAM_NOTIFIER_CHAT_ID=chat_id --volume /var/run/docker.sock:/var/run/docker.sock:ro lorcas/docker-telegram-notifier
```
```yml
# docker compose
version: "2.2"

services:
  notifier:
    image: lorcas/docker-telegram-notifier:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro # for local instance
      # - ./certs:/certs # for remote instance
    environment:
      # How to create bot: https://core.telegram.org/bots#3-how-do-i-create-a-bot
      # How to get chat id: https://stackoverflow.com/questions/32423837/telegram-bot-how-to-get-a-group-chat-id/32572159#32572159
      TELEGRAM_NOTIFIER_BOT_TOKEN:
      TELEGRAM_NOTIFIER_CHAT_ID:
      # optional args
      # ONLY_WHITELIST: true
      # DOCKER_HOST: tcp://example.com:2376 # http/https is detected by port number
      # DOCKER_CERT_PATH: /certs # should contain ca.pem, cert.pem, key.pem

#  example:
#    image: hello-world
#    labels:
#       telegram-notifier.monitor: true  # always monitor
#       telegram-notifier.monitor: false # never monitor
#       # no label = monitor only when not using whitelist
#    # example docker healthcheck
#    healthcheck:
#      test: curl -sS http://127.0.0.1:8545 || exit 1
#      interval: 30s
#      timeout: 10s
#      retries: 3
```

## Blacklist and Whitelist

You can suppress notifications from certain containers by adding a label `--label telegram-notifier.monitor=false` to them. If you want to receive notifications only from whitelisted containers, set `--env ONLY_WHITELIST=true` environment variable on the notifier instance, and `--label telegram-notifier.monitor=true` label on the containers you want to monitor.

## Remote docker instance

By default notifier connects to a local docker instance (don't forget to specify `--volume /var/run/docker.sock:/var/run/docker.sock:ro` for this case). But if you have monitoring and the service on the same host, you will not receive notifications if the host goes down. So I recommend to have monitoring separately.

Notifier accepts usual `DOCKER_HOST` and `DOCKER_CERT_PATH` environment variables to specify remote instance. For http endpoint you need to specify only `--env DOCKER_HOST=tcp://example.com:2375` (make sure to keep such instances behind the firewall). For https, you'll also need to mount a volume with https certificates that contains `ca.pem`, `cert.pem`, and `key.pem`: `--env DOCKER_HOST=tcp://example.com:2376 --env DOCKER_CERT_PATH=/certs --volume $(pwd):/certs`
Tutorial on how to generate docker certs can be found [here](https://docs.docker.com/engine/security/https/)


## Credits

This container is based off the [container by poma](https://hub.docker.com/r/poma/docker-telegram-notifier). My branch was created, beacause I wanted to run his container on `linux/arm64` and provide a way to keep his work alive and up to date.