# The Kernel Up Close

## Scene

> **init:** You watched the kernel start, one hand after another. Now let's open up the biggest hand.
>
> **init:** I keep an old drawing. The Machine, cut open, like a page from a service manual. "Section of the Machine, before the Kernelfall."
>
> **init:** Bottom floor: the hardware. Top floor: us, the programs. Between them, filling most of the page: the kernel.
>
> **The Watchdog:** The kernel isn't a process like you, child. It's the thing that runs processes. (It keeps a few helpers of its own. They work for it.)
>
> **init:** Every one of us goes through it. None of us goes around it. Let me show you why we can't.

## See it

> **init:** The drawing opens in X-ray now: the hardware at the bottom, the kernel's parts in the middle, Userland on top. Every command you run lights the parts it touches.
>
> **init:** The kernel owns five things, and a program reaches none of them by itself: _CPU time_ (who runs, and when), _memory_, _devices_, _files_ and the _network_. The kernel shares them out, keeps programs apart, and checks every request.

Every byte of memory has a number, its **memory address**. `0x` means the number is written in hexadecimal: counting in sixteens, with the digits `0`–`9` and then `a`–`f`. A **bit** is one binary digit, 0 or 1, and eight of them make a byte. Programmers write addresses in hex because each hex digit stands for exactly four bits. `0xc0000000` is 3,221,225,472: 3 GiB.

**Kernel space and user space.** Picture all the addresses one process can use. The Machine is a 32-bit PC, so an address has 32 bits, and there are 4 GiB of them. Linux splits them: the lower 3 GiB, from `0x00000000` to `0xbfffffff`, are **user space**, the process's own program and data. The top 1 GiB, from `0xc0000000` up, is **kernel space**: it is there in every process, but locked. A syscall is how a program gets the kernel to work up there on its behalf.

> **init:** `poke` is a small program that tries to read the first byte of kernel space directly, at `0xc0000000`. Open `poke.c` in the editor and press Run: it builds `poke` and runs it. Then type `echo $?` to see how it ended.

```
$ ./poke
Segmentation fault         ./poke
$ echo $?
139
```

> **init:** The CPU refused the read, because `poke` runs in user mode. The kernel was called in to deal with it, and it ended `poke` with a _signal_: a short notice the kernel delivers to a process.
>
> **init:** This one is `SIGSEGV`, "segmentation violation": a bad memory access. It ends the process unless the process was ready for it. There are others: `SIGINT` when you press Ctrl-C, `SIGTERM` for "please stop". The shell printed the signal's name, and `139` is how it reports "ended by signal 11": 128 + 11, and `SIGSEGV` is number 11.

`strace` shows the same ending from the kernel's side:

```
--- SIGSEGV {si_signo=SIGSEGV, si_code=SEGV_MAPERR, si_addr=0xc0000000} ---
+++ killed by SIGSEGV +++
```

`si_addr` is the address `poke` tried to read. Not its memory, not the hardware. It has to ask.

> **init:** One more thing about that locked top gigabyte. On many PCs, the kernel goes further and hides most of itself while a program runs: _page table isolation_, against a CPU flaw called Meltdown. The Machine was booted with `mitigations=off`, so here the kernel's pages stay in place, locked, and the CPU's lock is all that stops `poke`. `dmesg` says so: `Kernel/User page tables isolation: disabled on command line.`

> **init:** Now the kernel's shape. Linux is a _monolithic_ kernel: the scheduler, memory, files, drivers and networking all run in kernel mode, as one big program.

A **microkernel**, like seL4 or QNX's, keeps only the basics in the kernel and runs drivers and filesystems as separate processes that pass messages to each other. That is safer when a driver fails, and slower when the parts talk. Linux chose speed, and it can still grow while it runs: **modules** are pieces of the kernel kept in files and added when they're needed.

```
$ ls /lib/modules/$(uname -r)/kernel
arch      drivers   kernel    net       sound
crypto    fs        lib       security  virt
$ cat /proc/modules
virtio_net 81920 0 - Live 0x00000000
net_failover 16384 1 virtio_net, Live 0x00000000
failover 12288 1 net_failover, Live 0x00000000
ext4 749568 0 - Live 0x00000000
...
```

> **The Dockmaster:** (from the drawing) Modules wait on disk until they're needed. I load them. When the Deep wakes up, you'll write one.
>
> **init:** 868 modules wait in those folders, each a `.ko.gz` file: a kernel object, compressed. Twelve are loaded now. `virtio_net` is the network card's driver, `ext4` reads the disk's filesystem. Each line gives the module's size in bytes, then its _reference count_: how many things are using it right now. Often those are the modules named after the count, like `ext4` using `jbd2`. `9p` shows `1 -`: no module uses it, but the Machine's root filesystem is mounted with it. Last comes its address, shown as zeros to anyone but root.

**Linux and the distribution.** `uname -sr` prints `Linux 6.18.59-0-virt`: that's the kernel. `cat /etc/os-release` prints, among other lines, `PRETTY_NAME="Alpine Linux v3.24"`: that's the **distribution**, Linux plus everything around it.

> **init:** Linux is only the kernel. I, the shell, the C library, `ls` and `cat`: we're the rest. Debian, Fedora and Android all run the Linux kernel with different things on top. Many distributions use the GNU project's tools and C library, so they call themselves GNU/Linux. Alpine uses musl for its C library and BusyBox for most tools, so it's just Alpine Linux.
>
> **The Maintainer:** (from the drawing's last panel) New kernels come out of _mainline_ about every nine or ten weeks. _Stable_ releases add fixes to them. Once a year, one becomes _LTS_, long-term support, and gets fixes for years. This Machine runs 6.18 LTS, so everything you learn here stays true while you learn it.
>
> **The Maintainer:** Read the release like a label. `6.18` is the release, `.59` the fifty-ninth stable update to it, and `-0-virt` is Alpine's: its first build of that update, the `virt` flavour, made for virtual machines.
>
> **The Maintainer:** And Linux is free software, under the GPL, version 2. Anyone may use it, study it, change it and share it. Whoever shares the kernel as a program must share its source too.

## Build it

> **init:** The `uname` command is a thin wrapper around a syscall of the same name. Write your own. `myuname.c` is almost done.

`struct utsname` is a **record**: a group of named fields kept together. `uname(&u)` asks the kernel to fill in the record `u`. `u.sysname` is the kernel's name, `u.release` its release, and `u.machine` the CPU type: `i686` means a 32-bit x86 CPU of the Pentium Pro's family or later. The Machine's CPU calls itself a Pentium III.

> **init:** Make it print `u.machine` too. Run `./myuname`, then run `uname -srm` and compare.

## Watch it

> **init:** Before you run it: your program and the `uname` command. Will they print the same release?

```
$ ./myuname
Linux 6.18.59-0-virt i686
$ uname -srm
Linux 6.18.59-0-virt i686
```

```
uname({sysname="Linux", nodename="kernelfall", ...}) = 0
```

> **init:** The same. Both asked the kernel the same question, with the same syscall, and got the same answer. X-ray names the call `newuname`: that's the kernel's own name for it, from the day the record gained a sixth field and the older calls had to stay for older programs.

The Section drawing gets its first label, "kernel", and a dotted line around it: "monolithic".

> **The Gatekeeper:** (at the line between user space and kernel space) Every request comes through me. One day you'll come through in person.

## Debrief

> **init:** It owns the CPU, the memory, the devices, the files and the wires, and it shares them out. Its top gigabyte is locked to every program. That's a kernel.
>
> **init:** But how does it know what hardware it has? Nobody tells it at the factory. Let's go down to the bottom floor, in Finding the Hardware.

## Real world

On any Linux machine:

```
uname -srm                         # kernel name, release, CPU type
cat /etc/os-release                # which distribution
ls /lib/modules/$(uname -r)        # this kernel's modules on disk
lsmod | head                       # the ones loaded now
```

On a 64-bit PC, `uname -m` prints `x86_64`, and the split is different: user space is the lower 128 TiB, kernel space the top half. Then look up your kernel's release on https://www.kernel.org: is it mainline, stable or longterm?
