---
title: Running Kubeadm on a bare-metal system (ubuntu-based)
description: A walkthrough on how to quickly install Kubeadm on a bare-metal system running Ubuntu 20.04 LTS (Focal Fossa).
img: volodymyr-hryshchenko-inI8GnmS190-unsplash.jpg
alt: Running Kubeadm on a bare-metal system (ubuntu-based)
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2020-07-25T03:00:00.000Z
updateAt: 2020-07-25T03:00:00.000Z
---

## Introduction
Kubernetes has sky-rocketed in recent times, so it is a good skill to have, and I love playing around with it. 
Recently I acquired a Dell R410 server, so I felt the need
to immediately do something with it. Thus, this article quickly shows how to install kubernetes via Kubeadm on a bare-metal system.

## Installation
To begin installing Kubeadm and other requirements we can refer to the [installation](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/) procedure.
To quickly recap, we can use the following commands:

```bash
# move to root account
sudo su
# turn off swap
swapoff -a
# disable swap in fstab
nano /etc/fstab
# verify br_netfilter is loaded
lsmod | grep br_netfilter
# fix bridging in iptables
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sudo sysctl --system
```

I will assume that docker is already installed such that we can use that as our container runtime interface 
([CRI](https://kubernetes.io/docs/concepts/overview/components/#container-runtime)). 
However, if not, we can quickly install docker via:

```bash
# still as root
# install docker
wget -qO- https://get.docker.com/ | sh
# could use for a specific user other than root
usermod -aG docker $USER
# configure our cgroup driver
cat > /etc/docker/daemon.json <<EOF
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2"
}
EOF
systemctl daemon-reload
systemctl restart docker
```

Now let's install kubeadm, kubectl and kubelet

```bash
# as a regular user
sudo apt-get update && sudo apt-get install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

At this point we should have successfully installed Kubeadm. However, I will expand further. 
To use a container network interface ([CNI](https://kubernetes.io/docs/concepts/cluster-administration/addons/)) such as [Calico](https://docs.projectcalico.org/getting-started/kubernetes/quickstart) we need to include
a pod network CIDR:

```bash
# as a regular user
sudo kubeadm init --pod-network-cidr=192.168.0.0/16
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
# install operator
kubectl create -f https://docs.projectcalico.org/manifests/tigera-operator.yaml
# edit if CIDR is different or edit if needed (include --edit in the command)
kubectl create -f https://docs.projectcalico.org/manifests/custom-resources.yaml
```

To monitor for the changes you could always call `watch kubectl get pods -n calico-system`. Remove taints `kubectl taint nodes --all node-role.kubernetes.io/master-`
once the `calico-system` is up. Verify your system `kubectl get nodes -o wide` as Ready.

I like to use [kubernetes dashboard](https://github.com/kubernetes/dashboard/tree/master/docs/user). To install first we should install
[metrics-server](https://github.com/kubernetes-sigs/metrics-server):

```yaml[metrics-server.yaml]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: system:aggregated-metrics-reader
  labels:
    rbac.authorization.k8s.io/aggregate-to-view: "true"
    rbac.authorization.k8s.io/aggregate-to-edit: "true"
    rbac.authorization.k8s.io/aggregate-to-admin: "true"
rules:
- apiGroups: ["metrics.k8s.io"]
  resources: ["pods", "nodes"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: metrics-server:system:auth-delegator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:auth-delegator
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: metrics-server-auth-reader
  namespace: kube-system
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: extension-apiserver-authentication-reader
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: apiregistration.k8s.io/v1beta1
kind: APIService
metadata:
  name: v1beta1.metrics.k8s.io
spec:
  service:
    name: metrics-server
    namespace: kube-system
  group: metrics.k8s.io
  version: v1beta1
  insecureSkipTLSVerify: true
  groupPriorityMinimum: 100
  versionPriority: 100
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: metrics-server
  namespace: kube-system
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metrics-server
  namespace: kube-system
  labels:
    k8s-app: metrics-server
spec:
  selector:
    matchLabels:
      k8s-app: metrics-server
  template:
    metadata:
      name: metrics-server
      labels:
        k8s-app: metrics-server
    spec:
      serviceAccountName: metrics-server
      volumes:
      # mount in tmp so we can safely use from-scratch images and/or read-only containers
      - name: tmp-dir
        emptyDir: {}
      containers:
      - name: metrics-server
        image: k8s.gcr.io/metrics-server/metrics-server:v0.3.7
        imagePullPolicy: IfNotPresent
        args:
          - --kubelet-insecure-tls
          - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
          - --metric-resolution=30s        
          - --cert-dir=/tmp
          - --secure-port=4443
        ports:
        - name: main-port
          containerPort: 4443
          protocol: TCP
        securityContext:
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
        volumeMounts:
        - name: tmp-dir
          mountPath: /tmp
      hostNetwork: true
      nodeSelector:
        kubernetes.io/os: linux
        kubernetes.io/arch: "amd64"
---
apiVersion: v1
kind: Service
metadata:
  name: metrics-server
  namespace: kube-system
  labels:
    kubernetes.io/name: "Metrics-server"
    kubernetes.io/cluster-service: "true"
spec:
  selector:
    k8s-app: metrics-server
  ports:
  - port: 443
    protocol: TCP
    targetPort: main-port
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: system:metrics-server
rules:
- apiGroups:
  - ""
  resources:
  - pods
  - nodes
  - nodes/stats
  - namespaces
  - configmaps
  verbs:
  - get
  - list
  - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: system:metrics-server
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:metrics-server
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
```

The above yaml was modified under deployment to allow Calico and metrics-server to function. From the default yaml 
I have added the following:

```yaml
args:
- --kubelet-insecure-tls
- --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
- --metric-resolution=30s
```

```yaml
hostNetwork: true
```

Now we can proceed to install the dashboard:

```bash
kubectl create -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.3/aio/deploy/recommended.yaml
```

As suggested by the documentation we can create a token based user:

```yaml[dashboard-adminuser.yaml]
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
```

```bash
kubectl apply -f dashboard-adminuser.yaml
# verify metrics are working
kubectl top node
```

To obtain your token call:

```bash
# look for admin-user and use that token
kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | grep admin-user | awk '{print $1}')
```

May be you would like to remotely connect to the dashboard:

```bash
# create an accessible location to the dashbaord assuming you have UFW in place -- I HOPE SO!!!
sudo ufw allow from <ip> to any port 8080 proto tcp
# create the port-forward
kubectl port-forward -n kubernetes-dashboard service/kubernetes-dashboard 8080:443 --address 0.0.0.0
```

and now you can view your [dashboard](https://<ip>:8080). If you want to connect via localhost just use the cluster ip of the dashboard:

```bash
kubectl get svc -n kubernetes-dashboard 

NAME                        TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
dashboard-metrics-scraper   ClusterIP   10.103.55.16   <none>        8000/TCP   92m
kubernetes-dashboard        ClusterIP   10.111.228.4   <none>        443/TCP    92m
```

## Final Words
I quickly show how to install Kubeadm with a CNI, Calico, and a kubernetes dashboard that utilizes metrics-server. Hopefully, 
your installation was a success. Have fun!
