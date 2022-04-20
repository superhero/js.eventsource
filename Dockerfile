FROM node:17-bullseye

ENV DEBIAN_FRONTEND noninteractive
ENV HTTP_PORT 80

COPY package.json /opt/superhero-application/package.json
COPY src          /opt/superhero-application/src

WORKDIR /opt/superhero-application

RUN ln -snf /usr/share/zoneinfo/CET /etc/localtime && echo "CET" > /etc/timezone

RUN npm install --production

CMD [ "npm", "start" ]
