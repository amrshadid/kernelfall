# Bring the Machine Up

## Scene

> **The Watchdog:** Restarting. Not my fault. ...It's stuck. I'm counting, and nobody's resetting me.
>
> **init:** Someone changed the boot entry. Maybe the Dangling, maybe a tired admin. Either way, the Machine can't find its feet.
>
> **init:** You know every floor now. Bring it up. All the way up: the root, the network card, the memory. Then show me one command going all the way down to a driver and back.

## See it

GRUB's menu waits on the terminal, the same one entry as in The Boot Path. Press Enter, and the boot gets this far:

```
Loading Linux virt ...
Loading initial ramdisk ...
mount: mounting /dev/sda3 on /newroot failed: No such file or directory
Mounting root /dev/sda3 failed.
initramfs emergency recovery shell launched. Type 'exit' to try again.
sh: can't access tty; job control turned off
~ #
```

> **init:** `quiet` kept the kernel's own lines off the screen, but the kernel did its part: it started, ran its initcalls and ran the initramfs's `/init`. That `/init` tried to mount the root named by `root=`, `/dev/sda3`, at `/newroot`, and failed. So it stopped before I could start, and opened a small emergency shell instead. `exit` would only try the same mount again.
>
> **init:** `~ #` is its prompt. The `#` means root: the kernel starts its first program as root, and nothing has switched to another user yet. It's BusyBox's own small `sh`, not your bash, and it isn't traced: X-ray sees nothing until the Machine is up.

## Build it

> **init:** Four steps, in order. My chips only say what each command is for now. You choose what to look at.

**1. Read the stop.** In the emergency shell, ask what the kernel was told, which disks it found and how much memory it has.

```
~ # cat /proc/cmdline
BOOT_IMAGE=/boot/vmlinuz-virt console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K quiet root=/dev/sda3 module_blacklist=virtio_net mem=64M
~ # ls /dev
...
sda              tty27            tty48            ttyS2
sda1             tty28            tty49            ttyS3
...
~ # free
              total        used        free      shared  buff/cache   available
Mem:          45524        8760       33548           0        3216       32392
Swap:             0           0           0
```

> **init:** Three words that weren't there in The Boot Path.
>
> **init:** `root=/dev/sda3`: there is no `sda3`. The disk has one partition, `sda1`, which holds `/boot`, not our files. Our root isn't on a disk at all: it's the virtio share `host9p`, the line for `/` you read in `/proc/mounts` in Files, Doors and Wires. With no `root=`, this `/init` mounts `host9p` by itself.
>
> **init:** `mem=64M`: use only the first 64 MiB of RAM. `free` counts in KiB: 45524 is about 44 MiB, what's left once the kernel has taken its own share. The Machine has 256 MiB.
>
> **init:** `module_blacklist=virtio_net`: refuse to load the module `virtio_net`, the network card's driver from Files, Doors and Wires. Nothing has asked for it yet: the Machine loads it later, from the root, in its start-up script. When it does, the kernel will say no.

**2. Back to GRUB.** Type `reboot -f`.

```
~ # reboot -f
[   29.538620] reboot: Restarting system
```

> **init:** `-f` asks the kernel to restart at once. A plain `reboot` asks init to shut everything down first, and there's no init yet: this shell's parent is the initramfs's `/init`.

GRUB's menu comes back. It has a command line of its own: press `c`, then type `ls`, and it lists the disks it can see in its own names. `(hd0)` is the first hard disk, and `(hd0,msdos1)` its first partition, in an MBR partition table, the old "DOS" kind. `(fd0)` and `(fd1)` are floppy drives the BIOS reports. Esc goes back to the menu.

```
grub> ls
(hd0) (hd0,msdos1) (fd0) (fd1)
```

**3. Fix the entry, all of it.** Press `e`, go to the `linux` line and take out all three words. Then boot with Ctrl-X.

> **init:** All three, in one edit. Once the Machine is up you're `you` again, and only root may restart it: `reboot` answers `reboot: : Operation not permitted`. Fix only `root=` and the Machine comes up with no network driver and 44 MiB, and the boot screen shows the kernel's refusal: `modprobe: can't load module virtio_net (kernel/drivers/net/virtio_net.ko.gz): Operation not permitted`.

Then check every floor:

```
$ cat /proc/cmdline
BOOT_IMAGE=/boot/vmlinuz-virt console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K quiet
$ free
              total        used        free      shared  buff/cache   available
Mem:         240008       17420      219408           4        3180      217208
Swap:             0           0           0
$ ls /sys/class/net
eth0  lo
$ readlink /sys/class/net/eth0/device/driver
../../../../bus/virtio/drivers/virtio_net
$ ps
PID   USER     TIME  COMMAND
    1 root      0:00 /sbin/init
    2 root      0:00 [kthreadd]
    3 root      0:00 [pool_workqueue_]
...
```

> **init:** The root: you're at bash, so `/init` mounted `host9p` and handed over to me, PID 1, `/sbin/init`. The memory: 240008 KiB, about 234 MiB. The card: `virtio_net` took it and made `eth0`. And `ps` shows me, the kernel's threads in brackets, and your shell further down.

**4. One command, end to end.** `eth0` is down: nobody has switched its link on. That takes root, too. As you, `ip link set eth0 up` answers `ip: ioctl 0x8914 failed: Operation not permitted`.

> **init:** I'll do it.

init brings the link up as soon as the card is bound. Then, with X-ray on: `cat /sys/class/net/eth0/operstate`.

```
$ cat /sys/class/net/eth0/operstate
up
```

## Watch it

> **init:** Before you look: guess which floors of the Section that one small read passes through.

X-ray replays the run. bash reads your line and `fork`s a copy of itself; the copy calls `execve` and becomes `cat`; the scheduler gives it the CPU; `open` walks the path through the VFS down to sysfs; `sendfile64` asks the kernel to copy the file straight to the terminal, and sysfs asks for the card's state, which the network code keeps from what `virtio_net` reported; the terminal's driver shows the three bytes; `cat` calls `exit_group`, and bash's `wait4` returns, and the prompt comes back.

> **The Watchdog:** Reset. Properly. First time since the Kernelfall.

The Watchdog's meter fills and stays full. The Kernel Map's Prologue regions are fully drawn, the network card glows at the bottom of the Section, and a wire runs from it to the dark harbor.

> **init:** The wire's live. Nobody's talking on it yet.

## Debrief

> **init:** You brought the Machine up from a dead stop: the root, the driver, the memory. And you followed one command all the way down to a driver and back.
>
> **init:** You know what the Machine is made of now, top to bottom. But you've only seen the city from my doorstep. Time you walked the streets you're rebuilding.

## Real world

On any Linux machine:

```
cat /proc/cmdline                          # what your kernel was told
grep ' / ' /proc/mounts                    # where your root really is
lspci -k | grep -A3 -i ethernet            # is your network card's driver in use?
strace -f -e trace=fork,clone,execve,open,openat,read,write,sendfile64,wait4 sh -c 'cat /sys/class/net/lo/operstate; true'
```

The `; true` keeps `sh` from replacing itself with `cat`, so you see the fork too. With glibc you'll see `clone` and `openat` where the Machine's musl uses `fork` and `open`. Real distributions' initramfs drop to a shell much like this one when `root=` is wrong; Debian's and Ubuntu's prompt is `(initramfs)`. On a test virtual machine: at GRUB, press `e`, add `mem=512M` for one boot, and compare `free` before and after. To make a change last, put it in `GRUB_CMDLINE_LINUX` in `/etc/default/grub` and regenerate the menu with `grub-mkconfig -o /boot/grub/grub.cfg` (Debian and Ubuntu wrap it as `update-grub`).
