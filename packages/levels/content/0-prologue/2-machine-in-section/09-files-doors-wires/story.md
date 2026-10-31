# Files, Doors and Wires

## Scene

> **init:** The last floor, and the rule I promised. A file of settings. A number the kernel works out when you ask. A door to a driver. On Linux, you open all three the same way.
>
> **init:** That's the rule people quote: "everything is a file." It isn't quite everything. But it's close, and it's why one small `cat` can read half the Machine.

## See it

**One tree, many filesystems.** A **filesystem** is the way files and folders are laid out and found. Several kinds are **mounted**, attached, into the one tree, each at its own folder. `cat /proc/mounts` lists them, one per line: what was mounted, where, and which kind of filesystem it is.

```
dev /dev devtmpfs rw,relatime,size=110896k,nr_inodes=27724,mode=755 0 0
host9p / 9p rw,relatime,cache=0x5,access=client,msize=512000,trans=virtio 0 0
proc /proc proc rw,relatime 0 0
sys /sys sysfs rw,relatime 0 0
devpts /dev/pts devpts rw,relatime,mode=600,ptmxmode=000 0 0
tmpfs /tmp tmpfs rw,relatime 0 0
tmpfs /run tmpfs rw,relatime 0 0
tracefs /sys/kernel/tracing tracefs rw,relatime 0 0
```

> **init:** Eight mounts in one tree, of seven kinds: `tmpfs` is mounted twice. At `/`, _9p_: the Machine's own files, which come from the game over the virtio share you met in Finding the Hardware. None of the others is stored anywhere that lasts. _procfs_ (processes and the kernel's state), _sysfs_ (devices and drivers) and _tracefs_ (where the kernel writes the trace that X-ray reads) make up a file's contents at the moment you read it. _devtmpfs_ holds the doors to devices, made by the kernel as drivers find them, and _devpts_ the doors to terminals. _tmpfs_ keeps ordinary files in RAM, gone when the Machine stops.
>
> **init:** And one filesystem that isn't in the list. The Machine's disk, `/dev/sda`, holds an ext4 filesystem on its first partition, `/dev/sda1`. Nobody has mounted it, so none of its files are in the tree yet. A filesystem is only part of the tree once it's mounted.

**The VFS.** The **Virtual File System** is the kernel's common front for every filesystem. A program opens and reads a file the same way wherever it lives; the VFS hands each request to the code of the filesystem that holds it.

```
$ cat /etc/motd
Welcome to the Machine.
The kernel panicked tonight, and every process froze.
Find the way down, and bring the kernel back.
$ cat /proc/uptime
45.38 6.46
$ cat /sys/class/net/lo/mtu
65536
```

> **init:** Three files, three filesystems: 9p, procfs and sysfs. `/proc/uptime` is how long the Machine has been up, in seconds, then how long its CPU sat idle; no disk has ever held that number. `mtu` is the biggest packet the loopback will carry.
>
> **init:** `cat` opens each one with `open`, then asks with `sendfile64`: copy from this file to my output, without passing through my memory. Different code answers underneath each time. You'll watch it with a program of your own.

**Devices.** `ls -l /dev/null /dev/tty /dev/sda`:

```
crw-rw-rw-    1 root     root        1,   3 Oct 31 16:16 /dev/null
brw-------    1 root     root        8,   0 Oct 31 16:16 /dev/sda
crw-rw-rw-    1 root     root        5,   0 Oct 31 16:16 /dev/tty
```

The first letter is the kind of door. `c` is a **character device**: a stream of bytes, like a terminal. `b` is a **block device**: storage read in blocks of a fixed size, like a disk. The two numbers are the **major**, which driver, and the **minor**, which of that driver's devices: major 8 is the SCSI disk driver, which also runs the Machine's IDE disk, and minor 0 is the whole first disk (`sda1`, its first partition, is minor 1). `cat /dev/null` returns at once: the null driver always answers "end of file".

> **init:** The kernel made these doors itself, in devtmpfs, as each driver found its device. On most Linux systems a program called udev then sets who may open them and adds friendly names. The Machine runs no udev, so its doors keep the kernel's defaults: all owned by root, and the disk open to root alone.

**Networking, shown, not built.** `ls /sys/class/net` prints `eth0  lo`. `lo`, the loopback, is a pretend network inside the Machine. `eth0` is the network card, a virtio card run by the `virtio_net` driver; it's down, and no wire leads out of the browser yet. `cat /proc/net/dev` counts each one's bytes and **packets**, the small pieces data is sent in: all zeros, so far.

The drawing shows one message's trip down: a program's **socket**, a file descriptor for talking over a network; then **TCP**, which keeps the bytes in order and sends lost ones again; then **IP**, which puts an address on each packet; then the netfilter gates; then the network card's driver, `virtio_net`; then the wire.

> **The Harbormaster:** (from the drawing) I run the stack. Socket Harbor.
>
> **The Tollkeeper:** (from the drawing) And I stand at the gates. The Netfilter Wall.

**Processes talking to each other** have their own ways too: pipes, signals, shared memory and message queues. The Aqueducts and the Alarm Bells teach those.

**The kernel's own log.** `dmesg` shows the boot again, and the lines drivers wrote while they took their devices:

```
[    0.000000] Linux version 6.18.59-0-virt (buildozer@build-3-24-x86) (cc (Alpine 15.2.0) 15.2.0, GNU ld (GNU Binutils) 2.45.1) #1-Alpine SMP PREEMPT_DYNAMIC 2026-10-27 14:58:36
...
[    1.588336] scsi host0: ata_piix
...
[    1.782304] ata1.00: ATA-0: v86 ATA HD, 1.00, max MWDMA2
```

The kernel writes these with `printk()` into a ring buffer, a log of fixed size where the newest lines push out the oldest. The Machine's `dmesg`, BusyBox's, reads it with the `syslog` syscall. Many distributions let only root do that (`kernel.dmesg_restrict`); the Machine lets you.

> **The Gatekeeper:** (from the drawing) Every one of those went through me: `open`, `read`, `write`. Every floor. Through me.

Then the Section drawing is complete: every part of the kernel gets its label, its folder in the kernel's source code and its region on the map.

## Build it

> **init:** `look.c` opens one file, reads up to 256 bytes of it and writes them to standard output, checking every answer the kernel gives. The file it opens is named on one line: `const char *path = "/etc/motd";`.
>
> **init:** Run it as it is. Then change the path and run it on a file in `/proc`, and again on a file in `/sys`. Try `/proc/uptime`, then `/sys/class/net/eth0/address`.
>
> **init:** Last, on the drawing's table, match three parts to their folders in the source: drag `mm/`, `fs/` and `net/` where they belong. A wrong drop costs nothing.

## Watch it

> **init:** Before the `/sys` run: which filesystem will answer?

```
$ ./look
00:22:15:76:df:a8
```

X-ray shows the same three calls each time:

```
open("/sys/class/net/eth0/address", O_RDONLY|O_LARGEFILE) = 3
read(3, "00:22:15:76:df:a8\n", 256)      = 18
write(1, "00:22:15:76:df:a8\n", 18)       = 18
```

> **init:** X-ray shows the calls, not what the kernel does under them. Here's that part. The same `read` went three different ways. For `/etc/motd`, the VFS handed it to 9p's `v9fs_file_read_iter()`, which asked the game for the bytes over the share. For `/proc/uptime`, to procfs's `proc_reg_read_iter()`, which worked the numbers out. For the card, to sysfs's `kernfs_fop_read_iter()`. sysfs printed the hardware address that `virtio_net` stored in the kernel's record of the card when it took the card over.

Your card's address ends differently: the emulator picks its last three bytes at random. `O_LARGEFILE` is added by musl, the C library, on a 32-bit machine: it lets a 32-bit program use files whose size or offsets don't fit in a 32-bit number, past 2 GiB.

The whole Section drawing lights up once, floor by floor, then dims to show what is still dark: everything but one lamp in Userland.

> **init:** Every region on your map is one of these parts. That's what we're rebuilding.

## Debrief

> **init:** You've seen every floor of the Machine. The kernel's parts, where they live in its source, and which street of the map will teach each one.
>
> **The Watchdog:** Pretty drawing. Now it's going to fall down again.
>
> **init:** What? Old dog, what did you do?
>
> **The Watchdog:** Nothing! Something in the boot entry. I can feel it. Next restart, we're stuck. You'll have to bring it up yourself.

## Real world

On any Linux machine:

```
cat /proc/mounts                          # every filesystem in your tree
ls -l /dev/null /dev/tty                  # two character devices
ls /sys/class/net; cat /proc/net/dev      # interfaces and their counters
sudo dmesg | tail -n 20                   # the newest kernel messages (sudo where only root may read them)
strace cat /proc/uptime                   # every call cat makes
```

On a 64-bit PC with glibc, `strace` shows `openat` where the Machine's musl uses `open`, and GNU `cat` copies with `read` and `write` (or `copy_file_range`) where BusyBox's uses `sendfile64`. Your root filesystem is likely ext4 or btrfs on a real disk. Browse the source tree at https://elixir.bootlin.com/linux/v6.18/source and open `mm/`, `fs/` and `net/`.
