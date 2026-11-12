# Files, Doors and Wires

**Question:** How can one small program read a stored file, the kernel's own state and a device, all the same way?

## Scene

> **init:** In Pages and Maps I promised the last part of the kernel. Here it is. A file of settings. A number the kernel works out when you ask. A setting of a device. On Linux, a program opens all three the same way.
>
> **init:** People say "everything is a file." It isn't quite everything, but it is why one small program can read half the Machine. Start with what the file tree is made of: run `cat /proc/mounts`.

## See it

```
dev /dev devtmpfs rw,relatime,size=110856k,nr_inodes=27714,mode=755 0 0
host9p / 9p rw,relatime,cache=0x5,access=client,msize=512000,trans=virtio 0 0
proc /proc proc rw,relatime 0 0
sys /sys sysfs rw,relatime 0 0
devpts /dev/pts devpts rw,relatime,mode=600,ptmxmode=000 0 0
tmpfs /tmp tmpfs rw,relatime 0 0
tmpfs /run tmpfs rw,relatime 0 0
tracefs /sys/kernel/tracing tracefs rw,relatime 0 0
```

> **init:** A _filesystem_ is one way of keeping files and finding them. Each line is one that has been _mounted_: attached to the tree at a folder. Its second word says where, its third which kind. At `/`, the kind `9p` holds the Machine's own files. At `/proc` and `/sys`, the kernel makes up each file's contents when it is read. At `/dev` it keeps the device files.
>
> **init:** A _device file_ is a name in the tree that stands for a device. Run `ls -l /dev/null /dev/sda`.

---

```
crw-rw-rw-    1 root     root        1,   3 Nov 12 09:42 /dev/null
brw-------    1 root     root        8,   0 Nov 12 09:42 /dev/sda
```

> **init:** The first letter is the kind of file, and for a device it is `c` or `b`. `c` passes bytes one after another, like a terminal. `b` is storage, read in blocks, like `sda`, the Machine's disk. Behind each is a driver. The filesystem on that disk isn't in the list of mounts: nobody has mounted it, so its files aren't in the tree.
>
> **init:** So a path can lead to stored bytes, to the kernel's own state, or to a driver. The part of the kernel that makes them all answer to the same calls is the _VFS_, the virtual file system. It hands each request to the code of whatever is behind the path.

## Build it

> **init:** See it with a program of your own. `look.c` opens one file, reads up to 256 bytes and writes them to standard output, checking every answer the kernel gives. `open`, `read` and `write` are syscalls, like the `write` from First Words. The file is named on one line: `const char *path = "/etc/motd";`.
>
> **init:** Run it as it is. Then change the path to `/proc/uptime` and run it, and to `/sys/class/net/eth0/address` and run it again. Nothing else in the program changes.

## Watch it

> **init:** Before the `/sys` run: which filesystem will answer?
>
> - 9p
> - procfs
> - [x] sysfs

---

```
$ ./look
00:22:15:66:d9:a5
```

```
open("/sys/class/net/eth0/address", ...) = 3
read(3, "00:22:15:66:d9:a5\n", 256)      = 18
write(1, "00:22:15:66:d9:a5\n", 18)       = 18
```

> **init:** sysfs, the kind mounted at `/sys`. The three calls were the same in all three runs, and the VFS sent each `read` somewhere different. For `/etc/motd`, to 9p, which fetched stored bytes. For `/proc/uptime`, to procfs, which worked out its first number, how long the Machine has been up. For `eth0`, the Machine's network card, to sysfs, which printed the address its driver, `virtio_net`, read from the card. Every card has its own address, so yours ends differently.
>
> **init:** X-ray names the kernel part that served each call. Look at `write`: every time, it went to a driver, the terminal's. The same call, with a device behind it.

## Debrief

> **init:** One set of calls, and the VFS behind them: that is how a stored file, the kernel's state and a device all answer alike. You have met the kernel's biggest parts.
>
> **The Watchdog:** And something is wrong with the boot entry. I can feel it. Next restart, we're stuck.

## Real world

On a Linux machine:

```
cat /proc/mounts                          # every filesystem in your tree
ls -l /dev/null /dev/tty                  # two character devices
ls /sys/class/net; cat /proc/net/dev      # network interfaces and their counters
strace cat /proc/uptime                   # every call cat makes
```

On a 64-bit PC with glibc, `strace` shows `openat` where the Machine's musl uses `open`. Your root filesystem is likely ext4 or btrfs on a real disk. Browse the kernel's source at https://elixir.bootlin.com/linux/v6.18/source and open `fs/`, `mm/` and `net/`.
