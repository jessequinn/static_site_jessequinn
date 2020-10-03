---
title: Micro Kong
description: I discuss recent work with Kong, an API gateway, and Micro, a Golang framework for rapid development of microservices.
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: Micro Kong
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2020-01-19T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

Recently, I had the joy of putting together an environment for an API. I wanted to do things differently and securely. To do so, I decided to utilize Kong as an API gateway to the [micro.mu](https://micro.mu/) API gateway. To get a better idea, I have implemented a structure like `Nginx (reverse proxy) -> Kong (gateway)-> Micro API (gateway) -> APIs -> Services -> Database(s)`. To accomplish this system, using Docker-compose, I did the following:

```
version: '3.7'

services:
    #######################################
    # Etcd: Discovery service
    #######################################
    etcd:
        image: bitnami/etcd:latest
        ports:
            - "2379:2379"
            - "2380:2380"
        environment:
            ALLOW_NONE_AUTHENTICATION: "yes"
            ETCD_ADVERTISE_CLIENT_URLS: http://etcd:2379
        restart: unless-stopped

    #######################################
    # Microapi: The API gateway for micro
    #######################################
    microapi:
        image: microhq/micro:latest
        command: "--registry=etcd --registry_address=etcd:2379 api --handler=http"
        depends_on:
            - etcd
        ports:
            - 8080:8080
        restart: unless-stopped

    #######################################
    # Nginx: Proxy
    #######################################
    nginx-proxy:
        restart: unless-stopped
        image: jwilder/nginx-proxy
        ports:
            - "80:80"
            - "443:443"
        security_opt:
            - label:type:docker_t
        volumes:
            - ./docker/public:/usr/share/nginx/html
            - ./docker/certs:/etc/nginx/certs:ro
            - vhost:/etc/nginx/vhost.d
            - /var/run/docker.sock:/tmp/docker.sock:ro
        labels:
            com.github.jrcs.letsencrypt_nginx_proxy_companion.nginx_proxy: "true"
        depends_on:
            - kong

    #######################################
    # Kong: Database migration
    #######################################
    kong-migration:
        image: kong:1.4.3-alpine
        command: "kong migrations bootstrap"
        restart: on-failure
        environment:
            KONG_DATABASE: postgres
            KONG_PG_DATABASE: kong
            KONG_PG_HOST: microapi-database
            KONG_PG_USER: kong
            KONG_PG_PASSWORD: xio9alaitavooR5f
            KONG_PG_PORT: 5432
        depends_on:
            - microapi-database

    #######################################
    # Kong: The API Gateway
    #######################################
    kong:
        image: kong:1.4.3-alpine
        restart: unless-stopped
        environment:
            KONG_DATABASE: postgres
            KONG_PG_HOST: microapi-database
            KONG_PG_DATABASE: kong
            KONG_PG_USER: kong
            KONG_PG_PORT: 5432
            KONG_PG_PASSWORD: xio9alaitavooR5f
            KONG_PROXY_LISTEN: 0.0.0.0:8000
            KONG_PROXY_LISTEN_SSL: 0.0.0.0:8443
            KONG_ADMIN_LISTEN: 0.0.0.0:8001
            VIRTUAL_HOST: lin.ks
            VIRTUAL_PORT: 8000
        depends_on:
            - kong-migration
            - microapi-database
            - microapi
        healthcheck:
            test: ["CMD", "kong", "health"]
            interval: 5s
            timeout: 2s
            retries: 15
        ports:
            - "8001:8001"
            - "8000:8000"

    #######################################
    # Konga: Database prepare
    #######################################
    konga-prepare:
        image: pantsel/konga:next
        command: "-c prepare -a postgres -u postgresql://kong:xio9alaitavooR5f@microapi-database:5432/kong"
        restart: on-failure
        depends_on:
            - kong
            - microapi-database

    #######################################
    # Konga: GUI
    #######################################
    konga:
        image: pantsel/konga:next
        restart: unless-stopped
        environment:
            DB_ADAPTER: postgres
            DB_HOST: microapi-database
            DB_DATABASE: kong
            DB_USER: kong
            DB_PASSWORD: xio9alaitavooR5f
            TOKEN_SECRET: km1GUr4RkcQD7DewhJPNXrCuZwcKmqjb
            NODE_ENV: production
        depends_on:
            - konga-prepare
            - microapi-database
        ports:
            - "1337:1337"

    #######################################
    # Postgres: Common database
    #######################################
    microapi-database:
        container_name: postgres
        #        image: postgres:12.1
        image: postgres:9.6 # konga requires 9.6
        restart: unless-stopped
        environment:
            POSTGRES_USER: microapi
            POSTGRES_PASSWORD: xio9alaitavooR5f
            POSTGRES_MULTIPLE_DATABASES: kong,kong
        volumes:
            - ./docker/postgres/init:/docker-entrypoint-initdb.d
        ports:
            - "5432:5432"
        healthcheck:
            test: ["CMD", "pg_isready", "-U", "microapi"]
            interval: 5s
            timeout: 5s
            retries: 5

volumes:
    vhost:
```

So to briefly explain, `Etcd` is used as a discovery service for any `micro` related stuff. In the past, `micro` used `Consul`, and locally `MDNS`.  If you decide to add any Golang services/APIs written with the `micro` framework, you will need to add `--registry=etcd --registry_address=etcd:2379` to the command segment. This makes your app discoverable by `Etcd`.  To utilize the `micro api` it is simple. Pull the `micro` image and append `api --handler=http`.  We technically could use the `nginx-proxy` to the `microapi`; however, from what I read, thus far, `micro` does not have any security incorporated into this API gateway. Therefore, `Kong` was an obvious choice. To get `Kong` up and running we need to have `postgres` or `cassandra` running. I opted for `postgres`. In addition, we need to make a migration. I have also included prepartion for `Konga`, an admin GUI interface for `Kong`. This as well requires a preparation container.

On a side note, you may have noticed that I am using a volume for `postgres`. This is because I needed several databases. To accomplished this, I am loading a script into `/docker-entrypoint-initdb.d`

```bash
#!/bin/bash

set -e
set -u

function create_user_and_database() {
	local database=$(echo $1 | tr ',' ' ' | awk  '{print $1}')
	local owner=$(echo $1 | tr ',' ' ' | awk  '{print $2}')
	echo "  Creating user and database '$database'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	    CREATE ROLE $owner LOGIN PASSWORD '$POSTGRES_PASSWORD';
	    CREATE DATABASE $database;
	    GRANT ALL PRIVILEGES ON DATABASE $database TO $owner;
EOSQL
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ':' ' '); do
		create_user_and_database $db
	done
	echo "Multiple databases created"
fi
```
