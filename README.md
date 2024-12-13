# Docker Telegram Notifier
# [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/luc-ass/docker-telegram-notifier/docker-image.yml?branch=main&style=for-the-badge)](https://github.com/luc-ass/docker-telegram-notifier/actions) [![Docker Pulls](https://img.shields.io/docker/pulls/lorcas/docker-telegram-notifier?logo=docker&style=for-the-badge)](https://hub.docker.com/r/lorcas/docker-telegram-notifier) [![Docker Image Version (latest semver)](https://img.shields.io/docker/v/lorcas/docker-telegram-notifier?logo=docker&style=for-the-badge)](https://github.com/luc-ass/docker-telegram-notifier/releases) [![Renovate](https://img.shields.io/badge/renovate-enabled-green?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjUgNSAzNzAgMzcwIj48Y2lyY2xlIGN4PSIxODkiIGN5PSIxOTAiIHI9IjE4NCIgZmlsbD0iI2ZlMiIvPjxwYXRoIGZpbGw9IiM4YmIiIGQ9Ik0yNTEgMjU2bC0zOC0zOGExNyAxNyAwIDAxMC0yNGw1Ni01NmMyLTIgMi02IDAtN2wtMjAtMjFhNSA1IDAgMDAtNyAwbC0xMyAxMi05LTggMTMtMTNhMTcgMTcgMCAwMTI0IDBsMjEgMjFjNyA3IDcgMTcgMCAyNGwtNTYgNTdhNSA1IDAgMDAwIDdsMzggMzh6Ii8+PHBhdGggZmlsbD0iI2Q1MSIgZD0iTTMwMCAyODhsLTggOGMtNCA0LTExIDQtMTYgMGwtNDYtNDZjLTUtNS01LTEyIDAtMTZsOC04YzQtNCAxMS00IDE1IDBsNDcgNDdjNCA0IDQgMTEgMCAxNXoiLz48cGF0aCBmaWxsPSIjYjMwIiBkPSJNMjg1IDI1OGw3IDdjNCA0IDQgMTEgMCAxNWwtOCA4Yy00IDQtMTEgNC0xNiAwbC02LTdjNCA1IDExIDUgMTUgMGw4LTdjNC01IDQtMTIgMC0xNnoiLz48cGF0aCBmaWxsPSIjYTMwIiBkPSJNMjkxIDI2NGw4IDhjNCA0IDQgMTEgMCAxNmwtOCA3Yy00IDUtMTEgNS0xNSAwbC05LThjNSA1IDEyIDUgMTYgMGw4LThjNC00IDQtMTEgMC0xNXoiLz48cGF0aCBmaWxsPSIjZTYyIiBkPSJNMjYwIDIzM2wtNC00Yy02LTYtMTctNi0yMyAwLTcgNy03IDE3IDAgMjRsNCA0Yy00LTUtNC0xMSAwLTE2bDgtOGM0LTQgMTEtNCAxNSAweiIvPjxwYXRoIGZpbGw9IiNiNDAiIGQ9Ik0yODQgMzA0Yy00IDAtOC0xLTExLTRsLTQ3LTQ3Yy02LTYtNi0xNiAwLTIybDgtOGM2LTYgMTYtNiAyMiAwbDQ3IDQ2YzYgNyA2IDE3IDAgMjNsLTggOGMtMyAzLTcgNC0xMSA0em0tMzktNzZjLTEgMC0zIDAtNCAybC04IDdjLTIgMy0yIDcgMCA5bDQ3IDQ3YTYgNiAwIDAwOSAwbDctOGMzLTIgMy02IDAtOWwtNDYtNDZjLTItMi0zLTItNS0yeiIvPjxwYXRoIGZpbGw9IiMxY2MiIGQ9Ik0xNTIgMTEzbDE4LTE4IDE4IDE4LTE4IDE4em0xLTM1bDE4LTE4IDE4IDE4LTE4IDE4em0tOTAgODlsMTgtMTggMTggMTgtMTggMTh6bTM1LTM2bDE4LTE4IDE4IDE4LTE4IDE4eiIvPjxwYXRoIGZpbGw9IiMxZGQiIGQ9Ik0xMzQgMTMxbDE4LTE4IDE4IDE4LTE4IDE4em0tMzUgMzZsMTgtMTggMTggMTgtMTggMTh6Ii8+PHBhdGggZmlsbD0iIzJiYiIgZD0iTTExNiAxNDlsMTgtMTggMTggMTgtMTggMTh6bTU0LTU0bDE4LTE4IDE4IDE4LTE4IDE4em0tODkgOTBsMTgtMTggMTggMTgtMTggMTh6bTEzOS04NWwyMyAyM2M0IDQgNCAxMSAwIDE2TDE0MiAyNDBjLTQgNC0xMSA0LTE1IDBsLTI0LTI0Yy00LTQtNC0xMSAwLTE1bDEwMS0xMDFjNS01IDEyLTUgMTYgMHoiLz48cGF0aCBmaWxsPSIjM2VlIiBkPSJNMTM0IDk1bDE4LTE4IDE4IDE4LTE4IDE4em0tNTQgMThsMTgtMTcgMTggMTctMTggMTh6bTU1LTUzbDE4LTE4IDE4IDE4LTE4IDE4em05MyA0OGwtOC04Yy00LTUtMTEtNS0xNiAwTDEwMyAyMDFjLTQgNC00IDExIDAgMTVsOCA4Yy00LTQtNC0xMSAwLTE1bDEwMS0xMDFjNS00IDEyLTQgMTYgMHoiLz48cGF0aCBmaWxsPSIjOWVlIiBkPSJNMjcgMTMxbDE4LTE4IDE4IDE4LTE4IDE4em01NC01M2wxOC0xOCAxOCAxOC0xOCAxOHoiLz48cGF0aCBmaWxsPSIjMGFhIiBkPSJNMjMwIDExMGwxMyAxM2M0IDQgNCAxMSAwIDE2TDE0MiAyNDBjLTQgNC0xMSA0LTE1IDBsLTEzLTEzYzQgNCAxMSA0IDE1IDBsMTAxLTEwMWM1LTUgNS0xMSAwLTE2eiIvPjxwYXRoIGZpbGw9IiMxYWIiIGQ9Ik0xMzQgMjQ4Yy00IDAtOC0yLTExLTVsLTIzLTIzYTE2IDE2IDAgMDEwLTIzTDIwMSA5NmExNiAxNiAwIDAxMjIgMGwyNCAyNGM2IDYgNiAxNiAwIDIyTDE0NiAyNDNjLTMgMy03IDUtMTIgNXptNzgtMTQ3bC00IDItMTAxIDEwMWE2IDYgMCAwMDAgOWwyMyAyM2E2IDYgMCAwMDkgMGwxMDEtMTAxYTYgNiAwIDAwMC05bC0yNC0yMy00LTJ6Ii8+PC9zdmc+)](https://renovatebot.com)


This Docker container provides a Telegram integration to notify you about Docker events. It can notify you when a container starts, stops (including details about exit codes), restarts, and when the healthcheck status of a Docker container changes. You have the flexibility to customize these notifications by modifying the `templates.js` file.

This fork of the project was created to address security vulnerabilities and add support for `linux/arm64` and `linux/arm/v7`.

If you encounter any issues, please feel free to contribute by fixing them and opening a [pull request](https://github.com/luc-ass/docker-telegram-notifier/pulls) or reporting a new [issue](https://github.com/luc-ass/docker-telegram-notifier/issues).

## 🐳 Run Docker Container

1. __Set up a Telegram bot:__ To get started, [create a Telegram bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot) and obtain the `Bot Token`. Optionally add the bot to a group and allow it to post messages. Finally, [extract the Chat ID](https://stackoverflow.com/a/32572159/882223).

2. __Run the container:__

   using `docker run`:
    ```sh
    docker run -d \
        --env TELEGRAM_NOTIFIER_BOT_TOKEN=token \
        --env TELEGRAM_NOTIFIER_CHAT_ID=chat_id \
        --env TELEGRAM_NOTIFIER_TOPIC_ID=topic_id \
        --volume /var/run/docker.sock:/var/run/docker.sock:ro \
        --hostname my_host \
        lorcas/docker-telegram-notifier
    ```

    using `docker-compose.yaml`
    ```yml
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
          # One of the following two can be used, but not both
          TELEGRAM_NOTIFIER_TOPIC_ID:
          TELEGRAM_NOTIFIER_THREAD_ID:
          # optional args
          # ONLY_WHITELIST: true
          # DOCKER_HOST: tcp://example.com:2376 # http/https is detected by port number
          # DOCKER_CERT_PATH: /certs # should contain ca.pem, cert.pem, key.pem
3. __Add a health-check to your container:__
    ```yaml
    example:
      image: hello-world
      labels:
        telegram-notifier.monitor: true  # always monitor
        telegram-notifier.monitor: false # never monitor
           # no label = monitor only when not using whitelist
        # example docker healthcheck
      healthcheck:
        test: curl -sS http://127.0.0.1:8545 || exit 1
        interval: 30s
        timeout: 10s
        retries: 3
    ```

## Notification messages customization

1. __Adapt the template:__ download and modify the message strings from [`templates.js`](./templates.js) according to your needs.

2. __Bind your customized file to the container:__

    using `docker run`:
    ```sh
    docker run -d \
        --env TELEGRAM_NOTIFIER_BOT_TOKEN=token \
        --env TELEGRAM_NOTIFIER_CHAT_ID=chat_id \
        --volume /var/run/docker.sock:/var/run/docker.sock:ro \
        --volume /my-template.js:/usr/src/app/templates.js:ro \
        --hostname my_host \
        lorcas/docker-telegram-notifier
    ```

    using `docker-compose.yaml`
    ```yml
    services:
      notifier:
        image: lorcas/docker-telegram-notifier:latest
        volumes:
          - /var/run/docker.sock:/var/run/docker.sock:ro
          # Bind customized file to /templates/* in the container:
          - ./my-template.js:/usr/src/app/templates.js:ro
        environment:
          # ...

#### Customizing message strings: supported variables

Here are some variables available to customize the notification messages:

| Variable | Description |
| -------- | ----------- |
| `${e.Actor.Attributes.name}` | Docker container Name |
| `${e.Actor.Attributes.container}` | Docker container ID |
| `${e.Actor.Attributes.docker.network.internal}` | Docker Network Internal |
| `${e.Actor.Attributes.healthcheck.status}` | Docker container Healthcheck Status |
| `${e.Actor.Attributes.image}` | Docker container Image used |
| `${e.Actor.Attributes.maintainer}` | Docker container Maintainer |
| `${e.Actor.Attributes.signal}` | Docker container Exit Signal |
| `${e.Actor.Attributes.exitCode` | Docker container Exit Code |

The following are only available if the container was started using `docker-compose.yaml`
| Variable | Description |
| -------- | ----------- |
| `${e.Actor.Attributes.com.docker.compose.project}` | Compose Project Name |
| `${e.Actor.Attributes.com.docker.compose.service}` | Compose Service Name |
| `${e.Actor.Attributes.com.docker.compose.version}` | Compose Version |
| `${e.Actor.Attributes.com.docker.compose.container-number}` | Compose container Number |

## Blacklist and Whitelist

You can disable notifications from specific containers by adding the label `--label telegram-notifier.monitor=false` to them.

Alternatively you can receive notifications only from whitelisted containers by setting `--env ONLY_WHITELIST=true` on the notifier instance, and `--label telegram-notifier.monitor=true` on the containers you want to monitor.

## Remote docker instance

By default notifier connects to a local docker instance (don't forget to specify `--volume /var/run/docker.sock:/var/run/docker.sock:ro` for this case). But if you have monitoring and the service on the same host, you will not receive notifications if the host goes down. So I recommend to have monitoring separately.

Notifier accepts usual `DOCKER_HOST` and `DOCKER_CERT_PATH` environment variables to specify remote instance. For http endpoint you need to specify only `--env DOCKER_HOST=tcp://example.com:2375` (make sure to keep such instances behind the firewall). For https, you'll also need to mount a volume with https certificates that contains `ca.pem`, `cert.pem`, and `key.pem`: `--env DOCKER_HOST=tcp://example.com:2376 --env DOCKER_CERT_PATH=/certs --volume $(pwd):/certs`
Tutorial on how to generate docker certs can be found [here](https://docs.docker.com/engine/security/https/)

## Container-Specific Notifications

You can configure different Telegram channels and threads/topics for specific containers using Docker labels:

```yaml
services:
  example:
    image: hello-world
    labels:
      # Monitor control
      telegram-notifier.monitor: true
      
      # Channel override (optional)
      telegram-notifier.chat-id: "-100123456789"
      
      # Thread/Topic override (optional - use only one)
      telegram-notifier.topic-id: "12345"
      telegram-notifier.thread-id: "12345"
```

If these labels are not specified, the container will use the global settings from the notifier's environment variables.

## Credits

This container is based on the [container by poma](https://hub.docker.com/r/poma/docker-telegram-notifier), originally an idea of [arefaslani](https://github.com/arefaslani).
