---
title: An elastic stack with Redis "buffer"
description: A lengthy article on how to configure an elastic stack as a cluster with Redis and TLS/SSL.
img: eaters-collective-rS1GogPLVHk-unsplash.jpg
alt: An elastic stack with Redis "buffer"
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2020-07-04T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

## Introduction
I do enjoy working with [Docker-compose](https://docs.docker.com/compose/), [Elastic stack](https://www.elastic.co/), so I 
decided to quickly go through "the how" to set up a stack with TLS/SSL (self-signed), a cluster of Elasticsearches (same machine), and [Redis](https://redis.io/) 
as a "buffer" layer deployed in front of Logstash. However, Elastic already offers a 
pretty [intuitive guide](https://www.elastic.co/guide/en/elastic-stack-get-started/current/get-started-docker.html) on 
their site minus the Redis part. In addition, one could use [persisent queues](https://www.elastic.co/guide/en/logstash/current/persistent-queues.html),
which I will discuss in a later article, with logstash rather than Redis or Kafka, as a "buffer" layeryarn add prism-themes.

## Installation
Make sure you have Docker and Docker-compose installed.

We will create several important files, first:

```yaml[instances.yml]
instances:
  - name: es01
    dns:
      - es01
      - localhost
      - <some domain>
    ip:
      - 127.0.0.1
      - <some ip>

  - name: es02
    dns:
      - es02
      - localhost
    ip:
      - 127.0.0.1

  - name: es03
    dns:
      - es03
      - localhost
    ip:
      - 127.0.0.1

  - name: 'kibana'
    dns:
      - kibana
      - localhost
      - <some domain>
    ip:
      - 127.0.0.1
      - <some ip>

  - name: 'logstash'
    dns:
      - logstash
      - localhost
      - <some domain>
    ip:
      - 127.0.0.1
      - <some ip>
```

The `instances.yml` contains the necessary information to build our self-signed certificates that will be used for TLS/SSL between nodes, Logstash, etc. 
However, Kibana is more than likely not needed here as I create specific certificates via Let'sencrypt to handle HTTPS. 
Feel free to add/remove ips and dnses.

The next important file:

```yaml[create-certs.yml]
version: '3.8'

networks:
  elastic:
    driver: bridge

services:
  create_certs:
    image: docker.elastic.co/elasticsearch/elasticsearch:${VERSION}
    container_name: create_certs
    command: >
      bash -c '
        yum install -y -q -e 0 unzip;
        if [[ ! -f /certs/bundle.zip ]]; then
          bin/elasticsearch-certutil cert --silent --pem --in config/certificates/instances.yml -out /certs/bundle.zip;
          unzip /certs/bundle.zip -d /certs;
        fi;
        chown -R 1000:0 /certs
      '
    working_dir: /usr/share/elasticsearch
    volumes:
      - <some host mount>/elasticsearch/certs:/certs
      - .:/usr/share/elasticsearch/config/certificates
    networks:
      - elastic
```

The `create-certs.yml` will generate the self-signed certificates using the `elasticsearch-certutil` command provided by Elasticsearch.

Now we need to create a `.env` file:

```text[.env]
COMPOSE_PROJECT_NAME=es
CERTS_DIR=/usr/share/elasticsearch/config/certificates
VERSION=7.8.0
```

You can use the `.env` to place variables such as a password or a username.

To ingest correctly with Logstash we need to create a custom Dockerfile:

```dockerfile[Dockerfile]
ARG ELK_VERSION

# https://github.com/elastic/logstash-docker
FROM docker.elastic.co/logstash/logstash:${ELK_VERSION}

# Add your logstash plugins setup here
RUN logstash-plugin install logstash-input-beats &&\
    logstash-plugin install logstash-filter-json &&\
    logstash-plugin install logstash-filter-ruby &&\
    logstash-plugin install logstash-input-redis
```

We specifically need to install several inputs, and if you want, some filters.

As an example, I like to use the built in modules found in Filebeat along with their templates. So to maintain the correct ingestion
we need to use the ingest pipelines provided by Filebeat. But, before we get to that, we need to configure the `logstash.conf`:

```text[logstash.conf]
input {
  beats {
    port => 5044
  }

  redis {
    host => "redis"
    password => "CHANGEME"
    key => "filebeat"
    data_type => "list"
  }

  redis {
    host => "redis"
    password => "CHANGEME"
    key => "metricbeat"
    data_type => "list"
  }

}

output {
  if [@metadata][pipeline] {
    elasticsearch {
      hosts => "https://es01:9200"
      manage_template => false
      index => "%{[@metadata][beat]}-%{[@metadata][version]}"
      pipeline => "%{[@metadata][pipeline]}"
      cacert => "/usr/share/elasticsearch/config/certificates/ca/ca.crt"
      user => "logstash_writer"
      password => "CHANGEME"
    }
  } else {
    elasticsearch {
      hosts => "https://es01:9200"
      manage_template => false
      index => "%{[@metadata][beat]}-%{[@metadata][version]}"
      cacert => "/usr/share/elasticsearch/config/certificates/ca/ca.crt"
      user => "logstash_writer"
      password => "CHANGME"
    }
  }
}
```

We actually do not use any filters here; however, you are welcome to incorporate your own pipelines. For simplicity, 
I am using the built in [pipelines](https://www.elastic.co/guide/en/logstash/current/use-ingest-pipelines.html)
from Filebeat. To use them, we need to install them. `sudo filebeat setup --pipelines --modules system` as an example 
along with `sudo filebeat modules enable system` (sudo - assuming you are on linux). It must be noted, you need to already have 
Elasticsearch setup in both your `filebeat.yml` as an output along with Elasticsearch running. So running these commands are 
best left to last. In addition, you will notice that I am using `index => "%{[@metadata][beat]}-%{[@metadata][version]}"`. This format
works with the default policy rollover alias. So leave it as such unless you know what you are doing.

Finally, we need to create a `docker-compose.yml`:

```yaml[docker-compose.yml]
version: '3.8'

x-logging:
  &default-logging
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"

networks:
  elastic:
    driver: bridge

services:
  es01:
    image: docker.elastic.co/elasticsearch/elasticsearch:${VERSION}
    container_name: es01
    restart: always
    environment:
      - node.name=es01
      - cluster.name=es-docker-cluster
      - discovery.seed_hosts=es02,es03
      - cluster.initial_master_nodes=es01,es02,es03
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g" # change for production
      - xpack.license.self_generated.type=basic
      - xpack.security.enabled=true
      - xpack.security.http.ssl.enabled=true
      - xpack.security.http.ssl.key=$CERTS_DIR/es01/es01.key
      - xpack.security.http.ssl.certificate_authorities=$CERTS_DIR/ca/ca.crt
      - xpack.security.http.ssl.certificate=$CERTS_DIR/es01/es01.crt
      - xpack.security.transport.ssl.enabled=true
      - xpack.security.transport.ssl.verification_mode=certificate
      - xpack.security.transport.ssl.certificate_authorities=$CERTS_DIR/ca/ca.crt
      - xpack.security.transport.ssl.certificate=$CERTS_DIR/es01/es01.crt
      - xpack.security.transport.ssl.key=$CERTS_DIR/es01/es01.key
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - <some host mount>/elasticsearch/data/data01:/usr/share/elasticsearch/data:rw
      - <some host mount>/elasticsearch/certs:$CERTS_DIR:ro
    networks:
      - elastic
    ports:
      - 9200:9200
    healthcheck:
      test: curl --cacert $CERTS_DIR/ca/ca.crt -s https://localhost:9200 >/dev/null; if [[ $$? == 52 ]]; then echo 0; else echo 1; fi
      interval: 30s
      timeout: 10s
      retries: 5
    logging: *default-logging

  es02:
    image: docker.elastic.co/elasticsearch/elasticsearch:${VERSION}
    container_name: es02
    restart: always
    environment:
      - node.name=es02
      - cluster.name=es-docker-cluster
      - discovery.seed_hosts=es01,es03
      - cluster.initial_master_nodes=es01,es02,es03
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g" # change for production
      - xpack.license.self_generated.type=basic
      - xpack.security.enabled=true
      - xpack.security.http.ssl.enabled=true
      - xpack.security.http.ssl.key=$CERTS_DIR/es02/es02.key
      - xpack.security.http.ssl.certificate_authorities=$CERTS_DIR/ca/ca.crt
      - xpack.security.http.ssl.certificate=$CERTS_DIR/es02/es02.crt
      - xpack.security.transport.ssl.enabled=true
      - xpack.security.transport.ssl.verification_mode=certificate
      - xpack.security.transport.ssl.certificate_authorities=$CERTS_DIR/ca/ca.crt
      - xpack.security.transport.ssl.certificate=$CERTS_DIR/es02/es02.crt
      - xpack.security.transport.ssl.key=$CERTS_DIR/es02/es02.key
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - <some host mount>/elasticsearch/data/data02:/usr/share/elasticsearch/data:rw
      - <some host mount>/elasticsearch/certs:$CERTS_DIR:ro
    networks:
      - elastic
    logging: *default-logging

  es03:
    image: docker.elastic.co/elasticsearch/elasticsearch:${VERSION}
    container_name: es03
    restart: always
    environment:
      - node.name=es03
      - cluster.name=es-docker-cluster
      - discovery.seed_hosts=es01,es02
      - cluster.initial_master_nodes=es01,es02,es03
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g" # change for production
      - xpack.license.self_generated.type=basic
      - xpack.security.enabled=true
      - xpack.security.http.ssl.enabled=true
      - xpack.security.http.ssl.key=$CERTS_DIR/es03/es03.key
      - xpack.security.http.ssl.certificate_authorities=$CERTS_DIR/ca/ca.crt
      - xpack.security.http.ssl.certificate=$CERTS_DIR/es03/es03.crt
      - xpack.security.transport.ssl.enabled=true
      - xpack.security.transport.ssl.verification_mode=certificate
      - xpack.security.transport.ssl.certificate_authorities=$CERTS_DIR/ca/ca.crt
      - xpack.security.transport.ssl.certificate=$CERTS_DIR/es03/es03.crt
      - xpack.security.transport.ssl.key=$CERTS_DIR/es03/es03.key
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - <some host mount>/elasticsearch/data/data03:/usr/share/elasticsearch/data:rw
      - <some host mount>/elasticsearch/certs:$CERTS_DIR:ro
    networks:
      - elastic
    logging: *default-logging

  kibana:
    image: docker.elastic.co/kibana/kibana:${VERSION}
    container_name: kibana
    restart: always
    environment:
      ELASTICSEARCH_URL: https://es01:9200
      ELASTICSEARCH_HOSTS: https://es01:9200
      ELASTICSEARCH_USERNAME: kibana_system
      ELASTICSEARCH_PASSWORD: CHANGME # change with new password after generating
      ELASTICSEARCH_SSL_CERTIFICATEAUTHORITIES: $CERTS_DIR/ca/ca.crt
      SERVER_SSL_ENABLED: "true"
      SERVER_SSL_KEY: /usr/share/elasticsearch/config/letsencrypt/live/<some domain>/privkey.pem
      SERVER_SSL_CERTIFICATE: /usr/share/elasticsearch/config/letsencrypt/live/<some domain>/cert.pem
   depends_on:
      - es01
    volumes:
      - ./docker/letsencrypt:/usr/share/elasticsearch/config/letsencrypt:ro
      - <some host mount>/elasticsearch/certs:$CERTS_DIR:ro
      - ./docker/kibana/kibana.yml:/usr/share/kibana/config/kibana.yml:ro
    networks:
      - elastic
    ports:
      - 5601:5601
    logging: *default-logging

  dnsrobocert:
    image: adferrand/dnsrobocert:latest
    container_name: dnsrobocert
    restart: always
    volumes:
      - ./docker/dnsrobocert:/etc/dnsrobocert
      - ./docker/letsencrypt:/etc/letsencrypt
    networks:
      - elastic
    logging: *default-logging

  redis:
    image: redis:5.0-alpine
    container_name: redis
    restart: always
    command: redis-server --requirepass <some_long_password>
    volumes:
      -  <some host mount>/redis/data:/data
    ports:
      - 6379:6379
    networks:
      - elastic
    logging: *default-logging

  logstash:
    build:
      context: ./docker/logstash/
      dockerfile: Dockerfile
      args:
        ELK_VERSION: $VERSION
    container_name: logstash
    restart: always
    environment:
      - "LS_JAVA_OPTS=-Xms1g -Xmx1g" # change for production
      - xpack.monitoring.enabled=true
      - xpack.monitoring.elasticsearch.username=logstash_system
      - xpack.monitoring.elasticsearch.password=CHANGEME # place new password here after generating
      - xpack.monitoring.elasticsearch.hosts=['https://es01:9200']
      - xpack.monitoring.elasticsearch.ssl.certificate_authority=$CERTS_DIR/ca/ca.crt
      - xpack.security.transport.ssl.enabled=true
      - xpack.security.transport.ssl.verification_mode=certificate
      - xpack.security.transport.ssl.certificate_authorities=$CERTS_DIR/ca/ca.crt
      - xpack.security.transport.ssl.certificate=$CERTS_DIR/logstash/logstash.crt
      - xpack.security.transport.ssl.key=$CERTS_DIR/logstash/logstash.key
    depends_on:
      - es01
    volumes:
      - ./docker/logstash/config/logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
      - ./docker/logstash/patterns/:/usr/share/logstash/patterns/:ro
      - <some host mount>/elasticsearch/certs:$CERTS_DIR:ro
    ports:
      - 5044:5044 # filebeat
    networks:
      - elastic
    healthcheck:
      test: curl -s -XGET 'http://127.0.0.1:9600'
      interval: 60s
      timeout: 50s
      retries: 5
    logging: *default-logging
```

Quick note, I use `dnsrobocert` to create SSL certs via DNS. You may not require this.

We can now run the following commands to build our system:

```bash
# create certificates (TLS)
docker-compose -f create-certs.yml run --rm create_certs
# start stack
docker-compose up --build -d
# create passwords for Elasticsearch
docker exec es01 /bin/bash -c "bin/elasticsearch-setup-passwords \
auto --batch \
--url https://es01:9200"
```

Once the passwords have been generated, shutdown (`docker-compose stop`) your stack and update the `docker-compose.yml` with the new passwords. 
The same goes for any other files that may require these
new passwords. Once updated, you may `docker-compose up -d`.

To create the user needed for Logstash we can run the following inside the `dev-tools` of Kibana:

```text
POST /_security/role/logstash_write_role
{
  "cluster": [
    "monitor",
    "manage_index_templates"
  ],
  "indices": [
    {
      "names": [
        "logstash*",
        "filebeat*",
        "metricbeat*"
      ],
      "privileges": [
        "write",
        "create_index"
      ],
      "field_security": {
        "grant": [
          "*"
        ]
      }
    }
  ],
  "run_as": [],
  "metadata": {},
  "transient_metadata": {
    "enabled": true
  }
}

POST /_security/user/logstash_writer
{
  "username": "logstash_writer",
  "roles": [
    "logstash_write_role"
  ],
  "full_name": null,
  "email": null,
  "password": "<SOME PASSWORD>",
  "enabled": true
}
```

Make sure to pick a good password. This user/role allows Logstash to create indices and update them. You will probably need to restart Logstash
`docker-compose stop logstash && docker-compose up -d logstash`.

As an example with Filebeat:

```yaml[filebeat.yml]
filebeat.config.modules:
  path: ${path.config}/modules.d/*.yml
  reload.enabled: false

#setup.template.settings:
#  index.number_of_shards: 1

#setup.template.name: "filebeat-"
#setup.template.pattern: "filebeat-*"

#setup.dashboards.enabled: true

#setup.kibana:
#  host: "localhost:5601"
#  protocol: "https"
#  username: "elastic"
#  password: "CHANGME"

#output.elasticsearch:
#  enabled: true
#  hosts: ["localhost:9200"]
#  protocol: "https"
#  username: "elastic"
#  password: "CHANGME"
#  ssl.enabled: true
#  ssl.certificate_authorities: ["<some host mount>/elasticsearch/certs/ca/ca.crt"]
#  ssl.certificate: "<some host mount>/elasticsearch/certs/es01/es01.crt"
#  ssl.key: "<some host mount>/elasticsearch/certs/es01/es01.key"

output.redis:
  hosts: ["localhost"]
  password: "CHANGEME"
  key: "filebeat"
  db: 0
  timeout: 5
  data_type: "list"

processors:
  - add_host_metadata: ~
  - add_cloud_metadata: ~
  - add_docker_metadata: ~
  - add_kubernetes_metadata: ~
```

Uncomment the setup and output.elasticsearch sections and comment out the output.redis section to install the Kibana templates, index, etc.
This is also when you need to run the Filebeat commands mentioned above. Once done, return the comments and uncomment the output.redis section. 
One note, you do not need to run the same commands with Metricbeat as Metricbeat does not, from what I can find, have any ingest pipelines.

Best of luck. You should now have a working Elastic stack! 

## Final Words
Although complex to configure, an Elastic stack along with Beats (i.e. Filebeat, Metricbeat, etc.) creatures an amazing system for monitoring metrics and
logs alike.
