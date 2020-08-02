---
title: GPU Pass-through Manjaro Walk-through
description: A simple walk-through of a GPU Pass-through on a Manjaro desktop.
img: yohei-shimomae-NkQR-rlIM44-unsplash.jpg
alt: GPU Pass-through Manjaro Walk-through
featured: 1
author: 
    name: Jesse Quinn
    bio: All about Jesse
    img: https://images.unsplash.com/photo-1533636721434-0e2d61030955?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2550&q=80
    alt: profile photo
publishedAt: 2019-10-28T03:00:00.000Z
updateAt: 2020-07-19T03:00:00.000Z
---

Today I would like to quickly talk about how to setup a GPU pass-through for a decidated GPU on a qemu/kvm windows 10 guest. For this to work **you need two video cards**.

First we need to enable IOMMU via AMD-Vi or Intel Vt-d in the BIOS. Now lets quickly open and edit the ```/etc/default/grub``` and append the following to the ```GRUB_CMDLINE_LINUX_DEFAULT``` line:

    GRUB_CMDLINE_LINUX_DEFAULT=" ... intel_iommu=on iommu=pt pcie_acs_override=downstream hugepages=2048"

You do not remove other kernel commands such as quiet and resume=UUID if you have them. Another important note, you only need ```pcie_acs_override=downstream``` if you are using an ACS override patch.

After modifying the grub file you need to update grub with ```update-grub``` and reboot.

Using ```lspci -nn``` we can find the device IDs of the GPU that we want to use. In my case, i want to use my GTX 750ti as the GPU to pass-through.

    02:00.0 VGA compatible controller [0300]: NVIDIA Corporation GM107 [GeForce GTX 750 Ti] [10de:1380] (rev a2)
    02:00.1 Audio device [0403]: NVIDIA Corporation Device [10de:0fbc] (rev a1)

Here i will copy ```10de:1380``` and ```10de:0fbc``` into ```/etc/modprobe.d/vfio.conf``` like so ```options vfio-pci ids=10de:1380,10de:0fbc```. Next, add/modify the following line in ```/etc/mkinitcpio.conf``` with ```MODULES=" ... vfio vfio_iommu_type1 vfio_pci vfio_virqfd nvidia ... "```. You may need to use ```nouveau``` or some other driver depending on your video card. In my case, i am using non-free nvidia drivers. Also, add/modify the line with ```HOOKS=" ... modconf ... "```; however, more than likely you already have it somewhere in the HOOKS line anyhow. Now rebuild initramfs by calling ```mkinitcpio -g /boot/linux-custom.img``` and reboot.

Validate that your GPU, ```lspci -nnk```, is using the vfio-pci as the kernel driver loader otherwise something was not done correctly.

    02:00.0 VGA compatible controller [0300]: NVIDIA Corporation GM107 [GeForce GTX 750 Ti] [10de:1380] (rev a2)
        Subsystem: Gigabyte Technology Co., Ltd GM107 [GeForce GTX 750 Ti] [1458:362d]
        Kernel driver in use: vfio-pci
        Kernel modules: nouveau, nvidia_drm, nvidia
    02:00.1 Audio device [0403]: NVIDIA Corporation Device [10de:0fbc] (rev a1)
        Subsystem: Gigabyte Technology Co., Ltd Device [1458:362d]
        Kernel driver in use: vfio-pci
        Kernel modules: snd_hda_intel

If the vfio-pci kernel driver is loaded for the GPU you can proceed by installing the following:

    sudo pacman -S libvirt virt-manager qemu

I also prefer to install ovmf-git from the AUR repository instead of ovmf from extra. You may use 

    sudo pacman -S yay

and with ```yay``` install

    yay ovmf-git

Now edit the ```/etc/libvirt/qemu.conf` file and add the path of OVMF firmware:

    nvram = ["/usr/share/ovmf/ovmf_code_x64.bin:/usr/share/ovmf/ovmf_vars_x64.bin"]

in my case. We also need to start several services:

    sudo systemctl start libvirtd.service 
    sudo systemctl start virtlogd.socket
    sudo systemctl enable libvirtd.service
    sudo systemctl enable virtlogd.socket

Now install 

    sudo pacman -S virt-manager

and add yourself to the group

    sudo usermod -a -G libvirt username

and finally launch virt-manager. I recommend launching virt-manager from your GUI interface rather than terminal as if you have python3 installed you will run into errors otherwise you can simply run ```virt-manager &``` in the background from the terminal.

Within virt-manager you may initiate the installation process for Windows or some other operating system.

For settings in virt-manager here are my suggestions for a i7:

- CPUs
    - Current allocation: 8
    - Copy host CPU configuration
    - Manually set CPU topology
        - Sockets: 1
        - Cores: 4
        - Threads: 2
- PCI devices for GPU/GPU-audio (via add hardware button)
- Any dedicated USB devices (via add hardware button)
- Memory (minimum 8192 miB)
- SCSI (requires virtio-win [drivers](https://docs.fedoraproject.org/en-US/quick-docs/creating-windows-virtual-machines-using-virtio-drivers/index.html) otherwise use SATA for your HDD)
- add SATA CDROM with virt-io and windows iso file 

Hopefully your virtual machine will boot windows and install flawlessly. With SCSI you need to install the virtio-win drivers at the start of the windows installation through the windows driver select option.
