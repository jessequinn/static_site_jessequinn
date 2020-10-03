---
title: Grafana on Kubernetes
description: Quickly configure and install Grafana, Loki, and Promtail on Kubernetes.
img: john-towner-3Kv48NS4WUU-unsplash.jpg
alt: Grafana on Kubernetes
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2020-06-20T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

## Introduction
As a heavy user of [elastic stack](https://www.elastic.co/), but more specifically, 
[Kibana](https://www.elastic.co/kibana), [Grafana](https://grafana.com/) offers a similar 
interface but with more luxuries, in my opinion. More so, with 
the introduction of [Loki](https://grafana.com/oss/loki/) and [Promtail](https://github.com/grafana/loki/tree/master/docs/clients/promtail). 
Nonetheless, Grafana still lacks some of the power of processing logs that the elastic stack
carries.

In this article, I will quickly cover the installation and configuration of Grafana, Loki, and Promtail on a 
[DO](https://m.do.co/c/6ceb645458ec) kubernetes pool.

## Installation
### Grafana
To install could be as simple as using [helm](https://github.com/grafana/loki/blob/master/docs/installation/helm.md):

```bash
helm upgrade --install loki loki/loki-stack \
--set grafana.enabled=true,prometheus.enabled=true,\
prometheus.alertmanager.persistentVolume.enabled=false,\
prometheus.server.persistentVolume.enabled=false
```

However, I would like to make some changes and so I will demonstrate how to install Grafana via manifests.

Let's create a PersistentVolumeClaim:

```yaml[GrafanaPersistentVolumeClaim.yaml]
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: grafana-pvc
  namespace: monitoring
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: do-block-storage
```

and create the resource `kubectl apply -f GrafanaPersistentVolumeClaim.yaml`. Next, we need to provide some configurations:

```yaml[GrafanaConfigMap.yaml]
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: monitoring
data:
  prometheus.yaml: |-
    {
        "apiVersion": 1,
        "datasources": [
            {
               "access":"proxy",
                "editable": true,
                "name": "prometheus",
                "orgId": 1,
                "type": "prometheus",
                "url": "http://prometheus:9090",
                "version": 1
            }
        ]
    }
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-config
  namespace: monitoring
data:
  grafana.ini: |-
    [server]
    root_url = <base url>
    [smtp]
    enabled = true
    host = <host>:<port>
    user = <user>
    password = <password>
    from_address = <email>
    from_name = <name>
```

I assume that Prometheus is in the same namespace (i.e. monitoring). Also, I include a `grafana.ini` with SMTP enabled. 
Create the ConfigMaps `kubectl apply -f GrafanaConfigMap.yaml`. 

Now with the deployment of Grafana:

```yaml
# GrafanaDeployment.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      name: grafana
      labels:
        app: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:7.0.3
          ports:
            - name: grafana
              containerPort: 3000
          resources:
            limits:
              memory: "2Gi"
              cpu: "1000m"
            requests:
              memory: "1Gi"
              cpu: "500m"
          volumeMounts:
            - mountPath: /var/lib/grafana
              name: grafana-storage
            - mountPath: /etc/grafana
              name: grafana-config
            - mountPath: /etc/grafana/provisioning/datasources
              name: grafana-datasources
              readOnly: false
      volumes:
        - name: grafana-storage
          persistentVolumeClaim:
            claimName: grafana-pvc
        - name: grafana-config
          configMap:
            defaultMode: 420
            name: grafana-config
        - name: grafana-datasources
          configMap:
            defaultMode: 420
            name: grafana-datasources
      initContainers:
        - name: fix-permissions
          image: busybox
          command: ["sh", "-c", "chown -R 472:472 /var/lib/grafana"]
          securityContext:
            privileged: true
          volumeMounts:
            - name: grafana-storage
              mountPath: /var/lib/grafana
```

Deploy `kubectl apply -f GrafanaDeployment.yaml`. Special note, we need the initContainer to fix permissions on the block storage. Finally, with the service:

```yaml
# GrafanaService.yaml
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
  annotations:
    prometheus.io/scrape: 'true'
    prometheus.io/port:   '9090'
spec:
  selector:
    app: grafana
  ports:
    - name: "http"
      port: 3000
```

Create that resource `kubectl apply -f GrafanaService.yaml`.

### Loki
Installing Loki will be directly from the Helm command:

```bash
helm upgrade --install loki loki/loki-stack \
--set promtail.enabled=true,loki.persistence.enabled=true,loki.persistence.size=50Gi,\
config.table_manager.retention_deletes_enabled=true,config.table_manager.retention_period=1440h \
--namespace=monitoring
```

A block-storage of 50Gi will be created. Loki will maintain logs for 60 days (1440 hours) as well Promtail is enabled.

## Final Words
Grafana, Loki, and Promtail are super easy to get started. They do not require substantial resources either, which is fantastic for a new user or 
someone entering into the field of system monitoring.
