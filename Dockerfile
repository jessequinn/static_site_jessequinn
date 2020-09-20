ARG VERSION=14
FROM node:${VERSION}-alpine AS build

ARG PORT=3000
EXPOSE $PORT/tcp

WORKDIR /app

# Install yarn and other dependencies via apk
RUN apk update && apk add bash git yarn python graphicsmagick g++ make && rm -rf /var/cache/apk/*

# Install node dependencies - done in a separate step so Docker can cache it.
COPY ./package.json /app/
COPY ./yarn.lock /app/

RUN yarn install

# Copy project files into the docker image
COPY . /app/


FROM build as dev

ENV NODE_ENV development

WORKDIR /app

RUN yarn build

CMD ["yarn", "dev"]


FROM build as prod

ENV NODE_ENV production

WORKDIR /app

RUN yarn build

CMD ["yarn", "start"]
