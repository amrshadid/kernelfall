# The Boot Path

## Scene

> **init:** _Booting_ is everything between the power button and the first programs. You saw it as a blur when you pressed the power button. Let's do it again, slowly.
>
> **The Watchdog:** I restarted it on purpose. Once. Don't make a habit of it.
>
> **init:** Watch who hands the Machine to whom. The firmware wakes first and knows nothing about Linux. It finds a bootloader. The bootloader loads the kernel. The kernel wakes its own parts, finds our files, and starts me.
>
> **init:** And the bootloader is waiting for you right now. Most people never look. Today, you look.

## See it

> **init:** First, the _firmware_: software stored on the computer's board itself. It runs first, checks the hardware and starts a bootloader from a disk. There are two kinds.
>
> **init:** _BIOS_, on older PCs, reads the disk's first 512 bytes, the _MBR_, and runs the tiny program in it. _UEFI_, on current PCs, reads a small part of the disk set aside for it, the EFI system partition, and runs a program file from it, like `\EFI\debian\grubx64.efi`. A _partition_ is a part of a disk that holds its own set of files. UEFI keeps its list of what to boot in a little memory on the board that survives power-off, the NVRAM.
>
> **init:** The Machine's firmware is SeaBIOS, a BIOS. There's no UEFI on it at all. It read the MBR of the Machine's small disk, `/dev/sda`, and that's where GRUB's first piece lives.
>
> **init:** Second, the _bootloader_: the small program that loads the kernel. Ours is GRUB, and its menu is on your terminal now. One disk can hold several kernels side by side, even other operating systems, and each is a menu entry. The Machine has one.

```
                             GNU GRUB  version 2.14

 +----------------------------------------------------------------------------+
 |*Alpine, with Linux virt                                                    |
 |                                                                            |
 +----------------------------------------------------------------------------+

      Use the ^ and v keys to select which entry is highlighted.
      Press enter to boot the selected OS, `e' to edit the commands
      before booting or `c' for a command-line.
```

> **init:** On a laptop you'd see more: the kernel from before the last update, kept in case the new one fails, and a `Windows Boot Manager` entry if Windows shares the disk. Press `e`, and you see what an entry really is: a few lines of commands.

```
setparams 'Alpine, with Linux virt'

insmod gzio
insmod part_msdos
insmod ext2
search --no-floppy --fs-uuid --set=root 6b65726e-656c-4661-916c-000000000001
echo        'Loading Linux virt ...'
linux        /boot/vmlinuz-virt console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K quiet
echo        'Loading initial ramdisk ...'
initrd        /boot/initramfs-virt
```

> **init:** `insmod` loads pieces of GRUB itself, like the one that reads ext4. `search` finds the partition holding `/boot` by its ID: on the Machine that's `/dev/sda1`, the disk's only partition. `linux` names the kernel's file, `vmlinuz-virt`, compressed so it loads faster. After it comes the _kernel command line_: settings for this boot, separated by spaces. `console=ttyS0` sends the kernel's messages to your terminal, a serial line. `quiet` keeps most of them off it. `initrd` names the initramfs; you'll meet it in a moment. GRUB loads both files into memory and starts the kernel.
>
> **init:** Third, the _kernel_. It unpacks itself, then its first function, `start_kernel()`, sets up the CPU, memory, interrupts, the scheduler and the console. Its first lines say who it is, and what memory the BIOS reported.

```
[    0.000000] Linux version 6.18.59-0-virt (buildozer@build-3-24-x86) (cc (Alpine 15.2.0) 15.2.0, GNU ld (GNU Binutils) 2.45.1) #1-Alpine SMP PREEMPT_DYNAMIC 2026-10-27 14:58:36
[    0.000000] BIOS-provided physical RAM map:
[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable
```

> **init:** The number in brackets is seconds since the kernel started. Then comes its version, who built it and with which compiler: gcc, the same one you used. The `BIOS-e820` lines are the firmware's map of the memory: which addresses are RAM the kernel may use.
>
> **init:** Fourth, the _initcalls_: hundreds of start-up functions the kernel runs in a fixed order of levels, from `pure` and `core` up to `late`. Drivers, the code for each kind of device, get set up here. This is where the Machine's disk controller gets its driver.
>
> **init:** Fifth, the _initramfs_: a small set of files GRUB loaded into memory. The kernel unpacks it and runs its `/init`, and says so: `Run /init as init process`. That small program finds the _root filesystem_, the files every program needs, named by `root=` on the command line, and _mounts_ it: attaches its files into the one tree of folders, at `/`. The Machine's entry has no `root=`, so its `/init` uses its default: the virtio share the game gives the Machine its files through, called `host9p`.
>
> **init:** Last, the initramfs hands over to `/sbin/init` from the real root, as process 1. That's me. Everything else follows from me.

## Build it

> **init:** Your turn to boot the Machine your own way. GRUB's keys are real. On the menu, `e` edits the entry. In the editor, Ctrl-N and Ctrl-P move down and up a line, Ctrl-E jumps to the end of one, Ctrl-X boots what you edited, and Esc throws your edits away and goes back.
>
> **init:** Take `quiet` away, so the kernel's messages print. Add `initcall_debug`, so the kernel logs every initcall's name and how long it took. And add a word of your own, for me: `greeting=hello`. The kernel doesn't know that one, so it will pass it on to me, and say so.
>
> **init:** Boot with Ctrl-X. Without `quiet` the kernel's lines scroll past on your terminal. Then `cat /proc/cmdline` shows the command line this boot really used, and `dmesg` prints the kernel's log: everything it said since it started, even what never reached the screen. It's thousands of lines, so let `grep` pick the ones you want.

```
$ cat /proc/cmdline
BOOT_IMAGE=/boot/vmlinuz-virt console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K initcall_debug greeting=hello
$ dmesg | grep -i "command line"
[    0.055345] Kernel/User page tables isolation: disabled on command line.
[    0.087062] Kernel command line: BOOT_IMAGE=/boot/vmlinuz-virt console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K initcall_debug greeting=hello
[    0.090320] Unknown kernel command line parameters "greeting=hello", will be passed to user space.
$ dmesg | grep -m 4 "calling  "
[    0.305347] calling  con_init+0x0/0x270 @ 0
[    0.309103] calling  hvc_console_init+0x0/0x30 @ 0
[    0.309202] calling  xen_cons_init+0x0/0x50 @ 0
[    0.309298] calling  univ8250_console_init+0x0/0x58 @ 0
```

> **init:** `BOOT_IMAGE=` is GRUB's word: it puts the kernel's file name at the front of every command line it hands over. The kernel sorts the words at the very start, long before the initcalls, so its line about yours comes early. "User space" means the programs outside the kernel. Here, me. `greeting=hello`. Nobody's ever said that to me at boot.
>
> **init:** It's in my environment, the list of `NAME=value` settings you met when you learned to speak to the shell. Not in yours: your bash started long after me, with its own. Only root may read mine, in `/proc/1/environ`.
>
> **init:** Each initcall gets two lines: `calling` with the function's name, and `initcall … returned 0 after … usecs` when it's done, 0 meaning it worked. `@ 0` is the process that called it: 0 is the kernel's own first task, before process 1 even exists. Modules loaded later get the same lines with their names in brackets: `initcall init_p9+0x0/0x58 [9pnet] returned 0 after 640 usecs` is the 9p code my initramfs loaded to reach our files. `-m 4` stops `grep` after four matches; `dmesg | grep -c "initcall "` counts them all: hundreds.

## Watch it

> **init:** Before we go: did your edit change anything for the next boot?

GRUB's editor worked on a copy of the entry in memory. The entry itself is in `/boot/grub/grub.cfg` on `/dev/sda1`, and nobody wrote to it.

> **init:** No. Edits made with `e` last one boot. The next time the Watchdog restarts, the menu boots the entry from that file, `quiet` and all. On most Linux systems a lasting change goes in `/etc/default/grub`, and `grub-mkconfig` writes a new `grub.cfg` from it. That needs the administrator, root, and you're not root. Not yet. On the Machine, `grub-mkconfig` can't even work out where our files come from, because they aren't on a disk; root would edit `grub.cfg` itself.

```
$ ls /sys/firmware/efi
ls: /sys/firmware/efi: No such file or directory
```

> **init:** `/sys/firmware/efi` exists only when the kernel was started by UEFI. The Machine booted the old way, through its BIOS. X-ray's boot view lays this boot out in lanes, from the firmware to me, with the kernel's own lines in each.

On the Kernel Map, the boot path lights from firmware to init, and the region First Boot is fully drawn.

## Debrief

> **init:** Firmware, GRUB, the kernel, its initcalls, my initramfs, the root, and me. Now you know every hand the Machine passes through.
>
> **The Watchdog:** And you know where to look when one of them drops it.
>
> **init:** One hand is bigger than all the others: the kernel. Let me open it up for you.

## Real world

```
cat /proc/cmdline                       # your kernel command line
ls /sys/firmware/efi && echo UEFI       # booted by UEFI?
ls /boot                                # the kernels and initramfs files side by side
sudo dmesg | head -n 30                 # this boot's first kernel messages
```

At the GRUB menu of a test machine or a virtual machine, press `e` and add `initcall_debug` for one boot, then read `sudo dmesg | grep initcall`. Most distributions hide the menu unless you hold Shift or press Esc while the machine starts. Never experiment on a computer you depend on.
