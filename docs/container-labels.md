# Container labels

These labels go on the containers you want to be notified about, not on the
notifier itself.

| Label | Description |
| :--- | :--- |
| `telegram-notifier.monitor` | `false` silences the container; `true` includes it when `ONLY_WHITELIST` is on |
| `telegram-notifier.chat-id` | Send this container's events to a different chat |
| `telegram-notifier.topic-id` | Forum topic for this container |
| `telegram-notifier.thread-id` | Message thread for this container |

`topic-id` wins over `thread-id` if both are set. An empty value, `false` or
`0` explicitly disables the globally configured topic or thread for this
container.

Beyond these, **every** label on a container is available to the message
templates, including the ones `docker compose` adds by itself. See
[Custom message templates](custom-templates.md).

## Where they go

Using `docker-compose.yaml`:

```yaml
services:
  example:
    image: hello-world
    labels:
      telegram-notifier.monitor: true
```

Using `docker run`:

```sh
docker run -d --label telegram-notifier.monitor=true hello-world
```

Related: [Filtering containers](filtering-containers.md),
[Chats, topics and threads](chats-and-topics.md).
