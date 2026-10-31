# Pages and Maps

## Scene

> **init:** 512 MiB. That's all the memory the Machine has. And yet every process here believes it has 128 TiB of addresses to itself. That's about 250,000 times more.
>
> **The Watchdog:** Lies. The Kernel tells everyone lies.
>
> **init:** Useful ones. Each process gets its own map. The Kernel decides which parts of each map are real memory, and which memory.

## See it

**Physical and virtual.** **Physical memory** is the RAM chips, each byte with its own real address. A process never sees those. It uses **virtual addresses**, its own numbering, and a part of the CPU, the **MMU** (memory management unit), translates each one into a real address on every memory access.

> **init:** Like flat numbers in a building. Two buildings both have a flat 4B; the city map tells the post which street each one is on.

Where the picture stops being true: nobody looks the translation up by hand. The MMU does it in hardware, for every access, and the Kernel can change a process's map at any time.

**Pages and page tables.** Memory is handled in **pages** of 4 KiB, 4096 bytes each. For each process the Kernel keeps **page tables**: a lookup from each virtual page to a physical page, called a frame. Two processes can both use the virtual address `0x7ffd...` and reach two different frames; the Kernel's half is mapped the same in both. A page with no mapping causes a **page fault**, and the Kernel decides: fill it in, or end the process. That was `poke`'s `SIGSEGV`.

> **init:** Now the whole Machine. Run `free`, then `cat /proc/meminfo`.

```
$ free
               total        used        free      shared  buff/cache   available
Mem:          502340       52480      421508         120       42620      449860
Swap:              0           0           0
$ cat /proc/meminfo
MemTotal:         502340 kB
MemFree:          421508 kB
MemAvailable:     449860 kB
Buffers:            1876 kB
Cached:            36912 kB
...
```

> **init:** `MemTotal` is a little under 512 MiB: the firmware and the Kernel itself keep some.
>
> **init:** `Cached` is the _page cache_: copies of file contents the Kernel keeps in RAM, so the next read doesn't touch the disk. A _cache_ is any copy kept close by to make the next use faster. `MemAvailable` counts the cache as available: the Kernel can drop those copies when a program needs the memory. That's why `free`'s `used` is `total` minus `available`, not minus `free`.
>
> **kswapd:** (from the drawing) When memory runs short, I wake up and clear room.

**One process's map.** `cat /proc/self/maps`. `self` means whichever process is reading: here, `cat`.

```
00400000-00401000 r--p 00000000 fe:02 1311  /bin/cat
00401000-00405000 r-xp 00001000 fe:02 1311  /bin/cat
00405000-00406000 rw-p 00005000 fe:02 1311  /bin/cat
01a6c000-01a8d000 rw-p 00000000 00:00 0     [heap]
7ffd6b2e1000-7ffd6b302000 rw-p 00000000 00:00 0  [stack]
```

Each line is one region of memory: its first and last address, what may be done there (`r` read, `w` write, `x` run as code, `p` private to this process), and what it holds. The program's code is `r-x`; its data is `rw-`. The **heap** is memory a program asks for while it runs. The **stack** is where a function keeps its local variables. Everything between them, up to the Kernel's half, is unused.

## Build it

> **init:** `where.c` prints the address of a _global_ variable, one declared outside any function, and then prints its own map. I wrote the part that reads the map for you: `open`, `read` and `write`. You'll write that kind of loop yourself one day.
>
> **init:** Add a _local_ variable, one declared inside `main`, and print its address next to the global's. Then run `./where` and find which region each address falls in.

## Watch it

> **init:** Before you run it: the global and the local. Which one lives on the stack?

```
$ ./where
global at 0x405010
local  at 0x7ffd6b300a4c
00400000-00401000 r--p 00000000 fe:02 1402  /home/you/where
...
00405000-00406000 rw-p 00005000 fe:02 1402  /home/you/where
7ffd6b2e1000-7ffd6b302000 rw-p 00000000 00:00 0  [stack]
```

> **init:** The local. `main`'s variables live on the stack, near the top of user space. The global lives in the program's data, near the bottom.

The memory floor of the Section drawing lights: RAM frames at the bottom, two process maps above with arrows down to them, and the page cache as a shelf of file pages.

## Debrief

> **init:** Pages, page tables, a map for each of us, and a cache of files in whatever memory is left. The Kernel keeps all of it straight.
>
> **init:** One floor left before you've seen it all: files, devices and wires. And one rule that ties them together.

## Real world

On any Linux machine:

```
free -h                               # memory in human units
grep -E 'MemTotal|MemAvailable|Cached' /proc/meminfo
cat /proc/self/maps                   # cat's own map: notice the shared libraries
cat /proc/self/maps                   # again: the addresses moved (ASLR)
getconf PAGESIZE                      # 4096 on x86-64
```
