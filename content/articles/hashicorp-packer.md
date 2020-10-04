---
title: Get packing with Packer on Digitalocean
description: I run through how to create an image (snapshot) on DigitalOcean with Packer.
img: radowan-nakif-rehan-qgXz4qXViCg-unsplash.jpg
alt: Get packing with Packer on Digitalocean
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2020-10-03T03:00:00.000Z
updateAt: 2020-10-04T03:00:00.000Z
---

## Introduction
Hashicorp's Packer is an image automation tool. I will briefly discuss the configuration of an image template 
to create a snapshot (image) of Ubuntu 20.04 LTS on [DigitalOcean](https://m.do.co/c/6ceb645458ec). I will quickly add that this article will be a part of a series
of Hashicorp related articles. I will, in future, present/write on Nomad, Terraform, etc. All fantastic products from what appears to be a solid company!

Anyhow, to briefly explain what I want to do here with Packer, I simply want to create a snapshot that contains various Hashicorp products as well as a docker and docker-compose.
I will eventually use this snapshot to provision a set of clients and servers to create a nomad cluster on DigitalOcean.

## Configuration
To begin, assuming you have [Packer](https://www.packer.io/) installed, we need to create several `json` files.

The first file, which is `json` based, will contain our variables. You will need to create a [DigitalOcean API Key](https://www.digitalocean.com/community/tutorials/how-to-create-a-digitalocean-space-and-api-key). 
Afterwards, select the base system image, this case `ubuntu-20-04-x64`, region, `tor1`, and size, `s-1vcpu-1gb`, of the droplet. 
Those details can be found from the [DigitalOcean API](https://developers.digitalocean.com/documentation/v2/) by calling various endpoints.

```json[variables.json]
{
  "do_token": "<apikey>",
  "base_system_image": "ubuntu-20-04-x64",
  "region": "tor1",
  "size": "s-1vcpu-1gb" <-- droplet size
}
```

Now we can begin to work with the template for our snapshot. The following template, which I use myself, contains a builder and various provisioners. 
But wait, hang on, what are builders and provisioners? So actually let's step back for a minute. Templates CAN contain several keys, namely builders, 
provisioners, post-processors, variables and a description. 
However, only the builders key is mandatory. 

By definition, from Packer, the builders key is an array of one or more objects that defines the builders 
that will be used to create machine images for this template, and configures each of those builders. 
There are separate builders for EC2, VMware, VirtualBox, etc, but in my case I am using the `digitalocean` builder.
 
The provisioners key is an array 
of one or more objects that defines the provisioners that will be used to install and configure software for the machines created by each of the builders.
Like builders, there are a number of provisioners that can/could be used. For more information, review the [documentation](https://www.packer.io/docs/templates/provisioners) on the matter.
In the code below I use only `shell` and `file` provisioners.

```json[template.json]
{
  "builders": [
    {
      "type": "digitalocean",
      "api_token": "{{user `do_token`}}",
      "image": "{{user `base_system_image`}}",
      "region": "{{user `region`}}",
      "size": "{{user `size`}}",
      "ssh_username": "root"
    }
  ],
  "provisioners": [
    {
      "type": "shell",
      "inline": [
        "sleep 30",
        "sudo apt-get clean",
        "sudo apt-get update",
        "sudo apt-get install -y apt-transport-https ca-certificates nfs-common",
        "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -",
        "curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -",
        "sudo add-apt-repository \"deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable\"",
        "sudo apt-add-repository \"deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main\"",
        "sudo apt-get update",
        "sudo apt-get install -y docker-ce nomad consul vault ufw unzip",
        "sudo curl -L \"https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose",
        "sudo chmod +x /usr/local/bin/docker-compose",
        "wget https://releases.hashicorp.com/consul-template/0.25.1/consul-template_0.25.1_linux_amd64.zip",
        "unzip consul-template_0.25.1_linux_amd64.zip",
        "cp consul-template /usr/local/bin/consul-template",
        "sudo chmod +x /usr/local/bin/consul-template",
        "sudo mkdir -p /root/nomad/jobs"
      ]
    },
    {
      "type": "file",
      "source": "consul/configure_consul.sh",
      "destination": "/root/configure_consul.sh"
    },
    {
      "type": "file",
      "source": "consul/consul-server.service",
      "destination": "/etc/systemd/system/consul-server.service"
    },
    {
      "type": "file",
      "source": "consul/consul-connect-enable.hcl",
      "destination": "/root/consul-connect-enable.hcl"
    },
    {
      "type": "file",
      "source": "consul/consul-client.service",
      "destination": "/etc/systemd/system/consul-client.service"
    },
    {
      "type": "file",
      "source": "nomad/nomad-server.hcl",
      "destination": "/root/nomad-server.hcl"
    },
    {
      "type": "file",
      "source": "nomad/nomad-client.hcl",
      "destination": "/root/nomad-client.hcl"
    },
    {
      "type": "file",
      "source": "nomad/configure_nomad.sh",
      "destination": "/root/configure_nomad.sh"
    },
    {
      "type": "file",
      "source": "nomad/nomad-client.service",
      "destination": "/etc/systemd/system/nomad-client.service"
    },
    {
      "type": "file",
      "source": "nomad/nomad-server.service",
      "destination": "/etc/systemd/system/nomad-server.service"
    },
    {
      "type": "file",
      "source": "nomad/jobs/traefik.nomad",
      "destination": "/root/nomad/jobs/traefik.nomad"
    },
    {
      "type": "file",
      "source": "nomad/jobs/jessequinn.nomad",
      "destination": "/root/nomad/jobs/jessequinn.nomad"
    },
    {
      "type": "file",
      "source": "nomad/jobs/scidoc.nomad",
      "destination": "/root/nomad/jobs/scidoc.nomad"
    },
    {
      "type": "file",
      "source": "nomad/jobs/fabio.nomad",
      "destination": "/root/nomad/jobs/fabio.nomad"
    },
    {
      "type": "file",
      "source": "vault/vault-config.hcl",
      "destination": "/root/vault-config.hcl"
    },
    {
      "type": "file",
      "source": "vault/vault-server.service",
      "destination": "/etc/systemd/system/vault-server.service"
    },
    {
      "type": "file",
      "source": "vault/enable_vault.sh",
      "destination": "/root/enable_vault.sh"
    },
    {
      "type": "file",
      "source": "vault/init_vault.sh",
      "destination": "/root/init_vault.sh"
    }
  ]
}
```

So to quickly explain what happened in the above code, I only used a single builder, `digitalocean`, where I passed several important variables to it. At which point, I configured a single `shell`
provisioner to install `docker`, `docker-compose`, `nomad`, `vault` and `consul`. Afterwards, I use the `file` provisioner to copy specific local files to the snapshot. In this case, I copied all my scripts
related to nomad, vault, consul, etc so that I can eventually use Terraform to provision a Nomad cluster.

To make life easier, I am a big fan of `Makefiles`.

```makefile[Makefile]
.PHONY: validate
validate:
	@packer validate -var-file=variables.json template.json

.PHONY: build
build:
	@packer build -var-file=variables.json template.json
```

In the end, to build the snapshot we need to run the following command `packer build -var-file=variables.json template.json`. In the `Makefile` I also included a validate target.

One note, I showed all the code in `json`; however, Packer also supports `hcl`.

## Final Words 
Packer is a simple and easy to use image automation tool. It is not required when making provisions with Terraform, BUT, I found it to help organize/reduce the code in Terraform.
