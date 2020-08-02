---
title: Pushing Dockerfiles
description: Just a quick tutorial on how to push Dockerfiles
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: Pushing Dockerfiles
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2020-01-05T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

I have been recently studying [Kubernetes](https://kubernetes.io/) to possibly move away from just Dockerizing directly. To gain some experience and knowledge, I have been following an excellent article on [itnext](https://itnext.io/containerizing-symfony-application-a2a5a3bd5edc). However, I ran into some issues, or rather the ability to properly reproduce some of the assumed tasks in the article. Nonetheless, I came through, and wanted to disseminate some of the information I have gathered.

If, like me, you are interested in pushing your `Dockerfiles` to a public/private repo such as [docker](https://hub.docker.com/repositories) then the following `Makefile` may be of interest. For instance, you have three images you have made, in my case, `mysql`, `php-fpm` and `nginx` for a symfony project, 

The Dockerfile for `mysql`

```
ARG VERSION

FROM mysql:${VERSION} as prod

# Copy sql dump to initialize tables on stratup
COPY ./docker/mysql/init /docker-entrypoint-initdb.d
```

The Dockerfile for `nginx`

```
ARG VERSION

# Dev image
FROM nginx:${VERSION}-alpine as dev

# Copy nginx config
COPY ./docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Prod image
FROM dev as prod

# Copy assets
COPY ./assets /app/public
```

The Dockerfile for `php-fpm`

```
ARG VERSION


# Build image
FROM php:${VERSION}-fpm-alpine AS build

## Install system dependencies
RUN apk update && \
    apk add --no-cache zlib-dev libzip-dev

## Install php extensions
RUN docker-php-ext-install pdo_mysql zip

## Copy php default configuration
COPY ./docker/php-fpm/default.ini /usr/local/etc/php/conf.d/default.ini

## Install composer
RUN wget https://getcomposer.org/installer && \
    php installer --install-dir=/usr/local/bin/ --filename=composer && \
    rm installer && \
    composer global require hirak/prestissimo


# Dev image
FROM build AS dev

## Install system dependencies
RUN apk add --no-cache git autoconf gcc g++ make

## Install php extensions
RUN pecl install xdebug && \
    docker-php-ext-enable xdebug


# Test image
FROM dev AS test

ENV APP_ENV=dev
WORKDIR /app

## Copy project files to workdir
COPY . .

## Install application dependencies
RUN composer install --no-interaction --optimize-autoloader

## Change files owner to php-fpm default user
RUN chown -R www-data:www-data .

CMD ["php-fpm"]


# Prod image
FROM build AS prod

ENV APP_ENV=prod
WORKDIR /app

## Copy project files to workdir
COPY . .

## Remove dev dependencies
RUN composer install --no-dev --no-interaction --optimize-autoloader

## Change files owner to php-fpm default user
RUN chown -R www-data:www-data .

## Cleanup
#RUN rm /usr/local/bin/composer

CMD ["php-fpm"]
```

You could simply type `export DOCKER_USER=username DOCKER_PASS=password; make build TYPE=mysql` to build, tag and finally push to the repo. In general, I build the image with prod, though,  dev,  test or another build type could be used as well. Thereafter, I tag with the current commit short form and as well with latest. This way, under tags, a new tag will be created along with an update to the latest. I then log in and push the newly built and tagged images. You can see what it is doing by using `docker images`. Although, I believe the code is self-explanatory. However, if you have an issues, you may leave a message.

```
TAG    			:= $$(git rev-parse --short HEAD)

NAME_MYSQL  	:= symfony-dummy-project-mysql
IMG_MYSQL   	:= ${NAME_MYSQL}:${TAG}
LATEST_MYSQL	:= ${NAME_MYSQL}:latest
VERSION_MYSQL	:= 5.7

NAME_NGINX   	:= symfony-dummy-project-nginx
IMG_NGINX   	:= ${NAME_NGINX}:${TAG}
LATEST_NGINX	:= ${NAME_NGINX}:latest
VERSION_NGINX	:= 1.15

NAME_PHP_FPM   	:= symfony-dummy-project-php-fpm
IMG_PHP_FPM   	:= ${NAME_PHP_FPM}:${TAG}
LATEST_PHP_FPM	:= ${NAME_PHP_FPM}:latest
VERSION_PHP_FPM	:= 7.3

ifeq ($(TYPE),mysql)
build:
	@docker build --build-arg VERSION=${VERSION_MYSQL} --target prod -t ${NAME_MYSQL}:prod -f docker/mysql/Dockerfile  .
	@docker tag ${NAME_MYSQL}:prod damasu/${IMG_MYSQL}
	@docker tag ${NAME_MYSQL}:prod damasu/${LATEST_MYSQL}
	@docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}
	@docker push damasu/${IMG_MYSQL}
	@docker push damasu/${LATEST_MYSQL}
else ifeq ($(TYPE),nginx)
build:
	@docker build --build-arg VERSION=${VERSION_NGINX} --target prod -t ${NAME_NGINX}:prod -f docker/nginx/Dockerfile  .
	@docker tag ${NAME_NGINX}:prod damasu/${IMG_NGINX}
	@docker tag ${NAME_NGINX}:prod damasu/${LATEST_NGINX}
	@docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}
	@docker push damasu/${IMG_NGINX}
	@docker push damasu/${LATEST_NGINX}
else ifeq ($(TYPE),php)
build:
	@docker build --build-arg VERSION=${VERSION_PHP_FPM} --target prod -t ${NAME_PHP_FPM}:prod -f docker/php-fpm/Dockerfile  .
	@docker tag ${NAME_PHP_FPM}:prod damasu/${IMG_PHP_FPM}
	@docker tag ${NAME_PHP_FPM}:prod damasu/${LATEST_PHP_FPM}
	@docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}
	@docker push damasu/${IMG_PHP_FPM}
	@docker push damasu/${LATEST_PHP_FPM}
endif
```

PS.

I use this rather than using automated build. If one wanted to use automated builds you would require to make a `hooks/build` file in the same directory as your Dockerfile(s). 

The `build` file could contain something like

```
#!/bin/sh
docker build --build-arg VERSION=$VERSION -t $IMAGE_NAME .
```

where you pass a `BUILD ENVIRONMENT VARIABLE` - `$VERSION` possibly a target, if you're using a multistage Dockerfile, etc. However, the challenge with this method is correctly using your context especially if you require `COPY` in your Dockerfile(s).
