FROM node:17-bullseye

ENV DEBIAN_FRONTEND noninteractive

COPY package.json /opt/superhero-application/package.json
COPY src          /opt/superhero-application/src

WORKDIR /opt/superhero-application

RUN npm install --production

CMD [ "npm", "start" ]
