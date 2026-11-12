# Bring the Machine Up

**Question:** The boot stops before init starts. What stopped it, and how do you bring the Machine all the way up?

## Scene

> **The Watchdog:** Restarted. And it's stuck. I'm counting, and nobody's resetting me.
>
> **init:** Someone changed the boot entry, as the Watchdog feared. In The Boot Path you added words to the kernel command line. Tonight three words on it are wrong, and you take them out. GRUB's menu is on your terminal: press Enter, and watch how far the boot gets.

## See it

```
Loading Linux virt ...
Loading initial ramdisk ...
mount: mounting /dev/sda3 on /newroot failed: No such file or directory
Mounting root /dev/sda3 failed.
initramfs emergency recovery shell launched. Type 'exit' to try again.
sh: can't access tty; job control turned off
~ #
```

> **init:** Remember the four hands. The firmware, GRUB and the kernel did their part. The initramfs tried to mount the root named by `root=`, failed, and gave you a small shell of its own instead of handing over to me. Its prompt is `~ #`, and the `#` means you are root, the Machine's administrator, in it. Ask what the kernel was told, which disks it found and how much memory it has: `cat /proc/cmdline`, then `ls /dev`, then `free`.

---

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
Mem:          45508        7852       34420           0        3236       33272
Swap:             0           0           0
```

> **init:** Three words that weren't there in The Boot Path, each about a part you know.
>
> **init:** `root=/dev/sda3`: there is no `sda3` in `/dev`. The disk's one filesystem is on `sda1`, and it holds the kernel's own files, not ours. In Files, Doors and Wires, `/proc/mounts` showed that our root is `host9p`, and the initramfs mounts that by itself when there is no `root=`.
>
> **init:** `mem=64M`: use only 64 MiB of RAM. `free` shows 45508 KiB, where Pages and Maps showed about 218 MiB.
>
> **init:** `module_blacklist=virtio_net`: refuse the module that is the network card's driver. Nothing has asked for it yet. It is loaded later, from the root, and then the kernel will say no.

## Build it

> **init:** Fix all three in one edit. Once the Machine is up you are `you` again, and only root may restart it. Type `reboot -f` to go back to GRUB. Press `e`, go to the end of the `linux` line as you did in The Boot Path, delete the three words, and boot with Ctrl-X.

---

> **init:** Now prove every part is up. The root: `cat /proc/cmdline`. The memory: `free`. The card and its driver: `ls /sys/class/net`, then `readlink /sys/class/net/eth0/device/driver`, the same kind of link you followed in Finding the Hardware. The processes: `ps`.

---

```
$ cat /proc/cmdline
BOOT_IMAGE=/boot/vmlinuz-virt console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K quiet
$ free
              total        used        free      shared  buff/cache   available
Mem:         239640       15260      221184           4        3196      219004
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

> **init:** You are at bash, so the root was found and I am PID 1 again. The memory limit is gone: 239640 KiB. And `virtio_net` took the card and made `eth0`.

## Watch it

> **init:** `eth0` is still down: nobody has switched the card's link on. That takes root, so I'll do it. Then run `cat /sys/class/net/eth0/operstate`. Before you do: whose report will the answer be?
>
> - the disk's driver
> - the terminal's driver
> - [x] `virtio_net`, the one the boot entry had blocked

---

```
$ cat /sys/class/net/eth0/operstate
up
```

> **init:** `virtio_net`'s. Follow that one small read through everything you have met. Bash forked, and its copy became `cat`. The scheduler gave it the CPU. Its `open` crossed the Gate, and the VFS sent it to sysfs. sysfs asked the kernel's network code, which keeps what `virtio_net` reported. The terminal's driver showed three bytes. `cat` exited, and the prompt came back.
>
> **The Watchdog:** Reset. Properly. First time since the Kernelfall.

## Debrief

> **init:** You brought the Machine up from a dead stop, and followed one command down to a driver and back. You know what the Machine is made of. But you have only seen the city from my doorstep. In The Streets of Userland, you walk it.

## Real world

On a Linux machine:

```
cat /proc/cmdline                          # what your kernel was told
grep ' / ' /proc/mounts                    # where your root really is
lspci -k | grep -A3 -i ethernet            # is your network card's driver in use?
strace -f -e trace=fork,clone,execve,open,openat,read,write,sendfile64,wait4 sh -c 'cat /sys/class/net/lo/operstate; true'
```

The `; true` keeps `sh` from replacing itself with `cat`, so you see the fork too. With glibc you'll see `clone` and `openat` where the Machine's musl uses `fork` and `open`. On a test virtual machine: at GRUB, press `e`, add `mem=512M` for one boot, and compare `free` before and after. To make a change last, put it in `GRUB_CMDLINE_LINUX` in `/etc/default/grub` and regenerate the menu with `grub-mkconfig -o /boot/grub/grub.cfg`.
