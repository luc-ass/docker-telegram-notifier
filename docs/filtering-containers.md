# Filtering containers

By default every container on the host is reported. There are two ways to
narrow that down.

## Blacklisting

Silence individual containers and leave the rest alone:

```yaml
services:
  example:
    image: hello-world
    labels:
      telegram-notifier.monitor: false
```

<details>
<summary>docker run</summary>

```sh
docker run -d --label telegram-notifier.monitor=false hello-world
```

</details>

## Whitelisting

Report nothing except the containers you opt in. Set `ONLY_WHITELIST` on the
notifier and label the containers you care about:

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
<summary>docker run</summary>

```sh
docker run -d --label telegram-notifier.monitor=true hello-world
```

</details>

`ONLY_WHITELIST` counts as off when unset, empty, `false`, `0`, `no` or `off`.
Any other value turns it on.
