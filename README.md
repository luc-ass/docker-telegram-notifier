<!-- omit in toc -->
# Docker Telegram Notifier
<!-- omit in toc -->
# [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/luc-ass/docker-telegram-notifier/docker-image.yml?branch=main&style=for-the-badge)](https://github.com/luc-ass/docker-telegram-notifier/actions) [![Docker Pulls](https://img.shields.io/docker/pulls/lorcas/docker-telegram-notifier?logo=docker&style=for-the-badge)](https://hub.docker.com/r/lorcas/docker-telegram-notifier) [![Docker Image Version (latest semver)](https://img.shields.io/docker/v/lorcas/docker-telegram-notifier?logo=docker&style=for-the-badge)](https://github.com/luc-ass/docker-telegram-notifier/releases)


This Docker container provides a Telegram integration to notify you about Docker events. It can notify you when a container starts, stops (including details about exit codes) and when the healthcheck status of a Docker container changes. A restart is reported as a stop followed by a start, since that is what Docker emits. You have the flexibility to customize these notifications by [modifying the `templates.js` file](#3-notification-messages-customization).

This fork was created to address security vulnerabilities and add support for
- `linux/arm64` and
- `linux/arm/v7` in addition to
- `linux/amd64`.

> [!NOTE]
> The image is built on `node:22-slim` rather than `node:lts-slim`. Node 24 dropped
> support for 32-bit ARM, so tracking the `lts` tag would silently drop `linux/arm/v7`.
> Node 22 receives security support until April 2027; `linux/arm/v7` support will be
> reconsidered before then.

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
  - [2.6 Bot token from a file](#26-bot-token-from-a-file)
- [3. Notification messages customization](#3-notification-messages-customization)
  - [3.1 Create a custom template](#31-create-a-custom-template)
  - [3.2 Customizing message strings](#32-customizing-message-strings)
  - [3.2.1 Default docker event variables](#321-default-docker-event-variables)
  - [3.2.2 Docker Compose variables](#322-docker-compose-variables)
  - [3.2.3 Custom container information in Telegram notifications](#323-custom-container-information-in-telegram-notifications)
- [4. Securing the docker socket](#4-securing-the-docker-socket)
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

Receive notifications only from whitelisted containers by setting `ONLY_WHITELIST=true` and labeling desired containers. The variable is off unless set to a value other than `false`, `0`, `no` or `off`:

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
      #                         : "false" # would explicitely override to use NONE
      telegram-notifier.thread-id: "12345"
      #                          : "" # would also explicitely override to use NONE
```

> [!IMPORTANT]
> When leaving away a `.topic-id` / `.thread-id` label, but having one defined globally as per [Topics and Threads](#21-topics-and-threads), then that will be **used automatically as fallback**.
> If that is unintended, you have to explicitely set the label to EMPTY (or `false`).
> - Example scenario: when for example the per container `chat-id` differs from the global, and has NO Topics / Threads support.

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


### 2.6 Bot token from a file

Environment variables are readable by anyone who can run `docker inspect` on the container. To keep the bot token out of them, append `_FILE` to the variable name and point it at a file:

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

`TELEGRAM_NOTIFIER_CHAT_ID_FILE` works the same way. A trailing newline in the file is ignored. If the file cannot be read, the container stops immediately with exit code 100 and names the file it tried to open.


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
| `${e.Actor.ID}` | Container ID (full, 64 characters) |
| `${e.Actor.Attributes.name}` | Container name |
| `${e.Actor.Attributes.image}` | Container image used |
| `${e.Actor.Attributes.exitCode}` | Container exit code (`die` events only) |
| `${e.Actor.Attributes.execDuration}` | Seconds the container ran (`die` events only) |

Beyond those, **every label on the container is available under the same path**, which is what makes [custom container information](#323-custom-container-information-in-telegram-notifications) work. That includes the labels `docker compose` adds by itself, listed below.

`Attributes` is a plain object, so values are `undefined` when the event does not carry them — `exitCode` on a `start` event, for instance. The authoritative list of what an event can contain is the [Docker Engine API](https://docs.docker.com/reference/api/engine/version/v1.51/#tag/System/operation/SystemEvents); the notifier passes it through unchanged, apart from HTML-escaping the values.

Example:
```js
container_start: e =>
    `&#9989; Container Started\n` +
    `Name: <b>${e.Actor.Attributes.name}</b>\n` +
    `Image: <code>${e.Actor.Attributes.image}</code>\n` +
    `ID: <code>${e.Actor.ID.slice(0, 12)}</code>`
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

Compose adds more than these — `com.docker.compose.config-hash`, `com.docker.compose.image`, `com.docker.compose.oneoff`, `com.docker.compose.project.config_files` and `com.docker.compose.project.working_dir` are present as well. They are ordinary labels, so they are reached the same way.

Example:
```js
container_start: e =>
    `&#9989; Container Started\n` +
    `Project: <b>${e.Actor.Attributes['com.docker.compose.project']}</b>\n` +
    `Service: <b>${e.Actor.Attributes['com.docker.compose.service']}</b> (#${e.Actor.Attributes['com.docker.compose.container-number']})\n` +
    `Image: <code>${e.Actor.Attributes.image}</code>\n` +
    `Compose Version: <code>${e.Actor.Attributes['com.docker.compose.version']}</code>`
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
        `Image: <code>${e.Actor.Attributes.image}</code>` +
        (
          e.Actor.Attributes['mycustom.telegram.container-info'] ?
          `\nNOTE: ${e.Actor.Attributes['mycustom.telegram.container-info']}` :
          ''
        )
    ```

## 4. Securing the docker socket

The basic setup mounts the docker socket read-only:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

**`:ro` protects the socket file, not the API behind it.** Anything that can reach the docker socket can create a container, mount any host path into it and run it as root — so it can take over the host, read-only mount or not. That applies to every tool that reads docker events this way, this one included.

This notifier only needs four read-only endpoints: `version`, `info`, `ping` and `events`. A socket proxy is a small container that exposes exactly those and refuses everything else:

```yaml
services:
  docker-socket-proxy:
    image: tecnativa/docker-socket-proxy:latest
    environment:
      EVENTS: 1   # the event stream itself
      INFO: 1     # host details in the start-up message
      PING: 1     # the healthcheck's liveness probe
      VERSION: 1  # docker version in the start-up message
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped

  telegram-notifier:
    image: lorcas/docker-telegram-notifier:latest
    depends_on:
      - docker-socket-proxy
    environment:
      DOCKER_HOST: tcp://docker-socket-proxy:2375
      TELEGRAM_NOTIFIER_BOT_TOKEN: <bot_token>
      TELEGRAM_NOTIFIER_CHAT_ID: <chat_id>
    restart: unless-stopped
```

The notifier gets no volume at all in this setup — it talks HTTP to the proxy, and the proxy is the only container holding the socket. Everything the proxy does not explicitly allow is refused, so a compromised notifier cannot create containers.

Keep the proxy off any published port. It has no authentication, so anything that can reach it inherits its permissions.

> This combination is tested: with those four permissions enabled and everything else at its default of off, both notifications and the healthcheck work. `PING` is easy to miss — the healthcheck uses it to tell a live daemon from a stalled event stream.


## Credits

This container is based on the [container by poma](https://hub.docker.com/r/poma/docker-telegram-notifier), originally an idea of [arefaslani](https://github.com/arefaslani).
