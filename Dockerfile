FROM node:17-bullseye

ENV DEBIAN_FRONTEND noninteractive
ENV HTTP_PORT 80
ENV REDIS_HOST 10.255.27.179
ENV REDIS_PORT 6379

COPY package.json /opt/superhero-application/package.json
COPY src          /opt/superhero-application/src

WORKDIR /opt/superhero-application

RUN npm install --production

CMD [ "npm", "start" ]
