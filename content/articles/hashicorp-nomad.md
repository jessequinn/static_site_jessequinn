---
title: Become nomadic on Digitalocean
description: I discuss the installation and configuration of Consul, Valut and Nomad. In addition, Nomad scheduling.
img: adi-yusuf-j-UTH7jAnUs-unsplash.jpg
alt: Become nomadic on Digitalocean
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2020-10-18T03:00:00.000Z
updateAt: 2020-10-18T03:00:00.000Z
---

## Introduction
In previous articles I introduced [Packer](https://jessequinn.info/blog/articles/hashicorp-packer) and 
[Terraform](https://jessequinn.info/blog/articles/hashicorp-terraform). In those two articles I did not discuss the files that 
were copied and executed remotely. To some degree, this will be the focus of this article in addition to configuring Nomad jobs. So to sum up quickly,
I will briefly discuss the installation and configuration of [Consul](https://www.consul.io/), [Vault](https://www.vaultproject.io/) 
and [Nomad](https://www.nomadproject.io/) to create a simple Nomad cluster on [DigitalOcean](https://m.do.co/c/6ceb645458ec). However, it is recommended
to quickly go through the "Get Started Tutorials" for each product to get a better understanding. I emphasize that I do not 
utilize each product for all its capabilities.

## Configuration
Performing a `tree` of the packer directory, minus some folders, I have the following:

```bash
packer
├── consul
│ ├── configure_consul.sh
│ ├── consul-client.service
│ ├── consul-connect-enable.hcl
│ └── consul-server.service
├── nomad
│ ├── configure_nomad.sh
│ ├── jobs
│ │ ├── jessequinn.nomad
│ │ ├── scidoc.nomad
│ │ └── traefik.nomad
│ ├── nomad-client.hcl
│ ├── nomad-client.service
│ ├── nomad-server.hcl
│ └── nomad-server.service
└── vault
    ├── enable_vault.sh
    ├── init_vault.sh
    ├── vault-config.hcl
    └── vault-server.service
```

I will go through each folder starting with consul.

### Consul
With Packer, I copied four (4) files over to a snapshot. Rather than creating snapshots for server and client I just placed all files into the snapshot.
The first file:

```shell script[configure_consul.sh]
#! /bin/bash

echo "Configuring Consul\n"

mkdir /tmp/consul

if [ $1 == "server" ]; then
	systemctl enable consul-server.service
	systemctl start consul-server.service
else
	systemctl enable consul-client.service
	systemctl start consul-client.service
  	sleep 30
	consul join $2
fi

echo "Configuration of Consul complete\n"
exit 0
```

is simply a `bash` script to enable the Consul service depending on type of node. Then the next file:

```ini[consul-client.service]
[Unit]
Description=Consul client
Wants=network-online.target
After=network-online.target
[Service]
ExecStart= /bin/sh -c "consul agent -data-dir=/tmp/consul -node=agent-c-node_number -bind=$(ip -f inet addr show eth1 | sed -En -e 's/.*inet ([0-9.]+).*/\1/p') -enable-script-checks=true -config-dir=/etc/consul.d"
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
```

is just the client service for `systemd`. A good tutorial on systemd can be found on
[DigitalOcean](https://www.digitalocean.com/community/tutorials/understanding-systemd-units-and-unit-files). The important line
is the `ExecStart`. We basically tell consul to run as a worker node, provide a node name, bind the private ip, [enable script checks](https://www.consul.io/docs/discovery/checks), 
and finally define the location of the config file.

The systemd service for servers:

```ini[consul-server.service]
[Unit]
Description=Consul server
Wants=network-online.target
After=network-online.target
[Service]
ExecStart= /bin/sh -c "consul agent -server -bootstrap-expect=server_count -data-dir=/tmp/consul -node=agent-s-node_number -bind=$(ip -f inet addr show eth1 | sed -En -e 's/.*inet ([0-9.]+).*/\1/p') -enable-script-checks=true -config-file=/root/consul-connect-enable.hcl -config-dir=/etc/consul.d"
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
```

runs the consul agent in server mode bootstrapping with an expected server count, I use one (1), although we should use three (3) or more servers, and provide a config file: 

```hcl[consul-connect-enable.hcl]
{
  "connect" : {
  "enabled": true
  }
}
```

within the configuration we enable [connect](https://www.consul.io/docs/guides/connect-gateways).

Just a quick note, in several files we are using placeholders for values, placeholders that would be processed by `sed` in Terraform.

### Vault
Just like Consul, I utilize a bash script to enable and start the Vault server. Unlike Consul, I only install vault on the server:

```bash[enable_vault.sh]
#! /bin/bash

echo "Enabling Vault on server\n"

systemctl enable vault-server.service
systemctl start vault-server.service

export VAULT_ADDR=http://127.0.0.1:8200

echo "Enabled Vault complete\n"
exit 0
```

We need to initialize Vault:

```bash[init_vault.sh]
#! /bin/bash

echo "Initialize Vault on server\n"

export VAULT_ADDR=http://127.0.0.1:8200

if [ $1 == "0" ]; then
	vault operator init -address=http://127.0.0.1:8200 > /root/startupOutput.txt
	vault operator unseal -address=http://127.0.0.1:8200 `grep "Unseal Key 1" /root/startupOutput.txt | cut -d' ' -f4`
	vault operator unseal -address=http://127.0.0.1:8200 `grep "Unseal Key 2" /root/startupOutput.txt | cut -d' ' -f4`
	vault operator unseal -address=http://127.0.0.1:8200 `grep "Unseal Key 3" /root/startupOutput.txt | cut -d' ' -f4`
fi

echo "Initialized Vault complete\n"
exit 0
```

Terraform actually uses a local execution to back up the information. Why? You will need these keys with Vault to unseal it. For instance, when restarting Vault.

The systemd service:

```ini[vault-server.service]
[Unit]
Description=Vault server
Wants=network-online.target
After=network-online.target
[Service]
ExecStart= /bin/sh -c "/usr/bin/vault server -config=/root/vault-config.hcl"
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
```

Vault is ran in server mode with the following configuration:

```hcl[vault-config.hcl]
storage "consul" {
  address = "127.0.0.1:8500"
  path    = "vault/"
}

listener "tcp" {
  address     = "127.0.0.1:8200"
  tls_disable = 1
}
```

Consul is used as the kv storage. I also disable tls and define the listening address and port.

### Nomad
Once again I have a simple bash script to enable server and client services:

```bash[configure_nomad.sh]
#! /bin/bash

echo "Configuring Nomad\n"

if [ $1 == "server" ]; then
  systemctl enable nomad-server.service
  systemctl start nomad-server.service
else
  systemctl enable nomad-client.service
  systemctl start nomad-client.service
fi

echo "Configuration of Nomad complete\n"
exit 0
```

The server service:

```ini[nomad-server.service]
[Unit]
Description=Nomad server
Wants=network-online.target
After=network-online.target
[Service]
Environment="VAULT_TOKEN=replace_vault_token"
ExecStart= /bin/sh -c "/usr/bin/nomad agent -config /root/nomad-server.hcl"
Restart=always
RestartSec=10000
[Install]
WantedBy=multi-user.target
```

is configured with the following:

```hcl[nomad-server.hcl]
# Increase log verbosity
log_level = "DEBUG"

# Setup data dir
data_dir = "/tmp/server"

bind_addr = "server_ip" # edit to private network

advertise {
  # Edit to the private IP address.
  http = "server_ip:4646"
  rpc  = "server_ip:4647"
  serf = "server_ip:4648" # non-default ports may be specified
}

# Enable the server
server {
  enabled = true

  # Self-elect, should be 3 or 5 for production
  bootstrap_expect = server_count
}

# Enable a client on the same node
client {
  enabled = true
  options = {
    "driver.raw_exec.enable" = "1"
  }
}

consul {
  address             = "127.0.0.1:8500"
  server_service_name = "nomad"
  client_service_name = "nomad-client"
  auto_advertise      = true
  server_auto_join    = true
  client_auto_join    = true
}

vault {
  enabled = true
  address = "http://127.0.0.1:8200"
}
```

so my Nomad server has integrated [Vault](https://www.nomadproject.io/docs/integrations/vault-integration) and [Consul](https://www.nomadproject.io/docs/integrations/consul-integration) 
on the respective localhost ports. I only use boostrap_expect = 1 as I am using just one server. All other options should be self-explanatory.

The client service:

```ini[nomad-client.service]
[Unit]
Description=Nomad client
Wants=network-online.target
After=network-online.target
[Service]
ExecStart= /bin/sh -c "/usr/bin/nomad agent -config /root/nomad-client.hcl"
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
```

is configured with:

```hcl[nomad-client.hcl]
# Increase log verbosity
log_level = "DEBUG"

# Setup data dir
data_dir = "/tmp/client"

# Enable the client
client {
  enabled = true
}

ports {
  http = 5657
}

consul {
  address             = "127.0.0.1:8500"
  server_service_name = "nomad"
  client_service_name = "nomad-client"
  auto_advertise      = true
  server_auto_join    = true
  client_auto_join    = true
}

# Disable the dangling container cleanup to avoid interaction with other clients
plugin "docker" {
  config {
    gc {
      dangling_containers {
        enabled = false
      }
    }
  }
}
```

If I perform `netstat -tulpn` on the server, the following is returned:

```bash
root@server-1:~# netstat -tupln
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 xxxx:8300               0.0.0.0:*               LISTEN      594/consul          
tcp        0      0 xxxx:8301               0.0.0.0:*               LISTEN      594/consul          
tcp        0      0 xxxx:8302               0.0.0.0:*               LISTEN      594/consul          
tcp        0      0 127.0.0.1:8200          0.0.0.0:*               LISTEN      592/vault           
tcp6       0      0 :::8500                 :::*                    LISTEN      594/consul          
tcp6       0      0 :::8600                 :::*                    LISTEN      594/consul          
tcp6       0      0 :::5657                 :::*                    LISTEN      614677/nomad        
tcp6       0      0 :::4646                 :::*                    LISTEN      583/nomad           
tcp6       0      0 :::4647                 :::*                    LISTEN      583/nomad           
tcp6       0      0 :::4648                 :::*                    LISTEN      583/nomad           
udp        0      0 xxxx:8301               0.0.0.0:*                           594/consul          
udp        0      0 xxxx:8302               0.0.0.0:*                           594/consul          
udp6       0      0 :::8600                 :::*                                594/consul          
udp6       0      0 :::4648                 :::*                                583/nomad           
```

### Job Scheduling
Before beginning here I would suggest reading more on [jobs](https://learn.hashicorp.com/tutorials/nomad/get-started-jobs?in=nomad/get-started).

I could use `nomad job init jessequinn.nomad` to create a nomad job file; however, I have already written one:

```hcl[jessequinn.nomad]
job "jessequinn" {
  datacenters = ["dc1"]
  name = "jessequinn"

  update {
    stagger = "10s"
    max_parallel = 1
  }

  group "jessequinn" {
    count = 2

    task "jessequinn" {
      env {
        PORT = 3000
      }

      driver = "docker"

      config {
        image = "xxxx/xxxx:xxxx"
        network_mode = "host"
        port_map = {
          http = 3000
        }
      }

      service {
        name = "jessequinn"
        tags = [
          "traefik.enable=true",
          "traefik.http.routers.jessequinn.rule=Host(`jessequinn.info`)",
          "traefik.http.routers.jessequinn.entrypoints=websecure",
          "traefik.http.routers.jessequinn.service=jessequinn",
          "traefik.http.services.jessequinn.loadbalancer.server.port=3000",
          "traefik.http.routers.jessequinn.tls=true",
          "traefik.http.routers.jessequinn.tls.certresolver=myresolver",
          "traefik.http.routers.jessequinn.tls.domains[0].main=jessequinn.info",
          "traefik.http.routers.jessequinn.tls.domains[0].sans=*.jessequinn.info",
          "jessequinn"
        ]
        port = "http"

        check {
          type = "http"
          path = "/"
          interval = "2s"
          timeout = "2s"
        }
      }

      resources {
        cpu    = 500
        memory = 500

        network {
          mbits = 10

          port "http" {
            static = 3000
          }
        }
      }
    }
  }
}
```

The `jessequinn.nomad` job has a single task that pulls an image of my site, designates [Docker](https://www.docker.com/) as the engine, creates a service that includes tags for [Traefik](https://traefik.io/) 
and finally specifies the resources for each replica. The
idea here is very similar to that of any orchestration system like 
[Docker Swarm](https://docs.docker.com/engine/swarm/), [K8S](https://kubernetes.io/), etc. Without battling about 
performance and such I decided to use Traefik for the
native support of [Let'sEncrypt](https://letsencrypt.org/). However, Nomad has examples for 
HAProxy, Fabio, NGINX, etc.

I also decided not to use a load balancer from DO due to price and SSL/TLS certificate limitation.

The following is the Traefik job:

```hcl[]
job "traefik" {
  region      = "global"
  datacenters = ["dc1"]
  type        = "service"

  constraint {
    attribute = "${node.unique.name}"
    operator  = "="
    value     = "server-1"
  }

  group "traefik" {
    count = 1

    task "traefik" {
      env {
        DO_AUTH_TOKEN = "xxxx"
      }

      driver = "docker"

      config {
        image        = "traefik:v2.3"
        network_mode = "host"

        volumes = [
          "local/traefik.toml:/etc/traefik/traefik.toml",
          "local/acme.json:/acme.json",
          "local/dyn/:/dyn/",
        ]
      }

      template {
        data = <<EOF
{
  "myresolver": {
    "Account": {
      "Email": "xxxx",
      "Registration": {
        "body": {
          "status": "valid",
          "contact": [
            "mailto:xxxx"
          ]
        },
        "uri": "xxxx"
      },
      "PrivateKey": "xxxx",
      "KeyType": "4096"
    },
    "Certificates": [
      {
        "domain": {
          "main": "jessequinn.info"
        },
        "certificate": "xxxx",
        "key": "xxxx",
        "Store": "default"
      },
      {
        "domain": {
          "main": "scidoc.dev"
        },
        "certificate": "xxxx",
        "key": "xxxx",
        "Store": "default"
      },
      {
        "domain": {
          "main": "*.jessequinn.info"
        },
        "certificate": "xxxx",
        "key": "xxxx",
        "Store": "default"
      },
      {
        "domain": {
          "main": "*.scidoc.dev"
        },
        "certificate": "xxxx",
        "key": "xxxx",
        "Store": "default"
      }
    ]
  }
}
EOF

        destination = "local/acme.json"
        perms = "600"
      }

      template {
        data = <<EOF
# Global redirection: http to https
[http.routers.http-catchall]
  rule = "HostRegexp(`{host:(www\\.)?.+}`)"
  entryPoints = ["web"]
  middlewares = ["wwwtohttps"]
  service = "noop"

# Global redirection: https (www.) to https
[http.routers.wwwsecure-catchall]
  rule = "HostRegexp(`{host:(www\\.).+}`)"
  entryPoints = ["websecure"]
  middlewares = ["wwwtohttps"]
  service = "noop"
  [http.routers.wwwsecure-catchall.tls]

# middleware: http(s)://(www.) to  https://
[http.middlewares.wwwtohttps.redirectregex]
  regex = "^https?://(?:www\\.)?(.+)"
  replacement = "https://${1}"
  permanent = true

# NOOP service
[http.services.noop]
  [[http.services.noop.loadBalancer.servers]]
    url = "http://192.168.0.1:666"
EOF

        destination = "local/dyn/global_redirection.toml"
      }

      template {
        data = <<EOF
[entryPoints]
  [entryPoints.web]
    address = ":80"

    [entryPoints.web.http]
      [entryPoints.web.http.redirections]
        [entryPoints.web.http.redirections.entryPoint]
          to = "websecure"
          scheme = "https"

  [entryPoints.websecure]
    address = ":443"

  [entryPoints.traefik]
    address = ":8081"

[api]
    dashboard = true
    insecure  = true

[providers.file]
  directory = "dyn/"

# Enable ACME (Let's Encrypt): automatic SSL.
[certificatesResolvers.myresolver.acme]
  email = "xxxx"
  storage = "acme.json"

  [certificatesResolvers.myresolver.acme.dnsChallenge]
    provider = "digitalocean"
    delayBeforeCheck = 0

# Enable Consul Catalog configuration backend.
[providers.consulCatalog]
    prefix = "traefik"
    exposedByDefault = false

    [providers.consulCatalog.endpoint]
      address = "127.0.0.1:8500"
      scheme  = "http"
EOF

        destination = "local/traefik.toml"
      }

      resources {
        cpu    = 100
        memory = 128

        network {
          mbits = 10

          port "http" {
            static = 80
          }

          port "https" {
            static = 443
          }

          port "api" {
            static = 8081
          }
        }
      }

      service {
        name = "traefik"

        tags = [
          "traefik"
        ]

        check {
          name     = "alive"
          type     = "tcp"
          port     = "http"
          interval = "10s"
          timeout  = "2s"
        }
      }
    }
  }
}
```

I basically include the `toml` configuration file for Traefik and `acme.json` for Let's Encrypt to utilize. I suggest reading on Traefik if you do not understand what is happening. But in short, I am redirecting www to jessequinn.info
and http to https amongst other things. One other thing, I set a constraint to server-1 as I want this server to act as a load balancer. This way I can actually use Terraform to 
set A record for www. and @.

Now we can schedule the job:

```bash
nomad plan job -address=http://private_ip:4646 jessequinn.nomad 
nomad run job -address=http://private_ip:4646 jessequinn.nomad 
nomad job status -address=http://private_ip:4646 jessequinn
```

Quick tip:

```
# nomad ui
ssh -L 4646:localhost:4646 username@server_ip

# traefik ui
ssh -L 8081:localhost:8081 username@server_ip
```

You can also tunnel into your UIs to see what is happening.

## Final Words
I cannot say I prefer Nomad over Kubernetes or Kubernetes over Nomad, but I do find that Nomad is becoming more and more interesting to work with. I like the fact we can use 
other drivers. HOWEVER, I do not
like how overly complicated Nomad is to configure HAProxy. In fact, I could not get it to work correctly!

In the end, the suite of products that Hashicorp offers are just fantastic. At work, I implemented Vault/Consul I just love it! I also test Ansible with Vagrant on a regular basis. Now that [Boundary](https://www.boundaryproject.io/) was released I will definitely consider using it.
