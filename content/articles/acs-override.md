---
title: ACS Override Patched Manjaro Kernel Walk-through
description: A quick walk-through for the installation of an ACS override patch.
img: joao-tzanno-G9_Euqxpu4k-unsplash.jpg
alt: ACS Override Patched Manjaro Kernel Walk-through
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-03-04T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

#### Github Repos
You can clone my repos and run the following:
	
	makepkg -sri

[Linux419](https://github.com/jessequinn/manjaro_custom_kernel_linux419_ACS_override) updated to linux419-4.19.30-1

[Linux420](https://github.com/jessequinn/manjaro_custom_kernel_linux420_ACS_override) updated to linux420-4.20.17.-1

[Linux50](https://github.com/jessequinn/manjaro_custom_kernel_linux50_ACS_override)  updated to linux50-5.0.3-1

#### Intro
This walk-through will quickly cover an important topic of adding a **patch** to a kernel, but more specifically, the ACS override patch. This patch allows those who want to pass-through a specific device such as a GPU to a virtual machine such that the virtual machine has a dedicated device. More over, this patch is required if, for instance, your current IOMMU groups are not well separated. The idea may be better explained over at [Archlinux](https://wiki.archlinux.org/index.php/PCI_passthrough_via_OVMF#Bypassing_the_IOMMU_groups_(ACS_override_patch)). Before starting you can easily download my [repository](https://github.com/jessequinn/manjaro_custom_kernel_linux420_ACS_override) that includes the patch and is setup for ```kernel 4.20.11```.

#### Howto
To begin, we will need a copy of the manjaro kernel. This will be specific to your taste, as currently, there are two kernels i work with that may or may not represent your current kernel. Two branches i have made custom kernels for are long-term (4.19) and stable (4.20). To get a better idea of the current state of kernels visit the [kernel site](https://www.kernel.org/). To get the current manjaro kernel for your build go to the core package [repository](https://gitlab.manjaro.org/packages/core) and copy the address of the kernel you want to work with. I selected 4.20. I assume you are doing this on a linux machine and such open your terminal and git clone that repository.

    git clone https://gitlab.manjaro.org/packages/core/linux420.git
    cd linux420

Once inside the kernel directory use your favourite code editor, for instance nano, and modify two areas. 1) the source function ```source = ( .... )``` and 2) the prepare function ```prepare=( ... )```.

First we need to add the source of the patch to the source function. Within the 4.20 kernel PKGBUILD at the end of the source function we should see something like:

    '0001-bootsplash.patch'
    '0002-bootsplash.patch'
    '0003-bootsplash.patch'
    '0004-bootsplash.patch'
    '0005-bootsplash.patch'
    '0006-bootsplash.patch'
    '0007-bootsplash.patch'
    '0008-bootsplash.patch'
    '0009-bootsplash.patch'
    '0010-bootsplash.patch'
    '0011-bootsplash.patch'
    '0012-bootsplash.patch'
    '0013-bootsplash.patch')

Now add the acso patch, which can be found on the site [here](https://queuecumber.gitlab.io/linux-acs-override/), on a new line beneath the 0013-bootsplash.patch and do not forget to move the terminating closed bracket to the following line as such:

    acso.patch::https://gitlab.com/Queuecumber/linux-acs-override/raw/master/workspaces/4.20/acso.patch)

Now it is time to modify the prepare function. I generally add the ACSO patch between two other patches:

    # add aufs4 support
    patch -Np1 -i "${srcdir}/aufs4.20.4+-${_aufs}.patch"
    patch -Np1 -i "${srcdir}/aufs4-base.patch"
    patch -Np1 -i "${srcdir}/aufs4-kbuild.patch"
    patch -Np1 -i "${srcdir}/aufs4-loopback.patch"
    patch -Np1 -i "${srcdir}/aufs4-mmap.patch"
    patch -Np1 -i "${srcdir}/aufs4-standalone.patch"
    patch -Np1 -i "${srcdir}/tmpfs-idr.patch"
    patch -Np1 -i "${srcdir}/vfs-ino.patch"

    # add ACS overide patch
    patch -Np1 -i "${srcdir}/acso.patch" 

    # add BFQ scheduler
    patch -Np1 -i "${srcdir}/0001-BFQ-${_bfq}-${_bfqdate}.patch"

Now we can save and close the PKGBUILD and run ```updpkgsums```. If you lack this command you will need to install ```sudo pacman -S pacman-contrib```. This package also contains an important command ```makepkg```.

Now that the checksums are updated by using the ```updpkgsums``` we can run ```makepkg -sri```. This command will essentially compile, install, and update several key components for your new kernel to work. However, it must be noted, if you require packages from the [extra-modules](https://gitlab.manjaro.org/packages/extra) such as Nvidia, please ```git clone``` them and run ```makepkg -sri``` or you will face boot errors. We can typically view all installed extra modules by running ```pacman -Qs linux420```(change linux420 to the kernel you are using).

Now you should have a custom kernel with the ACS override patch applied. Do not forget to reboot and load the new kernel. 

**import note**

This method will override your current kernel, for instance, linux420 kernel, if that is what you are using. 

The following bash script should allow you to view your IOMMU groups. 

    #!/bin/bash
    shopt -s nullglob
    for d in /sys/kernel/iommu_groups/*/devices/*; do 
        n=${d#*/iommu_groups/*}; n=${n%%/*}
        printf 'IOMMU Group %s ' "$n"
        lspci -nns "${d##*/}"
    done;
