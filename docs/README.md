# Documentation

| Page | What it covers |
| :--- | :--- |
| [Basic setup](basic-setup.md) | Create the bot, run the container, add a healthcheck |
| [Environment variables](environment-variables.md) | Every variable the notifier reads |
| [Container labels](container-labels.md) | Every label the notifier reads |
| [Filtering containers](filtering-containers.md) | Blacklisting and whitelisting |
| [Chats, topics and threads](chats-and-topics.md) | Global routing and per-container overrides |
| [Remote docker and proxies](remote-docker-and-proxy.md) | `DOCKER_HOST`, TLS certificates, outbound proxy |
| [Secrets](secrets.md) | Keeping the bot token out of the environment |
| [Custom message templates](custom-templates.md) | Rewriting the notification texts |
| [Securing the docker socket](securing-the-docker-socket.md) | Why `:ro` is not enough, and what to do instead |
