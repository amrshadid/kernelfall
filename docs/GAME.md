# Kernelfall: the game

> Talk is cheap. Show me the code.
>
> — Linus Torvalds, on the linux-kernel list, 2000

Kernelfall is a free, open-source, story-driven game that teaches Linux from zero:
what an operating system is, the shell, systems C and userland, then writing and
debugging real drivers, and finally how the kernel runs the whole machine, from
power-on to a packet. It runs entirely in the browser: the machine you play in is
real Linux on an emulated PC, so there is nothing to install and no server.

This page is what we're building. [LEVELS.md](LEVELS.md) says how levels are made,
[CURRICULUM.md](CURRICULUM.md) lists the skills, and [BRAND.md](BRAND.md) sets the look.

## 1. Who it's for

- Developers who can already program (in any language) and want to understand
  what happens _below_ their code.
- Students taking operating-systems courses.
- Embedded, systems and security learners who want a hands-on way into kernel work.

Players don't need to know what an operating system, a kernel, a process or a
terminal is: the Prologue starts there. The Surface Survey teaches the shell
basics and Act I the C they need; people who already know a part can skip it with a
short placement check (P.5–P.9, the Survey, 1.0–1.3).

## 2. The promise

After finishing v1.0, a player can honestly say:

> **"I can write, debug and explain a Linux driver, I understand how a program
> talks to the kernel, and I can explain how Linux runs the whole machine, from
> power-on to a packet, and find out why it stopped."**

## 3. Design pillars

1. **Build, don't just fix.** The player creates things (a shell, a driver), and the
   world visibly changes because of what they built. It isn't a puzzle game.
2. **See the invisible.** X-ray mode shows what happens inside the kernel when
   anything runs.
3. **Real Linux.** The Machine runs a real Linux kernel, so names, output formats
   (`dmesg`, oops traces, `/proc`, `/sys`, errno) and behavior are the real ones.
   Where the game leaves something out, it says so.
4. **The story carries the curriculum.** Every place and character maps to a real
   kernel mechanism, and the game always names the real term.
5. **Correct beats passing.** The Taint meter rewards clean, correct code over code
   that merely works.
6. **Failure teaches.** Crashing the kernel shows an oops in the real format and then
   restores your work. Experimenting is never punished.
7. **Take it home.** Every lesson ends with how to do the same thing on a real Linux
   machine.

## 4. Story

### Premise

Kernelfall takes place inside **the Machine**, a small 32-bit x86 computer with one
CPU. Processes live in **Userland**, a bright city on the surface. Far below lies
**the Kernel**, the deep layer that keeps everything running. No process has ever
seen it.

One night the Kernel panicked. That night is called **the Kernelfall**. The
**Watchdog** forced a reboot, but the Machine came back _hollow_: the shell is gone,
the harbor is silent, and the lights of the Deep are dark. Something that caused
the crash is still down there.

The player is a newly started process. The Watchdog wakes them, and **init** (PID 1)
asks them to rebuild the Machine.

**What really happened (revealed in the Act II finale):** the old Lantern driver
gave each message a "fade" timer. A message was freed while its timer was still
queued; the timer fired in softirq context and wrote into freed memory. That
use-after-free is the Dangling. The crash log survived the reboot in **pstore**.
The Prologue shows one burnt frame of it, the Forge's boot log shows its last line,
and the finale recovers the whole log.

**Act III, the Core:** the first clean reboot wakes the old Lantern card on the PCI
bus, and its old driver with it. The Machine starts to freeze, a few seconds at a
time: **the Stall**. It isn't a creature but what a machine looks like when
something stops making progress (a soft lockup, an RCU stall, a lost wake-up). The
player goes below the Deep to the Core, where the Machine boots, keeps its memory
and time and meets its hardware, and learns to find out why it stopped.

### Characters

The player never speaks; they act. Every metaphor names its real term the first
time it appears. Tone: playful but technically exact.

| Character              | Real thing                           | Role                                                                                                                    |
| ---------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **You** (player-named) | a userspace process                  | Protagonist. Starts as uid 1000; gains root (uid 0) at the Syscall Gate, to load modules                                |
| **init** (PID 1)       | the first userspace process          | Mentor and hint-giver. Stays in Userland and speaks through the Gate in Acts II and III                                 |
| **The Watchdog**       | watchdog timer                       | Gruff companion. Stays above and speaks through the Gate in Acts II and III; meets the kernel's lockup detectors in 3.8 |
| **The Dangling**       | use-after-free / dangling pointer    | Act II's villain: a bug pattern, not a creature. It caused the Kernelfall                                               |
| **The Compiler Smith** | the C toolchain                      | Runs the Compiler's Quarter and, later, the Forge                                                                       |
| **The Harbormaster**   | the TCP/IP stack                     | Runs Socket Harbor: handshakes, queues, lost cargo; returns in the Packet Abyss                                         |
| **The Gatekeeper**     | the syscall entry path               | Guards the Syscall Gate between Userland and the Kernel                                                                 |
| **The Dockmaster**     | the module loader                    | Loads every module at the Module Docks and calls its init and exit                                                      |
| **udev**               | the device manager                   | Puts a door in `/dev` for every device in the Device Quarter                                                            |
| **kswapd**             | memory reclaim thread                | Slab Mines miner. Hoards, then evicts under pressure                                                                    |
| **The Verger**         | lockdep                              | Keeps the Lock Cathedral. Writes down every lock order it sees                                                          |
| **Ab and Ba**          | ABBA deadlock                        | The Deadlock Twins, Act II's boss. Each holds the lock the other needs                                                  |
| **ksoftirqd**          | softirq thread                       | Interrupt Spire messenger. Always busy                                                                                  |
| **The Tollkeeper**     | netfilter hooks                      | Guards the Netfilter Wall. Sees every packet at five gates                                                              |
| **The Maintainer**     | a subsystem maintainer               | Reviews your patches on the mailing list in Mainline                                                                    |
| **The Loader**         | the bootloader (GRUB, the EFI stub)  | Guide of First Light; hands the kernel its command line                                                                 |
| **swapper**            | PID 0, the boot and idle task        | The first task of all; the idle loop on every CPU                                                                       |
| **The Walker**         | the MMU's walker and fault handler   | Guide of the Page-Table Labyrinth                                                                                       |
| **The Judge**          | the scheduler (EEVDF)                | Keeps the Clockwork Court; **kthreadd** (PID 2) starts the kernel's threads beside it                                   |
| **The Lookout**        | ftrace and perf                      | Keeps the Watchtower's lenses                                                                                           |
| **The Verifier**       | the BPF verifier                     | Reads every path of a BPF program before it may run                                                                     |
| **The Grace Keeper**   | RCU's grace-period thread            | Keeps the Grace Halls, where readers never lock                                                                         |
| **The Matchmaker**     | the driver core                      | Bus Yards guide: match, then probe                                                                                      |
| **The Librarian**      | the VFS                              | Keeps the Archive Stacks; **kblockd** carries its requests to the disk                                                  |
| **The Stall**          | a CPU or task that stops progressing | Act III's antagonist: a bug pattern in the old card driver, not a creature                                              |
| **The Second Kernel**  | the kdump capture kernel             | Sleeps in reserved memory and wakes only when the first kernel dies                                                     |

## 5. Core systems

### X-ray mode (the signature feature)

Run anything in the shell, turn on X-ray, and watch what happens inside:

| View                | Shows                                                                                                  | Unlocked            |
| ------------------- | ------------------------------------------------------------------------------------------------------ | ------------------- |
| Syscalls            | each call passing through the Syscall Gate, its arguments and return value                             | P.2 (about 1:30 in) |
| Boot                | the boot, stage by stage (P.4); in depth: decompressor, `start_kernel()`, initcalls, PID 0, 1, 2 (3.1) | P.4                 |
| Section             | the Machine's cutaway: hardware, the kernel's parts, Userland; each command lights what it touches     | P.5                 |
| Memory panel        | the debugger's boxes and arrows: stack (1.0), then heap, pointers, freed (dangling) memory (1.1)       | 1.0                 |
| Processes           | the process tree, `fork`/`exec`/`exit`, a live `task_struct`; threads (3.6)                            | 1.4                 |
| Files               | fd table → `struct file` → inode, pipes, redirection                                                   | 1.6                 |
| Network             | socket → TCP/UDP → IP → network device; the driver lane: ring, interrupt, NAPI poll (3.18)             | 1.9                 |
| Kconfig             | config options, `depends on`/`select`, `.config` → `autoconf.h`                                        | 2.1                 |
| Modules and devices | loaded modules, `file_operations` dispatch for `/dev` nodes                                            | 2.2                 |
| Memory              | `kmalloc`/`kfree`, slab caches, poison, leaks                                                          | 2.8a                |
| Locks and timing    | who holds which lock, who waits, timers and interrupts firing; kernel threads (3.8)                    | 2.9                 |
| Git and patches     | the Lantern's commits, a patch email's parts (subject, tags, `---`, diff)                              | 2.9b                |
| Virtual memory      | the page-table walk, PTE flags, the TLB, VMAs and faults, a driver's mapping                           | 3.3                 |
| Scheduler           | the run queue (P.7 shows the CPU's time slices), weights, lag, virtual deadlines, every pick           | 3.7                 |
| Trace               | function graphs and trace events, BPF programs and maps; perf flame graphs (3.10)                      | 3.9                 |
| Memory order        | per-CPU store buffers and the order each CPU sees writes in; RCU readers and grace periods             | 3.12                |
| Buses               | the device tree or ACPI and the PCI tree, match then probe, register windows and interrupts            | 3.14                |
| Storage             | VFS objects and the dentry cache; the page cache and block layer (3.17)                                | 3.16                |
| Dump                | the frozen Machine from a vmcore: tasks, stacks, structures, memory, as `crash` reads them             | 3.21                |

X-ray is both the explanation tool in every level and a free sandbox. Every view
has a plain-text transcript twin for screen readers.

### The shell and the editor

The terminal is the Machine's own console, running bash. The code editor writes
the player's C into their home directory on the Machine, where gcc builds it and the
real kernel runs it.

### Taint meter

Hacky solutions add Taint: memory leaks, ignored errors, missing cleanup, lock
misuse, compiler warnings, style errors. Clean code adds none. Each act from Act II
on has **one Taint ending**, picked by that act's own total:

| Act II total | Act II ending (the reboot after Mainline, into Act III)           |
| ------------ | ----------------------------------------------------------------- |
| 0–9          | **Clean reboot:** the Dangling's pattern is gone for good         |
| 10–29        | **Unstable reboot:** the Machine runs, but the lights flicker     |
| 30+          | **The Dangling survives:** the pattern lives on as Act III begins |

| Act III total | Act III ending (the epilogue's final scene)                          |
| ------------- | -------------------------------------------------------------------- |
| 0–9           | **Steady:** a seamless warm start; the Watchdog has nothing to count |
| 10–29         | **Watchful:** the Machine runs, and the Watchdog keeps one eye open  |
| 30+           | **The Stall lingers:** the Machine runs, with an occasional hiccup   |

Every Act II ending leads into Act III. A hack in a boss or finale fix caps that
act's ending at the middle one, whatever the total. Act I Taint is shown but picks
no ending. A level's Taint comes only from its latest completion and is capped at
10, so replaying pays it back. Failed attempts and oopses never add Taint. The Taint
meter is a story mechanic; the Codex explains how it differs from the kernel's real
taint flags.

### Hints, help and score

Three hints per level from init: nudge, then concept, then pointing at the spot.
Hints never paste the solution and **never add Taint**. Each level is worth a score
of 100; hints cost 10, 20 and 30 points. Score is for the player's own pride and
never affects the ending.

A player is never stuck: "continue with init's version" completes a level with the
reference solution. That gives zero Taint and zero score, still unlocks the level's
skills and Codex cards, and marks the level **completed with help** on the Kernel
Map until it is replayed.

### Oops = respawn

If your code crashes the kernel, you see the oops in the real format, X-ray points
at the faulting line, and the Machine restores from its saved boot. Some levels make
you crash _on purpose_ so you learn to read an oops.

### The Codex

Every concept you learn becomes a **card**: the real term, a **Simple** explanation
in plain words, a **Deep** one (the kernel functions, structs and source files
behind it), a docs link and a "try it on real Linux" snippet. The Codex doubles as a
reference you can come back to.

The Codex is a book with one **chapter per region** of the Kernel Map, in play
order, so it reads from the basics to the kernel's depths:

| Act      | Chapters (levels)                                                                                                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Prologue | First Boot (P.1–P.4), The Machine in Section (P.5–P.10), Surface Survey (S.1–S.5)                                                                                                                                                                      |
| Act I    | Compiler's Quarter (1.0–1.3), Process District (1.4–1.8), Socket Harbor (1.9–1.10), The Syscall Gate (1.B)                                                                                                                                             |
| Act II   | The Forge (2.1), Module Docks (2.2–2.3), Device Quarter (2.4–2.7), Slab Mines (2.8a–2.8b), Lock Cathedral (2.9–2.9b), Interrupt Spire (2.10a–c), Netfilter Wall (2.11), The Dangling (2.12), Mainline (2.13, then 3.22)                                |
| Act III  | First Light (3.1–3.2), Page-Table Labyrinth (3.3–3.5), Clockwork Court (3.6–3.8), Watchtower (3.9–3.11), Grace Halls (3.12–3.13), Bus Yards (3.14–3.15), Archive Stacks (3.16–3.17), Packet Abyss (3.18–3.19), The Stall (3.20), Crash Archives (3.21) |

Mainline is one region that both acts end in: Act III's epilogue (3.22) adds its
cards to the same chapter.

- **Title page:** the region's story in a few lines, its guide, and the real part of
  Linux it stands for.
- **Cards in teaching order,** not in the order they were collected. Cards not found
  yet (including a side level's) are blank outlines with their level number
  ("3 / 7 filed"), never spoilers.
- **Deepens:** when a later level goes deeper into an idea (P.2's `syscall`, then
  1.B's full syscall path), it adds to the same card's chain instead of a
  duplicate, and each card links both ways. Card ids are unique across the game.
- **You can now…:** a finished chapter ends with what the player can now do, in the
  words of [CURRICULUM.md](CURRICULUM.md)'s outcomes.

The Codex also holds the **glossary** (every first-meeting word, from the Prologue
on) and the **Field Guide**, opened in P.3: one entry per command and folder (`ls`,
`cd`, `cat`, `/proc`, `/dev`, …), each listing the syscalls it makes, linked to
their cards. Both grow with each act.

### The Kernel Map and skill tree

The map of the Machine is also the skill tree. Each node is a concrete skill
("can expose a value through sysfs") with its prerequisites; the ids are in
[CURRICULUM.md](CURRICULUM.md). Regions light up as you rebuild them, so players
always know where they are and what comes next. Side levels show as branches off
the main path.

## 6. The level loop (10–30 minutes each)

1. **Scene:** a character introduces the idea in under a minute.
2. **See it:** an X-ray demonstration of the concept in action.
3. **Build it:** write the next piece of real code, with guidance.
4. **Watch it:** the world reacts, with real `dmesg`/`/proc` output alongside. In
   many levels it opens with a **Predict** beat (about a minute): the player commits
   to what will happen (predict an outcome, order the steps of a path, point at a
   line in a report, or choose and justify), then the Machine shows the truth. A
   wrong answer costs nothing. It is an in-world moment, never a quiz or a riddle.
5. **Real-world card:** real terms, source file, "try it on real Linux". Added to the Codex.

There is no Submit button: every run is checked against the objectives
automatically, and objectives tick live.

## 7. Levels (v1.0)

The level specs live in [`docs/levels/`](levels/); [LEVELS.md](LEVELS.md) has the
whole journey on one page. v1.0 is 66 levels, about 21 hours: the main path is 63
levels (about 20 hours 50 minutes), plus three optional side levels in Act III.

### Prologue: First Boot and the Machine in Section (10 levels, ~3 h 40 min)

For someone who may not know what a kernel or a terminal is. P.5–P.9 are skippable
with a placement check.

| #    | Level                  | You learn                                                                                         |
| ---- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| P.1  | Power On               | a computer's parts, what an operating system and a kernel are, program vs process; first commands |
| P.2  | First Words            | syscalls, user and kernel mode, `write()`; X-ray's syscalls view about 1:30 in; a first C program |
| P.3  | Speak to the Shell     | the prompt, arguments and options, `man`, Tab, the environment and `PATH`                         |
| P.4  | The Boot Path          | firmware (BIOS, UEFI), GRUB, the kernel command line, initcalls, the initramfs, PID 1             |
| P.5  | The Kernel Up Close    | what the kernel owns, signals, modules, distributions, mainline, stable and LTS                   |
| P.6  | Finding the Hardware   | ACPI and PCI, a device tree, `/sys`, drivers and binding, interrupts                              |
| P.7  | Who Runs               | processes and kernel threads, `/proc/<pid>/status`, the scheduler sharing one CPU                 |
| P.8  | Pages and Maps         | virtual memory, pages, `/proc/meminfo` and maps, the page cache                                   |
| P.9  | Files, Doors and Wires | the VFS, filesystems, device files, the network stack, the kernel's parts and its source tree     |
| P.10 | Bring the Machine Up   | capstone: fix a stalled boot, then trace one command through every part and back                  |

### Surface Survey (5 levels, ~1 h 40 min, skippable with a placement check)

| #   | Level                   | You learn                                                                                    |
| --- | ----------------------- | -------------------------------------------------------------------------------------------- |
| S.1 | The Streets of Userland | the filesystem tree, paths, making, copying, moving and removing files; `/proc` made on read |
| S.2 | Who May Enter           | users and uids, `rwx` bits, root, the kernel's permission check (`EACCES` vs `EPERM`)        |
| S.3 | Processes from Outside  | `ps` and `/proc`, process states, stopping, resuming and ending a process with `kill`        |
| S.4 | Finding Things          | `find`, standard error                                                                       |
| S.5 | Counting and Sorting    | `wc`, `grep`, `head`, `tail`, `sort`, `uniq`; a `\|` teaser for 1.7                          |

### Act I: Userland (12 levels, ~4 h). Project: your own shell, `ksh-lite`

| #    | Region              | Your shell gains…                      | You learn                                                                        |
| ---- | ------------------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| 1.0  | Compiler's Quarter* | (a word counter)                       | strings and arrays in C, `sizeof` vs `strlen`, compile errors                    |
| 1.1  | Compiler's Quarter* | a tokenizer                            | pointers, the heap, `malloc`/`free`, dangling pointers                           |
| 1.2  | Compiler's Quarter* | a command table                        | structs, function pointers (the pattern behind `file_operations`)                |
| 1.3  | Compiler's Quarter* | a build                                | Make, warnings, AddressSanitizer, gdb                                            |
| 1.4  | Process District    | running a command                      | `fork`, `exec`, `wait`; errno; why parent and child memory differ                |
| 1.5  | Process District    | `cd`, environment variables            | process state, `/proc/<pid>`, `strace`                                           |
| 1.6  | Process District    | `>`, `>>` and `<`                      | file descriptors, `dup2`, the `read` contract, "everything is a file"; bit flags |
| 1.7  | Process District    | pipes `\|`                             | `pipe`, `SIGPIPE`                                                                |
| 1.8  | Process District    | Ctrl-C handling                        | signals; a first race (handler vs main loop)                                     |
| 1.9  | Socket Harbor       | a chat server that reconnects the city | TCP sockets, a packet's path through the stack                                   |
| 1.10 | Socket Harbor       | many clients at once                   | `poll`                                                                           |
| 1.B  | The Syscall Gate    | root, to go down into the Deep         | boss: trace your own shell and server; the syscall path, step by step            |
| T1   | (take it home)      | —                                      | optional: build and check your shell on a real Linux machine                     |

\* Skippable with a short placement check.

**Act I outcome:** you understand processes, file descriptors, signals, sockets and
syscalls, and you've written a working shell and server in C. Both come with you:
`ksh-lite` is your terminal in the Deep, and `harbor` is the traffic the Netfilter
Wall counts.

### Act II: The Deep (17 levels, ~5 h 30 min). Project: one driver, _the Lantern_, that relights the city

You drive the Lantern from your own `ksh-lite`, as root (`echo hi > /dev/lantern`,
`cat /dev/lantern`, Ctrl-C), and earlier topics return deeper: pipes and signals
in the blocking read (2.10c), `/proc` reading in `/proc/lantern` (2.7), `cat`'s
`read`/`write` in `file_operations` (2.5).

| #     | Region          | The Lantern gains…                                                                       | You learn                                                                                                                |
| ----- | --------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2.1   | The Forge       | (your own kernel)                                                                        | Kconfig, kbuild; enabling KASAN and lockdep for later; finding things in the kernel source                               |
| 2.2   | Module Docks    | it loads and says hello                                                                  | modules, `init`/`exit`, `printk`, `dmesg`, negative errno; crash on purpose and read the oops                            |
| 2.3   | Module Docks    | settings                                                                                 | module parameters, `modinfo`                                                                                             |
| 2.4   | Device Quarter  | `/dev/lantern`                                                                           | char devices, major/minor numbers, `goto` error unwinding; a root-only door                                              |
| 2.5   | Device Quarter  | read and write                                                                           | separate address spaces, `copy_to_user`/`copy_from_user`, `file_operations`, a `read()` from user space to your driver   |
| 2.6   | Device Quarter  | brightness control                                                                       | `ioctl`                                                                                                                  |
| 2.7   | Device Quarter  | status pages                                                                             | procfs, sysfs                                                                                                            |
| 2.8a  | Slab Mines      | messages of any size                                                                     | `kmalloc`/`kfree`, `GFP_KERNEL`, kmemleak                                                                                |
| 2.8b  | Slab Mines      | readers keep their message                                                               | who frees what (`kref`), `container_of`, reading a KASAN report                                                          |
| 2.9   | Lock Cathedral  | many users at once                                                                       | races, mutexes, lockdep                                                                                                  |
| 2.9b  | Lock Cathedral  | a message history, then **the Deadlock Twins** (boss)                                    | ABBA deadlock, reading a lockdep report, lock ordering; applying a patch with `git am`                                   |
| 2.10a | Interrupt Spire | blinking                                                                                 | timers, atomic context, `GFP_ATOMIC`                                                                                     |
| 2.10b | Interrupt Spire | a light sensor                                                                           | interrupts, spinlocks, workqueues (top half and bottom half)                                                             |
| 2.10c | Interrupt Spire | a sensor you can wait on                                                                 | wait queues (a blocking `read`, like a pipe reader; `-ERESTARTSYS` and Ctrl-C)                                           |
| 2.11  | Netfilter Wall  | a gate that counts packets from your Act I chat server                                   | netfilter hooks, atomic counters                                                                                         |
| 2.12  | the whole Deep  | **The Dangling** (finale) hides in your own driver: a timer runs after its data is freed | use-after-free, fixing it with KASAN's help                                                                              |
| 2.13  | Mainline        | —                                                                                        | an upstream-style patch: `checkpatch.pl`, commit message, `Signed-off-by`, `git format-patch`, `get_maintainer.pl`, a v2 |
| T2    | (take it home)  | —                                                                                        | optional: build and stress your Lantern on a real 6.18 kernel in a VM                                                    |

**Act II outcome:** you can write, debug and explain a character driver: `read`,
`write`, `ioctl`, sysfs, correct error paths, locking, timers, interrupts and wait
queues, and you can read an oops, a KASAN, lockdep or kmemleak report and fix it.

### Act III: The Core (22 levels, ~6 h main path + ~47 min of side levels). Projects: the Lantern goes to the Core, and `lens`, your own X-ray

| #     | Region               | You build                                            | You learn                                                               |
| ----- | -------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| 3.1   | First Light          | the Lantern's boot parameter; a crash kernel         | BIOS vs UEFI, the kernel image, the kernel command line, `crashkernel=` |
| 3.2   | First Light          | a built-in Lantern; your own `/init`                 | `start_kernel()` to PID 1, initcall levels, the initramfs, switch-root  |
| 3.3   | Page-Table Labyrinth | `lens walk`                                          | the four-level page-table walk, PTE flags, the TLB, `pagemap`           |
| 3.4   | Page-Table Labyrinth | `lens faults`                                        | page faults, demand paging, copy-on-write                               |
| 3.5   | Page-Table Labyrinth | the Lantern's light map                              | VMAs, `mmap`, a driver's fault handler                                  |
| 3.6   | Clockwork Court      | `harbor`'s second thread                             | threads, `clone` flags, `futex`, condition variables                    |
| 3.7   | Clockwork Court      | `lens sched`                                         | EEVDF: weights, lag, virtual deadlines; scheduling classes              |
| 3.8   | Clockwork Court      | the Lantern's heartbeat thread                       | kernel threads, preemption models, the soft lockup detector             |
| 3.9   | Watchtower           | the Lantern's tracepoints                            | ftrace, trace events, `TRACE_EVENT()`                                   |
| 3.10† | Watchtower           | `lens stat`                                          | perf: counting and sampling                                             |
| 3.11  | Watchtower           | `lens bpf`, a write counter                          | eBPF, maps, the verifier                                                |
| 3.12  | Grace Halls          | a lock-free sensor ring                              | memory ordering, `READ_ONCE`, acquire/release, KCSAN                    |
| 3.13  | Grace Halls          | an RCU history                                       | RCU, grace periods, RCU stall warnings                                  |
| 3.14  | Bus Yards            | the lighthouse board's beacon driver                 | a platform driver bound by the device tree, `devm_`, the LED class      |
| 3.15  | Bus Yards            | the Lantern card's PCI driver                        | PCI: BARs, MMIO, MSI, binding and unbinding                             |
| 3.16  | Archive Stacks       | `lanternfs`                                          | the VFS objects and the dentry cache, a tiny filesystem                 |
| 3.17† | Archive Stacks       | a block device                                       | the page cache, readahead, writeback, blk-mq                            |
| 3.18  | Packet Abyss         | the light link, `lantern0`                           | a network driver: `net_device`, `sk_buff`, NAPI and its budget          |
| 3.19† | Packet Abyss         | an XDP gate                                          | XDP: a verdict before the `sk_buff`                                     |
| 3.20  | the whole Core       | **the Stall** (boss): the old card driver's NAPI fix | soft lockup and RCU stall reports, read with ftrace and BPF             |
| 3.21  | Crash Archives       | the calibration fix (finale)                         | kdump and `crash`: reading a dead Machine; a lost wake-up               |
| 3.22  | Mainline             | KUnit tests and a patch series                       | KUnit; the Machine warm-starts into the fixed kernel                    |
| T3    | (take it home)       | —                                                    | optional: the act on a real 6.18 kernel in QEMU                         |

† Optional side level: its skills and cards are earned there, and no required level
depends on it.

**Act III outcome:** you understand boot, virtual memory, scheduling, tracing,
memory ordering and RCU, real device drivers, filesystems and the network data
path, and you can diagnose a stall from a live trace or a dead Machine's dump.

## 8. After v1.0

v1.0 is the Prologue, the Surface Survey and Acts I, II and III. Ideas for later,
none of them promised:

- **Act IV ideas:** namespaces and cgroups (what a container is), security
  (capabilities, LSMs, seccomp), virtualization (KVM), USB and DMA in depth,
  `io_uring`, power management, Rust in the kernel.

## 9. The interface

### Screens

| Route              | Screen                                      |
| ------------------ | ------------------------------------------- |
| `#/`               | Title                                       |
| `#/map`            | Kernel Map: level select and skill tree     |
| `#/play/<levelId>` | Level screen (the step is kept in the save) |
| `#/codex/<cardId>` | Codex (card optional)                       |
| `#/progress`       | Progress and stats                          |
| `#/settings`       | Settings (`#/settings/saves` for saves)     |

Routes are hash-based, so a static host needs no rewrites. The tab title follows
the route, e.g. `1.4 Run Anything · Kernelfall`. The Oops panel, Codex cards, the
command palette and the shortcut sheet are overlays.

### The level screen

- **Top bar:** back to map, level name, the **step rail** (the five-step loop),
  Taint meter, Hint, command palette, menu.
- **Guide panel (left):** NPC dialogue, objectives, command chips,
  Codex links.
- **Workspace (center):** editor on top, terminal below, resizable split.
- **X-ray dock (right):** view tabs, the live diagram, timeline, transcript.
- **Status bar:** save state, the Machine's state, shortcut hint.

Each step changes the layout's emphasis, never the layout itself. Below 1280 px
X-ray becomes a tab next to the editor. Below 1024 px the game shows a "needs a
bigger screen" page: a real editor, terminal and X-ray don't fit a phone.

### Keyboard shortcuts

`Mod` is Cmd on macOS and Ctrl elsewhere.

| Action                      | Shortcut                                            |
| --------------------------- | --------------------------------------------------- |
| Run (build + run + check)   | `Mod+Enter`                                         |
| Save now                    | `Mod+S`                                             |
| Next step / previous step   | `Alt+N` / `Alt+P`                                   |
| Hint                        | `Alt+H`                                             |
| Toggle X-ray (and focus it) | `Alt+X`                                             |
| Focus editor / terminal     | `Alt+E` / `Alt+T`                                   |
| Focus Guide                 | `Alt+G`                                             |
| Open Codex overlay          | `Alt+C`                                             |
| Command palette             | `Mod+K`                                             |
| Shortcut sheet              | `Alt+/` (`⌥/` on macOS), or `?` outside text fields |
| Close overlay               | `Esc`                                               |

Keys the shell needs (`Ctrl+C`, `Ctrl+D`, `Ctrl+Z`, `Ctrl+L`, `Ctrl+R`, `Tab`,
arrows) always go to the terminal when it has focus. `Alt+E`, `Alt+G` and `Alt+X`
always leave the terminal, so it is never a keyboard trap. The shortcut sheet is
generated from the same table the key handler uses. (`Mod+Shift+/` is taken by
macOS's Help menu.)

### Accessibility

WCAG 2.2 level AA across the game:

- Text contrast ≥ 4.5:1; controls and focus ≥ 3:1.
- Everything works by keyboard, with visible focus that sticky bars never cover.
- Usable at 200% zoom; UI scale 87.5–150% and a separate code font size.
- Every drag (panel dividers, X-ray timeline) has a click or key alternative.
- Targets at least 24 × 24 px, 44 × 44 on touch layouts.
- Nothing is timed. `prefers-reduced-motion` turns X-ray animation into a slideshow.
- Status never relies on color alone: every state has an icon and a label, and the
  Taint meter shows a number.
- The terminal has a screen-reader mode, and each run is summarized in a polite
  live region. On a route change, focus moves to the screen's `h1`; dialogs trap
  focus and return it to the trigger.

## 10. What the game is not

- Not a puzzle game. Challenge comes from building real things, not riddles.
- Not a replacement for real hardware. It's the on-ramp: the Machine is real Linux
  on an emulated PC, and every lesson (and T1–T3) shows how to continue on your own
  Linux machine.
- Not timed. Learning takes the time it takes.
