---
title: Metrics with Prometheus on Kubernetes
description: I piece together the installation and configuration of Prometheus and Alert Manager on Kubernetes.
img: miguel-a-amutio-ngZ4V-myG5s-unsplash.jpg
alt: Metrics with Prometheus
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
[Prometheus](https://prometheus.io/) is, de facto, quite relevant to the area of monitoring metrics. As
an open source project, Prometheus, has a large community and is actively supported. I recently introduced
Prometheus to my cluster setup, and I will describe here how this was achieved on a [DO](https://m.do.co/c/6ceb645458ec) kubernetes pool.
In addition, I will introduce [Alert Manager](https://prometheus.io/docs/alerting/latest/alertmanager/#:~:text=The%20Alertmanager%20handles%20alerts%20sent,silencing%20and%20inhibition%20of%20alerts.), which
goes hand in hand with Prometheus and provides a method to creating alerts to issues.

## Preparation and Installation
### Prometheus
I recommend that a PersistentVolumeClaim be created for data persistence. The following would create a 50Gi block storage volume in the monitoring
namespace.

```yaml[PrometheusPersistentVolumeClaim.yaml]
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: prometheus-pvc
  namespace: monitoring
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: do-block-storage
```

`kubectl apply -f PrometheusPersistentVolumeClaim.yaml` will create/apply the PersistentVolumeClaim. Next we need to create a ClusterRole and ClusterRoleBinding:

```yaml
# PrometheusClusterRole.yaml
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRole
metadata:
  name: prometheus
rules:
  - apiGroups: [""]
    resources:
      - nodes
      - nodes/proxy
      - services
      - endpoints
      - pods
    verbs: ["get", "list", "watch"]
  - apiGroups:
      - extensions
    resources:
      - ingresses
    verbs: ["get", "list", "watch"]
  - nonResourceURLs: ["/metrics", "/healthz"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: prometheus
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus
subjects:
  - kind: ServiceAccount
    name: default
    namespace: monitoring
```

We need to create these permissions as Prometheus can/will scrape pods, nodes, services, endpoints, and so on for metrics. 
`kubectl apply -f PrometheusClusterRole.yaml` is needed to create/apply the roles.

We will also implement a ConfigMap to store both the `prometheus.yaml` and the `prometheus.rules`. However, what is provided below is just
an example and will certainly require [changes](https://prometheus.io/docs/prometheus/latest/configuration/configuration/) for your situation.

```yaml
# PrometheusConfigMap.yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus
  labels:
    name: prometheus
  namespace: monitoring
data:
  prometheus.rules: |-
    # https://github.com/alerta/prometheus-config/blob/master/config/prometheus.rules.yml
    groups:
    - name: ./rules.conf
      rules:
    
      # heartbeat alert
      - alert: Heartbeat
        expr: vector(1)
        labels:
          severity: informational
    
      # service availability alert
      - alert: service_down
        expr: up == 0
        labels:
          service: Platform
          severity: major
          correlate: service_up,service_down
        annotations:
          description: Service {{ $labels.instance }} is unavailable.
          value: DOWN ({{ $value }})
          runbook: http://wiki.alerta.io/RunBook/{app}/Event/{alertname}
    
      - alert: service_up
        expr: up == 1
        labels:
          service: Platform
          severity: normal
          correlate: service_up,service_down
        annotations:
          description: Service {{ $labels.instance }} is available.
          value: UP ({{ $value }})
    
      # system load alert
      - alert: high_load
        expr: node_load1 > 0.5
        annotations:
          description: '{{ $labels.instance }} of job {{ $labels.job }} is under high load.'
          summary: Instance {{ $labels.instance }} under high load
          value: '{{ $value }}'
    
      # disk space alert (with resource=<instance>:<mountpoint> event=disk_space
      - alert: disk_space
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) * 100 / node_filesystem_size_bytes > 5
        labels:
          instance: '{{ $labels.instance }}:{{ $labels.mountpoint }}'
        annotations:
          value: '{{ humanize $value }}%'
    
      # disk space alert (with resource=<instance> event=disk_util:<mountpoint>
      - alert: disk_util
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) * 100 / node_filesystem_size_bytes > 5
        labels:
          instance: '{{ $labels.instance }}'
          event: '{alertname}:{{ $labels.mountpoint }}'  # python templating rendered by Alerta
        annotations:
          value: '{{ humanize $value }}%'
    
      # API request rate alert
      - alert: api_requests_high
        expr: rate(alerta_alerts_queries_count{instance="alerta:8080",job="alerta"}[5m]) > 5
        labels:
          service: Alerta,Platform
          severity: major
        annotations:
          description: API request rate of {{ $value | printf "%.1f" }} req/s is high (threshold 5 req/s)
          summary: API request rate high
          value: '{{ humanize $value }} req/s'
  prometheus.yml: |-
    # https://github.com/prometheus/prometheus/blob/master/documentation/examples/prometheus.yml
    # my global config
    global:
      scrape_interval:     15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
      evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
      # scrape_timeout is set to the global default (10s).
    
    # Alertmanager configuration
    alerting:
      alertmanagers:
      - static_configs:
        - targets:
          # - alertmanager:9093
    
    # Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
    rule_files:
      # - "first_rules.yml"
      # - "second_rules.yml"
    
    # A scrape configuration containing exactly one endpoint to scrape:
    # Here it's Prometheus itself.
    scrape_configs:
      # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
      - job_name: 'prometheus'
    
        # metrics_path defaults to '/metrics'
        # scheme defaults to 'http'.
    
        static_configs:
        - targets: ['localhost:9090']
```

`kubectl apply -f PrometheusConfigMap.yaml` will also apply/create the ConfigMap. `prometheus.rules` contains your alert rules and will function later on with Alert Manager.
`prometheus.yaml` contains scraping rules amongst other things and plays and obvious role in what metrics are actually collected. Here you can also modify labels. As a more complex example:

```yaml
...
  - job_name: 'kubernetes-nodes-cadvisor'
    scrape_interval: 10s
    scrape_timeout: 10s
    scheme: https  # remove if you want to scrape metrics on insecure port
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
      # Only for Kubernetes ^1.7.3.
      # See: https://github.com/prometheus/prometheus/issues/2916
      - target_label: __address__
        replacement: kubernetes.default.svc:443
      - source_labels: [__meta_kubernetes_node_name]
        regex: (.+)
        target_label: __metrics_path__
        replacement: /api/v1/nodes/${1}/proxy/metrics/cadvisor
    metric_relabel_configs:
      - action: replace
        source_labels: [id]
        regex: '^/machine\.slice/machine-rkt\\x2d([^\\]+)\\.+/([^/]+)\.service$'
        target_label: rkt_container_name
        replacement: '${2}-${1}'
      - action: replace
        source_labels: [id]
        regex: '^/system\.slice/(.+)\.service$'
        target_label: systemd_service_name
        replacement: '${1}'
  
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
    - role: pod
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
      action: replace
      regex: ([^:]+)(?::\d+)?;(\d+)
      replacement: $1:$2
      target_label: __address__
    - action: labelmap
      regex: __meta_kubernetes_pod_label_(.+)
    - source_labels: [__meta_kubernetes_namespace]
      action: replace
      target_label: kubernetes_namespace
    - source_labels: [__meta_kubernetes_pod_name]
      action: replace
      target_label: kubernetes_pod_name
...
```

Now we can deploy our Prometheus with `kubectl apply -f PrometheusDeployment.yaml`. As of today, the latest release is 2.19.0. Specifically in this deploy, retention is set to 60 days. Feel free to change.
Also, the data path is set to `/prometheus`, which aligns with the PVC. We require an initcontainer to set the correct owner and group on the data folder.

```yaml
# PrometheusDeployment.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:v2.19.0
          args:
            - "--config.file=/etc/prometheus/prometheus.yml"
            - "--storage.tsdb.path=/prometheus"
            - "--storage.tsdb.retention.time=60d"
          ports:
            - containerPort: 9090
          volumeMounts:
            - name: prometheus-config
              mountPath: /etc/prometheus
            - name: prometheus-storage
              mountPath: /prometheus
      volumes:
        - name: prometheus-config
          configMap:
            defaultMode: 420
            name: prometheus
        - name: prometheus-storage
          persistentVolumeClaim:
            claimName: prometheus-pvc
      initContainers:
        - name: fix-permissions
          image: busybox
          command: ["sh", "-c", "chown -R nobody:nogroup /prometheus"]
          securityContext:
            privileged: true
          volumeMounts:
            - name: prometheus-storage
              mountPath: /prometheus
```

Finally, we create our, `kubectl apply -f PrometheusService.yaml`, service.

```yaml
# PrometheusService.yaml
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
  annotations:
    prometheus.io/scrape: 'true'
    prometheus.io/port:   '9090'
spec:
  selector:
    app: prometheus
  ports:
    - name: "http"
      port: 9090
```

Here, we have the annotations `prometheus.io/scrape: 'true'` and `prometheus.io/port: '9090'`. This allows to enable on the scraping for this specific service. 
If we look at the more complex `prometheus.yaml` example:

```yaml
- source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
  action: keep
  regex: true
```

if scrape is not set to true it is dropped.

### Alert Manager

We can look at the [example](https://github.com/prometheus/alertmanager/blob/master/doc/examples/simple.yml) provided my Prometheus:

```yaml
# AlertManagerConfigmap.yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  config.yml: |-
    global:
      # The smarthost and SMTP sender used for mail notifications.
      smtp_smarthost: 'localhost:25'
      smtp_from: 'alertmanager@example.org'
      smtp_auth_username: 'alertmanager'
      smtp_auth_password: 'password'
    
    # The directory from which notification templates are read.
    templates: 
    - '/etc/alertmanager/template/*.tmpl'
    
    # The root route on which each incoming alert enters.
    route:
      # The labels by which incoming alerts are grouped together. For example,
      # multiple alerts coming in for cluster=A and alertname=LatencyHigh would
      # be batched into a single group.
      #
      # To aggregate by all possible labels use '...' as the sole label name.
      # This effectively disables aggregation entirely, passing through all
      # alerts as-is. This is unlikely to be what you want, unless you have
      # a very low alert volume or your upstream notification system performs
      # its own grouping. Example: group_by: [...]
      group_by: ['alertname', 'cluster', 'service']
    
      # When a new group of alerts is created by an incoming alert, wait at
      # least 'group_wait' to send the initial notification.
      # This way ensures that you get multiple alerts for the same group that start
      # firing shortly after another are batched together on the first 
      # notification.
      group_wait: 30s
    
      # When the first notification was sent, wait 'group_interval' to send a batch
      # of new alerts that started firing for that group.
      group_interval: 5m
    
      # If an alert has successfully been sent, wait 'repeat_interval' to
      # resend them.
      repeat_interval: 3h 
    
      # A default receiver
      receiver: team-X-mails
    
      # All the above attributes are inherited by all child routes and can 
      # overwritten on each.
    
      # The child route trees.
      routes:
      # This routes performs a regular expression match on alert labels to
      # catch alerts that are related to a list of services.
      - match_re:
          service: ^(foo1|foo2|baz)$
        receiver: team-X-mails
        # The service has a sub-route for critical alerts, any alerts
        # that do not match, i.e. severity != critical, fall-back to the
        # parent node and are sent to 'team-X-mails'
        routes:
        - match:
            severity: critical
          receiver: team-X-pager
      - match:
          service: files
        receiver: team-Y-mails
    
        routes:
        - match:
            severity: critical
          receiver: team-Y-pager
    
      # This route handles all alerts coming from a database service. If there's
      # no team to handle it, it defaults to the DB team.
      - match:
          service: database
        receiver: team-DB-pager
        # Also group alerts by affected database.
        group_by: [alertname, cluster, database]
        routes:
        - match:
            owner: team-X
          receiver: team-X-pager
          continue: true
        - match:
            owner: team-Y
          receiver: team-Y-pager
    
    
    # Inhibition rules allow to mute a set of alerts given that another alert is
    # firing.
    # We use this to mute any warning-level notifications if the same alert is 
    # already critical.
    inhibit_rules:
    - source_match:
        severity: 'critical'
      target_match:
        severity: 'warning'
      # Apply inhibition if the alertname is the same.
      # CAUTION: 
      #   If all label names listed in `equal` are missing 
      #   from both the source and target alerts,
      #   the inhibition rule will apply!
      equal: ['alertname', 'cluster', 'service']
    
    
    receivers:
    - name: 'team-X-mails'
      email_configs:
      - to: 'team-X+alerts@example.org'
    
    - name: 'team-X-pager'
      email_configs:
      - to: 'team-X+alerts-critical@example.org'
      pagerduty_configs:
      - service_key: <team-X-key>
    
    - name: 'team-Y-mails'
      email_configs:
      - to: 'team-Y+alerts@example.org'
    
    - name: 'team-Y-pager'
      pagerduty_configs:
      - service_key: <team-Y-key>
    
    - name: 'team-DB-pager'
      pagerduty_configs:
      - service_key: <team-DB-key>
```

After [configuring](https://prometheus.io/docs/alerting/latest/configuration/) Alert Manager we can simply run `kubectl apply -f AlertManagerConfigmap.yaml` to create the ConfigMap. However, from the
example above, it may not be so obvious, but we can define reusable [templates](https://prometheus.io/docs/alerting/latest/notification_examples/) and we could also configure those by ConfigMap.

```yaml
# AlertTemplateConfigMap.yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: alertmanager-templates
  namespace: monitoring
data:
  default.tmpl: |
    {{ define "slack.myorg.text" }}https://internal.myorg.net/wiki/alerts/{{ .GroupLabels.app }}/{{ .GroupLabels.alertname }}{{ end}}
```

We deploy Alert Manager `kubectl apply -f AlertManagerDeployment.yaml`; however, in this case we have not configured a PersistentVolumeClaim. It may be a good idea here to add a block storage. Refer to
the Prometheus Deployment manifest and PersistentVolumeClaim on how to do so.

```yaml
# AlertManagerDeployment.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alertmanager
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: alertmanager
  template:
    metadata:
      name: alertmanager
      labels:
        app: alertmanager
    spec:
      containers:
        - name: alertmanager
          image: prom/alertmanager:v0.20.0
          args:
            - "--config.file=/etc/alertmanager/config.yml"
            - "--storage.path=/alertmanager"
          ports:
            - name: alertmanager
              containerPort: 9093
          volumeMounts:
            - name: config-volume
              mountPath: /etc/alertmanager
            - name: templates-volume
              mountPath: /etc/alertmanager-templates
            - name: alertmanager
              mountPath: /alertmanager
      volumes:
        - name: config-volume
          configMap:
            name: alertmanager-config
        - name: templates-volume
          configMap:
            name: alertmanager-templates
        - name: alertmanager
          emptyDir: {}
```

Finally, we have our service `kubectl apply -f AlertManagerService.yaml`. We add annotations here for Prometheus, but they are not mandatory.

```yaml[AlertManagerService.yaml]
---
apiVersion: v1
kind: Service
metadata:
  name: alertmanager
  namespace: monitoring
  annotations:
    prometheus.io/scrape: 'true'
    prometheus.io/port:   '9093'
spec:
  selector:
    app: alertmanager
  ports:
    - name: "http"
      port: 9093
```

## Final Words
Prometheus and Alert Manager require some reading to fully grasp how to configure properly. However, Prometheus is a powerful metrics monitor and once aligned with [Grafana](https://grafana.com/) becomes
an amazing group of tools to manage a system.
