<!-- omit in toc -->
# Docker Telegram Notifier
<!-- omit in toc -->
# [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/luc-ass/docker-telegram-notifier/docker-image.yml?branch=main&style=for-the-badge)](https://github.com/luc-ass/docker-telegram-notifier/actions) [![Docker Pulls](https://img.shields.io/docker/pulls/lorcas/docker-telegram-notifier?logo=docker&style=for-the-badge)](https://hub.docker.com/r/lorcas/docker-telegram-notifier) [![Docker Image Version (latest semver)](https://img.shields.io/docker/v/lorcas/docker-telegram-notifier?logo=docker&style=for-the-badge)](https://github.com/luc-ass/docker-telegram-notifier/releases) [![Renovate](https://img.shields.io/badge/renovate-enabled-green?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjUgNSAzNzAgMzcwIj48Y2lyY2xlIGN4PSIxODkiIGN5PSIxOTAiIHI9IjE4NCIgZmlsbD0iI2ZlMiIvPjxwYXRoIGZpbGw9IiM4YmIiIGQ9Ik0yNTEgMjU2bC0zOC0zOGExNyAxNyAwIDAxMC0yNGw1Ni01NmMyLTIgMi02IDAtN2wtMjAtMjFhNSA1IDAgMDAtNyAwbC0xMyAxMi05LTggMTMtMTNhMTcgMTcgMCAwMTI0IDBsMjEgMjFjNyA3IDcgMTcgMCAyNGwtNTYgNTdhNSA1IDAgMDAwIDdsMzggMzh6Ii8+PHBhdGggZmlsbD0iI2Q1MSIgZD0iTTMwMCAyODhsLTggOGMtNCA0LTExIDQtMTYgMGwtNDYtNDZjLTUtNS01LTEyIDAtMTZsOC04YzQtNCAxMS00IDE1IDBsNDcgNDdjNCA0IDQgMTEgMCAxNXoiLz48cGF0aCBmaWxsPSIjYjMwIiBkPSJNMjg1IDI1OGw3IDdjNCA0IDQgMTEgMCAxNWwtOCA4Yy00IDQtMTEgNC0xNiAwbC02LTdjNCA1IDExIDUgMTUgMGw4LTdjNC01IDQtMTIgMC0xNnoiLz48cGF0aCBmaWxsPSIjYTMwIiBkPSJNMjkxIDI2NGw4IDhjNCA0IDQgMTEgMCAxNmwtOCA3Yy00IDUtMTEgNS0xNSAwbC05LThjNSA1IDEyIDUgMTYgMGw4LThjNC00IDQtMTEgMC0xNXoiLz48cGF0aCBmaWxsPSIjZTYyIiBkPSJNMjYwIDIzM2wtNC00Yy02LTYtMTctNi0yMyAwLTcgNy03IDE3IDAgMjRsNCA0Yy00LTUtNC0xMSAwLTE2bDgtOGM0LTQgMTEtNCAxNSAweiIvPjxwYXRoIGZpbGw9IiNiNDAiIGQ9Ik0yODQgMzA0Yy00IDAtOC0xLTExLTRsLTQ3LTQ3Yy02LTYtNi0xNiAwLTIybDgtOGM2LTYgMTYtNiAyMiAwbDQ3IDQ2YzYgNyA2IDE3IDAgMjNsLTggOGMtMyAzLTcgNC0xMSA0em0tMzktNzZjLTEgMC0zIDAtNCAybC04IDdjLTIgMy0yIDcgMCA5bDQ3IDQ3YTYgNiAwIDAwOSAwbDctOGMzLTIgMy02IDAtOWwtNDYtNDZjLTItMi0zLTItNS0yeiIvPjxwYXRoIGZpbGw9IiMxY2MiIGQ9Ik0xNTIgMTEzbDE4LTE4IDE4IDE4LTE4IDE4em0xLTM1bDE4LTE4IDE4IDE4LTE4IDE4em0tOTAgODlsMTgtMTggMTggMTgtMTggMTh6bTM1LTM2bDE4LTE4IDE4IDE4LTE4IDE4eiIvPjxwYXRoIGZpbGw9IiMxZGQiIGQ9Ik0xMzQgMTMxbDE4LTE4IDE4IDE4LTE4IDE4em0tMzUgMzZsMTgtMTggMTggMTgtMTggMTh6Ii8+PHBhdGggZmlsbD0iIzJiYiIgZD0iTTExNiAxNDlsMTgtMTggMTggMTgtMTggMTh6bTU0LTU0bDE4LTE4IDE4IDE4LTE4IDE4em0tODkgOTBsMTgtMTggMTggMTgtMTggMTh6bTEzOS04NWwyMyAyM2M0IDQgNCAxMSAwIDE2TDE0MiAyNDBjLTQgNC0xMSA0LTE1IDBsLTI0LTI0Yy00LTQtNC0xMSAwLTE1bDEwMS0xMDFjNS01IDEyLTUgMTYgMHoiLz48cGF0aCBmaWxsPSIjM2VlIiBkPSJNMTM0IDk1bDE4LTE4IDE4IDE4LTE4IDE4em0tNTQgMThsMTgtMTcgMTggMTctMTggMTh6bTU1LTUzbDE4LTE4IDE4IDE4LTE4IDE4em05MyA0OGwtOC04Yy00LTUtMTEtNS0xNiAwTDEwMyAyMDFjLTQgNC00IDExIDAgMTVsOCA4Yy00LTQtNC0xMSAwLTE1bDEwMS0xMDFjNS00IDEyLTQgMTYgMHoiLz48cGF0aCBmaWxsPSIjOWVlIiBkPSJNMjcgMTMxbDE4LTE4IDE4IDE4LTE4IDE4em01NC01M2wxOC0xOCAxOCAxOC0xOCAxOHoiLz48cGF0aCBmaWxsPSIjMGFhIiBkPSJNMjMwIDExMGwxMyAxM2M0IDQgNCAxMSAwIDE2TDE0MiAyNDBjLTQgNC0xMSA0LTE1IDBsLTEzLTEzYzQgNCAxMSA0IDE1IDBsMTAxLTEwMWM1LTUgNS0xMSAwLTE2eiIvPjxwYXRoIGZpbGw9IiMxYWIiIGQ9Ik0xMzQgMjQ4Yy00IDAtOC0yLTExLTVsLTIzLTIzYTE2IDE2IDAgMDEwLTIzTDIwMSA5NmExNiAxNiAwIDAxMjIgMGwyNCAyNGM2IDYgNiAxNiAwIDIyTDE0NiAyNDNjLTMgMy03IDUtMTIgNXptNzgtMTQ3bC00IDItMTAxIDEwMWE2IDYgMCAwMDAgOWwyMyAyM2E2IDYgMCAwMDkgMGwxMDEtMTAxYTYgNiAwIDAwMC05bC0yNC0yMy00LTJ6Ii8+PC9zdmc+)](https://renovatebot.com)


This Docker container provides a Telegram integration to notify you about Docker events. It can notify you when a container starts, stops (including details about exit codes), restarts, and when the healthcheck status of a Docker container changes. You have the flexibility to customize these notifications by [modifying the `templates.js` file](#3-notification-messages-customization).

This fork was created to address security vulnerabilities and add support for 
- `linux/arm64` and
- `linux/arm/v7` in addition to
- `linux/amd64`.

If you encounter any issues, please feel free to contribute by fixing them and opening a [pull request](https://github.com/luc-ass/docker-telegram-notifier/pulls) or reporting a new [issue](https://github.com/luc-ass/docker-telegram-notifier/issues).

<!-- omit in toc -->
## Table of contents
- [1. Basic setup](#1-basic-setup)
- [2. Advanced setup](#2-advanced-setup)
  - [2.1 Topics and Threads](#21-topics-and-threads)
  - [2.2 Blacklisting](#22-blacklisting)
  - [2.3 Whitelisting](#23-whitelisting)
  - [2.4 Per container notifications](#24-per-container-notifications)
  - [2.5 Remote docker instance](#25-remote-docker-instance)
- [3. Notification messages customization](#3-notification-messages-customization)
  - [3.1 Create a custom template](#31-create-a-custom-template)
  - [3.2 Customizing message strings](#32-customizing-message-strings)
  - [3.2.1 Default docker event variables](#321-default-docker-event-variables)
  - [3.2.2 Docker Compose variables](#322-docker-compose-variables)
  - [3.2.3 Custom container information in Telegram notifications](#323-custom-container-information-in-telegram-notifications)
- [4. Proxy](#4-proxy)
- [Credits](#credits)


## 1. Basic setup  

1. **Set up a Telegram bot**

    - [create a Telegram bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot) and obtain the Bot Token
    - optionally add the bot to a group and allow it to post messages
    - extract the [Chat ID](https://stackoverflow.com/a/32572159/882223)

2. **Run the container**

    using `docker-compose.yaml`
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

    using `docker run`
    ```sh
    docker run -d \
      --env TELEGRAM_NOTIFIER_BOT_TOKEN=<bot_token> \
      --env TELEGRAM_NOTIFIER_CHAT_ID=<chat_id> \
      --volume /var/run/docker.sock:/var/run/docker.sock:ro \
      --hostname my_host \
      lorcas/docker-telegram-notifier
    ```

3. **Add a healthcheck to your container** (optional)
   
    ```yaml
    example:
      image: hello-world
      healthcheck:
        test: ["CMD", "curl", "-sS", "http://127.0.0.1:8545", "||", "exit", "1"]
        interval: 30s
        timeout: 10s
        retries: 3
    ```

This setup will start the container and notify you about Docker events. For more advanced configuration, see the [Advanced setup](#2-advanced-setup) section.


## 2. Advanced setup

The following options are available to customize the behavior of the notifier. Examples are provided for `docker-compose.yaml` but are also applicable to `docker run`. Only the changes are shown, make sure to include the rest from the [Basic setup](#1-basic-setup) section.

### 2.1 Topics and Threads

Use `TELEGRAM_NOTIFIER_TOPIC_ID` or `TELEGRAM_NOTIFIER_THREAD_ID` for specific topics/threads:

```yaml
services:
  telegram-notifier:
    environment:
      TELEGRAM_NOTIFIER_TOPIC_ID: <topic_id> # optional use only one
      TELEGRAM_NOTIFIER_THREAD_ID: <thread_id> # optional use only one
```

### 2.2 Blacklisting
Disable notifications for specific containers:


```yaml
services:
  example:
    image: hello-world
    labels:
      telegram-notifier.monitor: false
```

<details>
<summary>
docker run
</summary>

```sh
docker run -d --label telegram-notifier.monitor=false hello-world
```
</details>


### 2.3 Whitelisting

Receive notifications only from whitelisted containers by setting `ONLY_WHITELIST=true` and labeling desired containers:

```yaml
services:
  telegram-notifier:
    environment:
      ONLY_WHITELIST: true

  example:
    image: hello-world
    labels:
      telegram-notifier.monitor: true
```
<details>
<summary>
docker run
</summary>

```sh
docker run -d --label telegram-notifier.monitor=true hello-world
```
</details>

### 2.4 Per container notifications

Configure different channels/threads per container:

```yaml
services:
  example:
    image: hello-world
    labels:
      # Channel override (optional)
      telegram-notifier.chat-id: "-100123456789"
      # Thread/Topic override (optional - use only one)
      telegram-notifier.topic-id: "12345"
      telegram-notifier.thread-id: "12345"
```

<details>
<summary>
docker run
</summary>

```sh
docker run -d --label telegram-notifier.chat-id=-100123456789 --label telegram-notifier.topic-id=12345 hello-world
```
</details>


### 2.5 Remote docker instance

By default notifier connects to a local docker instance (don't forget to specify `--volume /var/run/docker.sock:/var/run/docker.sock:ro` for this case). But if you have monitoring and the service on the same host, you will not receive notifications if the host goes down. So I recommend to have monitoring separately.

Notifier accepts usual `DOCKER_HOST` and `DOCKER_CERT_PATH` environment variables to specify remote instance. For http endpoint you need to specify only `--env DOCKER_HOST=tcp://example.com:2375` (make sure to keep such instances behind the firewall). For https, you'll also need to mount a volume with https certificates that contains `ca.pem`, `cert.pem`, and `key.pem`: `--env DOCKER_HOST=tcp://example.com:2376 --env DOCKER_CERT_PATH=/certs --volume $(pwd):/certs`.
A tutorial on how to generate docker certs can be found [here](https://docs.docker.com/engine/security/https/).

```yaml
services:
  telegram-notifier:
    volumes:
      # disable for remote ONLY monitoring
      # - /var/run/docker.sock:/var/run/docker.sock:ro 
      - ./certs:/certs # for remote instance
    environment:
      DOCKER_HOST: tcp://example.com:2376 # http/https is detected by port number
      DOCKER_CERT_PATH: /certs # should contain ca.pem, cert.pem, key.pem
```


## 3. Notification messages customization

### 3.1 Create a custom template

1. __Adapt the template:__ download and modify the message strings from [`templates.js`](./templates.js) according to your needs.

2. __Bind your customized file to the container:__

    using `docker-compose.yaml`
    ```yaml
    services:
      notifier:
        volumes:
          # Bind customized file to templates.js in the container:
          - ./my-template.js:/usr/src/app/templates.js:ro
        environment:
          # ...
    ```

    <details>
    <summary>
    docker run
    </summary>

    ```sh
    docker run -d \
        --env TELEGRAM_NOTIFIER_BOT_TOKEN=token \
        --env TELEGRAM_NOTIFIER_CHAT_ID=chat_id \
        --volume /var/run/docker.sock:/var/run/docker.sock:ro \
        --volume ./my-template.js:/usr/src/app/templates.js:ro \
        --hostname my_host \
        lorcas/docker-telegram-notifier
    ```
    </details>

### 3.2 Customizing message strings

### 3.2.1 Default docker event variables

Here are some variables available to customize the notification messages.

| Variable | Description |
| :-------- | :----------- |
| `${e.Actor.Attributes.name}` | Container name |
| `${e.Actor.Attributes.container}` | Container ID |
| `${e.Actor.Attributes.image}` | Container image used |
| `${e.Actor.Attirbutes.exitCode}` | Container exit code |

Example:
```js
container_start: e =>
    `&#9989; Container Started\n` +
    `Name: <b>${e.Actor.Attributes.name}</b>\n` +
    `Image: <code>${e.Actor.Attributes.image}</code>\n` +
    `ID: <code>${e.Actor.Attributes.container}</code>`
```
```
🟢 Container Started
Name: my-container
Image: nginx:latest
ID: abc123def456
```


### 3.2.2 Docker Compose variables

The following variables are only available if the container was started using `docker compose`
| Variable | Description |
| :-------- | :----------- |
| `${e.Actor.Attributes['com.docker.compose.container-number']}` | Compose container Number |
| `${e.Actor.Attributes['com.docker.compose.project']}` | Compose Project Name |
| `${e.Actor.Attributes['com.docker.compose.service']}` | Compose Service Name |
| `${e.Actor.Attributes['com.docker.compose.version']}` | Compose Version |

Example:
```js
container_start: e =>
    `&#9989; Container Started\n` +
    `Project: <b>${e.Actor.Attributes['com.docker.compose.project']}</b>\n` +
    `Service: <b>${e.Actor.Attributes['com.docker.compose.service']}</b> (#${e.Actor.Attributes['com.docker.compose.container-number']})\n` +
    `Image: <code>${e.Actor.Attributes.image}</code>\n` +
    `Compose Version: <code>${e.Actor.Attributes['com.docker.compose.version']}<code>`
```
```
🟢 Container Started
Project: myproject
Service: webserver (#1)
Image: nginx:latest
Compose Version: 2.17.2
```

### 3.2.3 Custom container information in Telegram notifications

Leverage the `labels:` defintion on docker services to make custom information available to notification messages:

1. __Add custom labels to a container:__

    using `docker-compose.yaml`
    ```yaml
    services:
      example:
        image: hello-world
        labels:
          # Monitor control
          telegram-notifier.monitor: true
          # Custom defined labels and information
          mycustom.telegram.container-info: "Access via http://myhost.com/"
    ```

    using `docker run`:
    ```sh
    docker run -d \
        --label "telegram-notifier.monitor=true" \
        --label "mycustom.telegram.container-info=Access via http://myhost.com/" \
        hello-world
    ```


2. __Adapt your customized messages template:__
    ```js
    container_start: e =>
        `&#9654;&#65039; <b>${e.Actor.Attributes.name}</b> started\n` +
        `Image: <code>${e.Actor.Attributes.image}</code>\n` +
        (
          ${e.Actor.Attributes['mycustom.telegram.container-info']} ?
          `NOTE: ${e.Actor.Attributes['mycustom.telegram.container-info']}` :
          ''
        )
    ```

## 4. Proxy

If you need to use a proxy to access the Telegram API, you can set the `HTTPS_PROXY` environment variables, like below:

```sh
docker run -d \
  --env TELEGRAM_NOTIFIER_BOT_TOKEN=<bot_token> \
  --env TELEGRAM_NOTIFIER_CHAT_ID=<chat_id> \
  --env HTTPS_PROXY=http://proxy.example.com:8080 \
  --volume /var/run/docker.sock:/var/run/docker.sock:ro \
  --hostname my_host \
  lorcas/docker-telegram-notifier
```


## Credits

This container is based on the [container by poma](https://hub.docker.com/r/poma/docker-telegram-notifier), originally an idea of [arefaslani](https://github.com/arefaslani).
