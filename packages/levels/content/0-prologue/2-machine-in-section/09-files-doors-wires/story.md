# Files, Doors and Wires

## Scene

> **init:** A file on the disk. A number the Kernel works out when you ask. A door to a driver. On Linux, you open all three the same way.
>
> **init:** That's the rule people quote: "everything is a file." It isn't quite everything. But it's close, and it's why one small `cat` can read half the Machine.

## See it

**One tree, many filesystems.** A **filesystem** is the way files and folders are laid out and found. Several kinds are **mounted**, attached, into the one tree. `cat /proc/mounts` lists them:

```
/dev/vda2 / ext4 rw,relatime 0 0
proc /proc proc rw,nosuid,nodev,noexec,relatime 0 0
sysfs /sys sysfs rw,nosuid,nodev,noexec,relatime 0 0
devtmpfs /dev devtmpfs rw,nosuid,size=250000k,mode=755 0 0
```

> **init:** Four filesystems in one tree. ext4 keeps the files on the disk, at `/`. The other three the Kernel makes up as you look: _procfs_ for processes and the Kernel's state, _sysfs_ for devices and drivers, _devtmpfs_ for the doors to devices.

**The VFS.** The same `cat` on three of them. X-ray's Section view shows the **Virtual File System**, the Kernel's common front for every filesystem, handing each `read` to a different one:

```
$ cat /etc/motd                    read → vfs_read() → ext4_file_read_iter()
Welcome to the Machine.
$ cat /proc/uptime                 read → vfs_read() → proc_reg_read_iter()
812.47 790.10
$ cat /sys/class/net/lo/mtu        read → vfs_read() → kernfs_fop_read_iter()
65536
```

> **init:** Same `openat`, `read` and `write` for `cat`. Different code underneath.

**Devices.** `ls -l /dev/null /dev/tty /dev/vda`:

```
crw-rw-rw- 1 root root   1, 3 Jan  1 00:00 /dev/null
crw-rw-rw- 1 root tty    5, 0 Jan  1 00:00 /dev/tty
brw-rw---- 1 root disk 254, 0 Jan  1 00:00 /dev/vda
```

The first letter is the kind of door. `c` is a **character device**: a stream of bytes, like a terminal. `b` is a **block device**: storage read in blocks of a fixed size, like a disk. The two numbers are the **major**, which driver, and the **minor**, which of that driver's devices. `cat /dev/null` returns at once: the null driver always answers "end of file".

> **udev:** (from the drawing) When the disk's driver took the disk, the Kernel made `/dev/vda`, and I set who may use it.

**Networking, shown, not built.** `ls /sys/class/net` prints `eth0  lo`. `lo`, the loopback, is a pretend network inside the Machine; `eth0` is the network card. `cat /proc/net/dev` counts each one's bytes and **packets**, the small pieces data is sent in.

The drawing shows one message's trip down: a program's **socket**, a file descriptor for talking over a network; then **TCP**, which keeps the bytes in order and sends lost ones again; then **IP**, which puts an address on each packet; then the netfilter gates; then the network card's driver, `e1000`; then the wire.

> **The Harbormaster:** (from the drawing) I run the stack. Socket Harbor.
>
> **The Tollkeeper:** (from the drawing) And I stand at the gates. The Netfilter Wall.

**Processes talking to each other** have their own ways too: pipes, signals, shared memory and message queues. The Aqueducts and the Alarm Bells teach those.

**The Kernel's own log.** `dmesg` shows the boot again, and the lines drivers wrote while they took their devices:

```
[    0.000000] Linux version 6.18.0 (...)
[    0.413902] e1000: Intel(R) PRO/1000 Network Driver
[    0.520114] virtio_blk virtio0: [vda] 4194304 512-byte logical blocks (2.15 GB/2.00 GiB)
```

The Kernel writes these with `printk()` into a ring buffer, a log of fixed size where the newest lines push out the oldest. `dmesg` reads it from `/dev/kmsg`.

> **The Gatekeeper:** (from the drawing) Every one of those went through me: `openat`, `read`, `write`. Every floor. Through me.

Then the Section drawing is complete: every part of the Kernel gets its label, its folder in the Kernel's source code and its region on the map.

## Build it

> **init:** `look.c` opens one file, reads up to 256 bytes of it and writes them to standard output, checking every answer the Kernel gives. The file it opens is named on one line: `const char *path = "/etc/motd";`.
>
> **init:** Run it as it is. Then change the path and run it on a file in `/proc`, and again on a file in `/sys`. Try `/proc/uptime`, then `/sys/class/net/eth0/address`.
>
> **init:** Last, on the drawing's table, match three parts to their folders in the source: drag `mm/`, `fs/` and `net/` where they belong. A wrong drop costs nothing.

## Watch it

> **init:** Before the `/sys` run: which filesystem will answer?

X-ray shows the VFS sending the same `read` to sysfs, and sysfs asking the network card's driver, which knows the card's hardware address:

```
$ ./look
52:54:00:12:34:56
```

```
openat(AT_FDCWD, "/sys/class/net/eth0/address", O_RDONLY) = 3
read(3, "52:54:00:12:34:56\n", 256)                      = 18
write(1, "52:54:00:12:34:56\n", 18)                      = 18
```

The whole Section drawing lights up once, floor by floor, then dims to show what is still dark: everything but one lamp in Userland.

> **init:** Every region on your map is one of these parts. That's what we're rebuilding.

## Debrief

> **init:** You've seen every floor of the Machine. The Kernel's parts, where they live in its source, and which street of the map will teach each one.
>
> **The Watchdog:** Pretty drawing. Now it's going to fall down again.
>
> **init:** What? Old dog, what did you do?
>
> **The Watchdog:** Nothing! Something in the boot entry. I can feel it. Next restart, we're stuck.

## Real world

On any Linux machine:

```
cat /proc/mounts                          # every filesystem in your tree
ls -l /dev/null /dev/tty                  # two character devices
ls /sys/class/net; cat /proc/net/dev      # interfaces and their counters
sudo dmesg | tail -n 20                   # the newest kernel messages
strace -e trace=openat,read cat /proc/uptime
```

Browse the source tree at https://elixir.bootlin.com/linux/v6.18/source and open `mm/`, `fs/` and `net/`.
