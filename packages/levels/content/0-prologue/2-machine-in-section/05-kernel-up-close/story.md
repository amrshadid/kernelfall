# The Kernel Up Close

## Scene

> **init:** I keep an old drawing. The Machine, cut open, like a page from a service manual. "Section of the Machine, before the Kernelfall."
>
> **init:** Bottom floor: the hardware. Top floor: us, the programs. Between them, filling most of the page: the Kernel.
>
> **The Watchdog:** The Kernel isn't a process like you, child. It's the thing that runs processes. (It keeps a few helpers of its own. They work for it.)
>
> **init:** Every one of us goes through it. None of us goes around it. Let me show you why we can't.

## See it

> **init:** The drawing opens in X-ray now: the hardware at the bottom, the Kernel's parts in the middle, Userland on top. Every command you run lights the parts it touches.
>
> **init:** The Kernel owns five things, and a program reaches none of them by itself: _CPU time_ (who runs, and when), _memory_, _devices_, _files_ and the _network_. The Kernel shares them out, keeps programs apart, and checks every request.

Every byte of memory has a number, its **memory address**. `0x` means the number is written in hexadecimal, counting in sixteens, which is how programmers usually write addresses.

> **init:** `poke` is a small program that tries to read the Kernel's own memory directly, at the address `0xffffffff81000000`. Run `./poke`.

```
$ ./poke
Segmentation fault
```

```
--- SIGSEGV {si_signo=SIGSEGV, si_addr=0xffffffff81000000, ...} ---
+++ killed by SIGSEGV +++
```

> **init:** The CPU refused the read, because `poke` runs in user mode. The Kernel was called in to deal with it, and it ended `poke` with a _signal_: a short notice the Kernel delivers to a process.
>
> **init:** This one is `SIGSEGV`, "segmentation violation": a bad memory access. It ends the process unless the process was ready for it. There are others: `SIGINT` when you press Ctrl-C, `SIGTERM` for "please stop". Not its memory, not the hardware. It has to ask.

**Kernel space and user space.** Picture all the addresses one process can use, on this kind of CPU (x86-64). The lower half is **user space**: the process's own program and data. The upper half is **kernel space**: it is there in every process, but locked. A syscall is how a program gets the Kernel to work in the upper half on its behalf.

> **init:** One more thing about the Kernel's shape. Linux is a _monolithic_ kernel: the scheduler, memory, files, drivers and networking all run in kernel mode, as one big program.

A **microkernel**, like seL4 or QNX's, keeps only the basics in the kernel and runs drivers and filesystems as separate processes that pass messages to each other. That is safer when a driver fails, and slower when the parts talk. Linux chose speed, and it can still grow while it runs: **modules** are pieces of the kernel kept in files and added when they're needed.

```
$ ls /lib/modules/6.18.0/kernel
drivers  fs  net
$ cat /proc/modules
e1000 167936 0 - Live 0x0000000000000000
```

> **The Dockmaster:** (from the drawing) Modules wait on disk until they're needed. I load them. When the Deep wakes up, you'll write one.
>
> **init:** That's `e1000`, the network card's driver, loaded and live. The address shows as zeros for anyone but root.

**Linux and the distribution.** `uname -sr` prints `Linux 6.18.59-0-virt`: that's the kernel. `cat /etc/os-release` prints `PRETTY_NAME="Kernelfall GNU/Linux"`: that's the **distribution**, Linux plus everything around it.

> **init:** Linux is only the Kernel. I, the shell, the C library, `ls` and `cat`: we're the rest. Debian, Fedora and Android all run the Linux kernel with different things on top.
>
> **The Maintainer:** (from the drawing's last panel) New kernels come out of _mainline_ about every nine or ten weeks. _Stable_ releases add fixes to them. Once a year, one becomes _LTS_, long-term support, and gets fixes for years. This Machine runs 6.18 LTS, so everything you learn here stays true while you learn it.
>
> **The Maintainer:** And Linux is free software, under the GPL, version 2. Anyone may use it, study it, change it and share it. Whoever shares a changed kernel must share its source too.

## Build it

> **init:** The `uname` command is a thin wrapper around a syscall of the same name. Write your own. `myuname.c` is almost done.

`struct utsname` is a **record**: a group of named fields kept together. `uname(&u)` asks the Kernel to fill in the record `u`. `u.sysname` is the kernel's name, `u.release` its release, and `u.machine` the CPU type.

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
uname({sysname="Linux", nodename="machine", ...}) = 0
```

> **init:** The same. Both asked the Kernel the same question, with the same syscall, and got the same answer.

The Section drawing gets its first label, "Kernel", and a dotted line around it: "monolithic".

> **The Gatekeeper:** (at the line between user space and kernel space) Every request comes through me. One day you'll come through in person.

## Debrief

> **init:** It owns the CPU, the memory, the devices, the files and the wires, and it shares them out. That's a kernel.
>
> **init:** But how does it know what hardware it has? Nobody tells it at the factory. Let's go down to the bottom floor.

## Real world

On any Linux machine:

```
uname -srm                         # kernel name, release, CPU type
cat /etc/os-release                # which distribution
ls /lib/modules/$(uname -r)        # this kernel's modules on disk
lsmod | head                       # the ones loaded now
```

Then look up your kernel's release on https://www.kernel.org: is it mainline, stable or longterm?
