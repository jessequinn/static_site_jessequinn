---
title: Provisioning and Managing DigitalOcean Resources with Terraform
description: I present some basic Terraform provisioning with DigitalOcean resources.
img: aaron-fernando-tSuk0hyn8aY-unsplash.jpg
alt: Provisioning and Managing DigitalOcean Resources with Terraform
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2020-10-04T03:00:00.000Z
updateAt: 2020-10-04T03:00:00.000Z
---

## Introduction
Hashicorp's Terraform is an infrastructure as code tool something like [Ansible](https://www.ansible.com/). However, here, I will be 
managing [DigitalOcean](https://m.do.co/c/6ceb645458ec) resources where Terraform absolutely performs better than that of Ansible. Do not get be wrong
I love Ansible and use it frequently. I want to quickly add that this article will be a part of a series
of Hashicorp related articles. I will, in future, present/write on Nomad, Vault and Consul.

So the objective of this project with Terraform is to provision a set of servers and clients on DigitalOcean to create a Nomad cluster based on Consul and Vault.

## Configuration
To begin, assuming you have [Terraform](https://www.terraform.io/) installed, and read some of the 
[documentation](https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs)
on the DigitalOcean provider, which is used to interact with the resources supported by DigitalOcean, for Terraform.
The provider needs to be configured with the proper credentials before it can be used. Therefore, we will start with the `hcl` based file below.

You will need to create a [DigitalOcean API Key](https://www.digitalocean.com/community/tutorials/how-to-create-a-digitalocean-space-and-api-key). 
You should create a [DigitalOcean SSH Key](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys-2) rather than providing `user_data`. 
We do not need to provide a snapshot id, but if you had followed my Packer related
article you should provide the id here otherwise you could use `"ubuntu-20-04-x64"` as an example. 
Afterwards, select the region, `tor1`, and size, `s-1vcpu-1gb`, of the droplet. 
Those details can be found from the [DigitalOcean API](https://developers.digitalocean.com/documentation/v2/) by calling various endpoints. 
Finally, choose how many servers and clients you want for the Nomad cluster. I will not discuss this now, but it is recommended to have 3 servers (minimum) and plenty of clients.
However, this is for demonstration only. 

```hcl[definitions.tfvars]
do_token              = "<apikey>"
ssh_fingerprint       = "<fingerprint>"
do_snapshot_id        = <id or image name>
do_region             = "tor1"
do_size               = "s-1vcpu-1gb" <-- droplet size
server_instance_count = 1
client_instance_count = 1
```

So now we have defined most things for our provider, we can also create the following file: 
** you do not need to include defaults for your variables **

```hcl[do-provider.tf]
variable "do_token" {
}

variable "ssh_fingerprint" {
  default = "<fingerprint>"
}

variable "server_instance_count" {
  default = "1"
}

variable "client_instance_count" {
  default = "2"
}

variable "do_snapshot_id" {
}

variable "do_region" {
  default = "tor1"
}

variable "do_size" {
  default = "s-1vcpu-1gb"
}

variable "do_private_networking" {
  default = true
}

provider "digitalocean" {
  token = var.do_token
}
```

`do_private_networking` is defaulted as true as I want to use the default DigitalOcean VPC (`private_networking`) I have for the Toronto region. However,
one could create a VPC as well:

```hcl
resource "digitalocean_vpc" "example" {
  name     = "example-project-network"
  region   = "tor1"
}

resource "digitalocean_droplet" "example" {
  name     = "example-01"
  size     = "s-1vcpu-1gb"
  image    = "ubuntu-20-04-x64"
  region   = "tor1"
  vpc_uuid = digitalocean_vpc.example.id
}
```

What is left is our deployment of servers, clients, firewalls, load balancers, etc. For brevity, I will break up the deployment file.

I will begin with the creation of server droplets using the resource `digitalocean_droplet`:

```hcl[deployments.tf]
resource "digitalocean_droplet" "server" {
  count               = var.server_instance_count
  name                = "server-${count.index + 1}"
  tags                = ["nomad", "server"]
  image               = var.do_snapshot_id
  region              = var.do_region
  size                = var.do_size
  private_networking  = var.do_private_networking
  ssh_keys            = [var.ssh_fingerprint]

  connection {
    type              = "ssh"
    user              = "root"
    host              = self.ipv4_address
    agent             = true
  }

  provisioner "remote-exec" {
    inline = [
      "sed -i 's/count/${count.index + 1}/g' /etc/systemd/system/consul-server.service",
      "chmod +x /root/configure_consul.sh",
      "/root/configure_consul.sh server",
    ]
  }

  provisioner "remote-exec" {
    inline = [
      "consul join ${digitalocean_droplet.server.0.ipv4_address_private}",
    ]
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /root/enable_vault.sh",
      "/root/enable_vault.sh",
    ]
  }

  provisioner "remote-exec" {
    inline = [
      "sleep 30",
      "chmod +x /root/init_vault.sh",
      "/root/init_vault.sh ${count.index}",
    ]
  }

  provisioner "local-exec" {
    command = "scp -o StrictHostKeyChecking=no root@${digitalocean_droplet.server.0.ipv4_address}:/root/startupOutput.txt tmp/vaultDetails.txt"
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /root/configure_nomad.sh",
      "sed -i 's/server_ip/${self.ipv4_address_private}/g' /root/nomad-server.hcl",
      "sed -i 's/server_count/${var.server_instance_count}/g' /root/nomad-server.hcl",
      "/root/configure_nomad.sh server",
    ]
  }

  provisioner "remote-exec" {
    inline = [
      "export NOMAD_ADDR=http://${self.ipv4_address_private}:4646",
      "nomad server join ${digitalocean_droplet.server.0.ipv4_address_private}",
    ]
  }

  provisioner "local-exec" {
    command = "echo ${digitalocean_droplet.server.0.ipv4_address_private} > tmp/private_server.txt"
  }

  provisioner "local-exec" {
    command = "echo ${digitalocean_droplet.server.0.ipv4_address} > tmp/public_server.txt"
  }
}

... <-- remove
```

I think in general I do not need to explain much; however, I do provide two types of provisioners (`remote-exec` and `local-exec`) and the corresponding connection. 
Connections are, usually, required to access the remote resource via SSH or WinRM. Provisioners, according to Terraform, should only be used as a last resort, and hence why 
I used [Packer](https://www.packer.io/) previously. I wanted to remove all `file` provisioners from the deployment. So the remaining provisioners will run remote commands 
on the server or copy important information to my local host from the server.

Similarly, with the client, I used `remote-exec` to enable some things on the client. However, I used `null_resource` to delay the creation of the clients as I want all services on the 
server to be loaded and running. You can read more on [this](https://www.terraform.io/docs/provisioners/null_resource.html).

```hcl[deployments.tf]
... <-- remove
resource "null_resource" "dependency_manager" {
  triggers = {
    dependency_id = digitalocean_droplet.server[0].ipv4_address_private
  }
}

resource "digitalocean_droplet" "client" {
  count               = var.client_instance_count
  name                = "client-${count.index + 1}"
  tags                = ["nomad", "client"]
  image               = var.do_snapshot_id
  region              = var.do_region
  size                = var.do_size
  private_networking  = var.do_private_networking
  ssh_keys = [var.ssh_fingerprint]

  depends_on = [null_resource.dependency_manager]

  connection {
    type              = "ssh"
    user              = "root"
    host              = self.ipv4_address
    agent             = true
  }

  provisioner "remote-exec" {
    inline = [
      "sed -i 's/count/${count.index + 1}/g' /etc/systemd/system/consul-client.service",
      "chmod +x /root/configure_consul.sh",
      "/root/configure_consul.sh client ${digitalocean_droplet.server[0].ipv4_address_private}",
    ]
  }

  provisioner "remote-exec" {
    inline = [
      "chmod +x /root/configure_nomad.sh",
      "/root/configure_nomad.sh client",
    ]
  }
}
... <-- remove
```

I am including the following code about cert resources and load balancers, BUT, I actually do not use them. Originally, I wanted to implement a load balancer, however, I
soon realized that DigitalOcean cannot handle multi-domain certification generation through [Let's Encrypt](https://letsencrypt.org/) so I opted for 
[Traefik](https://doc.traefik.io/traefik/) as my load balancer on my server.

```hcl[deployments.tf]
... <-- remove
resource "digitalocean_certificate" "cert" {
  name    = "letsencrypt-1"
  type    = "lets_encrypt"
  domains = ["www.jessequinn.info", "jessequinn.info"]
}

resource "digitalocean_loadbalancer" "public" {
  name = "loadbalancer-1"
  region = var.do_region

  forwarding_rule {
    entry_port = 443
    entry_protocol = "https"

    target_port = 3000 <-- some service port
    target_protocol = "http"

    certificate_id = digitalocean_certificate.cert.id
  }

  forwarding_rule {
    entry_port = 80
    entry_protocol = "http"

    target_port = 3000 <-- some service port
    target_protocol = "http"
  }

  healthcheck {
    port = 22
    protocol = "tcp"
  }

  droplet_ids = concat(digitalocean_droplet.server.*.id, digitalocean_droplet.client.*.id)
}
... <-- remove
```

Now let's provision a firewall with just port 22, 80 and 443 opened to the world and full communication between servers and clients:

```hcl[deployments.tf]
... <-- remove
resource "digitalocean_firewall" "web" {
  name = "firewall-1"

  droplet_ids = concat(digitalocean_droplet.server.*.id, digitalocean_droplet.client.*.id)

  inbound_rule {
    protocol                  = "tcp"
    port_range                = "22"
    source_addresses          = ["0.0.0.0/0", "::/0"]
//    source_load_balancer_uids = [digitalocean_loadbalancer.public.id]
  }

  inbound_rule {
    protocol                  = "tcp"
    port_range                = "80"
    source_addresses          = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol                  = "tcp"
    port_range                = "443"
    source_addresses          = ["0.0.0.0/0", "::/0"]
  }

//  inbound_rule {
//    protocol                  = "tcp"
//    port_range                = "8081" // traefik ui
//    source_addresses          = ["0.0.0.0/0", "::/0"]
//  }

  inbound_rule {
    protocol                  = "tcp"
    port_range                = "all"
    source_droplet_ids        = concat(digitalocean_droplet.server.*.id, digitalocean_droplet.client.*.id)
  }

  inbound_rule {
    protocol                  = "udp"
    port_range                = "all"
    source_droplet_ids        = concat(digitalocean_droplet.server.*.id, digitalocean_droplet.client.*.id)
  }

  outbound_rule {
    protocol                  = "tcp"
    port_range                = "all"
    destination_addresses     = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol                  = "udp"
    port_range                = "all"
    destination_addresses     = ["0.0.0.0/0", "::/0"]
  }
}
... <-- remove
```

We can finalize our deployment by outputting information about our servers and clients:

```hcl[deployments.tf]
... <-- remove
//output "load_balancer_id" {
//  value = digitalocean_loadbalancer.public.id
//}

output "consul_server_ip" {
  value = digitalocean_droplet.server[0].ipv4_address_private
}

output "server_ids" {
  value = [digitalocean_droplet.server.*.id]
}

output "client_ids" {
  value = [digitalocean_droplet.client.*.id]
}
```

To make life easier, I use a `Makefile`:

```makefile[Makefile]
.PHONY: init
init:
	@terraform init

.PHONY: validate
validate:
	@terraform validate

.PHONY: build
build:
	@terraform plan -var-file="definitions.tfvars"
	@terraform apply -var-file="definitions.tfvars"

.PHONY: destroy
destroy:
	@terraform destroy -var-file="definitions.tfvars"
```

So to get started, you need to `make init`, `make validate` and `make build`. Terraform may complain about our provider. So to avoid include the following file:

```hcl[versions.tf]
terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
    }
  }
  required_version = ">= 0.13"
}

```

## Final Words 
Like Ansible, I find that Terraform is quite easy to learn, and enjoyable to use. I suggest reading more, like I need to do, on the [subject](https://www.terraform.io/docs/cli-index.html). Hopefully
you can easily understand what I presented here and enjoy Terraform.
