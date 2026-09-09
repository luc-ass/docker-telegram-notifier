# Custom message templates

Every notification text lives in [`templates.js`](../templates.js). Replacing
that file replaces the messages.

## Using your own file

1. Download [`templates.js`](../templates.js) and edit the message strings.
2. Mount it over the one in the image:

```yaml
services:
  telegram-notifier:
    volumes:
      - ./my-template.js:/usr/src/app/templates.js:ro
```

<details>
<summary>docker run</summary>

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

Messages are sent as Telegram HTML, so `<b>`, `<i>` and `<code>` work. Values
coming from docker are HTML-escaped for you.

The notifier subscribes to exactly the events it has a template for, derived
from the template keys — so a mounted file that adds an event keeps receiving
it.

## Available variables

### Docker event fields

| Variable | Description |
| :--- | :--- |
| `${e.Actor.ID}` | Container ID (full, 64 characters) |
| `${e.Actor.Attributes.name}` | Container name |
| `${e.Actor.Attributes.image}` | Container image used |
| `${e.Actor.Attributes.exitCode}` | Container exit code (`die` events only) |
| `${e.Actor.Attributes.execDuration}` | Seconds the container ran (`die` events only) |

`Attributes` is a plain object, so values are `undefined` when the event does
not carry them — `exitCode` on a `start` event, for instance. The
authoritative list of what an event can contain is the [Docker Engine
API](https://docs.docker.com/reference/api/engine/version/v1.51/#tag/System/operation/SystemEvents);
the notifier passes it through unchanged, apart from escaping the values.

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

### Docker Compose labels

Present only on containers started by `docker compose`:

| Variable | Description |
| :--- | :--- |
| `${e.Actor.Attributes['com.docker.compose.container-number']}` | Compose container number |
| `${e.Actor.Attributes['com.docker.compose.project']}` | Compose project name |
| `${e.Actor.Attributes['com.docker.compose.service']}` | Compose service name |
| `${e.Actor.Attributes['com.docker.compose.version']}` | Compose version |

Compose adds more than these — `config-hash`, `image`, `oneoff`,
`project.config_files` and `project.working_dir` are there as well, under the
same `com.docker.compose.` prefix.

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

### Your own labels

Every label on a container reaches the template under the same path, so any
information you attach to a service can appear in its notifications:

```yaml
services:
  example:
    image: hello-world
    labels:
      mycustom.telegram.container-info: "Access via http://myhost.com/"
```

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

Guard optional labels like that — containers without the label would otherwise
report `undefined`.
