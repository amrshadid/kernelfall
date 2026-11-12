# Pages and Maps

**Question:** How can every process have 3 GiB of addresses on a Machine with 256 MiB of memory?

## Scene

> **init:** In The Kernel Up Close, every process had 3 GiB of user space to itself. In Who Runs, you counted dozens of processes. The Machine has 256 MiB of RAM. That doesn't add up.
>
> **The Watchdog:** Lies. The kernel tells everyone lies.
>
> **init:** Useful ones. Run `free`, and see what there really is.

## See it

```
$ free
              total        used        free      shared  buff/cache   available
Mem:         223636       28536      191876           8        3224      189860
Swap:             0           0           0
```

> **init:** `free` counts in KiB: about 218 MiB in all, once the firmware and the kernel have taken their share of the 256. That is the _physical memory_, the RAM itself. A process never sees it. It uses _virtual addresses_, its own numbering, and a part of the CPU, the MMU, turns each one into a place in RAM on every access.
>
> **init:** Memory is handled in _pages_ of 4096 bytes. For each process the kernel keeps a map from its virtual pages to pages of RAM, and most of a process's 3 GiB has no RAM behind it until the process uses it. So everyone can have 3 GiB of addresses, and RAM is spent only on the pages in use.
>
> **init:** Look at one process's map. Run `cat /proc/self/maps`: `self` means whoever is reading, here `cat`.

---

```
004cb000-004cf000 r--p 00000000 00:14 10         /bin/busybox
004cf000-0056f000 r-xp 00004000 00:14 10         /bin/busybox
...
0189e000-0189f000 rw-p 00000000 00:00 0          [heap]
...
b7e7e000-b7edd000 r-xp 00011000 00:14 267        /lib/ld-musl-i386.so.1
...
bfb3f000-bfb60000 rw-p 00000000 00:00 0          [stack]
```

> **init:** Each line is one region: where it starts and ends, what may be done there, `r` read, `w` write, `x` run as code, and what it holds. `cat`'s own code is at the top of the list. Its _stack_, where a function keeps its variables, is at the bottom, just under the kernel's gigabyte.

## Build it

> **init:** An access the map doesn't allow makes the CPU stop and call the kernel: a _page fault_. Often the kernel just fills the page in and lets the program go on, and that is how unused addresses cost nothing until they are touched. Sometimes it ends the program, as it ended `poke`: the page at `0xc0000000` was in its map, but for kernel mode only.
>
> **init:** Now find your own variables on a map. `where.c` prints the address of a _global_ variable, one declared outside any function, and then its own map. `&global` means "the address of `global`". Add a _local_ variable, one declared inside `main`, and print its address the same way. Then run `./where` and find the region each address falls in.

## Watch it

> **init:** Before you run it: the global and the local. Which one lives on the stack?
>
> - The global
> - [x] The local

---

```
$ ./where
global at 0x4e6004
local  at 0xbfa5c338
004e2000-004e3000 r--p 00000000 00:14 7030       /home/you/where
...
004e6000-004e7000 rw-p 00003000 00:14 7030       /home/you/where
...
bfa3d000-bfa5e000 rw-p 00000000 00:00 0          [stack]
```

> **init:** The local. `0xbfa5c338` falls between `bfa3d000` and `bfa5e000`: the stack, near the top of user space. The global, `0x4e6004`, falls in `where`'s own `rw-p` region, its data, near the bottom.
>
> **init:** Run it again and both addresses move: the kernel places each new program's pieces somewhere new, so an attacker can't know where anything is. Each stays in its region. And another process can use these very addresses for different pages of RAM, because each process has its own map.

## Debrief

> **init:** So the kernel gives every process its own map, and spends real memory only on the pages in use. The CPU, the memory: one part of the kernel is left. In Files, Doors and Wires, you see how files, devices and the network all answer to the same few syscalls.

## Real world

On a Linux machine:

```
free -h                               # memory in human units
grep -E 'MemTotal|MemAvailable|Cached' /proc/meminfo
cat /proc/self/maps                   # cat's own map: notice the shared libraries
cat /proc/self/maps                   # again: the addresses moved
getconf PAGESIZE                      # 4096 on x86
```

On a 64-bit PC the addresses in `maps` have twelve hex digits, and the stack sits near `0x7ff...`, under the 128 TiB of user space.
