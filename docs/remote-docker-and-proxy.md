# Remote docker and proxies

## Watching a remote daemon

By default the notifier talks to the local docker socket, which means it goes
down together with the host it is watching. Running it on a separate host
avoids that blind spot.

The usual `DOCKER_HOST` and `DOCKER_CERT_PATH` variables apply. For an HTTP
endpoint, `DOCKER_HOST` is enough — keep such daemons behind a firewall. For
HTTPS, also mount a directory containing `ca.pem`, `cert.pem` and `key.pem`:

```yaml
services:
  telegram-notifier:
    volumes:
      # no socket mount at all for remote-only monitoring
      - ./certs:/certs
    environment:
      DOCKER_HOST: tcp://example.com:2376 # http/https is detected by port number
      DOCKER_CERT_PATH: /certs # should contain ca.pem, cert.pem, key.pem
```

Docker's own [guide to protecting the daemon
socket](https://docs.docker.com/engine/security/https/) covers generating
those certificates.

## Outbound proxy

If the host reaches the internet through a proxy, set `HTTPS_PROXY`:

```yaml
services:
  telegram-notifier:
    image: lorcas/docker-telegram-notifier:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      TELEGRAM_NOTIFIER_BOT_TOKEN: <bot_token>
      TELEGRAM_NOTIFIER_CHAT_ID: <chat_id>
      HTTPS_PROXY: http://proxy.example.com:8080
```

<details>
<summary>docker run</summary>

```sh
docker run -d \
  --env TELEGRAM_NOTIFIER_BOT_TOKEN=<bot_token> \
  --env TELEGRAM_NOTIFIER_CHAT_ID=<chat_id> \
  --env HTTPS_PROXY=http://proxy.example.com:8080 \
  --volume /var/run/docker.sock:/var/run/docker.sock:ro \
  lorcas/docker-telegram-notifier
```

</details>

Lowercase `https_proxy` is accepted as well. This only affects the connection
to Telegram — the docker socket is not reached over the network. An unusable
proxy URL stops the container with exit code 100.
