---
title: Logging Symfony applications to a ELK stack
description: I show you how to quickly setup your Symfony application to log to a ELK stack.
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: Logging Symfony applications to a ELK stack
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2020-02-23T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

To begin, we need to edit your `services.yaml` with the following

```
services:
  ...

  Monolog\Formatter\LogstashFormatter:
    arguments:
      $applicationName: monolog
```

As well we need to edit the `monolog.yaml` for production and development with the following

```
# prod
monolog:
  handlers:
    main:
      type: fingers_crossed
      action_level: error
      handler: grouped
      excluded_http_codes: [404, 405]
    grouped:
      type: group
      members: [nested, socket]
    nested:
      type: stream
      path: "%kernel.logs_dir%/%kernel.environment%.log"
      level: debug
    console:
      type: console
      process_psr_3_messages: false
      channels: ["!event", "!doctrine"]
    deprecation:
      type: stream
      path: "%kernel.logs_dir%/%kernel.environment%.deprecations.log"
    deprecation_filter:
      type: filter
      handler: deprecation
      max_level: info
      channels: ["php"]
    socket:
      type: socket
      connection_string: "udp://elk-url:5001"
      formatter: Monolog\Formatter\LogstashFormatter
```

Now we need edit our `logstash.conf` with the following

```
input {
  ...

  udp {
    port => 5001
    codec => "json"
    type => udp
  }
}
```

Add whatever filters and output you want for your new input.

Best of luck

P.S> do not forget to open your 5001 port. As well, you could use any other port not just 5001.
