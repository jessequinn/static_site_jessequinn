---
title: Remove boundaries with Boundary
description: I discuss the installation and configuration of containerized Boundary and Vault.
img: ben-hershey-8KaU5I4SBIw-unsplash.jpg
alt: Remove boundaries with Boundary
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2020-10-31T03:00:00.000Z
updateAt: 2020-10-31T03:00:00.000Z
---

## Introduction
[Hashicorp Boundary](https://www.boundaryproject.io/) is a product in its infancy that is meant to allow for simple and secure remote access to your private hosts. An evolved version of SSH bastions and VPNs allowing RDP, SSH, Postgres and other commands to be
easily used. At the moment, Boundary allows for several key management services (KMS) like OCI KMS, AWS KMS, etc; however, this article will focus using [Vault](https://www.vaultproject.io/),
another product from Hashicorp. We could use authenticated encryption with associated data ([AEAD](https://www.boundaryproject.io/docs/configuration/kms/aead)), but this is recommended only for development.
I personally want to use this on a production level, so I opted for [Vault transit](https://www.vaultproject.io/docs/secrets/transit). 

So, at the heart of Boundary, there are several key components, obviously the KMS, but also
workers, controllers and listeners. In the example below, I place all in one `config.hcl`. Boundary does allow for high availability ([HA](https://www.boundaryproject.io/docs/installing/high-availability)),
but I will just be placing
everything into a simple `docker-compose.yml`.

So let's begin installing and configuring Vault and Boundary? Although, I will be writing another article that focuses on the configuration of Boundary specifically with Terraform. Therefore, I want to emphasize 
that this article is on configuring both Vault and Boundary to be able to start up Boundary!
 
## Configuration
### Vault
Going directly to the `docker-compose.yml`, which is incomplete, contains Vault, Consul, Boundary and Postgres. You could use [Traefik](https://traefik.io/) as a reverse-proxy, but I do not provide that here.

```yaml[docker-compose.yml]
version: '3.8'

x-logging:
  &default-logging
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"

networks:
  bastion-net:
    driver: bridge

services:
... traefik

  vault:
    image: vault:1.5.5
    container_name: vault-techdev
    restart: always
    environment:
      VAULT_LOCAL_CONFIG: '{"backend": {"consul": {"address": "consul:8500", "path": "vault/"}}, "listener": {"tcp":{"address": "0.0.0.0:8200", "tls_disable": 1}}, "ui": true}'
      VAULT_ADDR: http://127.0.0.1:8200
      VAULT_API_ADDR: http://127.0.0.1:8200
    command: server
    cap_add:
      - IPC_LOCK
    ports:
      - 8200:8200
    volumes:
      - /docker/data/vault/data:/vault/data
    depends_on:
      - consul
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.vault.rule=Host(`xxxx`)"
      - "traefik.http.routers.vault.entrypoints=websecure"
      - "traefik.http.routers.vault.service=vault"
      - "traefik.http.services.vault.loadbalancer.server.port=8200"
      - "traefik.http.routers.vault.tls.certresolver=myresolver"
    networks:
      - bastion-net
    logging: *default-logging

  consul:
    image: consul:1.8.5
    container_name: consul-techdev
    restart: always
    environment:
      CONSUL_LOCAL_CONFIG: '{"datacenter": "localhost", "data_dir": "/consul/data", "log_level": "DEBUG", "server": true, "ui": true}'
    command: agent -server -bind 0.0.0.0 -client 0.0.0.0 -bootstrap-expect 1
    ports:
      - 8500:8500
    volumes:
      - /docker/data/consul/data:/consul/data
    networks:
      - bastion-net
    logging: *default-logging

  boundary:
    build:
      context: /docker/docker/boundary/
      dockerfile: Dockerfile
      args:
        - ALPINE_VERSION=3.12
        - BOUNDARY_VERSION=0.1.1
    container_name: boundary-techdev
    restart: always
    environment:
      POSTGRES_HOST: postgres
      PORTGRES_PORT: 5432
      PORTGRES_DATABASE: xxxx
      PORTGRES_USERNAME: xxxx
      PORTGRES_PASSWORD: xxxx
    cap_add:
      - IPC_LOCK
    ports:
      - 9200:9200
      - 9202:9202
    depends_on:
      - postgres
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.boundary.rule=Host(`xxxx`)"
      - "traefik.http.routers.boundary.entrypoints=websecure"
      - "traefik.http.routers.boundary.service=boundary"
      - "traefik.http.services.boundary.loadbalancer.server.port=9200"
      - "traefik.http.routers.boundary.tls.certresolver=myresolver"
    networks:
      - bastion-net
    logging: *default-logging

  postgres:
    image: postgres:12.2
    container_name: postgres-techdev
    restart: always
    environment:
      POSTGRES_USER: xxxx
      POSTGRES_PASSWORD: xxxx
      POSTGRES_DB: xxxx
    stop_grace_period: 1m
    volumes:
      - /docker/data/postgresql/data:/var/lib/postgresql/data:rw
    networks:
      - bastion-net
    logging: *default-logging
```

In a nut shell, we are using [Consul](https://www.consul.io/) as a backend to Vault. Both Vault and Consul are 
both running in server mode with the config provided in the environment variables `VAULT_LOCAL_CONFIG` and `CONSUL_LOCAL_CONFIG`, respectively.

To prepare Vault, we need to initialize it. To do so, assuming you are using Traefik, go to the `Host` that you designated in the Traefik configuration, or try to access Vault
on `localhost:8200`. Immediately you will be asked to initialize Vault. I usually use 5/3. Five keys produced with three required for unsealing. **Make sure to download the json** with the keys
as it also contains your master/admin token along with all keys generated.

Assuming you are now able to log into Vault with your master token we can begin to create a `transit` secret. The easiest way is to create a transit secret engine from the UI. However, you could use the following
commands to do the same.

```bash
vault login -address "https://xxxx" s.xxxx
vault secrets enable -address "https://xxx" transit
```

We also need to create three transit keys: boundary-root, boundary-worker-auth and boundary-recovery (not mandatory). Again you can do this easily through the UI or via CLI.

```bash
vault write -address "https://xxxx" -f transit/keys/boundary-root
vault write -address "https://xxxx" -f transit/keys/boundary-worker-auth
vault write -address "https://xxxx" -f transit/keys/boundary-recovery
```

The following policy needs to be created as well:

```hcl[boundary-kms-transit-policy]
# boundary-recovery
path "transit/encrypt/boundary-recovery" {
  capabilities = ["update"]
}

path "transit/decrypt/boundary-recovery" {
  capabilities = ["update"]
}

# boundary-worker-auth
path "transit/encrypt/boundary-worker-auth" {
  capabilities = ["update"]
}

path "transit/decrypt/boundary-worker-auth" {
  capabilities = ["update"]
}

# boundary-root
path "transit/encrypt/boundary-root" {
  capabilities = ["update"]
}

path "transit/decrypt/boundary-root" {
  capabilities = ["update"]
}
```

And finally create a token that Boundary will eventually use:

```
vault token create -address "https://xxx" -policy boundary-kms-transit-policy
```

### Boundary
Now let's focus on Boundary. I created a custom `Dockerfile` although quite recently Hashicorp released a dockerhub image as well.

```dockerfile[Dockerfile]
ARG ALPINE_VERSION=3.12
FROM alpine:${ALPINE_VERSION}
LABEL authors="Jesse Quinn <me@jessequinn.info>"

ARG BOUNDARY_VERSION=0.1.1
ARG BOUNDARY_USERID

ADD https://releases.hashicorp.com/boundary/${BOUNDARY_VERSION}/boundary_${BOUNDARY_VERSION}_linux_amd64.zip /tmp/
#ADD https://releases.hashicorp.com/boundary/${BOUNDARY_VERSION}/boundary_${BOUNDARY_VERSION}_SHA256SUMS      /tmp/
#ADD https://releases.hashicorp.com/boundary/${BOUNDARY_VERSION}/boundary_${BOUNDARY_VERSION}_SHA256SUMS.sig  /tmp/

WORKDIR /tmp/

COPY run-boundary.sh /bin/run-boundary.sh

ENV BOUNDARY_VERSION=${BOUNDARY_VERSION} \
    BOUNDARY_USERNAME="boundary" \
    BOUNDARY_USERID=${BOUNDARY_USERID:-1051}

#RUN apk --update add --virtual verify gpgme \
# && gpg --keyserver pgp.mit.edu --recv-key 91A6E7F85D05C65630BEF18951852D87348FFC4C \
# && gpg --verify /tmp/boundary_${BOUNDARY_VERSION}_SHA256SUMS.sig \
# && cat boundary_${BOUNDARY_VERSION}_SHA256SUMS | grep linux_amd64 | sha256sum -c \
# && apk del verify \
RUN apk --update --no-cache add curl tini libcap bash python3 openssl net-tools ca-certificates \
 && adduser -D -u $BOUNDARY_USERID $BOUNDARY_USERNAME \
 && unzip boundary_${BOUNDARY_VERSION}_linux_amd64.zip \
 && mv boundary /bin/ \
 && chmod +x /bin/run-boundary.sh /bin/boundary \
 && mkdir /boundary /boundary/ssl /boundary/config \
 && rm -rf /tmp/* \
 && rm -rf /var/cache/apk/* \
 && setcap cap_ipc_lock=+ep $(readlink -f $(which boundary))

RUN chown -R $BOUNDARY_USERNAME /boundary /bin/boundary /bin/run-boundary.sh

WORKDIR /

EXPOSE 9200 9202 9201

USER $BOUNDARY_USERNAME

ENTRYPOINT ["/sbin/tini", "--", "/bin/run-boundary.sh"]
```

I use [tini](https://github.com/krallin/tini) as an init to run our entrypoint script `run-boundary.sh`:

```bash[run-boundary.sh]
#!/usr/bin/env bash

if [[ -z ${POSTGRES_HOST} ]]; then
    export POSTGRES_HOST=postgres
fi
if [[ -z ${PORTGRES_PORT} ]]; then
    export PORTGRES_PORT=5432
fi
if [[ -z ${PORTGRES_USERNAME} ]]; then
    export PORTGRES_USERNAME=xxxx
fi
if [[ -z ${PORTGRES_PASSWORD} ]]; then
    export PORTGRES_PASSWORD=xxxx
fi
if [[ -z ${PORTGRES_DATABASE} ]]; then
    export PORTGRES_DATABASE=xxxx
fi

if [[ ! -f /boundary/config/config.hcl ]]; then
    cat <<EOF > /boundary/config/config.hcl
disable_mlock = true

controller {
  name        = "demo-controller-1"
  description = "A controller for a demo!"

  database {
    url       = "postgresql://${PORTGRES_USERNAME}:${PORTGRES_PASSWORD}@${POSTGRES_HOST}:${PORTGRES_PORT}/${PORTGRES_DATABASE}?sslmode=disable"
  }
}

worker {
  name        = "demo-worker-1"
  description = "A default worker created demonstration"
  controllers = [
    "0.0.0.0",
  ]
  address     = "0.0.0.0"
  public_addr = "xxxx"
}

listener "tcp" {
  address       = "0.0.0.0"
  purpose       = "api"
  tls_disable   = true
}

listener "tcp" {
  address       = "0.0.0.0"
  purpose       = "cluster"
  tls_disable   = true
}

listener "tcp" {
  address       = "0.0.0.0"
  purpose       = "proxy"
  tls_disable   = true
}

# Root KMS configuration block: this is the root key for Boundary
# Use a production KMS such as AWS KMS in production installs
kms "transit" {
  purpose         = "root"
  address         = "https://xxxx"
  token           = "s.xxxx"
  disable_renewal = "false"

  // Key configuration
  key_name        = "boundary-root"
  mount_path      = "transit/"
  namespace       = "ns1/"
}

# Worker authorization KMS
# Use a production KMS such as AWS KMS for production installs
# This key is the same key used in the worker configuration
kms "transit" {
  purpose         = "worker-auth"
  address         = "https://xxxx"
  token           = "s.xxxx"
  disable_renewal = "false"

  // Key configuration
  key_name        = "boundary-worker-auth"
  mount_path      = "transit/"
  namespace       = "ns1/"
}

# Recovery KMS block: configures the recovery key for Boundary
# Use a production KMS such as AWS KMS for production installs
kms "transit" {
  purpose         = "recovery"
  address         = "https://xxxx"
  token           = "s.xxxx"
  disable_renewal = "false"

  // Key configuration
  key_name        = "boundary-recovery"
  mount_path      = "transit/"
  namespace       = "ns1/"
}
EOF
fi

/bin/boundary database init -config /boundary/config/config.hcl
/bin/boundary server -config /boundary/config/config.hcl -log-level debug
```

So as you can see there are three (3) KMS blocks in the config. You may add your token that you just generated to each KMS block. Now you can see that we also have  a `Worker`, `Controller` and several `Listener` blocks. 
The controller stanza requires the root and worker-auth KMS blocks and a Postgres database. Our `docker-compose.yml` contains this already. 
For the Worker it is important to include the `public_addr`. If not included you may
not be able to connect to Boundary. In addition, the IPs that are provided as controllers that are found in the Worker block must be the same as those of the Listener of type cluster. Finally, we have three types of Listeners, Api, Proxy and
Cluster. Api and Proxy are important as those are the ports we will be using to connect to. That is to say ports 9200 and 9202. Cluster is an internal thing and uses the port 9201.

So now you can do a `docker-compose up --build -d` and make sure to record the information that Boundary spits out from the database migration. It contains your master password etc. `docker-compose logs -f boundary` will show you
the logs that contain the information you need to record.

Now you should be able to log into your Boundary setup with admin / some password.

In my next article, I will talk about Terraform and the Boundary provider.

## Final Words
So far so good with Boundary. However, I am still waiting on using Vault to store keys etc so I do not need to include them when SSHing into a host. But I have to say that Boundary is very stable. I can jump on and off of a VPN and the
session will remain! Anyhow, I have just started with Boundary, and I still have a lot to learn about it.
