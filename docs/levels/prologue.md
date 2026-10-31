# Prologue: Power On, and the Machine in Section

Level specs for the Prologue. Read [GAME.md](../GAME.md) for the story and systems and
[LEVELS.md](../LEVELS.md) for the rules every level follows.

**Who it's for:** someone who may not know what a kernel, an operating system, a
process, a file or a terminal really is. Every word is explained in plain words the
first time it appears, with two or three examples on screen, and every comparison
to everyday life says where it stops being true. The words are collected in the
Codex [glossary](#glossary-first-meeting-words).

The Prologue is an act of ten levels, about **3 hours 40 minutes**. It starts
before the kernel: what a computer is made of and what an operating system is for
(P.1). Then the first look inside and a first program (P.2), the shell itself
(P.3), how the Machine starts (P.4), the kernel up close (P.5), how it finds its
hardware (P.6), who runs (P.7), memory (P.8), files, devices and the network (P.9),
and a capstone that uses all of it: bring a stalled Machine fully up (P.10). The
[Surface Survey](surface-survey.md) follows.

**Command chips.** Before P.3, commands come as chips the player clicks or types,
and every chip shows a one-line explanation of its command (`ls /bin`: "list the
folder `/bin`"; `cat /etc/motd`: "show the file `/etc/motd`"). From P.3 on the
player types commands themselves; chips show only a command's name and its one-line
explanation, never its arguments.

| #    | Level id                                              | Title                  | Time    | Skills unlocked                                    |
| ---- | ----------------------------------------------------- | ---------------------- | ------- | -------------------------------------------------- |
| P.1  | `prologue-boot-path-01-power-on`                      | Power On               | ~15 min | `sys-computer-basics`                              |
| P.2  | `prologue-boot-path-02-first-words`                   | First Words            | ~20 min | `sys-user-kernel-mode`                             |
| P.3  | `prologue-boot-path-03-speak-to-shell`                | Speak to the Shell     | ~20 min | `sys-shell-basics`                                 |
| P.4  | `prologue-boot-path-04-the-boot-path`                 | The Boot Path          | ~20 min | `sys-boot-chain`                                   |
| P.5  | `prologue-machine-in-section-05-kernel-up-close`      | The Kernel Up Close    | ~20 min | `sys-kernel-role`                                  |
| P.6  | `prologue-machine-in-section-06-finding-the-hardware` | Finding the Hardware   | ~25 min | `drv-hardware-discovery`                           |
| P.7  | `prologue-machine-in-section-07-who-runs`             | Who Runs               | ~20 min | `proc-process-basics`                              |
| P.8  | `prologue-machine-in-section-08-pages-and-maps`       | Pages and Maps         | ~25 min | `mem-virtual-memory-basics`                        |
| P.9  | `prologue-machine-in-section-09-files-doors-wires`    | Files, Doors and Wires | ~25 min | `io-everything-is-a-file`, `sys-kernel-subsystems` |
| P.10 | `prologue-machine-in-section-10-bring-it-up`          | Bring the Machine Up   | ~30 min | `sys-command-lifecycle`                            |

The built level `packages/levels/content/0-prologue/1-boot-path/02-first-words` (id
`prologue-boot-path-02-first-words`) is **P.2 First Words** (the first syscall and
`hello.c`); saves from its old id are migrated. P.1 Power On is new.

**Regions (Kernel Map and Codex chapters):** `boot-path` "First Boot" (P.1–P.4) and
`machine-in-section` "The Machine in Section" (P.5–P.10, with P.10 as the region's
capstone). Then the `surface-survey` region (S.1–S.5). "Speak to the Shell" was S.1
of the Survey; it is now P.3, in the First Boot region and its Codex chapter, so the
player can type every command from the boot path on.

## Placement check (The Machine in Section)

Players who already know how a kernel is put together can skip P.5–P.9. P.1–P.4 and
the P.10 capstone are never skipped. At the edge of the Machine in Section, after
P.4, init offers: "You've seen inside a machine before? Show me, and go straight to
the stalled one."

- **Format:** about 8 minutes, five small tasks, one per level, each checked by what
  the Machine does. No trivia, no timer.
  1. **P.5:** complete `myuname.c` so it prints the kernel name, release and CPU
     type; it must make the `uname` syscall.
  2. **P.6:** read the disk's `driver` link in `/sys`, then fix the lighthouse
     board's `.dts` so its lamp binds in the board panel.
  3. **P.7:** complete `whoami.c` so it prints its own PID and its parent's, and run
     it twice.
  4. **P.8:** complete `where.c` so it prints a local variable's address, and point
     at the `[stack]` line of its maps that holds it.
  5. **P.9:** with `look.c`, read one file each from ext4, procfs and sysfs.
- **Result:** each task maps to one level. Passing places the player past it: its
  skills light up marked "placed", and its Codex cards are filed marked "filed by
  placement" (readable in full, with a link to replay the level). A failed task
  sends the player to just that level. The check can be retaken any time, and placed
  levels stay playable from the map.
- **Taint:** none.

**New skills** (to add to [CURRICULUM.md](../CURRICULUM.md)):

| Id                           | The player can…                                                                                                                                      | Needs                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `sys-computer-basics`        | name a computer's parts (CPU, memory, storage, devices), say what an operating system does and what its kernel is, and tell a program from a process | —                                         |
| `sys-user-kernel-mode`       | (unchanged) explain user mode vs kernel mode, and that a syscall is how a process asks the kernel for anything                                       | `sys-computer-basics`                     |
| `sys-shell-basics` (updated) | say what the prompt, a command, arguments and options are; find help with `man`; complete names with Tab; read the environment; explain `PATH`       | `sys-user-kernel-mode`                    |
| `sys-boot-chain` (updated)   | describe the boot chain (firmware, bootloader, kernel, initcalls, initramfs, root, PID 1), choose a boot entry and change the kernel command line    | `sys-shell-basics`                        |
| `sys-kernel-role`            | say what a kernel owns and why programs must ask it; explain monolithic with modules, kernel vs distribution, and mainline, stable and LTS           | `sys-user-kernel-mode`                    |
| `drv-hardware-discovery`     | say how Linux finds hardware (ACPI and PCI on x86, a device tree on most ARM and RISC-V boards), read a device in `/sys`, and explain driver binding | `sys-kernel-role`                         |
| `proc-process-basics`        | list processes and kernel threads, read a process's PID, parent and state in `/proc`, and say how the scheduler shares a CPU                         | `sys-kernel-role`                         |
| `mem-virtual-memory-basics`  | explain physical vs virtual memory, pages and page tables, read `/proc/meminfo` and `/proc/<pid>/maps`, and say what the page cache is               | `proc-process-basics`                     |
| `io-everything-is-a-file`    | explain how the VFS gives disk files, `/proc`, `/sys` and devices one `open`/`read`/`write` interface                                                | `drv-hardware-discovery`                  |
| `sys-kernel-subsystems`      | name the kernel's major parts, the source folder of each, a command that shows it, and the map region that teaches it                                | `io-everything-is-a-file`                 |
| `sys-command-lifecycle`      | trace one command from the shell through the kernel's parts to the hardware and back, and troubleshoot a boot from its messages                      | `sys-kernel-subsystems`, `sys-boot-chain` |

**Where it leads:** init's shell is the Machine's real bash. P.3 teaches the player
to speak to it, the Surface Survey walks the city with it and teaches its tools
(redirection, pipes) with their real traces, and Act I has the player write a shell
of their own: `ksh-lite`. The whole path is in [LEVELS.md](../LEVELS.md#4-the-journey).

**Kept for later:** how a syscall travels inside the CPU (on this 32-bit Machine the
number in `eax`, the arguments in `ebx`, `ecx`, `edx`, `esi`, `edi`, `ebp`, the
syscall table, `-errno` turned into `errno`) is taught at the Syscall Gate (1.B),
after the player has used `errno` (1.4).
Compiler warnings are taught, and count as Taint, from 1.3. Page tables, the
scheduler's internals and the networking data path stay overviews here; Acts II
and III go deep.

**The Machine.** Every level runs on one real machine: v86 emulating a 32-bit PC in
the player's browser. Level text quotes what it prints, never another Linux's output;
`packages/levels/src/test/machine-facts.json` holds its outputs (`pnpm vm:facts`).

- **CPU and memory:** one CPU (`nproc` is 1, a "Pentium III (Katmai)", i686, with
  PAE), 256 MiB of RAM, of which Linux sees about 218 MiB (`MemTotal: 223620 kB`).
  3 GiB of each process's addresses are its own (up to `0xbfffffff`), the top 1 GiB
  the kernel's; page tables have 3 levels (PAE); ASLR is on.
- **Firmware and boot:** SeaBIOS (a legacy BIOS, no UEFI). v86 loads the kernel
  itself; the command line is `console=ttyS0 rw tsc=reliable mitigations=off
  random.trust_cpu=on log_buf_len=128K quiet`. Levels usually start from a saved
  boot. GRUB on the data disk is planned for P.4 and P.10.
- **Linux:** Alpine Linux v3.24 (musl and BusyBox, so not "GNU/Linux"), kernel
  `6.18.59-0-virt`, `#1-Alpine SMP PREEMPT_DYNAMIC`, hostname `kernelfall`. `/boot`
  holds `vmlinuz-virt`, `config-6.18.59-0-virt` and `System.map-6.18.59-0-virt`.
- **PCI:** `00:00.0` 440FX host bridge (`8086:1237`), `00:01.0` PIIX3 ISA bridge
  (`8086:7000`), `00:06.0` virtio 9P transport (`1af4:1049`, the root filesystem),
  `00:0a.0` virtio network card (`1af4:1041`, `virtio_net`, as `eth0`, down, no
  cable behind it), `00:12.0` VGA (`1234:1111`), `00:1e.0` PIIX3 IDE (`8086:7010`,
  `ata_piix`). Interrupts go through the old XT-PIC.
- **Storage:** the root filesystem `/` is 9p from the host (`host9p`), not a disk.
  The one disk is an 8 MiB IDE disk, `/dev/sda` (major 8) with an ext4 partition
  `/dev/sda1`, not mounted at boot. No udev or mdev: device files are made by
  devtmpfs, owned by root.
- **Modules loaded:** `9p`, `9pnet_virtio`, `9pnet`, `netfs`, `ext4`, `jbd2`,
  `mbcache`, `crc16`, `sd_mod`, `virtio_net`, `net_failover`, `failover`; the rest
  ship as `.ko.gz` files.
- **The player:** `you` (uid 1000, home `/home/you`), in bash 5.3 on `/dev/ttyS0`,
  as PID ~474 with PPid 1. `PATH` is
  `/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`. `/bin/ls`, `cat`,
  `sh` and most tools are BusyBox (symlinks to `/bin/busybox`) and print its
  messages (`cat: can't open '/etc/shadow': Permission denied`). A missing command
  prints `-bash: x: command not found`, status 127.
- **Syscalls (musl, i386):** `int $0x80` or `sysenter` through the vDSO; `open`
  (never `openat`), `fork`, `pipe`, `statx`, `writev` for stdio, `sendfile64` for
  `cat`, `clock_nanosleep_time64` for `sleep`.

Kernel source paths below follow Linux 6.18 (LTS). Anything marked "(verify)" must
be checked before the level ships.

## Glossary (first-meeting words)

A Codex page, always open, that grows as the player meets each word. Each entry is
the plain-words line below, its examples, the level that introduces it and a link
to its card. Levels use a word only after this line has been shown.

| Word                   | In plain words                                                                                             | Examples on screen                                                         | First met |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------- |
| CPU                    | the chip that carries out instructions: add, compare, copy, jump, billions of them a second                | a laptop's processor; a phone's; the Machine's one CPU                     | P.1       |
| memory (RAM)           | fast storage for what is running right now; emptied when the power goes off                                | an open document; a running game's level; the Machine's 256 MiB            | P.1       |
| storage (disk)         | slower storage that keeps files when the power is off                                                      | an SSD; a USB stick; the Machine's disk `sda`                              | P.1       |
| device                 | any piece of hardware besides the CPU and memory                                                           | keyboard, screen, network card, disk                                       | P.1       |
| byte                   | the unit memory is counted in: room for one number from 0 to 255; text is stored as such numbers           | in UTF-8 `h` is 104, one byte; `é` takes two; 256 MiB is about 268 million | P.1       |
| operating system (OS)  | the software that runs the computer for every other program: starts them, shares the hardware, keeps files | Windows, macOS, Android, Ubuntu                                            | P.1       |
| kernel                 | the core of the OS: the one part with full control of the hardware, which every program must ask           | Linux (in Android and Ubuntu), the Windows NT kernel, XNU in macOS         | P.1       |
| program                | instructions saved in a file, waiting to be run                                                            | `/bin/echo`, `/bin/ls`, a game you installed                               | P.1       |
| process                | a program while it is running, with its own memory and a number (its PID)                                  | the shell; `echo` while it prints; you                                     | P.1       |
| file                   | a named piece of data kept in the tree of folders                                                          | `/etc/motd` (a message), `/bin/ls` (a program), a photo                    | P.1       |
| directory (folder)     | a file that lists other files by name                                                                      | `/bin`, `/etc`, `/home/you`                                                | P.1       |
| terminal               | a window for typing text commands and reading text answers                                                 | this game's terminal; Terminal on macOS; a Linux console                   | P.1       |
| shell                  | the program in the terminal that reads your command and runs it                                            | bash, the Machine's shell; zsh                                             | P.1       |
| command                | one line you type: a program's name and what it should work on                                             | `echo hello`; `ls /bin`; `cat /etc/motd`                                   | P.1       |
| boot                   | starting a computer, from power on until programs run                                                      | switching on a laptop; a phone restart; the Machine's reboot               | P.1       |
| syscall (system call)  | a request a program makes to the kernel, with a special CPU instruction                                    | `write` (show text), `open` (open a file), `execve` (start a program)      | P.2       |
| user mode, kernel mode | the CPU's two levels of permission; programs run limited, the kernel unlimited                             | `echo` runs in user mode; the kernel's `write` code in kernel mode         | P.2       |
| file descriptor (fd)   | a small number a process uses for something it has open                                                    | 0 your typing, 1 normal output, 2 error messages                           | P.2       |
| standard output        | fd 1, where a program's normal output goes; here, your terminal                                            | what `echo` prints; what `ls` lists                                        | P.2       |
| prompt                 | the text the shell prints when it's your turn to type                                                      | `$ ` (an ordinary user); `# ` (root)                                       | P.3       |
| argument               | each word after the command's name, telling the program what to work on                                    | `/etc` in `ls /etc`; `hello` in `echo hello`                               | P.3       |
| option                 | an argument starting with `-` that changes how the program works                                           | `-l` in `ls -l`; `-a`; `-n 3` in `head -n 3`                               | P.3       |
| environment, variable  | a list of `NAME=value` settings every process gets from its parent; each entry is a variable               | `HOME=/home/you`; `USER=you`; `SHELL=/bin/bash`                            | P.3       |
| `PATH`                 | the variable listing the folders the shell searches for a command                                          | six folders, from `/usr/local/sbin` to `/bin`                              | P.3       |
| source code, compiler  | the text of a program as a person writes it; the tool that turns it into a program file the CPU can run    | `hello.c`; gcc, on the Machine; clang                                      | P.2       |
| firmware               | software stored on the computer's board that runs first at power on                                        | the Machine's SeaBIOS (a BIOS); a laptop's UEFI                            | P.4       |
| bootloader             | the small program firmware starts; it loads the kernel                                                     | GRUB; systemd-boot; U-Boot on small boards                                 | P.4       |
| partition              | a part of a disk, set aside to hold its own filesystem                                                     | `sda1`, the one partition on the Machine's disk                            | P.4       |
| filesystem, mount      | the way files and folders are laid out on a disk; to mount is to attach one into the folder tree           | ext4 on `sda1`; a USB stick mounted at `/media/usb`                        | P.4       |
| signal                 | a short notice the kernel delivers to a process; some end it                                               | `SIGSEGV` (bad memory access); `SIGINT` (Ctrl-C); `SIGTERM` (please stop)  | P.5       |
| module                 | a piece of the kernel kept in a file and added while it runs                                               | `virtio_net.ko` (a network driver); `vfat.ko` (a filesystem)               | P.5       |
| distribution           | Linux plus everything around it: init, shell, tools, a way to install software                             | Debian, Fedora, Ubuntu; Alpine, the Machine's                              | P.5       |
| driver                 | the part of the kernel that knows how to operate one kind of device                                        | `virtio_net` (network card); `ata_piix` (disk); the tty driver (terminal)  | P.6       |
| bus                    | the wiring and rules that connect devices to the CPU                                                       | PCI (cards inside a PC); USB; I²C on small boards                          | P.6       |
| register (of a device) | a small slot in a device that a driver reads or writes to control it                                       | "start sending"; "how many bytes arrived"; "lamp on"                       | P.6       |
| interrupt              | a device's signal to the CPU: stop and deal with me now                                                    | a key pressed; a packet arrived; a timer went off                          | P.6       |
| kernel thread          | a worker of the kernel's own, run by the scheduler like a process, but only running kernel code            | `kswapd0`, `ksoftirqd/0`, `kthreadd`                                       | P.7       |
| scheduler              | the part of the kernel that decides which process runs on each CPU, and for how long                       | three `yes` programs on one CPU; you waiting while init runs               | P.7       |
| memory address         | the number of one byte of memory; a process's addresses are its own (virtual), not the RAM's               | `0x004a6000`; `0xbff3e000`                                                 | P.8       |
| page                   | a 4 KiB block of memory, the unit the kernel hands out and maps                                            | one page of a program's code; one page of a file in the cache              | P.8       |
| cache                  | a copy kept close by, so the next use is faster                                                            | the page cache (file contents in RAM); a CPU's caches; a browser cache     | P.8       |
| socket                 | a file descriptor for talking over a network                                                               | a web browser's connection; a chat client; `harbor` (1.9)                  | P.9       |

## The kernel's parts and the Kernel Map

P.9 completes this table on screen: the Section drawing labels every part with the
region of the Kernel Map that teaches it. "Every region of the map is one of these
parts."

| Part                             | Source                                                          | Shown in the Prologue with                    | Map region (levels)                                                                                  | Guide                            |
| -------------------------------- | --------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------- |
| Boot and init                    | `arch/x86/boot/`, `init/`                                       | the GRUB menu, `/proc/cmdline`, `dmesg` (P.4) | First Boot (P.1–P.4); The Forge (2.1); First Light (3.1–3.2)                                         | init, the Watchdog               |
| Hardware discovery, driver model | `drivers/base/`, `drivers/acpi/`, `drivers/pci/`, `drivers/of/` | `lspci -k`, `/sys/bus`, a device tree (P.6)   | Device Quarter (2.4–2.7); Bus Yards (3.14–3.15)                                                      | udev                             |
| Syscall interface                | `arch/x86/entry/`                                               | X-ray's syscalls view (P.2)                   | The Syscall Gate (1.B)                                                                               | the Gatekeeper                   |
| Processes and signals            | `kernel/fork.c`, `kernel/exit.c`, `kernel/signal.c`             | `ps -e`, `/proc/<pid>/status` (P.7)           | Process District (1.4–1.8)                                                                           | init                             |
| Scheduler                        | `kernel/sched/`                                                 | three programs sharing one CPU (P.7)          | Process District (1.8); Clockwork Court (3.6–3.8)                                                    | —                                |
| Memory                           | `mm/`, `arch/x86/mm/`                                           | `/proc/meminfo`, `/proc/<pid>/maps` (P.8)     | Slab Mines (2.8a–b); Page-Table Labyrinth (3.3–3.5)                                                  | kswapd                           |
| VFS and filesystems              | `fs/`                                                           | one `read` on ext4, procfs and sysfs (P.9)    | Surface Survey; Into the Archive (1.6); The Aqueducts (1.7, `fs/pipe.c`); Archive Stacks (3.16–3.17) | init                             |
| Devices and drivers              | `drivers/`                                                      | `/dev`, major and minor numbers (P.9)         | Device Quarter (2.4–2.7)                                                                             | udev                             |
| Interrupts, timers, softirqs     | `kernel/irq/`, `kernel/time/`, `kernel/softirq.c`               | `/proc/interrupts` (P.6)                      | Interrupt Spire (2.10a–c)                                                                            | ksoftirqd                        |
| Locking                          | `kernel/locking/`                                               | a picture: two processes, one counter (P.7)   | Lock Cathedral (2.9, 2.9b); Grace Halls (3.12–3.13)                                                  | the Verger                       |
| Networking                       | `net/`, `drivers/net/`                                          | `/sys/class/net`, `/proc/net/dev` (P.9)       | Socket Harbor (1.9, 1.10); Netfilter Wall (2.11); Packet Abyss (3.18–3.19)                           | the Harbormaster, the Tollkeeper |
| IPC                              | `ipc/`, `fs/pipe.c`, `kernel/signal.c`                          | one line (P.9)                                | The Aqueducts (1.7), Alarm Bells (1.8)                                                               | —                                |
| Security                         | `security/`, `fs/namei.c` (permission bits)                     | `Permission denied` (S.2)                     | Surface Survey (S.2); The Syscall Gate (1.B)                                                         | —                                |
| Modules                          | `kernel/module/`                                                | `/lib/modules`, `/proc/modules` (P.5)         | Module Docks (2.2, 2.3)                                                                              | the Dockmaster                   |
| Logging                          | `kernel/printk/`                                                | `dmesg` (P.4, P.9)                            | Module Docks (2.2)                                                                                   | —                                |
| Build system                     | `Makefile`, `Kconfig`, `scripts/`                               | the release string in `uname -r` (P.5)        | The Forge (2.1)                                                                                      | the Compiler Smith               |
| Headers and the user-space API   | `include/`, `include/uapi/`                                     | `#include <unistd.h>` (P.2)                   | Compiler's Quarter (1.0–1.3)                                                                         | the Compiler Smith               |
| Development process              | `Documentation/`, `MAINTAINERS`                                 | mainline, stable and LTS (P.5)                | Mainline (2.13)                                                                                      | the Maintainer                   |
| Tracing                          | `kernel/trace/`                                                 | —                                             | Watchtower (3.9–3.11)                                                                                | —                                |

The guides who live in the Deep can't come up yet. From P.5 on they appear on init's
old drawing ("Section of the Machine, before the Kernelfall") with one line each,
naming the part they stand for. udev is the exception: it is a program in
Userland that reacts to the kernel's device announcements, and the drawing says so.

---

## P.1 — Power On

- **Id:** `prologue-boot-path-01-power-on` · **Region / NPC:** the Machine, from the outside, then init's house / the Watchdog, init · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** none · **Skills unlocked:** `sys-computer-basics`

No code and no syscalls yet. The player learns what a computer is made of, what an
operating system is for, what the kernel is, and walks the file tree from `/` down
to `/proc`, where the kernel answers for itself.

### Scene

The screen is black, except for a drawing of a power button. The player presses it
(**the first thing happens within seconds**): a fan spins up, and the Machine draws
itself in outline, part by part, as it starts. Lines of text scroll past too fast to
read ("You'll read these properly soon"). Near the end, one burnt, garbled line
flashes: `...fade...` and `Kernel panic - not syncing`, and a shadow (the Dangling)
slips out of frame. Then a voice.

> **The Watchdog:** Tick. Tick. Oh good, something's awake. You. You're new.
>
> **The Watchdog:** I'm the Watchdog. A timer, really. If nobody resets me in time, I restart the whole Machine. Last night I had to.
>
> **The Watchdog:** The core of the Machine crashed. Everything stopped mid-step. We call that night the Kernelfall. I restarted us, and... well. Look around.
>
> **init:** Easy, old dog. Hello, little one. I'm init. I'm the first program the Machine ran today, and I look after everyone who runs after me. Including you.
>
> **init:** Here's the plan. The core that crashed is called the _kernel_, and together we're going to bring it back, part by part. You can't fix what you've never seen, so tonight you'll just look around.
>
> **init:** You don't know what any of this is yet. That's fine. First what a computer is made of, then a walk through the Machine's folders, top to bottom, until we reach the kernel itself.

### See it

The **Section drawing** (a cutaway of the Machine, like a page from a service
manual) is shown from the outside. It lights one part at a time.

**Part 1: what a computer is made of.** Four kinds of parts, each with examples:

- the **CPU**, the chip that carries out instructions (add these, compare those,
  copy this there), millions a second even in the Machine. It has one, so it runs
  one program at a time and switches between them so fast they seem to run at once;
- **memory (RAM)**, fast storage for whatever is running right now. It forgets
  everything when the power goes off. The Machine has 256 MiB, room for about 268
  million **bytes**. One byte holds one number from 0 to 255; text is stored as
  numbers by an encoding: in UTF-8 `hello` is five bytes, and `é` takes two;
- **storage**, a disk or SSD, slower, which keeps **files** when the power is off;
- **devices**: everything else. The keyboard, the screen, the network card, the
  disk itself.

A phone, a laptop and the Machine all have these four.

**Part 2: what an operating system is for.** Many programs want the same CPU, memory
and devices at once. The **operating system** (OS) is the software that runs the
computer for all of them. It:

- starts programs and stops them;
- shares the CPU and memory between them, and keeps them out of each other's way;
- keeps files in folders;
- talks to the devices, so programs don't each need to know every keyboard and disk.

Windows, macOS and Android are operating systems; so are Ubuntu and the Machine's
own, Alpine Linux.

**Part 3: the kernel.** The **kernel** is the core of the operating system: the one
part with full control of the hardware. Every other program has to ask it for what
it needs. **Linux** is a kernel; Android, Ubuntu and the Machine all run it.

> **init:** Think of a city's public works. You don't dig up the street to get water: you ask, and they open the valve.

Where the picture stops being true (shown on the card): public works is a crew that
is always busy somewhere. The kernel isn't a separate worker running beside your
program: it is code that runs only when something calls on it (a program's
request, a device needing attention, a timer). Between those moments, the CPU runs
your program, not the kernel.

**Part 4: programs and processes.** A **program** is instructions saved in a file,
waiting: `/bin/ls`, `/bin/cat`, a game you installed. A **process** is a program
while it runs, with its own memory and its own number, a **PID** (process ID).

> **init:** A program is a recipe. A process is someone cooking from it right now. Two cooks can follow the same recipe at the same time: one program, two processes.

Where it stops being true: a process doesn't do the work itself; the CPU does,
switching between processes many times a second. And a process owns more than a
recipe card: memory, open files, a number. init is a process (PID 1). So are you.

**Part 5: the file tree.** Linux keeps every file in one tree of folders whose top,
the **root**, is written `/`. A path like `/etc/motd` means: start at `/`, go into
`etc`, take the file `motd`. Each top folder has one job: `/bin` programs, `/etc`
settings as plain text, `/home` each person's folder (`/home/you`). Two are
strange: `/dev` shows devices as files (write to the terminal's file and the text
appears), and `/proc` holds nothing stored anywhere: the kernel writes each answer
when it is read. Where it stops being true: the Machine has no disk of its own; its
files come from the game through a virtio share, so `/dev` shows no disk (a laptop
has `sda` or `nvme0n1`).

**Part 6: the terminal, the shell and commands.** The **terminal** is a window for
typing text and reading text back (this game's terminal; Terminal on a Mac; the
console of a Linux server). Inside it runs a **shell**, a program that reads each
line you type and runs the program you named. The Machine's shell is `bash`. That line is a **command**: the
program's name, then what it should work on.

### Build it

The player walks the Machine's file tree in bash, from the top down to the kernel.
Each command is offered as a chip carrying a one-line explanation; the player may
type it or click it.

- **Starter provides:** bash, open in `/home/you`, and chips for each command below.
- **Player does:**
  - Name their process (the name init will call them by).
  - `echo hello`, then `echo` with their own words: the shell's builtin.
  - `ls /`: the root, the top of the tree.
  - `ls /bin`: the programs; most are links to BusyBox, which does each job by the
    name it is called with.
  - `cat /etc/motd` and `cat /etc/hostname`: settings files, plain text.
  - `ls /dev`: devices as files; `ttyS0` is the terminal's line.
  - `cat /proc/version`: the kernel writes its own version as `cat` reads.
  - `pwd` (a chip, no objective): the folder they are in.
- **Checker verifies (behavior):**
  - `echo` printed `hello`, and other words.
  - `ls` listed `/`, `/bin` and `/dev`.
  - `cat` read `/etc/motd`, `/etc/hostname` and `/proc/version` to the end.

### Watch it

**Predict:** "When you typed `cat /etc/motd`, who put my message on the screen? The
shell, the program `cat`, or the kernel?" The answer, shown as three lit parts of the
drawing: the shell started `cat`; `cat` asked for the file and passed its text on;
the kernel, the only part allowed to touch the storage and the terminal's device,
did both for it. For `/proc/version` there was no file: the kernel made the text up
as `cat` asked.

In the world: on the outside of the Section drawing, one part lights and stays lit:
"console" (the terminal's device).

### Debrief

> **init:** CPU, memory, storage, devices. An operating system that runs them for everyone. A kernel at its core that everyone must ask, and a tree of folders where `/dev` and `/proc` lead straight to it.
>
> **init:** You asked the kernel for something with every command just now, without seeing it. Next, in First Words, you switch on X-ray and watch the asking itself. Then you write your own first request, in C.

P.2 begins.

### Hints

1. Nudge: "Each chip is a command. Go in order: from the top of the folder tree
   down to the kernel."
2. Concept: "A command is a program's name, then what it should work on. `ls /dev`:
   the program `ls`, working on the folder `/dev`."
3. Point at the spot: "The last one is `cat /proc/version`: type it and press
   Enter."

### Codex (chapter: First Boot)

Each card has a **Simple** line, a **Deep** text and an optional **Read** line; a
card marked `deepens: <id>` adds to an earlier card's chain instead of starting a
new one. Card ids are unique across the game.

- **The parts of a computer** (`computer-parts`)
  - **Simple:** A CPU that runs instructions, memory for what's running now,
    storage that keeps files, and devices for everything else.
  - **Deep:** The CPU reads instructions and data from RAM; storage and other
    devices sit on buses (P.6) and are worked through their drivers. RAM is
    counted in bytes: 1 KiB = 1024 bytes, 1 MiB = 1024 KiB, so the Machine's 256 MiB
    is 268,435,456 bytes.
  - **Read:** https://docs.kernel.org/admin-guide/mm/concepts.html. Deepened by
    P.6 (finding the hardware) and P.8 (memory).
- **Operating system** (`operating-system`)
  - **Simple:** The software that runs the computer for every other program: starts
    them, shares the hardware between them, keeps the files.
  - **Deep:** An OS is a kernel plus the programs and libraries around it: an init
    system, a shell, a C library, tools. On Linux systems these come together as a
    distribution (P.5); the Machine runs Alpine Linux.
  - **Read:** man 7 `intro` (overview pages).
- **The kernel** (`kernel`)
  - **Simple:** The core of the operating system: the only part with full control
    of the hardware. Every program asks it for what it needs.
  - **Deep:** The kernel runs when something enters it: a program's syscall, a
    device's interrupt, a fault, a timer; it also keeps a few helper threads of its
    own (P.7). The city-works picture stops being true there: it is code that runs
    on request, not a separate worker always on duty. — `arch/x86/entry/`,
    `init/main.c`.
  - **Read:** man 2 `intro`. Deepened by P.5 (the kernel up close).
- **Program and process** (`program-process`)
  - **Simple:** A program is instructions in a file. A process is a program while it
    runs, with its own memory and a PID.
  - **Deep:** The kernel starts a program in a process with `execve()` and keeps one
    `struct task_struct` per running task. One program can run as many processes
    at once. — `fs/exec.c`, `include/linux/sched.h`.
  - **Read:** man 2 `execve`, man 1 `ps`. Deepened by P.7 (who runs) and 1.4
    (`fork`, `exec`, `wait`).
- **The file tree** (`files`)
  - **Simple:** One tree of folders from the root, `/`: programs in `/bin`, settings
    in `/etc`, people's folders in `/home`, devices in `/dev`, the kernel's own view
    in `/proc`.
  - **Deep:** A file's data and details (size, owner) live in an inode; folders map
    names to inodes. Other filesystems join the tree where they are mounted: `/proc`
    and `/dev` are filled by the kernel itself. — `fs/namei.c`, `include/linux/fs.h`.
  - **Read:** man 7 `hier`. Deepened by P.9 (everything is a file) and S.1.
- **`/proc`, the kernel's window** (`proc`)
  - **Simple:** Files that no disk holds: when a program reads one, the kernel writes
    the answer on the spot, about itself and every process.
  - **Deep:** procfs is generated on each read. `/proc/version` comes from
    `fs/proc/version.c`; each process gets `/proc/<pid>` with its memory map, open
    files and state. — `fs/proc/version.c`, `fs/proc/base.c`.
  - **Read:** man 5 `proc`. Deepened by P.7 (who runs).
- **Terminal, shell and command** (`terminal`)
  - **Simple:** The terminal is the window; the shell is the program in it that
    reads your line; a command is that line: a program's name and what to work on.
  - **Deep:** The terminal is a device (a tty). The shell reads your line from it,
    starts the program you named, and waits for it to finish. —
    `drivers/tty/tty_io.c`.
  - **Read:** man 4 `tty`. Deepened by P.3 (the shell).

### Real-world card

On a Linux machine (or a Mac's Terminal, which works the same for most of these):

```sh
ls /
cat /etc/hostname 2>/dev/null || hostname    # your computer's name
cat /proc/version                            # Linux only: the kernel's own words
ls /dev
```

On Windows, the Windows Subsystem for Linux (WSL) gives you a real Linux terminal.

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** the four kinds of parts; what an OS and a kernel do; a real Linux
  6.18 kernel with bash and BusyBox, so every command prints as on Linux.
- **Simplified:** the power-on animation is a drawing (P.4 has the real boot).

### Lab needs

The power-on animation with the burnt pstore frame; the Section drawing's outside
view; the real VM's bash, `/etc/motd` with init's message and `/etc/hostname`
(`kernelfall`).

---

## P.2 — First Words

- **Id:** `prologue-boot-path-02-first-words` · **Region / NPC:** init's house in Userland / init, the Watchdog · **Tracks:** `userland`, `kernel` · **Time:** ~20 min · **Prerequisites:** `sys-computer-basics` · **Skills unlocked:** `sys-user-kernel-mode`

This is the built level (`packages/levels/content/0-prologue/1-boot-path/02-first-words`).

### Scene

> **init:** You ran three programs. Each one needed the kernel: to show text, to read a folder, to open a file. Let's watch one of them ask.
>
> **The Watchdog:** Make it quick. I'm counting. (I'm always counting. That's my whole job.)
>
> **init:** Then we'll say the same thing ourselves, in C: your very own first request to the Kernel.

### See it (X-ray)

**Part 1: the syscalls view (about 1:30 into the level).** A chip offers
`echo hello` again. `hello` prints, init asks "Want to see what really happened?",
and **X-ray** (a view that shows what happens inside the Machine; its syscalls view
unlocks now) replays the command:

```
execve("/bin/echo", ["echo", "hello"], ...) = 0
write(1, "hello\n", 6)                      = 6
exit_group(0)                               = ?
```

init reads it line by line. Each line is one **syscall** (system call): a request
from a program to the kernel. The name, then what was asked in brackets, then after
the `=` the kernel's answer.

- `execve(...)`: the shell asked the kernel to start the program `/bin/echo` with
  the words `echo` and `hello`. Answer `0`: done.
- `write(1, "hello\n", 6)`: `echo` asked the kernel to show six bytes, `hello` and
  a newline (`\n`, the invisible "end of line" character). Answer `6`: all six
  taken.
- `exit_group(0)`: `echo` said "I'm finished, all went well" (`0` means success).
  There's no answer: the process is gone.

The `1` in `write` is a **file descriptor**: a small number a process uses for
something it has open. Every program starts with three: **0** for what you type,
**1** for its normal output (**standard output**), **2** for error messages.
Standard output is your terminal here, but it doesn't have to be: 1.6 sends it to a
file.

init: "Start a program, write, leave. Every program talks to the Kernel this way.
There is no other door. Try any command; X-ray watches them all." The player runs
`ls /bin` and `cat /etc/motd` again with X-ray on and sees their syscalls (a few
more names; the Survey explains them).

**Part 2: one request, slowly.** init zooms into the `write` (the Gate view; the
full, step-by-step version is the Syscall Gate boss, 1.B):

1. The CPU has two levels of permission. Programs run in **user mode**: the CPU
   won't let them touch devices, other programs' memory or the kernel's memory.
2. To ask for something, a program runs one special CPU instruction (`syscall` on
   this kind of CPU, x86-64). The CPU switches to **kernel mode**, full permission,
   and jumps to one fixed place in the kernel: the **Syscall Gate**.
3. The kernel does the work (here, hands the bytes to the terminal's device) and
   the CPU returns to user mode with the kernel's answer.

> **init:** You ask. The Kernel does. That's the whole arrangement.

Where "asking" stops being a good picture: the program doesn't wait in line or talk
to anyone. Its own CPU switches mode and runs kernel code right away, on its behalf.

### Build it

The player writes `hello.c`, their first program, in the editor. C is a programming
language; its text is the **source code**, and a **compiler** (here, clang) turns
it into a program file the CPU can run.

- **Starter provides:** an empty `main()` (the function a C program starts in) that
  returns 0, `#include <unistd.h>` (which brings in `write()`), and a comment block
  (in init's voice) explaining `write(fd, buf, count)` and that fd 1 is standard
  output (here, the terminal). Run compiles it (a `make hello` target) and runs
  `./hello` in the rescue shell (`./` means "in this folder"; P.3 explains why it's
  needed).
- **First, a broken build, on purpose (guided).** init: "Before you write anything,
  let's break it. Delete the `;` after `return 0` and press Run." The compiler
  answers:

  ```
  hello.c:19:10: error: expected ';' after return statement
     19 |         return 0
        |                 ^
        |                 ;
  1 error generated.
  ```

  init reads it part by part, and each part lights up as she names it:
  - `hello.c:19:10` is where: the file, the line (19) and the column (10,
    counting characters from the start of the line; a tab counts as one).
  - `error:` is how bad: an error stops the build, so there is no `./hello` to
    run. (A `warning:` lets the build finish; more on those in 1.3.)
  - The message says what the compiler expected and didn't find.
  - The source line with a `^` under the spot, and below it the fix the compiler
    suggests: a `;`.
  - "Fix the first error first. Later ones are often caused by it."

  The player puts the `;` back and presses Run: a clean build, and nothing printed,
  because `main` says nothing yet.
- **Player writes:** a call to `write()` that prints one line to standard output
  (any text, ending in a newline) and returns 0 from `main`. Stretch (not
  required): check the return value and return 1 if `write()` failed.
- **Checker verifies (behavior):**
  - A build failed with an error, and a later build of `hello.c` succeeded (the
    guided break counts; so does any error the player fixes on their own).
  - The program compiles.
  - Running `./hello` in the rescue shell exits with status 0.
  - The lab's event stream shows at least one `write` syscall on fd 1 with a
    count greater than 0, whose return value equals the count.
  - The bytes that reached the terminal end in `\n`.

`printf` also passes (it ends in `write(1, ...)` too). If the player uses it,
X-ray shows the `write` that `printf` made for them, and init explains that
`printf` is a library function (ready-made code that comes with C) that collects
text and then calls `write`.

If a build prints a warning (for example `unused variable 'n'`), init adds a
note, and nothing more: "That's a warning, not an error: your program still built.
Warnings often point at real bugs. The Smith will teach you to clear them." No
Taint.

### Watch it

**Predict** (before running): init asks which X-ray lane `./hello` will light up:
user mode only, kernel mode only, or both. The run shows the answer: the program
runs in user mode, and each syscall dips into kernel mode and back.

```
$ ./hello
hello, Machine
```

```
execve("./hello", ["./hello"], ...) = 0
write(1, "hello, Machine\n", 15)    = 15
exit_group(0)                       = ?
```

In the world: the first lamp in Userland flickers on above init's house. The Kernel
Map shows a single lit dot labeled "console". The Watchdog grunts: "A process
that talks. Fine. I'll stop counting. For now."

init then shows the rescue shell's limits: a chip offers `echo hi > note.txt`
(in a full shell, `>` sends the output to a file instead of the terminal), and the
rescue shell prints `rescue: redirection not supported`. "My shell can't even do
that."

### Debrief

> **init:** The first lamp in Userland is lit above my house. Your line went the only way anything goes: through the Gate.
>
> **init:** The city needs a real shell, and one day you'll build one. You can't build what you've never used. So stop clicking my chips, and speak to mine yourself.

P.3 begins.

### Hints

1. Nudge: "You want your line to reach the terminal. Every program starts with
   three file descriptors already open. Which one is standard output?"
2. Concept: "`write(fd, buf, count)` hands `count` bytes from `buf` to the Kernel.
   File descriptor 1 is standard output; here, it leads to your terminal. The
   Kernel answers with how many bytes it took."
3. Point at the spot: "Inside `main`, call `write` with fd 1, your string, and the
   string's length in bytes. Count the `\n` too. `sizeof` on a string literal
   counts the hidden `\0` at the end, so subtract one."

### Codex (chapter: First Boot)

The built level's card list must match this one.

- **Syscall** (`syscall`)
  - **Simple:** A request from a program to the kernel: show text, open a file,
    start a program. The only way a program gets the kernel to do anything.
  - **Deep:** Each syscall has a name, a number and up to six arguments; the
    kernel answers with a value, or a negative error code that the C library turns
    into `-1` plus `errno`. On x86-64 the `syscall` instruction enters the kernel
    at one assembly entry point, `entry_SYSCALL_64`: the Syscall Gate. It saves
    the program's registers and calls `do_syscall_64()`, which runs the handler
    from the syscall table. — `arch/x86/entry/entry_64.S` (`entry_SYSCALL_64`),
    `arch/x86/entry/syscall_64.c` (`do_syscall_64()`),
    `arch/x86/entry/syscalls/syscall_64.tbl`.
  - **Read:** man 2 `syscalls`, man 2 `intro`. Deepened by 1.B (the syscall
    path, step by step).
- **User mode and kernel mode** (`user-kernel-mode`)
  - **Simple:** The CPU runs programs with limits on (user mode) and the kernel
    without them (kernel mode), so programs must ask.
  - **Deep:** The CPU tracks its privilege level. On x86-64, programs run in ring
    3 and the kernel in ring 0; kernel memory is mapped supervisor-only, so a
    program that touches it faults. The `syscall` instruction is the one sanctioned
    way up, and `sysret` (or `iret`) the way back. —
    `arch/x86/entry/entry_64.S`, https://docs.kernel.org/arch/x86/entry_64.html.
  - **Read:** man 2 `intro`, man 2 `syscall`. Deepened by P.5 (kernel space and
    user space).
- **File descriptors** (`file-descriptors`)
  - **Simple:** Small numbers a process uses for what it has open: 0 for input,
    1 for normal output, 2 for errors.
  - **Deep:** Each process has a table of open files; an fd is an index into it.
    The shell passes its terminal as 0, 1 and 2 to every program it starts. —
    `fs/file.c`, `include/linux/fdtable.h`.
  - **Read:** man 3 `stdin`. Deepened by 1.6 (file descriptors and redirection).
- **write()** (`write-syscall`)
  - **Simple:** Hands bytes from your program to something it has open. fd 1,
    standard output, leads to your terminal here.
  - **Deep:** `ssize_t write(int fd, const void *buf, size_t count)` copies up to
    `count` bytes from your buffer to the open file `fd`, and returns how many it
    took. It can take fewer than asked (a "short write"), so careful code checks
    the return value. The path: `ksys_write()` → `vfs_write()` → the file's own
    write function; for a terminal, the tty layer's `tty_write()`. —
    `fs/read_write.c` (`ksys_write()`, `vfs_write()`), `drivers/tty/tty_io.c`.
  - **Read:** man 2 `write`. Deepened by P.9 (one interface for every file), 1.6
    (the read/write contract) and 2.5 (the driver's side).
- **Compiler diagnostics** (`compiler-diagnostics`)
  - **Simple:** The compiler says where it stopped and why: `file:line:column`,
    how bad (`error` or `warning`), then the message.
  - **Deep:** An error stops the build; a warning doesn't. Under the message,
    clang shows the source line, a `^` at the spot and sometimes a suggested fix.
    gcc uses the same `file:line:column: error:` shape with its own wording. Fix
    the first error first: later ones are often caused by it. The kernel is built
    by the same compilers (gcc, or clang with `LLVM=1`) and its build can treat
    warnings as errors (`CONFIG_WERROR`). — `Documentation/kbuild/llvm.rst`,
    `init/Kconfig` (`WERROR`).
  - **Read:** https://clang.llvm.org/docs/UsersManual.html#formatting-of-diagnostics.
    Deepened by 1.3 (warnings and a clean build).
- **Taint (the game's meter)** (`taint-meter`)
  - **Simple:** The Machine's stain meter: hacks add Taint, clean code adds none.
    It is a game score, not a Linux feature.
  - **Deep:** Linux has its own, different "taint": flags the kernel sets when
    something makes it less trustworthy (a proprietary or out-of-tree module, a
    previous oops). They are bits set by `add_taint()`, readable in
    `/proc/sys/kernel/tainted`, and shown as letters on an oops's `Tainted:` line.
    The game's meter borrows the word, not the mechanism. — `kernel/panic.c`
    (`add_taint()`), `Documentation/admin-guide/tainted-kernels.rst`.
  - **Read:** https://docs.kernel.org/admin-guide/tainted-kernels.html. Deepened
    by 2.2 (Game Taint vs kernel taint flags).

### Real-world card

```sh
strace echo hello           # every syscall echo makes (Linux only)
```

Write `hello.c`:

```c
#include <unistd.h>

int main(void)
{
	const char msg[] = "hello, Machine\n";

	if (write(1, msg, sizeof(msg) - 1) < 0)
		return 1;
	return 0;
}
```

Build and trace it: `cc -Wall -Wextra -o hello hello.c && strace ./hello`. You'll
see many more syscalls than in the game before your `write`: the dynamic loader
maps shared libraries (`openat`, `mmap`, `mprotect` and friends). Build with
`-static` and trace again to see a shorter list. Delete a `;` and build again: gcc
words the error differently ("expected ';' before '}' token") but uses the same
`file:line:column: error:` shape.

### Taint

The Taint meter is introduced here and shown at zero. init: "Hacks leave a stain on
the Machine. We call it Taint. Keep it low." No Taint rule is live anywhere in the
Prologue:

- **Compiler warnings** get init's note (Build it), not Taint. They count from
  1.3, where warnings are taught.
- Ignoring `write()`'s return value gets a gentle checker note. Return-value Taint
  starts in Act I.

### Fidelity

- **Faithful:** programs in user mode, the kernel in kernel mode, and the `syscall`
  instruction as the one way in; `write()`'s signature and return value; syscall
  names and arguments in X-ray; `exit_group` as the syscall behind returning from
  `main`; fds 0, 1, 2; clang's diagnostic format (`file:line:column: error:`, the
  caret line, the fix-it).
- **Simplified:** the lab's C library is small and statically linked, so a traced
  program shows far fewer syscalls than on real Linux (no dynamic loader, no
  `brk`/`mmap` at start-up). The rescue shell is a stand-in.

### Lab needs

X-ray's syscalls view; clang diagnostics as events (errors and warnings with file,
line and column); a `make hello` target; the redirection refusal message.

---

## P.3 — Speak to the Shell

- **Id:** `prologue-boot-path-03-speak-to-shell` · **Region / NPC:** init's doorstep in Userland / init, the Watchdog · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `sys-user-kernel-mode` · **Skills unlocked:** `sys-shell-basics`

From this level on, the player types every command. The Field Guide (a Codex page of
commands and folders, specified in [surface-survey.md](surface-survey.md#the-field-guide-codex-page))
opens here.

### Scene

> **init:** So far you've clicked my chips. Now speak to the shell yourself. You'll be building one soon.
>
> **init:** The shell prints a _prompt_, the `$ ` you see, which means "your turn". You type a line. It cuts the line into words, finds the program the first word names, runs it, waits for it to finish, and prompts again.
>
> **The Watchdog:** And whatever it runs asks the Kernel for everything. You've seen it.
>
> **init:** The first word is the _command_. The other words are its _arguments_. The ones that start with a dash are _options_. And when you forget what a command does, the Machine keeps a manual.

### See it (X-ray)

The syscalls view. init types three lines, and X-ray shows how the shell cut each one
into words and handed them to the program (as the list `["...", "..."]` in
`execve`):

```
execve("/bin/echo", ["echo", "one", "two", "three"], ...) = 0
execve("/bin/echo", ["echo", "one", "two"], ...)          = 0
execve("/bin/ls", ["ls", "-l", "/etc"], ...)              = 0
```

- `echo one two three`: three arguments.
- `echo one      two`: two arguments. The shell splits on spaces; how many spaces
  doesn't matter, and `echo` puts one space back between them.
- `ls -l /etc`: `-l` is an option (it changes _how_ `ls` works: one long line per
  file), `/etc` an argument (it says _what_ to work on). The shell doesn't know what
  `-l` means; `ls` does. The program gets all the words, its own name first, as a
  list called its argument vector, `argv`.

Then init runs `man ls`, and X-ray shows something new: the shell tried twice.

```
execve("/bin/man", ["man", "ls"], ...)     = -1 ENOENT (No such file or directory)
execve("/usr/bin/man", ["man", "ls"], ...) = 0
```

init: "I never told it where `man` lives. It looked." `printenv PATH` prints
`/bin:/usr/bin`. `PATH` is one of the process's **environment variables**: a list of
`NAME=value` settings every process gets from its parent. It lists the folders the
shell searches, in order, separated by `:`. There was no `man` in `/bin`, so the
Kernel answered `ENOENT` ("no such file"), and the shell tried the next folder.

### Build it

No C. The player runs init's errands in the rescue shell, typing every command
themselves (chips show only the command's name and its one-line explanation). Each
errand fills a Field Guide entry.

- **Starter provides:** the rescue shell in `/home/you` (with `hello` and `hello.c`
  from P.2), and the Field Guide page.
- **Player does, with worked examples first:**
  - **Arguments.** `echo one two three`, then `echo` with four words of their own.
  - **Options.** `ls`, `ls -l`, `ls -a`, then `ls -la` (two options joined: most
    programs accept that). `ls -a` shows two extra names, `.` (this folder) and
    `..` (the one above); names starting with `.` are hidden without `-a`.
  - **Arguments and options together.** `wc /etc/motd` (lines, words, bytes), then
    `wc -l /etc/motd` (lines only), then `wc -w /etc/motd`.
  - **The manual.** `man ls`: find what `-a` does ("do not ignore entries starting
    with ."), then `q` to quit. `man wc`: find the option that counts bytes.
    `man 2 write`: the manual's section 2 is syscalls; there's P.2's `write()`.
  - **Tab.** Type `cat /etc/mo` and press **Tab**: the shell finishes `/etc/motd`.
    Then `ec` + Tab (finishes `echo`), and `ls /us` + Tab (finishes `/usr/`). X-ray
    shows the shell itself (no new program) reading the folder's names to finish
    yours.
  - **The environment.** `printenv HOME` (your home folder), `printenv USER` (your
    name on the Machine), `printenv PATH`, then `env` (all of them). Then
    `env GREETING=hi printenv GREETING`: `env` starts `printenv` with one extra
    setting, and `printenv` sees it. Run `printenv GREETING` alone: nothing. The
    setting existed only for that one child.
  - **`PATH`.** `ls /bin` and find `ls` itself in the list: commands are files.
    Then `hello`, then `./hello` (Watch it).
- **Checker verifies (behavior, from the lab's event stream):**
  - A program ran with at least four arguments after its name (`echo`).
  - A program ran with two options joined in one word (`-la` or similar) and
    another with an option and a non-option argument (`wc -l /etc/motd`).
  - `man` ran three times, once with a section number, each exiting with status 0.
  - The rescue shell completed a name with Tab at least twice (its own
    `getdents64` on a folder).
  - `env` ran a program with an added `NAME=value`, and that program printed it.
  - `./hello` ran from `/home/you` and exited with status 0 (re-tests P.2).

### Watch it

**Predict:** `hello` is in `/home/you`, where you're standing. If you type just
`hello`, where will the shell look for it? Here, in `/home/you`; in `/bin` then
`/usr/bin`; or everywhere. Then the player runs it:

```
$ hello
rescue: hello: command not found
$ ./hello
hello, Machine
```

```
execve("/bin/hello", ["hello"], ...)     = -1 ENOENT (No such file or directory)
execve("/usr/bin/hello", ["hello"], ...) = -1 ENOENT (No such file or directory)
execve("./hello", ["./hello"], ...)      = 0
```

The shell searched only the `PATH` folders, never the one you're in. A name with a
`/` in it is a path, so the shell doesn't search: `./hello` means "`hello`, in `.`,
this folder". (The current folder is left out of `PATH` on purpose: a program
called `ls` dropped in a shared folder like `/tmp` must not run in place of the real
one.)

In the world: a signpost appears at init's door, its two arms pointing down `/bin`
and `/usr/bin`. The Field Guide page fills its first rows.

### Debrief

> **init:** Now you can speak to a shell. Command, arguments, options, and `man` when you forget. Tab when you're lazy. `PATH` when it can't find something.
>
> **init:** Good, because the next thing I'll show you happens before any shell exists: how the Machine woke up this morning.
>
> **The Watchdog:** You saw it scroll past in a blur. Last night, something down there went wrong at that speed.

P.4 begins.

### Hints

1. Nudge: "The shell found `ls` without you saying where it lives. Where did it
   look? There's a command that prints the list."
2. Concept: "A name without a `/` is searched in each folder of `PATH`, in order.
   A name with a `/` is a path: the shell runs exactly that file."
3. Point at the spot: "`hello` is in your home, which isn't in `PATH`. Type
   `./hello`: `.` is the folder you're in."

### Codex (chapter: First Boot)

- **The shell** (`shell`, deepens: `terminal`)
  - **Simple:** A program that prints a prompt, reads the line you type, runs the
    program you named, waits for it, and prompts again.
  - **Deep:** A shell is an ordinary user process (bash, dash, BusyBox `ash`), not
    part of the kernel. It reads your line from standard input (fd 0) and runs
    each command with `fork` (the `clone` syscall), `execve` and `wait4` (1.4
    builds that). The prompt usually ends in `$` for an ordinary user and `#` for
    root. Tab completion is the shell reading a folder (`getdents64`) and
    finishing the name; the kernel only sees the read. — `kernel/fork.c`,
    `fs/exec.c`, `fs/readdir.c`.
  - **Read:** man 1 `bash`, man 1 `dash`. Deepened by 1.4 (running a program).
- **Commands** (`command`)
  - **Simple:** The first word of a line: the program to run, or a _builtin_ the
    shell does itself, like `cd`.
  - **Deep:** For a program, the shell calls `execve()` with the file's path; the
    kernel opens the file, checks that it may be run, and replaces the process's
    program with it. `cd` must be a builtin because a working directory belongs to
    one process: a child that changed its own would change nothing for the shell
    (1.5). — `fs/exec.c` (`do_execveat_common()`).
  - **Read:** man 2 `execve`, man 1 `bash` (SHELL BUILTIN COMMANDS).
- **Arguments and options** (`arguments`)
  - **Simple:** The words after the command. Options start with `-` and change how
    the program works; the rest say what to work on.
  - **Deep:** The shell splits the line into words and passes them to `execve()` as
    `argv`, the program's name first. The kernel copies them onto the new program's
    stack, where C's `main(int argc, char *argv[])` finds them. Options are only a
    convention: each program reads its own, usually with `getopt(3)`. —
    `fs/exec.c` (`copy_strings()`).
  - **Read:** man 3 `getopt`, man 2 `execve`. Deepened by 1.1 (cutting a line into
    words) and 1.4 (`execve` with the player's own `argv`).
- **The environment** (`environment`)
  - **Simple:** A list of `NAME=value` settings every process gets from its parent:
    `HOME`, `USER`, `PATH`. A child's changes never reach its parent.
  - **Deep:** `execve()` takes the environment as a third list, `envp`, and the
    kernel copies it onto the new program's stack next to `argv`;
    `/proc/<pid>/environ` shows it (to the same user or root). — `fs/exec.c`,
    `fs/proc/base.c` (`environ_read()`).
  - **Read:** man 7 `environ`, man 1 `env`. Deepened by P.4 (boot parameters
    passed to init's environment) and 1.5 (`export` and `$VAR` in your own shell).
- **PATH** (`path-search`)
  - **Simple:** The list of folders the shell searches for a command name. A name
    with a `/` is run as it is, with no search.
  - **Deep:** The search happens in user space, in the shell or in the C library's
    `execvp()`; the kernel's `execve()` takes only a path and answers `-ENOENT`
    when nothing is there. The current folder is not in `PATH`, so a stray program
    in a shared folder can't stand in for a real command. — glibc
    `posix/execvpe.c`; the kernel side is `fs/exec.c`.
  - **Read:** man 3 `exec`, man 7 `environ`. Deepened by 1.5.
- **The manual** (`man-pages`)
  - **Simple:** `man ls` shows the manual page for `ls`. A number picks a section:
    `man 2 write` is the syscall, `man 1 write` a command.
  - **Deep:** Sections: 1 commands, 2 syscalls, 3 C library functions, 4 devices,
    5 file formats, 7 overviews, 8 admin commands. The Linux man-pages project
    documents the kernel's user-space interface; the kernel's own documentation
    lives in its `Documentation/` folder, published at docs.kernel.org. Every card
    in this Codex names its man pages this way.
  - **Read:** man 1 `man`, man 7 `man-pages`.

### Real-world card

```sh
echo $SHELL                  # the shell you log in with
printenv PATH                # usually longer than the lab's
type cat cd                  # cat is a file found through PATH; cd is a builtin
ls -la ~                     # your home, hidden files too
man 2 write                  # section 2: the syscall from P.2 (q quits)
env GREETING=hi printenv GREETING
strace -f -e trace=execve sh -c nosuchcmd
```

On Debian and Ubuntu, `sh` is dash, which searches `PATH` the way the rescue shell
does: one failed `execve` per folder. bash checks each folder with `stat` first and
remembers where it found a command (`hash`), so its trace shows no failed
`execve`.

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** `argv` as passed to `execve`, the program's name first; splitting
  on runs of spaces; `PATH` searched in order, and a name with a `/` not searched
  (POSIX); `ENOENT` from `execve` for a missing file; `.` and `..` as real entries;
  the environment passed to children and never back; Tab completion reading the
  folder; man page section numbers and the `ls -a` text.
- **Simplified:** the lab's `PATH` is `/bin:/usr/bin`; most distributions also
  list `/usr/local/bin` (and `sbin` folders) and make `/bin` a link to `/usr/bin`.
  The rescue shell searches by trying `execve` in each folder, like dash and
  BusyBox `ash`; bash checks with `stat` first. Its "command not found" message
  follows bash's. The lab's man pages are short excerpts of the real ones. The
  rescue shell completes only command and file names.

### Lab needs

Rescue shell: `PATH` search by `execve` per folder, Tab completion (with its own
`getdents64` in the trace), the `rescue: NAME: command not found` message; the
environment (`HOME`, `USER`, `PATH`) passed to children; `/usr/bin/man` with short
pages for every Field Guide command and `man 2 write`, a pager with arrows and `q`;
`printenv`, `env`, `wc` (`-l`, `-w`, `-c`), `ls -a`, `-la`; one-line explanations
on every command chip.

---

## P.4 — The Boot Path

- **Id:** `prologue-boot-path-04-the-boot-path` · **Region / NPC:** the Machine's boot path / init, the Watchdog · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `sys-shell-basics` · **Skills unlocked:** `sys-boot-chain`

### Scene

> **init:** **Booting** is everything between the power button and the first programs. You saw it as a blur this morning. Let's do it again, slowly. Reboot.
>
> **The Watchdog:** You want me to restart on purpose? ...Fine. Hold on to something.
>
> **init:** Watch who hands the Machine to whom. The firmware wakes first and knows nothing about Linux. It finds a bootloader. The bootloader loads the Kernel. The Kernel wakes its own parts, finds the disk with our files, and starts me.
>
> **init:** And the bootloader asks you something on the way. Most people never look. Today, you look.

### See it (X-ray)

The Machine restarts, and X-ray follows the boot in a **boot view**: one lane per
stage, with the real messages.

1. **Firmware** is software stored on the computer's board itself; it runs first,
   checks the hardware and starts a bootloader from a disk. Two kinds exist:
   - **BIOS**, on older PCs: it reads the disk's first 512 bytes (the MBR) and runs
     the tiny program in it.
   - **UEFI**, on current PCs: it reads a small part of the disk set aside for it,
     the **EFI system partition** (a **partition** is a part of a disk that holds
     its own set of files), and runs a program file from it, like
     `\EFI\debian\grubx64.efi`. Its list of what to boot is kept in a little memory
     on the board that survives power-off (NVRAM).

   The Machine uses UEFI; its EFI system partition is `/dev/vda1`.
2. **Bootloader: GRUB.** A **bootloader** is the small program that loads the
   kernel. GRUB shows a menu. One disk can hold several kernels side by side, and
   even other operating systems; each is a **menu entry**:

   ```
                         GNU GRUB  version 2.12

    *Kernelfall GNU/Linux
     Advanced options for Kernelfall GNU/Linux
     UEFI Firmware Settings
   ```

   Inside "Advanced options": `Linux 6.18.0`, `Linux 6.18.0 (recovery mode)` and an
   older kernel, `Linux 6.12.0`, kept in case a new one fails. On a computer with
   Windows too, a `Windows Boot Manager` entry would sit in the same menu. init
   presses `e` on the first entry and the player sees what an entry really is:

   ```
   linux   /boot/vmlinuz-6.18.0 root=/dev/vda2 ro quiet
   initrd  /boot/initrd.img-6.18.0
   ```

   `linux` names the kernel's file (`vmlinuz`, compressed to load faster) and, after
   it, the **kernel command line**: settings for this boot, separated by spaces.
   `root=/dev/vda2` says which partition holds the system's files, `ro` mount it
   read-only at first, `quiet` print few messages. `initrd` names the initramfs
   (step 5). GRUB loads both files into memory and starts the kernel.
3. **Kernel.** The kernel unpacks itself, then its first function, `start_kernel()`,
   sets up the CPU, memory, interrupts, the scheduler and the console. It prints its
   first lines:

   ```
   [    0.000000] Linux version 6.18.0 (...) #1 SMP PREEMPT_DYNAMIC ...
   [    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.18.0 root=/dev/vda2 ro quiet
   ```

   The number in brackets is seconds since the kernel started.
4. **initcalls.** Then the kernel runs its **initcalls**: hundreds of start-up
   functions, in a fixed order of levels (`core`, `postcore`, `arch`, `subsys`,
   `fs`, `device`, `late`). Drivers (the code for each kind of device) get set up
   here: this is where the Machine's disk and network card get theirs (P.6).
5. **initramfs and root.** The kernel unpacks the **initramfs**, a small set of
   files loaded into memory, and runs its `/init` (`Run /init as init process`).
   That small program finds the partition named by `root=` and **mounts** it:
   attaches its files into the one tree of folders, at `/`. Then it hands over.
6. **PID 1.** Finally `/sbin/init` starts from the real disk, as process 1. That's
   init. Everything else follows from it.

### Build it

The player boots the Machine their own way. GRUB's keys are real: arrows to
choose, `e` to edit an entry, Ctrl-X (or F10) to boot the edited entry, Esc to
go back.

- **Starter provides:** the GRUB menu, the boot view and command chips for
  `cat /proc/cmdline`, `dmesg` and `ls /sys/firmware/efi`.
- **Player does:**
  - Open "Advanced options" and pick `Linux 6.12.0`. The Watchdog stops it: "That's
    last year's Kernel. We rebuild with this one." (The lab runs 6.18 only.)
  - Edit the first entry: remove `quiet`, so every boot message prints, and add
    `initcall_debug`, so every initcall prints its name and time.
  - Add a word of their own for init: `greeting=hello`. The kernel doesn't know
    it, so it passes it on to init, and says so.
  - Boot with Ctrl-X, then run `cat /proc/cmdline` (the command line this boot
    used) and `dmesg` (the kernel's own messages).
- **Checker verifies (behavior, from the lab's boot events):**
  - The Machine booted the 6.18.0 kernel with a command line that has no `quiet`
    and has `initcall_debug`.
  - The command line had a parameter the kernel didn't know, and the kernel logged
    that it passed it to user space.
  - After the boot, `/proc/cmdline` was read.

The messages the player now sees:

```
[    0.412318] calling  e1000_init_module+0x0/0x80 @ 1
[    0.413902] initcall e1000_init_module+0x0/0x80 returned 0 after 1490 usecs
[    0.902114] Unknown kernel command line parameters "greeting=hello", will be passed to user space.
[    1.204551] Run /init as init process
```

"User space" means the programs outside the kernel, here init. init: "`greeting=
hello`. Nobody's ever said that to me at boot." (init reads it from its
environment, the list of `NAME=value` settings you read with `printenv` in P.3.)

### Watch it

**Predict:** "You edited the entry with `e`. Will your `greeting` still be there
next time the Machine boots?" Then the Watchdog restarts the Machine, and the plain
entry comes back. Edits made with `e` last one boot. A lasting change goes in
GRUB's settings file (`/etc/default/grub`, then `update-grub`), which needs the
administrator, root (S.2, 1.B).

```
$ ls /sys/firmware/efi
config_table  efivars  fw_platform_size  runtime  runtime-map  systab
```

`/sys/firmware/efi` exists only when the kernel was started by UEFI: the Machine
booted the modern way. In the world: the boot path on the Kernel Map lights from
firmware to init, and the region First Boot is fully drawn.

### Debrief

> **init:** Firmware, GRUB, the Kernel, its initcalls, my initramfs, the disk, and me. Now you know every hand the Machine passes through.
>
> **The Watchdog:** And you know where to look when one of them drops it.
>
> **init:** One hand is bigger than all the others. The Kernel. Let me open it up for you.

P.5 begins. At this point init offers the region's placement check (see the top of
this spec); a player who passes it goes straight to P.10.

### Hints

1. Nudge: "The text after `linux` in the entry is the kernel command line. What do
   you want to take away, and what do you want to add?"
2. Concept: "Words on the command line are separated by spaces. `quiet` hides most
   messages; `initcall_debug` prints each initcall; a word the kernel doesn't know
   is passed on to init."
3. Point at the spot: "Press `e`, move to the end of the `linux` line, delete
   `quiet`, type ` initcall_debug greeting=hello`, then press Ctrl-X."

### Codex (chapter: First Boot)

- **Boot sequence** (`boot-sequence`)
  - **Simple:** The Machine wakes in steps: firmware, bootloader, kernel, its
    start-up calls, initramfs, the root disk, then init.
  - **Deep:** The kernel initializes itself in `start_kernel()`, then
    `rest_init()` starts `kernel_init()`, which becomes PID 1, and `kthreadd`
    (PID 2), the parent of kernel threads. `kernel_init()` runs the initcalls, then
    tries the initramfs `/init`, then the `init=` boot parameter, then
    `/sbin/init`, `/etc/init`, `/bin/init` and `/bin/sh`. If none works, it panics
    with "No working init found." — `init/main.c` (`start_kernel()`,
    `rest_init()`, `kernel_init()`), `init/initramfs.c`,
    `Documentation/admin-guide/init.rst`.
  - **Read:** man 7 `boot`, man 7 `bootparam`. Deepened by 2.1 (booting your own
    kernel).
- **PID 1 (init)** (`pid-1`)
  - **Simple:** The first program the kernel starts. Every other process
    descends from it.
  - **Deep:** PID 1 starts the rest of the system, adopts processes whose parent
    died and cleans up after them when they exit. If it exits, the kernel panics
    with "Attempted to kill init!" — `init/main.c` (`kernel_init()`,
    `run_init_process()`), `kernel/exit.c` (`find_child_reaper()`,
    `find_new_reaper()`).
  - **Read:** man 1 `init` (systemd's page on most distributions), man 2 `getpid`.
    Deepened by P.7 (the process tree).
- **Firmware: BIOS and UEFI** (`firmware`)
  - **Simple:** The first code to run, stored on the board. It checks the hardware
    and starts a bootloader. UEFI is today's standard; BIOS is the old one.
  - **Deep:** BIOS runs the 446 bytes of boot code in a disk's first sector (the
    MBR). UEFI reads a FAT-formatted EFI system partition, runs an EFI program from
    it, and keeps its boot entries in NVRAM (`efibootmgr` lists them). With Secure
    Boot, UEFI runs only signed programs; distributions boot through a signed
    `shim`. Linux sees UEFI's services under `/sys/firmware/efi`. —
    `drivers/firmware/efi/`, `arch/x86/boot/`.
  - **Read:** man 8 `efibootmgr`, https://docs.kernel.org/admin-guide/efi-stub.html.
- **The bootloader and its menu** (`bootloader`)
  - **Simple:** GRUB lists the kernels (and other systems) on the disk, loads the
    one you choose, and hands it a command line.
  - **Deep:** Each menu entry has a `linux` line (the image and its command line)
    and an `initrd` line. Distributions keep the previous kernel as a fallback and
    add a recovery entry; dual-boot machines list other systems too. The menu is
    generated into `/boot/grub/grub.cfg` by `update-grub` from `/etc/default/grub`
    and `/etc/grub.d/`. `e` edits an entry for one boot only. The kernel can also
    be started by UEFI directly (the EFI stub).
  - **Read:** `info grub`, https://www.gnu.org/software/grub/manual/grub/.
- **The kernel command line** (`kernel-command-line`)
  - **Simple:** Settings passed to the kernel at boot, like `root=/dev/vda2` or
    `quiet`. `/proc/cmdline` shows them.
  - **Deep:** The kernel parses each `name=value` against its known parameters
    (`early_param()`, `__setup()`, and module parameters written `module.name=`).
    Unknown ones without a dot are passed to init: `name=value` in its
    environment, plain words as arguments. — `init/main.c`
    (`unknown_bootoption()`, `print_unknown_bootoptions()`), `kernel/params.c`,
    `Documentation/admin-guide/kernel-parameters.txt`.
  - **Read:** man 7 `bootparam`,
    https://docs.kernel.org/admin-guide/kernel-parameters.html. Deepened by 2.3
    (module parameters).
- **initcalls** (`initcalls`)
  - **Simple:** The kernel's start-up list: hundreds of functions, run in order,
    that wake its parts and set up its built-in drivers.
  - **Deep:** Built-in code marks its start function with `core_initcall()`,
    `subsys_initcall()`, `fs_initcall()`, `device_initcall()` (what
    `module_init()` becomes in built-in code) and others; the linker collects them
    into sections that `do_initcalls()` walks level by level. `initcall_debug`
    prints each call and its time. — `include/linux/init.h`, `init/main.c`
    (`do_initcalls()`, `do_one_initcall()`).
  - **Read:** https://docs.kernel.org/admin-guide/kernel-parameters.html
    (`initcall_debug`). Deepened by 2.2 (`module_init`).
- **initramfs and the root filesystem** (`initramfs`)
  - **Simple:** A small set of files in memory whose `/init` finds the real disk,
    attaches it as `/`, and hands over to the real init.
  - **Deep:** The bootloader loads the initramfs (a cpio archive) next to the
    kernel; the kernel unpacks it into a RAM-backed root and runs `/init`. That
    program loads what is needed to reach `root=` (disk drivers, decryption), mounts
    it and calls `switch_root`. Without an initramfs, the kernel mounts `root=`
    itself and panics with "VFS: Unable to mount root fs" if it can't. —
    `init/initramfs.c`, `init/do_mounts.c`,
    `Documentation/filesystems/ramfs-rootfs-initramfs.rst`.
  - **Read:** man 8 `switch_root`, man 7 `bootparam`.

### Real-world card

```sh
cat /proc/cmdline                       # your kernel command line
ls /sys/firmware/efi && echo UEFI       # booted by UEFI?
ls /boot                                # the kernels and initramfs files side by side
sudo dmesg | head -n 30                 # this boot's first kernel messages
```

At the GRUB menu of a test machine or virtual machine, press `e` and add
`initcall_debug` for one boot, then read `dmesg`. Never experiment on a computer
you depend on.

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** BIOS and UEFI as described; GRUB's menu layout and keys (`e`,
  Ctrl-X, F10, Esc); the `linux` and `initrd` lines; one-boot edits; initcall
  levels and the `initcall_debug` message format; the "Unknown kernel command line
  parameters" message; unknown parameters passed to init; `/sys/firmware/efi`.
- **Simplified:** the boot view skips most of `start_kernel()`, ACPI table parsing
  and device probing details. The lab boots only 6.18.0; the 6.12.0 entry is shown
  but not run. The lab's firmware and GRUB are drawings with the real keys and
  text, not real firmware or GRUB code. Real distributions use `root=UUID=...`; the
  lab uses `root=/dev/vda2` so it is easy to read. Times in `dmesg` are the lab's
  own. The kernel's version line is abbreviated.

### Lab needs

A boot model with stages (firmware, GRUB, kernel, initcalls, initramfs, root, PID
1. driven by a command line; a GRUB screen (menu, submenu, editor with `e`, Ctrl-X,
   F10, Esc, and a `c` command line with `ls`, used in P.10); `quiet`,
   `initcall_debug` (with real initcall names for the Machine's drivers),
   unknown-parameter passing to init's environment; `/proc/cmdline`; `dmesg` with the
   boot log; `/sys/firmware/efi` with its usual entries; `/boot` holding
   `vmlinuz-6.18.0`, `initrd.img-6.18.0` and the 6.12.0 pair.

---

## P.5 — The Kernel Up Close

- **Id:** `prologue-machine-in-section-05-kernel-up-close` · **Region / NPC:** The Machine in Section / init, the Watchdog; on the drawing: the Gatekeeper, the Dockmaster, the Maintainer · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `sys-user-kernel-mode` · **Skills unlocked:** `sys-kernel-role`

### Scene

> **init:** I keep an old drawing. The Machine, cut open, like a page from a service manual. "Section of the Machine, before the Kernelfall."
>
> **init:** Bottom floor: the hardware. Top floor: us, the programs. Between them, filling most of the page: the Kernel.
>
> **The Watchdog:** The Kernel isn't a process like you, child. It's the thing that runs processes. (It keeps a few helpers of its own. They work for it.)
>
> **init:** Every one of us goes through it. None of us goes around it. Let me show you why we can't.

### See it (X-ray)

The Section drawing opens inside (a new X-ray view): hardware at the bottom, the
kernel's parts in the middle, Userland on top. Each command lights the parts it
touches.

**Part 1: what the kernel owns.** Five things, and a program reaches none of them
directly: **CPU time** (who runs, and when), **memory**, **devices**, **files** and
the **network**. The kernel shares them out, keeps programs apart, and checks every
request.

init runs `poke`, a small program that tries to read the kernel's own memory
directly, at the **memory address** `0xffffffff81000000` (every byte of memory has a
number, its address; `0x` means the number is written in hexadecimal, base 16):

```
$ ./poke
Segmentation fault
```

```
--- SIGSEGV {si_signo=SIGSEGV, si_addr=0xffffffff81000000, ...} ---
+++ killed by SIGSEGV +++
```

The CPU refused the read, because `poke` runs in user mode. The kernel was called in
to deal with it, and ended `poke` with a **signal**: a short notice the kernel
delivers to a process. This one, `SIGSEGV` ("segmentation violation", a bad memory
access), ends the process unless it was prepared for it. Other signals: `SIGINT`
when you press Ctrl-C, `SIGTERM` for "please stop". "Not its memory, not the
hardware. It has to ask."

**Part 2: kernel space and user space.** One picture of a process's addresses on
x86-64: the lower half is **user space** (its own program and data); the upper half
is **kernel space**, present in every process but locked. A syscall is how a
program gets the kernel to work in the upper half for it.

**Part 3: one big program, with add-ons.** Linux is a **monolithic** kernel: the
scheduler, memory, filesystems, drivers and networking all run in kernel mode, in
one program. (A **microkernel**, like seL4 or QNX's, keeps only the basics in the
kernel and runs drivers and filesystems as separate processes that pass messages;
safer when a driver fails, slower to talk.) Linux can still grow while it runs:
**modules**, pieces of the kernel kept in files and added when needed.

```
$ ls /lib/modules/6.18.0/kernel
drivers  fs  net
$ cat /proc/modules
e1000 167936 0 - Live 0x0000000000000000
```

The Dockmaster speaks from the drawing: "Modules wait on disk until they're needed.
I load them. When the Deep wakes up, you'll write one." (The address shows as zeros
for anyone but root.)

**Part 4: Linux and the distribution.** `uname -sr` prints `Linux 6.18.0`: that's
the kernel. `cat /etc/os-release` prints `PRETTY_NAME="Kernelfall GNU/Linux"`:
that's the **distribution**, Linux plus everything around it. init: "Linux is only
the Kernel. I, the shell, the C library, `ls` and `cat`: we're the rest. Debian,
Fedora and Android all run the Linux kernel with different things on top."

**Part 5: which Linux.** The Maintainer, from the drawing's last panel: "New kernels
come out of **mainline** about every nine or ten weeks. **Stable** releases add
fixes to them. Once a year, one becomes **LTS**, long-term support, and gets fixes
for years. This Machine runs 6.18 LTS, so everything you learn here stays true while
you learn it." And one line about the license: Linux is free software under the
**GPL, version 2**: anyone may use, study, change and share it, and whoever shares a
changed kernel must share its source too.

### Build it

The player writes their own `uname`: the `uname` command is a thin wrapper around a
syscall of the same name.

- **Starter provides:** `myuname.c`, complete except one line:

  ```c
  #include <stdio.h>
  #include <sys/utsname.h>

  int main(void)
  {
  	struct utsname u;

  	if (uname(&u) < 0)
  		return 1;
  	printf("%s %s\n", u.sysname, u.release);
  	return 0;
  }
  ```

  init's comment explains that `struct utsname` is a record with named fields,
  that `uname()` asks the kernel to fill it in, and that `u.machine` holds the CPU
  type.
- **Player does:** print `u.machine` too, run `./myuname`, then run `uname -srm`
  and compare.
- **Checker verifies (behavior):**
  - `./myuname` made the `uname` syscall, exited 0, and printed `Linux`, `6.18.0`
    and `x86_64` on one line.
  - `uname` with at least the `-m` option ran too.
  - `./poke` was run once by the player (Part 1 chip), and ended with `SIGSEGV`.

### Watch it

**Predict:** "Your program and the `uname` command: will they print the same
release?" Both made the same syscall, and X-ray shows them side by side:

```
uname({sysname="Linux", nodename="machine", ...}) = 0
```

```
$ ./myuname
Linux 6.18.0 x86_64
$ uname -srm
Linux 6.18.0 x86_64
```

The Section drawing gets its first label, "Kernel", and a dotted line around it:
"monolithic". The Gatekeeper's portrait appears at the line between user and kernel
space: "Every request comes through me. One day you'll come through in person."

### Debrief

> **init:** It owns the CPU, the memory, the devices, the files and the wires, and it shares them out. That's a kernel.
>
> **init:** But how does it know what hardware it has? Nobody tells it at the factory. Let's go down to the bottom floor.

P.6 begins.

### Hints

1. Nudge: "`u` has more fields than the two the program prints. Which one holds the
   CPU type?"
2. Concept: "`printf` takes a format with one `%s` per piece of text, then the
   pieces in the same order."
3. Point at the spot: "Change the format to `\"%s %s %s\\n\"` and add `u.machine`
   after `u.release`."

### Codex (chapter: The Machine in Section)

- **What the kernel owns** (`kernel-resources`, deepens: `kernel`)
  - **Simple:** CPU time, memory, devices, files and the network. Programs reach
    them only by asking.
  - **Deep:** A program that touches what isn't its own gets a fault, and the
    kernel answers with a signal (`SIGSEGV`). — `arch/x86/mm/fault.c`
    (`do_user_addr_fault()`), `kernel/signal.c`.
  - **Read:** man 7 `signal`.
- **Kernel space and user space** (`kernel-user-space`, deepens: `user-kernel-mode`)
  - **Simple:** Every process's addresses are split: the lower part is its own,
    the upper part belongs to the kernel and is locked.
  - **Deep:** On x86-64 with 4-level page tables, user space is the 128 TiB from
    `0` to `0x00007fffffffffff`; kernel space is the top half. The kernel's pages
    are marked supervisor-only, and with page-table isolation (PTI) most of them
    aren't even mapped while user code runs. — `Documentation/arch/x86/x86_64/mm.rst`,
    `arch/x86/mm/pti.c`.
  - **Read:** https://docs.kernel.org/arch/x86/x86_64/mm.html. Deepened by P.8
    (pages and maps).
- **Signals** (`signals`)
  - **Simple:** Short notices the kernel delivers to a process. Some end it:
    `SIGSEGV` for a bad memory access, `SIGINT` for Ctrl-C.
  - **Deep:** Each signal has a number and a default action (end, end with a core
    dump, ignore, stop, continue); a process may install a handler for most. —
    `kernel/signal.c`, `include/uapi/asm-generic/signal.h`.
  - **Read:** man 7 `signal`. Deepened by S.3 (sending signals) and 1.8 (handling
    them).
- **Monolithic kernel and modules** (`monolithic-kernel`)
  - **Simple:** Linux is one big program in kernel mode, which can load extra
    pieces, modules, while it runs.
  - **Deep:** Every part of Linux shares one address space and full privilege, so a
    bad driver can crash the whole machine. Microkernels (seL4, QNX, MINIX 3) run
    drivers as processes instead. Linux modules are `.ko` files under
    `/lib/modules/$(uname -r)`, loaded with `finit_module()` and listed in
    `/proc/modules`. — `kernel/module/main.c`, `kernel/module/procfs.c`.
  - **Read:** man 8 `lsmod`, man 2 `finit_module`. Deepened by 2.2 (your first
    module).
- **Linux and distributions** (`linux-distribution`, deepens: `operating-system`)
  - **Simple:** Linux is the kernel. A distribution adds init, a shell, a C library,
    tools and a way to install software.
  - **Deep:** GNU/Linux distributions combine Linux with GNU tools (coreutils,
    bash), a C library (glibc or musl), an init system (often systemd) and a package
    manager. Android uses the Linux kernel with its own user space (bionic, ART).
    `uname` asks the kernel who it is; `/etc/os-release` says which distribution
    you're on. — `kernel/sys.c` (`uname`), `init/version.c`.
  - **Read:** man 2 `uname`, man 5 `os-release`.
- **Kernel versions: mainline, stable, LTS** (`kernel-versions`)
  - **Simple:** A new kernel comes out about every nine or ten weeks; stable and
    long-term (LTS) releases keep getting fixes. The game follows 6.18 LTS.
  - **Deep:** Each mainline release opens with a two-week merge window, then weekly
    release candidates (`-rc1`, `-rc2`, …). Stable maintainers backport fixes as
    `6.18.1`, `6.18.2` and so on. One release a year, usually the last, becomes
    LTS; kernel.org lists each one's projected end of life. —
    `Documentation/process/2.Process.rst`, https://www.kernel.org/category/releases.html.
  - **Read:** https://docs.kernel.org/process/2.Process.html. Deepened by 2.13
    (how mainline works).
- **The GPL** (`kernel-license`)
  - **Simple:** Linux is free software under the GPL, version 2: use, study, change
    and share it, and share your source when you share a changed kernel.
  - **Deep:** The kernel is `GPL-2.0-only`, with a "syscall note" that keeps
    ordinary programs which only use syscalls outside the GPL. Every source file
    states its license in an `SPDX-License-Identifier` line. Modules declare theirs
    with `MODULE_LICENSE()`. — `COPYING`, `LICENSES/`,
    `Documentation/process/license-rules.rst`.
  - **Read:** https://docs.kernel.org/process/license-rules.html. Deepened by 2.2.

### Real-world card

```sh
uname -srm                         # kernel name, release, CPU type
cat /etc/os-release                # which distribution
ls /lib/modules/$(uname -r)        # this kernel's modules on disk
lsmod | head                       # the ones loaded now
```

Then look up your kernel's release on https://www.kernel.org: mainline, stable or
longterm?

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** `uname()` and `struct utsname`; `SIGSEGV` for a user-mode read of
  a kernel address; the x86-64 address split; `/proc/modules` columns and its
  zeroed addresses for non-root; `/lib/modules/<release>` layout; the release
  model; the license facts.
- **Simplified:** `poke` is a lab program. The lab's `/lib/modules` holds only the
  Machine's few modules. The X-ray `SIGSEGV` line is abbreviated (real `strace`
  also prints `si_code`).

### Lab needs

The Section drawing's inside view; `uname` (syscall and command, release `6.18.0`,
machine `x86_64`, nodename `machine`); `/etc/os-release`; `/lib/modules/6.18.0/`
with `kernel/drivers/net/ethernet/intel/e1000/e1000.ko` and a few others;
`/proc/modules` listing `e1000`; a `poke` program and a fault that ends it with
`SIGSEGV` and prints `Segmentation fault`.

---

## P.6 — Finding the Hardware

- **Id:** `prologue-machine-in-section-06-finding-the-hardware` · **Region / NPC:** The Machine in Section, the bottom floor / init; on the drawing: udev, ksoftirqd · **Tracks:** `kernel` · **Time:** ~25 min · **Prerequisites:** `sys-kernel-role` · **Skills unlocked:** `drv-hardware-discovery`

### Scene

> **init:** A kernel isn't built for one machine. The same 6.18 runs on laptops, phones and servers. So at every boot it has to find out what it's sitting on.
>
> **The Watchdog:** And give every part a driver. A part without a driver is furniture.
>
> **init:** A _driver_ is the piece of the Kernel that knows how to work one kind of device: this network card, that disk. Without one, the Kernel can see the device but can't use it.
>
> **init:** On machines like ours, the firmware hands over a description and the Kernel asks around for the rest. On small boards, someone wrote the description by hand. You'll read both.

### See it (X-ray)

**Part 1: how the kernel learns its hardware.** Devices are connected to the CPU by
**buses**: the wiring and rules for talking over it (PCI for cards inside a PC, USB
for plugged-in devices, I²C for small chips on a board). Two ways to find what's
there, depending on the machine:

- **x86 PCs and servers (like the Machine):** the firmware provides **ACPI** tables
  that describe the board (CPUs, memory, power buttons, devices that can't announce
  themselves), and the kernel **enumerates** buses that can: on **PCI**, every
  device answers with a vendor ID (who made it) and a device ID (which model). x86
  normally uses no device tree.
- **Most ARM and RISC-V boards** (phones, Raspberry Pi, routers): many devices sit
  at fixed addresses and can't announce themselves, so a **device tree** describes
  them. It is written as text (`.dts`), compiled by a tool called `dtc` into a
  binary `.dtb`, and handed to the kernel by the bootloader. (Arm servers usually
  use ACPI instead.)

**Part 2: the Machine's buses.**

```
$ lspci -k
00:00.0 Host bridge: Intel Corporation 82G33/G31/P35/P31 Express DRAM Controller
00:01.0 SCSI storage controller: Red Hat, Inc. Virtio block device
	Kernel driver in use: virtio-pci
00:02.0 Ethernet controller: Intel Corporation 82540EM Gigabit Ethernet Controller
	Kernel driver in use: e1000
	Kernel modules: e1000
$ cat /sys/bus/pci/devices/0000:00:02.0/vendor /sys/bus/pci/devices/0000:00:02.0/device
0x8086
0x100e
$ ls -l /sys/bus/pci/devices/0000:00:02.0/driver
lrwxrwxrwx 1 root root 0 Jan  1 00:00 /sys/bus/pci/devices/0000:00:02.0/driver -> ../../../bus/pci/drivers/e1000
```

`/sys` is a folder the kernel fills with what it knows about devices, one small file
per fact. `0x8086` is Intel's vendor number. The last line is a **link** (a file
that points to another path, shown with `->`): the card's driver is `e1000`.

**Part 3: binding.** The Section drawing shows the **driver model**: a **bus**
(PCI), its **devices** (what was found) and its **drivers** (code that can run a
kind of device). When a device and a driver appear on the same bus, the bus
**matches** them (for PCI, the device's IDs against a list of IDs in the driver);
the driver's `probe()` function then takes the device over, and the `driver` link
appears. udev, on the drawing: "When a device turns up, the Kernel announces it.
I'm a program in Userland that listens. If the driver is a module, I ask for it
to be loaded, and I give the device a door in `/dev`."

**Part 4: interrupts and MMIO, in one picture.** A driver controls its device
through the device's **registers**: small slots it can read or write ("start
sending", "how many bytes arrived", "lamp on"). On most hardware these appear at
memory addresses (**MMIO**, memory-mapped I/O), so the driver reads and writes
them like memory. The device gets the CPU's attention with an **interrupt**: a
signal that makes the CPU pause what it's doing and run the driver's handler.
Examples: a key pressed, a network packet arrived, a timer went off.

Where the "tap on the shoulder" picture stops being true: the CPU doesn't decide to
look; the hardware forces a jump into the kernel's code between two instructions,
whatever was running.

```
$ cat /proc/interrupts
           CPU0       CPU1
  0:         48          0   IO-APIC   2-edge      timer
 11:        301          0   IO-APIC  11-fasteoi   eth0
 ...
```

ksoftirqd, on the drawing: "The handler does the urgent part. The rest, I finish
later." (Interrupt Spire, 2.10.)

**Part 5: a device tree.** init opens `/home/you/boards/lighthouse.dts`, the
description of a small ARM board, Socket Harbor's lighthouse controller. It is a
made-up board written with real bindings (real names drivers recognize):

```dts
/dts-v1/;

/ {
	model = "Socket Harbor lighthouse";
	compatible = "kernelfall,lighthouse";
	#address-cells = <1>;
	#size-cells = <1>;

	gpio: gpio@7e200000 {
		compatible = "brcm,bcm2835-gpio";
		reg = <0x7e200000 0xb4>;
		gpio-controller;
		#gpio-cells = <2>;
	};

	leds {
		compatible = "gpio-led";

		lamp {
			label = "lighthouse:lamp";
			gpios = <&gpio 4 0>;
		};
	};
};
```

Each `{ }` block is a **node** (one device or group). `reg` gives a device's
register addresses; `compatible` names what the device is. At boot, the kernel
matches each node's `compatible` text against every driver's `of_match_table` (its
list of names it can handle). The GPIO controller is a chip whose pins software can
switch on and off; the lamp is wired to pin 4.

### Build it

- **Starter provides:** command chips for `lspci -k`, `ls /sys/bus/pci/devices` and
  `cat /proc/interrupts`; the `lighthouse.dts` file in the editor; a **board panel**
  that starts the lighthouse board's kernel far enough to match drivers and shows
  the result; and the `of_match_table` of the kernel's GPIO LED driver:

  ```c
  static const struct of_device_id of_gpio_leds_match[] = {
  	{ .compatible = "gpio-leds", },
  	{},
  };
  ```

- **Player does:**
  - On the Machine: find the disk's PCI address and the name of its driver, by
    reading the device's `driver` link in `/sys` (not just `lspci`).
  - On the lighthouse board: press Boot in the board panel. The GPIO controller
    binds, but the lamp has no driver. Read the two `compatible` texts, fix the one
    in `lighthouse.dts`, compile it with `dtc -I dts -O dtb -o lighthouse.dtb
    lighthouse.dts`, and boot the board again.
- **Checker verifies (behavior):**
  - The `driver` link of `0000:00:01.0` was read (`readlinkat`).
  - `dtc` compiled `lighthouse.dts` without errors.
  - On the board's boot, the `leds` node was bound to the `leds-gpio` driver and
    `/sys/class/leds/lighthouse:lamp` appeared.

### Watch it

**Predict:** "The node says `gpio-led`; the driver's list says `gpio-leds`. Will
the kernel treat them as the same?" No: matching compares the whole text. After the
fix, the board panel shows the driver taking the lamp, and the lamp lights:

```
leds-gpio leds: probed
$ ls /sys/class/leds
lighthouse:lamp
```

In the world: at the bottom of the Section drawing, the hardware floor fills in: a
CPU, 512 MiB of RAM, the disk, the network card, each with a line to its driver.
Far away on the map, a tiny light blinks at Socket Harbor, then goes out again:
"That board's not ours yet. 1.9."

### Debrief

> **init:** So the Kernel finds its hardware: ACPI and the PCI bus here, a device tree on boards like that one. Buses match devices to drivers, drivers take them over.
>
> **init:** Now the floor above the hardware. Who gets to use the CPU? Let's count who's running.

P.7 begins.

### Hints

1. Nudge: "In `/sys`, a device that has a driver has a link called `driver`. Where
   does the disk's link point?"
2. Concept: "A device tree node binds when its `compatible` text is exactly one of
   the texts in a driver's `of_match_table`. One letter off and nothing happens."
3. Point at the spot: "The `leds` node says `\"gpio-led\"`. The driver's list says
   `\"gpio-leds\"`."

### Codex (chapter: The Machine in Section)

- **Drivers** (`drivers`)
  - **Simple:** The part of the kernel that knows how to work one kind of device.
    Without one, a device is seen but can't be used.
  - **Deep:** Most of the kernel's code is drivers, under `drivers/`. A driver
    registers with a bus and is offered every matching device; it can be built in
    or a module. — `drivers/`, `include/linux/device/driver.h`.
  - **Read:** https://docs.kernel.org/driver-api/. Deepened by 2.4 (the Lantern).
- **Finding hardware: ACPI and PCI** (`acpi-pci`)
  - **Simple:** On PCs the firmware describes the board (ACPI) and the kernel asks
    each PCI slot what's there: vendor and device IDs.
  - **Deep:** ACPI tables (the DSDT and others) come from firmware and are parsed
    by the kernel's ACPI core. PCI devices are found by reading each slot's
    configuration space; each gets a `struct pci_dev` and a folder in
    `/sys/bus/pci/devices`. — `drivers/acpi/`, `drivers/pci/probe.c`
    (`pci_scan_device()`), `include/linux/pci.h`.
  - **Read:** man 8 `lspci`, https://docs.kernel.org/PCI/pci.html.
- **The device tree** (`device-tree`)
  - **Simple:** A text description of a board's hardware, compiled to a binary and
    given to the kernel at boot. Used by most ARM and RISC-V boards, not by PCs.
  - **Deep:** A `.dts` is a tree of nodes with properties (`compatible`, `reg`,
    `interrupts`, links like `<&gpio 4 0>`); `dtc` compiles it to a `.dtb` that the
    bootloader passes to the kernel. Drivers list the strings they handle in an
    `of_match_table` of `struct of_device_id`; bindings are documented in
    `Documentation/devicetree/bindings/`. A running system shows its tree in
    `/sys/firmware/devicetree/base` (also `/proc/device-tree`). —
    `drivers/of/`, `arch/arm64/boot/dts/`, `drivers/leds/leds-gpio.c`.
  - **Read:** https://docs.kernel.org/devicetree/usage-model.html, man 1 `dtc`.
- **Buses, devices and drivers** (`driver-model`)
  - **Simple:** A bus matches each device it finds with a driver that can run it;
    the driver's `probe()` then takes the device over.
  - **Deep:** The driver model has `struct bus_type`, `struct device` and
    `struct device_driver`. When either side is added, the core calls the bus's
    `match()`, then the driver's `probe()`; `/sys/bus/<bus>/devices` and
    `/sys/bus/<bus>/drivers` show both sides, `/sys/devices` the physical tree.
    udev, in user space, hears each new device as a uevent and loads its module by
    `modalias`. — `drivers/base/dd.c` (`driver_attach()`, `really_probe()`),
    `drivers/base/bus.c`, `drivers/pci/pci-driver.c` (`pci_bus_match()`).
  - **Read:** https://docs.kernel.org/driver-api/driver-model/overview.html, man 7
    `udev`. Deepened by 2.4 (the Lantern's device).
- **Interrupts and MMIO** (`interrupts-mmio`)
  - **Simple:** A driver works a device by reading and writing its registers at
    memory addresses; the device calls for attention with an interrupt.
  - **Deep:** A driver maps the device's register range with `ioremap()` (or
    `pci_iomap()`) and uses `readl()`/`writel()`. An interrupt (an IRQ line or a
    PCI MSI message) makes the CPU run the kernel's interrupt entry, which calls
    the handler the driver registered with `request_irq()`; slow work is deferred
    to softirqs or workqueues. `/proc/interrupts` counts them per CPU. —
    `kernel/irq/`, `kernel/softirq.c`, `include/linux/io.h`.
  - **Read:** https://docs.kernel.org/core-api/genericirq.html. Deepened by
    2.10a–2.10c (the Interrupt Spire).

### Real-world card

```sh
lspci -k                                   # PCI devices and their drivers
ls /sys/bus/pci/drivers                    # every PCI driver the kernel has now
cat /proc/interrupts                       # who interrupts the CPU, and how often
ls /sys/firmware/devicetree/base 2>/dev/null || echo "no device tree (normal on x86)"
```

On a Raspberry Pi or another ARM board, `ls /proc/device-tree` shows the live
tree, and `dtc -I fs -O dts /proc/device-tree` turns it back into text.

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** ACPI and PCI on x86, device trees on most ARM and RISC-V boards;
  PCI IDs `8086:100e` for the 82540EM and `1af4:1001` for virtio block; the `/sys`
  layout and `driver` links; `lspci -k` format; the device tree syntax, the
  `gpio-leds` and `brcm,bcm2835-gpio` compatible strings, whole-string matching;
  `/proc/interrupts` columns.
- **Simplified:** the lighthouse board is made up (real bindings, invented board),
  and its kernel is simulated only as far as matching drivers; the lab does not
  run ARM code. The Machine has three PCI devices and no ACPI table view. IRQ
  numbers and counts are the lab's own. The probe message is the lab's.

### Lab needs

`lspci` (with `-k`) and `/sys/bus/pci/{devices,drivers}` for the three devices
(`vendor`, `device`, `class`, `modalias`, `driver` link); `/sys/devices/pci0000:00`;
`/proc/interrupts`; `/sys/firmware/devicetree` absent on the Machine; a `dtc` that
compiles DTS to DTB and reports syntax errors with line numbers; the board panel:
parse the DTB and match nodes against a small table of drivers (`brcm,bcm2835-gpio`,
`gpio-leds`), then create `/sys/class/leds/lighthouse:lamp`; the `lighthouse.dts`
starter.

---

## P.7 — Who Runs

- **Id:** `prologue-machine-in-section-07-who-runs` · **Region / NPC:** The Machine in Section, the processes floor / init, the Watchdog; on the drawing: the Verger · **Tracks:** `userland`, `kernel` · **Time:** ~20 min · **Prerequisites:** `sys-kernel-role` · **Skills unlocked:** `proc-process-basics`

### Scene

> **init:** Remember: a program is a file; a process is a program running, with its own memory and its own number. Every process also has a parent: the process that started it.
>
> **The Watchdog:** And two CPUs. Two. Everybody wants one.
>
> **init:** So the Kernel takes turns for us. Hundreds of times a second, on each CPU. Let's watch.

### See it (X-ray)

1. `ps -e` lists every process:

   ```
   $ ps -e
     PID TTY          TIME CMD
       1 ?        00:00:00 init
       2 ?        00:00:00 kthreadd
      14 ?        00:00:00 ksoftirqd/0
      21 ?        00:00:00 ksoftirqd/1
      31 ?        00:00:00 kswapd0
     300 tty1     00:00:00 rescue
     318 tty1     00:00:00 ps
   ```

   PID 1 is init. PID 2, `kthreadd`, is the parent of the **kernel threads**: the
   kernel's own workers, which the scheduler runs like processes but which only ever
   run kernel code (`ksoftirqd/0` and `ksoftirqd/1` finish interrupt work, one per
   CPU; `kswapd0` frees memory).
   The rest are ordinary programs: the shell, and `ps` itself.
2. `cat /proc/300/status` shows what the kernel keeps about the rescue shell
   (`/proc` is a folder the kernel fills on demand, one folder per process):

   ```
   Name:	rescue
   State:	S (sleeping)
   Pid:	300
   PPid:	1
   VmRSS:	    1024 kB
   voluntary_ctxt_switches:	42
   nonvoluntary_ctxt_switches:	3
   ```

   `S (sleeping)`: waiting for you to type. `PPid: 1`: its parent is init. `VmRSS`:
   the memory it is using right now. The two counters say how often it gave up the
   CPU because it had to wait (voluntary), or had it taken away because its turn was
   over (nonvoluntary).
3. **The scheduler.** `nproc` prints `2`: two CPUs. init starts three busy
   programs, `yes` with its output thrown away into `/dev/null`, three times. X-ray
   shows one lane per CPU, each with its own **run queue** (the line of tasks ready
   to run there): two `yes` run at the same moment, one on each CPU, and the third
   waits in a run queue and takes turns in short slices with the one on that CPU.
   `ps -e -o pid,stat,time,comm` shows all three `R` (running, or ready to run),
   each with growing CPU time. init stops them.
4. **Many at once.** One picture: two processes add 1 to the same counter at the
   same moment and one addition is lost. The Verger, on the drawing: "That's why
   the Kernel has locks, and why I write down the order every lock is taken."
   (Lock Cathedral, 2.9.)

### Build it

- **Starter provides:** `whoami.c`, complete except one line:

  ```c
  #include <stdio.h>
  #include <unistd.h>

  int main(void)
  {
  	printf("I am process %d\n", (int)getpid());
  	return 0;
  }
  ```

- **Player does:** add a line that prints the parent's PID with `getppid()`, then
  run `./whoami` twice and `ps` once.
- **Checker verifies (behavior):**
  - Two runs of `./whoami` called `getpid` and `getppid`, exited 0, and printed
    two different PIDs.
  - Each run printed a parent PID equal to the rescue shell's PID.
  - `/proc/<pid>/status` of some process was read (re-tests the See it beat).

### Watch it

**Predict:** "Run `./whoami` twice. Same PID both times? Same parent?" Different
PIDs (each run is a new process); the same parent (the shell started both).

```
$ ./whoami
I am process 321
My parent is 300
$ ./whoami
I am process 322
My parent is 300
```

The processes floor of the Section drawing fills with small figures: init at the
root, the shell under it, the kernel threads off to one side. Labels appear: the
Process District (1.4–1.8), the Clockwork Court (3.6–3.8), the Lock Cathedral (2.9).

### Debrief

> **init:** Every process has a number, a parent and a state, and the Kernel takes turns giving each one a CPU.
>
> **init:** But each of them also thinks it has the whole Machine's memory to itself. It doesn't. Let's see how the Kernel pulls that off.

P.8 begins.

### Hints

1. Nudge: "`getpid()` gives your own number. Is there a function for your parent's?"
2. Concept: "`getppid()` returns the parent's PID. `printf` with `%d` prints a whole
   number."
3. Point at the spot: "After the first `printf`, add
   `printf(\"My parent is %d\\n\", (int)getppid());`."

### Codex (chapter: The Machine in Section)

- **Process** (`process`, deepens: `program-process`)
  - **Simple:** A program while it runs: its own memory, a PID, a parent and a
    state.
  - **Deep:** The kernel keeps one `struct task_struct` per task (a process or a
    thread): its PID, parent, state, credentials, memory (`mm`), open files and
    more. Kernel threads have no `mm` and descend from `kthreadd`.
    `/proc/<pid>/status` prints part of it. — `include/linux/sched.h`
    (`struct task_struct`), `kernel/fork.c`, `kernel/kthread.c`,
    `fs/proc/array.c` (`proc_pid_status()`).
  - **Read:** man 1 `ps`, man 5 `proc`. Deepened by S.3 (processes from the
    outside), 1.4 (`fork`, `exec`, `wait`) and 1.5 (process state in `/proc`).
- **The scheduler** (`scheduler`)
  - **Simple:** The part of the kernel that decides which process runs on each CPU,
    and for how long.
  - **Deep:** Ready tasks wait on a per-CPU run queue. Since 6.6 the default policy
    is EEVDF (it replaced CFS): each task earns a fair share of CPU time, and the
    one with the earliest virtual deadline runs next. A context switch saves one
    task's registers and loads another's. — `kernel/sched/core.c` (`__schedule()`),
    `kernel/sched/fair.c`, `Documentation/scheduler/sched-eevdf.rst`.
  - **Read:** man 7 `sched`. Deepened by 1.8 (interleaving) and the Clockwork Court
    (Act III).
- **Kernel threads** (`kernel-threads`)
  - **Simple:** The kernel's own workers. They show in `ps` under their own names
    but run only kernel code.
  - **Deep:** Created with `kthread_create()`/`kthread_run()` by `kthreadd`
    (PID 2). `ksoftirqd/N` finishes deferred interrupt work on CPU N; `kswapd0`
    frees memory when it runs low; `kworker` threads run workqueues. —
    `kernel/kthread.c`, `kernel/softirq.c`, `mm/vmscan.c`.
  - **Read:** man 1 `ps`. Deepened by 2.10b (workqueues).

### Real-world card

```sh
ps -e --forest | head -n 30       # the process tree
ps -o pid,ppid,stat,comm -p $$    # your shell: its PID, parent and state
grep ctxt /proc/$$/status         # how often it gave up the CPU
nproc                             # how many CPUs you have
```

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** `ps` columns; PID 1 and PID 2; kernel thread names; the
  `/proc/<pid>/status` field names and formats; `R` and `S` states; `getpid` and
  `getppid`; EEVDF as the 6.18 default.
- **Simplified:** the Machine has few processes and kernel threads (a real system
  has dozens of kernel threads). The CPU lanes show the lab's own time slices, not
  EEVDF's real arithmetic, and no task moves between the two CPUs (real Linux
  balances load across them). `/proc/<pid>/status` shows only the fields the levels
  use.

### Lab needs

`ps` with `-e` and `-o pid,ppid,stat,time,comm`; kernel threads `kthreadd`,
`ksoftirqd/0`, `ksoftirqd/1`, `kswapd0` as tasks; `/proc/<pid>/status` with `Name`, `State`,
`Pid`, `PPid`, `VmRSS`, the two context-switch counters; `nproc` printing `2`;
`yes` and `/dev/null`; init able to start and stop background processes; programs
run from the rescue shell as its children; one CPU lane per CPU in X-ray, each
with its run queue.

---

## P.8 — Pages and Maps

- **Id:** `prologue-machine-in-section-08-pages-and-maps` · **Region / NPC:** The Machine in Section, the memory floor / init; on the drawing: kswapd · **Tracks:** `kernel` · **Time:** ~25 min · **Prerequisites:** `proc-process-basics` · **Skills unlocked:** `mem-virtual-memory-basics`

### Scene

> **init:** 512 MiB. That's all the memory the Machine has. And yet every process here believes it has 128 TiB of addresses to itself. That's about 250,000 times more.
>
> **The Watchdog:** Lies. The Kernel tells everyone lies.
>
> **init:** Useful ones. Each process gets its own map. The Kernel decides which parts of each map are real memory, and which memory.

### See it (X-ray)

1. **Physical and virtual.** **Physical memory** is the RAM chips, each byte with
   its own real address. A process never sees those. It uses **virtual addresses**,
   its own numbering, and a part of the CPU, the **MMU** (memory management unit),
   translates each one into a real address on every memory access.

   > **init:** Like flat numbers in a building. Two buildings both have a flat 4B; the city map tells the post which street each is on.

   Where the picture stops being true: the translation isn't looked up by a person;
   the MMU does it in hardware, for every access, and the kernel can change a
   process's map at any time.
2. **Pages and page tables.** Memory is handled in **pages** of 4 KiB (4096 bytes).
   For each process the kernel keeps **page tables**: a lookup from a virtual page
   to a physical page (a "frame"). One picture: two processes, both using the
   virtual address `0x7ffd...`, mapped to two different frames; the kernel's half
   mapped the same in both. A page with no mapping causes a **page fault**, and the
   kernel decides: fill it in, or end the process (P.5's `SIGSEGV`).
3. **The whole Machine.** `free` and `cat /proc/meminfo`:

   ```
   $ free
                  total        used        free      shared  buff/cache   available
   Mem:          502340       38212      421508         120       42620      449860
   Swap:              0           0           0
   $ cat /proc/meminfo
   MemTotal:         502340 kB
   MemFree:          421508 kB
   MemAvailable:     449860 kB
   Buffers:            1876 kB
   Cached:            40744 kB
   ...
   ```

   `MemTotal` is a little under 512 MiB: the firmware and the kernel itself keep
   some. `Cached` is the **page cache**: copies of file contents the kernel keeps in
   RAM so the next read doesn't touch the disk (a **cache** is any copy kept close
   by to make the next use faster). `MemAvailable` counts it as available: the
   kernel can drop cached copies when a program needs memory. kswapd, on the
   drawing: "When memory runs short, I wake up and clear room. Slab Mines, 2.8."
4. **One process's map.** `cat /proc/self/maps` (`self` means whichever process is
   reading, here `cat`):

   ```
   00400000-00401000 r--p 00000000 fe:02 1311  /bin/cat
   00401000-00405000 r-xp 00001000 fe:02 1311  /bin/cat
   00405000-00406000 rw-p 00005000 fe:02 1311  /bin/cat
   01a6c000-01a8d000 rw-p 00000000 00:00 0     [heap]
   7ffd6b2e1000-7ffd6b302000 rw-p 00000000 00:00 0  [stack]
   ```

   Each line is one region: its addresses, what may be done there (`r` read, `w`
   write, `x` run as code, `p` private to this process), and what it holds: the
   program's code (`r-x`), its data (`rw-`), the **heap** (memory a program asks for
   while it runs) and the **stack** (where a function keeps its local variables).
   Everything between them, up to the kernel's half, is unused.

### Build it

- **Starter provides:** `where.c`. It prints the address of a global variable (one
  declared outside any function) and then prints its own `/proc/self/maps` (with
  `open`, `read` and `write`, all written for you, under init's comment "you'll
  write this kind of loop in 1.6").
- **Player does:** add a local variable (one declared inside `main`) and print its
  address next to the global's (`printf("local  at %p\n", (void *)&local);`), run
  `./where`, and find which region each address falls in.
- **Checker verifies (behavior):**
  - `./where` printed at least two addresses and its maps, and exited 0.
  - One printed address falls inside the run's `[stack]` region and one inside a
    `rw-p` region of `where` itself.
  - `/proc/meminfo` was read during the level.

### Watch it

**Predict:** "The global, and the local: which one lives on the stack?" The local:
`main`'s variables live on the stack, near the top of user space. The global lives
in the program's data region, near the bottom.

```
$ ./where
global at 0x405010
local  at 0x7ffd6b300a4c
00400000-00401000 r--p 00000000 fe:02 1402  /home/you/where
...
00405000-00406000 rw-p 00005000 fe:02 1402  /home/you/where
7ffd6b2e1000-7ffd6b302000 rw-p 00000000 00:00 0  [stack]
```

The memory floor of the Section drawing lights: RAM frames at the bottom, two
process maps above with arrows down to them, the page cache as a shelf of file
pages. Labels: the Slab Mines (2.8a–b), the Page-Table Labyrinth (3.3–3.5).

### Debrief

> **init:** Pages, page tables, a map for each of us, and a cache of files in whatever memory is left. The Kernel keeps all of it straight.
>
> **init:** One floor left before you've seen it all: files, devices and wires. And one rule that ties them together.

P.9 begins.

### Hints

1. Nudge: "`&global` is the address of the global. How would you get the address of
   a variable inside `main`?"
2. Concept: "`&name` is the address of any variable. `%p` prints an address; cast it
   to `(void *)` first."
3. Point at the spot: "Inside `main`, add `int local = 0;` and
   `printf(\"local  at %p\\n\", (void *)&local);` before the maps are printed."

### Codex (chapter: The Machine in Section)

- **Virtual memory** (`virtual-memory`, deepens: `kernel-user-space`)
  - **Simple:** Each process uses its own made-up addresses; the CPU's MMU
    translates them to real RAM, page by page.
  - **Deep:** Physical memory is managed in page frames (`struct page`, grouped as
    folios). Each process's address space is a `struct mm_struct` with a list of
    regions (`struct vm_area_struct`) and its page tables (four levels on most
    x86-64 machines: PGD, PUD, PMD, PTE; five with LA57). A page fault enters
    `handle_mm_fault()`. — `include/linux/mm_types.h`, `mm/memory.c`,
    `arch/x86/mm/fault.c`.
  - **Read:** https://docs.kernel.org/admin-guide/mm/concepts.html. Deepened by
    1.4 (memory after `fork`), 2.5 (separate address spaces) and the Page-Table
    Labyrinth (Act III).
- **Memory maps** (`proc-maps`)
  - **Simple:** `/proc/<pid>/maps` lists a process's memory regions: code, data,
    heap, stack, and what each one holds.
  - **Deep:** One line per `vm_area_struct`: start and end address, permissions,
    file offset, device, inode and path (or `[heap]`, `[stack]`, `[vdso]`). Real
    Linux randomizes where the stack, heap and libraries go (ASLR). —
    `fs/proc/task_mmu.c` (`show_map_vma()`).
  - **Read:** man 5 `proc_pid_maps`. Deepened by 2.5.
- **Memory use: meminfo** (`meminfo`)
  - **Simple:** `/proc/meminfo` and `free` show how much RAM there is, how much is
    free, and how much holds cached files.
  - **Deep:** `MemTotal` is usable RAM after firmware and kernel reservations;
    `MemAvailable` estimates what can be given to programs without swapping,
    counting reclaimable cache. When free memory runs low, `kswapd` reclaims pages
    in the background. — `fs/proc/meminfo.c` (`meminfo_proc_show()`),
    `mm/vmscan.c`, `mm/page_alloc.c`.
  - **Read:** man 5 `proc_meminfo`, man 1 `free`. Deepened by 2.8.
- **The page cache** (`page-cache`)
  - **Simple:** Copies of file contents kept in spare RAM, so reading a file a
    second time needn't touch the disk.
  - **Deep:** Each file's inode has an address space (`struct address_space`)
    holding its cached folios; `read()` copies from them (`filemap_read()`), and
    a miss asks the filesystem to read from the disk. Clean cache pages are freed
    first when memory runs short. — `mm/filemap.c`, `include/linux/fs.h`.
  - **Read:** https://docs.kernel.org/admin-guide/mm/concepts.html. Deepened by
    P.10 (one `read`, end to end).

### Real-world card

```sh
free -h                               # memory in human units
grep -E 'MemTotal|MemAvailable|Cached' /proc/meminfo
cat /proc/self/maps                   # cat's own map: notice the shared libraries
cat /proc/self/maps                   # again: the addresses moved (ASLR)
getconf PAGESIZE                      # 4096 on x86-64
```

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** 4 KiB pages; the MMU, page tables and page faults as described;
  the `free`, `/proc/meminfo` and `/proc/<pid>/maps` formats; the page cache and
  `MemAvailable`; kswapd's role.
- **Simplified:** the lab's programs run in a wasm interpreter, so their memory is
  modeled: the lab produces maps with the usual x86-64 layout, without ASLR
  (addresses repeat from run to run; real Linux randomizes them), with no shared
  libraries (the lab's programs are static) and no `[vdso]`. `meminfo` shows only
  the main fields, with the lab's own numbers.

### Lab needs

`free` and `/proc/meminfo` (main fields, consistent with 512 MiB); per-process
`/proc/<pid>/maps` and `/proc/self` with regions that contain the addresses the
interpreter actually hands out (code, data, heap, stack), stable across runs; a
memory picture in the Section drawing; `where.c` starter.

---

## P.9 — Files, Doors and Wires

- **Id:** `prologue-machine-in-section-09-files-doors-wires` · **Region / NPC:** The Machine in Section, the files, devices and network floors / init; on the drawing: udev, the Harbormaster, the Tollkeeper · **Tracks:** `userland`, `kernel` · **Time:** ~25 min · **Prerequisites:** `drv-hardware-discovery`, `mem-virtual-memory-basics` · **Skills unlocked:** `io-everything-is-a-file`, `sys-kernel-subsystems`

### Scene

> **init:** A file on the disk. A number the Kernel works out when you ask. A door to a driver. On Linux, you open all three the same way.
>
> **init:** That's the rule people quote: "everything is a file." It isn't quite everything. But it's close, and it's why one small `cat` can read half the Machine.

### See it (X-ray)

1. **One tree, many filesystems.** A **filesystem** is the way files and folders are
   laid out and found; several kinds are **mounted** (attached) into the one tree.
   `cat /proc/mounts`:

   ```
   /dev/vda2 / ext4 rw,relatime 0 0
   proc /proc proc rw,nosuid,nodev,noexec,relatime 0 0
   sysfs /sys sysfs rw,nosuid,nodev,noexec,relatime 0 0
   devtmpfs /dev devtmpfs rw,nosuid,size=250000k,mode=755 0 0
   ```

   Four filesystems in one tree: ext4 on the disk for `/`, and three the kernel
   makes up as you look: **procfs** (processes and kernel state), **sysfs**
   (devices and drivers, P.6) and **devtmpfs** (device doors).
2. **The VFS.** The same `cat` on three of them, and X-ray's Section view shows the
   **Virtual File System** (the kernel's common front for every filesystem) handing
   each `read` to a different one:

   ```
   $ cat /etc/motd                    read → vfs_read() → ext4_file_read_iter()
   Welcome to the Machine.
   $ cat /proc/uptime                 read → vfs_read() → proc_reg_read_iter()
   812.47 790.10
   $ cat /sys/class/net/lo/mtu        read → vfs_read() → kernfs_fop_read_iter()
   65536
   ```

   Same `openat`, `read`, `write` for `cat`; different code underneath.
3. **Devices.** `ls -l /dev/null /dev/tty /dev/vda`:

   ```
   crw-rw-rw- 1 root root   1, 3 Jan  1 00:00 /dev/null
   crw-rw-rw- 1 root tty    5, 0 Jan  1 00:00 /dev/tty
   brw-rw---- 1 root disk 254, 0 Jan  1 00:00 /dev/vda
   ```

   `c` is a **character device** (a stream of bytes, like a terminal), `b` a
   **block device** (storage read in fixed-size blocks, like a disk). The two
   numbers are the **major** (which driver) and **minor** (which device of that
   driver). `cat /dev/null` returns at once: the null driver always answers "end of
   file". udev, on the drawing: "When the disk's driver took the disk in P.6, the
   Kernel made `/dev/vda`, and I set who may use it."
4. **Networking, shown, not built.** `ls /sys/class/net` prints `eth0  lo` (`lo`,
   loopback, is a pretend network inside the Machine; `eth0` is the card).
   `cat /proc/net/dev` counts each one's bytes and **packets** (the small pieces data
   is sent in). The drawing shows one message's trip: a program's **socket** (a file
   descriptor for talking over a network) → **TCP** (keeps the bytes in order, resends
   lost ones) → **IP** (addresses each packet) → the netfilter gates → the network
   card's driver (`e1000`) → the wire. The Harbormaster: "I run the stack. Socket
   Harbor, 1.9." The Tollkeeper: "And I stand at the gates. Netfilter Wall, 2.11."
5. **Processes talking to each other** (one line): pipes, signals, shared memory and
   message queues. "The Aqueducts and the Alarm Bells, 1.7 and 1.8."
6. **The kernel's own log.** `dmesg` shows the boot from P.4 again, and the lines
   drivers wrote while taking their devices:

   ```
   [    0.000000] Linux version 6.18.0 (...)
   [    0.413902] e1000: Intel(R) PRO/1000 Network Driver
   [    0.520114] virtio_blk virtio0: [vda] 4194304 512-byte logical blocks (2.15 GB/2.00 GiB)
   ```

   The kernel writes these with `printk()` into a ring buffer (a fixed-size log
   where the newest lines push out the oldest); `dmesg` reads it from `/dev/kmsg`.
7. **What ties it together.** Every one of these went through the Syscall Gate:
   `openat`, `read`, `write`. The Gatekeeper: "Every floor. Through me."

Then the Section drawing completes, and every part gets its label, its folder in the
kernel's source code and its map region: the table at the top of this spec, on one
page.

### Build it

- **Starter provides:** `look.c`: it opens one path, reads up to 256 bytes and
  writes them to standard output, with every return value checked. The path is on
  one line: `const char *path = "/etc/motd";`.
- **Player does:** run it as it is, then change the path and run it on a file in
  `/proc` and on a file in `/sys` (any; init suggests `/proc/uptime` and
  `/sys/class/net/eth0/address`). Last, on the Section drawing's table, match three
  parts to their source folders (drag `mm/`, `fs/`, `net/`).
- **Checker verifies (behavior):**
  - `./look` read successfully from files on ext4, procfs and sysfs (three runs),
    each read returning more than 0 bytes, each followed by a `write` on fd 1.
  - The three folder matches were made (a Predict-style beat: wrong drops cost
    nothing and are simply corrected).

### Watch it

**Predict:** before the `/sys` run: "Which filesystem will answer?" X-ray shows the
VFS routing the same `read` to sysfs, then to the network card's driver, which
knows the card's hardware address:

```
$ ./look
52:54:00:12:34:56
```

```
openat(AT_FDCWD, "/sys/class/net/eth0/address", O_RDONLY) = 3
read(3, "52:54:00:12:34:56\n", 256)                      = 18
write(1, "52:54:00:12:34:56\n", 18)                      = 18
```

The whole Section drawing lights up once, floor by floor, then dims to show what is
still dark: everything but one lamp in Userland. init: "Every region on your map is
one of these parts. That's what we're rebuilding."

### Debrief

> **init:** You've seen every floor of the Machine. The Kernel's parts, where they live in its source, and which street of the map will teach each one.
>
> **The Watchdog:** Pretty drawing. Now it's going to fall down again.
>
> **init:** What? Old dog, what did you do?
>
> **The Watchdog:** Nothing! Something in the boot entry. I can feel it. Next restart, we're stuck.

P.10 begins.

### Hints

1. Nudge: "The program reads whatever `path` names. What should it name for the
   `/proc` run?"
2. Concept: "`/proc` and `/sys` files are opened and read exactly like disk files.
   Only the path changes."
3. Point at the spot: "Change the text to `\"/proc/uptime\"`, run, then to
   `\"/sys/class/net/eth0/address\"`, run."

### Codex (chapter: The Machine in Section)

- **The VFS: everything is a file** (`vfs`, deepens: `write-syscall`)
  - **Simple:** One set of calls (`open`, `read`, `write`, `close`) works on disk
    files, `/proc`, `/sys` and devices; the VFS hands each to the right code.
  - **Deep:** An open file is a `struct file` pointing at an inode and a table of
    functions, `struct file_operations`; `vfs_read()` calls the file's
    `read_iter` (or `read`). Each filesystem or driver supplies its own table. —
    `fs/read_write.c` (`vfs_read()`), `include/linux/fs.h`
    (`struct file_operations`), `Documentation/filesystems/vfs.rst`.
  - **Read:** https://docs.kernel.org/filesystems/vfs.html. Deepened by 1.6 (file
    descriptors) and 2.5 (the Lantern's `file_operations`).
- **Filesystems and mounts** (`filesystems`, deepens: `files`)
  - **Simple:** Different filesystems (ext4 on a disk, procfs, sysfs, devtmpfs) are
    attached into one tree; `/proc/mounts` lists them.
  - **Deep:** Each filesystem registers a `struct file_system_type`; mounting
    attaches its root at a directory. ext4 stores files on a block device; procfs,
    sysfs (built on kernfs) and devtmpfs make their contents in the kernel. —
    `fs/namespace.c`, `fs/ext4/`, `fs/proc/`, `fs/sysfs/`, `fs/kernfs/`,
    `drivers/base/devtmpfs.c`.
  - **Read:** man 5 `proc_mounts`, man 8 `mount`. Deepened by S.1 (procfs) and 2.7
    (procfs and sysfs files of your own).
- **Device files** (`device-files`, deepens: `drivers`)
  - **Simple:** Files in `/dev` are doors into drivers: `c` for character devices,
    `b` for block devices, with major and minor numbers.
  - **Deep:** A device node holds a `dev_t` (major, minor). Opening it finds the
    driver registered for that number (`cdev` for character devices), whose
    `file_operations` then serve every call. devtmpfs creates nodes as drivers
    register devices; udev sets owners and names. — `fs/char_dev.c`,
    `drivers/char/mem.c` (`/dev/null`), `block/`.
  - **Read:** man 4 `null`, man 7 `udev`. Deepened by 2.4 (`/dev/lantern`).
- **The network stack** (`network-stack`)
  - **Simple:** Programs talk through sockets; the kernel turns data into TCP or UDP
    segments, IP packets and frames for the network card.
  - **Deep:** A socket is a file descriptor; under it, `net/ipv4/tcp*.c` and
    `net/ipv4/ip_output.c` build packets as `struct sk_buff`, netfilter hooks
    inspect them, and the driver's `ndo_start_xmit()` sends them. Interfaces show
    in `/sys/class/net`, counters in `/proc/net/dev`. — `net/socket.c`,
    `net/ipv4/`, `net/netfilter/`, `drivers/net/ethernet/intel/e1000/`.
  - **Read:** man 7 `socket`, man 7 `tcp`. Deepened by 1.9 (sockets) and 2.11
    (netfilter).
- **printk and dmesg** (`printk-dmesg`)
  - **Simple:** The kernel's own log: messages from boot and from drivers, read with
    `dmesg`.
  - **Deep:** `printk()` (and `pr_info()`, `dev_info()`…) writes into a ring buffer
    with a log level; `dmesg` reads it from `/dev/kmsg`. Some distributions set
    `kernel.dmesg_restrict` so only root may read it. — `kernel/printk/printk.c`,
    `include/linux/printk.h`.
  - **Read:** man 1 `dmesg`. Deepened by 2.2 (your own `pr_info()`).
- **The kernel source tree** (`kernel-source-tree`)
  - **Simple:** Each part of the kernel has its folder: `kernel/`, `mm/`, `fs/`,
    `net/`, `drivers/`, `arch/`, `include/`, `init/`, `ipc/`, `security/`.
  - **Deep:** `arch/<cpu>/` holds what differs per CPU type (entry code, page
    tables, boot); `kernel/` the core (processes, scheduler, signals, modules,
    printk, locking); `mm/` memory; `fs/` the VFS and filesystems; `net/`
    networking; `drivers/` most of the code; `include/linux` internal headers and
    `include/uapi` the user-space interface; `init/` start-up; `ipc/` System V and
    POSIX IPC; `security/` LSMs and capabilities; `Documentation/` the docs.
  - **Read:** https://docs.kernel.org/, https://elixir.bootlin.com/linux/v6.18/source.
    Deepened by 2.1 (finding things in the source).

### Real-world card

```sh
cat /proc/mounts                          # every filesystem in your tree
ls -l /dev/null /dev/tty                  # two character devices
ls /sys/class/net; cat /proc/net/dev      # interfaces and their counters
sudo dmesg | tail -n 20                   # the newest kernel messages
strace -e trace=openat,read cat /proc/uptime
```

Browse the source tree at https://elixir.bootlin.com/linux/v6.18/source and open
`mm/`, `fs/` and `net/`.

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** `/proc/mounts` format; filesystem names; the VFS function names for
  ext4, procfs and sysfs reads; `/dev` modes, `c`/`b`, major 1 minor 3 for
  `/dev/null` and 5,0 for `/dev/tty`; `/sys/class/net` and `/sys/class/net/lo/mtu`
  (65536); the `printk` → `/dev/kmsg` → `dmesg` path; the source tree layout.
- **Simplified:** the lab stores ext4's files in memory (no on-disk format, no block
  I/O); the X-ray names the ext4 functions a real read would run. The virtio disk's
  major number is the lab's (it is assigned dynamically on real Linux). The network
  trip is a drawing; packets are built in 1.9. `dmesg` is readable by uid 1000 in
  the lab.

### Lab needs

`/proc/mounts`; ext4, procfs, sysfs and devtmpfs labels on reads (route
annotations in X-ray: which filesystem or driver served each call);
`/sys/class/net/{lo,eth0}/{mtu,address,operstate}`; `/proc/net/dev`; `/dev/null`,
`/dev/tty`, `/dev/vda` with real modes and numbers; `dmesg` reading a `/dev/kmsg`
ring with the boot and driver lines; the Section drawing's completed table with
drag-to-match; `look.c` starter.

---

## P.10 — Bring the Machine Up (capstone)

- **Id:** `prologue-machine-in-section-10-bring-it-up` · **Region / NPC:** the whole Machine / the Watchdog, init, udev (on the drawing) · **Tracks:** `kernel`, `userland` · **Time:** ~30 min · **Prerequisites:** `sys-kernel-subsystems`, `sys-boot-chain` · **Skills unlocked:** `sys-command-lifecycle`

The Prologue's closing mission. It teaches nothing new: the player uses the boot
path, the hardware, memory, processes and files together to bring a stalled Machine
fully up. Each step is checked by what the Machine does, and the closing Predict
costs nothing when wrong.

### Scene

> **The Watchdog:** Restarting. Not my fault. ...It's stuck. I'm counting, and nobody's resetting me.
>
> **init:** Someone changed the boot entry. Maybe the Dangling, maybe a tired admin. Either way, the Machine can't find its feet.
>
> **init:** You know every floor now. Bring it up. All the way up: disk, network, memory. Then show me one command going all the way down and back.

### See it (X-ray)

The Machine restarts and stops partway. The boot view shows how far it got:

```
[    1.204551] Run /init as init process
Gave up waiting for root file system device.
ALERT!  /dev/vda3 does not exist.  Dropping to a shell!

(initramfs)
```

The kernel, its initcalls and the initramfs all worked. The initramfs's `/init`
couldn't find the partition named by `root=`, so it stopped and opened a tiny
emergency shell, `(initramfs)`, before init could start. X-ray points at the boot
view's lane: stage 5, root.

### Build it

Four steps, in order. Command chips offer only the commands' names and one-line
explanations (no arguments): the player chooses what to look at and types it.

1. **Find the root.** In the `(initramfs)` shell: `ls /dev` shows `vda`, `vda1`,
   `vda2`, no `vda3`; `cat /proc/cmdline` shows `root=/dev/vda3`. Restart
   (`reboot`), press `e` on the entry, fix `root=`, boot with Ctrl-X. (GRUB's own
   command line, `c` then `ls`, lists the same partitions: `(hd0) (hd0,gpt1)
   (hd0,gpt2)`.)
2. **Light the harbor.** The Machine boots, but the network is dark:
   `ls /sys/class/net` shows only `lo`. The player finds out why, from the hardware
   up: the network card is there (`lspci -k`: no `Kernel driver in use`), its
   `driver` link in `/sys/bus/pci/devices/0000:00:02.0` is missing, and `dmesg` says:

   ```
   [    0.611204] Module e1000 is blacklisted
   ```

   `/proc/cmdline` shows `module_blacklist=e1000`: the boot entry told the kernel
   not to load that driver.
3. **Check the memory.** `free` shows a total of about 40 MiB, but the Machine has
   512 MiB (P.6's hardware floor). `dmesg` shows the kernel was told to use less:

   ```
   [    0.000000] Command line: ... module_blacklist=e1000 mem=64M
   [    0.031020] Memory: 41204K/65024K available (...)
   ```

   kswapd's figure on the drawing is running back and forth. The player restarts,
   removes both `module_blacklist=e1000` and `mem=64M`, and boots again. Then they
   check: `free` shows about 490 MiB, `ls /sys/class/net` shows `eth0`, the
   `driver` link points at `e1000`, and `ps -e` shows init as PID 1, the shell under
   it and the kernel threads.
4. **One command, end to end.** First a Predict (see Watch it), then the player
   runs `cat /sys/class/net/eth0/operstate` with X-ray's full route on. It prints
   `up`.

- **Checker verifies (behavior):**
  - The Machine booted with `root=/dev/vda2` and reached PID 1.
  - On a later boot, `e1000` bound to `0000:00:02.0` and `eth0` exists.
  - On that boot, `MemTotal` is above 480 MiB (no `mem=` limit).
  - After that boot, `/proc/meminfo` (or `free`), `ps -e` and the `driver` link
    were read, and `cat /sys/class/net/eth0/operstate` printed `up`.

### Watch it

**Predict: order the path.** Before the last run, the player drags nine cards into
order: the shell reads your line; `clone` makes a new process; `execve` turns it
into `cat`; the scheduler runs it; `openat` walks the path in the VFS; `read` goes to
sysfs, which asks the network driver for the card's state; the bytes are copied to
`cat`'s memory; `write(1)` hands them to the terminal's driver, which shows them;
`cat` exits and the shell's `wait4` returns. Then the run replays in that order,
each step lighting its floor of the Section drawing:

```
read(0, "cat /sys/class/net/eth0/operstate\n", ...)   rescue       tty
clone(...)                                  = 340      rescue       kernel/fork.c
execve("/bin/cat", ["cat", "/sys/..."], ...) = 0       cat          fs/exec.c
openat(AT_FDCWD, "/sys/class/net/eth0/operstate", O_RDONLY) = 3     fs/namei.c, sysfs
read(3, "up\n", 262144)                     = 3        cat          kernfs → net-sysfs → e1000
write(1, "up\n", 3)                         = 3        cat          tty
exit_group(0)                               = ?        cat          kernel/exit.c
wait4(340, [{WIFEXITED(s) && WEXITSTATUS(s) == 0}], 0, NULL) = 340  rescue
```

A wrong order costs nothing: the replay shows the right one and highlights the
moved card.

In the world: the Watchdog's meter fills and stays full. "Reset. Properly. First
time since the Kernelfall." The Kernel Map's Prologue regions are fully drawn, the
network card glows at the bottom of the Section, and a wire runs from it to the dark
harbor: "The wire's live. Nobody's talking on it yet."

### Debrief

> **init:** You brought the Machine up from a dead stop: the root, the driver, the memory. And you followed one command all the way down to a driver and back.
>
> **init:** You know what the Machine is made of now, top to bottom. But you've only seen the city from my doorstep. Time you walked the streets you're rebuilding.

The Surface Survey begins with S.1.

### Hints

1. Nudge: "The Machine stopped at a different stage each time. Which stage, and what
   did the last message name?"
2. Concept: "`/proc/cmdline` and `dmesg` show what the kernel was told and what it
   did. `root=` picks the root partition, `module_blacklist=` stops a module from
   loading, `mem=` limits how much RAM the kernel uses."
3. Point at the spot: "In GRUB, press `e`. On the `linux` line, set
   `root=/dev/vda2` and delete `module_blacklist=e1000` and `mem=64M`."

### Codex (chapter: The Machine in Section)

- **The life of a command** (`command-lifecycle`)
  - **Simple:** A command travels from the shell through the kernel's parts to a
    driver and back: new process, program loaded, path walked, data read, text
    written, exit, prompt.
  - **Deep:** `clone()` → `kernel_clone()`; `execve()` → `do_execveat_common()`;
    the scheduler runs the new task; `openat()` → `path_openat()`; `read()` →
    `vfs_read()` → the filesystem (for a disk file on ext4, the page cache, and on a
    miss the block layer and the disk driver; for sysfs, `kernfs_fop_read_iter()`
    and a driver's attribute); `write()` → `tty_write()`; `exit_group()` →
    `do_exit()`, `SIGCHLD` to the parent; `wait4()` → `do_wait()`. —
    `kernel/fork.c`, `fs/exec.c`, `fs/namei.c`, `fs/read_write.c`,
    `fs/kernfs/file.c`, `net/core/net-sysfs.c`, `drivers/tty/tty_io.c`,
    `kernel/exit.c`.
  - **Read:** man 2 `execve`, man 2 `wait4`. Deepened by 1.B (the syscall path)
    and 2.5 (a `read()` into your own driver).

### Real-world card

```sh
cat /proc/cmdline                          # what your kernel was told
sudo dmesg | grep -i -E 'blacklist|memory:'
lspci -k | grep -A2 -i ethernet            # is your network card's driver in use?
strace -f -e trace=clone,execve,openat,read,write,wait4 sh -c 'cat /sys/class/net/lo/operstate'
```

On a test virtual machine: at GRUB, press `e`, add `mem=512M` for one boot, and
compare `free` before and after.

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** the initramfs-tools messages and `(initramfs)` prompt for a missing
  root device; `module_blacklist=` and the "Module … is blacklisted" message
  (verify the exact prefix in `kernel/module/main.c`); `mem=` limiting usable RAM;
  the `Memory:` line's shape; `operstate` values; GRUB's `ls` naming; the order of
  syscalls in the route.
- **Simplified:** in the lab, `init` loads modules for devices at boot (on real
  systems udev and `modprobe` do it from each device's `modalias`). The
  `(initramfs)` shell offers only `ls`, `cat` and `reboot`. Numbers in `Memory:` and
  `free` are the lab's. The route's lower layers for sysfs and the tty are named, not
  simulated function by function.

### Lab needs

Boot faults driven by the command line: a missing `root=` device stopping in an
`(initramfs)` shell (with `ls`, `cat`, `reboot`); `module_blacklist=` refusing a
module with its message and leaving the PCI device unbound; `mem=` limiting
`MemTotal`; GRUB's `c` command line with `ls`; `/sys/class/net/eth0/operstate`;
X-ray's full route view (each syscall labeled with the process and the kernel part
that served it); the order-the-path Predict.
