# Security Policy

## Supported versions

Fixes go into the most recent release only. The published image is rebuilt
weekly so base image updates reach the `latest`, `1`, `1.x` and version tags
without waiting for a release.

| Version | Supported |
| :------ | :-------- |
| newest release | yes |
| anything older | no |

## Reporting a vulnerability

Please use [private vulnerability reporting](https://github.com/luc-ass/docker-telegram-notifier/security/advisories/new)
rather than a public issue, and allow some time for a response — this is a
small project maintained in spare time.

Include what you need to reproduce it: the version or image tag, the relevant
part of your compose file with secrets removed, and what you observed.

## What this container can reach

Worth knowing before you deploy it, and relevant to how you judge a finding:

- **The docker socket is full control of the host.** The documented setup
  mounts `/var/run/docker.sock` read-only, but `:ro` only protects the socket
  file — the API behind it can still create privileged containers. Section 4
  of the README describes running the notifier behind a socket proxy that
  exposes only `version`, `info`, `ping` and `events`, which is the safer
  arrangement.
- **The bot token is a credential for your Telegram bot.** Passed as an
  environment variable it is readable through `docker inspect`. It can be
  supplied as a file instead — see section 2.6 of the README.
- **Container names, image tags and labels end up in messages.** They are
  HTML-escaped before being sent, so a container whose labels contain markup
  cannot break or forge the notification.
- **Notifications are sent to whichever chat is configured.** Anyone who can
  start containers on the monitored host can therefore cause messages in that
  chat, which is inherent to what the tool does.
