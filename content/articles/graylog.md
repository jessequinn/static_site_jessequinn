---
title: Graylog 3 Trial and Error Walk-through
description: Graylog installation on Manjaro and discussion of a multi-node setup.
img: patrick-hendry-HBeI5X212lU-unsplash.jpg
alt: Graylog 3 Trial and Error Walk-through
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-10-28T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

First I need to state that I originally wanted a multi-node Graylog 3 install. However, that dream was put on hold as it was disastrous to setup. 

If we look at the [docs](http://docs.graylog.org/en/3.0/pages/configuration/multinode_setup.html) on the subject we will see that there are several prerequisites, regardless if you want single or multi-node, such as mongodb and elasticsearch.

Well with a single node we do not need to worry about this, but, if you would like a multi-node setup we need to make a replica set (```rs01```), and in retrospect, this could be where i went wrong. For instance, i used ```rs0```. Next, create the ```graylog``` database user with ```readWrite``` and ```dbAdmin``` rights. Sounds simple?

Let's look at the mongodb [docs](https://docs.mongodb.com/manual/tutorial/deploy-replica-set/) and also these [docs](https://docs.mongodb.com/v2.6/tutorial/deploy-replica-set-with-auth/) on making a replica set. Mongodb suggests making two accounts for authorization.

    use admin
    db.createUser( {
        user: "siteUserAdmin",
        pwd: "<password>",
        roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
    });
    db.createUser( {
        user: "siteRootAdmin",
        pwd: "<password>",
        roles: [ { role: "root", db: "admin" } ]
    });

This of course occurs with zero authorization enabled in the ```/etc/mongodb.conf``` (on manjaro):

    # security:
      # authorization: enabled

assuming you have this in the configuration file otherwise by default I believe, atleast with manjaro, mongodb has no authorization requirement... scary...

So, once those two admins are created you can stop the ```mongod``` service, again on manjaro, ```sudo systemctl stop mongodb```. I have assumed you already did the following:

    # need to install mongodb-bin from AUR
    yay mongodb-bin 
    sudo systemctl enable mongodb
    sudo systemctl start mongodb

Next we need to make a keyfile that allows all members access to the replica set:

    sudo openssl rand -base64 741 > /etc/mongodb-keyfile
    sudo chmod 600 mongodb-keyfile

Send this keyfile and place it in all members ```/etc``` folder or somewhere safe that mongodb can access it.

In my opinion it is best to use the configuration file to add the keyfile rather than directly adding to a systemd service:

    replication:
     replSetName: rs01
    security:
     authorization: enabled
     keyFile: /etc/mongodb-keyfile

as an example rather than 

    mongod --keyFile /etc/mongodb-keyfile --replSet "rs01"

Again, I believe that my error was using ```rs0```. So stick to what the graylog 3 docs say and use the ```rs01```.

    sudo systemctl start mongodb

check the service status and make sure that it is running otherwise refer to ```sudo journalctl -xe``` for errors.

login into mongodb 

    mongo -u siteRootAdmin -p <password>

initiate the replica set on the master node and include all mongodb servers (one per node)

    rs.initiate( {
        _id : "rs01",
        members: [
            { _id: 0, host: "mongodb0.example.net:27017" },
            { _id: 1, host: "mongodb1.example.net:27017" },
            { _id: 2, host: "mongodb2.example.net:27017" }
        ]
    })

confirm using ```rs.conf()``` and ensure the replica set has a primary (```rs.status```). 

**note** 

you do not need to perform the replica set on the other nodes just on the master. However, you do need to make the ```/etc/mongodb.conf``` the same in regards to stating the replication set and authorization with the keyfile.

Essentially the configuration file should look like this:

    # See http://www.mongodb.org/display/DOCS/File+Based+Configuration for format details
    # Run mongod --help to see a list of options
    
    systemLog:
     destination: file
     path: /var/log/mongodb/mongod.log
     logAppend: true
     quiet: true
    storage:
     journal:
      enabled: true
     dbPath: /var/lib/mongodb
    net:
     bindIp: 0.0.0.0 # for all ips, but one could use ip addr show to get the ip of the machine and place here 
     port: 27017
    replication:
     replSetName: rs01
    security:
     authorization: enabled
     keyFile: /etc/mongodb-keyfile


Finally create the graylog database user:

    use graylog
    db.createUser(
    {
        user: "productsDBAdmin",
        pwd: "<password>",
        roles:
        [{role: "readWrite", db: "graylog"}, {role: "dbAdmin", db: "graylog"}]
    })

From what i understand this is how you would setup the replica set and have a functional multi-node mongodb. If you only want the single-node setup, forget making the replica set and remove it from the configuration file as I did.

Now onto more potential headaches... 

    sudo pacman -S elasticsearch

Once elasticsearch is installed configure the the ```/etc/elasticsearch/elastichsearch.yml``` as such:

    cluster:
     name: <clustername>
    network:
     host: 0.0.0.0
    http:
     port: 9200

for single-node; however, again, some trial and error here, multi-node requires ```network.host```, ```discovery.zen.ping.unicast.hosts```, and ```node.name```. Refer to the [docs](https://www.elastic.co/guide/en/elasticsearch/reference/5.4/setup.html) for encrypted access. My configuration file uses YAML format, but you could also just use ```cluster.name: <clustername>``` as well.

**note**

```clustername``` needs to be same for all nodes and ```node.name``` needs to be unique.

I believe this is all that is required for the elasticsearch components.

The last step is to install and configure Graylog 3.

    yay graylog

We need to play around a lot to get the server correctly operating. For single node the following ```/etc/graylog/server/server.conf``` works for me.

    is_master = true
    node_id_file = /etc/graylog/server/crateris
    password_secret = <password> # read doc to generate with pwgen -N 1 -s 96
    root_username = admin
    root_password_sha2 = <password> # echo -n "Enter Password: " && head -1 </dev/stdin | tr -d '\n' | sha256sum | cut -d" " -f1
    plugin_dir = /usr/share/graylog/plugin
    http_bind_address = 0.0.0.0:9000
    #http_publish_uri = https://$http_bind_address
    #http_external_uri = https://0.0.0.0:9000/
    #http_enable_cors = true
    #http_enable_gzip = true
    #http_max_header_size = 8192
    #http_thread_pool_size = 16
    #http_enable_tls = true
    #http_tls_cert_file = /etc/graylog/server/cert.pem
    #http_tls_key_file = /etc/graylog/server/pkcs8-encrypted.pem
    #http_tls_key_password = <password>
    rotation_strategy = count
    #elasticsearch_hosts = http://127.0.0.1:9200
    elasticsearch_discovery_zen_ping_multicast_enabled = false  
    elasticsearch_discovery_zen_ping_unicast_hosts = 127.0.0.1:9200
    elasticsearch_max_docs_per_index = 20000000
    elasticsearch_max_number_of_indices = 20
    retention_strategy = delete
    elasticsearch_shards = 1
    elasticsearch_replicas = 0
    elasticsearch_index_prefix = graylog
    allow_leading_wildcard_searches = false
    allow_highlighting = false
    elasticsearch_analyzer = standard
    output_batch_size = 500
    output_flush_interval = 1
    output_fault_count_threshold = 5
    output_fault_penalty_seconds = 30
    processbuffer_processors = 5
    outputbuffer_processors = 3
    processor_wait_strategy = blocking
    ring_size = 65536
    inputbuffer_ring_size = 65536
    inputbuffer_processors = 2
    inputbuffer_wait_strategy = blocking
    message_journal_enabled = true
    message_journal_dir = /var/lib/graylog-server/journal
    lb_recognition_period_seconds = 3
    mongodb_uri = mongodb://<username>:<password>@127.0.0.1:27017/graylog?gssapiServiceName=mongodb
    mongodb_max_connections = 1000
    mongodb_threads_allowed_to_block_multiplier = 5
    content_packs_dir = /usr/share/graylog-server/contentpacks
    content_packs_auto_load = grok-patterns.json
    proxied_requests_thread_pool_size = 32


I believe for multi-node we need to modify the following settings:

    is_master = false # only one master all others false
    node_id_file = /etc/graylog/server/<unique-node-id>
    elasticsearch_hosts = # comma separated ips for all elasticsearch hosts
    elasticsearch_shards = # number of hosts
    mongodb_uri = mongodb://<username>:<password>@<ip>:27017/<ip>:27017/graylog?replicaSet="rs01"

Again, i reiterate, i never got it working correctly, so you need to read and play around. But if you end up getting a working multi-node setup let me know!

In regards to the Graylog 3 logs, I ended up using syslog-ng and adding the following to the ```/etc/syslog-ng/syslog.conf``` and filtering the graylog data to ```/var/log/graylog.log```:

    # Graylog configuration
    destination d_graylog { file("/var/log/graylog.log"); };
    filter f_graylog { program("graylog"); };
    log { source(src); filter(f_graylog); destination(d_graylog); };

I also like to forward all my syslog using TCP for Graylog to capture

    # Define TCP syslog destination.
    destination d_net { syslog("0.0.0.0" port(8514)); };
    log { source(src); destination(d_net); };

Lastly open all firewall ports if you haven't such as 9200, 27017, 9000, etc. for multi-node otherwise how can each member/node/etc communicate?
