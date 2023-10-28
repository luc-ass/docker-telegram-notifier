FROM node:lts-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json package-lock.json /usr/src/app/
RUN npm update -g
RUN npm install && npm cache clean --force
COPY . /usr/src/app

HEALTHCHECK CMD ["npm", "run", "healthcheck"]
CMD ["npm", "run", "start"]
