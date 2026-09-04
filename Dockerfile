# Pinned to 22-slim on purpose: node 24 dropped 32-bit ARM, so node:lts-slim
# has no linux/arm/v7 manifest and the multi-arch build fails outright.
# Do not move this to lts or 24 while linux/arm is in the platforms list.
# Node 22 has security support until April 2027.
FROM node:22-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json package-lock.json /usr/src/app/
RUN npm install && npm cache clean --force
COPY . /usr/src/app

HEALTHCHECK CMD ["npm", "run", "healthcheck"]
CMD ["npm", "run", "start"]
