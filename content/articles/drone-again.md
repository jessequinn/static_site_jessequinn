---
title: More on Drone.io
description: I have moved from `exec` style pipelines to the isolated `docker` pipeline.
img: diana-macesanu-fvPfMJL2wKw-unsplash.jpg
alt: More on Drone.io
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-11-09T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

Hi Guys,

So i decided to move away from the pipeline `exec` type and work with `docker` style pipelines. The syntax is nearly the same; however, a challenge at first was how to do some basic linux command stuff on the host ec2 instance. Nonetheless, I finally figured it out.. dah.. `rsync`!

Anyhow, this is a general script i wrote that does several things: 1) install  dependencies via composer; 2) install dependencies via yarn; 3) rsync into host and move stuff around and fix permissions etc; 4) tarball; 5) upload to s3; 6) email.

```yaml
kind: pipeline
type: docker
name: installs

# not needed but defined
platform:
  os: linux
  arch: amd64

# steps represent each progression in your CI/CD
steps:
# symfony dependencies installed
  - name: composer_development
    image: composer
    commands:
      - cp .env.dev.dist .env
      - composer install --ignore-platform-reqs --no-scripts
    when:
      branch:
        - develop

  - name: composer_production
    image: composer
    commands:
      - cp .env.prod.dist .env
      - composer install --ignore-platform-reqs --no-scripts
    when:
      branch:
        - master

# css, js, etc dependencies installed - webencore
  - name: yarn_development
    image: node
    commands:
      - yarn install
      - yarn run encore dev
    when:
      branch:
        - develop

  - name: yarn_production
    image: node
    commands:
      - yarn install
      - yarn run encore production
    when:
      branch:
        - master

# rsync into host using secrets
  - name: deploy_development
    image: drillster/drone-rsync
    environment:
      RSYNC_KEY:
        from_secret: rsync_key
      RSYNC_USER:
        from_secret: rsync_user
    settings:
      hosts:
        - host_ip # you can use an ip or url
      source: .
      target: /var/www/dev/jessequinn
      delete: true
      recursive: true
      script:
        - sudo rm -rf /var/www/dev/jessequinn/.git
        - sudo chown -R ubuntu:ubuntu /var/www/dev/jessequinn
        - sudo find /var/www/dev/jessequinn -type d -exec chmod 755 {} \;
        - sudo find /var/www/dev/jessequinn -type f -exec chmod 644 {} \;
        - sudo chmod 755 /var/www/dev/jessequinn/bin/console
        - php /var/www/dev/jessequinn/bin/console cache:clear --env=dev
        - php /var/www/dev/jessequinn/bin/console assets:install
    when:
      branch:
        - develop

  - name: deploy_production
    image: drillster/drone-rsync
    environment:
      RSYNC_KEY:
        from_secret: rsync_key
      RSYNC_USER:
        from_secret: rsync_user
    settings:
      hosts:
        - host_ip # you can use an ip or url
      source: .
      target: /var/www/jessequinn
      delete: true
      recursive: true
      script:
        - sudo rm -rf /var/www/jessequinn/.git
        - sudo chown -R ubuntu:ubuntu /var/www/jessequinn
        - sudo find /var/www/jessequinn -type d -exec chmod 755 {} \;
        - sudo find /var/www/jessequinn -type f -exec chmod 644 {} \;
        - sudo chmod 755 /var/www/jessequinn/bin/console
        - php /var/www/jessequinn/bin/console cache:clear --env=prod
        - php /var/www/jessequinn/bin/console assets:install
    when:
      branch:
        - master

#tarball
  - name: tarball
    image: alpine
    volumes:
      - name: cache
        path: /tarball
    commands:
      - rm -rf .git
      - tar cjf /tarball/${DRONE_COMMIT}.tar.bz2 .
    when:
      status:
        - success
      branch:
        - develop
        - master

#s3 upload
  - name: upload
    image: plugins/s3
    volumes:
      - name: cache
        path: /tarball
    settings:
      bucket: bucket_name # whatever your bucket name is
      access_key:
        from_secret: aws_access_key_id
      secret_key:
        from_secret: aws_secret_access_key
      source: /tarball/${DRONE_COMMIT}.tar.bz2
      target: /
    when:
      status:
        - success
      branch:
        - develop
        - master

#email - works with gmail and outlook
  - name: notify
    image: drillster/drone-email
    environment:
      EMAIL_HOST:
        from_secret: email_host
      EMAIL_USERNAME:
        from_secret: email_username
      EMAIL_PASSWORD:
        from_secret: email_password
    settings:
      from: noreply@some.email
      recipients:
        - recipient1@some.email
    when:
      status:
        - failure
        - changed
      branch:
        - develop
        - master

#define tmp folder that will be destroyed once pipeline is finished - used for tarball to be shared between steps
volumes:
  - name: cache
    temp: {}

#triggers for when to execute drone
trigger:
  branch:
    - master
    - develop
  event:
    - push
    - pull_request
```

**note** To use `docker pipelines` you need to run the `docker runner`. Because i also use `exec pipelines` you need to configure the port to something other than 3000.

```bash
docker run -d \
-v /var/run/docker.sock:/var/run/docker.sock \
--env-file=/var/drone.env \
-e DRONE_RUNNER_NAME=${HOSTNAME} \
-p 4000:4000 \
--restart always \
--name runner \
drone/drone-runner-docker:1
```

while `drone` should run as

```bash
docker run \
--volume=/var/run/docker.sock:/var/run/docker.sock \
--volume=/var/lib/drone:/data \
--env-file=/var/drone.env \
--publish=40080:80 \
--publish=40443:443 \
--restart=always \
--detach=true \
--name=drone \
drone/drone:1
```
