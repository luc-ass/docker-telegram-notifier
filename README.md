# Docker Telegram Notifier

This Docker container provides a Telegram integration to notify you about Docker events. It can notify you when a container starts, stops (including details about exit codes), restarts, and when the healthcheck status of a Docker container changes. You have the flexibility to customize these notifications by modifying the `templates.js` file.

This fork of the project was created to support for group topics.

If you encounter any issues, please feel free to contribute by fixing them and opening a [pull request](https://github.com/luc-ass/docker-telegram-notifier/pulls) or reporting a new [issue](https://github.com/luc-ass/docker-telegram-notifier/issues).

## 🐳 Run Docker Container

1. __Set up a Telegram bot:__ To get started, [create a Telegram bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot) and obtain the `Bot Token`. Optionally add the bot to a group and allow it to post messages. Finally, [extract the Chat ID](https://stackoverflow.com/a/32572159/882223).

2. __Run the container:__
   
   using `docker run`:
    ```sh
    docker run -d \
        --env TELEGRAM_NOTIFIER_BOT_TOKEN=token \
        --env TELEGRAM_NOTIFIER_CHAT_ID=chat_id \
        --env TELEGRAM_NOTIFIER_TOPIC_ID=message_thread_id \
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
          TELEGRAM_NOTIFIER_TOPIC_ID:
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

## Blacklist and Whitelist

You can disable notifications from specific containers by adding the label `--label telegram-notifier.monitor=false` to them. 

Alternatively you can receive notifications only from whitelisted containers by setting `--env ONLY_WHITELIST=true` on the notifier instance, and `--label telegram-notifier.monitor=true` on the containers you want to monitor.

## Remote docker instance

By default notifier connects to a local docker instance (don't forget to specify `--volume /var/run/docker.sock:/var/run/docker.sock:ro` for this case). But if you have monitoring and the service on the same host, you will not receive notifications if the host goes down. So I recommend to have monitoring separately.

Notifier accepts usual `DOCKER_HOST` and `DOCKER_CERT_PATH` environment variables to specify remote instance. For http endpoint you need to specify only `--env DOCKER_HOST=tcp://example.com:2375` (make sure to keep such instances behind the firewall). For https, you'll also need to mount a volume with https certificates that contains `ca.pem`, `cert.pem`, and `key.pem`: `--env DOCKER_HOST=tcp://example.com:2376 --env DOCKER_CERT_PATH=/certs --volume $(pwd):/certs`
Tutorial on how to generate docker certs can be found [here](https://docs.docker.com/engine/security/https/)


## Credits

This container is based on the [container by poma](https://hub.docker.com/r/poma/docker-telegram-notifier), originally an idea of [arefaslani](https://github.com/arefaslani).
