# Securing the docker socket

The basic setup mounts the docker socket read-only:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

**`:ro` protects the socket file, not the API behind it.** Anything that can
reach the docker socket can create a container, mount any host path into it and
run it as root — so it can take over the host, read-only mount or not. That
applies to every tool that reads docker events this way, this one included.

## Use a socket proxy

This notifier needs four read-only endpoints: `version`, `info`, `ping` and
`events`. A socket proxy is a small container that exposes exactly those and
refuses everything else:

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

The notifier gets no volume at all in this setup — it talks HTTP to the proxy,
and the proxy is the only container holding the socket. Everything the proxy
does not explicitly allow is refused, so a compromised notifier cannot create
containers.

Keep the proxy off any published port. It has no authentication, so anything
that can reach it inherits its permissions.

> [!NOTE]
> This combination is tested: with those four permissions enabled and
> everything else at its default of off, both notifications and the healthcheck
> work. `PING` is easy to miss — the healthcheck uses it to tell a live daemon
> from a stalled event stream.
