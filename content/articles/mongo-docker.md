---
title: Dockerizing a Mongodb Replica Set
description: Just a quick and informative post about creating a replicate set with Mongodb and Docker-compose.
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: Dockerizing a Mongodb Replica Set
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-12-28T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

Just a quick post as I am working on updating a recent Go project from ORM to ODM (Mongodb) so I wanted to show how I quickly configured a Mongodb replicate set with [Docker-compose](https://docs.docker.com/compose/) following an article I found on google [here](https://qiita.com/usabarashi/items/3854a1da0e47feb93ba0). The reason for the change is simply for scalability (work related) and sheer interests (personal growth). A great read on the subject of replication can be found [here](https://docs.mongodb.com/manual/replication/).

You can read a great deal about [Compose](https://docs.docker.com/compose/) to get a better understanding; but I believe it is quite easy to understand the `yaml|yml` file. The following `docker-compose.yml`

---

**important**

You will need to run docker twice. Once with the environment variables while having commented out the `entrypoint` followed by the opposite. The reason for this is quite simple. When `mongo1` uses the environment variables it creates the user `root` in the `admin` database while also running `--auth`. To properly configure the replica set you first need to create the authentication.  I believe having the `entrypoint` the way it is causes a problem trying to do everything in one shot. 

---

```
version: '3.7'

services:
    mongo1:
        hostname: mongo1
        container_name: gogqlserver_mongo1
        image: mongo:4.2.2-bionic
        restart: unless-stopped
#        environment:
#            MONGO_INITDB_ROOT_USERNAME: root
#            MONGO_INITDB_ROOT_PASSWORD: password
#            MONGO_INITDB_DATABASE: admin
        expose:
            - 27017
        ports:
            - 27017:27017
        volumes:
            - ./docker/mongo/etc/mongod-keyfile:/etc/mongod-keyfile:ro # Permission: 400
            - ./docker/mongo/root:/root:ro
#            - ./docker/mongo/volume:/data/db
#            - ./docker/mongo/config:/data/configdb
        entrypoint: [ "/usr/bin/mongod", "--auth", "--keyFile", "/etc/mongod-keyfile", "--bind_ip_all", "--replSet", "rs0" ]
        depends_on:
          - mongo2
          - mongo3
        
    mongo2:
        hostname: mongo2
        container_name: gogqlserver_mongo2
        image: mongo:4.2.2-bionic
        restart: unless-stopped
        expose:
            - 27017
        ports:
            - 27018:27017
        volumes:
            - ./docker/mongo/etc/mongod-keyfile:/etc/mongod-keyfile:ro # Permission: 400
        entrypoint: [ "/usr/bin/mongod", "--auth", "--keyFile", "/etc/mongod-keyfile", "--bind_ip_all", "--replSet", "rs0" ]
        depends_on:
          - mongo3

    mongo3:
        hostname: mongo3
        container_name: gogqlserver_mongo3
        image: mongo:4.2.2-bionic
        restart: unless-stopped
        expose:
            - 27017
        ports:
            - 27019:27017
        volumes:
            - ./docker/mongo/etc/mongod-keyfile:/etc/mongod-keyfile:ro # Permission: 400
        entrypoint: [ "/usr/bin/mongod", "--auth", "--keyFile", "/etc/mongod-keyfile", "--bind_ip_all", "--replSet", "rs0" ]

    mongo-express:
        container_name: gogqlserver_mongo_express
        image: mongo-express:0.49.0
        restart: unless-stopped
        ports:
            - 8081:8081
        environment:
            ME_CONFIG_MONGODB_SERVER: 'mongo1,mongo2,mongo3'
            ME_CONFIG_MONGODB_ADMINUSERNAME: root
            ME_CONFIG_MONGODB_ADMINPASSWORD: password
        depends_on:
          - mongo1
          - mongo2
          - mongo3
```

contains three mongo containers with the primary as `mongo1`. I have also included `mongo-express` an admin interface to use as a playground for `mongo`. However, before accessing `http://localhost:8081` - the `mongo-express` admin site we need to run a command `rs.initiate()`.  We will need three scripts and one keyfile with the following structure.

```bash
docker/mongo
├── etc
│   └── mongod-keyfile
└── root
    ├── 000_init_replicaSet.js
    ├── 001_init_database.js
    └── 002_init_user.js
```

000_init_replicaSet.js

```javascript
rs.initiate(
    {
        _id: "rs0",
        members: [
            {_id: 0, host: "mongo1:27017"},
            {_id: 1, host: "mongo2:27017"},
            {_id: 2, host: "mongo3:27017", arbiterOnly: true}
        ]
    }
);
```

001_init_database.js

```javascript
var testdb = db.getSiblingDB('test');

testdb.createCollection('test');
```

002_init_user.js

```javascript
var testdb = db.getSiblingDB('test');

testdb.createUser(
    {
        user: 'test',
        pwd: 'password',
        roles: [
            {
                role: 'root', db: 'admin'
            },
            {
                role: 'dbOwner', db: 'test'
            }
        ]
    }
);

testdb.getUsers();
```

and finally 

```bash
openssl rand -base64 756 > docker/mongo/etc/mongod-keyfile
chmod 400 docker/mongo/etc/mongod-keyfile
```

You can also use the following script as well but you still need to manually edit the `docker-compose.yml` and run the script twice.  I suppose i could add several `sed` commands to do the work.

```sh
#!/bin/sh
docker-compose stop
docker-compose up --build --remove-orphans -d
sleep 2
docker-compose exec mongo1 mongo admin -u root -p password /root/000_init_replicaSet.js
docker-compose exec mongo1 mongo admin -u root -p password /root/001_init_database.js
docker-compose exec mongo1 mongo admin -u root -p password /root/002_init_user.js
```

In the end you should have a functional authenticated replica set with Mongo. Do not forget that you need to use `rs.slaveOk()` on secondary and as well use your user account to access Mongo. The user created by the environment variables only exists in the admin database.
