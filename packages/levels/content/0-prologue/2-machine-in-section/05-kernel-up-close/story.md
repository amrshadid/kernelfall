# The Kernel Up Close

**Question:** Why must a program ask the kernel, instead of taking what it needs?

## Scene

> **init:** In The Boot Path, the kernel was the biggest of the four hands. Tonight we open it. You know the rule from First Words: a program asks the kernel with a syscall. So what happens to a program that doesn't ask?
>
> **The Watchdog:** I've seen it. It is quick.
>
> **init:** `poke.c` is in the editor. It tries to read the kernel's own memory, directly.

## See it

> **init:** Every byte of memory has a number, its _address_. Addresses are written in hexadecimal, marked `0x`: counting in sixteens, with the digits `0` to `9` and then `a` to `f`. `poke` reads the byte at `0xc0000000`. Press Run, then type `echo $?`.

---

```
$ ./poke
Segmentation fault         ./poke
$ echo $?
139
```

> **init:** The shell printed that, not `poke`: it never reached its own line. On this Machine every process has its own set of addresses, 4 GiB of them. The lower 3 GiB are _user space_, where its own program and data live, which is why the kernel calls the programs outside it user space. The top 1 GiB, from `0xc0000000` up, is _kernel space_: the kernel's memory, there in every process, and closed while the CPU is in user mode.
>
> **init:** The CPU refused the read and called the kernel, and the kernel ended `poke` with a _signal_: a short notice it delivers to a process. This one is `SIGSEGV`, number 11, for a bad memory access. `echo $?` prints the exit status of the last command, and the shell reports "ended by signal 11" as 128 + 11.

## Build it

> **init:** User mode's limits are how the kernel keeps what it owns: the CPU's time, the memory, the devices, the files and the network. It shares them out between programs and checks every request. It is one big program, and it can add pieces to itself while it runs, called _modules_. So a program that wants any of what it owns has to ask.
>
> **init:** `uname` is the syscall that asks the kernel who it is. Open `myuname.c`: it already makes it. `uname(&u)` asks the kernel to fill in `u`, a _record_ of named fields. `u.sysname` is the kernel's name, `u.release` its release, and `u.machine` the type of CPU.
>
> **init:** It prints the first two. Make it print `u.machine` too, on the same line, and press Run. Then run the `uname` command with `-srm` and compare.

## Watch it

> **init:** Before you run it: your program and the `uname` command. Will they print the same release?
>
> - [x] yes, the same
> - no, they differ

---

```
$ ./myuname
Linux 6.18.63-0-virt i686
$ uname -srm
Linux 6.18.63-0-virt i686
```

> **init:** The same. Both made the same syscall and got the same answer, because the kernel keeps that record in its own memory: the memory `poke` could not read. X-ray shows the kernel function that served both, `__ia32_sys_newuname`. `i686` is its word for this kind of 32-bit PC CPU. `Linux` is the kernel alone: with a shell, tools and me around it, it makes a _distribution_, and the Machine's is Alpine.
>
> **init:** That is the difference between your two programs. `poke` reached across the Gate and was ended. `myuname` asked at the Gate and was answered.

## Debrief

> **init:** So the kernel's memory is closed to every program. Take, and the kernel ends you. Ask, and it answers. It owns every device too, but who tells it which devices it has? In Finding the Hardware, we go down to the bottom of the drawing.

## Real world

On a Linux machine:

```
uname -srm                         # kernel name, release, CPU type
cat /etc/os-release                # which distribution
ls /lib/modules/$(uname -r)        # this kernel's modules on disk
lsmod | head                       # the ones loaded now
```

On a 64-bit PC, `uname -m` prints `x86_64`, and the split is different: user space is the lower 128 TiB, kernel space the top half. Then look up your kernel's release on https://www.kernel.org: is it mainline, stable or longterm?
