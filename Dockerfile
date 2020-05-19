FROM node:12.4-stretch-slim

ENV DEBIAN_FRONTEND noninteractive
ENV HTTP_PORT 80

COPY package.json /opt/superhero-application/package.json
COPY index.js     /opt/superhero-application/index.js
COPY src          /opt/superhero-application/src
COPY test         /opt/superhero-application/test

WORKDIR /opt/superhero-application

RUN ln -snf /usr/share/zoneinfo/CET /etc/localtime && echo "CET" > /etc/timezone

RUN npm install --production

CMD [ "npm", "start" ]
