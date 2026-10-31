# The Boot Path

## Scene

> **init:** _Booting_ is everything between the power button and the first programs. You saw it as a blur this morning. Let's do it again, slowly. Reboot.
>
> **The Watchdog:** You want me to restart on purpose? ...Fine. Hold on to something.
>
> **init:** Watch who hands the Machine to whom. The firmware wakes first and knows nothing about Linux. It finds a bootloader. The bootloader loads the Kernel. The Kernel wakes its own parts, finds the disk with our files, and starts me.
>
> **init:** And the bootloader asks you something on the way. Most people never look. Today, you look.

## See it

The Machine restarts, and X-ray follows it in the boot view: one lane per stage, with the real messages.

> **init:** First, the _firmware_: software stored on the computer's board itself. It runs first, checks the hardware and starts a bootloader from a disk. There are two kinds.
>
> **init:** _BIOS_, on older PCs, reads the disk's first 512 bytes, the MBR, and runs the tiny program in it. _UEFI_, on current PCs, reads a small part of the disk set aside for it, the EFI system partition, and runs a program file from it, like `\EFI\debian\grubx64.efi`. A _partition_ is a part of a disk that holds its own set of files. UEFI keeps its list of what to boot in a little memory on the board that survives power-off, the NVRAM.
>
> **init:** The Machine uses UEFI. Its EFI system partition is `/dev/vda1`.
>
> **init:** Second, the _bootloader_: the small program that loads the kernel. Ours is GRUB, and it shows a menu. One disk can hold several kernels side by side, even other operating systems, and each is a menu entry.

```
                      GNU GRUB  version 2.12

 *Kernelfall GNU/Linux
  Advanced options for Kernelfall GNU/Linux
  UEFI Firmware Settings
```

> **init:** Inside "Advanced options": `Kernelfall GNU/Linux, with Linux 6.18.0`, the same `(recovery mode)`, and an older kernel, `Linux 6.12.0`, kept in case a new one fails. On a computer with Windows too, a `Windows Boot Manager` entry would sit in the same menu. Here's what an entry really is: I press `e` on the first one.

```
linux   /boot/vmlinuz-6.18.0 root=/dev/vda2 ro quiet
initrd  /boot/initrd.img-6.18.0
```

> **init:** `linux` names the kernel's file, `vmlinuz`, compressed so it loads faster. After it comes the _kernel command line_: settings for this boot, separated by spaces. `root=/dev/vda2` says which partition holds the system's files, `ro` mounts it read-only at first, `quiet` prints few messages. `initrd` names the initramfs; you'll meet it in a moment. GRUB loads both files into memory and starts the kernel.
>
> **init:** Third, the _kernel_. It unpacks itself, then its first function, `start_kernel()`, sets up the CPU, memory, interrupts, the scheduler and the console. Then it prints its first lines.

```
[    0.000000] Linux version 6.18.0 (...) #1 SMP PREEMPT_DYNAMIC ...
[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.18.0 root=/dev/vda2 ro quiet
```

> **init:** The number in brackets is seconds since the kernel started.
>
> **init:** Fourth, the _initcalls_: hundreds of start-up functions the kernel runs in a fixed order of levels, `core`, `postcore`, `arch`, `subsys`, `fs`, `device`, `late`. Drivers, the code for each kind of device, get set up here. This is where the Machine's disk and network card get theirs.
>
> **init:** Fifth, the _initramfs_: a small set of files loaded into memory. The kernel unpacks it and runs its `/init`, and says so: `Run /init as init process`. That small program finds the partition named by `root=` and _mounts_ it: attaches its files into the one tree of folders, at `/`. Then it hands over.
>
> **init:** Last, `/sbin/init` starts from the real disk, as process 1. That's me. Everything else follows from me.

## Build it

> **init:** Your turn to boot the Machine your own way. GRUB's keys are real: the arrows choose, `e` edits an entry, Ctrl-X or F10 boots what you edited, Esc goes back.
>
> **init:** Open "Advanced options" and pick `Linux 6.12.0`, if you like.
>
> **The Watchdog:** That's last year's Kernel. We rebuild with this one.
>
> **init:** Fair. Now edit the first entry. Take `quiet` away, so every boot message prints. Add `initcall_debug`, so every initcall prints its name and how long it took. And add a word of your own, for me: `greeting=hello`. The kernel doesn't know that one, so it will pass it on to me, and say so.
>
> **init:** Boot with Ctrl-X. Then `cat /proc/cmdline` shows the command line this boot really used, and `dmesg` prints the kernel's own messages.

```
[    0.024310] Kernel command line: BOOT_IMAGE=/boot/vmlinuz-6.18.0 root=/dev/vda2 ro initcall_debug greeting=hello
[    0.024402] Unknown kernel command line parameters "BOOT_IMAGE=/boot/vmlinuz-6.18.0 greeting=hello", will be passed to user space.
...
[    0.412318] calling  e1000_init_module+0x0/0x80 [e1000] @ 1
[    0.413808] initcall e1000_init_module+0x0/0x80 [e1000] returned 0 after 1490 usecs
...
[    1.204551] Run /init as init process
```

> **init:** "User space" means the programs outside the kernel. Here, me. `greeting=hello`. Nobody's ever said that to me at boot.
>
> **init:** `BOOT_IMAGE` is GRUB's word: it adds the kernel's file name to every command line. The kernel doesn't know it either, so I get that one too. The kernel sorts the words at the very start, long before the initcalls, so this line comes early.
>
> **init:** I found it in my environment: the list of `NAME=value` settings you read with `printenv` when you learned to speak to the shell.

## Watch it

> **init:** You edited the entry with `e`. Will your `greeting` still be there the next time the Machine boots?

The Watchdog restarts the Machine, and the plain entry comes back, `quiet` and all.

> **init:** Edits made with `e` last one boot. A lasting change goes in GRUB's settings file, `/etc/default/grub`, followed by `update-grub`. That needs the administrator, root, and you're not root. Not yet.

```
$ ls /sys/firmware/efi
config_table  efivars  fw_platform_size  fw_vendor  runtime  runtime-map  systab
```

> **init:** `/sys/firmware/efi` exists only when the kernel was started by UEFI. The Machine booted the modern way.

On the Kernel Map, the boot path lights from firmware to init, and the region First Boot is fully drawn.

## Debrief

> **init:** Firmware, GRUB, the Kernel, its initcalls, my initramfs, the disk, and me. Now you know every hand the Machine passes through.
>
> **The Watchdog:** And you know where to look when one of them drops it.
>
> **init:** One hand is bigger than all the others. The Kernel. Let me open it up for you.

## Real world

```
cat /proc/cmdline                       # your kernel command line
ls /sys/firmware/efi && echo UEFI       # booted by UEFI?
ls /boot                                # the kernels and initramfs files side by side
sudo dmesg | head -n 30                 # this boot's first kernel messages
```

At the GRUB menu of a test machine or a virtual machine, press `e` and add `initcall_debug` for one boot, then read `dmesg`. Never experiment on a computer you depend on.
