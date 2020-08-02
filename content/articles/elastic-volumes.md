---
title: Resizing Amazon EBS Elastic Volumes
description: Just a quick tutorial on how to resize your amazon EBS elastic volume
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: Resizing Amazon EBS Elastic Volumes
featured: 0
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-11-09T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

**For what it is worth, DO NOT, I REPEAT, NOT DO NOT USE FDISK to resize your partition!**

To quickly resize your EBS elastic volume, I will perform this task on a Ubuntu 18 EC2 instance.

```bash
lsblk
NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
loop0     7:0    0 89.1M  1 loop /snap/core/8039
loop1     7:1    0   18M  1 loop /snap/amazon-ssm-agent/1480
loop2     7:2    0 89.1M  1 loop /snap/core/7917
xvda    202:0    0   15G  0 disk 
└─xvda1 202:1    0    8G  0 part /
```

```bash
# install "cloud-guest-utils" if it is not installed already
sudo apt install cloud-guest-utils

# resize partition
sudo growpart /dev/xvda 1
CHANGED: partition=1 start=2048 old: size=16775135 end=16777183 new: size=31455199,end=31457247
```

```bash
lsblk
NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
loop0     7:0    0 89.1M  1 loop /snap/core/8039
loop1     7:1    0   18M  1 loop /snap/amazon-ssm-agent/1480
loop2     7:2    0 89.1M  1 loop /snap/core/7917
xvda    202:0    0   15G  0 disk 
└─xvda1 202:1    0   15G  0 part /

```

```bash
# Check before resizing ("Avail" shows 1.1G):
df -h
Filesystem      Size  Used Avail Use% Mounted on
udev            481M     0  481M   0% /dev
tmpfs            99M  908K   98M   1% /run
/dev/xvda1      7.7G  6.7G  1.1G  87% /
tmpfs           492M     0  492M   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs           492M     0  492M   0% /sys/fs/cgroup
/dev/loop0       90M   90M     0 100% /snap/core/8039
/dev/loop1       18M   18M     0 100% /snap/amazon-ssm-agent/1480
/dev/loop2       90M   90M     0 100% /snap/core/7917
tmpfs            99M     0   99M   0% /run/user/1000

# resize filesystem
sudo resize2fs /dev/xvda1
resize2fs 1.44.1 (24-Mar-2018)
Filesystem at /dev/xvda1 is mounted on /; on-line resizing required
old_desc_blocks = 1, new_desc_blocks = 2
The filesystem on /dev/xvda1 is now 3931899 (4k) blocks long.

# Check after resizing ("Avail" now shows 8.7G!-):
df -h
Filesystem      Size  Used Avail Use% Mounted on
udev            481M     0  481M   0% /dev
tmpfs            99M  908K   98M   1% /run
/dev/xvda1       15G  6.7G  7.8G  47% /
tmpfs           492M     0  492M   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs           492M     0  492M   0% /sys/fs/cgroup
/dev/loop0       90M   90M     0 100% /snap/core/8039
/dev/loop1       18M   18M     0 100% /snap/amazon-ssm-agent/1480
/dev/loop2       90M   90M     0 100% /snap/core/7917
tmpfs            99M     0   99M   0% /run/user/1000
```
