FROM node:18.20.4-alpine AS BUILD_IMAGE

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json package-lock.json /usr/src/app/
RUN npm install && npm cache clean --force
COPY . /usr/src/app

FROM node:20-alpine

HEALTHCHECK CMD ["npm", "run", "healthcheck"]
CMD ["npm", "run", "start"]
