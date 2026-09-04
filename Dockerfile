# Pinned to 22-slim on purpose: node 24 dropped 32-bit ARM, so node:lts-slim
# has no linux/arm/v7 manifest and the multi-arch build fails outright.
# Do not move this to lts or 24 while linux/arm is in the platforms list.
# Node 22 has security support until April 2027.
FROM node:22-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json package-lock.json /usr/src/app/
# ci installs exactly what the lockfile says and fails if the two disagree;
# install may rewrite it, which makes the build unreproducible.
RUN npm ci --omit=dev && npm cache clean --force
COPY . /usr/src/app

# The interval is spelled out because the healthcheck depends on it: it fails
# when the listener's heartbeat is older than 90 seconds, which only leaves
# room for a missed refresh if it is asked every 30.
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD ["npm", "run", "healthcheck"]
CMD ["npm", "run", "start"]
