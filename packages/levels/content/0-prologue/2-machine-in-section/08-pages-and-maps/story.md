# Pages and Maps

## Scene

> **init:** You saw every process get its own number. Here's the stranger part: every one of them also gets its own memory, or thinks it does.
>
> **init:** 256 MiB. That's all the RAM the Machine has. And yet every process here believes it has 3 GiB of addresses to itself, about twelve times more. Remember the split from the kernel's drawing: 3 GiB for each process, the top gigabyte locked for the kernel.
>
> **The Watchdog:** Lies. The kernel tells everyone lies.
>
> **init:** Useful ones. Each process gets its own map. The kernel decides which parts of each map are backed by real memory, and by which memory.

## See it

**Physical and virtual.** **Physical memory** is the RAM chips, each byte with its own real address. A process never sees those. It uses **virtual addresses**, its own numbering, and a part of the CPU, the **MMU** (memory management unit), translates each one into a real address on every memory access.

> **init:** Like flat numbers in a building. Two buildings both have a flat 4B; the city map tells the post which street each one is on.

Where the picture stops being true: nobody looks the translation up by hand. The MMU does it in hardware, for every access, and the kernel can change a process's map at any time. And most of a process's 3 GiB has no memory behind it at all, until the process uses it.

**Pages and page tables.** Memory is handled in **pages** of 4 KiB, 4096 bytes each. For each process the kernel keeps **page tables**: a lookup from each virtual page to a physical page, called a _frame_. On the Machine the lookup has three levels of tables; a 64-bit PC uses four or five. Two processes can both use the same virtual address, say `0xbf9bb000` on their stacks, and reach two different frames; the kernel's top gigabyte is mapped the same in both. An access the page tables don't allow causes a **page fault**: either the page has no mapping, or it has one that forbids this access, like a write to a read-only page or a user-mode read of a kernel page. The kernel decides: fill the page in, or end the process. `poke`'s `SIGSEGV` was the second kind. The kernel's page at `0xc0000000` was mapped, but only for kernel mode.

> **init:** Now the whole Machine. Run `cat /proc/meminfo`, then `free`, which reads the same file and does the sums for you.

```
$ cat /proc/meminfo
MemTotal:         223588 kB
MemFree:          203128 kB
MemAvailable:     201096 kB
Buffers:               0 kB
Cached:             2852 kB
...
$ free
              total        used        free      shared  buff/cache   available
Mem:         223588       17276      203128           8        3184      201096
Swap:             0           0           0
```

Your numbers will differ a little from these: memory use changes from moment to moment.

> **init:** `MemTotal` is about 218 MiB, not 256. The firmware keeps part of the RAM for itself, and the kernel's own code and data take more. `dmesg` shows the kernel's count at boot, something like `Memory: 220092K/245368K available (10068K kernel code, ...)`.
>
> **init:** `Cached` is the _page cache_: copies of file contents the kernel keeps in RAM, so the next read doesn't have to fetch them again. A _cache_ is any copy kept close by to make the next use faster. `MemAvailable` counts most of the cache as available: the kernel can drop those copies when a program needs the memory.
>
> **init:** `free` adds `Buffers`, `Cached` and the kernel's own caches it can reclaim (`SReclaimable`, further down the file) into `buff/cache`, and `used` is what's left: `total` minus `free` minus `buff/cache`. Check it: 223588 − 203128 − 3184 = 17276.

Where the cache picture stops being true on the Machine: its files come over the 9p share from the game, and that share hands each `read` straight through without keeping a copy. So the Machine's cache is small, a few MiB, and most of it is the code of running programs, which the kernel maps in from their files. On a computer with a real disk, `Cached` often holds gigabytes.

> **kswapd:** (from the drawing) When memory runs short, I wake up and clear room.

**One process's map.** `cat /proc/self/maps`. `self` means whichever process is reading: here, `cat`.

```
004ac000-004b0000 r--p 00000000 00:14 10         /bin/busybox
004b0000-00550000 r-xp 00004000 00:14 10         /bin/busybox
00550000-00572000 r--p 000a4000 00:14 10         /bin/busybox
00572000-00574000 r--p 000c6000 00:14 10         /bin/busybox
00574000-00575000 rw-p 000c8000 00:14 10         /bin/busybox
01dd7000-01dd8000 ---p 00000000 00:00 0          [heap]
01dd8000-01dd9000 rw-p 00000000 00:00 0          [heap]
b7f07000-b7f17000 rw-p 00000000 00:00 0
b7f17000-b7f1b000 r--p 00000000 00:00 0          [vvar]
b7f1b000-b7f1d000 r--p 00000000 00:00 0          [vvar_vclock]
b7f1d000-b7f20000 r-xp 00000000 00:00 0          [vdso]
b7f20000-b7f31000 r--p 00000000 00:14 267        /lib/ld-musl-i386.so.1
b7f31000-b7f90000 r-xp 00011000 00:14 267        /lib/ld-musl-i386.so.1
b7f90000-b7fc4000 r--p 00070000 00:14 267        /lib/ld-musl-i386.so.1
b7fc4000-b7fc5000 r--p 000a3000 00:14 267        /lib/ld-musl-i386.so.1
b7fc5000-b7fc6000 rw-p 000a4000 00:14 267        /lib/ld-musl-i386.so.1
b7fc6000-b7fc8000 rw-p 00000000 00:00 0
bff47000-bff68000 rw-p 00000000 00:00 0          [stack]
```

Each line is one region of memory: its first address and the first one past it, what may be done there (`r` read, `w` write, `x` run as code, `p` private to this process), and what it holds. The addresses have eight hex digits: 32 bits, the Machine's whole address space.

> **init:** `cat` is BusyBox, so the first lines are `/bin/busybox`: its code is `r-x`, its data `rw-`. The **heap** is memory a program asks for while it runs. The **stack** is where a function keeps its local variables; it sits just under the kernel's gigabyte, at `0xbf...`. Between the heap and the stack: `ld-musl`, the C library, shared by every program that uses it; the _vdso_, a few small functions the kernel puts in every process (reading the clock without a syscall, and on this Machine the doorway programs use to make one); and long gaps with nothing behind them.
>
> **init:** Run it again. Every address moves. That's _ASLR_, address space layout randomization: the kernel places each new program's pieces somewhere new, so an attacker can't know where anything is.

## Build it

> **init:** `where.c` prints the address of a _global_ variable, one declared outside any function, and then prints its own map. I wrote the part that reads the map for you: `open`, `read` and `write`. You'll write that kind of loop yourself one day.
>
> **init:** Add a _local_ variable, one declared inside `main`, and print its address next to the global's. Then run `./where` and find which region each address falls in.

## Watch it

> **init:** Before you run it: the global and the local. Which one lives on the stack?

```
$ ./where
global at 0x467004
local  at 0xbf9bbbb8
00463000-00464000 r--p 00000000 00:14 6402       /home/you/where
00464000-00465000 r-xp 00001000 00:14 6402       /home/you/where
00465000-00466000 r--p 00002000 00:14 6402       /home/you/where
00466000-00467000 r--p 00002000 00:14 6402       /home/you/where
00467000-00468000 rw-p 00003000 00:14 6402       /home/you/where
...
bf99b000-bf9bc000 rw-p 00000000 00:00 0          [stack]
```

> **init:** The local. `0xbf9bbbb8` falls between `bf99b000` and `bf9bc000`: the stack, near the top of user space. The global, `0x467004`, falls in `where`'s own `rw-p` region, its data, near the bottom. Run it again, and both addresses change, but each stays in its region.

The memory floor of the Section drawing lights: RAM frames at the bottom, two process maps above with arrows down to them, and the page cache as a shelf of file pages.

## Debrief

> **init:** Pages, page tables, a map for each of us, and a cache of files in whatever memory is left. The kernel keeps all of it straight.
>
> **init:** One floor left before you've seen it all: files, devices and wires, in Files, Doors and Wires. And one rule that ties them together.

## Real world

On any Linux machine:

```
free -h                               # memory in human units
grep -E 'MemTotal|MemAvailable|Cached' /proc/meminfo
cat /proc/self/maps                   # cat's own map: notice the shared libraries
cat /proc/self/maps                   # again: the addresses moved (ASLR)
getconf PAGESIZE                      # 4096 on x86
```

On a 64-bit PC the addresses in `maps` have twelve hex digits, and the stack sits near `0x7ff...`, under the 128 TiB of user space.
