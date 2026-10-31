# Act III: The Core (level specs)

Level-by-level design specs for Act III, its boss (the Stall), the Crash Archives
finale and the epilogue in Mainline. The story, characters and systems come from
[GAME.md](../GAME.md); the rules every level follows come from
[LEVELS.md](../LEVELS.md). Act III follows Act II
([act-2-the-deep.md](act-2-the-deep.md)) and goes deep where the Prologue gave
overviews ([prologue.md](prologue.md): P.4 boot, P.6 hardware, P.7 who runs, P.8
memory, P.9 files and wires). Act III is part of v1.0.

Kernel APIs move between versions. This file follows **Linux 6.18** (LTS). Sample
output is abridged: addresses, offsets, timings and some frames differ between
machines. Anything marked **(verify)** has not been checked against the v6.18
source yet and must be before the level ships. Golden-output tests remain the final
check.

Numbering: levels `3.1` to `3.19` in play order, the boss `3.20`, the finale `3.21`
and the epilogue `3.22`. After the epilogue comes the optional transfer task T3.
**3.10, 3.17 and 3.19 are optional side levels** (marked † below): they open on the
Kernel Map when their prerequisites are met, their skills and Codex cards are earned
there as usual, and no required level depends on them.

| #    | Level id                                       | Title                 | Region               | Time    | One new idea                                                   |
| ---- | ---------------------------------------------- | --------------------- | -------------------- | ------- | -------------------------------------------------------------- |
| 3.1  | `act3-first-light-01-the-loader`               | The Loader            | First Light          | ~15 min | how firmware and a bootloader hand the kernel its command line |
| 3.2  | `act3-first-light-02-before-pid-1`             | Before PID 1          | First Light          | ~20 min | from `start_kernel()` to PID 1: initcalls and the initramfs    |
| 3.3  | `act3-page-table-labyrinth-03-the-walk`        | The Walk              | Page-Table Labyrinth | ~18 min | page tables: translating an address in four steps              |
| 3.4  | `act3-page-table-labyrinth-04-fault-lines`     | Fault Lines           | Page-Table Labyrinth | ~15 min | page faults: demand paging and copy-on-write                   |
| 3.5  | `act3-page-table-labyrinth-05-the-light-map`   | The Light Map         | Page-Table Labyrinth | ~20 min | `mmap`: VMAs and a driver's fault handler                      |
| 3.6  | `act3-clockwork-court-06-many-hands`           | Many Hands            | Clockwork Court      | ~15 min | threads: tasks that share one address space                    |
| 3.7  | `act3-clockwork-court-07-the-judge`            | The Judge             | Clockwork Court      | ~18 min | how EEVDF picks the next task                                  |
| 3.8  | `act3-clockwork-court-08-the-pulse`            | The Pulse             | Clockwork Court      | ~15 min | kernel threads, preemption and the soft lockup detector        |
| 3.9  | `act3-watchtower-09-the-lookout`               | The Lookout           | Watchtower           | ~15 min | ftrace and tracepoints                                         |
| 3.10 | `act3-watchtower-10-where-the-time-goes`       | Where the Time Goes † | Watchtower           | ~12 min | perf: counting and sampling                                    |
| 3.11 | `act3-watchtower-11-the-verifier`              | The Verifier          | Watchtower           | ~20 min | eBPF: a checked program inside the kernel                      |
| 3.12 | `act3-grace-halls-12-hall-of-mirrors`          | Hall of Mirrors       | Grace Halls          | ~20 min | memory ordering, read with KCSAN                               |
| 3.13 | `act3-grace-halls-13-grace`                    | Grace                 | Grace Halls          | ~20 min | RCU: readers without locks                                     |
| 3.14 | `act3-bus-yards-14-the-lighthouse`             | The Lighthouse Board  | Bus Yards            | ~18 min | a platform driver bound by the device tree                     |
| 3.15 | `act3-bus-yards-15-the-lantern-card`           | The Lantern Card      | Bus Yards            | ~20 min | a PCI driver: BARs, MMIO and MSI                               |
| 3.16 | `act3-archive-stacks-16-a-filesystem-of-light` | A Filesystem of Light | Archive Stacks       | ~20 min | the VFS objects, in a tiny filesystem                          |
| 3.17 | `act3-archive-stacks-17-down-to-the-disk`      | Down to the Disk †    | Archive Stacks       | ~20 min | the page cache and the block layer                             |
| 3.18 | `act3-packet-abyss-18-the-light-link`          | The Light Link        | Packet Abyss         | ~20 min | a network driver's receive path: `sk_buff` and NAPI            |
| 3.19 | `act3-packet-abyss-19-the-first-gate`          | The First Gate †      | Packet Abyss         | ~15 min | XDP: a verdict before the `sk_buff`                            |
| 3.20 | `act3-the-stall-20-the-stall`                  | The Stall (boss)      | the whole Core       | ~25 min | — (assesses the act)                                           |
| 3.21 | `act3-crash-archives-21-the-second-kernel`     | The Second Kernel     | Crash Archives       | ~30 min | kdump and `crash`: reading a dead Machine                      |
| 3.22 | `act3-mainline-22-never-again`                 | Never Again           | Mainline             | ~20 min | KUnit: a regression test for every fix                         |
| T3   | —                                              | Take it home          | (real Linux)         | kit     | optional: the act on a real 6.18 kernel in QEMU                |

The main path (19 levels) takes about **6 hours**, the longest act; the three side
levels add about 47 minutes (6.9 hours with all of them). Re-homed for the side
levels: 3.11 and 3.13 no longer need `dbg-perf`, and the boss's diagnosis works
with ftrace, BPF and `softnet_stat`, with perf as an option; the Storm starts at the
end of 3.18, so the boss doesn't need 3.19; `lens stat` (3.10) is an optional part
of `lens`.

## Learning outcome

> **"I can explain how Linux runs the whole machine, from power-on to a packet, and
> find out why it stopped."**

By the end of Act III the player has booted the Machine their own way (a kernel
command line, a built-in Lantern, an initramfs `/init` in C), walked page tables by
hand, given the Lantern an `mmap`, a kernel thread, tracepoints, an RCU-protected
history and a lock-free sensor ring, written a platform driver from a device tree, a
PCI driver, a tiny filesystem and a NAPI network driver, written an eBPF tracing
program (plus, in the side levels, a perf tool, a block driver and an XDP program),
and read a soft lockup report, an RCU stall
warning, a KCSAN report and a whole crash dump. Their fixes ship as a tested patch
series.

**Act III outcome** (for GAME.md's level table): you understand boot, virtual memory,
scheduling, tracing, memory ordering and RCU, real device drivers, filesystems and
the network data path, and you can diagnose a stall from a live trace or a dead
Machine's dump.

## The projects in the Core

Act III has two projects, the way Act I had a shell and a server. Both carry
through the act and both are the player's own code from earlier acts, grown.

1. **The Lantern goes to the Core.** The Act II driver keeps growing: a command-line
   parameter and a built-in initcall (3.1, 3.2), a memory map (3.5), a heartbeat
   thread (3.8), tracepoints (3.9), a lock-free sensor ring (3.12), an RCU history
   (3.13), and then real hardware: the **lighthouse board's** beacon (3.14) and the
   **Lantern card** on the Machine's PCI bus (3.15), with a filesystem (3.16), a
   block device (3.17, optional) and a network link (3.18, and its XDP gate in the
   optional 3.19).
2. **`lens`, your own X-ray.** X-ray is the game's eye; on a real machine there is
   none. The player builds `lens`, a small C tool that shows the same things on real
   Linux: `lens walk` (page tables, 3.3), `lens faults` (3.4), `lens sched` (3.7),
   `lens stat` (perf counters, in the optional 3.10) and `lens bpf` (a BPF loader,
   3.11). It is the tool T3 takes home.

Earlier projects come back, as in Act II:

- **`ksh-lite` is still the terminal** (prompt `ksh$`, root, no quotes). In 3.2 it
  becomes the rescue shell that the player's own `/init` falls back to.
- **`harbor`** gains a second thread (3.6) and is the latency-sensitive task the
  Judge protects (3.7) and the Stall freezes (3.20).
- **`lanternctl`** reads the light map without a syscall (3.5), and is the process
  stuck in the finale's dump (3.21).
- **The Lantern's 2.x features return under new tools:** the 2.10a timer next to a
  kernel thread (3.8), the 2.9b history under RCU (3.13), 2.10b's sensor spinlock
  replaced by acquire/release (3.12), 2.12's "stop before free" generalized by grace
  periods (3.13).

Starter help starts at **partial** again (a new layer of the Machine), steps back one
notch for each new subsystem with its own boilerplate (3.11 BPF, 3.14 the driver
model, 3.16 a filesystem, 3.18 a net device) and fades to **blank** within each
region. Salvaged code (the old card driver in 3.20 and 3.21) is content, not
scaffolding.

## Story arc

**Where Act II left off.** The epilogue ends with a reboot. Whatever the Taint
ending, the Lantern's own Dangling is gone and the Deep is lit. That reboot is the
first clean one since the Kernelfall, and two things happen during it. A **fourth
device answers on the PCI bus**: the Lantern card, the old lamp's real hardware,
dark since that night. And its **old driver**, `lantern_card`, written by the same
hand as the old Lantern, loads with it.

**The Stall.** The Machine runs, lit, but it freezes: a few seconds, sometimes
twenty, then it carries on. Nothing crashes, so nothing reaches pstore. The Watchdog
felt each one. init: "The Dangling broke things. This one just stops." The Stall is
not a creature, and not one bug: it is what the Machine looks like when something
stops making progress. A CPU that never reaches the scheduler (a soft lockup), a
grace period that never ends (an RCU stall), a task that waits for a wake-up that
already came (a hung task). The player learns to see each kind before facing them.

**The Core** lies below the Deep: where the Machine starts, keeps its memory, keeps
its time and meets its hardware. Each region is one real part of the kernel, with a
guide named for the real thing:

| Region               | Levels    | Guide (real thing)                                                                                           | What lights up                                             |
| -------------------- | --------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| First Light          | 3.1–3.2   | **the Loader** (the bootloader: GRUB, the EFI stub), **swapper** (PID 0, the boot task, later the idle task) | the boot stair; the Lantern glows before init runs         |
| Page-Table Labyrinth | 3.3–3.5   | **the Walker** (the MMU's page-table walker and the kernel's fault handler), kswapd (cameo)                  | corridors of the Labyrinth, one level of tables at a time  |
| Clockwork Court      | 3.6–3.8   | **the Judge** (the scheduler), **kthreadd** (PID 2), swapper (cameo)                                         | the Court's clock; the Lantern's heartbeat                 |
| Watchtower           | 3.9–3.11  | **the Lookout** (ftrace and perf), **the Verifier** (the BPF verifier)                                       | the Tower's lenses turn, one per tool                      |
| Grace Halls          | 3.12–3.13 | **the Grace Keeper** (RCU's grace-period kthread, `rcu_preempt`), the Verger (cameo)                         | mirrors that agree; the Halls' doors left open for readers |
| Bus Yards            | 3.14–3.15 | **the Matchmaker** (the driver core: match, then probe), udev (cameo)                                        | the lighthouse beacon; the Lantern card's lamp             |
| Archive Stacks       | 3.16–3.17 | **the Librarian** (the VFS), **kblockd** (the block layer's workqueue, cameo)                                | shelves of messages; the Archive's disk light              |
| Packet Abyss         | 3.18–3.19 | the Harbormaster (TCP/IP, returning), ksoftirqd (returning), the Tollkeeper (cameo)                          | the light link to the lighthouse; the first gate           |
| (boss)               | 3.20      | **the Stall**, the Watchdog (the kernel's lockup detectors)                                                  | the freezes stop                                           |
| Crash Archives       | 3.21      | **the Second Kernel** (the kdump capture kernel), the Watchdog, init                                         | the whole Machine, frozen and readable                     |
| Mainline             | 3.22      | the Maintainer (returning), the Loader (kexec)                                                               | the warm start into the fixed kernel                       |

**The Second Kernel** is the act's quiet character. In 3.1 the player reserves
memory for it (`crashkernel=`) and loads it (`kexec -p`). It sleeps in that memory,
says nothing, and appears only in the finale, when the first kernel dies: "I only
ever wake up at funerals."

**The Watchdog finds its real self.** In Act I and II the Watchdog was a story
character (a watchdog timer). In 3.8 it meets the kernel's own watchdogs in
`kernel/watchdog.c` (the soft and hard lockup detectors) and `kernel/hung_task.c`:
"So that's what I am, down there."

**Who speaks from where.** As in Act II, init and the Watchdog stay above and speak
through the Gate (their lines are log lines in `dmesg`); the Core's guides speak in
person. The player never speaks; they act.

**Clues to the Stall**, one per region, always as real evidence:

- **3.1:** the Watchdog's tally: four freezes since the reboot, all on CPU 1, all in
  the evening, "when the harbor is busy". Nothing in pstore.
- **3.7:** the Judge: "Some evenings CPU 1 stops coming to court. Twenty seconds,
  nobody runs there, not even swapper."
- **3.8:** the player sees their first soft lockup report, on purpose, and the
  Watchdog recognizes the shape: "That. That's what I feel."
- **3.9:** the Lookout's old trace from a freeze: CPU 1 entered `net_rx_action()` and
  the trace ends there.
- **3.13:** the Grace Keeper: on the freeze nights, grace periods "waited for CPU 1
  and never got an answer".
- **3.15:** the player's own card driver binds the Lantern card in their test kernel;
  the everyday kernel still runs the old `lantern_card`.
- **3.18:** the lighthouse's broken beacon daemon floods the light link: the Storm.
  The everyday kernel still drives the card with the old driver. (In the optional
  3.19, the player's XDP gate stops the Storm on their own kernel; the everyday
  kernel has no gate.)
- **3.20 (boss):** the Storm hits the everyday kernel, and the Stall happens live.
- **3.21 (finale):** a different freeze, one that never ends.

**What really happened** (revealed across the boss and the finale): the old card
driver stops progress two ways. Its NAPI poll drains the link's ring without a
budget, so under a flood one CPU never leaves the softirq (the freezes). And its
calibration command checks "done?" and then goes to sleep, so a completion interrupt
that arrives in between is lost and the caller sleeps forever (the hang). Both are
bug patterns with many real upstream fixes. Neither is a creature; both are code.

## Skill tree (Act III)

New skills, to add to [CURRICULUM.md](../CURRICULUM.md) with the existing area
prefixes. **Needs** lists prerequisites from earlier acts (Prologue ids from
[prologue.md](prologue.md), Act II ids from [act-2-the-deep.md](act-2-the-deep.md)).

| Id                     | Name                        | The player can…                                                                                                                                                                        | Needs                                                            | Level |
| ---------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----- |
| `sys-boot-firmware`    | Power-on to kernel          | explain BIOS vs UEFI boot (MBR vs EFI system partition, Secure Boot's shim), what the bootloader loads and hands over, and how an x86 kernel image reaches `start_kernel()`            | `sys-boot-chain`, `kdev-config-build`                            | 3.1   |
| `sys-kernel-cmdline`   | Speak to the kernel at boot | say how the kernel parses its command line (early params, `__setup`, `module.param=`, unknown words passed to init), set parameters for one boot or for good, and reserve crash memory | `sys-boot-firmware`, `drv-module-params`                         | 3.1   |
| `sys-early-boot`       | Before PID 1                | follow `start_kernel()` to `rest_init()`, say what PID 0, 1 and 2 become, explain initcall levels and find a built-in driver's initcall with `initcall_debug`                          | `sys-kernel-cmdline`, `drv-module-lifecycle`                     | 3.2   |
| `sys-initramfs`        | Your own /init              | write an initramfs `/init` that mounts `/proc`, `/sys` and `/dev`, mounts the real root and hands over with a switch-root, and explain why PID 1 must never exit                       | `sys-early-boot`, `proc-lifecycle`, `sys-errno`                  | 3.2   |
| `mem-page-tables`      | The four-level walk         | translate a virtual address by hand through x86-64's page tables, decode PTE flags and `/proc/<pid>/pagemap`, and explain what the TLB caches                                          | `mem-address-spaces`, `mem-virtual-memory-basics`, `c-bit-flags` | 3.3   |
| `mem-page-faults`      | Faults on purpose           | explain demand paging, minor and major faults, the zero page and copy-on-write after `fork`, follow a fault to `handle_mm_fault()`, and count faults                                   | `mem-page-tables`, `proc-lifecycle`                              | 3.4   |
| `mem-mmap`             | Mapping memory              | explain VMAs and `mmap` (private or shared, file or anonymous), and implement a driver `mmap` with a fault handler                                                                     | `mem-page-faults`, `drv-fops`, `mem-object-lifetime`             | 3.5   |
| `proc-threads`         | Threads                     | write a program with pthreads (create, join, mutex, condition variable), explain that a thread is a task sharing an `mm`, and how a contended mutex sleeps in `futex`                  | `proc-lifecycle`, `sync-mutex`, `net-poll`                       | 3.6   |
| `proc-scheduler`       | How the Judge picks         | explain EEVDF (weights from nice, lag, eligibility, virtual deadlines), predict CPU shares from nice values, and read a task's scheduler statistics                                    | `proc-threads`, `proc-process-basics`                            | 3.7   |
| `proc-kthreads`        | Kernel threads              | run kernel work in a kthread that sleeps, wakes and stops cleanly with `kthread_stop()` before its data is freed                                                                       | `proc-scheduler`, `irq-wait-queues`                              | 3.8   |
| `dbg-lockups`          | Lockups                     | explain the preemption models and why kernel code must reach the scheduler, read a soft lockup report, and fix a loop that hogs a CPU                                                  | `proc-kthreads`, `sync-spinlocks`                                | 3.8   |
| `dbg-ftrace`           | ftrace                      | trace the kernel through tracefs: the function and function_graph tracers, filters, and trace events                                                                                   | `dbg-printk-dmesg`, `drv-read-path`                              | 3.9   |
| `dbg-tracepoints`      | Your own tracepoint         | add a tracepoint to a driver with `TRACE_EVENT()` and read it in the trace buffer                                                                                                      | `dbg-ftrace`                                                     | 3.9   |
| `dbg-perf`             | perf                        | count events with `perf_event_open(2)` and `perf stat`, and find a hot spot with a sampling profile (`perf record`, `perf report`)                                                     | `dbg-ftrace`, `proc-scheduler`                                   | 3.10  |
| `dbg-ebpf`             | eBPF                        | write a small eBPF program with a map, attach it to a tracepoint, read the map from user space, and fix a program the verifier rejects                                                 | `dbg-tracepoints`, `c-pointers-memory`                           | 3.11  |
| `sync-memory-ordering` | Memory ordering             | explain why compilers and CPUs reorder memory accesses, pass data without a lock with `READ_ONCE`/`WRITE_ONCE` and acquire/release, and say what x86 hides that arm64 shows            | `sync-atomics`, `proc-threads`                                   | 3.12  |
| `dbg-kcsan`            | Read a KCSAN report         | read a KCSAN data-race report (the two accesses, their contexts) and decide whether the race needs a fix or an annotation                                                              | `sync-memory-ordering`, `dbg-kasan`                              | 3.12  |
| `sync-rcu`             | RCU                         | convert a read-mostly list to RCU (readers under `rcu_read_lock()`, writers under a lock, frees after a grace period), and read an RCU stall warning                                   | `sync-memory-ordering`, `mem-object-lifetime`                    | 3.13  |
| `drv-platform-dt`      | A driver from a device tree | write a platform driver that binds through a `compatible` string, takes its registers and IRQ with `devm_` helpers, uses a subsystem class, and say how ACPI does the same on x86      | `drv-hardware-discovery`, `irq-handlers`, `drv-error-unwinding`  | 3.14  |
| `drv-pci`              | A PCI driver                | write a PCI driver: ID table, `probe`/`remove`, map a BAR, read and write registers, use an MSI interrupt, and move a device from one driver to another                                | `drv-platform-dt`, `mem-page-tables`                             | 3.15  |
| `io-vfs-filesystem`    | A filesystem of your own    | explain the VFS objects (superblock, inode, dentry, file) and the dentry cache, and write a tiny filesystem that mounts, lists and reads files                                         | `io-everything-is-a-file`, `drv-fops`, `sync-rcu`                | 3.16  |
| `io-page-cache`        | The page cache, deep        | explain page cache hits and misses, readahead, dirty pages and writeback, and predict when a `read()` touches the disk                                                                 | `io-vfs-filesystem`, `mem-page-faults`                           | 3.17  |
| `io-block-layer`       | A block driver              | write a blk-mq block driver and follow a `read()` from the page cache to a `bio`, a request and the driver's `queue_rq()`                                                              | `io-page-cache`, `drv-error-unwinding`                           | 3.17  |
| `net-napi`             | A network driver            | write a network driver's receive path: a `net_device`, `sk_buff`s built from a ring, and a NAPI poll that respects its budget                                                          | `drv-pci`, `irq-deferred-work`, `net-netfilter-hook`             | 3.18  |
| `net-xdp`              | XDP                         | write and attach an XDP program that parses headers within bounds and drops traffic before an `sk_buff` exists                                                                         | `net-napi`, `dbg-ebpf`                                           | 3.19  |
| `dbg-stall-diagnosis`  | Defeat the Stall            | diagnose a CPU stall from soft lockup and RCU stall reports with ftrace and BPF (and perf, if learned), and fix its cause                                                              | `dbg-lockups`, `sync-rcu`, `dbg-ebpf`, `net-napi`                | 3.20  |
| `dbg-kdump-crash`      | Read a dead Machine         | set up kdump, capture a vmcore, and find a hang's cause in it with `crash` (`log`, `ps`, `bt`, `struct`, `vtop`)                                                                       | `sys-kernel-cmdline`, `dbg-stall-diagnosis`, `mem-page-tables`   | 3.21  |
| `sync-wakeup-fix`      | No lost wake-ups            | fix a lost wake-up by replacing a hand-written check-then-sleep with `wait_event()` or a `completion`, and say why the order of "set state" and "check" matters                        | `dbg-kdump-crash`, `irq-wait-queues`                             | 3.21  |
| `kdev-kunit`           | Tests that stay             | write KUnit tests for driver logic with a fake device behind an ops table, run them with `kunit.py`, and send fixes as a series with their tests                                       | `kdev-patch`, `c-structs-fnptrs`                                 | 3.22  |

29 skills, four of them from side levels (`dbg-perf`, `io-page-cache`,
`io-block-layer`, `net-xdp`) that no required level needs. The boss grants
`dbg-stall-diagnosis` and assesses `dbg-lockups`, `sync-rcu`, `dbg-ftrace`,
`dbg-ebpf` and `net-napi` (and uses `dbg-perf` when the player has it); the finale grants
`dbg-kdump-crash` and `sync-wakeup-fix` and assesses `mem-page-tables`,
`proc-scheduler` and `sync-memory-ordering`.

| Level | Skill ids                                           |
| ----- | --------------------------------------------------- |
| 3.1   | `sys-boot-firmware`, `sys-kernel-cmdline`           |
| 3.2   | `sys-early-boot`, `sys-initramfs`                   |
| 3.3   | `mem-page-tables`                                   |
| 3.4   | `mem-page-faults`                                   |
| 3.5   | `mem-mmap`                                          |
| 3.6   | `proc-threads`                                      |
| 3.7   | `proc-scheduler`                                    |
| 3.8   | `proc-kthreads`, `dbg-lockups`                      |
| 3.9   | `dbg-ftrace`, `dbg-tracepoints`                     |
| 3.10† | `dbg-perf`                                          |
| 3.11  | `dbg-ebpf`                                          |
| 3.12  | `sync-memory-ordering`, `dbg-kcsan`                 |
| 3.13  | `sync-rcu`                                          |
| 3.14  | `drv-platform-dt`                                   |
| 3.15  | `drv-pci`                                           |
| 3.16  | `io-vfs-filesystem`                                 |
| 3.17† | `io-page-cache`, `io-block-layer`                   |
| 3.18  | `net-napi`                                          |
| 3.19† | `net-xdp`                                           |
| 3.20  | `dbg-stall-diagnosis` (and assesses the act)        |
| 3.21  | `dbg-kdump-crash`, `sync-wakeup-fix` (and assesses) |
| 3.22  | `kdev-kunit`                                        |

## X-ray views (new in Act III)

| View               | Shows                                                                                                                                   | Unlocked |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Boot (deepened)    | P.4's boot lanes, now in detail: firmware, loader, image, decompressor, `start_kernel()` stages, initcalls by level, PID 0, 1 and 2     | 3.1      |
| Virtual memory     | an address split into table indices, the walk from CR3, PTE flags, the TLB (3.3); VMAs and faults (3.4); a driver's mapping (3.5)       | 3.3      |
| Scheduler          | P.7's CPU lanes in depth: per-CPU run queues, each task's weight, lag and virtual deadline, every pick and preemption, the idle task    | 3.7      |
| Trace              | function graphs and trace events (3.9), perf samples as a flame graph (3.10), BPF programs, the verifier's walk and map contents (3.11) | 3.9      |
| Memory order       | per-CPU store buffers and the order each CPU sees writes in (3.12); RCU readers, grace periods and deferred frees (3.13)                | 3.12     |
| Buses              | the device tree or ACPI and the PCI tree, match then probe, a device's register window and interrupts                                   | 3.14     |
| Storage            | VFS objects and the dentry cache (3.16); the page cache, bios, requests and the block driver (3.17)                                     | 3.16     |
| Network (deepened) | a driver lane under Act I's view: the receive ring, the interrupt, the NAPI poll and its budget (3.18), XDP verdicts (3.19)             | 3.18     |
| Dump               | the frozen Machine from a vmcore: tasks and their states, stacks, structures and memory, as `crash` reads them                          | 3.21     |

Existing views keep working; Processes gains threads (3.6), Locks and timing gains
kernel threads (3.8). Every view keeps its plain-text transcript twin.
`level.yaml`'s `xray` list needs the new values `boot`, `vm`, `sched`, `trace`,
`order`, `buses`, `storage` and `dump` (`boot` is first used by the Prologue's P.4).
Trace's perf mode and Network's XDP verdicts come from side levels (3.10, 3.19).

## Codex chapters

The Codex has one chapter per region ([GAME.md](../GAME.md#the-codex)). Act III fills
eleven. Each level below lists its cards in teaching order, in the format every act
uses: a bullet with the term in bold and, in brackets, the card's id and any
`deepens:` ids; then a **Simple** line, a **Deep** text and an optional **Read**
line. Card ids are unique across the game. Cards from
side levels (†) stay blank outlines until that level is played.

| Chapter              | Levels    | Guide / real Linux                                | Cards, in teaching order                                                                                                                        |
| -------------------- | --------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| First Light          | 3.1–3.2   | the Loader, swapper / boot and early init         | `bzimage`, `efi-stub`, `kernel-params`, `crashkernel`; `start-kernel`, `idle-task`, `initcall-levels`, `switch-root`, `pid1-rules`              |
| Page-Table Labyrinth | 3.3–3.5   | the Walker / the MMU and the fault handler        | `page-table-walk`, `pte-flags`, `tlb`, `pagemap`; `page-fault`, `demand-paging`, `copy-on-write`, `huge-pages`; `vma`, `mmap`, `driver-mmap`    |
| Clockwork Court      | 3.6–3.8   | the Judge / the scheduler                         | `thread`, `clone-flags`, `futex`, `condition-variable`; `eevdf`, `nice-weights`, `sched-classes`; `kthread`, `preemption-models`, `soft-lockup` |
| Watchtower           | 3.9–3.11  | the Lookout, the Verifier / tracing               | `ftrace`, `trace-events`, `trace-event-macro`; † `perf-events`, `sampling-profile`; `ebpf`, `bpf-maps`, `bpf-verifier`                          |
| Grace Halls          | 3.12–3.13 | the Grace Keeper / memory ordering and RCU        | `memory-ordering`, `read-write-once`, `acquire-release`, `kcsan`; `rcu`, `grace-period`, `rcu-list`, `rcu-stall`                                |
| Bus Yards            | 3.14–3.15 | the Matchmaker / the driver core                  | `platform-driver`, `devm`, `dt-binding`, `acpi-hid`, `led-class`; `pci-driver`, `pci-bar`, `msi`, `driver-binding`, `dma`                       |
| Archive Stacks       | 3.16–3.17 | the Librarian / the VFS and the block layer       | `vfs-objects`, `dcache`, `file-system-type`; † `readahead`, `writeback`, `bio`, `blk-mq`                                                        |
| Packet Abyss         | 3.18–3.19 | the Harbormaster / the network data path          | `net-device`, `sk-buff-anatomy`, `napi`, `rx-ring`; † `xdp`, `packet-bounds`                                                                    |
| The Stall            | 3.20      | the Watchdog / lockup detection                   | `napi-budget`, `stall-triage`                                                                                                                   |
| Crash Archives       | 3.21      | the Second Kernel / kdump                         | `kdump`, `vmcore`, `crash-tool`, `lost-wakeup`, `completion`                                                                                    |
| Mainline             | 3.22      | the Maintainer / the upstream process (continued) | `kunit`, `patch-series`, `kexec-reboot`                                                                                                         |

Chains that cross acts: `bzimage` deepens `bootloader` (P.4); `efi-stub` deepens
`firmware` (P.4); `kernel-params` deepens `kernel-command-line` (P.4) and
`module-param` (2.3); `start-kernel` deepens `boot-sequence` (P.4);
`initcall-levels` deepens `initcalls` (P.4); `switch-root` deepens `initramfs`
(P.4); `pid1-rules` deepens `pid-1` (P.4); `page-table-walk` deepens
`virtual-memory` (P.8); `pagemap` deepens `proc-maps` (P.8); `copy-on-write`
deepens `address-space` (1.4); `vma` deepens `proc-maps`; `driver-mmap` deepens
`file-operations` (2.5); `thread` deepens `process` (P.7); `futex` deepens
`wait-queue` (2.10c); `eevdf` deepens `scheduler` (P.7); `kthread` deepens
`kernel-threads` (P.7); `soft-lockup` deepens `hung-task` (2.9); `trace-events`
deepens `strace` (1.5); `memory-ordering` deepens `race-condition` (2.9);
`read-write-once` deepens `atomic-counter` (2.11); `kcsan` deepens `kasan` (2.8b);
`rcu` deepens `stop-before-free` (2.12); `platform-driver` deepens `driver-model`
(P.6); `devm` deepens `goto-unwinding` (2.4); `dt-binding` deepens `device-tree`
(P.6); `acpi-hid` and `pci-driver` deepen `acpi-pci` (P.6); `pci-bar` deepens
`interrupts-mmio` (P.6); `vfs-objects` deepens `vfs` (P.9); `file-system-type`
deepens `filesystems` (P.9); `readahead` (3.17†) deepens `page-cache` (P.8);
`sk-buff-anatomy` deepens `sk-buff` (2.11); `net-device` deepens `network-stack`
(P.9); `napi` deepens `softirq` (2.10a); `xdp` deepens `netfilter-hook` (2.11);
`kdump` deepens `crashkernel` (3.1) and `pstore-ramoops` (2.12); `lost-wakeup`
deepens `wait-queue`; `patch-series` deepens `submitting-patches` (2.13);
`kexec-reboot` deepens `kdump`. Within the act: `packet-bounds` deepens
`bpf-verifier`; `napi-budget` deepens `napi`; `rcu-stall` deepens `soft-lockup`.

## Boss and finale designs

Both follow the level loop and teach no new mechanism. The boss assesses the act's
live tools; the finale introduces one tool (`crash`) and one fix pattern, the way
Act II's finale introduced the KASAN fix.

### The Stall (3.20)

- **What it is:** the old `lantern_card` driver's NAPI poll drains the light link's
  receive ring in a loop with no budget. Under the Storm (the flood that starts at
  the end of 3.18), the ring
  never empties, so `net_rx_action()` never returns on CPU 1. The CPU never reaches
  the scheduler (a soft lockup) and never reports a quiescent state (an RCU stall).
- **Phase 1, the freeze:** the Storm reaches the everyday kernel. `harbor` stops
  answering; one CPU shows 100% softirq. After (compressed) time, the real reports
  print: `watchdog: BUG: soft lockup - CPU#1 stuck for 22s!` and `rcu: INFO:
  rcu_preempt self-detected stall on CPU`. The lab restores the snapshot.
- **Phase 2, the evidence:** the player uses the Watchtower on a replay: ftrace's
  function_graph (3.9) shows `lantern_link_poll()` entered and never left; a BPF
  program on the `napi:napi_poll` tracepoint (3.11) counts **zero** events for
  `link0` during the freeze, because the event fires only when a poll returns;
  `softnet_stat` (3.18) shows CPU 1's `time_squeeze` frozen. A player who took the
  optional 3.10 can also run `perf top`, which puts `lantern_rx_one` and
  `lantern_link_poll` at the top; the boss is solvable without it.
- **Phase 3, the fix:** respect the budget (3.18): stop at `budget`, return the
  work done, and only complete NAPI and re-enable the interrupt when the ring is
  drained. Under the Storm the CPU now hands the excess to `ksoftirqd`, which the
  Judge schedules fairly (3.7), so `harbor` keeps answering.

### The Second Kernel (3.21)

- **What it is:** at "dusk" a work item runs the old driver's calibration: it
  writes a command to the card, checks a `cmd_done` flag, and if it isn't set,
  sets its task state and calls `schedule()`. The card's completion interrupt sets
  the flag and wakes the task. If the interrupt lands between the check and the
  state change, the wake-up finds a running task and does nothing; the worker then
  sleeps forever in `D` state, holding the card's command mutex.
- **Phase 1, the hang:** this time the Machine doesn't come back. `lanternctl`
  queues behind the mutex. After 120 (compressed) seconds the hung-task detector
  reports, and with `hung_task_panic` set the kernel panics. The reserved memory's
  capture kernel (the Second Kernel) boots, saves `/proc/vmcore`, and the Machine
  reboots.
- **Phase 2, the dump:** the player opens the vmcore with `crash`: the panic,
  the log, the blocked tasks, their stacks, the mutex's owner, and the device
  struct, whose `cmd_done` is **already true**. The wake came before the sleep.
- **Phase 3, the fix:** a `completion` (or `wait_event()`), re-armed before the
  command is sent, with a timeout. The forced interleaving and 100 others run
  clean; the dusk calibration finishes every time.

## Taint

Act III uses Act II's severities and rules (latest completion only, capped at 10 per
level, hints never add Taint, failed attempts and oopses never add Taint). New severe
(5-point) events: a KCSAN report, an RCU-lockdep splat ("suspicious RCU usage"), a
soft lockup, an RCU stall or a hung task during the checker run, and a NAPI budget
warning. BPF programs the verifier rejects add nothing: they never ran.

**Act III's ending.** One Taint ending per act: Act III's own total (Acts I and II
don't count) tints the epilogue's final scene ([GAME.md](../GAME.md#taint-meter)).

| Act III total | Final scene                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------- |
| 0–9           | **Steady:** the warm start into the fixed kernel is seamless; the Watchdog has nothing to count |
| 10–29         | **Watchful:** the Machine runs, and the Watchdog keeps one eye open                             |
| 30+           | **The Stall lingers:** the Machine runs, with an occasional hiccup                              |

As in Act II, a hack in the boss or finale fix (an XDP drop instead of a budget, a
timeout loop instead of a completion) caps the ending at the middle one, whatever
the total. Side levels count toward the total like any other level.

---

## 3.1 — First Light: the Loader

- **Id:** `act3-first-light-01-the-loader` · **Region / NPC:** First Light / the Loader (the bootloader), the Watchdog, init, the Second Kernel (introduced, silent) · **Tracks:** `kernel` · **Time:** ~15 min · **Prerequisites:** `sys-boot-chain`, `kdev-config-build`, `drv-module-params` · **Skills unlocked:** `sys-boot-firmware`, `sys-kernel-cmdline`
- **Starter:** partial · **X-ray:** Boot (P.4's view, deepened), Modules and devices

### Scene

The reboot that closed Mainline plays out. The Deep comes up lit, lamp by lamp.

> **The Watchdog:** Clean. First clean boot since the Kernelfall. Enjoy it.
>
> **The Watchdog:** Because something's wrong. Four times since the reboot, the
> Machine froze. Every CPU but one kept going; that one went silent for twenty
> seconds, then woke up as if nothing happened. Always in the evening, when the
> harbor's busy.
>
> **init:** Nothing in pstore?
>
> **The Watchdog:** Nothing crashed. pstore only keeps the dead. The Dangling broke
> things. This one just… stops.
>
> **init:** The Stall, then. And it's below the Deep. Where the Machine starts.
>
> **The Loader:** Then start with me. I'm the bootloader. The firmware hands me the
> Machine, I hand it a kernel, an initramfs and one line of words. That line is
> the first thing the kernel ever hears from anyone.
>
> **The Watchdog:** If the Machine dies again, I want all of it. Not a tail in
> pstore. Every byte.
>
> **The Loader:** Then we wake the other one. A second kernel, loaded now, sleeping
> in memory the first kernel promises never to touch. If the first one dies, the
> second one boots and writes the whole corpse to disk. You reserve its room on the
> command line.

### See it (X-ray)

**Boot view (unlocked here):** two power-ons side by side, each a strip of stages.

- **BIOS (legacy):** firmware runs the 446 bytes of code in the disk's first sector
  (the MBR), which loads GRUB's core image from the gap after it (or, on GPT, a BIOS
  boot partition). GRUB reads `grub.cfg` and loads `vmlinuz` using the **x86 boot
  protocol**: the image's real-mode setup code runs first, switches to protected
  and then 64-bit mode, and the **decompressor** unpacks the kernel and jumps to
  `startup_64`.
- **UEFI (the Machine):** firmware reads its NVRAM boot entries, runs
  `\EFI\debian\shimx64.efi` from the FAT EFI system partition (signed, for Secure
  Boot), which runs GRUB, which loads `vmlinuz`. The same `vmlinuz` is also a PE/COFF
  program (the **EFI stub**): firmware could run it directly. The stub gets the
  firmware's memory map, leaves boot services (`ExitBootServices()`), and enters the
  decompressor. From `startup_64` on, both paths are the same: `x86_64_start_kernel()`
  → `start_kernel()`.

```
ksh$ file /boot/vmlinuz-6.18.0
/boot/vmlinuz-6.18.0: Linux kernel x86 boot executable, bzImage, version 6.18.0 (...) #1 SMP PREEMPT_DYNAMIC ..., RO-rootFS, Normal VGA
ksh$ xxd -l 2 /boot/vmlinuz-6.18.0
00000000: 4d5a                                     MZ
```

(`MZ` is the PE header that makes the image an EFI program. `file`'s exact wording
depends on its version (verify).)

The view then opens what the loader hands over in `struct boot_params` (the "zero
page"): where the initramfs is, the memory map, the command line. The command line
is parsed in three passes: **early parameters** (`early_param()`: `mem=`, `quiet`,
`loglevel=`) while memory is still being set up, when `setup_arch()` also reads
`crashkernel=` straight from the line to reserve its region; **`__setup()`**
parameters (`init=`, `rdinit=`) and **built-in module parameters** (`lantern.brightness=`)
in `parse_args()`; anything left over, without a dot, goes to init as an environment
variable (`name=value`) or an argument. GRUB's own `BOOT_IMAGE=` is one of those.

### Build it

Starter (partial): the Machine's `/etc/default/grub` and `/etc/default/kdump-tools`
open in the editor, and the Lantern's module tree from Act II.

1. **The command line, for good.** Add `crashkernel=128M lantern.brightness=200` to
   `GRUB_CMDLINE_LINUX_DEFAULT` and run `update-grub`. (A one-boot `e` edit from P.4
   works once and is gone on the next boot; the checker reboots twice.)
2. **The Lantern, installed.** `make modules_install` and `depmod -a`, so `modprobe
   lantern` can find it by name.
3. **The Second Kernel, loaded.** After the reboot, `kdump-config load` loads the
   capture kernel into the reserved region with `kexec -p`; `kdump-config show`
   reports it ready.

Checker verifies (behavior):
- After two reboots, `/proc/cmdline` contains `crashkernel=128M` and
  `lantern.brightness=200`; `grub.cfg` was regenerated, not edited by hand.
- `/proc/iomem` shows a `Crash kernel` region of 128 MiB, and
  `/sys/kernel/kexec_crash_size` reads `134217728`.
- `/sys/kernel/kexec_crash_loaded` reads `1`.
- `modprobe lantern` gives `/sys/module/lantern/parameters/brightness` = `200`
  with no option on the `modprobe` line; `insmod lantern.ko` gives the default
  (re-tests 2.3: the parameter and its permissions).
- The Lantern still passes Act II's smoke test through `ksh-lite` (`echo`, `cat`,
  `lanternctl`).

### Watch it

**Predict:** the command line says `lantern.brightness=200`. The player loads the
Lantern twice, once with `insmod lantern.ko`, once with `modprobe lantern`. Which one
glows at 200? (Only `modprobe`: it reads `/proc/cmdline` and passes `lantern.*`
options itself. `insmod` passes only what you type. A built-in Lantern would get it
from the kernel's own parser; that's 3.2.)

The boot stair lights up from the bottom, step by step, and the Lantern comes up at
200. The boot log, abridged:

```
[    0.000000] Linux version 6.18.0 (...) #1 SMP PREEMPT_DYNAMIC ...
[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.18.0 root=/dev/vda2 ro quiet crashkernel=128M lantern.brightness=200
[    0.000000] crashkernel reserved: 0x0000000017000000 - 0x000000001f000000 (128 MB)
[    0.041512] Kernel command line: BOOT_IMAGE=/boot/vmlinuz-6.18.0 root=/dev/vda2 ro quiet crashkernel=128M lantern.brightness=200
[    0.041602] Unknown kernel command line parameters "BOOT_IMAGE=/boot/vmlinuz-6.18.0", will be passed to user space.
ksh$ grep -i crash /proc/iomem
  17000000-1effffff : Crash kernel
ksh$ cat /sys/kernel/kexec_crash_loaded
1
```

(The reservation message's wording follows the generic crashkernel code
(`kernel/crash_reserve.c`) (verify for x86 in 6.18); the address is the lab's.
`lantern.brightness` isn't "unknown": parameters with a dot are left for modules.)

The Second Kernel appears for a moment in the reserved room, curled up, and goes
quiet.

### Debrief

> **The Loader:** That's my part done. Image, initramfs, words. From here the kernel
> is on its own.
>
> **init:** On its own until I start. What happens in between?
>
> **swapper** (a small voice from the furnace): Me. Everything before you was me.

Next: Before PID 1 (3.2).

### Hints

1. **Nudge:** The command line you edit by hand at the GRUB menu is gone after one
   boot. Where does GRUB's menu come from?
2. **Concept:** `update-grub` writes `/boot/grub/grub.cfg` from `/etc/default/grub`.
   Parameters with a dot (`module.param=`) are for modules: built-in ones get them
   from the kernel, loadable ones from `modprobe`, which reads `/proc/cmdline`.
3. **Point at the spot:** `GRUB_CMDLINE_LINUX_DEFAULT` in `/etc/default/grub`, then
   `update-grub`, then load with `modprobe`, not `insmod`.

### Codex (chapter: First Light)

- **The kernel image** (`bzimage`, deepens: `bootloader`)
  - **Simple:** `vmlinuz` is a small loader and a compressed kernel in one file.
  - **Deep:** An x86 bzImage holds real-mode setup code (with the boot protocol
    header the bootloader fills in) and a compressed kernel; the decompressor unpacks
    it and jumps to `startup_64`, then `x86_64_start_kernel()` calls
    `start_kernel()`. The loader passes the command line, the initramfs location and
    the memory map in `struct boot_params`. — https://docs.kernel.org/arch/x86/boot.html
    — `arch/x86/boot/header.S`, `arch/x86/boot/compressed/`,
    `arch/x86/kernel/head_64.S`, `arch/x86/kernel/head64.c`
- **The EFI stub and Secure Boot** (`efi-stub`, deepens: `firmware`)
  - **Simple:** The kernel image is also a UEFI program, so firmware can start it.
  - **Deep:** With `CONFIG_EFI_STUB` the image carries a PE/COFF header (`MZ`);
    the stub reads the initramfs, gets the memory map, calls `ExitBootServices()`
    and enters the kernel. Secure Boot runs only signed binaries: a Microsoft-signed
    `shim` checks the distribution's GRUB and kernel; a kernel booted that way runs
    in lockdown, which also restricts `kexec` to signed images. —
    https://docs.kernel.org/admin-guide/efi-stub.html — `drivers/firmware/efi/libstub/`
- **How the command line is parsed** (`kernel-params`, deepens: `kernel-command-line`)
  - **Simple:** The kernel reads its words in passes: very early ones, normal ones,
    module ones, and the rest goes to init.
  - **Deep:** `early_param()` handlers run from `parse_early_param()` during
    `setup_arch()`; `__setup()` handlers and built-in module parameters run from
    `parse_args()` in `start_kernel()`; unknown words without a dot become init's
    arguments or environment. `modprobe` adds `module.param=` options from
    `/proc/cmdline` when it loads a module. —
    https://docs.kernel.org/admin-guide/kernel-parameters.html — `init/main.c`,
    `kernel/params.c`, `include/linux/init.h`
- **crashkernel and kexec** (`crashkernel`)
  - **Simple:** Memory set aside for a second kernel that boots only if the first
    one dies.
  - **Deep:** `crashkernel=size` (or a range form like `1G-4G:192M`) reserves a
    region at boot (`/proc/iomem`: `Crash kernel`). `kexec -p` (`kexec_load` or,
    with signatures, `kexec_file_load`) loads the capture kernel and its initramfs
    there; on panic, `__crash_kexec()` jumps into it without going back through
    firmware. `/sys/kernel/kexec_crash_loaded` says whether one is loaded. —
    https://docs.kernel.org/admin-guide/kdump/kdump.html — `kernel/crash_reserve.c`,
    `kernel/kexec_core.c`, `kernel/crash_core.c`

### Real-world card

```sh
cat /proc/cmdline
file /boot/vmlinuz-$(uname -r)
mokutil --sb-state                      # Secure Boot on or off
sudo grep -i crash /proc/iomem          # empty unless crashkernel= is set
cat /sys/kernel/kexec_crash_loaded
# Debian/Ubuntu: kdump-tools sets crashkernel= and loads the capture kernel
sudo apt install kdump-tools && sudo reboot
kdump-config show
# Fedora/RHEL: kdumpctl status; change parameters with grubby --update-kernel=ALL --args=...
```

Try it in a VM first: a wrong command line can leave a machine unbootable (P.4's
`e` edit at the GRUB menu is the way back).

### Taint

- Editing `/boot/grub/grub.cfg` by hand instead of `/etc/default/grub`: +3, it is
  overwritten by the next `update-grub` (the same lesson as 2.1's `autoconf.h`).
- A `crashkernel=` that takes half the Machine's 512 MiB: +1; the capture kernel
  needs a small fraction.
- Setting the brightness by editing the module's default in the source instead of
  the command line: +1, the level is about configuring a kernel you don't rebuild.

### Fidelity

**Faithful:** BIOS and UEFI paths, the bzImage layout and `MZ` header, the order of
command-line passes, the unknown-parameter message and `BOOT_IMAGE`, `modprobe`
reading `/proc/cmdline`, `crashkernel=` syntax, `/proc/iomem` and the `kexec` sysfs
files.
**Simplified:** firmware, shim and GRUB are scripted drawings with real text; no
decompression runs; `kdump-config` is a subset of Debian's tool; the capture kernel
is loaded as a token and first boots in 3.21. SIMPLIFIED: the reservation address is
the lab's, and the lab doesn't check that 128 MiB is enough for a real capture
kernel (on real machines size it with the distribution's guidance).

### Lab needs

The Prologue's boot model plus: `/etc/default/grub` and `update-grub` regenerating
`grub.cfg`; persistent vs one-boot command lines; the three parsing passes with
`early_param`/`__setup`/module parameters; `modprobe` reading `/proc/cmdline`,
`modules_install` and `depmod`; a crashkernel reservation shown in `/proc/iomem`,
`/sys/kernel/kexec_crash_{loaded,size}`; `kdump-config load|show`; `file` and `xxd`
on the kernel image; the Boot view's two strips.

---

## 3.2 — First Light: before PID 1

- **Id:** `act3-first-light-02-before-pid-1` · **Region / NPC:** First Light / swapper (PID 0), init, the Loader · **Tracks:** `kernel`, `userland` · **Time:** ~20 min · **Prerequisites:** `sys-kernel-cmdline`, `drv-module-lifecycle`, `proc-lifecycle`, `sys-errno` · **Skills unlocked:** `sys-early-boot`, `sys-initramfs`
- **Starter:** partial (a new program) · **X-ray:** Boot, Processes

### Scene

> **swapper:** I'm PID 0. Nobody lists me in `ps`. I was the only task on the boot
> CPU when the kernel started: I ran `start_kernel()`, every line of it.
>
> **init:** And then?
>
> **swapper:** Then I made two children. You, PID 1, to become the first user
> program. And kthreadd, PID 2, to give birth to every kernel thread. And then I
> sat down. I'm the idle loop now. When nobody else can run, I run.
>
> **init:** I never knew I had a parent.
>
> **swapper:** You were a kernel thread for a while, too. You ran every driver's
> start-up call, one level at a time. Then you went looking for a program to
> become. In the initramfs first.
>
> **init:** The Machine's `/init` is a generated script nobody reads. Write your own.
> In C. And whatever happens, it must never exit.
>
> **swapper:** If PID 1 dies, so does the Machine.

### See it (X-ray)

**Boot view, zoomed into the kernel:** `start_kernel()` as a strip of named calls
(abridged, in `init/main.c`'s order (verify against 6.18)): `setup_arch()` (memory
map, early page tables, ACPI tables, the crash reservation), `parse_early_param()`,
`mm_core_init()`, `sched_init()`, `rcu_init()`, `init_IRQ()`, `time_init()`,
`console_init()`, … `rest_init()`. In `rest_init()` the boot task creates
`kernel_init` (PID 1) and `kthreadd` (PID 2), then enters `cpu_startup_entry()`: it
is now `swapper/0`, the idle task.

Then PID 1's side (`kernel_init()`): `do_basic_setup()` runs the **initcalls**, level
by level (`pure`, `core`, `postcore`, `arch`, `subsys`, `fs`, `rootfs`, `device`,
`late`). The `rootfs` level unpacks the initramfs. Kernel memory marked `__init` is
freed. Then `run_init_process("/init")`: PID 1 calls `execve` and stops being a
kernel thread.

**Processes view:** `ps -o pid,ppid,comm -p 1,2` shows both with parent 0.

### Build it

**Beat 1: the Lantern, built in.** In the (simulated) source tree the player adds
`drivers/misc/lantern/` with their Lantern, a `Kconfig` entry (`config LANTERN`,
`tristate "The Lantern"`, help text) sourced from `drivers/misc/Kconfig`, and
`obj-$(CONFIG_LANTERN) += lantern/` in `drivers/misc/Makefile`; then sets
`CONFIG_LANTERN=y`, rebuilds and boots with `initcall_debug`. `module_init()` now
means `device_initcall()`; the brightness comes from the kernel's own parser.

**Beat 2: your own `/init`.** Starter (partial): `init.c` with `main()` and empty
helpers, a `Makefile` that links it statically, and a script stub that packs a
directory into a cpio archive. The player writes:

- mount `proc` on `/proc`, `sysfs` on `/sys`, `devtmpfs` on `/dev`, checking every
  return value and logging each step to `/dev/kmsg` (so the lines appear in `dmesg`,
  the way init's lines always have);
- find `root=` in `/proc/cmdline` and mount it read-only on `/root`;
- hand over: `chdir("/root")`, `mount(".", "/", NULL, MS_MOVE, NULL)`,
  `chroot(".")`, `chdir("/")`, then `execv("/sbin/init", argv)`. (Real
  `switch_root` also deletes the initramfs files first to free their memory.)
- on any failure: log it and `execv()` the player's `ksh-lite` as a rescue shell.
  Never `return` from `main()`.

They pack it (`find . | cpio -o -H newc | gzip`) and point a boot entry's `initrd`
line at it.

Checker verifies (behavior):
- With `initcall_debug`, the log has `calling  lantern_init+0x0/...` and `initcall
  lantern_init+0x0/... returned 0`, before `Run /init as init process`;
  `/sys/module/lantern/parameters/brightness` is 200 and `lsmod` doesn't list
  `lantern` (it's built in).
- The Machine boots through the player's `/init`: their `/dev/kmsg` lines appear,
  PID 1's `/proc/1/exe` ends up as `/sbin/init`, `/` is `/dev/vda2`.
- Fault injection: `root=` names a missing disk, then a mount fails with `EBUSY`:
  each time PID 1 logs the error and becomes the rescue `ksh-lite`; it never exits
  (re-tests 1.4's `exec` and errno checks).
- `ksh-lite` as PID 1 runs commands (re-tests Act I's shell).

### Watch it

**Predict:** in the boot log, which comes first: `lantern_init` returning, or `Run
/init as init process`? (`lantern_init`: device initcalls run in PID 1 while it is
still a kernel thread, before it executes any program.)

**Crash on purpose (guided):** a scratch `/init` that returns from `main()`. The
Machine panics: `Kernel panic - not syncing: Attempted to kill init!
exitcode=0x00000000`. The snapshot restores.

The Lantern glows before init does. The boot log, abridged:

```
[    0.913204] calling  lantern_init+0x0/0x90 @ 1
[    0.913377] lantern: the Lantern is lit. Hello from the Deep.
[    0.913391] initcall lantern_init+0x0/0x90 returned 0 after 168 usecs
[    1.204410] Freeing unused kernel image (initmem) memory: 2648K
[    1.204982] Run /init as init process
[    1.215103] init: mounted /proc /sys /dev
[    1.233870] init: root /dev/vda2 mounted, switching
```

### Debrief

> **init:** I've been PID 1 my whole life and never seen my own door. Thank you.
>
> **swapper:** One more thing. Before I ran a single line of C, the CPU was already
> translating every address. The early page tables. Ask the Walker.
>
> **The Watchdog:** Somewhere down there. Fine.

Next: the Page-Table Labyrinth (3.3).

### Hints

1. **Nudge:** PID 1 is special: if it ends, the kernel has no one to hand the
   Machine to. What should your `/init` do when something goes wrong?
2. **Concept:** After the initramfs, the real root has to _become_ `/`. Move the new
   root's mount onto `/`, change root into it, then `exec` the real init: `exec`
   keeps PID 1, so the Machine's init is still PID 1.
3. **Point at the spot:** Look at the end of `main()`: after the `execv()` of
   `/sbin/init`, the only thing that may follow is the rescue path.

### Codex (chapter: First Light)

- **start_kernel()** (`start-kernel`, deepens: `boot-sequence`)
  - **Simple:** The kernel's first C function: it sets up every part, in order.
  - **Deep:** Runs on the boot CPU with interrupts off: `setup_arch()`,
    `mm_core_init()`, `sched_init()`, `rcu_init()`, `init_IRQ()`, `time_init()`,
    `console_init()` and many more, then `rest_init()`. Other CPUs start later, from
    PID 1 (`smp_init()`). — https://docs.kernel.org/admin-guide/kernel-parameters.html
    — `init/main.c`, `arch/x86/kernel/setup.c`
- **The idle task** (`idle-task`)
  - **Simple:** PID 0, `swapper`: the boot task, then the loop a CPU runs when it
    has nothing else to do.
  - **Deep:** `init_task` runs `start_kernel()`; `rest_init()` makes PID 1 and 2 and
    then calls `cpu_startup_entry()`. Each CPU has its own idle task (`swapper/N`),
    which is why an oops in an interrupt on an idle CPU says `Comm: swapper/1`. —
    `init/main.c` (`rest_init()`), `kernel/sched/idle.c`, `init/init_task.c`
- **Initcall levels** (`initcall-levels`, deepens: `initcalls`)
  - **Simple:** Built-in start-up functions run in nine ordered groups.
  - **Deep:** `pure`, `core`, `postcore`, `arch`, `subsys`, `fs`, `rootfs`,
    `device` (`module_init()` in built-in code) and `late`, each with a `_sync`
    variant; `early_initcall()` runs before other CPUs start. A failing initcall is
    logged and boot continues. `initcall_debug` prints each call and its time;
    `initcall_blacklist=` skips one. — `include/linux/init.h`, `init/main.c`
    (`do_initcalls()`, `do_one_initcall()`)
- **switch_root** (`switch-root`, deepens: `initramfs`)
  - **Simple:** How the initramfs hands the Machine to the real root filesystem.
  - **Deep:** The initramfs lives in the initial rootfs (tmpfs or ramfs), which
    can't be unmounted or `pivot_root`ed, so `/init` deletes its files, moves the
    new root onto `/` (`MS_MOVE`), `chroot`s into it and `exec`s the real init.
    BusyBox `switch_root` and klibc's `run-init` do exactly this. —
    https://docs.kernel.org/filesystems/ramfs-rootfs-initramfs.html —
    `init/initramfs.c`, `init/do_mounts.c`
- **Rules for PID 1** (`pid1-rules`, deepens: `pid-1`)
  - **Simple:** PID 1 must never exit, and it ignores signals it doesn't handle.
  - **Deep:** If PID 1 exits, the kernel panics ("Attempted to kill init!").
    The kernel won't deliver signals to init that it has no handler for (even
    `SIGKILL` from inside its namespace), and orphans are re-parented to it (or to a
    "subreaper"), so it must reap them. — man 2 `kill`, man 2 `prctl`
    (`PR_SET_CHILD_SUBREAPER`) — `kernel/exit.c`, `kernel/signal.c`

### Real-world card

```sh
ps -o pid,ppid,comm -p 1,2                  # both children of PID 0
lsinitramfs /boot/initrd.img-$(uname -r) | head   # Debian/Ubuntu (Fedora: lsinitrd)
# Boot your own initramfs in QEMU, no disk needed:
(cd initramfs && find . | cpio -o -H newc) | gzip > my-initrd.img
qemu-system-x86_64 -kernel arch/x86/boot/bzImage -initrd my-initrd.img \
  -append "console=ttyS0 initcall_debug" -nographic
# Watch start_kernel() in a debugger: add -s -S to QEMU, then
gdb vmlinux -ex 'target remote :1234' -ex 'break start_kernel' -ex continue
```

With `CONFIG_GDB_SCRIPTS`, `lx-dmesg` in gdb prints the kernel log from memory.

### Taint

- A failure path in `/init` that returns or calls `exit()`: +5 (the fault-injection
  run panics the Machine).
- A `mount()` whose return value isn't checked: +3.
- Leaving the initramfs files in memory before the switch: +1 (real tools free them).
- A dynamically linked `/init`: it doesn't fail in the lab (everything is static)
  but the level flags it, +1: an initramfs carries no libraries unless you put them
  there.

### Fidelity

**Faithful:** PID 0, 1 and 2 and their roles; initcall levels and the
`initcall_debug` message formats; `Freeing unused kernel image`, `Run /init as init
process` and the "Attempted to kill init!" panic; cpio `newc`; the `MS_MOVE`,
`chroot`, `exec` hand-over; built-in module parameters in `/sys/module`.
**Simplified:** the lab names a selection of `start_kernel()`'s calls in the right
order instead of running them; the kernel "rebuild" is simulated; the lab's
initramfs holds only the player's files. SIMPLIFIED: other CPUs come up in one step.

### Lab needs

Boot view stages for `start_kernel()`, `rest_init()` and initcall levels with real
function names; `initcall_debug` output for the Machine's built-in drivers plus the
built-in Lantern; a simulated in-tree build of `drivers/misc/lantern` from `Kconfig`
and `Makefile` edits; `cpio` (`-o -H newc`) and `gzip`; booting with a player
initramfs; `mount` (proc, sysfs, devtmpfs, ext4, `MS_MOVE`, `MS_RDONLY`), `chroot`,
`/dev/kmsg` writes from PID 1; PID 1 exit → the real panic; `ksh-lite` as PID 1.

---

## 3.3 — Page-Table Labyrinth: the walk

- **Id:** `act3-page-table-labyrinth-03-the-walk` · **Region / NPC:** Page-Table Labyrinth / the Walker (the MMU's page-table walker), init · **Tracks:** `kernel`, `c` · **Time:** ~18 min · **Prerequisites:** `mem-address-spaces`, `mem-virtual-memory-basics`, `c-bit-flags`, `sys-early-boot` · **Skills unlocked:** `mem-page-tables`
- **Starter:** partial (a new program, `lens`) · **X-ray:** Virtual memory (new)

### Scene

> **The Walker:** Every address your programs use is made up. I make it real.
> Every load, every store, every instruction fetch.
>
> **init:** All of them? That must take forever.
>
> **The Walker:** Four lookups, worst case. The address is a set of directions:
> nine bits for each floor of the Labyrinth, twelve for the step inside the room.
> The CPU keeps a notebook of recent answers, the TLB, so mostly I don't walk at
> all.
>
> **init:** And the kernel?
>
> **The Walker:** Writes the maps. I only read them. If a map says "nothing here",
> I stop and call the kernel. That's tomorrow's lesson.
>
> **The Watchdog:** You built X-ray views for all of this. On a real machine there's
> no X-ray.
>
> **init:** Then build one. A small one. Call it `lens`.

### See it (X-ray)

**Virtual memory view (unlocked here):** a stack address from `ksh-lite`,
`0x7ffd5e3a2b10`, splits into five fields:

```
bits   47..39   38..30   29..21   20..12   11..0
       PGD 255  PUD 501  PMD 241  PTE 418  offset 0xb10
```

The walk starts at **CR3** (the physical address of this process's top table),
reads entry 255 of the PGD, follows it to a PUD page, entry 501, a PMD page, entry
241, a page of PTEs, entry 418: a **page frame number**. The physical address is the
frame's address plus the offset. Each step shows the entry's bits: present, writable,
user, accessed, dirty, no-execute. The same address is translated again: the
**TLB** answers at once. A context switch to another process loads a different CR3
(x86 tags TLB entries with a PCID so not everything is thrown away).

Then: the kernel's half (addresses starting `0xffff...`) is the same in every
process; a 2 MiB **huge page** stops the walk one level early (the PMD entry has the
page-size bit); and on CPUs with LA57 a fifth level (P4D) adds nine more bits. On the
Machine the P4D level is folded into the PGD.

### Build it

Starter (partial): `lens.c` with a command table (1.2's pattern), argument parsing
and a `walk` subcommand stub; a `Makefile`. The player writes `lens walk <pid>
<addr>`:

- split the address into the four indices and the offset with shifts and masks
  (1.6's bit flags);
- read the 8-byte entry for that page from `/proc/<pid>/pagemap` with `pread()` at
  offset `(addr / page_size) * 8`, page size from `sysconf(_SC_PAGESIZE)`;
- decode it: bit 63 present, bit 62 swapped, bit 61 file page or shared anonymous,
  bit 56 exclusively mapped, bits 0–54 the PFN; print the physical address;
- handle every case: not present, not a user address, a short read, and PFN 0 when
  not running as root (the kernel hides PFNs from processes without
  `CAP_SYS_ADMIN`).

Checker verifies (behavior):
- For a stack, heap, code and an untouched `malloc` address in a test process,
  `lens walk` prints the same indices, flags and physical address as the lab's own
  page tables.
- An address beyond the user half, and an unmapped one, are reported, not crashed on.
- Run as uid 1000 (S.2 callback), `lens` says the PFN is hidden instead of printing
  physical address 0.
- `lens` builds with no warnings (re-tests 1.3) and checks every syscall's return.

### Watch it

**Predict:** the TLB is empty. How many memory reads does the CPU make to load one
byte from `0x7ffd5e3a2b10`? (Five: four table entries, then the byte. With a 2 MiB
page, four.)

```
ksh$ lens walk 412 0x7ffd5e3a2b10
va 0x7ffd5e3a2b10  pgd 255  pud 501  pmd 241  pte 418  offset 0xb10
pagemap 0x810000000001a2b3  present exclusive  pfn 0x1a2b3
pa 0x1a2b3b10
```

The first corridor of the Labyrinth lights up, floor by floor, as the walk passes
through it.

### Debrief

> **The Walker:** You walked it. Now ask me about the empty rooms. A `malloc` of
> 64 MiB and not one page behind it.
>
> **init:** That can't be right.
>
> **The Walker:** It's how memory gets made. Touch it and see.

Next: Fault Lines (3.4).

### Hints

1. **Nudge:** The address is a set of directions. Which bits pick the entry on each
   floor?
2. **Concept:** Each level uses 9 bits (512 entries of 8 bytes in a 4 KiB table),
   from bit 47 down to bit 12; the low 12 bits are the offset. `pagemap` holds one
   64-bit entry per virtual page, in order.
3. **Point at the spot:** The PTE index is `(addr >> 12) & 0x1ff`; the `pagemap`
   offset is the virtual page number times 8, not the address itself.

### Codex (chapter: Page-Table Labyrinth)

- **The page-table walk** (`page-table-walk`, deepens: `virtual-memory`)
  - **Simple:** The CPU turns a made-up address into a real one by looking it up in
    four tables.
  - **Deep:** x86-64 with 4-level paging: PGD, PUD, PMD, PTE, 9 bits each, 48-bit
    addresses; with LA57, a P4D level and 57 bits. The kernel's helpers mirror the
    levels (`pgd_offset()`, `p4d_offset()`, `pud_offset()`, `pmd_offset()`,
    `pte_offset_map()`); on 4-level machines `p4d` is folded. —
    https://docs.kernel.org/mm/page_tables.html — `arch/x86/include/asm/pgtable_types.h`,
    `include/linux/pgtable.h`, `mm/pagewalk.c`
- **PTE flags** (`pte-flags`)
  - **Simple:** Each entry says if the page is there and what you may do with it.
  - **Deep:** Present, R/W, U/S (user may access), Accessed and Dirty (set by the
    CPU), PS (huge page, at PMD or PUD level), NX (bit 63, no execute). A write to a
    read-only present page, or any access to a non-present one, is a page fault. —
    `arch/x86/include/asm/pgtable_types.h`
- **The TLB** (`tlb`)
  - **Simple:** The CPU's notebook of recent translations.
  - **Deep:** A hit skips the walk. Changing a mapping requires flushing stale
    entries (`invlpg`, or a full flush; on other CPUs, an IPI "TLB shootdown");
    PCIDs let x86 keep entries of several address spaces. With KPTI (the oops's
    `PTI`/`NOPTI`), each process has a second, user-only set of tables. —
    https://docs.kernel.org/arch/x86/tlb.html — `arch/x86/mm/tlb.c`
- **/proc/pid/pagemap** (`pagemap`, deepens: `proc-maps`)
  - **Simple:** A file with one entry per page of a process: is it there, and where.
  - **Deep:** 64 bits per virtual page: present, swapped, file or shared, exclusive,
    soft-dirty, PFN. PFNs read as zero without `CAP_SYS_ADMIN` (since 4.2), because
    physical addresses help attacks such as Rowhammer. —
    https://docs.kernel.org/admin-guide/mm/pagemap.html — `fs/proc/task_mmu.c`

### Real-world card

```sh
make lens && sudo ./lens walk $$ 0x$(grep stack /proc/$$/maps | cut -d- -f1)
grep PageTables /proc/meminfo                # memory spent on page tables
grep -o -m1 la57 /proc/cpuinfo || echo "4-level paging"
# With CONFIG_PTDUMP_DEBUGFS (a debug kernel):
sudo cat /sys/kernel/debug/page_tables/current_user | head
```

### Taint

- An unchecked `pread()` (or ignoring a short read): +3.
- Reading `pagemap` from the start with `read()` up to the wanted entry: +1 (it is
  sparse and enormous; `pread()` at the offset).
- A hard-coded page size of 4096: +1.

### Fidelity

**Faithful:** the 4-level layout and index bits, PTE flags, huge-page early stop,
the `pagemap` format and its `CAP_SYS_ADMIN` rule, CR3 and PCID as described.
**Simplified:** SIMPLIFIED: the lab's MMU is a model of the tables, not a CPU; the
TLB is a small model with hit and miss events; PFNs and table addresses are the
lab's; KPTI's second table set is described, not modeled.

### Lab needs

Real per-process 4-level page tables in the lab's memory model (PTE bits P, RW, US,
A, D, PS, NX; a CR3 per task; a frame allocator with PFNs); `/proc/<pid>/pagemap`
with the privilege rule; a TLB model; the Virtual memory view with the walk
animation and its transcript. This replaces Act I's "copy memory on `fork`"
shortcut from here on (see 3.4).

---

## 3.4 — Page-Table Labyrinth: fault lines

- **Id:** `act3-page-table-labyrinth-04-fault-lines` · **Region / NPC:** Page-Table Labyrinth / the Walker, kswapd (cameo), init · **Tracks:** `kernel`, `userland` · **Time:** ~15 min · **Prerequisites:** `mem-page-tables`, `proc-lifecycle` · **Skills unlocked:** `mem-page-faults`
- **Starter:** stub · **X-ray:** Virtual memory (VMAs and faults), Syscalls

### Scene

> **The Walker:** When I find nothing, I don't guess. I stop the instruction and
> raise a page fault. The kernel looks at what _should_ be there.
>
> **init:** And if nothing should?
>
> **The Walker:** Then it's a real error: `SIGSEGV`. Your Compiler's Quarter knows
> that one. But mostly the answer is "something should be here, it just isn't yet".
> The kernel makes the page, fixes the map, and the instruction runs again as if
> nothing happened.
>
> **kswapd** (from the Mines): And sometimes it's not there because it's on disk.
> Those are the slow ones.
>
> **init:** And `fork`? Act I said parent and child get copies.
>
> **The Walker:** They get the _promise_ of copies. Nobody copies until somebody
> writes.

### See it (X-ray)

**Virtual memory view, faults lane:** a program `malloc`s 64 MiB: one `mmap` call,
one new VMA, zero pages. It writes the first byte: fault → `exc_page_fault()` →
`do_user_addr_fault()` → the VMA is found (under its per-VMA lock) →
`handle_mm_fault()` → `do_anonymous_page()` → a zeroed page, a new PTE → the
instruction runs again. A **read** of untouched memory instead maps the shared
**zero page**, read-only; the first write to it faults again and gets a real page.

Then `fork`: `copy_page_range()` marks every private writable page **read-only in
both** processes and shares the frames. The child writes one byte: a write fault on
a read-only page → `do_wp_page()` → the frame is shared, so it is copied for the
child. The parent writes next: its page is now its own, so it is simply made
writable again. One copy, not 64 MiB.

Last: a file page that isn't in the page cache. The fault reads it from disk
(`filemap_fault()`): a **major** fault. Everything else above was **minor**.

### Build it

Starter (stub): `lens` from 3.3 with an unwired `faults` entry in its command table;
test programs `touch64` (writes every page of 64 MiB) and `cowdemo` (forks, the child
writes one page) in the Machine's `/usr/local/bin`.

The player writes `lens faults -- <command> [args]`: `fork`, `execvp` the command in
the child, `wait4()` for it with a `struct rusage`, and print its minor and major
fault counts (`ru_minflt`, `ru_majflt`) and exit status. Then they run the
experiments from command chips, using `lens walk` from 3.3 on `cowdemo`'s parent and
child.

Checker verifies (behavior):
- `lens faults -- touch64` prints the lab's counts exactly; `touch64 --populate`
  (which maps with `MAP_POPULATE`) shows almost none; `touch64 --huge` (which asks
  for transparent huge pages with `madvise`) shows about 32 (verify alignment
  behavior in 6.18).
- After `echo 1 > /proc/sys/vm/drop_caches`, `lens faults -- mapcat bigfile` (which
  maps the file) shows major faults, and `lens faults -- cat bigfile` shows none:
  `cat` uses `read()`, and a page cache miss inside `read()` is I/O, not a fault
  (3.17 follows that path).
- On `cowdemo`, `lens walk` shows the same PFN in parent and child before the write
  and different PFNs after, with the parent's unchanged.
- `lens` reaps its child and returns the child's exit status (re-tests 1.4).

### Watch it

**Predict:** `touch64` writes one byte in every 4 KiB page of 64 MiB. How many
page faults? (16384, plus a few dozen for the program itself. Each first write
makes one page.) Then: after `fork`, the child writes to one page of the 64 MiB.
How many pages are copied? (One.)

```
ksh$ lens faults -- touch64
exit 0  minor 16412  major 0
ksh$ lens faults -- touch64 --populate
exit 0  minor 28  major 0
ksh$ cowdemo
parent pfn 0x2b114  child pfn 0x2b114     (before the child writes)
parent pfn 0x2b114  child pfn 0x31f02     (after)
```

The Labyrinth's empty rooms fill with light one at a time as they're touched.

### Debrief

> **The Walker:** Memory isn't given. It's made on touch, and shared until someone
> writes.
>
> **init:** The Lantern's state is read by half the city, a `read()` at a time.
> Could they just… look at it, the way the child looks at the parent's pages?
>
> **The Walker:** If the Lantern gives them a room to look into. Map it.

Next: The Light Map (3.5).

### Hints

1. **Nudge:** The child's faults belong to the child. How does a parent learn
   what its child used?
2. **Concept:** `wait4()` (and `getrusage(RUSAGE_CHILDREN)`) report a finished
   child's resource use, including `ru_minflt` (faults served from memory) and
   `ru_majflt` (faults that needed I/O).
3. **Point at the spot:** Pass a `struct rusage *` as the last argument of the
   `wait4()` in your `faults` command, then print its two fault fields.

### Codex (chapter: Page-Table Labyrinth)

- **Page faults** (`page-fault`, deepens: `page-table-walk`)
  - **Simple:** The CPU's call for help when a translation is missing or forbidden.
  - **Deep:** x86 raises exception 14 with the address in CR2 and an error code
    (read/write, user/kernel, present). `exc_page_fault()` → `do_user_addr_fault()`
    finds the VMA (per-VMA lock under RCU first, `mmap_lock` as the fallback) and
    calls `handle_mm_fault()`; no VMA or wrong permissions → `SIGSEGV`. Faults are
    traced as `exceptions:page_fault_user`. — https://docs.kernel.org/mm/process_addrs.html
    — `arch/x86/mm/fault.c`, `mm/memory.c`
- **Demand paging** (`demand-paging`)
  - **Simple:** Pages are made when first touched, not when memory is asked for.
  - **Deep:** `do_anonymous_page()` maps a zeroed page on first write, the shared
    zero page on first read; file pages come from the page cache (`filemap_fault()`),
    reading from disk on a miss (a major fault). `MAP_POPULATE` and `mlock()`
    pre-fault. — man 2 `mmap`, man 2 `getrusage` — `mm/memory.c`, `mm/filemap.c`
- **Copy-on-write** (`copy-on-write`, deepens: `address-space`)
  - **Simple:** After `fork`, parent and child share pages until one of them writes.
  - **Deep:** `copy_page_range()` write-protects private pages in both; a write
    fault runs `do_wp_page()`, which reuses the page if it is now exclusively mapped
    (anon-exclusive) or copies it (`wp_page_copy()`). This is why `fork` of a huge
    process is cheap and why `vfork`/`posix_spawn` exist anyway. —
    `kernel/fork.c` (`dup_mmap()`), `mm/memory.c`
- **Huge pages** (`huge-pages`)
  - **Simple:** 2 MiB pages: one fault and one TLB entry instead of 512.
  - **Deep:** Transparent huge pages (`/sys/kernel/mm/transparent_hugepage/enabled`:
    `always`, `madvise`, `never`) map 2 MiB at the PMD level when the range is
    aligned; `khugepaged` collapses small pages later. hugetlbfs reserves them
    explicitly. — https://docs.kernel.org/admin-guide/mm/transhuge.html —
    `mm/huge_memory.c`, `mm/khugepaged.c`

### Real-world card

```sh
/usr/bin/time -v ./touch64 2>&1 | grep -i 'page faults'
perf stat -e page-faults,minor-faults,major-faults ./touch64
cat /sys/kernel/mm/transparent_hugepage/enabled
sudo bpftrace -e 'tracepoint:exceptions:page_fault_user { @[comm] = count(); }'
```

### Taint

- `lens faults` leaves a zombie or ignores `wait4()` failing: +3.
- Reporting the parent's own `getrusage(RUSAGE_SELF)` as the child's: the numbers
  are wrong, so the checker fails; no Taint.
- `cowdemo`-style measurements with `sleep()` to "let the copy happen": +1; the copy
  happens inside the faulting write, synchronously.

### Fidelity

**Faithful:** the fault path's functions, demand paging, the zero page, copy-on-write
with exclusive reuse, minor vs major faults and the `rusage` fields, THP modes,
`MAP_POPULATE`, `SIGSEGV` on a bad access.
**Simplified:** SIMPLIFIED: there is no swap in the lab (kswapd's major faults come
only from files); the per-VMA lock and its `mmap_lock` fallback are one step; fault
costs aren't modeled; fault counts for program start-up are the lab's (a real dynamic
binary faults far more).

### Lab needs

Copy-on-write `fork` with shared frames, reference counts and write-protect bits
(replacing the Act I/II copy); demand-zero and zero-page faults; file-backed faults
through the page cache with `drop_caches`; `MAP_POPULATE`; a THP model for
`madvise(MADV_HUGEPAGE)` (`always`/`madvise`/`never` in sysfs, `madvise` by
default); `wait4` with `rusage`; the `exceptions:page_fault_user` event in X-ray; the
`touch64`, `cowdemo` and `mapcat` programs.

---

## 3.5 — Page-Table Labyrinth: the light map

- **Id:** `act3-page-table-labyrinth-05-the-light-map` · **Region / NPC:** Page-Table Labyrinth / the Walker, init · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `mem-page-faults`, `drv-fops`, `mem-object-lifetime`, `drv-ioctl` · **Skills unlocked:** `mem-mmap`
- **Starter:** stub · **X-ray:** Virtual memory, Modules and devices

### Scene

> **init:** Half the city checks the Lantern every second. A `read()` each time,
> through the Gate and back.
>
> **The Walker:** The kernel already does better for the clock. Every process has a
> page called the vDSO: the time is just there, readable, no Gate.
>
> **init:** Can the Lantern have one?
>
> **The Walker:** A page of its own, mapped into whoever asks. Read-only. Your
> driver says what's behind the map, and I'll call it the first time someone
> looks.
>
> **The Watchdog:** And when the Lantern unloads while the city's still looking?
>
> **The Walker:** It can't. A mapping holds the file open, and the file holds the
> module. Check.

### See it (X-ray)

**Virtual memory view:** `cat /proc/<pid>/maps` for `lanternctl`, one line per VMA:
code, data, heap, stack, `[vvar]`, `[vdso]`. A `clock_gettime()` call shows no
syscall at all: it reads the vDSO's data page. Then `mmap()` adds a VMA for
`/dev/lantern`, with no page behind it. The first read faults; for an anonymous VMA
the kernel would make a page, for a file the page cache supplies one, and for a
device it asks the driver: `vma->vm_ops->fault()`. The driver hands back its page;
the PTE now points at the Lantern's memory.

### Build it

Starter (stub): an unwired `lantern_mmap()` prototype and a `lanternctl watch`
subcommand stub. The player adds:

- a light map page: `ldev->lightmap = (void *)get_zeroed_page(GFP_KERNEL)` at init
  (2.4's `goto` unwinding on failure), `free_page()` at exit; the driver writes the
  brightness, colour, message count and the newest message's glow into it with
  `WRITE_ONCE()` whenever they change;
- `.mmap = lantern_mmap` in the Lantern's `file_operations`: refuse an offset other
  than 0 or a size over one page (`-EINVAL`), refuse a writable shared mapping
  (`-EPERM`) and clear `VM_MAYWRITE` so `mprotect()` can't add write later; set
  `VM_DONTEXPAND | VM_DONTDUMP` with `vm_flags_set()`; set `vma->vm_ops` and
  `vma->vm_private_data = ldev`;
- `lantern_vm_fault(struct vm_fault *vmf)`: take a reference on the page with
  `get_page()`, put it in `vmf->page`, return `0`; anything past the first page is
  `VM_FAULT_SIGBUS`;
- `lanternctl watch`: `mmap(NULL, page_size, PROT_READ, MAP_SHARED, fd, 0)`, then
  print the brightness whenever it changes, with no `read()`.

(6.17+ also offers `f_op->mmap_prepare`, which sets up the mapping before the VMA
exists; `.mmap` remains supported (verify the 6.18 guidance for new drivers).)

Checker verifies (behavior):
- `lanternctl watch` reports every change made by `lanternctl set` (2.6's `ioctl`)
  and by writes from `ksh-lite`, and `strace` shows no `read()` in its loop.
- `lens faults` (3.4) on a watcher that reads the map 1000 times shows one fault
  for the Lantern's page.
- `mmap` with `PROT_WRITE` and `MAP_SHARED` fails with `EPERM`; a later
  `mprotect(PROT_WRITE)` fails with `EACCES`; offset 4096 fails with `EINVAL`.
- `rmmod lantern` while a watcher runs fails with "Module lantern is in use"; after
  the watcher exits, `rmmod` succeeds, KASAN and kmemleak are quiet.

### Watch it

**Predict:** `lanternctl watch` reads the map a thousand times. How many page faults,
and how many syscalls into the Lantern? (One fault, on the first read; zero
syscalls after `mmap`.)

```
ksh$ lanternctl watch &
ksh$ lanternctl set 120
brightness 120
ksh$ grep lantern /proc/$(pidof lanternctl)/maps
7f3a2c000000-7f3a2c001000 r--s 00000000 00:06 412   /dev/lantern
```

(`r--s`: readable, shared. Device numbers and the inode are the lab's.)

Every window in the Labyrinth that looks onto the Lantern now shows its light
directly.

### Debrief

> **The Walker:** One page, a hundred readers, no Gate. That's the Labyrinth.
>
> **init:** A hundred readers, and the harbor writing its log, and the Lantern
> blinking. Who decides who runs?
>
> **The Watchdog:** Ask the Court. And ask them about CPU 1.

Next: the Clockwork Court (3.6).

### Hints

1. **Nudge:** `mmap()` on your device doesn't map anything yet. What does the
   kernel need from your driver when a page is touched for the first time?
2. **Concept:** A driver's `mmap` checks the request and installs `vm_ops`; the
   `fault` handler returns the page for `vmf->pgoff` with a reference taken, and the
   kernel puts it in the page table.
3. **Point at the spot:** In `lantern_vm_fault()`: `virt_to_page(ldev->lightmap)`,
   `get_page()`, then assign `vmf->page`. And in `lantern_mmap()`, check `VM_WRITE`
   before anything else.

### Codex (chapter: Page-Table Labyrinth)

- **VMAs** (`vma`, deepens: `proc-maps`)
  - **Simple:** A process's memory is a list of regions; each line of `maps` is one.
  - **Deep:** `struct vm_area_struct`: start, end, flags (`VM_READ`, `VM_WRITE`,
    `VM_SHARED`, `VM_MAYWRITE`…), the file and offset, and `vm_ops`. They live in a
    maple tree in the `mm_struct`; flags change through `vm_flags_set()` and
    friends. — https://docs.kernel.org/mm/process_addrs.html — `include/linux/mm_types.h`,
    `mm/mmap.c`, `mm/vma.c`
- **mmap(2)** (`mmap`)
  - **Simple:** Ask for memory, or put a file or device into your address space.
  - **Deep:** Anonymous or file-backed, private (copy-on-write) or shared. Pages
    arrive on fault. The vDSO is the kernel's own read-only shared page (`[vdso]`,
    `[vvar]`), which is why `clock_gettime()` needs no syscall. — man 2 `mmap`, man 7
    `vdso` — `mm/mmap.c`, `arch/x86/entry/vdso/`
- **A driver's mmap** (`driver-mmap`, deepens: `file-operations`)
  - **Simple:** A driver can let programs read its memory directly.
  - **Deep:** `file_operations.mmap` validates the VMA and sets `vm_ops`; a `fault`
    handler returns a referenced page (`vmf->page`), or the driver maps everything at
    once with `vm_insert_page()` or, for device memory, `remap_pfn_range()`. Map
    whole pages from the page allocator, never part of a `kmalloc` object. An open
    mapping holds the file, so the module can't unload under it. Several fields
    read together need a sequence counter (`seqcount_t`) to be consistent. — LDD3
    chapter 15 (APIs have changed) — `include/linux/mm.h`, `mm/memory.c`

### Real-world card

```sh
cat /proc/self/maps
grep -E 'vdso|vvar' /proc/self/maps
strace -e trace=mmap,munmap,read ./lanternctl watch
git grep -n 'struct vm_operations_struct' drivers/ | head   # real drivers that map memory
```

### Taint

- Allowing a writable shared mapping of driver state: +5.
- Mapping part of a `kmalloc()` buffer: +3 (not page-aligned, shares a page with
  other objects).
- Missing `get_page()` in the fault handler: +5 (the page's count underflows when
  the mapping goes away; the lab reports "BUG: Bad page state").
- No `VM_DONTEXPAND`: +1 (`mremap()` could grow the mapping past the page).

### Fidelity

**Faithful:** `/proc/<pid>/maps` format, VMA flags, `vm_flags_set()`, the fault
handler contract, `VM_MAYWRITE` and `mprotect`'s `EACCES`, the module reference held
by a mapping, the vDSO.
**Simplified:** one page only; SIMPLIFIED: the light map's fields are read without a
sequence counter (each is one byte, and the Codex says what to do for more).

### Lab needs

`mmap`/`munmap`/`mprotect` on character devices with `file_operations.mmap`,
`vm_operations_struct.fault`, `vm_flags_set()`; `get_zeroed_page`/`free_page`;
page reference counts with a "Bad page state" report; the vDSO and `[vvar]` in
`maps`; module references held by open mappings; `lanternctl watch`.

---

## 3.6 — Clockwork Court: many hands

- **Id:** `act3-clockwork-court-06-many-hands` · **Region / NPC:** Clockwork Court / the Judge (the scheduler), the Harbormaster (cameo), init · **Tracks:** `userland`, `c` · **Time:** ~15 min · **Prerequisites:** `proc-lifecycle`, `sync-mutex`, `net-poll`, `proc-signals` · **Skills unlocked:** `proc-threads`
- **Starter:** stub (in `harbor`) · **X-ray:** Processes (threads), Syscalls, Locks and timing

### Scene

> **The Harbormaster:** Your harbor writes every message to its log. The Archive's
> disk is slow, and while harbor writes, every client waits.
>
> **The Judge:** Then give it a second pair of hands. A thread.
>
> **init:** A second process?
>
> **The Judge:** To me there are only tasks. A thread is a task that shares
> everything with its siblings: the memory, the open files, the signal handlers.
> Its own stack, its own registers, its own number. Your process ID is really the
> group's ID.
>
> **The Watchdog:** Two tasks, one memory. I've seen how that goes.
>
> **The Judge:** So has your Lock Cathedral. Same rules, user-space tools.

### See it (X-ray)

**Processes view, threads:** `pthread_create()` → glibc-style `clone3()` with
`CLONE_VM | CLONE_FS | CLONE_FILES | CLONE_SIGHAND | CLONE_THREAD | CLONE_SYSVSEM |
CLONE_SETTLS | CLONE_PARENT_SETTID | CLONE_CHILD_CLEARTID`. Two `task_struct`s now
point at one `mm_struct` and one fd table; each has its own TID and stack (an
`mmap`ed region), and both report the same `getpid()`. `/proc/<pid>/task/` lists
both.

**Locks and timing view:** an uncontended `pthread_mutex_lock()` is one atomic
instruction in user space, no syscall. Contended, the loser calls
`futex(FUTEX_WAIT_PRIVATE)` and sleeps on a kernel wait queue (2.10c's shape); the
unlocker calls `futex(FUTEX_WAKE_PRIVATE)`. A condition variable is the same pair
around a "has anything changed?" check.

### Build it

Starter (stub): `harbor` from 1.10, plus an unwired `archive_start()` prototype and
a `harbor.log` path option. The player adds an **archiver thread**:

- a bounded queue of 64 messages, protected by a `pthread_mutex_t`, with condition
  variables `not_empty` and `not_full`;
- the poll loop pushes every broadcast message (waiting on `not_full` if the
  archiver falls behind); the archiver waits on `not_empty` in a `while` loop, pops,
  unlocks, then `write()`s to `harbor.log` outside the lock;
- `SIGINT` blocked with `pthread_sigmask()` before the thread starts, so the main
  thread's 1.8 handler gets Ctrl-C; on shutdown the main thread sets `closing` under
  the mutex, broadcasts, and `pthread_join()`s the archiver after it drains the
  queue.

Checker verifies (behavior):
- 3 `nc` clients and 200 messages: every message reaches every client and appears
  in `harbor.log` exactly once, in order.
- With the lab's slow disk, chat replies still arrive within the lab's latency bound
  while log writes lag behind.
- The lab's race detector reports no data race on the queue (a first version without
  the mutex is caught here).
- Ctrl-C: `harbor` drains the queue, joins the archiver and exits 0 (re-tests 1.8);
  `ps -L` showed two threads while it ran; `strace -f` shows `clone3` and `futex`.

### Watch it

**Predict:** the archiver hits an error and calls `exit(1)`. What happens to the
main thread, still serving clients? (It dies too: `exit()` is `exit_group`, which
ends every thread in the group. A thread that should stop alone returns from its
function or calls `pthread_exit()`.)

```
ksh$ harbor &
ksh$ ls /proc/$(pidof harbor)/task
533  534
ksh$ strace -f -e trace=clone3,futex harbor
clone3({flags=CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_THREAD|CLONE_SYSVSEM|CLONE_SETTLS|CLONE_PARENT_SETTID|CLONE_CHILD_CLEARTID, ...}, 88) = 534
[pid   534] futex(0x5581c0e2a0c8, FUTEX_WAIT_PRIVATE, 0, NULL <unfinished ...>
```

(`strace` output abridged; addresses and the struct size are the lab's.) The Court's
clock gains a second hand that never stops the first.

### Debrief

> **The Judge:** Two hands, one harbor. And now I have one more task to seat.
>
> **init:** How do you choose? Everyone wants the CPU.
>
> **The Judge:** I keep the books. Come watch me rule.

Next: The Judge (3.7).

### Hints

1. **Nudge:** Two threads touch the queue. What stops them touching it at the same
   moment, and how does the archiver wait without spinning?
2. **Concept:** A condition variable is always used with its mutex: lock, `while`
   the condition is false `pthread_cond_wait()`, act, unlock. Wake-ups can be
   spurious, so the check is a loop.
3. **Point at the spot:** The archiver's wait: `while (q.count == 0 && !q.closing)`,
   and the `write()` after the unlock, not before.

### Codex (chapter: Clockwork Court)

- **Threads** (`thread`, deepens: `process`)
  - **Simple:** Tasks that share one program's memory and files.
  - **Deep:** Each thread is a `task_struct` with its own TID; `CLONE_THREAD` puts it
    in its leader's thread group (the TGID is what `getpid()` returns), `CLONE_VM`
    shares the `mm`. Signals to the process go to any thread that doesn't block
    them; `exit_group` ends them all. — man 7 `pthreads`, man 2 `clone` —
    `kernel/fork.c` (`copy_process()`), `kernel/exit.c`
- **clone flags** (`clone-flags`)
  - **Simple:** `fork`, threads and containers are the same call with different
    flags.
  - **Deep:** `clone3()` takes a `struct clone_args`: `CLONE_VM`, `CLONE_FILES`,
    `CLONE_SIGHAND`, `CLONE_THREAD` for threads; nothing shared for `fork`;
    `CLONE_NEW*` for namespaces. glibc 2.34+ uses `clone3` for `pthread_create`. —
    man 2 `clone3` — `kernel/fork.c` (`kernel_clone()`)
- **futex** (`futex`, deepens: `wait-queue`)
  - **Simple:** Locks that cost nothing until two threads collide.
  - **Deep:** The fast path is an atomic in user memory; only on contention does
    `futex(FUTEX_WAIT)` put the thread on a kernel wait queue hashed by address, and
    `FUTEX_WAKE` wakes it. `_PRIVATE` skips the cross-process lookup. Newer calls
    (`futex_waitv`, `futex_wait`, `futex_wake`) exist; glibc still uses `futex()`
    (verify for current glibc). — man 2 `futex` — `kernel/futex/`
- **Condition variables** (`condition-variable`)
  - **Simple:** "Sleep until something changes," always paired with a mutex.
  - **Deep:** `pthread_cond_wait()` unlocks, sleeps (a futex), relocks. Waits may
    wake spuriously, so the condition is re-checked in a loop. `signal` wakes one,
    `broadcast` all. — man 3 `pthread_cond_wait` — glibc `nptl/`

### Real-world card

```sh
ps -eLf | head                       # one line per thread (LWP = TID)
ls /proc/$(pidof harbor)/task
strace -f -e trace=clone3,futex ./harbor
gcc -g -fsanitize=thread -pthread harbor.c -o harbor-tsan && ./harbor-tsan   # ThreadSanitizer
```

### Taint

- A data race the lab detects on shared state: +5.
- `pthread_cond_wait()` under an `if` instead of a `while`: +3.
- `write()` to the log while holding the queue mutex: +1 (correct, but the poll loop
  waits for the disk again).
- Locking a mutex in the signal handler: +5 (not async-signal-safe; 1.8).
- No `pthread_join()` at shutdown: +1.

### Fidelity

**Faithful:** `clone3` flags, TID and TGID, `/proc/<pid>/task`, the futex fast path
and syscalls, condition variable semantics including spurious wake-ups, signal
delivery to a thread that doesn't block it, `exit_group`.
**Simplified:** the lab's libc has a small pthreads subset (default attributes,
mutexes, condition variables, `pthread_sigmask`, no cancellation). SIMPLIFIED: the
race detector is the lab's own, with ThreadSanitizer's report shape; thread stacks
have a fixed size.

### Lab needs

Threads in the interpreter: `clone3` with shared linear memory, per-thread stacks
and TLS, TIDs and thread groups; `futex` wait and wake (private), `exit_group`;
pthreads in the lab's libc (create, join, mutex, condition variable, `sigmask`);
`/proc/<pid>/task`, `ps -L`; a happens-before race detector over shared memory; a
slow simulated disk for `write`; threads in the Processes view.

---

## 3.7 — Clockwork Court: the Judge

- **Id:** `act3-clockwork-court-07-the-judge` · **Region / NPC:** Clockwork Court / the Judge, swapper (cameo), the Watchdog · **Tracks:** `kernel`, `userland` · **Time:** ~18 min · **Prerequisites:** `proc-threads`, `proc-process-basics` · **Skills unlocked:** `proc-scheduler`
- **Starter:** stub (in `lens`) · **X-ray:** Scheduler (new)

### Scene

> **The Judge:** Each CPU has its own court and its own queue of tasks ready to
> run. I pick one, let it run a little, pick again.
>
> **init:** Fairly?
>
> **The Judge:** By weight. Nice 0 weighs 1024. Each step of nice is about a
> quarter less, or more. I keep each task's books: what it has had, against what it
> was owed. A task that's owed time is _eligible_. Among the eligible, I pick the
> one whose deadline comes first. That's EEVDF: earliest eligible virtual deadline
> first.
>
> **init:** And the harbor, who mostly sleeps?
>
> **The Judge:** Wakes up owed, with an early deadline. It gets in fast. That's the
> point.
>
> **The Watchdog:** Then tell them about CPU 1.
>
> **The Judge:** Some evenings CPU 1 stops coming to court. Twenty seconds. Nobody
> runs there, not even swapper. Something sits on it and never comes back to me.

### See it (X-ray)

**Scheduler view (unlocked here):** CPU 1's run queue, with two `spin` programs
(nice 0 and nice 5) and `harbor`. A timeline shows each task's **virtual runtime**
(real runtime scaled by 1024/weight, so the nice 5 task's grows about 3× faster), the
queue's weighted average **V**, each task's **lag** (how far behind V it is, weighted)
and **virtual deadline** (virtual runtime plus its slice scaled by weight). At each
pick, the eligible tasks (lag ≥ 0) light up and the earliest deadline wins. When
`harbor` wakes for a message, it is eligible with an early deadline, and the Judge
preempts the running hog: the reply goes out in well under a millisecond.

Then the classes, highest first: stop, deadline (`SCHED_DEADLINE`), real-time
(`SCHED_FIFO`, `SCHED_RR`), fair (`SCHED_NORMAL`, `SCHED_BATCH`, `SCHED_IDLE`, run
by EEVDF), `sched_ext` (BPF schedulers, 6.12+), and idle (swapper). A real-time
task always beats a fair one, which is why a runaway one is dangerous.

### Build it

Starter (stub): `lens` with an unwired `sched` entry and a `spin` program (a CPU
loop) in `/usr/local/bin`. The player writes `lens sched -n <nice> [-n <nice>]… --
<command>`:

- start one child per nice value; in each, before `exec`, pin it to CPU 1 with
  `sched_setaffinity()` and set its nice with `setpriority(PRIO_PROCESS, 0, nice)`;
- let them run for a fixed time (`-t`, default 10 s of lab time), then read each
  child's `/proc/<pid>/schedstat` (time on CPU and time waiting, in nanoseconds,
  and the number of slices);
- print each child's weight, CPU time, wait time and share; then kill and reap them.

Checker verifies (behavior):
- For nice 0/5, 0/0/10 and -5/0 (as root), `lens sched` prints shares that match the
  lab's accounting to 0.1% and the weight ratios to 1%.
- Children are pinned (without affinity, two hogs on two CPUs each get a whole CPU
  and the shares are meaningless; the checker's run catches it).
- No zombies are left (re-tests 1.4); `setpriority()` errors are reported.
- With two hogs running, `harbor`'s replies (3.6) stay within the lab's latency
  bound.

### Watch it

**Predict:** two `spin` programs on one CPU, nice 0 and nice 5. What share does each
get? (About 75% and 25%: weights 1024 and 335.)

```
ksh$ lens sched -n 0 -n 5 -- spin
pid  nice  weight  cpu_ms  wait_ms  share
611     0    1024    7533     2467  75.3%
612     5     335    2467     7533  24.7%
```

The Court's clock settles into a steady rhythm; the Judge's ledger balances.

### Debrief

> **The Judge:** User tasks are easy. They sleep, they wake, they come back to me.
> The kernel's own workers are the ones to watch.
>
> **init:** The Lantern has none. It blinks on a timer.
>
> **The Judge:** A timer can't sleep. Some day the Lantern will want to. Ask
> kthreadd for a thread.

Next: The Pulse (3.8).

### Hints

1. **Nudge:** Your two hogs got 100% each. How many CPUs did they run on?
2. **Concept:** Shares are only shared on one run queue. Pin the children with
   `sched_setaffinity()` to the same CPU before they `exec`; nice is per task and
   also survives `exec`.
3. **Point at the spot:** In the child, between `fork()` and `execvp()`: set the
   CPU mask with `CPU_ZERO`/`CPU_SET(1, …)`, then `setpriority()`.

### Codex (chapter: Clockwork Court)

- **EEVDF** (`eevdf`, deepens: `scheduler`)
  - **Simple:** The default scheduler since 6.6: run the task that's owed time and
    whose deadline comes first.
  - **Deep:** Each fair task has a weight, a virtual runtime, a lag (owed or owing
    service, against the queue's weighted average) and a virtual deadline (virtual
    runtime + slice/weight). Only tasks with lag ≥ 0 are eligible; the earliest
    deadline runs. A woken task keeps its lag, so sleepers get in quickly without
    special heuristics. Base slice 0.75 ms, scaled with the number of CPUs (verify),
    and a task may ask for its own slice with `sched_setattr()` (6.12+, verify). —
    https://docs.kernel.org/scheduler/sched-eevdf.html — `kernel/sched/fair.c`
    (`pick_eevdf()`), `kernel/sched/core.c` (`__schedule()`)
- **Nice and weights** (`nice-weights`)
  - **Simple:** Nice is a request for a smaller (or bigger) share, not a priority
    order.
  - **Deep:** `sched_prio_to_weight[]`: nice 0 = 1024, each step about 1.25×, nice
    -20 = 88761, nice 19 = 15. Shares are weight over total weight on one run queue.
    With autogroup (`/proc/sys/kernel/sched_autogroup_enabled`), each session is a
    group, so nice only divides time inside it; cgroups do the same with
    `cpu.weight`. — man 7 `sched` — `kernel/sched/core.c`, `kernel/sched/autogroup.c`
- **Scheduling classes** (`sched-classes`)
  - **Simple:** Real-time tasks always run before normal ones; idle runs last.
  - **Deep:** stop > deadline > RT > fair > ext > idle; `chrt` sets RT policies,
    `sched_setattr()` deadline ones. `sched_ext` lets a BPF program be the scheduler.
    RT throttling keeps 5% for others by default (`sched_rt_runtime_us`), now done
    by the fair server (6.12+, verify). — https://docs.kernel.org/scheduler/sched-ext.html
    — `kernel/sched/{rt,deadline,ext,idle}.c`

### Real-world card

```sh
taskset -c 1 ./spin & taskset -c 1 nice -n 5 ./spin &
top -p $(pgrep -d, spin)            # about 75% and 25%
cat /proc/$(pgrep -n spin)/sched | head -20
cat /proc/$(pgrep -n spin)/schedstat
cat /proc/sys/kernel/sched_autogroup_enabled
sudo perf sched record -- sleep 2 && sudo perf sched latency | head
```

### Taint

- Leaving the hogs running after `lens sched` exits: +3.
- Waiting with a busy loop instead of `sleep()`/`nanosleep()`: +1 (your measuring
  tool steals the CPU it measures).
- Ignoring `nice()`/`setpriority()` errors: +1 (`nice()` can return -1 on success,
  so check `errno`).

### Fidelity

**Faithful:** the weight table, EEVDF's eligibility and deadline rule, wake-up
preemption for sleepers, `schedstat`'s three fields, affinity and nice semantics,
the class order, autogroup's effect on nice.
**Simplified:** SIMPLIFIED: the lab runs an exact EEVDF model per CPU with no load
balancing while tasks are pinned, no cgroups, and time advances in the lab's own
steps; slice lengths follow 6.18's defaults (verify).

### Lab needs

An EEVDF model per CPU (weights, vruntime, average V, lag, deadlines, wake-up
preemption) with deterministic picks; `sched_setaffinity`, `setpriority`, `nice`;
`/proc/<pid>/sched` and `/proc/<pid>/schedstat`; the `spin` program; `perf sched`
output as an optional transcript; the Scheduler view.

---

## 3.8 — Clockwork Court: the pulse

- **Id:** `act3-clockwork-court-08-the-pulse` · **Region / NPC:** Clockwork Court / kthreadd (PID 2), the Judge, the Watchdog · **Tracks:** `kernel`, `debug` · **Time:** ~15 min · **Prerequisites:** `proc-scheduler`, `irq-wait-queues`, `sync-spinlocks`, `irq-timers` · **Skills unlocked:** `proc-kthreads`, `dbg-lockups`
- **Starter:** blank · **X-ray:** Scheduler, Locks and timing

### Scene

> **kthreadd:** Every bracketed name in `ps` is my child. `[ksoftirqd/0]`,
> `[kswapd0]`, the kworkers. Ask, and I'll make you one.
>
> **init:** The Lantern should breathe: brighten and dim, slowly, all night. Each
> step takes `msg_lock`.
>
> **The Judge:** A mutex. Then not in a timer: a timer runs in softirq and must not
> sleep. A kernel thread is a task like any other. It can sleep, and I schedule it
> like the harbor.
>
> **The Watchdog:** And if it never sleeps?
>
> **The Judge:** On this Machine, kernel code gives the CPU back only where it
> sleeps or offers to. A loop that never does keeps its CPU forever.
>
> **The Watchdog:** And somebody notices.

### See it (X-ray)

**Scheduler view:** `[lantern-pulse]` sits on a run queue next to user tasks, sleeps
between steps, and is woken by its timeout. Its parent is kthreadd.

**Preemption models:** every Act II oops said `PREEMPT(voluntary)`. Under
`voluntary` (and `none`), kernel code is preempted only where it sleeps or calls
`cond_resched()`; under `full`, anywhere preemption isn't disabled; under `lazy`
(6.13+), fair tasks are preempted at the next tick. A held spinlock disables
preemption under every model. With `PREEMPT_DYNAMIC`, `preempt=` on the command line
(3.1) picks one at boot.

**The lockup detector** (`kernel/watchdog.c`): a per-CPU timer checks that the CPU
has scheduled recently. If not for twice `watchdog_thresh` (20 s by default), it
prints a soft lockup; if even its timer interrupts stop, the NMI-based hard lockup
detector fires. The Watchdog, through the Gate: "So that's what I am, down there."

### Build it

Starter (blank): only the player's Lantern. The player adds a heartbeat thread:

- `lantern_pulse_fn(void *data)`: `while (!kthread_should_stop())`, take
  `msg_lock`, move the brightness one step along a slow curve, unlock, then sleep
  with `schedule_timeout_interruptible(msecs_to_jiffies(pulse_ms))`;
- `pulse_ms` as a module parameter (2.3), default 100;
- start it at init with `kthread_run(lantern_pulse_fn, ldev, "lantern-pulse")`
  (check `IS_ERR()`, unwind with 2.4's `goto`), and lower it with
  `sched_set_normal(task, 10)`: a heartbeat shouldn't outrank the harbor;
- stop it at exit with `kthread_stop()` before anything it uses is freed (2.12's
  rule, again).

**Crash on purpose (guided):** a scratch copy whose loop does each step under
`spin_lock(&ldev->sensor_lock)` and never sleeps. On the `voluntary` Machine the CPU
never schedules again; 20 (compressed) seconds later:

```
watchdog: BUG: soft lockup - CPU#1 stuck for 22s! [lantern-pulse:388]
Modules linked in: lantern(O)
CPU: 1 UID: 0 PID: 388 Comm: lantern-pulse Tainted: G           O        6.18.0-lantern #1 PREEMPT(voluntary)
Tainted: [O]=OOT_MODULE
RIP: 0010:lantern_pulse_step+0x2a/0x70 [lantern]
Call Trace:
 <TASK>
 lantern_pulse_fn+0x41/0x90 [lantern]
 kthread+0x...
 ret_from_fork+0x...
 ret_from_fork_asm+0x...
 </TASK>
```

The kernel is now tainted `L` (soft lockup). The snapshot restores.

Checker verifies (behavior):
- The brightness breathes: it changes every `pulse_ms` in the light map (3.5) and
  sysfs (2.7).
- `ps -o pid,ppid,ni,comm` shows `lantern-pulse` with parent 2 and nice 10.
- `rmmod` returns within one step (the thread is woken by `kthread_stop()`), no
  thread is left, KASAN and kmemleak are quiet.
- Fault injection: `kthread_run()` fails with `-ENOMEM`; the load fails cleanly with
  every earlier step undone.
- With two hogs and the pulse running, no soft lockup, hung-task or "sleeping in
  atomic" report, and `harbor` stays within its latency bound (3.7).

### Watch it

**Predict:** the same spinning scratch module, booted with `preempt=full`. Soft
lockup or not? (No. Under `full`, every `spin_unlock()` re-enables preemption and
checks for a pending reschedule, so the Judge takes the CPU back at the next unlock.
Under `voluntary`, unlocking is not a preemption point. Either way the loop still
burns a whole CPU: the fix is to sleep, not to change the model. `lazy` behaves like
`full` here, one tick later (verify).)

The Watchdog recognizes the report: "That. That's what I feel, those evenings."
The Lantern breathes; the Court's clock ticks in time with it.

### Debrief

> **The Watchdog:** Twenty seconds stuck, then the report. Same as my freezes. But
> nobody wrote those down. Whatever sits on CPU 1, it doesn't leave a trace.
>
> **The Judge:** Everything leaves a trace. You just weren't watching. There's a
> tower for that.

Next: the Watchtower (3.9).

### Hints

1. **Nudge:** A thread that loops forever never lets `rmmod` finish. What does the
   loop check each time round?
2. **Concept:** `kthread_should_stop()` becomes true when someone calls
   `kthread_stop()`, which also wakes the thread and waits for it to return.
   Sleep interruptibly, so the wake-up cuts the sleep short.
3. **Point at the spot:** The end of the loop body: `schedule_timeout_interruptible()`,
   not `msleep()` (which sleeps again until its time is up) and not a busy wait.

### Codex (chapter: Clockwork Court)

- **Kernel threads** (`kthread`, deepens: `kernel-threads`)
  - **Simple:** A kernel worker that can sleep, scheduled like any task.
  - **Deep:** `kthread_run()` asks kthreadd to create it; it runs until its function
    returns, checking `kthread_should_stop()`; `kthread_stop()` sets the flag, wakes
    it and waits. Kernel threads have no `mm`, ignore signals by default, and show
    in brackets. Prefer a workqueue for one-off jobs; use a kthread for a long-lived
    loop. — https://docs.kernel.org/core-api/kthread.html (verify path) —
    `kernel/kthread.c`, `include/linux/kthread.h`
- **Preemption models** (`preemption-models`)
  - **Simple:** Whether kernel code can be interrupted to let another task run.
  - **Deep:** `none`, `voluntary` (preempt at `might_sleep()`/`cond_resched()`
    points), `full`, `lazy` (6.13+) and `PREEMPT_RT` (mainline since 6.12).
    `PREEMPT_DYNAMIC` kernels choose at boot with `preempt=`; the oops's
    `PREEMPT(...)` field shows which. Disabled preemption (spinlocks, `preempt_disable()`,
    softirq) holds the CPU under every model. — https://docs.kernel.org/admin-guide/kernel-parameters.html
    (`preempt=`) — `kernel/sched/core.c`, `kernel/Kconfig.preempt`
- **Soft lockups** (`soft-lockup`, deepens: `hung-task`)
  - **Simple:** A CPU that hasn't scheduled for 20 seconds gets reported.
  - **Deep:** `kernel/watchdog.c` runs a per-CPU hrtimer that checks a timestamp
    the CPU's stopper task updates; stuck for over 2 × `watchdog_thresh` →
    "BUG: soft lockup - CPU#N stuck for Ns!" with the registers and stack, taint
    `L`. The hard lockup detector (NMI, or a "buddy" CPU, 6.7+) catches CPUs whose
    interrupts are off. `softlockup_panic` turns a report into a panic. Hung tasks
    (2.9) are the opposite case: a task sleeping too long. —
    https://docs.kernel.org/admin-guide/lockup-watchdogs.html — `kernel/watchdog.c`

### Real-world card

```sh
ps --ppid 2 -o pid,ni,comm | head      # kthreadd's children
cat /proc/sys/kernel/watchdog_thresh
sudo cat /sys/kernel/debug/sched/preempt   # e.g. none (voluntary) full lazy
uname -v                                    # PREEMPT_DYNAMIC?
# In a VM only: the kernel's own lockup test module (CONFIG_TEST_LOCKUP)
sudo modprobe test_lockup time_secs=25 lock_spinlock=1   # (verify parameters)
```

### Taint

- No `kthread_stop()` at exit: +5 (the thread keeps running freed module code).
- Busy-waiting between steps (`cpu_relax()` or `msleep(0)` loops): +3.
- `msleep()` between steps: +1 (`rmmod` waits up to a whole step).
- A timer callback that takes `msg_lock` instead of a thread: +5 ("sleeping in
  atomic").

### Fidelity

**Faithful:** the kthread API and semantics, PPID 2 and brackets, the preemption
model names and `preempt=`, the soft lockup message, threshold and `L` taint.
**Simplified:** SIMPLIFIED: time is compressed (20 s of lockup pass in seconds);
the lockup detector is modeled per CPU without NMIs (hard lockups are described,
not simulated).

### Lab needs

`kthread_run`/`kthread_should_stop`/`kthread_stop`, `sched_set_normal`,
`schedule_timeout_interruptible`; kernel threads as tasks in the scheduler model;
preemption models selectable with `preempt=` and their effect on kernel loops; a
soft lockup detector with the real report and taint `L`; time compression for
lockups and hung tasks.

---

## 3.9 — Watchtower: the Lookout

- **Id:** `act3-watchtower-09-the-lookout` · **Region / NPC:** Watchtower / the Lookout (ftrace), the Watchdog · **Tracks:** `kernel`, `debug` · **Time:** ~15 min · **Prerequisites:** `dbg-printk-dmesg`, `drv-read-path`, `proc-kthreads` · **Skills unlocked:** `dbg-ftrace`, `dbg-tracepoints`
- **Starter:** partial (the trace header's boilerplate) · **X-ray:** Trace (new)

### Scene

> **The Lookout:** From up here I can watch any function in the kernel, and every
> event its authors marked. No rebuild, no reboot. When I'm not looking it costs
> almost nothing.
>
> **The Watchdog:** You were looking on the freeze nights?
>
> **The Lookout:** Events only, not functions. The last thing CPU 1 told me was
> `softirq_entry: vec=3 [action=NET_RX]`. Then nothing from CPU 1 for twenty
> seconds. No `softirq_exit`.
>
> **init:** It went into the network's bottom half and didn't come out.
>
> **The Lookout:** That's what the trace says. Not why. Learn my tower first. And
> mark your own Lantern while you're at it: `printk` is shouting into a crowd. A
> tracepoint is a note only I read, and only when I'm looking.

### See it (X-ray)

**Trace view (unlocked here):** tracefs at `/sys/kernel/tracing`. The **function
tracer**: every kernel function starts with a call to `__fentry__`, patched into a
NOP at boot; turning the tracer on patches the calls back in, only for the functions
in `set_ftrace_filter`. The **function_graph tracer** also hooks returns, so it can
draw calls as a tree with durations. **Trace events** are tracepoints: fixed hooks the
source marks (`sched_switch`, `sys_enter_write`, `softirq_entry`), each with a
`format` file listing its fields. Off, a tracepoint is a NOP behind a static key; on,
it writes a binary record into a per-CPU ring buffer.

`echo hi > /dev/lantern` is replayed under function_graph from `vfs_write()` down
into `lantern_write()`: the read path from 2.5, now as the kernel recorded it.

### Build it

Starter (partial): `lantern_trace.h` with the multi-read header's boilerplate
(`TRACE_SYSTEM lantern`, the include guard with `TRACE_HEADER_MULTI_READ`,
`TRACE_INCLUDE_PATH .` and `TRACE_INCLUDE_FILE lantern_trace`, then
`#include <trace/define_trace.h>`), and an empty spot for the events. The player:

- defines three events with `TRACE_EVENT()`: `lantern_write` (message id, length),
  `lantern_read` (message id, bytes copied, position) and `lantern_brightness` (old,
  new, who set it: ioctl, sysfs, sensor or pulse), each with `TP_PROTO`, `TP_ARGS`,
  `TP_STRUCT__entry`, `TP_fast_assign` and `TP_printk`;
- defines `CREATE_TRACE_POINTS` before including the header in exactly one `.c`
  file, and adds `CFLAGS_lantern_main.o := -I$(src)` to the `Kbuild`;
- calls `trace_lantern_write()` and the others at the right places (replacing any
  per-message `pr_info()` from Act II);
- uses the function_graph tracer on `lantern_write` with `set_graph_function`.

Checker verifies (behavior):
- `/sys/kernel/tracing/events/lantern/` has the three events, each with a `format`
  file listing the fields.
- With the events on, each `echo`, `cat`, `lanternctl set` and pulse step from
  `ksh-lite` produces exactly one matching record with the right values.
- With them off, nothing is recorded and nothing is printed to `dmesg` per message.
- The player's function_graph run shows `lantern_write()`'s callees (re-tests 2.5's
  path from `vfs_write()`).
- The Lantern builds with no warnings and loads and unloads cleanly.

### Watch it

**Order the path:** the player orders what function_graph will show for one `echo
hi > /dev/lantern`: `vfs_write()`, `lantern_write()`, the allocation, the copy from
user space, the lock, the history push, the unlock. Then the real trace:

```
ksh$ echo lantern_write > /sys/kernel/tracing/set_graph_function
ksh$ echo function_graph > /sys/kernel/tracing/current_tracer
ksh$ echo hello > /dev/lantern
ksh$ cat /sys/kernel/tracing/trace
 0)               |  lantern_write [lantern]() {
 0)   0.912 us    |    __kmalloc_noprof();
 0)   0.388 us    |    _copy_from_user();
 0)   0.201 us    |    mutex_lock_interruptible();
 0)   1.304 us    |    lantern_history_push [lantern]();
 0)   0.150 us    |    mutex_unlock();
 0)   5.711 us    |  }
ksh$ echo nop > /sys/kernel/tracing/current_tracer
ksh$ echo 1 > /sys/kernel/tracing/events/lantern/enable
ksh$ echo hello > /dev/lantern
ksh$ cat /sys/kernel/tracing/trace_pipe
            echo-701     [000] .....   812.441203: lantern_write: id=17 len=6
```

(Callees depend on the player's Lantern; times are the lab's. The flags column has
five characters in 6.x: irqs-off, need-resched, hard/softirq, preempt depth,
migrate-disable.) The Tower's first lens turns toward the Deep.

### Debrief

> **The Lookout:** Now you can see what happened. Next, count it: who writes to the
> Lantern, and how much, all night. Counting inside the kernel takes the
> Verifier's permission.

Next: The Verifier (3.11). Side level, any time from here: Where the Time Goes
(3.10), where the Lookout asks a different question, where the time went.

### Hints

1. **Nudge:** The header is read several times by the trace machinery, each time
   with different macro definitions. What turns the events into real code, once?
2. **Concept:** `TRACE_EVENT()` declares the hook, its record layout and how to print
   it. One `.c` file defines `CREATE_TRACE_POINTS` before the include to emit the
   code; out-of-tree modules also need `TRACE_INCLUDE_PATH` and an `-I$(src)` so the
   second pass finds the header.
3. **Point at the spot:** Check the `Kbuild` line for the file that defines
   `CREATE_TRACE_POINTS`, and that `TP_fast_assign` copies only plain values (no
   locks, nothing that sleeps).

### Codex (chapter: Watchtower)

- **ftrace** (`ftrace`)
  - **Simple:** The kernel's built-in tracer: watch functions and events live.
  - **Deep:** tracefs (`/sys/kernel/tracing`): `available_tracers`, `current_tracer`
    (`function`, `function_graph`, `nop`…), `set_ftrace_filter`,
    `set_graph_function`, `trace`, `trace_pipe`, `tracing_on`, per-CPU ring buffers.
    Dynamic ftrace patches `__fentry__` calls in and out at run time. `trace-cmd`
    and KernelShark are front ends. — https://docs.kernel.org/trace/ftrace.html —
    `kernel/trace/ftrace.c`, `kernel/trace/trace.c`
- **Trace events** (`trace-events`, deepens: `strace`)
  - **Simple:** Fixed checkpoints in the kernel that write a record when switched on.
  - **Deep:** `events/<system>/<event>/{enable,filter,format}`; `strace` only sees
    syscalls, events see inside the kernel (`sched:sched_switch`,
    `irq:softirq_entry`, `block:block_rq_issue`). Off, each is a static-key NOP. —
    https://docs.kernel.org/trace/events.html — `include/trace/events/`
- **TRACE_EVENT()** (`trace-event-macro`)
  - **Simple:** One macro that declares a tracepoint, its fields and its text.
  - **Deep:** `TP_PROTO`/`TP_ARGS` (the call), `TP_STRUCT__entry` (the record),
    `TP_fast_assign` (fill it), `TP_printk` (show it). `__string()`/`__assign_str()`
    copy strings (since 6.10, `__assign_str()` takes only the field name). Use
    `trace_printk()` only while debugging; it prints a warning banner at load. —
    https://docs.kernel.org/trace/tracepoints.html — `include/linux/tracepoint.h`,
    `samples/trace_events/`

### Real-world card

```sh
sudo cat /sys/kernel/tracing/available_tracers
sudo trace-cmd record -p function_graph -g vfs_write -- cat /etc/hostname
sudo trace-cmd report | head -30
sudo trace-cmd record -e sched:sched_switch -e irq:softirq_entry sleep 1
ls /sys/kernel/tracing/events/lantern     # after insmod of your Lantern
```

`samples/trace_events/` in the kernel tree is the reference for writing your own.

### Taint

- `trace_printk()` left in the driver: +3 (debug-only; the kernel warns at load).
- A per-message `pr_info()` kept alongside the tracepoint: +1.
- Work in `TP_fast_assign` that can sleep or take a lock: +5 (tracepoints fire in
  any context).

### Fidelity

**Faithful:** tracefs paths and files, the tracers, the trace and function_graph
output formats, the `TRACE_EVENT()` macro and the out-of-tree include rules, event
`format` files, the static-key cost model.
**Simplified:** SIMPLIFIED: the lab can trace only the kernel functions it models (a
few hundred, named as in 6.18); durations are the lab's; `__fentry__` patching is
shown, not performed.

### Lab needs

tracefs with `current_tracer`, `set_ftrace_filter`, `set_graph_function`, `trace`,
`trace_pipe`, `tracing_on`, events with `enable`/`filter`/`format`; function and
function_graph tracers over the lab's modeled kernel functions (an instrumented call
stack in the simulated kernel); core events (`sched_switch`, `sys_enter_*`,
`softirq_entry`/`exit`, `napi_poll`); `TRACE_EVENT()` support in the lab's kernel
headers for player modules; the Trace view.

---

## 3.10 — Watchtower: where the time goes (optional side level)

- **Id:** `act3-watchtower-10-where-the-time-goes` · **Region / NPC:** Watchtower / the Lookout · **Tracks:** `kernel`, `debug`, `userland` · **Time:** ~12 min · **Prerequisites:** `dbg-ftrace`, `proc-scheduler`, `io-pipes` · **Skills unlocked:** `dbg-perf`
- **Starter:** stub (in `lens`) · **X-ray:** Trace (perf mode)

### Scene

> **The Lookout:** Tracing writes down everything. Sometimes you only want to know
> where the time went. Then I stop writing and just glance at the CPU, a few
> thousand times a second, and count what I see.
>
> **The Watchdog:** You glance and guess?
>
> **The Lookout:** I glance and _add up_. Four hundred glances out of four thousand
> in one function: it had a tenth of the time. The CPU even helps: it has counters
> for instructions, cycles, cache misses. The kernel calls them perf events.
>
> **init:** Then look at the Lantern under load. `lantern-stress`, eight readers.

### See it (X-ray)

**Trace view, perf mode:** counting first. `perf stat` opens one counter per event
(hardware ones from the CPU's PMU, software ones like page faults and context
switches from the kernel), lets the program run, reads the totals. Then sampling:
`perf record` programs a counter to overflow every N events (or at a frequency,
4000 Hz by default); each overflow interrupt (an NMI on x86) records the instruction
pointer and the call stack. `perf report` adds the samples up per function, and the
view draws them as a flame graph: width is time.

### Build it

Starter (stub): `lens` with an unwired `stat` entry and the `perf_event_attr`
header. The player writes `lens stat -- <command>`:

- `fork()` a child that blocks on a pipe (1.7) until the parent is ready;
- in the parent, one `perf_event_open()` per event (task-clock, context switches,
  page faults, instructions), through `syscall(SYS_perf_event_open, &attr, child,
  -1, -1, PERF_FLAG_FD_CLOEXEC)` since libc has no wrapper, each with `disabled =
  1`, `enable_on_exec = 1` and `inherit = 1`;
- release the child (it `exec`s the command, which starts the counters), `wait4()`
  it, `read()` each 8-byte count and print them.

Then, from command chips, `perf record -g` and `perf report` on `lantern-stress`.

Checker verifies (behavior):
- For three commands, `lens stat`'s counts equal the lab's exactly (counters opened
  after `exec`, or without `inherit`, miss events and fail the check).
- As uid 1000 with `perf_event_paranoid` at 2, opening a kernel-inclusive counter
  fails and `lens` reports `EACCES` instead of printing zeros.
- No counter fd leaks into the child; the child is reaped (re-tests 1.4 and 1.7).

### Watch it

**Predict:** eight readers and one writer hammer the Lantern. Where does most of
the readers' time go: copying the message to user space, or something else? (Waiting
for `msg_lock`: spinning on the mutex's owner, then the queue.)

```
ksh$ lens stat -- lantern-stress -r 8 -w 1
      812.33 msec task-clock
       4,113      context-switches
         391      page-faults
 702,559,114      instructions
ksh$ perf record -g -- lantern-stress -r 8 -w 1
ksh$ perf report --stdio --no-children | head -6
# Overhead  Command         Shared Object      Symbol
    41.20%  lantern-stress  [kernel.kallsyms]  [k] mutex_spin_on_owner
    17.85%  lantern-stress  [kernel.kallsyms]  [k] osq_lock
     9.02%  lantern-stress  [lantern]          [k] lantern_read
```

**Point at it:** in the flame graph the player clicks the tower that answers "where
do the readers wait?": `lantern_read()` → `mutex_lock_interruptible()` →
`mutex_spin_on_owner()`. The Tower's second lens turns.

### Debrief

> **The Lookout:** Your readers spend more time waiting for each other than reading.
> Readers that never change anything, queuing behind one lock.
>
> **init:** The Halls below have an answer for that, I've heard. Not yet. First: I
> want to know who writes to the Lantern, and how much. All of them, all night.
>
> **The Lookout:** Counting per process, inside the kernel? Then you need the
> Verifier's permission.

Back to the main path: The Verifier (3.11), or wherever the player left it.

### Hints

1. **Nudge:** If you open the counters after the command has started, what do you
   miss? And if you open them before `fork`, whose events do you count?
2. **Concept:** Open them on the child's PID while it waits, disabled, with
   `enable_on_exec`: the counters start exactly when the command does. `inherit`
   follows its children too.
3. **Point at the spot:** Order in the parent: `fork()`, `perf_event_open(…, child,
   …)` for each event, then write to the pipe so the child can `exec`.

### Codex (chapter: Watchtower)

- **perf events** (`perf-events`)
  - **Simple:** Counters the CPU and kernel keep: instructions, cycles, faults,
    context switches.
  - **Deep:** `perf_event_open(2)` with a `struct perf_event_attr` (type
    `PERF_TYPE_HARDWARE`/`SOFTWARE`/`TRACEPOINT`, config, flags); `read()` returns
    the count; `/proc/sys/kernel/perf_event_paranoid` (or `CAP_PERFMON`) limits
    who may measure what. VMs often lack hardware counters. — man 2
    `perf_event_open`, https://perfwiki.github.io/ — `kernel/events/core.c`,
    `tools/perf/`
- **Sampling profiles** (`sampling-profile`)
  - **Simple:** Glance at the CPU thousands of times a second and add up what it
    was doing.
  - **Deep:** A counter overflow (an NMI on x86) records IP and stack; `perf
    record -g`, `perf report`, flame graphs. Sampling shows where CPU time goes,
    not why a task waited: a contended mutex shows up as `mutex_spin_on_owner` and
    `osq_lock` (optimistic spinning) while waiters are on-CPU, and disappears from
    the profile once they sleep. — https://www.brendangregg.com/flamegraphs.html —
    `kernel/events/core.c`, `kernel/locking/mutex.c`

### Real-world card

```sh
perf stat -e task-clock,context-switches,page-faults,instructions ls
cat /proc/sys/kernel/perf_event_paranoid
sudo perf record -g -a -- sleep 5 && sudo perf report --stdio | head -40
sudo perf top
# Flame graph: github.com/brendangregg/FlameGraph
sudo perf script | ./stackcollapse-perf.pl | ./flamegraph.pl > out.svg
```

### Taint

- Counter fds leaked into the measured program (no `PERF_FLAG_FD_CLOEXEC`): +1.
- Not checking that `read()` returned 8 bytes: +3.
- Busy-waiting for the child instead of `wait4()`: +1.

### Fidelity

**Faithful:** the `perf_event_open` API and attribute fields, `enable_on_exec` and
`inherit`, `perf_event_paranoid`, `perf stat`/`record`/`report` output shape, the
profile of a contended mutex.
**Simplified:** SIMPLIFIED: the lab has no PMU: "instructions" counts the lab's
executed instructions, cycles are derived from them, and sampling is deterministic
(every Nth instruction) so profiles repeat exactly.

### Lab needs

`perf_event_open` with software events and modeled hardware events, `read()` of
counts, `enable_on_exec`/`inherit`, `PERF_FLAG_FD_CLOEXEC`,
`perf_event_paranoid`; a deterministic sampler with kernel and user stacks; `perf
stat|record|report|top` subsets; flame graph rendering in the Trace view;
`lantern-stress` from Act II with reader and writer counts.

---

## 3.11 — Watchtower: the Verifier

- **Id:** `act3-watchtower-11-the-verifier` · **Region / NPC:** Watchtower / the Verifier (the BPF verifier), the Lookout · **Tracks:** `kernel`, `debug`, `c` · **Time:** ~20 min · **Prerequisites:** `dbg-tracepoints`, `c-pointers-memory` · **Skills unlocked:** `dbg-ebpf`
- **Starter:** partial (a new kind of program) · **X-ray:** Trace (BPF mode)

### Scene

> **The Verifier:** You want to run your own code inside a live kernel. No module,
> no reboot. Fine. I allow it, after I have read every path through it.
>
> **init:** Every path?
>
> **The Verifier:** Every one. I know what each register holds at every
> instruction: a number, a pointer to the context, a pointer into a map, or _maybe_
> a pointer into a map, which is to say maybe nothing. You don't touch memory I
> can't prove is there. You don't loop forever. You don't read the stack you never
> wrote.
>
> **The Lookout:** And in return, your counts live in the kernel, in a map, and
> anyone with the key can read them.
>
> **init:** Here, I sketched one. Count bytes written to the Lantern, per process.
>
> **The Verifier** (reading): No.

### See it (X-ray)

**Trace view, BPF mode:** a C file is compiled with `clang --target=bpf` into
BPF bytecode (eleven 64-bit registers, `r10` the frame pointer, a 512-byte stack).
`bpf(BPF_PROG_LOAD)` hands it to the verifier, which walks every path and annotates
each instruction with what every register holds. Accepted, the program is
JIT-compiled to native code and attached to a hook, here the Lantern's own
`lantern_write` tracepoint from 3.9. Maps (`bpf(BPF_MAP_CREATE)`) are kernel memory
shared between the program and user space. init's sketch replays: after
`bpf_map_lookup_elem()`, `r0` is `map_value_or_null`; the sketch reads through it at
once, and the verifier stops there.

### Build it

Starter (partial): `lantern_writers.bpf.c` with includes, the licence section and an
empty map definition; `lens bpf` with the loading and attaching done (open the
object, load, attach to the tracepoint, Ctrl-C to stop) and the map printing left
empty; init's rejected sketch in a comment-free scratch file. The player writes:

- a `BPF_MAP_TYPE_HASH` map from `u32` (TGID) to `u64` (bytes);
- the program, `SEC("tracepoint/lantern/lantern_write")`, taking a context struct
  laid out like `/sys/kernel/tracing/events/lantern/lantern_write/format` (8 bytes
  of common fields, then `id` and `len`); it gets the TGID from
  `bpf_get_current_pid_tgid() >> 32`, looks it up, **checks for NULL**, adds `len`
  with `__sync_fetch_and_add()`, or inserts it with `bpf_map_update_elem(…,
  BPF_NOEXIST)`;
- in `lens bpf`, a loop over the map with `bpf_map_get_next_key()` and
  `bpf_map_lookup_elem()` that prints TGID, `/proc/<tgid>/comm` and bytes.

Checker verifies (behavior):
- The program loads and attaches; init's sketch is still rejected (the scratch file
  is part of the level).
- Writers with known sizes (`echo` from `ksh-lite`, `lanternctl`, `lantern-stress`)
  produce exactly the right totals per TGID, including writers on both CPUs at once
  (no lost counts).
- When `lens bpf` exits, the program is detached and the map freed (`bpftool prog
  show` lists nothing of it).
- Re-tests 3.9: the `lantern_write` tracepoint fires once per write with the right
  length.

### Watch it

**Predict:** will the Verifier accept init's sketch? (No: `bpf_map_lookup_elem()`
returns NULL for a missing key, and the sketch adds to `*v` without checking.)

```
ksh$ lens bpf sketch.bpf.o
libbpf: prog 'on_lantern_write': BPF program load failed: Permission denied
libbpf: prog 'on_lantern_write': -- BEGIN PROG LOAD LOG --
...
7: (79) r1 = *(u64 *)(r0 +0)
R0 invalid mem access 'map_value_or_null'
processed 8 insns (limit 1000000) ...
-- END PROG LOAD LOG --
ksh$ lens bpf lantern_writers.bpf.o
^C
tgid  comm             bytes
701   echo                12
733   lanternctl          64
740   lantern-stress   40960
```

(Log abridged; the instruction numbers depend on the compiled code.) The Tower's
third lens turns, and now it can look anywhere.

### Debrief

> **The Verifier:** Proved. Go on.
>
> **The Lookout:** Three lenses. You can see what happened, where the time went, and
> count anything you like. The Stall's in reach now, if it comes back while you're
> watching.
>
> **init:** And the readers queuing at `msg_lock`?
>
> **The Lookout:** That's the Halls. They've been waiting for you. Everyone there
> waits for everyone, very politely.

Next: the Grace Halls (3.12).

### Hints

1. **Nudge:** Read the last line of the verifier's log. What does it think `r0` might
   be?
2. **Concept:** A map lookup returns a pointer to the value, or NULL if the key isn't
   there. The verifier tracks that "or NULL" until you test it; after `if (v)`, it
   knows `v` is safe on that branch.
3. **Point at the spot:** The line right after `bpf_map_lookup_elem()`: test the
   result before adding to it, and insert the first count on the NULL branch.

### Codex (chapter: Watchtower)

- **eBPF** (`ebpf`)
  - **Simple:** Small programs you load into a running kernel, checked first so they
    can't crash it.
  - **Deep:** Programs attach to tracepoints, kprobes, fentry, perf events, sockets,
    XDP, cgroups and more; helpers are the only calls they make. Loading needs
    `CAP_BPF` (plus `CAP_PERFMON` for tracing) or root; unprivileged BPF is off by
    default on most distributions. libbpf, bpftool, BTF and CO-RE make one binary run
    on many kernels; bpftrace is the one-liner front end. —
    https://docs.kernel.org/bpf/ — `kernel/bpf/syscall.c`, `kernel/bpf/core.c`,
    `kernel/trace/bpf_trace.c`
- **BPF maps** (`bpf-maps`)
  - **Simple:** Kernel memory a BPF program and user space share, by key.
  - **Deep:** Hash, array, per-CPU variants, ring buffer and more; created with
    `BPF_MAP_CREATE`, used from programs with helpers and from user space with
    `bpf()` commands. Per-CPU maps avoid atomics on hot counters. —
    https://docs.kernel.org/bpf/maps.html — `kernel/bpf/hashtab.c`
- **The verifier** (`bpf-verifier`)
  - **Simple:** The kernel reads every path of your program before it runs once.
  - **Deep:** It tracks each register's type and range, rejects possible NULL
    dereferences, out-of-bounds access, uninitialized stack reads and unbounded
    loops (bounded loops allowed since 5.3), and caps the work it does (1 million
    instructions processed). A rejection returns `EACCES` with the log. —
    https://docs.kernel.org/bpf/verifier.html — `kernel/bpf/verifier.c`

### Real-world card

```sh
sudo bpftrace -e 'tracepoint:lantern:lantern_write { @[comm] = sum(args->len); }'
sudo bpftool prog show
sudo bpftool map dump name bytes_by_tgid
cat /proc/sys/kernel/unprivileged_bpf_disabled
# Start a libbpf project: github.com/libbpf/libbpf-bootstrap
```

### Taint

- A plain `+=` on a hash value shared across CPUs: +3 (lost counts).
- A `bpf_printk()` per event left in: +1 (it floods the trace pipe).
- The program left attached after `lens` exits (pinned and forgotten): +1.

### Fidelity

**Faithful:** program and map types, helper names and semantics, the tracepoint
context layout from `format`, the verifier's NULL rule and message, `EACCES` on
rejection, privilege rules, atomic adds.
**Simplified:** SIMPLIFIED: the lab's verifier implements a subset (register types,
NULL checks, packet and stack bounds, simple bounded loops) with real messages for
those; programs are interpreted, not JIT-compiled; `lens bpf` uses a small libbpf
subset and a hand-written context struct instead of BTF.

### Lab needs

clang with the BPF target in the wasm toolchain (or precompiled objects when it is
missing); an ELF loader for BPF objects with map relocations; `bpf()`
(`MAP_CREATE`, `PROG_LOAD` with log, map lookup/update/get-next-key, attach to a
tracepoint); a verifier subset with real messages; a BPF interpreter with helpers
(`map_*`, `get_current_pid_tgid`, `get_current_comm`, `ktime_get_ns`); `bpftool prog
show` and `map dump` subsets; a libbpf subset for `lens`; the Trace view's BPF mode.

---

## 3.12 — Grace Halls: hall of mirrors

- **Id:** `act3-grace-halls-12-hall-of-mirrors` · **Region / NPC:** Grace Halls / the Grace Keeper, the Verger (cameo), ksoftirqd (cameo) · **Tracks:** `kernel`, `debug` · **Time:** ~20 min · **Prerequisites:** `sync-atomics`, `proc-threads`, `irq-wait-queues`, `dbg-kasan` · **Skills unlocked:** `sync-memory-ordering`, `dbg-kcsan`
- **Starter:** blank · **X-ray:** Memory order (new), Locks and timing

### Scene

> **The Grace Keeper:** Welcome to the Halls. Every CPU here sees the others in a
> mirror. A little late. And not always in the order things happened.
>
> **init:** That can't be. A store is a store.
>
> **The Grace Keeper:** A store goes into the CPU's own buffer first and reaches the
> others when it reaches them. The compiler moves your plain loads and stores
> around too, whenever it can prove _your_ thread can't tell. Other threads can.
>
> **The Verger:** Which is why I like locks. A lock puts everything in order. Without
> one I see nothing.
>
> **The Grace Keeper:** Your sensor takes a spinlock for every reading. The handler
> and the reader queue for it a thousand times a second. There's another way, if you
> say exactly which order you need. And there's a witness who sees what the Verger
> can't: KCSAN.

### See it (X-ray)

**Memory order view (unlocked here):** two CPUs, each with a store buffer. The
**message-passing** pattern:

```
CPU 0                         CPU 1
data = 42;                    if (flag == 1)
flag = 1;                         r = data;     /* r == 0 possible? */
```

On x86 (the Machine), stores become visible in program order and loads aren't
reordered with loads, so the CPU never shows `r == 0`. But the C compiler may
reorder or merge plain accesses, and on arm64 (the lighthouse board's cores) the
CPU itself may let `flag` become visible before `data`. The view runs the same code
under both: on the arm64 side, CPU 1 reads `flag == 1` and `data == 0`. The Linux
kernel memory model (LKMM) calls the plain version a data race: a bug everywhere,
even where the hardware hides it. Fixed with `smp_store_release(&flag, 1)` and
`smp_load_acquire(&flag)`: everything before the release is visible to whoever sees
the flag through the acquire.

Then **store buffering**, the one reordering x86 does allow: each CPU writes its own
flag and reads the other's; both read 0. Only a full barrier (`smp_mb()`) forbids it.

### Build it

Starter (blank): only the player's Lantern, whose 2.10b/2.10c sensor path stores each
reading under `sensor_lock`. The player replaces it with a **single-producer,
single-consumer ring** (the pattern in `Documentation/core-api/circular-buffers.rst`):

- a power-of-two array of readings with `head` (written only by the IRQ handler) and
  `tail` (written only by readers);
- the handler: read `tail` with `READ_ONCE()`; if `CIRC_SPACE()` allows, store the
  reading at `head`, then publish with `smp_store_release(&ring->head, next)` and
  `wake_up()` the wait queue (2.10c); if full, count an overrun;
- the reader: `smp_load_acquire(&ring->head)`; if `CIRC_CNT()` > 0, read the slot at
  `tail`, then `smp_store_release(&ring->tail, next)`; several readers take
  `sensor_read_lock` (a mutex) among themselves, since only one consumer may move
  `tail`;
- a comment on each barrier saying what it pairs with (checkpatch asks for one).

They rebuild their kernel as `-lantern-kcsan` (2.1's fragment, with `CONFIG_KCSAN=y`
instead of KASAN: the two can't be on together) and run the ring under it.

Checker verifies (behavior):
- In the lab's weak-ordering mode (arm64 rules) over 10,000 forced interleavings of
  IRQ and readers, every reading returned is one the IRQ produced, in order, none
  duplicated, and none lost except counted overruns.
- The IRQ path takes no lock (the lab's lock tracer sees none on the IRQ lane).
- On the `-kcsan` kernel, no KCSAN report under the same stress (a version with plain
  accesses to `head` or `tail` is caught).
- Two readers each get distinct readings; a blocked reader wakes on new data and
  Ctrl-C still interrupts it (re-tests 2.10c).

### Watch it

**Predict:** on the Machine (x86), can the old plain-store version ever hand a reader
a reading that isn't there yet? (Not by the CPU reordering two stores. But the
compiler may, and the code is wrong by the kernel's model regardless. On the
lighthouse's arm64 cores it fails, and KCSAN reports it on any architecture.)

The KCSAN report on the plain version, before the fix (abridged):

```
==================================================================
BUG: KCSAN: data-race in lantern_irq [lantern] / lantern_sensor_read [lantern]

write to 0xffff888004b31a48 of 4 bytes by interrupt on cpu 1:
 lantern_irq+0x5c/0xa0 [lantern]
 __handle_irq_event_percpu+0x...
 handle_irq_event+0x...

read to 0xffff888004b31a48 of 4 bytes by task 742 on cpu 0:
 lantern_sensor_read+0x8e/0x1f0 [lantern]
 vfs_read+0x...
 ksys_read+0x...
 do_syscall_64+0x...

value changed: 0x00000011 -> 0x00000012

Reported by Kernel Concurrency Sanitizer on:
CPU: 0 UID: 0 PID: 742 Comm: cat Tainted: G           O        6.18.0-lantern-kcsan #1 PREEMPT(voluntary)
==================================================================
```

**Point at it:** the player clicks the two accesses (who wrote, who read, in which
context) and the value that changed. The mirrors in the Hall line up.

### Debrief

> **The Grace Keeper:** Release, acquire. You said which order you needed, and only
> that. Now the bigger trick. Your readers at `msg_lock`.
>
> **init:** The Lookout showed us. They wait for each other.
>
> **The Grace Keeper:** Here, readers never wait. Writers do. For everyone.

Next: Grace (3.13).

### Hints

1. **Nudge:** The handler writes the reading, then moves `head`. What does a reader
   on another CPU need to be sure of when it sees the new `head`?
2. **Concept:** A release store makes every earlier write visible to anyone whose
   acquire load sees the stored value. Publish with release, consume with acquire;
   `READ_ONCE()`/`WRITE_ONCE()` stop the compiler from tearing or merging accesses
   but don't order anything by themselves.
3. **Point at the spot:** In the handler, the last write must be the release of
   `head`; in the reader, the first read must be the acquire of `head`, and the last
   write the release of `tail`.

### Codex (chapter: Grace Halls)

- **Memory ordering** (`memory-ordering`, deepens: `race-condition`)
  - **Simple:** Other CPUs may see your writes late, and in a different order.
  - **Deep:** Compilers reorder plain accesses; CPUs reorder through store buffers
    and caches. x86 (TSO) only lets a later load pass an earlier store; arm64,
    RISC-V and POWER allow much more. The LKMM defines what kernel code may assume,
    on every architecture. — https://docs.kernel.org/core-api/wrappers/memory-barriers.html
    (verify path), `Documentation/memory-barriers.txt` — `tools/memory-model/`
- **READ_ONCE and WRITE_ONCE** (`read-write-once`, deepens: `atomic-counter`)
  - **Simple:** "Really read it, once, whole": no tearing, no merging, no caching in
    a register.
  - **Deep:** Marks an access as concurrent for the compiler and for KCSAN; it does
    not order it against other accesses. Atomics give read-modify-write;
    `READ_ONCE` gives a plain value read safely. — `include/asm-generic/rwonce.h`
- **Acquire and release** (`acquire-release`)
  - **Simple:** Publish with release, consume with acquire, and everything before the
    publish travels with it.
  - **Deep:** `smp_store_release()` / `smp_load_acquire()` pair across CPUs; full
    barriers (`smp_mb()`) also forbid store-then-load reordering. Every barrier
    pairs with another and deserves a comment naming it. `CIRC_CNT()` and
    `CIRC_SPACE()` (`include/linux/circ_buf.h`) serve the single-producer ring. —
    https://docs.kernel.org/core-api/circular-buffers.html —
    `include/asm-generic/barrier.h`
- **KCSAN** (`kcsan`, deepens: `kasan`)
  - **Simple:** The kernel's data-race detector.
  - **Deep:** The compiler instruments accesses; KCSAN sets watchpoints on sampled
    accesses and reports when another CPU touches the same word without both being
    marked (`READ_ONCE`, atomics, locks). Report: the two accesses with their
    contexts and stacks, and the value change. Mutually exclusive with KASAN. —
    https://docs.kernel.org/dev-tools/kcsan.html — `kernel/kcsan/`

### Real-world card

```sh
# The kernel's memory model, runnable: install herd7 (opam install herdtools7), then
cd tools/memory-model
herd7 -conf linux-kernel.cfg litmus-tests/MP+pooncerelease+poacquireonce.litmus
herd7 -conf linux-kernel.cfg litmus-tests/SB+pooncemb+pooncemb.litmus  # (verify names)
# A KCSAN kernel (not together with KASAN):
scripts/config -d KASAN -e KCSAN && make olddefconfig && make -j"$(nproc)"
```

Read `Documentation/core-api/circular-buffers.rst` with your ring beside it.

### Taint

- A KCSAN report during the checker run: +5.
- Plain accesses to `head` or `tail` shared across CPUs: +5.
- `smp_mb()` everywhere instead of the pair you need: +1 (correct, slower, explains
  nothing).
- A barrier without a comment naming its pair: +1 (checkpatch warns).

### Fidelity

**Faithful:** the MP and SB outcomes under x86-TSO and arm64, the LKMM's view of
plain races, the acquire/release semantics, the circular-buffer pattern and macros,
`READ_ONCE`/`WRITE_ONCE`, the KCSAN report shape and its exclusivity with KASAN.
**Simplified:** SIMPLIFIED: the lab's weak-ordering mode picks LKMM-allowed outcomes
on purpose (real arm64 hardware shows them rarely); KCSAN is modeled with a
watchpoint on every access instead of sampling, so it reports every time.

### Lab needs

A weak-memory execution mode for chosen kernel code (per-CPU store buffers following
LKMM-allowed reorderings, deterministic choice of outcome), plus an x86-TSO mode;
`smp_store_release`/`smp_load_acquire`/`smp_mb`/`READ_ONCE`/`WRITE_ONCE` and
`circ_buf.h`; a KCSAN model with the real report; a `-kcsan` kernel config; the
lab's lock tracer per context lane; the Memory order view with its litmus replays.

---

## 3.13 — Grace Halls: grace

- **Id:** `act3-grace-halls-13-grace` · **Region / NPC:** Grace Halls / the Grace Keeper (`rcu_preempt`), the Lookout (cameo), the Watchdog · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `sync-memory-ordering`, `mem-object-lifetime`, `sync-deadlock-lockdep` · **Skills unlocked:** `sync-rcu`
- **Starter:** blank · **X-ray:** Memory order (RCU mode), Trace (perf mode, if 3.10 was played)

### Scene

> **The Grace Keeper:** Readers in my Halls never lock anything. They walk in, read,
> walk out.
>
> **init:** And writers?
>
> **The Grace Keeper:** Never change what a reader is looking at. A writer puts up a
> new version beside the old one, takes the old one off the wall, and _waits_. Until
> every reader who might have seen it has left. That wait is a grace period. Then,
> and only then, the old one goes in the furnace.
>
> **init:** The Dangling's lesson. Stop everything that can reach it before you free
> it.
>
> **The Grace Keeper:** For a timer you stop one thing. Here we wait for everyone,
> without asking them to stop.
>
> **The Watchdog:** And the freeze nights?
>
> **The Grace Keeper:** The grace periods waited for CPU 1. It never answered. I
> wrote it down every time. Nobody was reading.

### See it (X-ray)

**Memory order view, RCU mode:** the Lantern's history as a list. Two readers on two
CPUs walk it inside `rcu_read_lock()`. The writer, holding `msg_lock`, evicts the
oldest message with `list_del_rcu()` and adds a new one with `list_add_tail_rcu()`.
The removed message stays intact; a reader standing on it can still follow its
`next` pointer back into the list. A **grace period** starts. Each CPU passes a
**quiescent state** (a context switch, idle, user mode); a reader that was preempted
inside its section is tracked as blocked until it leaves. When every CPU has
reported, the grace period ends and the deferred `kfree()` runs.

Then a scratch reader that never leaves its read section. 21 (compressed) seconds
later:

```
rcu: INFO: rcu_preempt detected stalls on CPUs/tasks:
rcu: 	Tasks blocked on level-0 rcu_node (CPUs 0-1): P742
rcu: 	(detected by 0, t=21002 jiffies, g=4381, q=12 ncpus=2)
```

(Abridged; the exact lines depend on the stall (verify format).)

### Build it

Starter (blank): only the player's Lantern, its 2.9b history under `msg_lock`, its
2.8b kref'd messages and its 2.12 fader. The player makes the history's readers
lock-free:

- writers keep `msg_lock` and change the list only with `list_add_tail_rcu()` and
  `list_del_rcu()`;
- `struct lantern_msg` gains a `struct rcu_head`, and the kref release function frees
  with `kfree_rcu(msg, rcu)`;
- `/proc/lantern`'s `seq_file` walks the list with `list_for_each_entry_rcu()` inside
  `rcu_read_lock()`/`rcu_read_unlock()` (in `start`/`stop`);
- `lantern_read()` finds its message under `rcu_read_lock()`, takes a reference with
  `kref_get_unless_zero()` (a message whose count already hit zero is on its way
  out), leaves the read section, _then_ calls `copy_to_user()`, which may sleep, and
  drops the reference.

Checker verifies (behavior):
- Under `lantern-stress -r 8 -w 1`, the read path takes no `msg_lock` (the lab's lock
  tracer). (A player who took the optional 3.10 also sees `perf report` no longer
  show readers in `mutex_spin_on_owner`; the checker doesn't need it.)
- 1,000 forced interleavings of reads, `/proc/lantern` walks and evictions: no KASAN
  report, every reader sees a consistent list (no message twice, none half-written).
- No "suspicious RCU usage" and no "Voluntary context switch within RCU read-side
  critical section!" from the debug kernel (PROVE_RCU comes with 2.1's
  PROVE_LOCKING).
- The fader (2.12) and the light map (3.5) still work; kmemleak is clean after
  `rmmod`.

### Watch it

**Predict:** a reader is standing on message B when the writer evicts B. What does
the reader's next step reach: the message after B, freed memory, or nothing? (The
message after B. `list_del_rcu()` leaves B's `next` pointer intact, and B itself isn't
freed until the reader has left.)

With the optional 3.10's perf (otherwise the lab's lock tracer shows the read path
taking no lock):

```
ksh$ perf report --stdio --no-children | head -5
# Overhead  Command         Shared Object      Symbol
    22.40%  lantern-stress  [kernel.kallsyms]  [k] _copy_to_user
    14.81%  lantern-stress  [lantern]          [k] lantern_read
```

The Halls' doors stand open; readers come and go without a sound.

### Debrief

> **The Grace Keeper:** Your readers don't wait any more. Your writer waits for
> them, and only for the memory.
>
> **The Watchdog:** And CPU 1, on the freeze nights?
>
> **The Grace Keeper:** Something on it never let it say "I'm done". Something
> that never left the network's bottom half, your Lookout says. And what runs
> there now is a card you haven't met.
>
> **init:** A card?
>
> **The Grace Keeper:** The fourth device on the bus. Go to the Yards.

Next: the Bus Yards (3.14).

### Hints

1. **Nudge:** Readers no longer take the lock. So what stops a message from being
   freed while a reader is still looking at it?
2. **Concept:** RCU readers mark a read section; writers unlink the object, then
   wait a grace period (or let `kfree_rcu()` wait) before freeing it. A read section
   must not sleep; to keep an object past it, take a reference with
   `kref_get_unless_zero()` before leaving.
3. **Point at the spot:** In `lantern_read()`, the `copy_to_user()` must be after
   `rcu_read_unlock()`, with your own reference held. And the kref release function
   must not call `kfree()` directly.

### Codex (chapter: Grace Halls)

- **RCU** (`rcu`, deepens: `stop-before-free`)
  - **Simple:** Readers never wait; writers publish new versions and free old ones
    only when every reader has left.
  - **Deep:** `rcu_read_lock()`/`rcu_read_unlock()` mark readers;
    `rcu_assign_pointer()` publishes (a release store) and `rcu_dereference()` reads
    (an ordered load); `synchronize_rcu()` waits for a grace period, `call_rcu()` and
    `kfree_rcu()` defer the free. A module that uses `call_rcu()` with its own
    callback must call `rcu_barrier()` before unloading. —
    https://docs.kernel.org/RCU/whatisRCU.html — `kernel/rcu/tree.c`,
    `include/linux/rcupdate.h`
- **Grace periods** (`grace-period`)
  - **Simple:** The wait until every CPU has passed a point where it can't be
    reading.
  - **Deep:** Quiescent states: context switch, idle, user mode. With preemptible RCU
    (`CONFIG_PREEMPT_RCU`, the `rcu_preempt` kthread drives grace periods), readers
    can be preempted and are tracked per task. Sleeping inside a read section is a
    bug either way. — https://docs.kernel.org/RCU/Design/Requirements/Requirements.html
    — `kernel/rcu/tree.c`, `kernel/rcu/tree_plugin.h`
- **RCU lists** (`rcu-list`)
  - **Simple:** A list readers can walk while a writer changes it.
  - **Deep:** `list_add_rcu()`, `list_add_tail_rcu()`, `list_del_rcu()`,
    `list_replace_rcu()`, `list_for_each_entry_rcu()`; writers still serialize with a
    lock; a deleted entry keeps its `next` pointer until freed. With reference
    counts, take `kref_get_unless_zero()` inside the read section. —
    https://docs.kernel.org/RCU/listRCU.html — `include/linux/rculist.h`
- **RCU stalls** (`rcu-stall`, deepens: `soft-lockup`)
  - **Simple:** A grace period that can't end, reported after 21 seconds.
  - **Deep:** "rcu: INFO: rcu_preempt detected stalls on CPUs/tasks" names the CPUs
    that never reported a quiescent state and the tasks blocked in read sections;
    "self-detected stall" is printed by the stuck CPU itself. Causes: a CPU looping
    with preemption or interrupts off, a read section that never ends, a starved RCU
    kthread. `CONFIG_RCU_CPU_STALL_TIMEOUT` sets the time. —
    https://docs.kernel.org/RCU/stallwarn.html — `kernel/rcu/tree_stall.h`

### Real-world card

```sh
ps -e | grep -E 'rcu_'                # rcu_preempt (or rcu_sched) and friends
git grep -c 'rcu_read_lock' -- net/ fs/ mm/ | sort -t: -k2 -n | tail   # in a kernel tree
sudo dmesg | grep -i 'rcu.*stall'     # any stalls on this machine?
```

Read `Documentation/RCU/whatisRCU.rst`, then `listRCU.rst` beside your history code.

### Taint

- `kfree()` instead of `kfree_rcu()` in the release: +5 (KASAN use-after-free under
  the forced interleavings).
- `copy_to_user()` inside the read section: +5 (lockdep-RCU reports it).
- Walking the list with plain `list_for_each_entry()` in a reader: +3 (lockdep-RCU
  or KCSAN reports it).
- `synchronize_rcu()` in every write while holding `msg_lock`: +1 (correct, but
  every writer waits a whole grace period).

### Fidelity

**Faithful:** the RCU API and its rules, RCU list primitives, the
`kref_get_unless_zero()` pattern, quiescent states, the `rcu_preempt` kthread name,
the stall warning's first line and timeout, lockdep-RCU's messages.
**Simplified:** SIMPLIFIED: the lab computes grace periods from its own model of
each CPU's quiescent states and blocked readers, not from tree RCU's machinery;
expedited grace periods and callback offloading aren't modeled.

### Lab needs

An RCU model: read sections (nesting, preemption, blocked tasks), quiescent states
per CPU, grace periods, `synchronize_rcu`, `call_rcu`, `kfree_rcu`, `rcu_barrier`;
RCU list primitives; stall detection with the real warning; lockdep-RCU checks
(sleeping in a read section, unprotected `rcu_dereference`); the lab's lock tracer;
the Memory order view's RCU mode.

---

## 3.14 — Bus Yards: the lighthouse board

- **Id:** `act3-bus-yards-14-the-lighthouse` · **Region / NPC:** Bus Yards / the Matchmaker (the driver core), udev (cameo), the Harbormaster (cameo) · **Tracks:** `kernel` · **Time:** ~18 min · **Prerequisites:** `drv-hardware-discovery`, `irq-handlers`, `drv-error-unwinding`, `drv-sysfs-procfs` · **Skills unlocked:** `drv-platform-dt`
- **Starter:** partial (a new board, a new kind of driver) · **X-ray:** Buses (new)

### Scene

> **The Matchmaker:** Every bus has me. Devices arrive, drivers arrive. I
> introduce them. If the names match, the driver's `probe()` takes the device, and
> from then on it's theirs.
>
> **The Harbormaster:** Socket Harbor's lighthouse board. You read its device tree
> when you were new. Its lamp ran on GPIO. Its beacon never ran at all.
>
> **init:** "That board's not ours yet," the Prologue said.
>
> **The Matchmaker:** It is now. The beacon is a little register block at a fixed
> address. It can't announce itself, so the tree describes it. You'll write the
> other half: a driver that says "I am the one for `kernelfall,beacon`."
>
> **udev:** And I'll give it a name in `/sys/class/leds`. Lamps have a class. Don't
> invent your own files.

### See it (X-ray)

**Buses view (unlocked here):** the lighthouse board's tree (arm64, two cores, a
GIC interrupt controller). At boot, `of_platform_populate()` turns each device node
under the root into a `platform_device` named `<address>.<node>`
(`7e300000.beacon`). When a `platform_driver` registers, the Matchmaker compares the
node's `compatible` against the driver's `of_match_table`; on a match it calls
`probe()`. A probe that returns `-EPROBE_DEFER` (something it needs isn't ready yet)
is retried later. A node with `status = "disabled"` gets no device at all.

The same beacon on an x86 board would be described by ACPI instead: a `_HID` in the
DSDT matched against an `acpi_match_table`, or the special `PRP0001` ID with the
DT `compatible` string carried in `_DSD`, so one driver serves both.

### Build it

Starter (partial): `lighthouse.dts` from P.6 with the GIC node added and
`interrupt-parent = <&gic>` at the root; the beacon's binding document (registers:
`ID` at `0x00` reads `0x4245434e`, `CTRL` `0x04`, `BRIGHTNESS` `0x08` (0–255),
`IRQ_STATUS` `0x0c` (bit 0 dusk, bit 1 dawn, write 1 to clear), `IRQ_ENABLE`
`0x10`); `beacon.c` with includes, the empty `of_device_id` table and
`module_platform_driver()`. The player:

- adds the node:

  ```dts
  	beacon@7e300000 {
  		compatible = "kernelfall,beacon";
  		reg = <0x7e300000 0x100>;
  		interrupts = <0 42 4>;	/* GIC_SPI 42, IRQ_TYPE_LEVEL_HIGH */
  	};
  ```

- writes `beacon_probe()`: `devm_kzalloc()`; `devm_platform_ioremap_resource(pdev,
  0)`; check the `ID` register with `readl()` (`-ENODEV` if wrong); register the lamp
  as an LED (`led_classdev` named `beacon:white:lamp`, `max_brightness` 255,
  `brightness_set_blocking` writing `BRIGHTNESS`) with `devm_led_classdev_register()`;
  then `platform_get_irq()` and `devm_request_irq()` last, once everything the
  handler touches exists; enable the dusk and dawn interrupts;
- writes the handler: read `IRQ_STATUS`, return `IRQ_NONE` if zero, clear what it
  saw, turn the lamp on at dusk and off at dawn with `led_set_brightness()` (safe
  from interrupt context: the LED core defers the blocking write);
- writes `beacon_remove()` (it returns `void` in 6.18): turn the lamp off and mask
  the interrupts; `devm` releases the rest;
- fills the `of_device_id` table and `MODULE_DEVICE_TABLE(of, …)`, rebuilds the
  `.dtb` with `dtc` (P.6) and boots the board.

Checker verifies (behavior):
- On boot the beacon probes (`beacon 7e300000.beacon: …` in the board's log) and
  `/sys/class/leds/beacon:white:lamp/` exists; writing its `brightness` changes the
  `BRIGHTNESS` register.
- The lab's dusk and dawn interrupts switch the lamp; `/proc/interrupts` counts
  them; an interrupt the beacon didn't raise returns `IRQ_NONE` (re-tests 2.10b).
- `unbind` through `/sys/bus/platform/drivers/beacon/` removes the LED and frees the
  IRQ and mapping (no leak, no KASAN); `bind` brings it back; three cycles.
- Fault injection: a wrong `ID` value → `-ENODEV` and no LED; the mapping failing →
  probe fails with nothing left behind; `status = "disabled"` → no probe at all.

### Watch it

**Predict:** the player unbinds the driver. They never called `free_irq()`,
`iounmap()` or `kfree()`. What happens to the IRQ, the mapping and the memory?
(`devm` releases them after `remove()` returns, in the reverse order they were
acquired: 2.4's `goto` ladder, run by the driver core.)

```
lighthouse# dmesg | tail -2
[    1.882301] beacon 7e300000.beacon: beacon rev 1 at 7e300000, irq 42
[ 1803.004112] beacon 7e300000.beacon: dusk: lamp on
lighthouse# cat /sys/class/leds/beacon:white:lamp/brightness
255
```

(The `beacon … rev 1` line is the player's own `dev_info()`; the virtual IRQ number
the kernel assigns is the lab's.) Out at the harbor, the lighthouse's beacon turns on
at dusk for the first time since the Kernelfall.

### Debrief

> **The Matchmaker:** A tree said "here's a beacon", a driver said "that's mine",
> and I made the introduction. On the Machine nobody writes a tree. The bus itself
> tells me what's plugged in.
>
> **The Watchdog:** And the fourth device on the Machine's bus already has a driver.
> The old one.

Next: The Lantern Card (3.15).

### Hints

1. **Nudge:** The node and the driver both exist, but `probe()` never runs. What
   does the Matchmaker compare?
2. **Concept:** A platform device from a device tree matches a driver when the
   node's `compatible` string equals one in the driver's `of_match_table`. Resources
   (`reg`, `interrupts`) come from the node; `devm_` helpers release them for you,
   in reverse order, when the device goes away.
3. **Point at the spot:** Check the `compatible` in both places, character by
   character, and that `devm_request_irq()` comes after the LED and registers are
   ready.

### Codex (chapter: Bus Yards)

- **Platform drivers** (`platform-driver`, deepens: `driver-model`)
  - **Simple:** Drivers for devices that sit at fixed addresses and can't announce
    themselves.
  - **Deep:** `struct platform_driver` with `probe`, `remove` (returns `void` since
    the 6.11–6.13 conversion) and `.driver.of_match_table`; `module_platform_driver()`
    registers it. Devices come from the device tree (`of_platform_populate()`),
    ACPI or board code. `-EPROBE_DEFER` retries a probe later. —
    https://docs.kernel.org/driver-api/driver-model/platform.html —
    `drivers/base/platform.c`, `drivers/of/platform.c`, `drivers/base/dd.c`
- **Managed resources** (`devm`, deepens: `goto-unwinding`)
  - **Simple:** Ask the driver core to free it for you when the device goes.
  - **Deep:** `devm_kzalloc()`, `devm_platform_ioremap_resource()`,
    `devm_request_irq()` and many more register a release action; on probe failure
    or unbind, actions run in reverse order after `remove()`. Don't mix a `devm_`
    allocation with a manual free. `dev_err_probe()` logs and returns an error,
    quietly for `-EPROBE_DEFER`. — https://docs.kernel.org/driver-api/driver-model/devres.html
    — `drivers/base/devres.c`
- **Device tree bindings** (`dt-binding`, deepens: `device-tree`)
  - **Simple:** The documented contract for what a node of a kind of device must say.
  - **Deep:** YAML schemas in `Documentation/devicetree/bindings/` list the
    `compatible` strings, required properties (`reg`, `interrupts`, clocks…) and
    examples; `make dt_binding_check` and `make dtbs_check` validate them; vendor
    prefixes are registered in `vendor-prefixes.yaml`, which is why checkpatch warns
    about `kernelfall,`. — https://docs.kernel.org/devicetree/bindings/writing-schema.html
- **ACPI device IDs** (`acpi-hid`, deepens: `acpi-pci`)
  - **Simple:** How x86 firmware names a fixed device, so a driver can match it.
  - **Deep:** The DSDT gives devices a `_HID` (and `_CID`s); drivers list them in an
    `acpi_device_id` table; `PRP0001` plus a `compatible` in `_DSD` lets ACPI reuse
    DT matching. `/sys/bus/acpi/devices/*/hid` lists them. —
    https://docs.kernel.org/firmware-guide/acpi/enumeration.html —
    `drivers/acpi/scan.c`
- **The LED class** (`led-class`)
  - **Simple:** Lamps already have a standard home in `/sys/class/leds`.
  - **Deep:** A `struct led_classdev` gives `brightness`, `max_brightness` and
    triggers (`heartbeat`, `disk-activity`, `netdev`) for free; names follow
    `devicename:color:function`. Use a subsystem's class instead of inventing sysfs
    files. — https://docs.kernel.org/leds/leds-class.html — `drivers/leds/led-class.c`

### Real-world card

```sh
# On a Raspberry Pi or another ARM/RISC-V board:
ls /sys/bus/platform/devices
dtc -I fs -O dts /proc/device-tree | less
# Without a board: QEMU's RISC-V "virt" machine writes out its device tree
qemu-system-riscv64 -machine virt,dumpdtb=virt.dtb && dtc -I dtb -O dts virt.dtb | less
# On x86, the same idea through ACPI:
cat /sys/bus/acpi/devices/*/hid | sort | uniq -c | sort -n | tail
ls /sys/class/leds
```

### Taint

- `devm_request_irq()` before the state the handler uses exists: +5 (the IRQ can fire
  at once; the lab fires it).
- A handler that always returns `IRQ_HANDLED`: +3 (breaks shared lines and spurious
  interrupt detection).
- A `devm_` resource also freed by hand: +5 (double free).
- Inventing a `brightness` sysfs file instead of the LED class: +1.

### Fidelity

**Faithful:** DT syntax and the GIC interrupt cells, platform device naming,
`of_match_table` matching, `status = "disabled"`, deferred probe, `devm` order,
`platform_get_irq()`, the LED class and its naming, `bind`/`unbind`, ACPI `_HID`
and `PRP0001`.
**Simplified:** SIMPLIFIED: the lighthouse board is a lab model (arm64 with a GIC)
running the lab's kernel, not real arm64 code; `kernelfall,beacon` is a made-up
device with an unregistered vendor prefix; there are no clocks, regulators or
pinctrl.

### Lab needs

A second lab machine, the lighthouse board (arm64 flavour, two cores, a GIC, DT
boot, its own console and `/sys`); `of_platform_populate` and platform bus matching;
deferred probe; `devm` with ordered release; `devm_platform_ioremap_resource`,
`platform_get_irq`, `readl`/`writel` on a modeled register block that raises
interrupts; the LED class with `led_set_brightness` deferral; `bind`/`unbind` in
sysfs; `dtc`; the Buses view.

---

## 3.15 — Bus Yards: the Lantern card

- **Id:** `act3-bus-yards-15-the-lantern-card` · **Region / NPC:** Bus Yards / the Matchmaker, udev, the Watchdog · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `drv-platform-dt`, `mem-page-tables`, `sys-kernel-cmdline` · **Skills unlocked:** `drv-pci`
- **Starter:** stub · **X-ray:** Buses, Virtual memory, Locks and timing

### Scene

> **The Matchmaker:** On the Machine nobody writes a tree. The PCI bus answers for
> itself: every slot has a little table that says who made the device and what it
> is. Four answers since the reboot.
>
> **udev:** And the moment the fourth one answered, the kernel told me its
> `modalias`, and I loaded the driver that claimed it: `lantern_card`. The old one.
>
> **init:** Written by the same hand as the old Lantern.
>
> **The Watchdog:** Then I don't trust it. It's been running since the reboot.
> Since the freezes started.
>
> **The Matchmaker:** You can't prove that yet. But you can drive the card
> yourself. In your own kernel, tell the old driver to stay away, and write your
> own.

### See it (X-ray)

**Buses view, PCI:** at boot the kernel reads each slot's **configuration space**
(through the ECAM window that ACPI's MCFG table points to): vendor `1234`, device
`11e8`, a class, a **BAR** (base address register) asking for 1 MiB of memory
space, an interrupt pin and an **MSI** capability. The PCI core assigns the BAR an
address and creates `0000:00:03.0`; its `modalias` reaches udev, which runs
`modprobe`, and the old driver binds.

**Virtual memory view:** the driver maps BAR0 with `pci_iomap()`/`ioremap()`: page
table entries (3.3) pointing at device memory, marked uncached. `ioread32(regs +
0x04)` is a load that the card answers. **MSI:** instead of raising a shared wire,
the card writes a small message to a special address, which the CPU's interrupt
controller turns into the card's own vector.

### Build it

Starter (stub): the card's register sheet, the Lantern with an empty `lantern_pci.c`
and an unwired `struct pci_driver`. The card's core registers follow QEMU's `edu`
teaching device (verify offsets): `0x00` identification (`0xRRrr00ed`), `0x04`
liveness (reads back the bitwise NOT of what was written), `0x24` interrupt status,
`0x60` raise, `0x64` acknowledge; the lamp registers are the Lantern card's own:
`0x100` brightness, `0x104` colour, `0x108` light sensor (lux). The player:

- boots their test kernel with `modprobe.blacklist=lantern_card` (3.1) so the old
  driver stays away;
- writes the ID table (`PCI_DEVICE(0x1234, 0x11e8)`, `MODULE_DEVICE_TABLE(pci, …)`)
  and `lantern_pci_probe()`: `pcim_enable_device()`; map BAR0 (`pcim_iomap_region()`,
  verify the managed helper's name in 6.18); check the identification's low byte is
  `0xed` and pass a liveness test, or return `-ENODEV`; set up everything the
  handler needs; then `pci_alloc_irq_vectors(pdev, 1, 1, PCI_IRQ_MSI |
  PCI_IRQ_INTX)` and `devm_request_irq(&pdev->dev, pci_irq_vector(pdev, 0), …,
  IRQF_SHARED, "lantern", lc)`;
- writes the handler: read the interrupt status, `IRQ_NONE` if zero, acknowledge
  through `0x64`, and on a sensor change feed the 3.12 ring;
- makes the Lantern's brightness (2.6 `ioctl`, 2.7 sysfs, 3.8 pulse) also write the
  card's brightness register with `iowrite32()` when a card is bound;
- writes `remove()`: stop the card's interrupts, unhook the Lantern from it.

Checker verifies (behavior):
- `lspci -k` shows `Kernel driver in use: lantern` for `00:03.0`.
- The liveness test runs at probe; changing brightness from `ksh-lite`, `lanternctl`
  and the pulse reaches the card's register (the lab watches MMIO writes).
- 10 sensor changes → 10 interrupts on the `lantern` line in `/proc/interrupts`, and
  10 readings through `/dev/lantern-sensor` (re-tests 3.12's ring).
- Booted with `pci=nomsi`, the card falls back to a legacy line it shares with the
  network card: everything still works, and interrupts that aren't the card's
  return `IRQ_NONE`.
- `unbind`/`bind` three times, and moving the device from `lantern_card` to `lantern`
  at run time through sysfs: no leak, no KASAN, no oops.
- Fault injection: wrong identification → `-ENODEV`; mapping fails → clean failure.

### Watch it

**Predict:** `lspci -vv` says BAR0 is at `fea00000`. The driver calls
`ioread32(regs + 0x04)`. What physical address does the load reach, and how did the
CPU find it? (`0xfea00004`, through the page tables `ioremap()` wrote for `regs`.)

```
ksh$ lspci -nn -k -s 00:03.0
00:03.0 Unclassified device [00ff]: Device [1234:11e8] (rev 10)
	Subsystem: Red Hat, Inc. Device [1af4:1100]
	Kernel driver in use: lantern
ksh$ lspci -vv -s 00:03.0 | grep -E 'Region|MSI:'
	Region 0: Memory at fea00000 (32-bit, non-prefetchable) [size=1M]
	Capabilities: [40] MSI: Enable+ Count=1/1 Maskable- 64bit+
ksh$ grep lantern /proc/interrupts
 24:          0         10  PCI-MSI-0000:00:03.0   0-edge      lantern
```

(Abridged; the `/proc/interrupts` chip name for MSI follows 6.x's per-device MSI
domains (verify).) The Lantern card's lamp, dark since the Kernelfall, lights up in
the Machine's own hardware.

### Debrief

> **The Matchmaker:** Your driver on your kernel. The old one still runs the
> card on the everyday kernel, the one the city lives on. Its light link too.
>
> **init:** Light link?
>
> **The Harbormaster** (from far above): The card's other half. A wire of light to
> the lighthouse. Before you go there, the Archive wants you. Your Lantern's
> history deserves shelves.

Next: the Archive Stacks (3.16).

### Hints

1. **Nudge:** Your driver loads but `probe()` never runs, or runs on the old
   driver's device. Who owns `00:03.0` right now?
2. **Concept:** A device has at most one driver. Keep the old one away with
   `modprobe.blacklist=` at boot, or move the device at run time: write its address
   to the old driver's `unbind` file, then to your driver's `bind`. Match is by the ID
   table; autoloading needs `MODULE_DEVICE_TABLE`.
3. **Point at the spot:** `lspci -k -s 00:03.0` names the driver in use; and in
   `probe()`, the interrupt request belongs at the end, after the BAR is mapped and
   checked.

### Codex (chapter: Bus Yards)

- **PCI drivers** (`pci-driver`, deepens: `acpi-pci`)
  - **Simple:** A driver that says which vendor and device IDs it handles, and takes
    the device in `probe()`.
  - **Deep:** `struct pci_driver` with an `id_table`, `probe(pdev, id)`,
    `remove(pdev)`; `pcim_enable_device()` (managed), `pci_set_master()` before DMA.
    `MODULE_DEVICE_TABLE(pci, …)` writes the `modalias` patterns udev uses to load
    the module. — https://docs.kernel.org/PCI/pci.html — `drivers/pci/pci-driver.c`,
    `include/linux/pci.h`
- **BARs and MMIO** (`pci-bar`, deepens: `interrupts-mmio`)
  - **Simple:** A device's registers, given an address range the CPU can load from
    and store to.
  - **Deep:** Config space BARs request memory or I/O space; the PCI core assigns
    addresses (`lspci -vv`, `/sys/bus/pci/devices/*/resource`, `/proc/iomem`).
    Drivers map them (`pci_iomap()`, `ioremap()`: uncached page-table entries) and
    access them only with `ioread32()`/`iowrite32()` or `readl()`/`writel()`, never a
    plain pointer (`__iomem`, checked by sparse). — https://docs.kernel.org/driver-api/device-io.html
    — `include/linux/io.h`, `drivers/pci/setup-bus.c`
- **MSI** (`msi`)
  - **Simple:** A device interrupts by writing a message, so it never shares a wire.
  - **Deep:** `pci_alloc_irq_vectors(pdev, min, max, PCI_IRQ_MSIX | PCI_IRQ_MSI |
    PCI_IRQ_INTX)` picks the best available; `pci_irq_vector()` gives the Linux IRQ
    number. INTx lines can be shared, so handlers must return `IRQ_NONE` for
    interrupts that aren't theirs. (`PCI_IRQ_INTX` was `PCI_IRQ_LEGACY` before
    6.8.) — https://docs.kernel.org/PCI/msi-howto.html — `drivers/pci/msi/`
- **Binding and unbinding** (`driver-binding`, deepens: `driver-model`)
  - **Simple:** Which driver has a device can be changed by hand.
  - **Deep:** `/sys/bus/pci/drivers/<drv>/{bind,unbind}`, `driver_override`,
    `modprobe.blacklist=` on the command line, `blacklist` lines in
    `/etc/modprobe.d/`. `lspci -k` shows "Kernel driver in use" and "Kernel modules"
    that could bind. — https://docs.kernel.org/admin-guide/sysfs-rules.html (verify)
    — `drivers/base/bus.c`
- **DMA (preview)** (`dma`)
  - **Simple:** Devices read and write RAM by themselves; the driver hands them
    addresses.
  - **Deep:** The DMA API gives device-visible addresses: `dma_alloc_coherent()` for
    long-lived shared structures (rings), `dma_map_single()` for one buffer at a
    time; an IOMMU may translate them. Ordering with the device uses `dma_wmb()`,
    `dma_rmb()`. The light link (3.18) uses a ring of them. —
    https://docs.kernel.org/core-api/dma-api-howto.html — `kernel/dma/`

### Real-world card

The Lantern card's core registers are QEMU's `edu` device, so your probe code runs
against real emulated hardware:

```sh
qemu-system-x86_64 -enable-kvm -m 2G -device edu ...    # plus your kernel and disk
lspci -nn -k | grep -A3 11e8
sudo insmod lantern.ko && lspci -k -s 00:03.0 && grep lantern /proc/interrupts
cat /sys/bus/pci/devices/0000:00:03.0/resource
```

(QEMU's `docs/specs/edu.rst` documents the registers. The lamp and sensor registers
exist only in the lab.)

### Taint

- `devm_request_irq()` before BAR0 is mapped and checked: +5.
- Dereferencing the mapped registers as a plain pointer: +3 (sparse warns; not
  portable).
- A handler that returns `IRQ_HANDLED` for every interrupt: +3 (the `pci=nomsi` run
  shares the line).
- No `MODULE_DEVICE_TABLE`: +1 (nothing autoloads it).
- Not checking the identification register: +1.

### Fidelity

**Faithful:** configuration space and IDs, BARs and their assignment, `lspci`
formats, `modalias` autoloading, `modprobe.blacklist=`, `bind`/`unbind`, MSI vs
INTx semantics and `PCI_IRQ_*` flags, `__iomem` accessors, the `edu` device's
identification, liveness and interrupt registers (verify offsets).
**Simplified:** SIMPLIFIED: the Lantern card is a lab model built on QEMU's `edu`
(same IDs and core registers) plus lamp and sensor registers that exist only in the
lab; enumeration is precomputed; there is no IOMMU.

### Lab needs

A fourth PCI device on the Machine with configuration space, a 1 MiB BAR,
`edu`-compatible registers plus the lamp and sensor registers, MSI and an INTx line
shared with `e1000`; PCI core enumeration results in sysfs and `lspci -nn -k -vv`;
`modalias` and udev autoload; `modprobe.blacklist=` and `pci=nomsi`;
`pcim_enable_device`, BAR mapping, `pci_alloc_irq_vectors`, `pci_irq_vector`;
`ioread32`/`iowrite32` traced as MMIO; `bind`/`unbind`; the old `lantern_card`
driver as a binary module that binds on the everyday kernel.

---

## 3.16 — Archive Stacks: a filesystem of light

- **Id:** `act3-archive-stacks-16-a-filesystem-of-light` · **Region / NPC:** Archive Stacks / the Librarian (the VFS), init · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `io-everything-is-a-file`, `drv-fops`, `sync-rcu` · **Skills unlocked:** `io-vfs-filesystem`
- **Starter:** partial (a new subsystem's boilerplate) · **X-ray:** Storage (new), Files

### Scene

> **The Librarian:** Every filesystem speaks to me in four words. A **superblock**
> for each mounted filesystem. An **inode** for each file, whatever it is. A
> **dentry** for each name. A **file** for each open. ext4 says them about a disk,
> procfs about processes. Yours will say them about messages.
>
> **init:** Each message a file. `ls` the history, `cat` one message.
>
> **The Librarian:** And I keep a catalogue of every name I've looked up, so the
> second time is free. Including the names that _weren't_ there. Mind that.

### See it (X-ray)

**Storage view (unlocked here):** `cat /proc/1/status`, replayed from the VFS's
side: the path walk takes `/` and the dentry for `proc`, crosses into procfs's mount,
asks procfs to look up `1` and `status` (a miss in the **dentry cache**, then a
hit the second time), gets an inode, opens a `struct file` with the inode's
`file_operations`, and reads. Then `cat /etc/nope`: the lookup finds nothing, and the
dcache remembers a **negative dentry**, so the next miss is free too.
`register_filesystem()` is what puts a name in `/proc/filesystems`; `mount -t` asks
that filesystem for a superblock and its root dentry.

### Build it

Starter (partial): `lanternfs.c` with the mount boilerplate (`init_fs_context`, a
`get_tree` that calls `get_tree_nodev(fc, lanternfs_fill_super)`, a
`file_system_type` named `lanternfs` with `.owner = THIS_MODULE` and `.kill_sb =
kill_anon_super`), registered from the Lantern's init and unregistered at exit. The
player writes:

- `lanternfs_fill_super()`: the magic number, `s_op` with `simple_statfs`, a root
  directory inode (`S_IFDIR | 0555`) with their own `inode_operations` (`.lookup`)
  and `file_operations` (`.iterate_shared`, `.read = generic_read_dir`), and
  `d_make_root()`;
- `lanternfs_lookup()`: parse the name as a message id; find the message under
  `rcu_read_lock()` (3.13); if it exists, make an inode (`new_inode()`, `S_IFREG |
  0444`, the id as inode number, the text length as size) and attach it with
  `d_splice_alias()`; if not, attach nothing (a negative dentry);
- `iterate_shared()`: `dir_emit_dots()`, then one `dir_emit()` per message in the
  history from `ctx->pos` on, under RCU;
- file operations: `open` takes a reference on the message with
  `kref_get_unless_zero()` (or fails with `ENOENT` if it's gone) and keeps it in
  `file->private_data`; `read` is `simple_read_from_buffer()` over the text;
  `release` drops the reference.

Checker verifies (behavior):
- `mount -t lanternfs none /mnt/lantern`; `ls` lists exactly the history's ids;
  `cat` each prints its text; `stat` shows the size, mode and inode number.
- A message written from `ksh-lite` appears at once; an evicted one disappears from
  `ls`, but a `cat` that had it open still reads it whole (2.8b's rule).
- `cat /mnt/lantern/99` before message 99 exists gives `No such file or directory`;
  after it is written, `cat` finds it (a first version that keeps negative dentries
  forever fails here, and the Predict shows why).
- `dd bs=1` reads a message correctly (re-tests the read contract, 1.6 and 2.5).
- `rmmod lantern` while mounted fails ("in use"); `umount` then `rmmod` is clean;
  kmemleak and KASAN are quiet.

### Watch it

**Predict:** `cat /mnt/lantern/99` says "No such file". Then message 99 is written.
Run the same `cat` again: does it work? (Not with the first version: the Librarian
remembers "no" in a negative dentry and never asks lanternfs again. The fix: let
unused dentries go (`.d_delete = always_delete_dentry`, as in libfs's
`simple_dentry_operations`), or tell the dcache when a name appears.)

```
ksh$ mount -t lanternfs none /mnt/lantern
ksh$ grep lanternfs /proc/filesystems
nodev	lanternfs
ksh$ ls -i /mnt/lantern
 21 21   22 22   23 23   24 24   25 25
ksh$ cat /mnt/lantern/24
the harbor is open
```

The Archive's first shelves fill with glowing spines, one per message.

### Debrief

> **The Librarian:** Lovely. And gone the moment the Machine reboots. lanternfs
> lives in memory, like procfs. The Archive wants things that last.
>
> **kblockd** (from below): Then they go through me. To a disk. Whenever you like.
>
> **The Harbormaster:** The card's other half can't wait. The light link, to the
> lighthouse. Come down to the Abyss.

Next: the Packet Abyss (3.18). Side level, any time from here: Down to the Disk
(3.17), with kblockd.

### Hints

1. **Nudge:** `ls` works but `cat` says no such file, or the other way round. Which
   of your functions does each command reach?
2. **Concept:** `ls` calls `getdents64`, which reaches `iterate_shared()`; `cat`
   opens a path, which reaches `lookup()` only on a dcache miss. Both must agree on
   which messages exist; both read the history under RCU.
3. **Point at the spot:** In `lanternfs_lookup()`, the "not found" branch, and the
   dentry operations your superblock uses.

### Codex (chapter: Archive Stacks)

- **VFS objects** (`vfs-objects`, deepens: `vfs`)
  - **Simple:** Superblock, inode, dentry, file: the four things every filesystem
    gives the VFS.
  - **Deep:** `struct super_block` (one per mount of a filesystem instance), `struct
    inode` (a file's identity, size, mode and operations), `struct dentry` (a name
    in a directory, cached), `struct file` (one open, with its position). Filesystems
    fill `super_operations`, `inode_operations`, `file_operations` and
    `address_space_operations`. — https://docs.kernel.org/filesystems/vfs.html —
    `include/linux/fs.h`, `fs/namei.c`, `fs/libfs.c`
- **The dentry cache** (`dcache`)
  - **Simple:** The VFS remembers the names it looked up, even the ones that didn't
    exist.
  - **Deep:** Path walks try the dcache first (RCU-walk, then ref-walk); a miss
    calls the filesystem's `lookup()`. Negative dentries cache "no such file";
    filesystems whose contents change behind the VFS's back use `d_revalidate`,
    `d_delete` or invalidation. `/proc/sys/fs/dentry-state` counts them. —
    https://docs.kernel.org/filesystems/path-lookup.html — `fs/dcache.c`
- **Registering a filesystem** (`file-system-type`, deepens: `filesystems`)
  - **Simple:** A name `mount -t` understands, and the code to make a superblock.
  - **Deep:** `struct file_system_type` with `init_fs_context` (the mount API used
    since 5.x), `kill_sb` and `.owner` (a mounted filesystem pins its module);
    `register_filesystem()` adds it to `/proc/filesystems` (`nodev` if it needs no
    block device). `get_tree_nodev()` makes a new anonymous superblock per mount. —
    https://docs.kernel.org/filesystems/mount_api.html — `fs/super.c`,
    `fs/filesystems.c`

### Real-world card

```sh
cat /proc/filesystems
findmnt
cat /proc/sys/fs/dentry-state
sudo slabtop -o | grep -E 'dentry|inode_cache'
```

Small real filesystems to read next to yours: `fs/ramfs/`, `fs/debugfs/`, and
`Documentation/filesystems/vfs.rst`.

### Taint

- A message's text read after `rcu_read_unlock()` without a reference: +5 (KASAN
  under eviction).
- An inode made with `new_inode()` and not released on an error path: +3.
- No `.owner = THIS_MODULE`: +5 (the module can unload while mounted; the next
  access oopses).

### Fidelity

**Faithful:** the four VFS objects and their operations, the mount API
(`init_fs_context`, `get_tree_nodev`), `/proc/filesystems`, positive and negative
dentries and `always_delete_dentry`, `dir_emit()`, `simple_read_from_buffer()`, the
module reference held by a mount.
**Simplified:** SIMPLIFIED: the lab's VFS is a model: the path walk doesn't
distinguish RCU-walk from ref-walk, there's no inode or dentry reclaim under memory
pressure, and timestamps are the lab's.

### Lab needs

A VFS model with superblocks, inodes, dentries (positive and negative), files and a
dcache with hit and miss events; the mount API for player filesystems
(`register_filesystem`, `init_fs_context`, `get_tree_nodev`, `kill_anon_super`);
libfs helpers (`simple_statfs`, `simple_read_from_buffer`, `generic_read_dir`,
`dir_emit`, `always_delete_dentry`); `mount -t`, `umount`, `ls -i`, `stat`; the
Storage view.

---

## 3.17 — Archive Stacks: down to the disk (optional side level)

- **Id:** `act3-archive-stacks-17-down-to-the-disk` · **Region / NPC:** Archive Stacks / the Librarian, kblockd (the block layer's workqueue), kswapd (cameo) · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `io-vfs-filesystem`, `mem-page-faults`, `dbg-tracepoints`, `drv-error-unwinding` · **Skills unlocked:** `io-page-cache`, `io-block-layer`
- **Starter:** stub · **X-ray:** Storage (page cache and block), Trace

### Scene

> **kblockd:** I carry requests. You give me a request, I give it to the driver,
> and I don't look inside.
>
> **The Librarian:** And above him, me, with the page cache: every page of every
> file anyone read, kept in spare memory. Most `read()`s never reach kblockd at all.
>
> **kswapd:** Until memory runs short. Then I throw your cache out first.
>
> **init:** The Archive needs a disk of its own. For the harbor's log, the Lantern's
> archive.
>
> **kblockd:** Then write a block driver. I'll hand you requests: "read eight
> sectors from here", "write sixteen there". You do them, and you tell me when.

### See it (X-ray)

**Storage view, page cache and block:** `cat harbor.log` on an ext2 filesystem. The
`read()` reaches `filemap_read()`: the file's pages aren't in the page cache, so
**readahead** asks ext2 for this page and the next several; ext2 builds a **bio**
(a starting sector and a list of page segments) and calls `submit_bio()`. **blk-mq**
turns bios into **requests** (merging neighbours), takes a tag, passes the I/O
scheduler (`none` here) and calls the driver's `queue_rq()`. The driver completes the
request; the pages become up to date; `read()` copies from them. The second `cat`:
every page is cached, nothing reaches kblockd.

Then `echo hi >> harbor.log`: the page is changed in the cache and marked **dirty**;
`write()` returns at once. Seconds later (or at `sync`), **writeback** (a flusher
kworker) builds write bios. `echo 1 > /proc/sys/vm/drop_caches` empties the clean
cache, and the next `cat` reads from the disk again.

### Build it

Starter (stub): `lanternblk.c` with includes and empty `blk_mq_ops`; `mkfs.ext2`,
`fsck.ext2` and `lsblk` on the Machine. The player writes a 16 MiB RAM-backed block
driver:

- storage from `vmalloc()`; a dynamic major from `register_blkdev(0, "lanternblk")`;
- a tag set (`.ops`, one hardware queue, depth 64, `NUMA_NO_NODE`) with
  `blk_mq_alloc_tag_set()`; a disk with `blk_mq_alloc_disk(&set, &lim, lb)` (6.18's
  form takes `struct queue_limits`, verify); `major`, `first_minor`, `minors = 1`,
  `fops` (with `.owner`), the name `lanternblk0`, `set_capacity()` in 512-byte
  sectors; then `add_disk()`, whose return value must be checked, with 2.4's `goto`
  unwinding behind every step;
- `queue_rq()`: `blk_mq_start_request()`; position `blk_rq_pos(rq) << SECTOR_SHIFT`;
  check the request fits in the device (`BLK_STS_IOERR` if not); for each segment
  (`rq_for_each_segment()`), map it with `bvec_kmap_local()`, copy to or from the
  store by `req_op()`, `kunmap_local()`; then `blk_mq_end_request(rq, BLK_STS_OK)`;
- exit, in reverse: `del_gendisk()`, `put_disk()`, `blk_mq_free_tag_set()`,
  `unregister_blkdev()`, `vfree()`.

Then `mkfs.ext2 /dev/lanternblk0`, `mount /dev/lanternblk0 /archive`, and `harbor`'s
log (3.6) moves there.

Checker verifies (behavior):
- `lsblk` shows a 16 MiB `lanternblk0`; `mkfs.ext2`, `mount`, writing a 1 MiB file,
  `sync`, `drop_caches` and reading it back gives identical bytes; `fsck.ext2 -n`
  is clean after `umount`.
- Reading a file twice: the second read issues no requests (the player watches
  `block:block_rq_issue`, re-testing 3.9); writes reach the driver only at writeback
  or `sync`.
- A raw read past the end of the device fails with `EIO`, and nothing is corrupted.
- Fault injection: the lab fails one `vmalloc`, then `add_disk()`; each load fails
  cleanly. An injected media error turns into `EIO` in `cat`.
- Parallel readers and writers on two CPUs: no corruption, no KASAN, lockdep or
  "sleeping in atomic" report; `umount` then `rmmod` is clean; kmemleak is quiet.

### Watch it

**Predict:** first, `cat` a 1 MiB file twice: how many read requests reach your
driver the second time? (None.) Then `echo hi >> harbor.log`: how many write
requests reach it before `write()` returns? (None: the page is only marked dirty.)

```
ksh$ lsblk /dev/lanternblk0
NAME        MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
lanternblk0 252:0    0  16M  0 disk /archive
ksh$ echo 1 > /sys/kernel/tracing/events/block/block_rq_issue/enable
ksh$ cat /archive/harbor.log > /dev/null
ksh$ grep -c block_rq_issue /sys/kernel/tracing/trace
3
ksh$ cat /archive/harbor.log > /dev/null
ksh$ grep -c block_rq_issue /sys/kernel/tracing/trace
3
```

(The major number and request count are the lab's: readahead merged the file into
three requests.) The Archive's disk light blinks on the first `cat`, and stays dark
on the second.

### Debrief

> **kblockd:** Requests in, requests out. The disk never knew about files, and I
> never knew about bytes. Everyone did their part.
>
> **The Librarian:** And now the Archive keeps what it's given.

Back to the main path: the Packet Abyss (3.18), or wherever the player left it.

### Hints

1. **Nudge:** `mkfs.ext2` fails, or the file reads back wrong. Which part of each
   request did you copy, and to where?
2. **Concept:** A request starts at sector `blk_rq_pos(rq)` (512 bytes each) and is
   made of segments, each a piece of a page; walk them in order, moving the position
   by each segment's length. Map each with `bvec_kmap_local()`.
3. **Point at the spot:** The byte offset is `blk_rq_pos(rq) << SECTOR_SHIFT`, and it
   advances by `bvec.bv_len` per segment; check it against the capacity before the
   first copy.

### Codex (chapter: Archive Stacks)

- **Readahead** (`readahead`, deepens: `page-cache`)
  - **Simple:** On a miss, the kernel reads the next pages too, guessing you'll want
    them.
  - **Deep:** `filemap_read()` and the fault path call `page_cache_sync_ra()` and
    `page_cache_async_ra()`; the window grows while access stays sequential, up to
    `read_ahead_kb` (`/sys/block/<dev>/queue/read_ahead_kb`, 128 by default). Major
    faults on file mappings (3.4) go through the same path. —
    https://docs.kernel.org/mm/readahead.html (verify) — `mm/readahead.c`,
    `mm/filemap.c`
- **Writeback** (`writeback`)
  - **Simple:** Writes land in memory first; the disk is updated later.
  - **Deep:** Dirty folios (`Dirty:` in `/proc/meminfo`) are written by flusher
    kworkers after `dirty_expire_centisecs` or when `dirty_background_ratio` is
    exceeded; `fsync()`/`sync` force it; a writer that dirties too fast is throttled
    in `balance_dirty_pages()`. — https://docs.kernel.org/admin-guide/sysctl/vm.html —
    `mm/page-writeback.c`, `fs/fs-writeback.c`
- **bio** (`bio`)
  - **Simple:** One block I/O: where on the disk, which pages in memory, read or
    write.
  - **Deep:** `struct bio` holds a starting sector and `bio_vec` segments (page,
    offset, length); `submit_bio()` hands it to the block layer; `O_DIRECT` builds
    bios straight from user pages, skipping the cache. — https://docs.kernel.org/block/biovecs.html
    — `include/linux/blk_types.h`, `block/bio.c`
- **blk-mq** (`blk-mq`)
  - **Simple:** The block layer's queues: requests in, the driver's `queue_rq()`
    out.
  - **Deep:** Per-CPU software queues map to hardware queues; tags bound
    outstanding requests; schedulers (`none`, `mq-deadline`, `bfq`, `kyber`; see
    `/sys/block/<dev>/queue/scheduler`) reorder. `queue_rq()` must not sleep unless
    the tag set has `BLK_MQ_F_BLOCKING`. `drivers/block/brd.c` (RAM disk) and
    `null_blk` are small real examples. — https://docs.kernel.org/block/blk-mq.html —
    `block/blk-mq.c`, `include/linux/blk-mq.h`

### Real-world card

```sh
grep -E '^(Cached|Dirty|Writeback):' /proc/meminfo
cat /sys/block/*/queue/scheduler
sudo modprobe brd rd_nr=1 rd_size=16384      # the kernel's own RAM disk: /dev/ram0
sudo mkfs.ext2 /dev/ram0 && sudo mount /dev/ram0 /mnt
sudo blktrace -d /dev/ram0 -o - | blkparse -i -   # every request, live
echo 3 | sudo tee /proc/sys/vm/drop_caches          # in a VM: empties caches
```

### Taint

- No bounds check before the copy: +5 (KASAN reports the out-of-bounds access on the
  past-the-end read).
- Sleeping in `queue_rq()` without `BLK_MQ_F_BLOCKING`: +5 ("sleeping in atomic").
- `add_disk()`'s result ignored, or a missing step in the unwinding: +3.
- A `bvec_kmap_local()` without its `kunmap_local()`: +3.

### Fidelity

**Faithful:** page cache hits and misses, readahead, dirty pages and writeback timing
rules, `drop_caches`, the bio/request/`queue_rq()` flow and its 6.18 API (verify
`blk_mq_alloc_disk()`), 512-byte sectors, block tracepoints, `lsblk` output, ext2 on
top.
**Simplified:** SIMPLIFIED: the device is RAM; the lab's ext2, readahead window and
flusher timing are models (time compressed); only the `none` scheduler affects order.

### Lab needs

A page cache model with folios, readahead, dirty tracking, writeback and
`drop_caches`; `/proc/meminfo` `Cached`/`Dirty`/`Writeback`; a blk-mq model (bios,
merging into requests, tags, one hardware queue, completion); the block driver API
for player modules (`register_blkdev`, tag sets, `blk_mq_alloc_disk`, `add_disk`,
`rq_for_each_segment`, `bvec_kmap_local`); `block:*` tracepoints; ext2 (`mkfs.ext2`,
`fsck.ext2`, mount); `lsblk`; the Storage view's page cache and block lanes.

---

## 3.18 — Packet Abyss: the light link

- **Id:** `act3-packet-abyss-18-the-light-link` · **Region / NPC:** Packet Abyss / the Harbormaster (TCP/IP), ksoftirqd · **Tracks:** `kernel`, `net` · **Time:** ~20 min · **Prerequisites:** `drv-pci`, `irq-deferred-work`, `net-netfilter-hook`, `sync-memory-ordering` · **Skills unlocked:** `net-napi`
- **Starter:** partial (a new subsystem's boilerplate) · **X-ray:** Network (driver lane, new), Locks and timing

### Scene

> **The Harbormaster:** Every packet your harbor ever sent left through a driver.
> Today you write the receiving half of one. The Lantern card has a light link to
> the lighthouse: two rings of buffers in memory, one each way. The card drops
> each frame into the next free buffer in the receive ring, marks it done, and
> rings the bell.
>
> **ksoftirqd:** A bell per packet? At a hundred thousand packets a second, the CPU
> would do nothing but answer bells.
>
> **The Harbormaster:** So you answer the first bell, then stop the bell. You let
> ksoftirqd's softirq poll the ring: take what's there, up to a budget, and come
> back later if there's more. When the ring is empty, turn the bell back on.
>
> **ksoftirqd:** That's NAPI. Keep to your budget. Everyone else needs the CPU too.

### See it (X-ray)

**Network view, driver lane (new):** a frame from the lighthouse lands in a receive
buffer by DMA; the card sets the descriptor's done bit and raises its MSI (3.15). The
handler masks the card's receive interrupt and calls `napi_schedule()`. In the
`NET_RX` softirq, `net_rx_action()` calls the driver's poll with a **budget** of 64:
for each done descriptor (read after `dma_rmb()`, 3.12's ordering, now against a
device), the driver allocates an `sk_buff`, copies the frame in, sets
`skb->protocol` with `eth_type_trans()` and hands it up with `napi_gro_receive()`:
IP, then TCP, then the harbor's socket, the path from Act I seen from the bottom. It
refills the descriptor and gives it back to the card (`dma_wmb()` first). Fewer
than 64 frames: `napi_complete_done()` and unmask. Exactly 64: return 64 and stay
scheduled; `net_rx_action()` polls again until it has spent `netdev_budget` (300
frames) or 2 ms, then leaves the rest to `ksoftirqd`, which the Judge schedules
like any task.

The `sk_buff` itself: a buffer with `head`, `data`, `tail` and `end`; headroom in
front so lower layers can `skb_push()` headers; `skb_pull()` as each layer consumes
its own.

### Build it

Starter (partial): `lantern_link.c` with the receive ring and its DMA set up
(descriptors from `dma_alloc_coherent()`, buffers mapped, a `lantern_rx_done()`
helper that checks a descriptor's status and issues `dma_rmb()`, a
`lantern_rx_refill()` helper), and the transmit path (`ndo_start_xmit`) done. The
player writes:

- the net device: `alloc_etherdev(sizeof(struct lantern_link))`, `netdev_priv()`,
  `SET_NETDEV_DEV()`, a random MAC with `eth_hw_addr_random()`, `ndo_open` (enable
  NAPI, start the queue, unmask receive interrupts) and `ndo_stop` (the reverse,
  `napi_disable()` waiting for a running poll), `netif_napi_add(ndev, &ll->napi,
  lantern_link_poll)`, then `register_netdev()`, with unwinding and `free_netdev()`;
- in the card's interrupt handler (3.15): on the receive bit, mask receive
  interrupts on the card and `napi_schedule()`;
- `lantern_link_poll(napi, budget)`: while `work < budget` and a descriptor is done,
  build an skb with `napi_alloc_skb()` and `skb_put_data()`, `eth_type_trans()`,
  `napi_gro_receive()`, count it, refill; on allocation failure count a drop and
  still refill (the ring must never stall); then `if (work < budget &&
  napi_complete_done(napi, work))` unmask; `return work`.

Then `ip link set lantern0 up`, `ip addr add 10.77.0.1/24 dev lantern0`.

Checker verifies (behavior):
- `ping` to the lighthouse (`10.77.0.2`) works; `harbor` serves clients on the
  lighthouse over `lantern0` (re-tests 1.9, 1.10), and 2.11's netfilter counter
  counts them.
- A burst of 10,000 frames: every one delivered and counted in `ip -s link`; no poll
  ever returns more than its budget (the `napi:napi_poll` tracepoint, 3.9), no
  "exceeding its budget" warning; the card raised far fewer interrupts than frames.
- Fault injection: skb allocation fails for 100 frames → `rx_dropped` = 100, the ring
  keeps flowing.
- `ip link set lantern0 down` and `rmmod` during the burst: clean, no KASAN, kmemleak
  quiet.

### Watch it

**Predict:** 10,000 frames arrive in one burst. How many interrupts does the card
raise? (A few dozen: one each time NAPI finishes and re-enables them; while polling,
the bell is off.)

```
ksh$ ip -s link show lantern0
4: lantern0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 6e:41:9c:20:7b:11 brd ff:ff:ff:ff:ff:ff
    RX:  bytes packets errors dropped  missed   mcast
       1482000   10000      0       0       0       0
ksh$ grep lantern /proc/interrupts
 24:          0         37  PCI-MSI-0000:00:03.0   0-edge      lantern
```

(Abridged; the TX lines are left out.) A beam of light crosses the Abyss to the
lighthouse and back.

### Debrief

> **The Harbormaster:** The link lives. Yours, on your kernel.
>
> **ksoftirqd:** And within budget. You'd be amazed how many drivers aren't.
>
> **The Harbormaster:** Trouble at the lighthouse, though. Its beacon daemon's
> stuck: it's shouting the same announcement a hundred thousand times a second.
> Down the link, into us. The Storm.
>
> **The Watchdog:** Into _your_ kernel, you can take it. The everyday kernel, the one
> the city runs on, still drives the card with the old driver. And it's evening.

Next: The Stall (3.20). Side level, before or after the boss: The First Gate (3.19),
an XDP gate against the Storm on the player's own kernel.

### Hints

1. **Nudge:** The first burst works, then nothing more ever arrives. Who turns the
   card's receive interrupt back on, and when?
2. **Concept:** NAPI's contract: the interrupt masks and schedules; the poll handles
   at most `budget` frames; only when it handled fewer, and `napi_complete_done()`
   agrees, does it unmask. Returning `budget` means "call me again".
3. **Point at the spot:** The end of `lantern_link_poll()`: the unmask belongs inside
   `if (work < budget && napi_complete_done(napi, work))`, and the return value is
   `work`.

### Codex (chapter: Packet Abyss)

- **Network devices** (`net-device`, deepens: `network-stack`)
  - **Simple:** A driver's face to the network stack: `eth0`, `lantern0`.
  - **Deep:** `struct net_device` with `net_device_ops` (`ndo_open`, `ndo_stop`,
    `ndo_start_xmit`…), allocated with `alloc_etherdev()` and private data from
    `netdev_priv()`; `register_netdev()` makes it appear in `ip link` and
    `/sys/class/net`. — https://docs.kernel.org/networking/netdevices.html —
    `include/linux/netdevice.h`, `net/core/dev.c`
- **Inside an sk_buff** (`sk-buff-anatomy`, deepens: `sk-buff`)
  - **Simple:** A packet buffer with room in front for headers and pointers to each
    layer's part.
  - **Deep:** `head`/`data`/`tail`/`end`; `skb_reserve()` (headroom),
    `skb_put()`/`skb_put_data()` (append), `skb_push()` (prepend a header),
    `skb_pull()` (consume one); page fragments in `skb_shinfo()`; header offsets
    (`skb_network_header()`). — https://docs.kernel.org/networking/skbuff.html —
    `include/linux/skbuff.h`, `net/core/skbuff.c`
- **NAPI** (`napi`, deepens: `softirq`)
  - **Simple:** Take one interrupt, then poll the ring in batches until it's empty.
  - **Deep:** `netif_napi_add()`, `napi_schedule()` from the IRQ handler, `poll(napi,
    budget)` in the `NET_RX` softirq, `napi_complete_done()`. `net_rx_action()` stops
    after `netdev_budget` packets or `netdev_budget_usecs` and defers to
    `ksoftirqd` (`time_squeeze` in `/proc/net/softnet_stat`). Threaded NAPI moves
    polling into a kthread (`/sys/class/net/<dev>/threaded`). —
    https://docs.kernel.org/networking/napi.html — `net/core/dev.c`
- **Receive rings** (`rx-ring`, deepens: `dma`)
  - **Simple:** A circle of buffers the card fills and the driver empties.
  - **Deep:** Descriptors in coherent DMA memory say which buffer belongs to whom;
    the driver reads a "done" bit, then the data (`dma_rmb()` between), and hands a
    buffer back after writing its descriptor (`dma_wmb()` before the ownership
    bit). e1000's `e1000_clean()` is a real, readable example. —
    https://docs.kernel.org/core-api/dma-api.html —
    `drivers/net/ethernet/intel/e1000/e1000_main.c`

### Real-world card

```sh
ip -s link
ethtool -S eth0 | head                         # per-driver counters
cat /proc/net/softnet_stat                     # per CPU: processed, dropped, time_squeeze…
cat /proc/sys/net/core/netdev_budget /proc/sys/net/core/netdev_budget_usecs
sudo bpftrace -e 'tracepoint:napi:napi_poll { @[args->dev_name] = hist(args->work); }'
```

### Taint

- A poll that can return more than `budget`: +5 (the kernel warns).
- Unmasking before `napi_complete_done()` says yes: +3 (a race that can leave NAPI
  scheduled twice or lose a wake-up).
- Giving a descriptor back without `dma_wmb()` before the ownership bit: +3.
- An skb leaked on the drop path: +3 (kmemleak).

### Fidelity

**Faithful:** the `net_device` and NAPI APIs and contract, `net_rx_action()`'s budget
and time limits, `softnet_stat`, skb helpers, `eth_type_trans()`,
`napi_gro_receive()` as the entry point, `ip -s link` output, DMA ordering helpers.
**Simplified:** SIMPLIFIED: the light link is the lab's "Ethernet over light"
(standard Ethernet frames, no PHY or link negotiation); the ring lives in the lab's
model memory; GRO merging isn't modeled; IPv4 only; the transmit path is provided.

### Lab needs

The Lantern card's light link (descriptor rings, DMA into model memory, receive
interrupt bits on the card's MSI) connected to the lighthouse board's network stack;
the `net_device` API, NAPI (`netif_napi_add`, `napi_schedule`, poll budget,
`napi_complete_done`, `net_rx_action` limits, `ksoftirqd` deferral); skb API; `ip
link`/`ip addr`/`ip -s link`, `ping`; `/proc/net/softnet_stat`; the
`napi:napi_poll` tracepoint; traffic bursts and allocation fault injection; the
Network view's driver lane.

---

## 3.19 — Packet Abyss: the first gate (optional side level)

- **Id:** `act3-packet-abyss-19-the-first-gate` · **Region / NPC:** Packet Abyss / the Harbormaster, the Verifier, the Tollkeeper (cameo) · **Tracks:** `kernel`, `net`, `debug` · **Time:** ~15 min · **Prerequisites:** `net-napi`, `dbg-ebpf` · **Skills unlocked:** `net-xdp`
- **Starter:** stub · **X-ray:** Network (XDP), Trace (BPF mode)

### Scene

> **The Tollkeeper:** My gates come after the skb exists. By the time I see a
> packet, the kernel has already paid for it: memory, headers, my time.
>
> **The Harbormaster:** And the Storm doesn't stop. A hundred thousand beacon
> announcements a second. Harbor's clients can barely get a word in.
>
> **The Verifier:** Then put a gate _before_ the Tollkeeper. In the driver, before
> the skb. A program that looks at the raw frame and says drop, or pass. I'll check
> it, as always. Especially every byte you read: a frame is only as long as it is.
>
> **The Harbormaster:** I brought the driver half. You write the gate.

### See it (X-ray)

**Network view, XDP:** in the poll, before `napi_alloc_skb()`, the driver runs the
attached program on the frame (`struct xdp_md`: `data`, `data_end`). Its verdict:
`XDP_DROP` (the buffer goes straight back to the ring, nothing allocated),
`XDP_PASS` (continue: build the skb), `XDP_TX` (send it back out of the same link),
`XDP_REDIRECT` (another device, CPU or an AF_XDP socket), `XDP_ABORTED` (an error,
traced). A cost meter compares dropping a Storm frame here, at the Tollkeeper's gate
(2.11), and at a full socket: the earlier, the cheaper.

### Build it

Starter (stub): **the Harbormaster's patch**, applied with `git am` (2.9b): native
XDP support for the player's `lantern0` (an `ndo_bpf` that installs the program, an
`xdp_rxq_info` registration, and a `bpf_prog_run_xdp()` call in the poll whose
`XDP_DROP` and `XDP_PASS` arms are left empty). The player:

- reads the patch and fills the two arms: on `XDP_DROP`, recycle the buffer and count
  it; on `XDP_PASS`, continue into the skb path from 3.18 (other verdicts go to
  `bpf_warn_invalid_xdp_action()` and are dropped);
- writes `storm_gate.bpf.c`, `SEC("xdp")`: check that the Ethernet header fits before
  `data_end`, that it's IPv4, that the IP header fits (using `ihl * 4`, not a fixed
  20 bytes), that it's UDP, that the UDP header fits; drop UDP to the beacon's port
  4040, count drops in a `BPF_MAP_TYPE_PERCPU_ARRAY`; pass everything else;
- attaches it with `ip link set dev lantern0 xdp obj storm_gate.bpf.o sec xdp` and
  reads the count with `lens bpf` (3.11), summing the per-CPU values.

Checker verifies (behavior):
- During the Storm, `harbor` chat over `lantern0` stays within its latency bound;
  the lab allocates no skb for any Storm frame; the drop count equals the number of
  Storm frames.
- Other UDP and all TCP pass; frames with IP options are parsed correctly; runt
  frames (shorter than an IP header) pass without misreading.
- `ip link set dev lantern0 xdp off` detaches it, and the Storm reaches the stack
  again (2.11's counter and socket drops rise).
- The program loads; init's first sketch (below) is rejected.

### Watch it

**Predict:** init's sketch reads `ip->protocol` right after checking the Ethernet
header, without checking that the IP header fits. Will the Verifier load it? (No:
the read could go past `data_end`, and the Verifier rejects it: "invalid access to
packet" (verify exact wording).)

```
ksh$ ip link set dev lantern0 xdp obj storm_gate.bpf.o sec xdp
ksh$ ip link show lantern0
4: lantern0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 xdp qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 6e:41:9c:20:7b:11 brd ff:ff:ff:ff:ff:ff
    prog/xdp id 42 name storm_gate tag 3b185187f1855c4c
ksh$ lens bpf --map storm_drops
storm_drops  1834112
```

(The id and tag are the lab's; on real Linux a JIT-compiled program also shows
`jited`.) The Storm breaks against the first gate; the harbor's voices come through.

### Debrief

> **The Harbormaster:** Quiet, for once. On your kernel.
>
> **The Watchdog:** On _your_ kernel. The everyday kernel, the one the city runs on,
> still drives the card with the old driver. No gate. And the Storm's still blowing.
>
> **init:** Then that's where the Stall is. Everything you've learned down there,
> bring it.

Next: The Stall (3.20), if not played yet.

### Hints

1. **Nudge:** The Verifier rejects your program at a read from the packet. What did
   you prove about the packet's length before that read?
2. **Concept:** Every packet access must come after a check that the end of what you
   read is ≤ `data_end`, on that path. Header lengths can vary (`ihl`), so check
   again after computing each new offset.
3. **Point at the spot:** Before reading `ip->protocol`: `if ((void *)(ip + 1) >
   data_end) return XDP_PASS;`, and the same for the UDP header at `(void *)ip +
   ip->ihl * 4`.

### Codex (chapter: Packet Abyss)

- **XDP** (`xdp`, deepens: `netfilter-hook`)
  - **Simple:** A BPF program in the driver that decides a packet's fate before the
    kernel builds an skb.
  - **Deep:** Verdicts `XDP_DROP`, `XDP_PASS`, `XDP_TX`, `XDP_REDIRECT`,
    `XDP_ABORTED`. Native mode needs driver support (`ndo_bpf`,
    `bpf_prog_run_xdp()` in the poll); generic mode (`xdpgeneric`) runs after the skb
    exists, on any device; some NICs offload it. Used for DDoS filtering, load
    balancers and AF_XDP. — https://docs.kernel.org/networking/af_xdp.html,
    https://github.com/xdp-project/xdp-tutorial — `net/core/filter.c`,
    `include/net/xdp.h`
- **Packet bounds** (`packet-bounds`, deepens: `bpf-verifier`)
  - **Simple:** Prove the packet is long enough before every read.
  - **Deep:** The verifier tracks `data` and `data_end` and how far each pointer is
    known to be from the end; a comparison against `data_end` widens the safe range
    on that branch only. Variable offsets (IP options) need their own check. —
    https://docs.kernel.org/bpf/verifier.html — `kernel/bpf/verifier.c`

### Real-world card

Use a VM: a wrong XDP drop can cut your own SSH session.

```sh
sudo ip link set dev eth0 xdpgeneric obj storm_gate.bpf.o sec xdp   # generic mode works on any NIC
ip link show eth0
sudo bpftool net show
sudo ip link set dev eth0 xdpgeneric off
# xdp-tools: xdp-loader, xdp-filter; tutorial: github.com/xdp-project/xdp-tutorial
```

### Taint

- Parsing UDP at a fixed 20-byte IP header: +3 (wrong for packets with options).
- Dropping without counting: +1 (silent drops are undebuggable).
- A `bpf_printk()` per packet: +1.
- Leaking the buffer on `XDP_DROP` instead of recycling it: +3 (the ring runs dry).

### Fidelity

**Faithful:** the XDP verdicts, `struct xdp_md`, the bounds-check rule, `ip link …
xdp` syntax and display, native vs generic modes, per-CPU array maps, where XDP runs
in the poll.
**Simplified:** SIMPLIFIED: programs are interpreted (no JIT); native XDP support
arrives as a provided patch; `XDP_TX`, `XDP_REDIRECT` and AF_XDP aren't available;
the Storm's rate is simulated.

### Lab needs

The XDP hook in player drivers (`ndo_bpf`, `xdp_rxq_info`, `bpf_prog_run_xdp`,
verdict handling); XDP program type in the BPF loader and verifier (packet pointer
tracking with real messages); per-CPU array maps; `ip link … xdp obj … sec …` and
`xdp off`; `bpftool net show`; the Storm traffic generator on the lighthouse; skb
allocation counting per frame class; the Harbormaster's patch for `git am`.

---

## 3.20 — The Stall (boss)

- **Id:** `act3-the-stall-20-the-stall` · **Region / NPC:** the whole Core / the Stall (a CPU that never comes back), the Watchdog, every guide (cameos) · **Tracks:** `kernel`, `debug`, `net` · **Time:** ~25 min · **Prerequisites:** `dbg-lockups`, `sync-rcu`, `dbg-ftrace`, `dbg-ebpf`, `net-napi` · **Skills unlocked:** `dbg-stall-diagnosis` (and assesses `dbg-lockups`, `sync-rcu`, `dbg-ftrace`, `dbg-ebpf`, `net-napi`; uses `dbg-perf` if the player has it)
- **Starter:** blank (the old driver's source is content) · **X-ray:** Scheduler, Trace, Network (driver lane), Memory order (RCU)

### Scene

Evening on the everyday kernel, the one the city runs on. The Storm is still
blowing down the light link, into the old `lantern_card` driver's `link0`.

> **The Watchdog:** It's starting. Feel that?
>
> **The Judge:** CPU 1 has stopped coming to court.
>
> **The Grace Keeper:** And it won't answer me.
>
> **The Lookout:** `softirq_entry`, `NET_RX`. Then nothing.
>
> **The Watchdog:** Twenty seconds, the same as every time. Only this time you're
> here, and you know what all of us are saying.
>
> **init:** The old driver's source is in the Archive, beside the old Lantern's.
> Same hand. Find it, prove it, fix it. The smallest fix that's right: the city
> runs on that driver tonight.

### See it (X-ray)

**Phase 1, the freeze, live** (everything the player has learned, at once): the
Scheduler view shows CPU 1 frozen with `harbor` as its current task, interrupted;
nothing on CPU 1's run queue moves, `ksoftirqd/1` included. The Network view's
driver lane shows `link0`'s poll taking frame after frame, and the ring refilling as
fast as it drains. The Memory order view shows a grace period waiting on CPU 1.
After (compressed) time the reports arrive, in the formats from 3.8 and 3.13
(abridged):

```
watchdog: BUG: soft lockup - CPU#1 stuck for 22s! [harbor:533]
Modules linked in: lantern_card
CPU: 1 UID: 0 PID: 533 Comm: harbor Not tainted 6.18.0 #1 PREEMPT(voluntary)
RIP: 0010:lantern_rx_one+0x41/0x120 [lantern_card]
Call Trace:
 <IRQ>
 lantern_link_poll+0x2c/0x90 [lantern_card]
 __napi_poll+0x...
 net_rx_action+0x...
 handle_softirqs+0x...
 __irq_exit_rcu+0x...
 common_interrupt+0x...
 </IRQ>
 <TASK>
 ...
 </TASK>
rcu: INFO: rcu_preempt self-detected stall on CPU
rcu: 	1-....: (21002 ticks this GP) idle=... softirq=.../... fqs=...
```

The snapshot restores.

### Build it

Starter (blank): the everyday kernel's tree with the old `drivers/misc/lantern_card/`
source from the Archive, a replay of the evening (the Storm, the city's traffic), and
the player's whole Watchtower. Nothing tells them where to look.

**Phase 2, the evidence.** On the replay, the player gathers proof with their own
tools (each one is an objective, ticked when the lab sees the tool run and show the
fact):

- function_graph on `lantern_link_poll` (3.9): entered, never returned;
- a BPF program on `napi:napi_poll` (3.11) counting `link0`'s polls and their `work`:
  **zero** during the freeze;
- `/proc/net/softnet_stat` (3.18): CPU 1's `time_squeeze` never moves, because
  `net_rx_action()` never gets control back to check its own limits;
- optional, for players who took the side level 3.10: `perf top -C 1`:
  `lantern_rx_one` and `lantern_link_poll` own CPU 1 (a bonus objective; the boss
  is complete without it).

Then they read the old poll:

```c
static int lantern_link_poll(struct napi_struct *napi, int budget)
{
	struct lantern_card *lc = container_of(napi, struct lantern_card, napi);
	int work = 0;

	while (lantern_rx_pending(lc)) {
		lantern_rx_one(lc);
		work++;
	}
	napi_complete_done(napi, work);
	lantern_link_irq_unmask(lc);
	return 0;
}
```

**Phase 3, the fix.** The smallest correct change, the 3.18 contract: stop at
`budget`; complete NAPI and unmask only if fewer than `budget` frames were handled
and `napi_complete_done()` agrees; return the work done. Then rebuild the everyday
kernel's module and replay the evening.

Checker verifies (behavior):
- The evening replay runs with the Storm at full strength: no soft lockup, no RCU
  stall, no "exceeding its budget" warning.
- `harbor` answers on both CPUs within a degraded but bounded latency; CPU 1's
  `time_squeeze` now rises and `ksoftirqd/1` takes the excess, scheduled by the Judge
  next to `harbor` (3.7).
- Every `napi:napi_poll` event for `link0` has `work ≤ budget`.
- The fix doesn't filter, rate-limit or drop the Storm (that's the next patch's job,
  or the optional 3.19's gate on the player's own driver): the lab counts every Storm frame
  delivered to the stack.
- 100 forced interleavings of the Storm starting, stopping and `ip link set link0
  down`: no oops, no KASAN.

### Watch it

**Predict:** during the freeze, how many `napi:napi_poll` events does your BPF
program count for `link0`? (Zero. The tracepoint fires when a poll _returns_, and
this one never does. Silence is evidence too.)

**Point at it:** in the soft lockup report, the player clicks the CPU, the task that
was interrupted (`harbor`, innocent), the context (`<IRQ>`: a softirq on its way
out of an interrupt), and the driver function that owns the CPU.

> **The Stall** (from the report): I don't break anything. I just keep going.
> Isn't that what you wanted from a driver?
>
> **ksoftirqd:** Not for longer than your budget.

The evening replays with the fix. The Storm still blows, but CPU 1 comes back to
court every few milliseconds; the Watchdog has nothing to count.

### Debrief

> **The Watchdog:** First quiet evening since the reboot.
>
> **The Judge:** CPU 1 shows up on time. ksoftirqd works hard, and waits his turn.
>
> **The Watchdog:** One thing. From tonight, a task stuck in `D` for two minutes
> kills the Machine. `kernel.hung_task_panic = 1`. If it ever hangs again, I want the
> Second Kernel to see it, not me guessing.
>
> **init:** You think it will?
>
> **The Watchdog:** Same hand wrote the rest of that driver.

Next: the Crash Archives (3.21).

### Hints

1. **Nudge:** Every tool says CPU 1 is in the link's poll. What would have to happen
   for the poll to return?
2. **Concept:** NAPI's budget is a promise: handle at most `budget` frames, then
   return, so `net_rx_action()` can share the CPU and hand the rest to `ksoftirqd`.
   A poll that loops "while there's work" never returns under a flood.
3. **Point at the spot:** The `while` condition in `lantern_link_poll()`, the
   unconditional `napi_complete_done()`, and `return 0`.

### Codex (chapter: The Stall)

- **The NAPI budget** (`napi-budget`, deepens: `napi`)
  - **Simple:** A poll may take only so many packets before giving the CPU back.
  - **Deep:** Returning `budget` keeps the NAPI instance scheduled; `net_rx_action()`
    stops after `netdev_budget` packets or `netdev_budget_usecs` and re-raises the
    softirq, which `ksoftirqd` then runs as a normal task. A poll that ignores the
    budget can stall a CPU (soft lockup, RCU stall) under load; one that returns
    more than it was given triggers a warning. Many real driver fixes are about
    exactly this. — https://docs.kernel.org/networking/napi.html — `net/core/dev.c`
    (`__napi_poll()`, `net_rx_action()`)
- **Triage a stall** (`stall-triage`)
  - **Simple:** First ask: is a CPU stuck, or a task?
  - **Deep:** A stuck CPU (soft or hard lockup, RCU CPU stall) shows its stack in the
    report: profile it (`perf top -C`), trace it (function_graph), count around it
    (BPF). A stuck task (hung task, RCU tasks blocked) is asleep: find what it waits
    for and who should wake it, with `echo w > /proc/sysrq-trigger` on a live system
    or a crash dump (3.21). `echo l > /proc/sysrq-trigger` prints every CPU's
    backtrace. — https://docs.kernel.org/admin-guide/sysrq.html,
    https://docs.kernel.org/admin-guide/lockup-watchdogs.html

### Real-world card

```sh
sudo dmesg | grep -E 'soft lockup|rcu.*stall|blocked for more than'
cat /proc/net/softnet_stat                # third column: time_squeeze
sudo perf top -C 1                        # what one CPU is doing, right now
echo l | sudo tee /proc/sysrq-trigger     # backtraces of all active CPUs (needs sysrq enabled)
git log --oneline -i --grep='napi' --grep='budget' --all-match -- drivers/net | head   # in a kernel tree
```

### Taint

- Hiding the Storm instead of fixing the poll (an XDP drop, a rate limit, dropping
  frames in the driver): +5, and caps the ending at the middle one (see Taint).
- `cond_resched()` or any sleep in the poll: +5 ("BUG: scheduling while atomic": a
  poll runs in softirq).
- Completing NAPI after using the whole budget: +3 (breaks the contract; frames wait
  for the next interrupt).
- Rewriting the old driver instead of the minimal fix: +1 (correct, but unreviewable
  as a fix for the city's running kernel).

### Fidelity

**Faithful:** the soft lockup and RCU self-detected stall reports in softirq context,
the interrupted task in the report, `napi:napi_poll`'s timing, `net_rx_action()`'s
limits and the hand-off to `ksoftirqd`, `time_squeeze`, sysrq `l` and `w`.
**Simplified:** SIMPLIFIED: the Storm's rate is set to exceed what one lab CPU can
drain; time is compressed; the old driver is a story artifact whose bug pattern has
many real upstream fixes.

### Lab needs

The everyday kernel as a second boot target with the old `lantern_card` module built
from source the player can patch; the evening replay (Storm plus city traffic) on
demand; the softirq lane able to monopolize a CPU; soft lockup and RCU stall
detectors together; `perf top -C`; the napi tracepoint; `softnet_stat`; sysrq `l`
and `w`; tool-use objectives (the lab notes which facts each tool displayed).

---

## 3.21 — Crash Archives: the Second Kernel (finale)

- **Id:** `act3-crash-archives-21-the-second-kernel` · **Region / NPC:** Crash Archives / the Second Kernel (the kdump capture kernel), the Watchdog, init, every guide (cameos) · **Tracks:** `kernel`, `debug` · **Time:** ~30 min · **Prerequisites:** `dbg-stall-diagnosis`, `sys-kernel-cmdline`, `mem-page-tables`, `proc-scheduler`, `irq-wait-queues` · **Skills unlocked:** `dbg-kdump-crash`, `sync-wakeup-fix` (and assesses `mem-page-tables`, `proc-scheduler`, `sync-memory-ordering`)
- **Starter:** blank (the dump and the old driver's source are content) · **X-ray:** Dump (new), Scheduler, Locks and timing

### Scene

A few nights later, at dusk. The Lantern card calibrates itself every dusk, the way
the old driver always did. Tonight the Machine stops, and it doesn't come back.
`lanternctl` hangs. Then the log, through the Gate:

```
INFO: task kworker/0:2:412 blocked for more than 122 seconds.
      Not tainted 6.18.0 #1
"echo 0 > /proc/sys/kernel/hung_task_timeout_secs" disables this message.
task:kworker/0:2     state:D stack:0     pid:412   tgid:412   ppid:2      flags:0x00004000
Workqueue: events lantern_card_dusk_work [lantern_card]
...
Kernel panic - not syncing: hung_task: blocked tasks
```

(Abridged; check the 6.18 wording of the `task:` line and the panic (verify).)

The screen goes dark. Then a small, unfamiliar boot log scrolls past.

> **The Second Kernel:** …Oh. Hello. I only ever wake up at funerals.
>
> **The Second Kernel:** I've copied everything the first one had: every page that
> mattered, every task, every lock. It's on the disk. Now I'll go back to sleep, and
> the Machine will reboot.
>
> **The Watchdog:** All of it. Not a tail. All of it.
>
> **init:** Then read it. The Machine can't lie in a dump. It can't even move.

### See it (X-ray)

**Dump view (unlocked here):** the frozen Machine, as the vmcore holds it: two CPUs,
both idle; 140-odd tasks with their states; two in `D`. Then how it got here, as the
Boot view replays it: the hung-task detector fires, `hung_task_panic` panics,
`__crash_kexec()` jumps into the reserved region from 3.1 without firmware, the
capture kernel boots with `elfcorehdr=` on its command line, sees the old memory as
`/proc/vmcore` (an ELF file), and `makedumpfile` copies it, leaving out free pages,
cache and user pages, to `/var/crash/`.

### Build it

Starter (blank): after the reboot, the dump in `/var/crash/202610301912/`, the
everyday kernel's `vmlinux` with debug info, the old driver's module and source, and
`crash`. The player investigates (objectives tick when the session shows each fact):

```
ksh$ crash /usr/lib/debug/boot/vmlinux-6.18.0 /var/crash/202610301912/dump.202610301912
crash> sys
      KERNEL: /usr/lib/debug/boot/vmlinux-6.18.0
    DUMPFILE: /var/crash/202610301912/dump.202610301912  [PARTIAL DUMP]
        CPUS: 2
       TASKS: 143
     RELEASE: 6.18.0
       PANIC: "Kernel panic - not syncing: hung_task: blocked tasks"
crash> ps | grep UN
    412      2   0  ffff888004a1c000  UN   0.0       0      0  [kworker/0:2]
    977    801   1  ffff888006b10000  UN   0.0    2304    896  lanternctl
crash> bt 412
PID: 412      TASK: ffff888004a1c000  CPU: 0    COMMAND: "kworker/0:2"
 #0 [ffffc90000213d28] __schedule at ffffffff81c2a1b4
 #1 [ffffc90000213db0] schedule at ffffffff81c2a6e8
 #2 [ffffc90000213dc8] lantern_card_calibrate at ffffffffa0012345 [lantern_card]
 #3 [ffffc90000213de8] lantern_card_dusk_work at ffffffffa00123c0 [lantern_card]
 #4 [ffffc90000213e08] process_one_work at ffffffff810b1234
 #5 [ffffc90000213e50] worker_thread at ffffffff810b1890
 #6 [ffffc90000213ed0] kthread at ffffffff810b8f7a
 #7 [ffffc90000213f28] ret_from_fork at ffffffff81002e0c
```

(Abridged; columns, addresses and frames are the lab's.) The facts to establish:

1. **What killed it:** `sys` and `log`: a hung-task panic, not an oops.
2. **Who is stuck:** `ps` and `foreach UN bt`: the dusk worker, asleep in
   `lantern_card_calibrate()` with no lock wait in its stack; `lanternctl`, asleep in
   `mutex_lock()` inside the card's ioctl.
3. **Who holds what:** `struct mutex` on the card's `cmd_mutex` (after `mod -s
   lantern_card` loads the module's symbols): the owner is task 412, the worker.
4. **What the worker waits for:** `struct lantern_card` at the device's address:
   `cmd_done = true`. The card answered. `irq` shows the card's interrupt fired.
5. **Where `lanternctl`'s request lives:** `vtop -c 977 <its buffer address>` walks
   its page tables (3.3) to the physical page; `rd -p` shows the brightness it asked
   for.

Then the old code, from the Archive:

```c
	mutex_lock(&lc->cmd_mutex);
	WRITE_ONCE(lc->cmd_done, false);
	lc->waiter = current;
	iowrite32(LC_CMD_CALIBRATE, lc->regs + LC_CMD);
	if (!READ_ONCE(lc->cmd_done)) {
		set_current_state(TASK_UNINTERRUPTIBLE);
		schedule();
	}
	mutex_unlock(&lc->cmd_mutex);
```

and in the interrupt handler: `WRITE_ONCE(lc->cmd_done, true);
wake_up_process(lc->waiter);`. If the interrupt arrives after the check and before
`set_current_state()`, the wake-up finds a running task and does nothing; the worker
then sleeps forever, holding the mutex.

**The fix:** a `struct completion cmd_done`, `reinit_completion()` _before_ the
command is written, `wait_for_completion_timeout()` with a timeout (a dead card must
not hang the Machine either), `-ETIMEDOUT` logged and returned; `complete()` in the
handler. (Or the canonical hand-written form: set the state, _then_ check, then
`schedule()`, in a loop; `set_current_state()` includes the barrier that pairs with
the waker, 3.12.)

Checker verifies (behavior):
- The forced interleaving (the interrupt between check and sleep) and 100 others:
  calibration always finishes; no hung task.
- Fault injection: the card never answers; calibration returns `-ETIMEDOUT` within
  its timeout, the mutex is released and `lanternctl` gets an error instead of
  hanging.
- No lockdep, KASAN or "sleeping in atomic" report; kmemleak clean after `rmmod`.
- The five facts were established in the `crash` session (assesses 3.3, 3.7 and
  3.12's skills through the dump).

### Watch it

**Predict:** the worker sleeps in `D`, waiting for the card. In the dump, is
`cmd_done` true or false? (True. The card answered; the wake-up came before the
sleep, and nothing will ever come again.)

> **The Stall** (from the dump): No crash, no corruption, nothing broken. I just
> waited. Is waiting a crime?
>
> **The Watchdog:** For two minutes, it is now.

When the fix is in, dusk replays a hundred times. The calibration finishes every
time; the Crash Archives' shelves light up, each holding a frozen moment the player
can now read.

### Debrief

> **init:** That was the last of the old hand's code. The Lantern, the card, the
> link: all yours now, or fixed by you.
>
> **The Second Kernel:** I'll go back to sleep. Don't wake me without a reason.
>
> **The Watchdog:** And next year, when someone "speeds up" that poll loop again?
>
> **init:** Then something has to fail before the city does. Mainline will know.

Next: the epilogue, Never Again (3.22).

### Hints

1. **Nudge:** The worker is asleep, holding the mutex everyone else wants. What is
   it waiting for, and has that already happened? Look at the device, not the stack.
2. **Concept:** "Check, then sleep" leaves a window where the wake-up can arrive
   first and be lost. Sleep primitives close it: a completion counts a `complete()`
   that comes early; `wait_event()` sets the task state before it checks.
3. **Point at the spot:** The `if (!READ_ONCE(lc->cmd_done))` before
   `set_current_state()`: replace the whole block with a completion that is re-armed
   before the `iowrite32()`.

### Codex (chapter: Crash Archives)

- **kdump** (`kdump`, deepens: `crashkernel`, `pstore-ramoops`)
  - **Simple:** When the kernel dies, a second kernel saves all of its memory.
  - **Deep:** On panic, `__crash_kexec()` boots the capture kernel loaded with `kexec
    -p` into the `crashkernel=` region; it finds the old memory through
    `elfcorehdr=` and exposes it as `/proc/vmcore`, which `makedumpfile` filters and
    saves. pstore (2.1) keeps a log tail; kdump keeps the whole Machine. Hangs can be
    turned into dumps with `hung_task_panic`, `softlockup_panic`, or sysrq `c`. —
    https://docs.kernel.org/admin-guide/kdump/kdump.html — `kernel/crash_core.c`,
    `fs/proc/vmcore.c`
- **vmcore** (`vmcore`)
  - **Simple:** The dead kernel's memory, as a file.
  - **Deep:** An ELF core file (or makedumpfile's compressed format) plus a
    `vmcoreinfo` note giving the tools the kernel's symbols and layout; a
    `[PARTIAL DUMP]` leaves out pages filtered by the dump level. Read it with the
    exact `vmlinux` (with debug info) of the kernel that died. —
    https://docs.kernel.org/admin-guide/kdump/vmcoreinfo.html (verify) —
    `kernel/vmcore_info.c` (verify)
- **The crash utility** (`crash-tool`)
  - **Simple:** A debugger for dead kernels: tasks, stacks, structs and memory.
  - **Deep:** `sys`, `log`, `ps` (`UN` = uninterruptible), `bt`, `foreach UN bt`,
    `struct`, `p`, `rd`, `kmem`, `irq`, `runq`, `vtop` (a page-table walk), `dis -l`,
    `mod -s` (module debug info). Built on gdb; also works on a live system. drgn is a
    scriptable alternative. — https://crash-utility.github.io/,
    https://drgn.readthedocs.io/
- **Lost wake-ups** (`lost-wakeup`, deepens: `wait-queue`)
  - **Simple:** A wake-up that arrives just before the sleep is lost, and the sleep
    lasts forever.
  - **Deep:** Correct sleeping sets the task state _before_ testing the condition
    (`set_current_state()` includes a full barrier that pairs with the waker's), then
    calls `schedule()`, in a loop; `wait_event()` and completions do this for you.
    Many real fixes are titled "fix lost wakeup". —
    https://docs.kernel.org/kernel-hacking/locking.html (verify),
    `Documentation/memory-barriers.txt` ("Sleep and wake-up functions") —
    `include/linux/wait.h`, `kernel/sched/core.c` (`try_to_wake_up()`)
- **Completions** (`completion`)
  - **Simple:** "Wait until this one thing has happened," safe even if it already
    has.
  - **Deep:** `init_completion()`/`reinit_completion()`, `complete()` (callable from
    an interrupt), `wait_for_completion()` and its `_timeout`, `_interruptible` and
    `_killable` forms. Re-arm before starting the work that will complete it. —
    https://docs.kernel.org/scheduler/completion.html — `kernel/sched/completion.c`

### Real-world card

In a VM with kdump set up (3.1):

```sh
echo 1 | sudo tee /proc/sys/kernel/sysrq
echo c | sudo tee /proc/sysrq-trigger          # crash on purpose; the capture kernel saves a dump
ls /var/crash/                                 # after the reboot
sudo apt install crash linux-image-$(uname -r)-dbgsym   # Ubuntu's debug symbols (ddebs)
sudo crash /usr/lib/debug/boot/vmlinux-$(uname -r) /var/crash/*/dump.*
crash> bt
crash> log | tail
crash> ps | grep UN
```

`sudo drgn` gives the same view of a running kernel, scriptable in Python.

### Taint

- A polling loop on `cmd_done` (with `msleep()`) instead of a sleep primitive: +5,
  and caps the ending at the middle one (it hides the race, it doesn't remove it).
- `reinit_completion()` after the command is written: +5 (the same race, moved).
- `wait_for_completion()` with no timeout: +1 (a dead card hangs the Machine again).
- Releasing `cmd_mutex` before the command finishes: +3 (two commands overlap on the
  card).

### Fidelity

**Faithful:** the hung-task message and `hung_task_panic`, the kdump flow (reserved
region, `kexec -p`, `elfcorehdr=`, `/proc/vmcore`, makedumpfile filtering), `crash`'s
command names and output shape, the lost-wakeup pattern and its fixes, the
completion API.
**Simplified:** SIMPLIFIED: the vmcore is a snapshot of the lab's own model, served
by a `crash` subset (`sys`, `log`, `ps`, `bt`, `foreach`, `struct`, `p`, `rd`,
`vtop`, `irq`, `mod -s`, `dis -l`); addresses are consistent within the dump but are
the lab's; the capture kernel's boot is abridged; the race is forced.

### Lab needs

A capture path: panic → kexec into the reserved region → a short capture boot with
`elfcorehdr=` → a saved snapshot of the lab's whole model state as a "vmcore" →
reboot; `kdump-tools`-style messages; `hung_task_panic`; a `crash` subset over the
snapshot (tasks and states, stacks with frames, typed `struct` printing from the lab's
type info, memory reads, `vtop` over the snapshot's page tables, module symbols); the
dusk calibration work item and the forced interrupt timing; the Dump view.

---

## 3.22 — Epilogue: never again

- **Id:** `act3-mainline-22-never-again` · **Region / NPC:** Mainline / the Maintainer, the Loader, init, the Watchdog, the Second Kernel · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `sync-wakeup-fix`, `kdev-patch`, `c-structs-fnptrs` · **Skills unlocked:** `kdev-kunit`
- **Starter:** blank · **X-ray:** Git and patches, Boot

### Scene

> **The Maintainer:** Two fixes. Good ones. How do I know they stay fixed? Next
> year someone "speeds up" that poll loop, and you're not on the list that week.
>
> **init:** A test.
>
> **The Maintainer:** A KUnit test. It runs inside a kernel, in seconds, on every
> change anybody sends. If it can't fail, it isn't a test: show me it fails on the
> old code. Then send me a series: each fix alone, then the tests. With a cover
> letter.
>
> **The Loader:** And when it's merged, I'll start the new kernel. No firmware
> this time. Straight from the old one.

### See it (X-ray)

**Git and patches view** (from 2.9b and 2.13): a series as the Maintainer will read
it: `[PATCH 0/4]` (the cover letter: what the series does and why), then one patch
per logical change, fixes first so they can go to stable on their own, each building
on its own. Then KUnit: `kunit.py` builds a small kernel (User-Mode Linux by default)
with only the tests, runs it, and reads its KTAP output.

### Build it

Starter (blank): the old driver's tree with the player's two fixes. The player:

1. **Makes the logic testable** (a separate refactoring patch): the ring-draining
   loop moves into `lantern_rx_drain(struct lantern_rx_ring *ring, int budget)`, and
   the card's command register is written through a small ops table (1.2's pattern),
   so a test can use a fake ring and a fake card.
2. **Writes `lantern_card_test.c`** with KUnit: `lantern_rx_drain_respects_budget`
   (10 frames, budget 4: returns 4, 6 left, no completion asked);
   `lantern_rx_drain_completes_when_empty` (3 frames, budget 64);
   `lantern_cmd_done_before_wait` (a fake card that completes the command inside the
   register write, before the caller waits: calibration returns 0 and doesn't time
   out). `KUNIT_CASE()`s in a `kunit_suite` named `lantern_card`,
   `kunit_test_suite()`, a `config LANTERN_CARD_KUNIT_TEST` (`tristate`, `depends on
   KUNIT && LANTERN_CARD`, `default KUNIT_ALL_TESTS`) and a `.kunitconfig`.
3. **Proves the tests can fail:** on a scratch branch with each fix reverted, the
   matching test fails.
4. **Sends the series:** `git format-patch --cover-letter -4`, fills the cover
   letter (it starts with `*** SUBJECT HERE ***` and `*** BLURB HERE ***`), runs
   `checkpatch.pl --strict` on every patch, `get_maintainer.pl`, simulated `git
   send-email`. The two fixes carry `Fixes:` and `Cc: stable@vger.kernel.org`.
5. **Warm-starts the Machine** into the merged kernel: `kexec -l` the new image with
   `--reuse-cmdline`, then `kexec -e`.

Checker verifies (behavior):
- The tests pass on the fixed tree, and each fails on the tree with its fix reverted.
- The series applies in order with `git am` on the pre-fix tree, and the kernel
  builds after every patch (bisectable).
- `checkpatch.pl --strict`: 0 errors, 0 warnings on every patch; the fixes carry
  valid `Fixes:` tags and the stable `Cc:`; the refactoring and tests don't.
- The cover letter's placeholders are gone.
- After `kexec -e`, `uname -v` shows the new build, the Boot view shows no firmware
  or GRUB stage, and the Second Kernel is loaded again (`kexec_crash_loaded` is 1).

### Watch it

**Predict:** `kexec -e`. Does the firmware run again? (No. The running kernel shuts
its devices down, loads the new kernel where it can run, and jumps into it. Firmware
and GRUB are skipped, which is also how the Second Kernel woke up in 3.21.)

```
ksh$ ./tools/testing/kunit/kunit.py run --kunitconfig=drivers/misc/lantern_card
[..] Configuring KUnit Kernel ...
[..] Building KUnit Kernel ...
[..] Starting KUnit Kernel (1/1)...
[..] ================== lantern_card (3 subtests) ==================
[..] [PASSED] lantern_rx_drain_respects_budget
[..] [PASSED] lantern_rx_drain_completes_when_empty
[..] [PASSED] lantern_cmd_done_before_wait
[..] ==================== [PASSED] lantern_card ====================
[..] Testing complete. Ran 3 tests: passed: 3
```

(Abridged; `kunit.py` prints timestamps in the brackets.) The Maintainer replies:
"Applied to the fixes branch, thanks! The tests go in next." The patches appear in
the Machine's `git log`.

### Debrief

The Loader starts the warm boot. The Boot view plays from `start_kernel()`, with no
firmware, and every guide of the act appears at their stage: swapper as the idle
loop, the Walker as paging comes up, the Judge with the first run queue, the Grace
Keeper with the first grace period, the Matchmaker as drivers probe, the Librarian
at the first mount, ksoftirqd as the link comes up, the Lookout's lenses, the
Watchdog arming its detectors, the Second Kernel curling up in its room. The final
scene is tinted by Act III's Taint ([Taint](#taint)); the lines below are the
**Steady** ending.

> **init:** The whole Machine. From the first word on the command line to the last
> packet on the link. You've seen all of it, and you can read it when it dies.
>
> **The Watchdog:** Nothing to count.
>
> **The Second Kernel** (half asleep): Don't wake me.

In the **Watchful** ending the Watchdog's line is "I'll keep one eye open." When
**the Stall lingers**, the Boot view stutters once before the prompt, and the
Watchdog says "There. Small, but I felt it." Then the credits roll (the end of v1.0),
and T3 unlocks on the Kernel Map.

### Hints

1. **Nudge:** Your test passes on the old code too. Then what is it testing?
2. **Concept:** A regression test reproduces the bug's condition: a ring with more
   frames than the budget; a command that completes before the caller waits. Fakes
   behind an ops table let a test create those conditions without hardware or
   timing luck.
3. **Point at the spot:** In `lantern_cmd_done_before_wait`, the fake card's
   `write_cmd` must call the completion path itself, before `lantern_card_calibrate()`
   reaches its wait.

### Codex (chapter: Mainline)

- **KUnit** (`kunit`)
  - **Simple:** Unit tests that run inside the kernel, in seconds.
  - **Deep:** `struct kunit_case` with `KUNIT_CASE()`, `struct kunit_suite`,
    `kunit_test_suite()`; `KUNIT_EXPECT_*` and `KUNIT_ASSERT_*`; results in KTAP.
    `tools/testing/kunit/kunit.py run` builds and runs a UML (or QEMU, `--arch`)
    kernel with a `.kunitconfig`. Built-in tests also run at boot; kselftest covers
    the user-space side. — https://docs.kernel.org/dev-tools/kunit/ —
    `lib/kunit/`, `include/kunit/test.h`
- **Patch series** (`patch-series`, deepens: `submitting-patches`)
  - **Simple:** Several patches sent together, each one change, with a cover letter.
  - **Deep:** `git format-patch --cover-letter`; `[PATCH 0/N]` explains the whole;
    each patch builds and works on its own (bisectable); fixes first, tagged
    `Fixes:` and `Cc: stable@vger.kernel.org`, so they can be backported without the
    rest. `b4` prepares and sends series. —
    https://docs.kernel.org/process/submitting-patches.html,
    https://docs.kernel.org/process/stable-kernel-rules.html
- **kexec** (`kexec-reboot`, deepens: `kdump`)
  - **Simple:** Boot a new kernel straight from the running one, skipping firmware.
  - **Deep:** `kexec -l` (`kexec_file_load` with `-s`) loads an image, initramfs and
    command line; `kexec -e` (or `systemctl kexec`) shuts devices down and jumps.
    Fast reboots, and the mechanism kdump uses on panic. Secure Boot's lockdown
    requires signed images. — man 8 `kexec` — `kernel/kexec_core.c`,
    `kernel/kexec_file.c`

### Real-world card

In a kernel tree:

```sh
./tools/testing/kunit/kunit.py run                 # all default tests under UML
./tools/testing/kunit/kunit.py run --kunitconfig=lib/kunit   # one directory's tests
git format-patch --cover-letter -o out/ -4
./scripts/checkpatch.pl --strict out/*.patch
# On a test machine:
sudo kexec -l /boot/vmlinuz-$(uname -r) --initrd=/boot/initrd.img-$(uname -r) --reuse-cmdline
sudo systemctl kexec
```

### Taint

- A fix and a refactoring in the same patch: +3 (stable can't take the fix alone).
- A test that sleeps for real time waiting for the fake card: +1 (slow and flaky).
- Missing `Cc: stable` on a fix for a bug in a released kernel: +1.
- `checkpatch.pl` errors: +3; warnings: +1 each kind (capped).

### Fidelity

**Faithful:** the KUnit API, Kconfig conventions and `.kunitconfig`, `kunit.py` usage
and output shape, KTAP, cover-letter placeholders, series and stable conventions,
`kexec -l`/`-e` semantics.
**Simplified:** SIMPLIFIED: `kunit.py`'s build and UML run are simulated and take
seconds; the review is scripted; kexec's device shutdown is abridged.

### Lab needs

A KUnit runner over player test files (compile, run in the lab's kernel model, emit
KTAP and `kunit.py`'s summary); running tests against reverted trees; `git revert`,
`git format-patch --cover-letter`, bisectable-build checks; `kexec -l`/`-e` with
`--reuse-cmdline` and a Boot view without firmware; the final warm-boot sequence.

---

## T3 — Take it home: the Core on a real kernel (optional)

An optional quest that unlocks after the epilogue. The kit holds the player's own
Lantern (with its tracepoints, RCU history, kthread and `mmap`), the PCI driver for
the card's core, the KUnit tests, `lens`, the `/init` and a test script. It runs in
QEMU (x86-64) with a 6.18 kernel the kit helps build. Never on a machine you depend
on.

| #   | Task                                                   | Success criteria                                                                                                                                |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Boot your own way                                      | QEMU boots with your `/init` in an initramfs; `crashkernel=` is reserved and `kdump-config show` (or `kdumpctl`) says ready                     |
| 2   | `lens` on real Linux                                   | `lens walk`, `lens faults` and `lens sched` (and `lens stat`, if built in 3.10) give plausible numbers and agree with `/proc` (and `perf stat`) |
| 3   | Your PCI driver on QEMU's `edu` device (`-device edu`) | it binds, passes the identification and liveness checks, and counts an interrupt raised through the raise register                              |
| 4   | Watch the Lantern                                      | its tracepoints appear in tracefs; a bpftrace one-liner on `lantern:lantern_write` matches your writes; `perf record` works (if you took 3.10)  |
| 5   | Run your tests                                         | `kunit.py run` passes every test; reverting a fix makes its test fail                                                                           |
| 6   | Read a dead kernel                                     | after `echo c > /proc/sysrq-trigger`, a vmcore is saved; `crash` shows `bt` of the crashing task and the `log`                                  |
| 7   | (optional) A device tree                               | `qemu-system-riscv64 -machine virt,dumpdtb=virt.dtb`, read it with `dtc`, and find which driver bound each `virtio` node                        |

The lamp, sensor and light-link registers exist only in the lab, so the platform
driver, block driver (3.17) and network driver stay in-game; the kit says so. Reward: a
Codex badge. No Taint, no score, nothing is locked behind it. The kit is tested in CI
against the pinned kernel and a pinned QEMU version.

---

## Lab needs (Act III summary)

Act III asks more of the lab than any earlier act. The table groups the needs; each
level's own section has the details.

| Area                   | Needed for           | What the lab must add                                                                                                                                                                                                                                                        |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boot and init          | 3.1, 3.2, 3.21, 3.22 | `update-grub` and persistent command lines; the three parameter passes; `modprobe` reading `/proc/cmdline`; crashkernel reservation; `kexec -p`/`-l`/`-e`; an in-tree build of the Lantern; initcall stages; player initramfs, `MS_MOVE`, `chroot`, PID 1 rules              |
| Memory                 | 3.3–3.5, 3.17        | real per-process 4-level page tables (PTE bits, CR3, PFNs, TLB model); `pagemap`; copy-on-write `fork` replacing the Act I/II copy; demand and zero-page faults; THP for `madvise`; device `mmap` with fault handlers                                                        |
| Threads and scheduling | 3.6–3.8              | `clone3` threads sharing memory, futexes, pthreads in the lab's libc, a race detector; an EEVDF model per CPU (weights, lag, deadlines); affinity, nice, `schedstat`; kthreads; preemption models; soft lockup and hung-task detectors with time compression                 |
| Tracing                | 3.9–3.11, 3.19, 3.20 | tracefs with function and function_graph tracers over the modeled kernel functions; core trace events; `TRACE_EVENT()` for player modules; `perf_event_open` with deterministic sampling; clang's BPF target, a BPF loader, verifier subset and interpreter, maps, `bpftool` |
| Concurrency models     | 3.12, 3.13           | a weak-memory (LKMM/arm64) execution mode and an x86-TSO mode; a KCSAN model; an RCU model (read sections, quiescent states, grace periods, `kfree_rcu`, stalls, lockdep-RCU)                                                                                                |
| Devices                | 3.14, 3.15, 3.18     | a second machine (the arm64 lighthouse board with DT and a GIC); platform bus, deferred probe, `devm`, the LED class; the Lantern card on PCI (`edu`-compatible core, lamp registers, MSI and shared INTx, DMA rings); `bind`/`unbind`, `modprobe.blacklist=`, `pci=nomsi`   |
| Storage                | 3.16, 3.17           | a VFS model with a dcache (negative dentries); the mount API for player filesystems; a page cache with readahead and writeback; blk-mq (bios, requests, tags); ext2 tools; `lsblk`                                                                                           |
| Network                | 3.18–3.20            | `net_device` and NAPI with `net_rx_action` limits and `ksoftirqd` hand-off; skbs; the light link to the lighthouse; the Storm generator; native XDP hook; `ip` and `softnet_stat`                                                                                            |
| Crash analysis         | 3.21                 | panic → capture boot → a vmcore snapshot of the lab's model; a `crash` subset with typed structs, stacks and `vtop`                                                                                                                                                          |
| Testing and process    | 3.22                 | a KUnit runner with KTAP output; running tests on reverted trees; `git format-patch --cover-letter`; bisectable-build checks                                                                                                                                                 |
| Machine                | all                  | Act III's Machine has 2 CPUs (Act II's checkers already use two); the Prologue describes 1                                                                                                                                                                                   |

New X-ray views are listed in [X-ray views](#x-ray-views-new-in-act-iii); the level
schema's `xray` values need extending to match.

## Levels that want a real VM

The owner plans a post-alpha spike on running real Linux in the browser (for example
TinyEMU's RISC-V machine). For each level: what a real VM would give, and what the lab
must simulate if there isn't one. Determinism (LEVELS.md rule 8) is the main cost of
a real VM: forced interleavings need the emulator to run deterministically on
virtual time.

| Level(s)   | A real VM gives                                                                                        | Limits of a TinyEMU-style RISC-V VM                                                                                                   | Without a VM, the lab simulates                   |
| ---------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 3.1, 3.2   | a real early boot, `initcall_debug`, a real initramfs and PID 1                                        | RISC-V boots through SBI firmware (OpenSBI or BBL), not UEFI/GRUB and not the x86 boot protocol; 3.1's x86 path stays drawn           | firmware, GRUB, the parameter passes, initcalls   |
| 3.3–3.5    | real page faults, copy-on-write, `pagemap`, device `mmap`                                              | RISC-V Sv39 has three levels, not x86-64's four: either teach Sv39 there or keep the x86 walk simulated                               | an MMU model with x86 tables                      |
| 3.6–3.8    | the real scheduler, futexes, kthreads, lockup detectors                                                | likely a single CPU (verify): no load balancing, no cross-CPU contention                                                              | EEVDF, threads, lockups                           |
| 3.9–3.11   | real ftrace, perf software events, and above all the **real BPF verifier** (the hardest piece to fake) | no hardware PMU in the emulator; BPF JIT for RISC-V exists, an interpreter fallback is fine                                           | a verifier subset, tracers over modeled functions |
| 3.12       | little: an emulator runs one vCPU at a time in program order, so weak-memory reorderings never appear  | KCSAN would work in an SMP VM with a KCSAN kernel                                                                                     | the weak-memory mode is needed either way         |
| 3.13       | real RCU                                                                                               | needs SMP to show anything interesting                                                                                                | the RCU model                                     |
| 3.14       | **a real device tree on a real RISC-V kernel**: the strongest case                                     | the beacon must be a custom device model added to the emulator                                                                        | the lighthouse board and platform bus             |
| 3.15, 3.18 | a real PCI driver and NAPI driver                                                                      | TinyEMU has VirtIO over MMIO, no PCI (verify); `edu` and the light link need QEMU or custom device models                             | the Lantern card and its link                     |
| 3.16, 3.17 | the real VFS, page cache, blk-mq and ext2: a large simulation saved                                    | a block device backed by browser memory                                                                                               | VFS, page cache, block layer                      |
| 3.19, 3.20 | XDP on a real driver; real stall reports                                                               | generic XDP on virtio-net works; the boss's forced timing is hard on a real VM                                                        | the XDP hook, the Storm, the detectors            |
| 3.21       | a real kdump and vmcore                                                                                | memory for the reserved region; kexec crash support on RISC-V (verify); `crash` (gdb-based) or drgn compiled for the browser is heavy | the capture path and a `crash` subset             |
| 3.22       | built-in KUnit tests run at boot in the VM kernel                                                      | `kunit.py`'s UML runner can't run in a browser                                                                                        | the KUnit runner                                  |
