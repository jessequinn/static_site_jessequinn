---
title: Apache Hadoop and Yarn - Big Data Series
description: I talk about my adventure into "big data" starting with Apache Hadoop and Yarn.
img: taylor-vick-M5tzZtFCOfs-unsplash.jpg
alt: Apache Hadoop and Yarn - Big Data Series
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2020-11-21T03:00:00.000Z
updateAt: 2020-11-21T03:00:00.000Z
---

## Introduction
I feel a little late to the party, probably by half a decade or more, but nonetheless, I was recently tasked with creating a proof of concept - 
ecosystem for big data. With that said,
my adventures began with configuring a compute instance on our cloud provider and installing docker/docker-compose. At which point, scouring the
many documents and sites on "big data" I opted with [Apache Hadoop](https://hadoop.apache.org/), a well-known, reliable, scalable, distributed computing framework.
Obviously, Hadoop/HDFS is not everyone's game, and considering I have already created and maintain our Elastic stack, we wanted to see what we could gain from a 
system based on Apache Hadoop, [Apache Spark](https://spark.apache.org/), etc.

Sooooo, basically I will just talk about how I configured Apache Hadoop and Yarn with docker. Let's begin!

## Configuration
I am assuming that both docker and docker-compose have been installed.

We could install hadoop and yarn as a single node "cluster", but as I am using docker-compose to represent a "cluster" that could potentially 
be provisioned and configured
in the future with Terraform etc.

So, I envisioned the following as HDFS uses a master/slave architecture: An HDFS cluster consists of a 
name node that manages the file system and regulates access, while
there are a number of data nodes, which manage storage attached to the nodes that they run on. Thus, for Hadoop I would create one name node and many data nodes.
In a similar manner, with Yarn, I would create one resource manager, as the name implies - it manages resources, one history server, maintains logs of application runs,
and many node managers (slaves).

### Hadoop
So based on solid work from [Big Data Europe](https://www.big-data-europe.eu/) I created several `Dockerfiles` that are based on the following:

```dockerfile[Dockerfile]
ARG debian_image_tag=10
FROM debian:${debian_image_tag}
LABEL authors="Jesse Quinn <me@jessequinn.info>"

# -- Layer: Image Metadata

ARG build_date

LABEL org.label-schema.build-date=${build_date}
LABEL org.label-schema.name="Apache Hadoop Cluster Image - Cluster Base Image"
LABEL org.label-schema.description="Hadoop base image"
LABEL org.label-schema.url="xxxx"
LABEL org.label-schema.schema-version="1.0"

# -- Layer: OS + Java + Hadoop

RUN set -x \
 && apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends curl apt-transport-https ca-certificates software-properties-common gnupg \
 && curl -fsSL https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public | apt-key add - \
 && add-apt-repository --yes https://adoptopenjdk.jfrog.io/adoptopenjdk/deb/ \
 && apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends adoptopenjdk-8-hotspot net-tools netcat libsnappy-dev \
 && curl -O https://dist.apache.org/repos/dist/release/hadoop/common/KEYS \
# && gpg --import KEYS \
 && rm -rf /var/lib/apt/lists/*

ARG hadoop_version

RUN set -x \
# && curl -fSL https://www.apache.org/dist/hadoop/common/hadoop-${hadoop_version}/hadoop-${hadoop_version}.tar.gz -o /tmp/hadoop.tar.gz \
 && curl -fSL https://archive.apache.org/dist/hadoop/common/hadoop-${hadoop_version}/hadoop-${hadoop_version}.tar.gz -o /tmp/hadoop.tar.gz \
# && curl -fSL https://www.apache.org/dist/hadoop/common/hadoop-${hadoop_version}/hadoop-${hadoop_version}.tar.gz.asc -o /tmp/hadoop.tar.gz.asc \
# && gpg --verify /tmp/hadoop.tar.gz.asc /tmp/hadoop.tar.gz \
 && tar -xvf /tmp/hadoop.tar.gz -C /opt/ \
 && ln -s /opt/hadoop-${hadoop_version}/etc/hadoop /etc/hadoop \
 && mkdir /opt/hadoop-${hadoop_version}/logs \
 && mkdir /hadoop-data \
 && rm /tmp/hadoop.tar.gz*

ENV JAVA_HOME=/usr/lib/jvm/adoptopenjdk-8-hotspot-amd64
ENV HADOOP_HOME=/opt/hadoop-${hadoop_version}
ENV HADOOP_CONF_DIR=/etc/hadoop
ENV MULTIHOMED_NETWORK=1
ENV USER=root
ENV PATH $HADOOP_HOME/bin/:$PATH

COPY mapred-site.xml ${HADOOP_CONF_DIR}/mapred-site.xml
COPY capacity-scheduler.xml ${HADOOP_CONF_DIR}/capacity-scheduler.xml

# -- Layer: Sqoop

ARG sqoop_version
ENV SQOOP_HOME=/opt/sqoop
ENV SQOOP_CONF_DIR=/opt/sqoop/conf

ADD https://downloads.apache.org/sqoop/${sqoop_version}/sqoop-${sqoop_version}.bin__hadoop-2.6.0.tar.gz /tmp/
ADD https://raw.githubusercontent.com/apache/hadoop/trunk/hadoop-common-project/hadoop-common/src/main/bin/hadoop-functions.sh /opt/hadoop-${hadoop_version}/libexec/

WORKDIR /tmp

RUN set -x \
 && tar -xvf sqoop-${sqoop_version}.bin__hadoop-2.6.0.tar.gz \
 && mkdir -p /opt/sqoop \
 && mv sqoop-${sqoop_version}.bin__hadoop-2.6.0/* /opt/sqoop/ \
 && rm -rf sqoop-${sqoop_version}.bin__hadoop-2.6.0 \
 && rm sqoop-${sqoop_version}.bin__hadoop-2.6.0.tar.gz

COPY jars/sqljdbc42.jar jars/commons-lang-2.6.jar jars/postgresql-42.2.18.jar /opt/sqoop/lib/

ENV PATH $SQOOP_HOME/bin:$PATH

WORKDIR /opt

# -- Runtime

ADD entrypoint.sh /entrypoint.sh

RUN chmod a+x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

```bash[entrypoint.sh]
#!/bin/bash

# Set some sensible defaults
export CORE_CONF_fs_defaultFS=${CORE_CONF_fs_defaultFS:-hdfs://`hostname -f`:8020}

function addProperty() {
  local path=$1
  local name=$2
  local value=$3

  local entry="<property><name>$name</name><value>${value}</value></property>"
  local escapedEntry=$(echo $entry | sed 's/\//\\\//g')
  sed -i "/<\/configuration>/ s/.*/${escapedEntry}\n&/" $path
}

function configure() {
    local path=$1
    local module=$2
    local envPrefix=$3

    local var
    local value
    
    echo "Configuring $module"
    for c in `printenv | perl -sne 'print "$1 " if m/^${envPrefix}_(.+?)=.*/' -- -envPrefix=$envPrefix`; do 
        name=`echo ${c} | perl -pe 's/___/-/g; s/__/@/g; s/_/./g; s/@/_/g;'`
        var="${envPrefix}_${c}"
        value=${!var}
        echo " - Setting $name=$value"
        addProperty $path $name "$value"
    done
}

configure /etc/hadoop/core-site.xml core CORE_CONF
configure /etc/hadoop/hdfs-site.xml hdfs HDFS_CONF
configure /etc/hadoop/yarn-site.xml yarn YARN_CONF
configure /etc/hadoop/httpfs-site.xml httpfs HTTPFS_CONF
configure /etc/hadoop/kms-site.xml kms KMS_CONF
configure /etc/hadoop/mapred-site.xml mapred MAPRED_CONF

if [ "$MULTIHOMED_NETWORK" = "1" ]; then
    echo "Configuring for multihomed network"

    # HDFS
    addProperty /etc/hadoop/hdfs-site.xml dfs.namenode.rpc-bind-host 0.0.0.0
    addProperty /etc/hadoop/hdfs-site.xml dfs.namenode.servicerpc-bind-host 0.0.0.0
    addProperty /etc/hadoop/hdfs-site.xml dfs.namenode.http-bind-host 0.0.0.0
    addProperty /etc/hadoop/hdfs-site.xml dfs.namenode.https-bind-host 0.0.0.0
    addProperty /etc/hadoop/hdfs-site.xml dfs.client.use.datanode.hostname true
    addProperty /etc/hadoop/hdfs-site.xml dfs.datanode.use.datanode.hostname true

    # YARN
    addProperty /etc/hadoop/yarn-site.xml yarn.resourcemanager.bind-host 0.0.0.0
    addProperty /etc/hadoop/yarn-site.xml yarn.nodemanager.bind-host 0.0.0.0
    addProperty /etc/hadoop/yarn-site.xml yarn.timeline-service.bind-host 0.0.0.0

    # MAPRED
    addProperty /etc/hadoop/mapred-site.xml yarn.nodemanager.bind-host 0.0.0.0
fi

if [ -n "$GANGLIA_HOST" ]; then
    mv /etc/hadoop/hadoop-metrics.properties /etc/hadoop/hadoop-metrics.properties.orig
    mv /etc/hadoop/hadoop-metrics2.properties /etc/hadoop/hadoop-metrics2.properties.orig

    for module in mapred jvm rpc ugi; do
        echo "$module.class=org.apache.hadoop.metrics.ganglia.GangliaContext31"
        echo "$module.period=10"
        echo "$module.servers=$GANGLIA_HOST:8649"
    done > /etc/hadoop/hadoop-metrics.properties
    
    for module in namenode datanode resourcemanager nodemanager mrappmaster jobhistoryserver; do
        echo "$module.sink.ganglia.class=org.apache.hadoop.metrics2.sink.ganglia.GangliaSink31"
        echo "$module.sink.ganglia.period=10"
        echo "$module.sink.ganglia.supportsparse=true"
        echo "$module.sink.ganglia.slope=jvm.metrics.gcCount=zero,jvm.metrics.memHeapUsedM=both"
        echo "$module.sink.ganglia.dmax=jvm.metrics.threadsBlocked=70,jvm.metrics.memHeapUsedM=40"
        echo "$module.sink.ganglia.servers=$GANGLIA_HOST:8649"
    done > /etc/hadoop/hadoop-metrics2.properties
fi

function wait_for_it()
{
    local serviceport=$1
    local service=${serviceport%%:*}
    local port=${serviceport#*:}
    local retry_seconds=5
    local max_try=100
    let i=1

    nc -z $service $port
    result=$?

    until [ $result -eq 0 ]; do
      echo "[$i/$max_try] check for ${service}:${port}..."
      echo "[$i/$max_try] ${service}:${port} is not available yet"
      if (( $i == $max_try )); then
        echo "[$i/$max_try] ${service}:${port} is still not available; giving up after ${max_try} tries. :/"
        exit 1
      fi
      
      echo "[$i/$max_try] try in ${retry_seconds}s once again ..."
      let "i++"
      sleep $retry_seconds

      nc -z $service $port
      result=$?
    done
    echo "[$i/$max_try] $service:${port} is available."
}

for i in ${SERVICE_PRECONDITION[@]}
do
    wait_for_it ${i}
done

exec $@
```

```xml[capacity-scheduler.xml]
<!--
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License. See accompanying LICENSE file.
-->
<configuration>

    <property>
        <name>yarn.scheduler.capacity.maximum-applications</name>
        <value>10000</value>
        <description>
            Maximum number of applications that can be pending and running.
        </description>
    </property>

    <property>
        <name>yarn.scheduler.capacity.maximum-am-resource-percent</name>
        <value>0.3</value>
        <description>
            Maximum percent of resources in the cluster which can be used to run
            application masters i.e. controls number of concurrent running
            applications.
        </description>
    </property>

    <property>
        <name>yarn.scheduler.capacity.resource-calculator</name>
        <value>org.apache.hadoop.yarn.util.resource.DefaultResourceCalculator</value>
        <description>
            The ResourceCalculator implementation to be used to compare
            Resources in the scheduler.
            The default i.e. DefaultResourceCalculator only uses Memory while
            DominantResourceCalculator uses dominant-resource to compare
            multi-dimensional resources such as Memory, CPU etc.
        </description>
    </property>

    <property>
        <name>yarn.scheduler.capacity.root.queues</name>
        <value>default</value>
        <description>
            The queues at the this level (root is the root queue).
        </description>
    </property>

    <property>
        <name>yarn.scheduler.capacity.root.default.capacity</name>
        <value>100</value>
        <description>Default queue target capacity.</description>
    </property>

    <property>
        <name>yarn.scheduler.capacity.root.default.user-limit-factor</name>
        <value>1</value>
        <description>
            Default queue user limit a percentage from 0.0 to 1.0.
        </description>
    </property>

    <property>
        <name>yarn.scheduler.capacity.root.default.maximum-capacity</name>
        <value>100</value>
        <description>
            The maximum capacity of the default queue.
        </description>
    </property>

    <property>
        <name>yarn.scheduler.capacity.root.default.state</name>
        <value>RUNNING</value>
        <description>
            The state of the default queue. State can be one of RUNNING or STOPPED.
        </description>
    </property>

    <property>
        <name>yarn.scheduler.capacity.root.default.acl_submit_applications</name>
        <value>*</value>
        <description>
            The ACL of who can submit jobs to the default queue.
        </description>
    </property>

    <property>
        <name>yarn.scheduler.capacity.root.default.acl_administer_queue</name>
        <value>*</value>
        <description>
            The ACL of who can administer jobs on the default queue.
        </description>
    </property>

    <property>
        <name>yarn.scheduler.capacity.node-locality-delay</name>
        <value>40</value>
        <description>
            Number of missed scheduling opportunities after which the CapacityScheduler
            attempts to schedule rack-local containers.
            Typically this should be set to number of nodes in the cluster, By default is setting
            approximately number of nodes in one rack which is 40.
        </description>
    </property>

    <property>
        <name>yarn.scheduler.capacity.queue-mappings</name>
        <value></value>
        <description>
            A list of mappings that will be used to assign jobs to queues
            The syntax for this list is [u|g]:[name]:[queue_name][,next mapping]*
            Typically this list will be used to map users to queues,
            for example, u:%user:%user maps all users to queues with the same name
            as the user.
        </description>
    </property>

    <property>
        <name>yarn.scheduler.capacity.queue-mappings-override.enable</name>
        <value>false</value>
        <description>
            If a queue mapping is present, will it override the value specified
            by the user? This can be used by administrators to place jobs in queues
            that are different than the one specified by the user.
            The default is false.
        </description>
    </property>

</configuration>
```

```xml[mapred-site.xml]
<?xml version="1.0"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<!--
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License. See accompanying LICENSE file.
-->

<!-- Put site-specific property overrides in this file. -->

<configuration>

</configuration>
```

The `entrypoint.sh` will digest environment variables and populate the corresponding `xml` configuration files for Hadoop. In the future, 
I will modify the entrypoint script
to also create the `mapred-site.xml` and update the `capacity-scheduler.xml` rather than doing a COPY in the `dockerfile`. This is an issue 
with Hadoop 2.7.7 I believe,
which is the version I opted to use due to [Apache Oozie](https://oozie.apache.org/).

Side note, Apache Oozie is a scheduler for various tasks that I want to use with [Hue](https://gethue.com/), but it has been a nightmare to compile with 
new versions of Hadoop and Hive.

I will not explain all the settings in each of these files; however, from `capacity-scheduler.xml` the most important was the 
`yarn.scheduler.capacity.maximum-am-resource-percent`. 
I set this to 0.3 but no more than 0.5 to allow better utilization of my resources when using Yarn. By default, I believe Hadoop uses 0.1 or 10%.

An example `.env` could contain the following:

```dotenv[.env]
CORE_CONF_fs_defaultFS=hdfs://namenode:8020
CORE_CONF_hadoop_http_staticuser_user=root
CORE_CONF_hadoop_proxyuser_hue_hosts=*
CORE_CONF_hadoop_proxyuser_hue_groups=*
CORE_CONF_hadoop_proxyuser_hive_hosts=*
CORE_CONF_hadoop_proxyuser_hive_groups=*
CORE_CONF_hadoop_proxyuser_oozie_hosts=*
CORE_CONF_hadoop_proxyuser_oozie_groups=*
CORE_CONF_hadoop_proxyuser_root_hosts=*
CORE_CONF_hadoop_proxyuser_root_groups=*
CORE_CONF_hadoop_proxyuser_hdfs_hosts=*
CORE_CONF_hadoop_proxyuser_hdfs_groups=*
CORE_CONF_io_compression_codecs=org.apache.hadoop.io.compress.SnappyCodec

HDFS_CONF_dfs_webhdfs_enabled=true
HDFS_CONF_dfs_permissions_enabled=false
HDFS_CONF_dfs_namenode_datanode_registration_ip___hostname___check=false
HDFS_CONF_dfs_replication=3

YARN_CONF_yarn_nodemanager_localizer_cache_cleanup_interval___ms=400000
YARN_CONF_yarn_nodemanager_localizer_cache_target___size___mb=5120
YARN_CONF_yarn_log___aggregation___enable=true
YARN_CONF_yarn_log_server_url=http://historyserver:8188/applicationhistory/logs/
YARN_CONF_yarn_resourcemanager_recovery_enabled=true
YARN_CONF_yarn_resourcemanager_store_class=org.apache.hadoop.yarn.server.resourcemanager.recovery.FileSystemRMStateStore
YARN_CONF_yarn_resourcemanager_scheduler_class=org.apache.hadoop.yarn.server.resourcemanager.scheduler.capacity.CapacityScheduler
YARN_CONF_yarn_resourcemanager_fs_state___store_uri=/rmstate
YARN_CONF_yarn_resourcemanager_system___metrics___publisher_enabled=true
YARN_CONF_yarn_resourcemanager_hostname=resourcemanager
YARN_CONF_yarn_resourcemanager_address=resourcemanager:8032
YARN_CONF_yarn_resourcemanager_scheduler_address=resourcemanager:8030
YARN_CONF_yarn_resourcemanager_resource__tracker_address=resourcemanager:8031
YARN_CONF_yarn_timeline___service_enabled=true
YARN_CONF_yarn_timeline___service_generic___application___history_enabled=true
YARN_CONF_yarn_timeline___service_hostname=historyserver
YARN_CONF_mapreduce_map_output_compress=true
YARN_CONF_mapred_map_output_compress_codec=org.apache.hadoop.io.compress.SnappyCodec
YARN_CONF_yarn_nodemanager_resource_memory___mb=12288
YARN_CONF_yarn_nodemanager_resource_cpu___vcores=2
YARN_CONF_yarn_scheduler_minimum___allocation___mb=512
YARN_CONF_yarn_scheduler_maximum___allocation___mb=12288
YARN_CONF_yarn_scheduler_minimum___allocation___vcores=1
YARN_CONF_yarn_scheduler_maximum___allocation___vcores=2
YARN_CONF_yarn_nodemanager_disk___health___checker_max___disk___utilization___per___disk___percentage=98.5
YARN_CONF_yarn_nodemanager_remote___app___log___dir=/app-logs
YARN_CONF_yarn_nodemanager_aux___services=mapreduce_shuffle
YARN_CONF_yarn_nodemanager_vmem___check___enabled=false

MAPRED_CONF_mapreduce_framework_name=yarn
MAPRED_CONF_mapred_child_java_opts=-Xmx2048m
MAPRED_CONF_mapreduce_map_memory_mb=4096
MAPRED_CONF_mapreduce_reduce_memory_mb=4096
MAPRED_CONF_mapreduce_map_java_opts=-Xmx3277m
MAPRED_CONF_mapreduce_reduce_java_opts=-Xmx3277m
MAPRED_CONF_yarn_app_mapreduce_am_env=HADOOP_MAPRED_HOME=/opt/hadoop-2.7.7/
MAPRED_CONF_mapreduce_map_env=HADOOP_MAPRED_HOME=/opt/hadoop-2.7.7/
MAPRED_CONF_mapreduce_reduce_env=HADOOP_MAPRED_HOME=/opt/hadoop-2.7.7/

HTTPFS_CONF_httpfs_proxyuser_hue_hosts=*
HTTPFS_CONF_httpfs_proxyuser_hue_groups=*
```

Name node:

```dockerfile[Dockefile]
FROM hadoop-base
LABEL authors="Jesse Quinn <me@jessequinn.info>"

# -- Layer: Image Metadata

ARG build_date

LABEL org.label-schema.build-date=${build_date}
LABEL org.label-schema.name="Apache Hadoop Cluster Image - Cluster Namenode Image"
LABEL org.label-schema.description="Hadoop namenode image"
LABEL org.label-schema.url="xxxx"
LABEL org.label-schema.schema-version="1.0"

# -- Layer: Healthcheck + Volume

#HEALTHCHECK CMD curl -f http://localhost:9870/ || exit 1
HEALTHCHECK CMD curl -f http://localhost:50070/ || exit 1

ENV HDFS_CONF_dfs_namenode_name_dir=file:///hadoop/dfs/name
RUN mkdir -p /hadoop/dfs/name
VOLUME /hadoop/dfs/name

# -- Runtime

ADD run.sh /run.sh

RUN chmod a+x /run.sh

EXPOSE 50070

CMD ["/run.sh"]
```

```bash[run.sh]
#!/bin/bash

namedir=`echo $HDFS_CONF_dfs_namenode_name_dir | perl -pe 's#file://##'`
if [ ! -d $namedir ]; then
  echo "Namenode name directory not found: $namedir"
  exit 2
fi

if [ -z "$CLUSTER_NAME" ]; then
  echo "Cluster name not specified"
  exit 2
fi

echo "remove lost+found from $namedir"
rm -r $namedir/lost+found

if [ "`ls -A $namedir`" == "" ]; then
  echo "Formatting namenode name directory: $namedir"
  $HADOOP_HOME/bin/hdfs --config $HADOOP_CONF_DIR namenode -format $CLUSTER_NAME
fi

$HADOOP_HOME/bin/hdfs --config $HADOOP_CONF_DIR namenode
```

Data node:

```dockerfile[Dockerfile]
FROM hadoop-base
LABEL authors="Jesse Quinn <me@jessequinn.info>"

# -- Layer: Image Metadata

ARG build_date

LABEL org.label-schema.build-date=${build_date}
LABEL org.label-schema.name="Apache Hadoop Cluster Image - Cluster Datanode Image"
LABEL org.label-schema.description="Hadoop Datanode image"
LABEL org.label-schema.url="xxxx"
LABEL org.label-schema.schema-version="1.0"

# -- Layer: Healthcheck + Volume

#HEALTHCHECK CMD curl -f http://localhost:9864/ || exit 1
HEALTHCHECK CMD curl -f http://localhost:50075/ || exit 1

ENV HDFS_CONF_dfs_datanode_data_dir=file:///hadoop/dfs/data
RUN mkdir -p /hadoop/dfs/data
VOLUME /hadoop/dfs/data

# -- Runtime

ADD run.sh /run.sh

RUN chmod a+x /run.sh

EXPOSE 50075

CMD ["/run.sh"]
```

```bash[run.sh]
#!/bin/bash

datadir=`echo $HDFS_CONF_dfs_datanode_data_dir | perl -pe 's#file://##'`
if [ ! -d $datadir ]; then
  echo "Datanode data directory not found: $datadir"
  exit 2
fi

$HADOOP_HOME/bin/hdfs --config $HADOOP_CONF_DIR datanode
```

The following `Makefile` could help:

```
TAG    								:= $$(git rev-parse --short HEAD)
BUILD_DATE							:= $$(date -u +'%Y-%m-%d')

# -- Version

HADOOP_VERSION						:= $$(grep -m 1 hadoop build.yml | grep -o -P '(?<=").*(?=")')
HADOOP_MAJOR_VERSION				:= $$(grep -m 1 hadoop_major build.yml | grep -o -P '(?<=").*(?=")')
SQOOP_VERSION						:= $$(grep -m 1 sqoop build.yml | grep -o -P '(?<=").*(?=")')

# -- Images

HADOOP_BASE							:= hadoop-base
HADOOP_BASE_TAG						:= ${HADOOP_BASE}:${TAG}
HADOOP_BASE_LATEST					:= ${HADOOP_BASE}:latest
HADOOP_DATANODE						:= hadoop-datanode
HADOOP_DATANODE_TAG   				:= ${HADOOP_DATANODE}:${TAG}
HADOOP_DATANODE_LATEST				:= ${HADOOP_DATANODE}:latest
HADOOP_NAMENODE						:= hadoop-namenode
HADOOP_NAMENODE_TAG   				:= ${HADOOP_NAMENODE}:${TAG}
HADOOP_NAMENODE_LATEST				:= ${HADOOP_NAMENODE}:latest
HADOOP_HISTORYSERVER				:= hadoop-historyserver
HADOOP_HISTORYSERVER_TAG   			:= ${HADOOP_HISTORYSERVER}:${TAG}
HADOOP_HISTORYSERVER_LATEST			:= ${HADOOP_HISTORYSERVER}:latest
HADOOP_NODEMANAGER					:= hadoop-nodemanager
HADOOP_NODEMANAGER_TAG   			:= ${HADOOP_NODEMANAGER}:${TAG}
HADOOP_NODEMANAGER_LATEST			:= ${HADOOP_NODEMANAGER}:latest
HADOOP_RESOURCEMANAGER				:= hadoop-resourcemanager
HADOOP_RESOURCEMANAGER_TAG   		:= ${HADOOP_RESOURCEMANAGER}:${TAG}
HADOOP_RESOURCEMANAGER_LATEST		:= ${HADOOP_RESOURCEMANAGER}:latest

# -- Commands

.PHONY: build-all
build-all: build-hadoop

.PHONY: push-all
push-all: push-hadoop

.PHONY: build-hadoop-base
build-hadoop-base:
	@docker build \
	--build-arg build_date=${BUILD_DATE} \
    --build-arg hadoop_version=${HADOOP_VERSION} \
    --build-arg sqoop_version=${SQOOP_VERSION} \
	-f docker/hadoop/base/Dockerfile \
	-t ${HADOOP_BASE_TAG} \
	docker/hadoop/base/
	@docker tag ${HADOOP_BASE_TAG} ${HADOOP_BASE_LATEST}
	@docker tag ${HADOOP_BASE_LATEST} xxxxx/${HADOOP_BASE_LATEST}
	@docker tag ${HADOOP_BASE_TAG} xxxxx/${HADOOP_BASE_TAG}

.PHONY: build-hadoop
build-hadoop: build-hadoop-base
	@docker build \
	--build-arg build_date=${BUILD_DATE} \
	-f docker/hadoop/datanode/Dockerfile \
	-t ${HADOOP_DATANODE_TAG} \
	docker/hadoop/datanode/
	@docker tag ${HADOOP_DATANODE_TAG} ${HADOOP_DATANODE_LATEST}
	@docker tag ${HADOOP_DATANODE_LATEST} xxxxx/${HADOOP_DATANODE_LATEST}
	@docker tag ${HADOOP_DATANODE_TAG} xxxxx/${HADOOP_DATANODE_TAG}

	@docker build \
	--build-arg build_date=${BUILD_DATE} \
	-f docker/hadoop/historyserver/Dockerfile \
	-t ${HADOOP_HISTORYSERVER_TAG} \
	docker/hadoop/historyserver/
	@docker tag ${HADOOP_HISTORYSERVER_TAG} ${HADOOP_HISTORYSERVER_LATEST}
	@docker tag ${HADOOP_HISTORYSERVER_LATEST} xxxxx/${HADOOP_HISTORYSERVER_LATEST}
	@docker tag ${HADOOP_HISTORYSERVER_TAG} xxxxx/${HADOOP_HISTORYSERVER_TAG}

	@docker build \
	--build-arg build_date=${BUILD_DATE} \
	-f docker/hadoop/namenode/Dockerfile \
	-t ${HADOOP_NAMENODE_TAG} \
	docker/hadoop/namenode/
	@docker tag ${HADOOP_NAMENODE_TAG} ${HADOOP_NAMENODE_LATEST}
	@docker tag ${HADOOP_NAMENODE_LATEST} xxxxx/${HADOOP_NAMENODE_LATEST}
	@docker tag ${HADOOP_NAMENODE_TAG} xxxxx/${HADOOP_NAMENODE_TAG}

	@docker build \
	--build-arg build_date=${BUILD_DATE} \
	-f docker/hadoop/nodemanager/Dockerfile \
	-t ${HADOOP_NODEMANAGER_TAG} \
	docker/hadoop/nodemanager/
	@docker tag ${HADOOP_NODEMANAGER_TAG} ${HADOOP_NODEMANAGER_LATEST}
	@docker tag ${HADOOP_NODEMANAGER_LATEST} xxxxx/${HADOOP_NODEMANAGER_LATEST}
	@docker tag ${HADOOP_NODEMANAGER_TAG} xxxxx/${HADOOP_NODEMANAGER_TAG}

	@docker build \
	--build-arg build_date=${BUILD_DATE} \
	-f docker/hadoop/resourcemanager/Dockerfile \
	-t ${HADOOP_RESOURCEMANAGER_TAG} \
	docker/hadoop/resourcemanager/
	@docker tag ${HADOOP_RESOURCEMANAGER_TAG} ${HADOOP_RESOURCEMANAGER_LATEST}
	@docker tag ${HADOOP_RESOURCEMANAGER_LATEST} xxxxx/${HADOOP_RESOURCEMANAGER_LATEST}
	@docker tag ${HADOOP_RESOURCEMANAGER_TAG} xxxxx/${HADOOP_RESOURCEMANAGER_TAG}

.PHONY: push-hadoop-base
push-hadoop-base:
	@docker push xxxx/${HADOOP_BASE_LATEST}
	@docker push xxxx/${HADOOP_BASE_TAG}

.PHONY: push-hadoop
push-hadoop: push-hadoop-base
	@docker push xxxxx/${HADOOP_DATANODE_LATEST}
	@docker push xxxxx/${HADOOP_DATANODE_TAG}
	@docker push xxxxx/${HADOOP_HISTORYSERVER_LATEST}
	@docker push xxxxx/${HADOOP_HISTORYSERVER_TAG}
	@docker push xxxxx/${HADOOP_NAMENODE_LATEST}
	@docker push xxxxx/${HADOOP_NAMENODE_TAG}
	@docker push xxxxx/${HADOOP_NODEMANAGER_LATEST}
	@docker push xxxxx/${HADOOP_NODEMANAGER_TAG}
	@docker push xxxxx/${HADOOP_RESOURCEMANAGER_LATEST}
	@docker push xxxxx/${HADOOP_RESOURCEMANAGER_TAG}
```

```yaml[build.yml]
applications:
  sqoop: "1.4.7"
  hadoop: "2.7.7"
  hadoop_major: "2.7"
```

### Yarn
The following are very important settings from the above `.env` that relate to Yarn:

```
YARN_CONF_yarn_nodemanager_resource_memory___mb=12288
YARN_CONF_yarn_nodemanager_resource_cpu___vcores=2
YARN_CONF_yarn_scheduler_minimum___allocation___mb=512
YARN_CONF_yarn_scheduler_maximum___allocation___mb=12288
YARN_CONF_yarn_scheduler_minimum___allocation___vcores=1
YARN_CONF_yarn_scheduler_maximum___allocation___vcores=2

...

MAPRED_CONF_mapred_child_java_opts=-Xmx2048m
MAPRED_CONF_mapreduce_map_memory_mb=4096
MAPRED_CONF_mapreduce_reduce_memory_mb=4096
MAPRED_CONF_mapreduce_map_java_opts=-Xmx3277m
MAPRED_CONF_mapreduce_reduce_java_opts=-Xmx3277m
```

`yarn.nodemanager.resource.memory-mb` is the maximum amount of memory a node manager can use. The same goes for the 
`yarn.nodemanager.resource.cpu-vcores` but for cpus. `yarn.scheduler.minimum-allocation-mb=512` represents the smallest
value for a container memory allocation in the scheduler. The other allocations should be self-explanatory. The mapreduce parameters are tricky.
But, a BIG BUT, from what I have read, `mapreduce.[map|reduce].java.opts` should be no more than 80% of what you 
use in `mapreduce.[map|reduce].memory.mb`. `mapred.map.child.java.opts`
is the heap memory allocated per child process. These settings require fine-tuning and exploration.

Resource manager:

```dockerfile[Dockerfile]
FROM hadoop-base
LABEL authors="Jesse Quinn <me@jessequinn.info>"

# -- Layer: Image Metadata

ARG build_date

LABEL org.label-schema.build-date=${build_date}
LABEL org.label-schema.name="Apache Hadoop Cluster Image - Cluster Resourcemanager Image"
LABEL org.label-schema.description="Hadoop resourcemanager image"
LABEL org.label-schema.url="xxxx"
LABEL org.label-schema.schema-version="1.0"

# -- Layer: Healthcheck

HEALTHCHECK CMD curl -f http://localhost:8088/ || exit 1

# -- Runtime

ADD run.sh /run.sh

RUN chmod a+x /run.sh

EXPOSE 8088

CMD ["/run.sh"]
```

```bash[run.sh]
#!/bin/bash

$HADOOP_HOME/bin/yarn --config $HADOOP_CONF_DIR resourcemanager
```

History server:

```dockerfile[Dockerfile]
FROM hadoop-base
LABEL authors="Jesse Quinn <me@jessequinn.info>"

# -- Layer: Image Metadata

ARG build_date

LABEL org.label-schema.build-date=${build_date}
LABEL org.label-schema.name="Apache Hadoop Cluster Image - Cluster Historyserver Image"
LABEL org.label-schema.description="Hadoop historyserver image"
LABEL org.label-schema.url="xxxx"
LABEL org.label-schema.schema-version="1.0"

# -- Layer: Healthcheck + Volume

HEALTHCHECK CMD curl -f http://localhost:8188/ || exit 1

ENV YARN_CONF_yarn_timeline___service_leveldb___timeline___store_path=/hadoop/yarn/timeline
RUN mkdir -p /hadoop/yarn/timeline
VOLUME /hadoop/yarn/timeline

# -- Runtime

ADD run.sh /run.sh

RUN chmod a+x /run.sh

EXPOSE 8188

CMD ["/run.sh"]
```

```bash[run.sh]
#!/bin/bash

$HADOOP_HOME/bin/yarn --config $HADOOP_CONF_DIR historyserver
```

Node manager:

```dockerfile[Dockerfile]
FROM hadoop-base
LABEL authors="Jesse Quinn <me@jessequinn.info>"

# -- Layer: Image Metadata

ARG build_date

LABEL org.label-schema.build-date=${build_date}
LABEL org.label-schema.name="Apache Hadoop Cluster Image - Cluster Nodemanager Image"
LABEL org.label-schema.description="Hadoop nodemanager image"
LABEL org.label-schema.url="xxxx"
LABEL org.label-schema.schema-version="1.0"

# -- Layer: Healthcheck

HEALTHCHECK CMD curl -f http://localhost:8042/ || exit 1

# -- Layer: Python

RUN set -x \
 && apt-get update -y \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 python3-pip python3-dev python3-setuptools python3-wheel python3-wget \
 && pip3 install numpy

# -- Runtime

ADD run.sh /run.sh

RUN chmod a+x /run.sh

EXPOSE 8042

CMD ["/run.sh"]
```

```bash[run.sh]
#!/bin/bash

$HADOOP_HOME/bin/yarn --config $HADOOP_CONF_DIR nodemanager
```

### Orchestration
Once all images have been built we can use them in our `docker-compose.yml`:

```dockerfile[docker-compose.yml]
version: '3.8'

x-logging:
  &default-logging
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"

networks:
  hadoop-dev-net:
    name: hadoop-dev-net
    driver: bridge

services:
# -- HADOOP
  namenode:
    image: xxxx/hadoop-namenode
    container_name: namenode
    hostname: namenode
    restart: always
    ports:
#      - 9870:9870
#      - 9000:9000
      - 50070:50070
    volumes:
      - /data/hadoop/namenode:/hadoop/dfs/name
    environment:
      - CLUSTER_NAME=test
    env_file:
      - ./hadoop.env
    networks:
      - hadoop-dev-net
    logging: *default-logging
    labels:
      org.label-schema.group: development

  datanode1:
    image: xxxx/hadoop-datanode
    container_name: datanode1
    hostname: datanode1
    restart: always
    volumes:
      - /data/hadoop/datanode1:/hadoop/dfs/data
    environment:
      SERVICE_PRECONDITION: "namenode:50070"
    env_file:
      - ./hadoop.env
    depends_on:
      - namenode
    networks:
      - hadoop-dev-net
    logging: *default-logging
    labels:
      org.label-schema.group: development

  datanode2:
    image: xxxx/hadoop-datanode
    container_name: datanode2
    hostname: datanode2
    restart: always
    volumes:
      - /data/hadoop/datanode2:/hadoop/dfs/data
    environment:
      SERVICE_PRECONDITION: "namenode:50070"
    env_file:
      - ./hadoop.env
    depends_on:
      - namenode
    networks:
      - hadoop-dev-net
    logging: *default-logging
    labels:
      org.label-schema.group: development

  resourcemanager:
    image: xxxx/hadoop-resourcemanager
    container_name: resourcemanager
    restart: always
    ports:
      - 8088:8088
    environment:
      SERVICE_PRECONDITION: "namenode:8020 namenode:50070 datanode1:50075 datanode2:50075"
    env_file:
      - ./hadoop.env
    depends_on:
      - namenode
      - datanode1
      - datanode2
    networks:
      - hadoop-dev-net
    logging: *default-logging
    labels:
      org.label-schema.group: development

  nodemanager1:
    image: xxxx/hadoop-nodemanager
    container_name: nodemanager1
    hostname: nodemanager1
    restart: always
    environment:
      SERVICE_PRECONDITION: "namenode:8020 namenode:50070 datanode1:50075 datanode2:50075 resourcemanager:8088"
    env_file:
      - ./hadoop.env
    depends_on:
      - namenode
      - resourcemanager
      - datanode1
      - datanode2
    networks:
      - hadoop-dev-net
    logging: *default-logging
    labels:
      org.label-schema.group: development

  nodemanager2:
    image: xxxx/hadoop-nodemanager
    container_name: nodemanager2
    hostname: nodemanager2
    restart: always
    environment:
      SERVICE_PRECONDITION: "namenode:8020 namenode:50070 datanode1:50075 datanode2:50075 resourcemanager:8088"
    env_file:
      - ./hadoop.env
    depends_on:
      - namenode
      - resourcemanager
      - datanode1
      - datanode2
    networks:
      - hadoop-dev-net
    logging: *default-logging
    labels:
      org.label-schema.group: development

#  nodemanager3:
#    image: xxxx/hadoop-nodemanager
#    container_name: nodemanager3
#    hostname: nodemanager3
#    restart: always
#    environment:
#      SERVICE_PRECONDITION: "namenode:8020 namenode:50070 datanode1:50075 datanode2:50075 resourcemanager:8088"
#    env_file:
#      - ./hadoop.env
#    depends_on:
#      - namenode
#      - resourcemanager
#      - datanode1
#      - datanode2
#    networks:
#      - hadoop-dev-net
#    logging: *default-logging
#    labels:
#      org.label-schema.group: development

  historyserver:
    image: xxxx/hadoop-historyserver
    container_name: historyserver
    hostname: historyserver
    ports:
      - 8188:8188
    restart: always
    environment:
      SERVICE_PRECONDITION: "namenode:8020 namenode:50070 datanode1:50075 datanode2:50075 resourcemanager:8088"
    volumes:
      - /data/hadoop/historyserver:/hadoop/yarn/timeline
    env_file:
      - ./hadoop.env
    depends_on:
      - namenode
      - resourcemanager
      - datanode1
      - datanode2
    networks:
      - hadoop-dev-net
    logging: *default-logging
    labels:
      org.label-schema.group: development
```

## Final Words
This is just the beginning. I basically configured the skeleton for the ecosystem. I will add more articles about Spark, Oozie, Zookeeper, Solr, and other Apache
related or non-related projects.
