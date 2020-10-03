---
title: Drone Adventures
description: A brief look at drone.io - an automating testing and delivery software.
img: diana-macesanu-fvPfMJL2wKw-unsplash.jpg
alt: Drone Adventures
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-11-02T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

Although I am quite familiar with Jenkins I wanted to look at another automation software for development [Drone.io](https://drone.io/). What i have initially enjoyed about drone is the no fuss install or rather docker run command. Drone also supports numerous source control management providers. For instance, we need to `docker pull drone/drone:1` followed by assuming you are working with [Github](https://github.com/):

```
docker run \
  --volume=/var/lib/drone:/data \
  --env=DRONE_AGENTS_ENABLED=true \
  --env=DRONE_GITHUB_SERVER=https://github.com \
  --env=DRONE_GITHUB_CLIENT_ID=${DRONE_GITHUB_CLIENT_ID} \
  --env=DRONE_GITHUB_CLIENT_SECRET=${DRONE_GITHUB_CLIENT_SECRET} \
  --env=DRONE_RPC_SECRET=${DRONE_RPC_SECRET} \
  --env=DRONE_SERVER_HOST=${DRONE_SERVER_HOST} \
  --env=DRONE_SERVER_PROTO=${DRONE_SERVER_PROTO} \
  --publish=80:80 \
  --publish=443:443 \
  --restart=always \
  --detach=true \
  --name=drone \
  drone/drone:1
```

However, lets rewind for a moment. Before running the above command we need to configure our provider, in this case, [Github](https://github.com/). This is easily done by creating an `OAUTH` application under your account settings. The `consumer key` and `consumer secret` are what we need to include in the above command as `DRONE_GITHUB_CLIENT_ID` and `DRONE_GITHUB_CLIENT_SECRET`. We can use `openssl rand -hex 16` to generate the `DRONE_RPC_SECRET` and you will need to define `DRONE_SERVER_HOST` as the `url` you plan to use for your server while `DRONE_SERVER_PROTO` can be `http` or `https`. With all variables setup you are good to go!

Go to the url you have setup for drone and you should be presented with an authorization request for Github. Once authorized you should see all repositories that you have, both public and private. Activate a repo that you plan to use with drone. 

For drone to work with this repo we need to push a `.drone.yml` file. This is where the fun begins.  There are four types of runners - `docker`, `exec`, `ssh` and `digital ocean`. I use `exec` as I have no isolation requirements. The following example works with two branches and contains several conditions depending on the branch.  For most the `yaml` should be self explanatory as one of the key features of drone is the readability of the `yaml`. Further information can be found in the documentation, which is quite detailed!

```yaml
---
kind: pipeline
type: exec
name: default

platform:
  os: linux
  arch: amd64

steps:
  - name: prepare_production
    commands:
      - cp .env.prod.dist .env
    when:
      branch:
        - master

  - name: prepare_development
    commands:
      - cp .env.dev.dist .env
    when:
      branch:
        - develop

  - name: backend
    commands:
      - composer install

  - name: frontend_development
    commands:
      - yarn install
      - yarn run encore dev
    when:
      branch:
        - develop

  - name: frontend_production
    commands:
      - yarn install
      - yarn run encore production
    when:
      branch:
        - master

  - name: deploy_production
    commands:
      - rm -rf /var/www/jessequinn/*
      - rsync -avz --progress --exclude .git/ . /var/www/jessequinn/
      - chown -R www-data:www-data /var/www/jessequinn
      - find /var/www/jessequinn -type d -exec chmod 755 {} \;
      - find /var/www/jessequinn -type f -exec chmod 644 {} \;
    when:
      branch:
        - master

  - name: deploy_development
    commands:
      - rm -rf /var/www/dev/jessequinn/*
      - rsync -avz --progress --exclude .git/ . /var/www/dev/jessequinn/
      - chown -R www-data:www-data /var/www/dev/jessequinn
      - find /var/www/dev/jessequinn -type d -exec chmod 755 {} \;
      - find /var/www/dev/jessequinn -type f -exec chmod 644 {} \;
    when:
      branch:
        - develop
trigger:
  branch:
    - master
    - develop
  event:
    - push
    - pull_request
```

I want to make one important note. After pushing your `.drone.yml` to your service provider and no action takes place on your drone server then check the `webhooks` on your service provider. It could be possible that the `webhook url` that `drone` setup is wrong.
