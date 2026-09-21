# Chats, topics and threads

## Globally

All notifications land in `TELEGRAM_NOTIFIER_CHAT_ID`. To put them into a
specific forum topic or message thread, add one of:

```yaml
services:
  telegram-notifier:
    environment:
      TELEGRAM_NOTIFIER_TOPIC_ID: <topic_id>   # use only one
      TELEGRAM_NOTIFIER_THREAD_ID: <thread_id> # use only one
```

## Per container

Individual containers can be routed elsewhere:

```yaml
services:
  example:
    image: hello-world
    labels:
      # Chat override (optional)
      telegram-notifier.chat-id: "-100123456789"
      # Thread/topic override (optional — use only one)
      telegram-notifier.topic-id: "12345"
      telegram-notifier.thread-id: "12345"
```

<details>
<summary>docker run</summary>

```sh
docker run -d \
  --label telegram-notifier.chat-id=-100123456789 \
  --label telegram-notifier.topic-id=12345 \
  hello-world
```

</details>

> [!IMPORTANT]
> A container without a `.topic-id` / `.thread-id` label **falls back to the
> global setting**. If that is not what you want — say, the container posts
> into a different chat that has no topics — set the label explicitly to an
> empty value or `false` to turn it off for that container:
>
> ```yaml
> telegram-notifier.topic-id: "false"
> telegram-notifier.thread-id: ""
> ```

`topic-id` wins over `thread-id` when both are present. Telegram expects a
positive integer here; a value it cannot parse is treated as no topic at all.
