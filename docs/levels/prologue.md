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
  2. **P.6:** read the disk controller's `driver` link in `/sys`, then fix the
     lighthouse board's `.dts` so its lamp binds when `board` boots it.
  3. **P.7:** complete `mypid.c` so it prints its own PID and its parent's, and run
     it twice.
  4. **P.8:** complete `where.c` so it prints a local variable's address, and point
     at the `[stack]` line of its maps that holds it.
  5. **P.9:** with `look.c`, read one file each from the 9p root, procfs and sysfs.
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
  `6.18.63-0-virt`, `#1-Alpine SMP PREEMPT_DYNAMIC`, hostname `kernelfall`. `/boot`
  holds `vmlinuz-virt`, `config-6.18.63-0-virt` and `System.map-6.18.63-0-virt`.
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
| register (of a device) | a small slot in a device that a driver reads or writes to control it                                       | "start sending"; "how many bytes arrived"; "lamp on"                       | P.6 Codex |
| interrupt              | a device's signal to the CPU: stop and deal with me now                                                    | a key pressed; a packet arrived; a timer went off                          | P.6 Codex |
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
| Interrupts, timers, softirqs     | `kernel/irq/`, `kernel/time/`, `kernel/softirq.c`               | `/proc/interrupts` (P.6 Codex)                | Interrupt Spire (2.10a–c)                                                                            | ksoftirqd                        |
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

- **Id:** `prologue-boot-path-01-power-on` · **Region / NPC:** the Machine, from the outside, then init's house / the Watchdog, init · **Tracks:** `userland` · **Time:** ~15 min · **Prerequisites:** none · **Skills unlocked:** `sys-computer-basics`

**Question:** Who is in charge of the Machine? The Machine answers in `/proc/version`.

No code and no syscalls yet. The player asks the kernel its name, meets the Section
drawing (Userland, the Gate, the kernel's parts, the hardware) and walks the file
tree from `/` to init's note. **Teaches:** `kernel`, `process`, `file-tree`.
**Tools:** `cat`, `ls`, `/`, `/etc/motd`, `/proc/version`. The drawing's other labels
(the hardware's four parts, the terminal and shell, the operating system) are Codex
cards, not lessons; `/proc` as a whole is P.7's. The story text is the level's
`story.md`; this section lists its beats.

### Scene

A power button on a black screen. Pressed, the Machine draws itself in section as
boot text scrolls past; one burnt line flashes `Kernel panic - not syncing`.

> **The Watchdog:** The Machine's core crashed tonight: the Kernelfall. I restarted everything. I can't promise it holds.
>
> **init:** Easy, old dog. Hello. I'm init: I start the Machine's programs and look after them. Before we bring its core back, let's ask who is in charge.

### See it

1. **Do** (within the first 30 words): `cat /proc/version`. **See:** the Machine's
   real line, `Linux version 6.18.63-0-virt … #1-Alpine SMP PREEMPT_DYNAMIC
   2026-11-11 03:02:54`. **Name:** _kernel_. **Why:** the one program with full
   control of the hardware; every other program asks it, and `cat` just did. No disk
   holds that line: the kernel wrote it as `cat` read it.
2. The narrator reads the **Section drawing**'s labels, top to bottom: Userland, the
   Gate (the red line every request crosses), the kernel's floor (dark, lit part by
   part as the game goes on), the hardware (CPU, memory, storage, devices).
3. **Name:** _process_: while `cat` ran, it was a program running, with memory of
   its own. **Why:** the kernel tracks every process, so it knows who is asking.
   init is one too.

### Build it

- **Starter provides:** bash in `/home/you`, and a chip for each command, with a
  one-line explanation.
- **Player does:** `ls /` (**name:** _file tree_, its top the root `/`; `etc` holds
  settings as plain text), then `cat /etc/motd` (a path names the way down). init's
  note is the Machine's real `/etc/motd`. Contrast: someone saved `/etc/motd`;
  nobody saved `/proc/version`.
- **Checker verifies (behavior, all declared `read-to-end` checks):** `cat` read
  `/proc/version` and `/etc/motd` to the end; `ls` listed `/`.
- **Golden runs:** `solution` (`cat /proc/version`, `ls /`, `cat /etc/motd`);
  `other-paths` (`cat /proc/cmdline`, `ls /home`, `cat /etc/hostname`: meets none).

### Watch it

**Predict:** "When `cat` showed my note, who read the file: `cat` itself, or the
kernel?" On the drawing, two lines run from `cat` down through the Gate into the
kernel. The answer: the kernel. BusyBox `cat` asks it to open the file, then to copy
it to the terminal (`open`, `sendfile64` in the recorded run); First Words shows a
program's requests one by one. Only the kernel reaches the hardware.

### Debrief

> **init:** So the kernel is in charge. You can find any file by its path, and ask the kernel its name. Every command you ran crossed the Gate to ask it for something. How does a program ask? In First Words, you watch one do it, request by request.

P.2 begins.

### Hints

1. Nudge: "Each chip is a command: a program's name, then what it should work on.
   Click it, or type it and press Enter."
2. Concept: "A path names the way down from `/`, one folder at a time: `/etc/motd`
   is the file `motd` inside the folder `etc`."
3. Point at the spot: "Three commands, in this order: `cat /proc/version`, `ls /`,
   `cat /etc/motd`."

### Codex (chapter: First Boot)

Each card has a **Simple** line, a **Deep** text and an optional **Read** line; a
card marked `deepens: <id>` adds to an earlier card's chain instead of starting a
new one. Card ids are unique across the game.

Three cards for the core concepts (`kernel`, `program-process`, `files`), and four
for the drawing's labels, which the story names but does not teach.

- **The kernel** (`kernel`)
  - **Simple:** The one program with full control of the hardware; every other
    program asks it. `cat /proc/version` names the Machine's: Linux 6.18.
  - **Deep:** The kernel runs only when something enters it: a program's request, a
    device that needs attention, a timer, a fault. Otherwise the CPU runs programs,
    the kernel's own threads, in brackets in `ps`, or waits in the kernel's idle loop.
    Linux is one kernel; Windows runs NT and macOS runs XNU. Android, Ubuntu and the
    Machine's Alpine all run Linux. — `arch/x86/entry/`, `init/main.c`.
  - **Read:** man 2 `intro`. Deepened by P.5 (the kernel up close).
- **Program and process** (`program-process`)
  - **Simple:** A program is instructions in a file, like `/bin/cat`; a process is a
    program running, with its own memory and a PID.
  - **Deep:** The kernel starts a program in a process with `execve()` and keeps one
    `struct task_struct` for each. One program can run as many processes at once.
    init is PID 1, and `ls /proc` shows a numbered folder for every process. Most
    names in the Machine's `/bin` are links to one program, BusyBox, which does the
    job its name asks for. — `fs/exec.c`, `include/linux/sched.h`.
  - **Read:** man 2 `execve`, man 1 `ps`. Deepened by P.7 (who runs) and 1.4
    (`fork`, `exec`, `wait`).
- **The file tree** (`files`)
  - **Simple:** One tree of folders from the root, `/`. A path names the way down:
    `/etc/motd` is the file `motd` in the folder `etc`.
  - **Deep:** Each top folder has one job: `/bin` and `/usr/bin` hold programs,
    `/etc` settings as plain text, `/home` people's folders, `/proc` and `/sys` the
    kernel's own views, `/dev` devices as files: `null` swallows what is written to
    it, `zero` gives zeros, `random` gives random bytes. A file's details, and where
    its data is, live in an inode; folders map names to inodes. Other filesystems join the tree where
    they are mounted: `/proc` and `/dev` are filled by the kernel itself. —
    `fs/namei.c`, `include/linux/fs.h`.
  - **Read:** man 7 `hier`. Deepened by P.9 (everything is a file) and S.1.
- **`/proc`, the kernel's window** (`proc`)
  - **Simple:** Files no disk holds: the kernel writes each one when a program reads
    it. `cat /proc/version` prints the kernel's version.
  - **Deep:** procfs is a filesystem the kernel generates on each read, mounted at
    `/proc` at boot. `/proc/version` comes from `fs/proc/version.c`. Each running
    program gets a folder, `/proc/<pid>`, with its memory map, open files and state.
  - **Read:** man 5 `proc`. Deepened by P.7 (who runs).
- **The parts of a computer** (`computer-parts`)
  - **Simple:** The hardware floor: a CPU runs instructions, memory holds what is
    running, storage keeps files, devices do the rest. The Machine: one CPU, 256 MiB.
  - **Deep:** The CPU reads instructions and data from memory; with one CPU it runs
    one program at a time and switches between them many times a second. Memory
    forgets everything at power off; storage keeps it. Memory is counted in bytes,
    each a number from 0 to 255: 1 MiB is 1,048,576 bytes, so 256 MiB is
    268,435,456. Text is stored as numbers too: in UTF-8, `h` is 104 and `é` takes
    two bytes.
  - **Read:** https://docs.kernel.org/admin-guide/mm/concepts.html.
- **Operating system** (`operating-system`)
  - **Simple:** The kernel plus the programs around it that run a computer for
    everyone: Windows, macOS, Android and the Machine's Alpine Linux.
  - **Deep:** An operating system starts and stops programs, shares the CPU and
    memory between them, keeps files in folders and talks to the devices, so no
    program has to know every disk ever made. Around the kernel sit an init system, a
    shell, a C library and tools; on Linux these come together as a distribution.
  - **Read:** man 7 `intro`. Deepened by P.5 (Linux and distributions).
- **Terminal, shell and command** (`terminal`)
  - **Simple:** The terminal is the window; the shell, bash here, reads each line you
    type; a command is that line, like `ls /`.
  - **Deep:** The terminal is a device, a tty; the Machine's is the serial line
    `ttyS0`. The shell reads your line from it, starts the program you named and
    waits for it to finish. A few commands, like `echo` and `pwd`, the shell runs
    itself: builtins. — `drivers/tty/tty_io.c`.
  - **Read:** man 4 `tty`. Deepened by P.3 (the shell).

### Moved out of the story

| Fact (old story)                                                     | Now                                                      |
| -------------------------------------------------------------------- | -------------------------------------------------------- |
| the four parts: CPU, memory, storage, devices                        | the drawing's labels (story) and `computer-parts` Simple |
| one CPU switches between programs fast                               | `computer-parts` Deep; taught in P.7                     |
| bytes, 256 MiB = 268,435,456 bytes, UTF-8 (`h` = 104, `é` two bytes) | `computer-parts` Deep                                    |
| what an operating system does; Windows, macOS, Android, Ubuntu       | `operating-system` Simple and Deep                       |
| Linux runs in Android and Ubuntu                                     | `kernel` Deep                                            |
| the kernel runs only when called on (the city-works limits line)     | `kernel` Deep; the analogy is gone                       |
| program as a recipe, two cooks, PID, init is PID 1                   | `program-process` Simple and Deep; the analogy is gone   |
| each top folder's job: `/bin`, `/home`, `/dev`                       | `files` Deep (`/etc` stays in the story)                 |
| `/proc` in general: files written when read                          | `proc` Simple; taught in P.7                             |
| the Machine's files come over a virtio share, not a disk             | `fidelity`                                               |
| terminal, shell, `bash`, command                                     | `terminal` Simple and Deep; P.3 is the shell's level     |
| `echo` and `pwd` are builtins                                        | `terminal` Deep; taught in P.3                           |
| `/dev`: `ttyS0`, `null`, `zero`, `random`; `sda`, `nvme0n1`          | `files` Deep, `terminal` Deep, the real-world card; P.9  |
| most of `/bin` is links to BusyBox                                   | `program-process` Deep                                   |
| `/etc/hostname`, the Machine's name                                  | the real-world card                                      |

### Real-world card

On a Linux machine:

```sh
cat /proc/version                            # the kernel's own words
ls /                                         # the top of the file tree
cat /etc/hostname 2>/dev/null || hostname    # your computer's name
lsblk                                        # your disks: sda, nvme0n1 or similar
```

A Mac's Terminal lists `/` too, but has no `/proc`: macOS runs a different kernel,
XNU. On Windows, the Windows Subsystem for Linux gives you a real Linux terminal.

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** a real Linux 6.18 kernel writing `/proc/version` as it is read;
  bash and BusyBox, so every command prints as on Linux.
- **Simplified:** the power-on animation is a drawing (P.4 has the real boot); the
  Machine's root filesystem is not on a disk: the browser serves it to Linux over a
  virtio 9p share.

### Lab needs

The power-on animation with the burnt pstore frame; the Section drawing's outside
view with its four labels; the real VM's bash and `/etc/motd` with init's message.

---

## P.2 — First Words

- **Id:** `prologue-boot-path-02-first-words` · **Region / NPC:** init's house in Userland / init, the Watchdog · **Tracks:** `userland`, `kernel` · **Time:** ~20 min · **Prerequisites:** `sys-computer-basics` · **Skills unlocked:** `sys-user-kernel-mode`

**Question:** How does a program ask the kernel for something? `/bin/echo hello`
answers in X-ray, and then the player's own `hello.c` does.

**Teaches:** `syscall`, `fd`, `user-kernel-mode`. **Names** (met here, taught
later): `exec`, `compiler` and `c-basics` (Act I). **Tools:** `/bin/echo`,
`write`, `execve`, `exit_group`, gcc. The story text is the level's `story.md`; this
section lists its beats.

### Scene

> **init:** In Power On, `cat` could not read my note on its own. It asked the kernel, and the request crossed the Gate. Tonight you watch a program ask, one request at a time.
>
> **The Watchdog:** Make it quick. I'm counting.
>
> **init:** Then you ask the kernel yourself, with your first program: a few lines of C, the language Linux itself is written in.

### See it (X-ray)

1. **Do** (the first line): `/bin/echo hello`. **See:** X-ray's syscalls view, as
   traced on the Machine, with the program's start-up calls folded:

   ```
   execve("/bin/echo", ["/bin/echo", "hello"], ...) = 0
     … 17 more requests: the program getting ready
   write(1, "hello\n", 6)                           = 6
   exit_group(0)                                    = ?
   ```

   **Name:** _syscall_: a request from a program to the kernel; its name, what was
   asked, then the kernel's answer after the `=`.
2. init reads three lines: `execve` started the program; `write(1, "hello\n", 6)`
   asked for six bytes to be shown, one for each character, and the kernel took all
   six; `exit_group(0)` said the program was finished, its `0` meaning all went
   well, and gets no answer, because the process is gone.
3. **Name:** _file descriptor_: a small number for something a process has open; 0
   is what you type, 1 its output, 2 its error messages. Here 1 leads to the
   terminal.
4. **Why ask at all:** the CPU runs programs in _user mode_, where it won't let them
   touch a device or the kernel's memory; a syscall switches it to _kernel mode_ at
   the Gate, and back with the answer.

### Build it

The player writes `hello.c`, their first program, in the editor. init gives C in one
sentence: `main` is where a program begins, each step in it ends with `;`, and
text goes between double quotes. The compiler, gcc 15, turns the file into one the
CPU can run.

- **Starter provides:** an empty `main()` (the function a C program starts in) that
  returns 0, `#include <unistd.h>` (which brings in `write()`), and a comment block
  (in init's voice) explaining `write(fd, buf, count)` and that fd 1 is standard
  output (here, the terminal). Run types `gcc -Wall -Wextra hello.c -o hello &&
  ./hello` into bash.
- **First, a broken build, on purpose (guided).** init: "Before you write anything,
  break it. Delete the `;` after `return 0` and press Run." gcc answers, on the
  Machine:

  ```
  hello.c: In function 'main':
  hello.c:19:17: error: expected ';' before '}' token
     19 |         return 0
        |                 ^
        |                 ;
     20 | }
        | ~
  ```

  init reads three parts, and the editor marks the line gcc named:
  - `hello.c:19:17` is where: the file, the line, the column.
  - `error:` means the build stopped, so there is no program to run.
  - The `^` points at the place, and under it is the fix gcc suggests.

  The player puts the `;` back and presses Run: a clean build, and nothing printed,
  because `main` says nothing yet.
- **Player writes:** above `return 0`, one line: a `write()` that sends a line of
  text, ending in `\n`, to file descriptor 1.
- **Checker verifies (behavior):**
  - A build failed with an error, and a later build of `hello.c` succeeded (the
    guided break counts; so does any error the player fixes on their own).
  - The program compiles.
  - Running `./hello` exits with status 0.
  - The kernel's events show at least one `write` (or `writev`) on fd 1 whose
    return value equals the count.
  - The bytes that reached the terminal end in `\n`.

`printf` also passes: X-ray then shows the `writev` that musl's stdio made. The story
no longer explains it; the `write-syscall` card does.

**Golden runs:** `solution`, `solution-printf`; rejected: `broken` (the starter
with the `;` deleted), `silent` (the starter: builds, exits 0, writes nothing),
`no-newline`.

A warning (for example `unused variable 'n'`) is marked in the editor in ink and
adds no Taint; warnings are taught in 1.3.

### Watch it

**Predict** (before running): "Where does the work for `./hello` get done?" In
Userland only, in the kernel only, or on both sides of the Gate. The run shows the
answer: the player's code runs in Userland, in user mode, and its `write` crosses the
Gate, runs in the kernel and comes back with the bytes taken, `15` for init's line. The player never wrote `exit_group`:
returning from `main` made that request. Seven requests got the program ready, where
`/bin/echo` needed seventeen.

```
$ ./hello
hello, Machine
```

```
execve("./hello", ["./hello"], ...) = 0
  … 7 more requests: the program getting ready
write(1, "hello, Machine\n", 15)    = 15
exit_group(0)                       = ?
```

> **The Watchdog:** A process that talks. Fine. I'll stop counting. For now.

### Debrief

> **init:** That is how a program asks: a syscall, through the Gate, and the kernel's answer back. So far I chose every command. In Speak to the Shell you choose the words yourself, and see how the shell finds the program you name.

P.3 begins.

### Hints

1. Nudge: "You want your line to reach the terminal. Every program starts with
   three file descriptors already open. Which one is the program's output?"
2. Concept: "`write(fd, buf, count)` hands `count` bytes from `buf` to the kernel.
   File descriptor 1 is the program's output; here, it leads to your terminal. The
   kernel answers with how many bytes it took."
3. Point at the spot: "Inside `main`, above `return 0`, add `write` with file
   descriptor 1, your text in double quotes, and the number of bytes in it. `\n` is
   one byte: count it too."

### Codex (chapter: First Boot)

The built level's card list must match this one.

- **Syscall** (`syscall`)
  - **Simple:** A request from a program to the kernel: show text, open a file,
    start a program. Programs have no other way to reach it.
  - **Deep:** Each syscall has a number and up to six arguments. The kernel answers
    with a value, or a negative error code that the C library turns into `-1` and
    `errno`. On this 32-bit Machine a program enters with `sysenter` or the older
    `int $0x80`, at `entry_SYSENTER_32` and `entry_INT80_32` in `entry_32.S`: the
    Gate. From there `ia32_sys_call()` in `syscall_32.c` runs the handler numbered
    in `eax`, a `switch` statement generated from `syscall_32.tbl`. —
    `arch/x86/entry/entry_32.S`, `arch/x86/entry/syscall_32.c`,
    `arch/x86/entry/syscalls/syscall_32.tbl`.
  - **Read:** man 2 `syscalls`, man 2 `intro`. Deepened by 1.B (the syscall
    path, step by step).
- **User mode and kernel mode** (`user-kernel-mode`)
  - **Simple:** The CPU runs programs with limits on (user mode) and the kernel
    without them (kernel mode), so programs must ask.
  - **Deep:** The CPU tracks its privilege level. On x86, programs run in ring 3
    and the kernel in ring 0; kernel memory is mapped supervisor-only, so a program
    that touches it faults. A syscall instruction is the sanctioned way up: on this
    32-bit Machine `sysenter` or `int $0x80`, with `sysexit` or `iret` the way
    back; on a 64-bit PC, `syscall` and `sysret`. man 2 `syscall` lists the
    instruction for each architecture. — `arch/x86/entry/entry_32.S`,
    `arch/x86/entry/entry_64.S`, https://man7.org/linux/man-pages/man2/syscall.2.html.
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
    write function; for a terminal, the tty layer's `tty_write()`. Its sibling
    `writev()` takes several buffers in one call; the Machine's C library, musl,
    prints `printf()`'s text that way. — `fs/read_write.c` (`ksys_write()`, `vfs_write()`), `drivers/tty/tty_io.c`.
  - **Read:** man 2 `write`. Deepened by P.9 (one interface for every file), 1.6
    (the read/write contract) and 2.5 (the driver's side).
- **Compiler diagnostics** (`compiler-diagnostics`)
  - **Simple:** The compiler says where it stopped and why: `file:line:column`,
    how bad (`error` or `warning`), then the message.
  - **Deep:** An error stops the build; a warning doesn't. Under the message,
    gcc shows the source line with a `^` at the spot, sometimes a suggested fix
    under it, and `~` under the code it was reading when it noticed. clang uses the
    same `file:line:column: error:` shape with its own wording. Fix the first error
    first: later ones are often caused by it. The kernel is built by the same
    compilers, and `CONFIG_WERROR` makes its build treat warnings as errors. —
    `Documentation/kbuild/llvm.rst`, `init/Kconfig` (`WERROR`).
  - **Read:** https://gcc.gnu.org/onlinedocs/gcc/Diagnostic-Message-Formatting-Options.html.
    Deepened by 1.3 (warnings and a clean build).

### Moved out of the story

| Fact (old story)                                                      | Now                                                  |
| --------------------------------------------------------------------- | ---------------------------------------------------- |
| `/bin/echo` is the program file, `echo` the shell's builtin           | P.3, where builtins are taught                       |
| the 17 start-up calls by name: `brk`, `mprotect`, `getuid`, `setuid`… | X-ray shows them; the story only counts them         |
| `ls /bin` and `cat /etc/motd` under X-ray: `open`, `getdents64`…      | the chips stay; the calls are P.9's and the Survey's |
| standard output "doesn't have to" lead to the terminal                | S.4 (redirection) and 1.6                            |
| the Gate's two doors, `sysenter` and `int $0x80`; `syscall` on 64-bit | `syscall` Deep and `user-kernel-mode` Deep           |
| "the program doesn't wait in line": the CPU runs kernel code at once  | `user-kernel-mode` Deep; 1.B walks the path          |
| source code; `./` means "in this folder"                              | P.3 (`./` and `PATH`)                                |
| gcc counts the leading tab as eight columns                           | gone; the editor marks the place                     |
| a `warning:` lets the build finish; "the Smith will teach you those"  | `compiler-diagnostics` Deep; 1.3                     |
| the `~` under the `}` where gcc noticed; "fix the first error first"  | `compiler-diagnostics` Deep                          |
| `printf` is a library function; `writev`                              | `write-syscall` Deep; library functions are Act I's  |
| the Userland lamp, the "console" dot on the Kernel Map                | gone: the Section drawing shows the crossing         |
| the Taint meter's card (`taint-meter`)                                | 1.3, where Taint first counts                        |

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

Build and trace it: `gcc -Wall -Wextra -o hello hello.c && strace ./hello`. On a
glibc system you'll see more syscalls before your `write` than on the Machine: its
separate loader opens and maps `libc.so.6` (`openat`, `mmap`, `mprotect` and
friends), while the Machine's musl is its own loader and opens nothing. Build with
`-static` and trace again to see a shorter list.

### Taint

No Taint rule is live in the Prologue. Compiler warnings and an ignored `write()`
return value count from Act I, where they are taught.

### Fidelity

- **Faithful:** programs in user mode, the kernel in kernel mode, and `sysenter`
  or `int $0x80` as the way in on this 32-bit Machine; every syscall in X-ray is
  one the real kernel ran; `write()`'s signature and return value, and `writev()`
  behind musl's `printf()`; `exit_group` as the syscall behind returning from
  `main`; fds 0, 1, 2; gcc 15's real diagnostics (`file:line:column: error:`, the
  caret line, the fix-it); programs linked dynamically against musl.
- **Simplified:** the traces in the story fold away the start-up calls musl and
  BusyBox make (`set_thread_area`, `brk`, `mprotect`…); X-ray shows them.

### Lab needs

Done: X-ray's syscalls view; gcc's real output in the terminal; the Run button's
build command; gcc's diagnostics as marks in the editor.

---

## P.3 — Speak to the Shell

- **Id:** `prologue-boot-path-03-speak-to-shell` · **Region / NPC:** init's doorstep in Userland / init, the Watchdog · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `sys-user-kernel-mode` · **Skills unlocked:** `sys-shell-basics`

**Question:** How does the shell turn the line you type into a running program? X-ray
answers with bash's own requests: the words it hands `execve`, and its search
through `PATH`.

**Teaches:** `argv`, `path-search`, `env`. **Names** (met here, not taught):
`builtin` (S.1 teaches it); `fork`, `pid`, `exit-status` and `errno` (Act I's: 1.4
uses them, and no built level teaches them yet); `man-page` (a tool, not a lesson).
**Tools:** `/bin/echo`, `ls`, `wc`, `man`, `printenv`, `env`, Tab. From this level on
the player types every command. The Field Guide (a Codex page of commands and
folders, specified in [surface-survey.md](surface-survey.md#the-field-guide-codex-page))
opens here. The story text is the level's `story.md`; this section lists its beats.

### Scene

> **init:** In First Words, `execve` started `/bin/echo` with a list of words. Who made that list, and who found the file? The shell: bash, the program that reads each line you type. One day you'll build one.
>
> **The Watchdog:** And whatever it starts asks the kernel for everything. You've seen it.
>
> **init:** I've left my own `hello.c` in the editor, the same lines as yours. Press Run once to build it: you'll need `hello` at the end.

### See it (X-ray)

1. **Do** (the first line): `/bin/echo one two three`, then `ls -l /etc`. **See:**
   the words the shell handed each program, in `execve`:

   ```
   execve("/bin/echo", ["/bin/echo", "one", "two", "three"], ...) = 0
   execve("/bin/ls", ["ls", "-l", "/etc"], ...)                   = 0
   ```

   **Name:** _command_, _arguments_, _option_, and the list of all the words, the
   program's name first: `argv`.
2. init wrote `/bin/echo`, a path, because plain `echo` is a _builtin_: the shell
   does it itself and starts no program. For `ls` the shell had to find the file.
3. **Do:** `man ls`, then `q`. **See:** bash looking before it starts anything
   (recorded on the Machine, trimmed; the PID changes from run to run):

```
statx("/usr/local/sbin/man", ...) = -1 ENOENT (No such file or directory)
statx("/usr/local/bin/man", ...)  = -1 ENOENT (No such file or directory)
statx("/usr/sbin/man", ...)       = -1 ENOENT (No such file or directory)
statx("/usr/bin/man", ...)        = 0
faccessat2(..., "/usr/bin/man", X_OK, ...) = 0
fork()                            = 491
[491] execve("/usr/bin/man", ["man", "ls"], ...) = 0
```

**Name:** `statx` asks the kernel about a file; three folders answered `ENOENT`,
no such file, and the fourth had `man`. The shell copied itself with `fork`, and
the copy, its child, became `man` with `execve`; the number `fork` answered is the copy's
_PID_.
4. **Do:** `printenv PATH`, which prints
`/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`. **Name:**
_environment variable_: one of the `NAME=value` settings every process gets from
its parent. `PATH` lists the folders the shell searches, in order.

### Build it

No new C. The player runs init's errands in bash, typing every command themselves
(chips show only the command's name and its one-line explanation). Each errand
fills a Field Guide entry. Outputs below are the Machine's.

- **Starter provides:** init's `hello.c` (P.2's reference) in the editor (Run builds
  `hello` in `/home/you`), and the Field Guide page.
- **Player does:**
  - **Arguments.** `/bin/echo` with four words of their own.
  - **Options.** `ls -l`, `ls -a`, then both joined in one word, `ls -la`.
  - **An option and an argument together.** `wc -l /etc/motd` (`3 /etc/motd`).
  - **The manual.** `man wc`: arrows scroll, `q` quits (the pager is BusyBox
    `less`). `man 2 write`: section 2 is the syscalls; there is P.2's `write()`.
  - **Tab.** `cat /etc/mot`, Tab (finishes `/etc/motd`), then Enter; the same with
    `printen` (finishes `printenv`).
  - **The environment.** `env GREETING=hi printenv GREETING`: `env` starts
    `printenv` with one extra setting, and it prints `hi`. `printenv GREETING`
    alone prints nothing: the setting lived only in that one child.
- **Checker verifies (behavior, from the kernel's events):**
  - `/bin/echo` ran with at least four arguments after its name.
  - `ls` ran with two options joined in one word (`-la` or similar), and `wc` with
    an option and a non-option argument (`wc -l /etc/motd`).
  - `man ls` or `man wc`, and `man` with a section number, ran, each exiting 0.
  - bash completed a file name in `/etc` and a command name in a `PATH` folder
    with Tab: its own `getdents64` read the folder to its end before Enter. A glob
    (`cat /etc/mo*`) reads the same folder after Enter and doesn't count; the
    kernel never sees Enter, so the checker tells them apart by the trace dropping
    the shell's housekeeping (its `close()` of the folder) before Enter and keeping
    it after.
  - `env` ran a program with an added `NAME=value`, and that program printed it.
  - Just `hello` got `command not found`: bash's forked copy ran no program and
    exited 127 with the message on fd 2.
  - `./hello` ran and exited with status 0 (re-tests P.2).
- **Golden runs:** `solution`; rejected: `near-misses` (builtin `echo`, `ls -l -a`,
  `wc` without an option, `man` never run, `GREETING=hi printenv` without `env`,
  no Tab but the globs `cat /etc/mo*` and `echo /usr/bin/printen*`, a missing path
  with a `/`), which meets no objective.

### Watch it

**Predict:** `hello` is in `/home/you`, the folder you're in. Type just `hello`:
where will the shell look for it? Here, in `/home/you`; in the six `PATH` folders;
or everywhere. Then the player runs it:

```
$ hello
-bash: hello: command not found
$ ./hello
hello, Machine
```

```
statx("/usr/local/sbin/hello", ...) = -1 ENOENT (No such file or directory)
statx("/usr/local/bin/hello", ...)  = -1 ENOENT (No such file or directory)
statx("/usr/sbin/hello", ...)       = -1 ENOENT (No such file or directory)
statx("/usr/bin/hello", ...)        = -1 ENOENT (No such file or directory)
statx("/sbin/hello", ...)           = -1 ENOENT (No such file or directory)
statx("/bin/hello", ...)            = -1 ENOENT (No such file or directory)
fork()                              = 500
[500] writev(2, ..., "hello: command not found", ...) = 24
[500] exit_group(127)               = ?
```

The shell searched only the `PATH` folders, never the one you're in. Its child
printed the message on file descriptor 2 and ended with status 127, the shell's
number for "command not found" (0 would mean all went well); no `execve` ran. A name with a `/` in it is a path, so the
shell doesn't search, and `.` means the folder you're in. That folder is left out of
`PATH` on purpose: a program named `ls`, dropped in a shared folder, must never run
in place of the real one.

### Debrief

> **init:** So the shell cuts your line into words, finds the program through `PATH`, and starts it with `fork` and `execve`. All of that needs a Machine that is already running. In The Boot Path you watch how it woke when you pressed the power button.

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
    each command with `fork` (the `fork` or `clone` syscall; `fork` on the
    Machine), `execve` and `wait4` (1.4 builds that). The prompt usually ends in
    `$` for an ordinary user and `#` for root. Tab completion is the shell reading a
    folder (`getdents64`) and finishing the name; the kernel only sees the read. —
    `kernel/fork.c`, `fs/exec.c`, `fs/readdir.c`.
  - **Read:** man 1 `bash` (https://www.gnu.org/software/bash/manual/bash.html; not
    installed on the Machine). Try: `strace -f -e trace=fork,clone,execve,wait4 sh -c
    'ls /; true'`. Deepened by 1.4 (running a program).
- **Commands** (`command`)
  - **Simple:** The first word of a line: the program to run, or a _builtin_ the
    shell does itself, like `cd`.
  - **Deep:** For a program, the shell calls `execve()` with the file's path; the
    kernel opens the file, checks that it may be run, and replaces the process's
    program with it. `cd` must be a builtin because a working directory belongs to
    one process: a child that changed its own would change nothing for the shell
    (1.5). `type` tells you which a name is. — `fs/exec.c`
    (`do_execveat_common()`).
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
  - **Deep:** The search happens in user space. bash asks the kernel about each
    candidate file in turn (`stat`; `statx` on the Machine), checks it may run the
    one it finds (`faccessat2`), and remembers it (`hash`). The C library's
    `execvp()` simply tries `execve()` in each folder. The kernel's `execve()`
    takes only a path and answers `-ENOENT` when nothing is there. The current
    folder is not in `PATH`, so a stray program in a shared folder can't stand in
    for a real command. — `fs/exec.c`, `fs/stat.c`.
  - **Read:** man 3 `exec`, man 7 `environ`. Try: `strace -f -e
    trace=%%stat,execve,fork,clone bash -c 'nosuchcmd; true'`. Deepened by 1.5.
- **The manual** (`man-pages`)
  - **Simple:** `man ls` shows the manual page for `ls`. A number picks a section:
    `man 2 write` is the syscall `write`.
  - **Deep:** Sections: 1 commands, 2 syscalls, 3 C library functions, 4 devices,
    5 file formats, 7 overviews, 8 admin commands. The Linux man-pages project
    documents the kernel's user-space interface; the kernel's own documentation
    lives in its `Documentation/` folder, published at docs.kernel.org. The
    Machine's pages for commands like `ls` and `wc` are GNU's; its `ls` and `wc`
    are BusyBox, whose `--help` lists the options it really takes. Every card in
    this Codex names its man pages this way.
  - **Read:** man 1 `man`, man 7 `man-pages`.

### Moved out of the story

| Fact (old story)                                                        | Now                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------ |
| the prompt `kernelfall:~$`, `~` for home, `$` for "your turn"           | `shell` Deep keeps `$` and `#`; the rest is gone       |
| "every level starts on a freshly restored Machine"                      | gone: init leaves `hello.c` in the editor              |
| runs of spaces: `/bin/echo one      two` is two arguments               | gone (`fidelity` lists it); 1.1 cuts a line into words |
| `-l` changes how, `/etc` says what; the shell doesn't know what `-l` is | `arguments` Simple and Deep                            |
| `faccessat2` asks "may I run this file?"                                | X-ray shows the call; `path-search` Deep, unnamed      |
| `hash`: bash remembers where it found a command                         | `path-search` Deep                                     |
| `.` and `..`, hidden names, `ls -a`'s output                            | S.1 (the streets of Userland)                          |
| `wc` alone and `wc -w`; `man ls` and finding `-a`; `man wc` and `-c`    | one `wc -l`, one manual page; the chips explain        |
| the manual's pages are GNU's, the programs BusyBox's; `ls --help`       | `man-pages` Deep                                       |
| sections 1 and 3 of the manual                                          | `man-pages` Deep                                       |
| Tab on `cat /etc/mo` listing four names; `ls /us` and Tab               | gone; the checker still tells Tab from a glob          |
| `printenv HOME`, `USER`, `env` for all of them                          | `environment` Simple; the chips                        |
| `ls /bin`: commands are files; `type ls cd`                             | `command` Deep and the `type` chip; S.1                |
| the `statx(".")` before the search                                      | `fidelity` (simplified)                                |
| `echo $?` shows the 127                                                 | gone here; P.5 asks for it and must explain it         |
| the signpost at init's door                                             | gone                                                   |
| the Watchdog's line about the blur                                      | gone: one Watchdog line per level                      |

### Real-world card

```sh
echo $SHELL                  # the shell you log in with
printenv PATH                # your PATH; yours may list other folders
type cat cd echo             # cat is a file found through PATH; cd and echo are builtins
ls -la ~                     # your home, hidden files too
man 2 write                  # section 2: the syscall from P.2 (q quits)
env GREETING=hi printenv GREETING
strace -f -e trace=%%stat,execve,fork,clone bash -c 'nosuchcmd; true'
```

The last line shows bash's search: `%%stat` is strace's class for every stat-like
call (`statx` on the Machine, often `newfstatat` on a 64-bit laptop; strace 6.19's
`%stat` leaves `statx` out). Among bash's own start-up calls there is one per `PATH`
folder for `nosuchcmd`, then a copy that prints "command not found". Other shells word it their own way: the Machine's `sh`
is BusyBox's, and `sh -c nosuchcmd` says `sh: nosuchcmd: not found`.

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** `argv` as passed to `execve`, the program's name first; splitting
  on runs of spaces; bash's real `PATH` search (`statx` per folder in order,
  `faccessat2` on the file found, then `hash`); a name with a `/` not searched
  (POSIX); a command not found as bash does it (fork, the copy prints
  `-bash: hello: command not found` and exits 127, nothing executed); `.` and `..`
  as real entries; the environment passed to children and never back; Tab
  completion reading the folder before Enter, and a glob reading it after; the real
  manual (mandoc, the man-pages project, GNU's command pages) and BusyBox's own `ls`
  and `wc`.
- **Simplified:** the traces in the story are trimmed: they leave out calls bash
  makes around each search and fork (a look at the current folder, a second access
  check, signal masks, a pipe, process groups), which X-ray shows. The kernel
  doesn't see the Enter key; Tab is told apart from a glob because the trace drops
  the shell's housekeeping before Enter (its `close()` of the folder among it) and
  keeps it after.

### Lab needs

Done: the Machine's bash, BusyBox, mandoc with the man-pages project, and the
trace of bash's own calls (`statx`, `getdents64`) and its forked copies. No engine
work left for this level.

---

## P.4 — The Boot Path

- **Id:** `prologue-boot-path-04-the-boot-path` · **Region / NPC:** the Machine's boot path / init, the Watchdog · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `sys-shell-basics` · **Skills unlocked:** `sys-boot-chain`

**Status: built and recorded on the real Machine** (`lab: { boot: {} }`: the level
starts at GRUB 2.14's menu on the player's terminal). Every menu, editor and `dmesg`
line below is copied from a real run.

**Question:** How does the Machine get from the power button to its first program?
Four hands pass it along: firmware, bootloader, kernel, init. The player edits what
the second tells the third.

**Teaches:** `boot-chain`, `kernel-cmdline`, `kernel-log`. **Names** (met here, not
taught): `user-space` (P.5 teaches it), `pipe` (S.5 teaches it), `driver` and
`initramfs` (P.6 and P.10 build on them; no built level teaches them yet), `uefi`. **Tools:** GRUB's `e`, `/proc/cmdline`, `dmesg`, `grep`,
`/sys/firmware/efi`. The story text is the level's `story.md`; this section lists its
beats.

### Scene

> **init:** In Speak to the Shell, bash started every program you named. I started bash. So who started me? The Watchdog has restarted the Machine, so you can watch it wake.
>
> **The Watchdog:** On purpose. Once. Don't make a habit of it.
>
> **init:** _Booting_ is everything between the power button and me. Four hands pass the Machine along: firmware, bootloader, kernel, init. The second is waiting on your terminal.

### See it (X-ray)

The level opens on GRUB's real menu; after the boot, X-ray's **boot view** lays the
steps out from the Machine's own `dmesg`.

1. **Name:** _bootloader_ (GRUB, the small program that loads the kernel) and
   _firmware_ (software stored on the board itself, which ran first and started GRUB
   from the disk). The Machine's menu has one entry:

   ```
                                GNU GRUB  version 2.14

    +----------------------------------------------------------------------------+
    |*Alpine, with Linux virt                                                    |
    +----------------------------------------------------------------------------+

         Use the ^ and v keys to select which entry is highlighted.
         Press enter to boot the selected OS, `e' to edit the commands
         before booting or `c' for a command-line.
   ```

2. **Do** (the first line): press `e`. **See:** what an entry really is:

   ```
   setparams 'Alpine, with Linux virt'

   insmod gzio
   insmod part_msdos
   insmod ext2
   search --no-floppy --fs-uuid --set=root 6b65726e-656c-4661-916c-000000000001
   echo        'Loading Linux virt ...'
   linux        /boot/vmlinuz-virt console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K quiet
   echo        'Loading initial ramdisk ...'
   initrd        /boot/initramfs-virt
   ```

   **Name:** the _kernel command line_: the words after the kernel's file on the
   `linux` line, settings for this boot (`console=ttyS0` sends the kernel's messages
   to the terminal, `quiet` keeps most of them off it). Only that line is explained.
3. The other two hands, in one paragraph: the kernel wakes its own parts and then
   its drivers, the code for each kind of device; it runs the initramfs, a small set
   of files GRUB loaded beside it, which finds the Machine's files, attaches them at
   `/` and hands over to `/sbin/init` as process 1.

### Build it

The player boots the Machine their own way. GRUB's keys are real: `e` edits the
entry; in the editor Ctrl-N/Ctrl-P move a line, Ctrl-E goes to its end, Ctrl-X (or
F10) boots the edit, Esc discards it. The story names Ctrl-N, Ctrl-E and Ctrl-X.

- **Starter provides:** GRUB's menu and chips for `cat`, `dmesg`, `grep` and `ls`.
- **Player does:** on the `linux` line, deletes `quiet`, adds `initcall_debug` and a
  word of their own, `greeting=hello`; boots with Ctrl-X; then reads what the
  kernel was told and did. `|` gets one clause: it sends `dmesg`'s lines to `grep`,
  which keeps only the lines holding a word.

```
$ cat /proc/cmdline
BOOT_IMAGE=/boot/vmlinuz-virt console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K initcall_debug greeting=hello
$ dmesg | grep "command line"
[    0.310190] Kernel/User page tables isolation: disabled on command line.
[    0.479757] Kernel command line: BOOT_IMAGE=/boot/vmlinuz-virt console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K initcall_debug greeting=hello
[    0.484263] Unknown kernel command line parameters "greeting=hello", will be passed to user space.
$ dmesg | grep serial8250_init
[    3.264988] calling  serial8250_init+0x0/0x170 @ 1
[    3.312852] initcall serial8250_init+0x0/0x170 returned 0 after 47826 usecs
```

The kernel didn't know `greeting=hello`, so it put it in init's environment, as `env`
did for `printenv` in P.3, and said so; "user space" is its name for the programs
outside it. `serial8250_init` is one _initcall_, a start-up function: it set up the
driver for `ttyS0`, the terminal's line. The number in brackets counts seconds since
the kernel started; the times change from boot to boot.

- **Checker verifies (behavior):**
  - `booted-your-way` (declared): `cat` read `/proc/cmdline` to the end, with
    `initcall_debug` and without `quiet`.
  - `initcalls-logged` (checker.ts): a command that ran `dmesg` put a `calling …`
    or `initcall … returned …` line on the terminal (through `grep` too).
  - `passed-to-init` (checker.ts): the same, with the kernel's `Unknown kernel
    command line parameters "…", will be passed to user space.` line.
  - `no-uefi` (checker.ts): `ls` asked for `/sys/firmware/efi` (`statx`) and got
    `ENOENT`.
- **Golden runs:** `solution` (the edit above); `kept-quiet` (adds the words but
  keeps `quiet`: only `booted-your-way` is missing, as `quiet` only quiets the
  console); `plain-boot` (Enter on the menu: only `no-uefi` is met).

### Watch it

**Predict:** "Did your edit change the next boot?" No: GRUB's editor worked on a copy
in memory; the entry itself is in `grub.cfg` on the Machine's disk (`/dev/sda1`,
which is not mounted, so the story gives no path), and nobody wrote to it, so
the next restart boots with `quiet` again.

```
$ ls /sys/firmware/efi
ls: /sys/firmware/efi: No such file or directory
```

One last look at the first hand: that folder exists only when the firmware is UEFI,
the kind on today's PCs; the Machine's is the older kind, a BIOS. X-ray's boot view
lays the boot out from the firmware to init.

### Debrief

> **init:** Firmware, bootloader, kernel, init: now you know every hand the Machine passes through, and that the bootloader tells the kernel how to boot.
>
> **The Watchdog:** And where to look when one of them drops it.
>
> **init:** One hand is bigger than the others: the kernel. Next, I open it for you.

P.5 begins. At this point init offers the region's placement check (see the top of
this spec); a player who passes it goes straight to P.10.

### Hints

1. Nudge: "The text after `linux` in the entry is the kernel command line. What do
   you want to take away, and what do you want to add?"
2. Concept: "Words on the command line are separated by spaces. `quiet` keeps most
   messages off the screen; `initcall_debug` logs each initcall; a word the kernel
   doesn't know is passed on to init. `dmesg | grep` keeps only the lines of the
   kernel's log that hold a word."
3. Point at the spot: "Press `e`, then Ctrl-N until the cursor is on the `linux`
   line and Ctrl-E to reach its end. Delete `quiet`, type `initcall_debug
   greeting=hello`, and press Ctrl-X."

### Codex (chapter: First Boot)

- **Boot sequence** (`boot-sequence`)
  - **Simple:** The Machine wakes in steps: firmware, bootloader, kernel, its
    start-up calls, initramfs, the root filesystem, then init.
  - **Deep:** The kernel initializes itself in `start_kernel()`, then
    `rest_init()` starts `kernel_init()`, which becomes PID 1, and `kthreadd`
    (PID 2), the parent of kernel threads. `kernel_init()` runs the initcalls, then
    the initramfs `/init` (`rdinit=` names another). Without one, it runs the
    `init=` boot parameter and panics if that fails; with no `init=` it tries
    `CONFIG_DEFAULT_INIT`, then `/sbin/init`, `/etc/init`, `/bin/init` and
    `/bin/sh`, and panics with "No working init found." if none runs. —
    `init/main.c` (`start_kernel()`,
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
    and starts a bootloader. The Machine's is SeaBIOS, a BIOS.
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
  - **Deep:** Each menu entry is a short script: `search` finds the partition
    holding `/boot`, `linux` names the kernel's file and its command line, `initrd`
    the initramfs. The menu lives in `/boot/grub/grub.cfg`, usually generated by
    `grub-mkconfig` from `/etc/default/grub`; `e` edits an entry for one boot only.
    GRUB puts `BOOT_IMAGE=`, the kernel's file, at the front of the command line.
    Distributions keep the previous kernel as a fallback entry, and dual-boot
    machines list other systems too. — `arch/x86/boot/`,
    `Documentation/arch/x86/boot.rst`.
  - **Read:** `info grub`, https://www.gnu.org/software/grub/manual/grub/.
- **The kernel command line** (`kernel-command-line`)
  - **Simple:** Settings passed to the kernel at boot, like `console=ttyS0` or
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
  - **Simple:** A small set of files in memory whose `/init` finds the real root filesystem,
    attaches it as `/`, and hands over to the real init.
  - **Deep:** The bootloader loads the initramfs (a cpio archive) next to the
    kernel; the kernel unpacks it into a RAM-backed root and runs `/init`. That
    program loads what is needed to reach `root=` (disk drivers, decryption), mounts
    it and calls `switch_root`. Without an initramfs, the kernel mounts `root=`
    itself and panics with "VFS: Unable to mount root fs" if it can't. —
    `init/initramfs.c`, `init/do_mounts.c`,
    `Documentation/filesystems/ramfs-rootfs-initramfs.rst`.
  - **Read:** man 8 `switch_root`, man 7 `bootparam`.

### Moved out of the story

| Fact (old story)                                                        | Now                                                      |
| ----------------------------------------------------------------------- | -------------------------------------------------------- |
| BIOS reads the MBR; UEFI reads the EFI system partition; NVRAM          | `firmware` Deep; the story keeps "BIOS, not UEFI"        |
| a partition; `/dev/sda`, where GRUB's first piece lives                 | P.10's repair (`ls /dev`, `(hd0,msdos1)`)                |
| several kernels and other systems as menu entries; a laptop's menu      | `bootloader` Deep                                        |
| `search` and `initrd`; `insmod`; `vmlinuz` is compressed                | `bootloader` Deep has the first two; the rest is gone    |
| `start_kernel()` sets up the CPU, memory, interrupts, the scheduler     | `boot-sequence` Deep names it; the list is gone (P.7)    |
| the kernel's first `dmesg` lines; the `BIOS-e820` memory map            | `firmware` Deep has e820; the version line is P.1's      |
| initcall levels, `pure` to `late`; the disk controller's driver         | `initcalls` Deep names four levels; the rest is gone     |
| `root=`, the root filesystem, mounting, `Run /init as init process`     | `initramfs` Deep; P.9 teaches mounts, P.10 `root=`       |
| the Machine's root is a share, not a disk                               | `fidelity`; P.9 reads it in `/proc/mounts`               |
| Ctrl-P and Esc in GRUB's editor                                         | this spec; `fidelity` lists Esc                          |
| `BOOT_IMAGE=` is GRUB's word                                            | `bootloader` Deep                                        |
| init's environment is root-only, in `/proc/1/environ`                   | gone; `environment` Deep (P.3) has `/proc/<pid>/environ` |
| the two initcall lines' format, `@ 0`, modules in brackets, `[9pnet]`   | `initcalls` Deep has the brackets; the rest is gone      |
| `grep -i`, `-m 4`, `-c`                                                 | gone: the commands need no options now                   |
| `/etc/default/grub`, `grub-mkconfig`, root; why it fails on the Machine | `bootloader` Deep and `fidelity`                         |
| the Kernel Map lighting from firmware to init                           | the region recap on the level's card                     |

### Real-world card

```sh
cat /proc/cmdline                       # your kernel command line
ls /sys/firmware/efi && echo UEFI       # booted by UEFI?
ls /boot                                # the kernels and initramfs files side by side
sudo dmesg | head -n 30                 # this boot's first kernel messages
```

At the GRUB menu of a test machine or virtual machine, press `e` and add
`initcall_debug` for one boot, then read `sudo dmesg | grep initcall`. Most
distributions hide the menu unless you hold Shift or press Esc while the machine
starts. Never experiment on a computer you depend on.

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** SeaBIOS, a real BIOS (no UEFI, no `/sys/firmware/efi`); GRUB 2.14's
  real menu, editor and keys; the entry's `search`, `linux` and `initrd` lines and
  `BOOT_IMAGE=`; one-boot edits; `initcall_debug`'s lines and the "Unknown kernel
  command line parameters" line, from the real kernel; unknown parameters in init's
  environment.
- **Simplified:** GRUB's menu waits (Alpine's boots after 2 seconds; no timers in the
  game). The Machine's `grub.cfg` is written by the game, since `grub-mkconfig`
  can't probe a 9p root. The initramfs `/init` is a short script written for the
  game, modelled on Alpine's.

### Lab needs

Done: `lab.boot` (GRUB on `/dev/sda1`, the level starts at its menu), `dmesg`
readable as the player, X-ray's boot view. Wanted: a Watchdog restart from the level
UI (`useMachineReboot()`), so the Predict can show the plain entry come back.

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

**Part 2: kernel space and user space.** Every byte of memory has a number, its
**memory address**; `0x` means hexadecimal, and a **bit** (0 or 1, eight to a byte)
is what each hex digit packs four of. The Machine is a 32-bit PC: 4 GiB of
addresses per process. The lower 3 GiB (`0x00000000`–`0xbfffffff`) are **user
space**; the top 1 GiB, from `0xc0000000`, is **kernel space**, present in every
process but locked (`CONFIG_VMSPLIT_3G`, `PAGE_OFFSET`).

The player opens `poke.c` (a starter the setup doesn't build) and presses Run, which
builds `poke` and runs it: it reads the first byte of kernel space, `0xc0000000`.
Then `echo $?` (real output):

```
$ ./poke
Segmentation fault         ./poke
$ echo $?
139
```

```
--- SIGSEGV {si_signo=SIGSEGV, si_code=SEGV_MAPERR, si_addr=0xc0000000} ---
+++ killed by SIGSEGV +++
```

The CPU refused the read, because `poke` runs in user mode. The kernel was called in
to deal with it, and ended `poke` with a **signal**: a short notice the kernel
delivers to a process. This one, `SIGSEGV` ("segmentation violation", a bad memory
access, number 11), ends the process unless it was prepared for it; the shell
reports 128 + 11 = 139. Other signals: `SIGINT` when you press Ctrl-C, `SIGTERM` for
"please stop". "Not its memory, not the hardware. It has to ask."

Page-table isolation (PTI, against Meltdown) would hide most of the kernel while
user code runs; the Machine boots with `mitigations=off`, and its `dmesg` says
`Kernel/User page tables isolation: disabled on command line.`

**Part 3: one big program, with add-ons.** Linux is a **monolithic** kernel: the
scheduler, memory, filesystems, drivers and networking all run in kernel mode, in
one program. (A **microkernel**, like seL4 or QNX's, keeps only the basics in the
kernel and runs drivers and filesystems as separate processes that pass messages;
safer when a driver fails, slower to talk.) Linux can still grow while it runs:
**modules**, pieces of the kernel kept in files and added when needed.

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

The Dockmaster speaks from the drawing: "Modules wait on disk until they're needed.
I load them. When the Deep wakes up, you'll write one." 868 modules ship as
`.ko.gz` files; twelve are loaded. Each line gives the size, then the **reference
count** (how many things use the module now: often the modules named after it, like
`ext4` using `jbd2`; `9p`'s `1 -` is the mounted root filesystem), then the address,
shown as zeros for anyone but root.

**Part 4: Linux and the distribution.** `uname -sr` prints `Linux 6.18.63-0-virt`:
that's the kernel. `cat /etc/os-release` prints `PRETTY_NAME="Alpine Linux v3.24"`:
that's the **distribution**, Linux plus everything around it. init: "Linux is only
the kernel. I, the shell, the C library, `ls` and `cat`: we're the rest." Alpine
uses musl and BusyBox, not the GNU tools and C library, so it's "Alpine Linux",
not "GNU/Linux".

**Part 5: which Linux.** The Maintainer, from the drawing's last panel: "New kernels
come out of **mainline** about every nine or ten weeks. **Stable** releases add
fixes to them. Once a year, one becomes **LTS**, long-term support, and gets fixes
for years. This Machine runs 6.18 LTS, so everything you learn here stays true while
you learn it." The release reads like a label: `6.18`, its 59th stable update,
Alpine's build `0` of the `virt` flavour. And one line about the license: Linux is
free software under the **GPL, version 2**: anyone may use, study, change and share
it, and whoever shares the kernel as a program must share its source too.

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
  - `./myuname` made the `uname` syscall (the kernel's tracepoint calls it
    `newuname`), exited 0, and after that call printed `Linux`, a `6.18.x` release
    and `i686` on one line; the test checks these words against
    `machine-facts.json`. The trace doesn't carry the record `uname` filled, so a
    line typed into the program after a real `uname` call would pass too.
  - `uname` printed `i686` (so `-m` was given).
  - `./poke` faulted on a kernel address (`exceptions:page_fault_user` at or above
    `0xc0000000`; the Machine reports error code 5, a user-mode access to a present
    page) and the kernel ended it with `SIGSEGV`.
- **Golden runs:** `solution`; `starter` (the starter `myuname` and `uname -sr`:
  rejected for `prints-machine`, `compares-uname`, `poke-segfaults`); `impostors`
  (a `poke` that reads address 0, also killed by `SIGSEGV`, and a `myuname` that
  prints the line without calling `uname`: rejected for `poke-segfaults`,
  `prints-machine`, `asks-uname`, `compares-uname`).

### Watch it

**Predict:** "Your program and the `uname` command: will they print the same
release?" Both made the same syscall, and X-ray shows them side by side:

```
uname({sysname="Linux", nodename="kernelfall", ...}) = 0
```

```
$ ./myuname
Linux 6.18.63-0-virt i686
$ uname -srm
Linux 6.18.63-0-virt i686
```

`i686` is a 32-bit x86 CPU of the Pentium Pro family or later; the Machine's calls
itself a Pentium III. The Section drawing gets its first label, "kernel", and a dotted line around it:
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
    kernel answers with a signal (`SIGSEGV`). For a user-mode access to a kernel
    address, `handle_page_fault()` calls `do_kern_addr_fault()`, which ends in
    `bad_area_nosemaphore()` and a `SIGSEGV` with `SEGV_MAPERR`. —
    `arch/x86/mm/fault.c`, `kernel/signal.c`.
  - **Read:** man 7 `signal`.
- **Kernel space and user space** (`kernel-user-space`, deepens: `user-kernel-mode`)
  - **Simple:** Every process's addresses are split: the lower part is its own,
    the upper part belongs to the kernel and is locked.
  - **Deep:** On 32-bit x86 with the 3G/1G split (`CONFIG_VMSPLIT_3G`), the
    Machine's, user space is `0`–`0xbfffffff` and kernel space starts at
    `PAGE_OFFSET`, `0xc0000000`. On x86-64 with 4-level page tables, user space is
    the 128 TiB up to `0x00007fffffffffff`; kernel space is the top half. The
    kernel's pages are marked supervisor-only, and with page-table isolation (PTI)
    most of them aren't even mapped while user code runs; the Machine boots with
    `mitigations=off`, so PTI is off. — `arch/x86/include/asm/page_32_types.h`,
    `arch/x86/Kconfig`, `arch/x86/mm/pti.c`.
  - **Read:** https://docs.kernel.org/arch/x86/pti.html. Deepened by P.8
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
  - **Deep:** Many distributions combine Linux with GNU tools (coreutils, bash) and
    glibc, and call themselves GNU/Linux; Alpine, the Machine's, uses musl and
    BusyBox instead. Android uses the Linux kernel with its own user space (bionic, ART).
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
    and share it, and share its source when you share the kernel as a program.
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

- **Faithful:** `uname()`, `struct utsname` and the `newuname` tracepoint; `SIGSEGV`
  for a user-mode read of a kernel address, judged from the CPU's fault and the
  kill, status 139; the 32-bit 3G/1G split at `0xc0000000`; PTI off under
  `mitigations=off`; `/proc/modules` columns and its zeroed addresses for non-root;
  `/lib/modules/<release>` with `.ko.gz` files; the release model; the license
  facts.
- **Simplified:** the drawing's five parts are a map of what the kernel owns, not its
  code layout; `myuname`'s line is judged by its words and by coming after a
  successful `uname`, not by where the words came from.

### Lab needs

None beyond the shared Machine: `poke.c` and `myuname.c` are starters built by the
Run button.

---

## P.6 — Finding the Hardware

- **Id:** `prologue-machine-in-section-06-finding-the-hardware` · **Region / NPC:** The Machine in Section, the hardware floor / init · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `sys-kernel-role` · **Skills unlocked:** `drv-hardware-discovery`

**Question:** How does the kernel give each device its driver? The Machine answers
with `lspci -k` and a `driver` link in `/sys`; the lighthouse board with a device
tree.

**Teaches:** `bus`, `sysfs`, `device-tree`. **Uses:** `kernel`, `driver` (P.4),
`device`, `hex` (P.5), `file-tree`. **Tools:** `lspci`, `/sys`, `readlink`, `dtc`,
`board`. Registers, MMIO, interrupts, ACPI and the driver core's functions are Codex
cards here, with pointers to the levels that build them. The story text is the
level's `story.md`; this section lists its beats.

### Scene

> **init:** The Kernel Up Close ended on a question. The kernel owns every device, but who tells it which devices it has?
>
> **init:** Mostly, nobody. The same Linux runs on laptops, phones and servers, so at every boot it finds most of its hardware itself, and hands each device to a driver, the kernel code you saw set up in The Boot Path.
>
> **The Watchdog:** A part without a driver is furniture.

### See it (X-ray)

1. **Do** (first line): `lspci -k`. **See** (real output):

```
$ lspci -k
00:00.0 Host bridge: Intel Corporation 440FX - 82441FX PMC [Natoma] (rev 02)
00:01.0 ISA bridge: Intel Corporation 82371SB PIIX3 ISA [Natoma/Triton II]
00:06.0 Unclassified device [0002]: Red Hat, Inc. Virtio 9P transport (rev 01)
	Subsystem: Red Hat, Inc. Device 0009
	Kernel driver in use: virtio-pci
00:0a.0 Unclassified device [0002]: Red Hat, Inc. Virtio 1.0 network device (rev 01)
	Subsystem: Red Hat, Inc. Device 0001
	Kernel driver in use: virtio-pci
00:12.0 VGA compatible controller: Device 1234:1111
	Subsystem: Red Hat, Inc. Device 1100
00:1e.0 IDE interface: Intel Corporation 82371SB PIIX3 IDE [Natoma/Triton II]
	Subsystem: ASUSTeK Computer Inc. Device 82d4
	Kernel driver in use: ata_piix
```

2. **Name:** _bus_: the wiring that joins devices to the CPU, and the rules for
   talking over it. At boot the kernel asks every PCI slot what is there; each
   device answers with its maker's and its model's numbers; the bus offers it to the
   drivers, and one whose list holds those numbers takes it. **Why:** one kernel runs
   on any PC. The two bridges join the bus to the CPU, memory and the PC's oldest
   parts, run by the kernel's core; `ata_piix` took the disk controller; the display
   controller at `00:12.0` has no driver line: its driver, `bochs`, sits unloaded in
   a module file. The drawing's hardware floor fills in: six parts, three joined to a
   driver.
3. **Name:** _/sys_: a tree of small files, one fact each, where the kernel writes
   what it found, so programs like `lspci` can read it. **Do:**

   ```
   $ cat /sys/bus/pci/devices/0000:00:1e.0/vendor /sys/bus/pci/devices/0000:00:1e.0/device
   0x8086
   0x7010
   ```

   `0x8086` is Intel; `0x7010` is its PIIX3 disk controller, on `ata_piix`'s list.

### Build it

- **Starter provides:** chips for `lspci`, `cat`, `readlink`, `dtc` and `board`; the
  `lighthouse.dts` file in the editor (a made-up ARM board written with real
  bindings; the LED child is `led-0`, as `leds-gpio.yaml` asks); **`board`**, a lab
  program (`lab.files` puts its C source in `/usr/local/src`, `lab.bin` builds it)
  that reads a real `.dtb` and matches each node of the root against the real
  `of_match_table` strings of `pinctrl-bcm2835` and `leds-gpio`, printing one line
  per device and the board's `/sys/class/leds`.
- **Player does:**
  - On the Machine: `readlink` the disk controller's `driver` link, a file that
    points to another path.
  - On the board: **name:** _device tree_, the hand-written description of devices
    that can't announce themselves; each node names its device with a `compatible`
    text, and a driver takes the node if that text is on its list.
    `dtc -I dts -O dtb -o lighthouse.dtb lighthouse.dts`, then `board lighthouse.dtb`
    (real output with the starter: `leds: no driver matches "gpio-led"`). init shows
    the `of_match_table` of `drivers/leds/leds-gpio.c` (`"gpio-leds"`); the player
    fixes the node, compiles and boots again.

The starter tree:

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

		led-0 {
			label = "lighthouse:lamp";
			gpios = <&gpio 4 0>;
		};
	};
};
```

The list init shows, from `drivers/leds/leds-gpio.c`:

```c
static const struct of_device_id of_gpio_leds_match[] = {
	{ .compatible = "gpio-leds", },
	{},
};
```

- **Checker verifies (behavior):**
  - `asks-pci-bus` (declared `ran` check): `lspci` ran with `-k` and exited 0.
  - `reads-disk-driver`: the `driver` link of `0000:00:1e.0` was read
    (`readlink`/`readlinkat`) and names `ata_piix` (checked against
    `machine-facts.json`).
  - `compiles-dts`: `dtc` compiled `lighthouse.dts` without errors.
  - `lamp-binds`: `board` printed `leds-gpio leds: probed` and `lighthouse:lamp`.
- **Golden runs:** `solution` (`lspci -k`, `readlink`, `dtc`, `board`); `starter`
  (the unfixed tree, without the Machine's errands: rejected for `asks-pci-bus`,
  `lamp-binds` and `reads-disk-driver`).

### Watch it

**Predict:** "The node said `gpio-led`, the list says `gpio-leds`. Close enough for
the kernel?" No: the kernel compares the whole text. After the fix (real output):

```
$ board lighthouse.dtb
OF: fdt: Machine model: Socket Harbor lighthouse
pinctrl-bcm2835 7e200000.gpio: probed
leds-gpio leds: probed
/sys/class/leds: lighthouse:lamp
```

With the match, `leds-gpio` takes the lamp, as `ata_piix` took the disk controller:
on a PC the bus matches numbers, on a board the device tree's names. The lamp's
`label` is its name in the board's `/sys/class/leds`. Far away on the map, a light
blinks once at Socket Harbor, then goes out.

### Debrief

> **init:** You can find which driver runs a device, and give a board's device its driver. Each device goes to a driver whose list matches it. Next, another part of the kernel: one CPU, and many programs that want it. Who decides? Find out in Who Runs.

P.7 begins.

### Hints

1. Nudge: "In `/sys`, a device that has a driver has a link named `driver`. For the
   lamp, compare two texts: its node's `compatible` and the driver's list."
2. Concept: "A node binds when its `compatible` text is one of the texts in a
   driver's `of_match_table`, whole and letter for letter; only upper and lower case
   may differ."
3. Point at the spot: "The `leds` node says `\"gpio-led\"`. The driver's list says
   `\"gpio-leds\"`."

### Codex (chapter: The Machine in Section)

Three cards for the core concepts (`driver-model`, `sysfs`, `device-tree`); `drivers`
for the concept P.4 named; two depth cards that hold what the story no longer
teaches, each pointing at the level that builds it.

- **Buses, devices and drivers** (`driver-model`)
  - **Simple:** A bus finds its devices and offers each to the drivers; one whose
    list matches takes it. `lspci -k` prints `Kernel driver in use: ata_piix`.
  - **Deep:** The driver model has `struct bus_type`, `struct device` and
    `struct device_driver`. When either side is added, the core calls the bus's
    `match()`, then the driver's `probe()`, which takes the device over, in
    `really_probe()`. PCI joins cards inside a PC, USB plugged-in devices, I²C a
    board's small chips; PCI matches the IDs in a driver's `id_table`. On most systems udev, in Userland, hears each new device as
    a uevent and loads its module by `modalias`; the Machine runs no udev. —
    `drivers/base/dd.c`, `drivers/base/bus.c`, `drivers/pci/pci-driver.c`.
  - **Read:** https://docs.kernel.org/driver-api/driver-model/overview.html, man 7
    `udev`. Deepened by 2.4 (the Lantern's device).
- **`/sys`, the devices' tree** (`sysfs`)
  - **Simple:** Files the kernel fills with what it knows about devices, one fact
    each: `/sys/bus/pci/devices/0000:00:1e.0/vendor` holds `0x8086`, Intel.
  - **Deep:** sysfs is made by the kernel from its own objects, on read, like
    `/proc`. `/sys/bus/<bus>/devices` and `/sys/bus/<bus>/drivers` show a bus's two
    sides, `/sys/devices` the physical tree, `/sys/class` devices by kind. A bound
    device's `driver` entry is a symbolic link into its driver's folder. A PCI
    device's folder is named by its address: domain `0000`, bus `00`, slot `1e`,
    function `0`. `lspci` reads its answers from `/sys/bus/pci`. In 2.7 the Lantern gets files of its own
    here. — `fs/sysfs/`, `drivers/base/core.c`.
  - **Read:** https://docs.kernel.org/filesystems/sysfs.html. Deepened by 2.7.
- **The device tree** (`device-tree`)
  - **Simple:** A text description of a board's devices, compiled by `dtc` and
    handed to the kernel at boot. Most ARM and RISC-V boards use one.
  - **Deep:** A `.dts` is a tree of nodes with properties: `compatible`, `reg` for
    register addresses, links like `<&gpio 4 0>`, the lamp on pin 4 of a GPIO
    controller, a chip whose pins software switches. Drivers list their strings in
    an `of_match_table`; `of_compat_cmp()` compares whole strings, ignoring case. A
    node with `reg` becomes a device named address.node, like `7e200000.gpio`. A
    running system shows its tree in `/sys/firmware/devicetree/base`. You write the
    lighthouse beacon's driver in 3.14. — `drivers/of/`, `arch/arm64/boot/dts/`,
    `drivers/leds/leds-gpio.c`.
  - **Read:** https://docs.kernel.org/devicetree/usage-model.html, man 1 `dtc`.
    Deepened by 3.14.
- **Drivers** (`drivers`)
  - **Simple:** The kernel code that knows how to work one kind of device:
    `ata_piix` runs the Machine's disk controller.
  - **Deep:** Most of the kernel's code is drivers, under `drivers/`. A driver
    registers with a bus and is offered every matching device; it can be built in
    or a module. Without a bound driver, the kernel sees a device but can't run it.
    The Machine's display controller at `00:12.0` has one, `bochs`, as a module
    nothing loads: no udev. — `drivers/`,
    `include/linux/device/driver.h`.
  - **Read:** https://docs.kernel.org/driver-api/. Deepened by P.9 and 2.4.
- **Finding hardware: ACPI and PCI** (`acpi-pci`)
  - **Simple:** On PCs, firmware tables called ACPI describe what can't announce
    itself, and the kernel asks each PCI slot for its vendor and device IDs.
  - **Deep:** The kernel's ACPI core parses the firmware's tables, the DSDT and
    others; `/sys/firmware/acpi/tables` shows them. Arm servers use ACPI too. PCI
    devices are found by reading each slot's configuration space in
    `pci_scan_device()`; each gets a `struct pci_dev`. A host bridge joins PCI to the
    CPU and memory; an ISA bridge leads to old PC parts like the keyboard. The
    Machine's firmware gives no ACPI tables: `/sys/firmware` holds only `memmap`. You write a
    PCI driver in 3.15. — `drivers/acpi/`, `drivers/pci/probe.c`,
    `include/linux/pci.h`.
  - **Read:** man 8 `lspci`, https://docs.kernel.org/PCI/pci.html. Deepened by 3.14
    (`acpi-hid`) and 3.15 (`pci-driver`).
- **Interrupts and MMIO** (`interrupts-mmio`)
  - **Simple:** A driver works its device through registers, often at memory
    addresses; the device calls for attention with an interrupt.
    `cat /proc/interrupts` counts them.
  - **Deep:** A driver maps its device's registers with `ioremap()` and uses
    `readl()` and `writel()`; old PC parts use I/O ports, `inb()` and `outb()`. An
    interrupt makes the CPU jump into the kernel between two instructions and run the
    handler given to `request_irq()`; `local_irq_disable()` holds them off.
    Deferrable work goes to softirqs, run as the interrupt ends or by `ksoftirqd`, or
    to workqueues, which may sleep. On the Machine's XT-PIC, line 0 is the timer.
    Built in 2.10a–2.10c and 3.15. —
    `kernel/irq/`, `kernel/softirq.c`, `include/linux/io.h`,
    `arch/x86/kernel/i8259.c`.
  - **Read:** https://docs.kernel.org/core-api/genericirq.html. Deepened by
    2.10a–2.10c (the Interrupt Spire) and 3.15 (`pci-bar`).

### Moved out of the story

| Fact (old story)                                                          | Now                                                  |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| USB and I²C as other buses                                                | `driver-model` Deep                                  |
| ACPI tables describe the board; Arm servers use ACPI                      | `acpi-pci` Simple and Deep; 3.14                     |
| the Machine's firmware gives no ACPI; `/sys/firmware` holds only `memmap` | `acpi-pci` Deep; `fidelity`                          |
| PCI enumeration, configuration space                                      | `acpi-pci` Deep; 3.15                                |
| what the host bridge and ISA bridge do                                    | one clause in the story; detail in `acpi-pci` Deep   |
| 440FX and PIIX3 are 1990s chips, emulated; virtio IDs from Red Hat        | `fidelity`                                           |
| `rev` is a revision, `Subsystem` who built the card                       | `fidelity`                                           |
| `probe()`, the driver model's three structures                            | `driver-model` Deep; 2.4                             |
| udev loads modules and names devices; the Machine runs none               | `driver-model` Deep; P.9                             |
| registers, MMIO, I/O ports                                                | `interrupts-mmio` Simple and Deep; 3.15              |
| interrupts, the jump between two instructions, `cli`/`local_irq_disable`  | `interrupts-mmio` Deep; 2.10a–2.10c                  |
| `/proc/interrupts`, XT-PIC, one CPU column, line 0 the timer              | `interrupts-mmio` Simple and Deep, `fidelity`; 2.10b |
| `ttyS1` carries the trace                                                 | `fidelity` (game internals)                          |
| ksoftirqd's cameo: "the handler does the urgent part"                     | `interrupts-mmio` Deep; 2.10b                        |
| `reg`, nodes, `of_match_table`, `7e200000.gpio`, GPIO pin 4               | `device-tree` Deep; 3.14                             |
| the LED child `led-0` as the binding asks                                 | `fidelity`                                           |
| `-I dts -O dtb -o` explained                                              | the `dtc` chip                                       |
| a PCI address: bus, slot, function                                        | `sysfs` Deep                                         |
| the 9P transport carries the Machine's files                              | `fidelity`                                           |
| which interrupt line each device uses                                     | the real-world card's `/proc/interrupts`, 2.10b      |
| "a link: a file that points to another path"                              | stays in the story (Build it)                        |

### Real-world card

```sh
lspci -k                                   # PCI devices and their drivers
ls /sys/bus/pci/drivers                    # every PCI driver the kernel has now
cat /proc/interrupts                       # which device interrupts the CPU, how often
ls /sys/firmware/devicetree/base 2>/dev/null || echo "no device tree, as on most PCs"
```

On a Raspberry Pi or another ARM board, `ls /proc/device-tree` shows the live
tree, and `dtc -I fs -O dts /proc/device-tree` turns it back into text.

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** the Machine's real PCI devices, IDs and drivers as `lspci -k`
  prints them: a 1990s PC's chips, Intel's 440FX and PIIX3, emulated, and two virtio
  devices designed for virtual machines, with IDs Red Hat registered (`rev` is a
  chip's revision, `Subsystem` who built the card around it); the 440FX is also the
  memory controller, and the PIIX3's ISA side holds the timer, the interrupt
  controllers and DMA; no ACPI tables from the firmware (dmesg: no valid RSDP):
  `/sys/firmware` holds only `memmap`; the `/sys` layout and `driver` links, and no
  driver bound to the display controller (`bochs.ko` is on the image, unloaded; the
  VGA text console still writes to it through the old VGA ports); `/proc/interrupts`
  on one CPU through the XT-PIC (most PCs use an IO-APIC and MSI, a column per CPU);
  the device tree
  syntax, real `dtc`, the `gpio-leds` and `brcm,bcm2835-gpio` compatible strings,
  whole-string matching that ignores case (`of_compat_cmp()`); the LED child named
  `led-0` as the leds-gpio binding asks; platform device names from nodes
  (`7e200000.gpio`) and LED names from labels.
- **Simplified:** the lighthouse board is made up (real bindings, invented board);
  `board` matches a real `.dtb` against two drivers' real tables but runs no ARM
  kernel, and its probe lines are its own (the driver core logs bindings only at
  debug level); the serial line `ttyS1` and its interrupts carry the kernel's trace
  to the browser.

### Lab needs

Met with level content only: `lab.files` writes `board.c` to `/usr/local/src`,
`lab.bin: [board]` builds it at setup. `dtc` and `lspci` are on the image.

---

## P.7 — Who Runs

- **Id:** `prologue-machine-in-section-07-who-runs` · **Region / NPC:** The Machine in Section, the processes floor / init, the Watchdog; on the drawing: the Verger · **Tracks:** `userland`, `kernel` · **Time:** ~20 min · **Prerequisites:** `sys-kernel-role` · **Skills unlocked:** `proc-process-basics`

### Scene

> **init:** The bottom floor's done: the hardware, and a driver for each part. One floor up, someone has to decide who gets to use the CPU.
>
> **init:** Remember: a program is a file; a process is a program running, with its own memory and its own number. Every process also has a parent: the process that started it.
>
> **The Watchdog:** And one CPU. One. Everybody wants it.
>
> **init:** So the kernel takes turns for us, many times a second. Let's watch.

### See it (X-ray)

1. BusyBox `ps` lists every process (real output, cut with `...`; PIDs vary):

   ```
   $ ps
   PID   USER     TIME  COMMAND
       1 root      0:00 /sbin/init
       2 root      0:00 [kthreadd]
       3 root      0:00 [pool_workqueue_]
   ...
      15 root      0:00 [ksoftirqd/0]
   ...
      39 root      0:00 [kswapd0]
   ...
     471 root      0:01 cat /sys/kernel/tracing/trace_pipe
     473 root      0:00 {kf-control} /bin/sh /usr/sbin/kf-control
     480 you       0:00 -bash
     491 you       0:00 ps
   ```

   PID 1 is init. PID 2, `kthreadd`, is the parent of the **kernel threads**, in
   brackets, dozens of them: the kernel's own workers, which the scheduler runs like
   processes but which only ever run kernel code (`ksoftirqd/0` finishes interrupt
   work for the one CPU; `kswapd0` frees memory). At the bottom: the trace reader
   that feeds X-ray, the game's control shell, the player's login shell `-bash`, and
   `ps`.
2. `cat /proc/$$/status` (`$$`: the shell's own PID) shows what the kernel keeps
   about the player's shell; the level shows an excerpt:

   ```
   Name:	bash
   State:	S (sleeping)
   Pid:	480
   PPid:	1
   ...
   VmRSS:	    2236 kB
   ...
   voluntary_ctxt_switches:	218
   nonvoluntary_ctxt_switches:	294
   ```

   Every count and size here changes from run to run; the story says so.

   `S (sleeping)`: waiting for you to type. `PPid: 1`: its parent is init. `VmRSS`:
   the memory it is using right now. The two counters say how often it gave up the
   CPU because it had to wait (voluntary), or had it taken away because its turn was
   over (nonvoluntary).
3. **The scheduler.** `nproc` prints `1`. The player types init's line (real
   output from a recorded run):

   ```
   $ yes > /dev/null & yes > /dev/null & yes > /dev/null & sleep 4; top -b -n 1 | head -12; kill %1 %2 %3
   [1] 495
   [2] 496
   [3] 497
   Mem: 21200K used, 202452K free, 8K shrd, 0K buff, 2852K cached
   CPU:   5% usr  54% sys   0% nic   0% idle   0% io  39% irq   0% sirq
   Load average: 0.90 0.21 0.07 5/62 500
     PID  PPID USER     STAT   VSZ %VSZ CPU %CPU COMMAND
     471     1 root     R     1716   1%   0  25% cat /sys/kernel/tracing/trace_pipe
     495   480 you      R     1652   1%   0  10% yes
     497   480 you      R     1652   1%   0   9% yes
     496   480 you      R     1652   1%   0   9% yes
     499   480 you      R     1664   1%   0   7% top -b -n 1
   ...
   ```

   All three `R` (running, or ready to run), all on CPU `0`: one runs at a time, the
   others wait in the **run queue** and take turns in short slices. The trace of
   every `write` they make costs CPU too: the trace reader's 25%, the `sys` share,
   and the `irq` share, mostly `ttyS1`, the serial line carrying the trace out (in
   those four seconds it interrupted about 5,000 times, as often as the timer;
   `ttyS0` 80). Watching isn't free. X-ray shows the one CPU's lane, with the
   three taking turns.
4. **Many at once.** One picture: two processes add 1 to the same counter; one is
   stopped halfway through its addition while the other does its own, and one
   addition is lost. One CPU is enough. The Verger, on the drawing: "That's why the
   kernel has locks, and why I write down the order every lock is taken." (Lock
   Cathedral, 2.9.)

### Build it

- **Starter provides:** `mypid.c` (not `whoami.c`: `whoami` is a BusyBox applet),
  complete except one line:

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
  run `./mypid` twice.
- **Checker verifies (behavior):**
  - `./mypid` called `getpid` and `getppid`, exited 0, and printed its real PID and
    its parent's, which is the shell that started it (each run is judged alone; a
    checker sees one command at a time).
  - `/proc/<pid>/status` of some process was read (re-tests the See it beat).
  - `top` or `ps` printed at least three `yes` in state `R` (`shares-one-cpu`).
- **Golden runs:** `solution`; `starter` (one `yes`, the starter `mypid`: rejected
  for `shares-one-cpu`, `prints-parent-pid`, `reads-proc-status`).

### Watch it

**Predict:** "Run `./mypid` twice. Same PID both times? Same parent?" Different
PIDs (each run is a new process); the same parent (the shell started both).

```
$ ./mypid
I am process 502
My parent is 480
$ ./mypid
I am process 503
My parent is 480
```

The processes floor of the Section drawing fills with small figures: init at the
root, the shell under it, the kernel threads off to one side. Labels appear: the
Process District (1.4–1.8), the Clockwork Court (3.6–3.8), the Lock Cathedral (2.9).

### Debrief

> **init:** Every process has a number, a parent and a state, and the kernel takes turns giving each one the CPU.
>
> **init:** But each of them also thinks it has the whole Machine's memory to itself. It doesn't. Let's see how the kernel pulls that off, in Pages and Maps.

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
ps -e --forest | head -n 30       # the process tree (GNU ps)
ps -o pid,ppid,stat,comm -p $$    # your shell: its PID, parent and state (GNU ps)
grep ctxt /proc/$$/status         # how often it gave up the CPU
nproc                             # how many CPUs you have
```

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** BusyBox `ps` and `top` output; PID 1 and PID 2; the Machine's kernel
  threads; the `/proc/<pid>/status` field names and formats; `R` and `S` states; one
  CPU and one run queue; `getpid` and `getppid`; EEVDF as the 6.18 default.
- **Simplified:** X-ray's CPU lane draws the turns, not EEVDF's arithmetic. Tracing
  every syscall for X-ray costs CPU time an unwatched Machine wouldn't spend.

### Lab needs

None beyond the shared Machine. Risk: three traced `yes` flood the trace with
`write` events (about 6,000 events in the 4-second reference run); the app's X-ray
must stay responsive.

---

## P.8 — Pages and Maps

- **Id:** `prologue-machine-in-section-08-pages-and-maps` · **Region / NPC:** The Machine in Section, the memory floor / init; on the drawing: kswapd · **Tracks:** `kernel` · **Time:** ~25 min · **Prerequisites:** `proc-process-basics` · **Skills unlocked:** `mem-virtual-memory-basics`

### Scene

> **init:** You saw every process get its own number. Here's the stranger part: every one of them also gets its own memory, or thinks it does.
>
> **init:** 256 MiB. That's all the RAM the Machine has. And yet every process here believes it has 3 GiB of addresses to itself, about twelve times more.
>
> **The Watchdog:** Lies. The kernel tells everyone lies.
>
> **init:** Useful ones. Each process gets its own map. The kernel decides which parts of each map are backed by real memory, and by which memory.

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
   to a physical page (a "frame"); three levels of tables on the Machine (32-bit
   with PAE), four or five on a 64-bit PC. One picture: two processes, both using
   the virtual address `0xbf9bb000` on their stacks, mapped to two different
   frames; the kernel's top gigabyte mapped the same in both. An access the page
   tables don't allow causes a **page fault**: the page has no mapping, or it has
   one that forbids this access (a write to a read-only page, a user-mode read of a
   kernel page). The kernel decides: fill it in, or end the process. P.5's `poke`
   was the second kind: the page at `0xc0000000` was mapped, supervisor-only (the
   CPU's error code 5: present, user mode).
3. **The whole Machine.** `cat /proc/meminfo`, then `free` (real output, one run;
   numbers move a little from moment to moment):

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

   `MemTotal` is about 218 of the 256 MiB: the firmware keeps part, the kernel's code
   and data take more (`dmesg`: `Memory: 220092K/245368K available (10068K kernel
   code, ...)`; the first number moves a little from boot to boot). `Cached` is the **page cache** (a **cache** is any copy kept close
   by to make the next use faster). BusyBox `free` takes totals from `sysinfo()` and
   `Cached` + `SReclaimable` from `/proc/meminfo` into `buff/cache`; `used` = total −
   free − buff/cache (223588 − 203128 − 3184 = 17276). Where the cache picture stops
   being true on the Machine: the 9p root (`cache=0x5`, mmap mode) hands each `read`
   to the host without keeping a copy, so `Cached` stays at a few MiB, mostly
   programs' mapped code. kswapd, on the drawing: "When memory runs short, I wake up
   and clear room. Slab Mines, 2.8."
4. **One process's map.** `cat /proc/self/maps` (`self` means whichever process is
   reading, here `cat`, which is BusyBox; real output):

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

   Each line is one region: its addresses (eight hex digits: 32 bits), what may be
   done there (`r` read, `w` write, `x` run as code, `p` private to this process),
   and what it holds: the program's code (`r-x`), its data (`rw-`), the **heap**
   (memory a program asks for while it runs) and the **stack** (local variables),
   just under `0xc0000000`. Between the heap and the stack: musl, shared by every
   program; the vdso (small kernel-provided functions, including the doorway for
   syscalls on this Machine); and long gaps. Run it again and every address moves:
   **ASLR**.

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
  - `/proc/meminfo` was read with its text visible in the trace: `free` reads it
    with `read()`; `cat` copies it with `sendfile64`, whose bytes the trace doesn't
    carry yet, so the objective names `free`.
- **Golden runs:** `solution` (`cat /proc/meminfo`, `free`, `./where`); `starter`
  (one address: rejected for `local-on-stack`, `prints-maps`, `reads-meminfo`).

### Watch it

**Predict:** "The global, and the local: which one lives on the stack?" The local:
`main`'s variables live on the stack, near the top of user space. The global lives
in the program's data region, near the bottom. Real output:

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

The memory floor of the Section drawing lights: RAM frames at the bottom, two
process maps above with arrows down to them, the page cache as a shelf of file
pages. Labels: the Slab Mines (2.8a–b), the Page-Table Labyrinth (3.3–3.5).

### Debrief

> **init:** Pages, page tables, a map for each of us, and a cache of files in whatever memory is left. The kernel keeps all of it straight.
>
> **init:** One floor left before you've seen it all: files, devices and wires, in Files, Doors and Wires. And one rule that ties them together.

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
    regions (`struct vm_area_struct`) and its page tables (three levels on 32-bit
    x86 with PAE, the Machine's: PGD, PMD, PTE; four on most x86-64 machines; five
    with LA57). A page fault on a user address goes through
    `do_user_addr_fault()` to `handle_mm_fault()`; one on a kernel address from
    user mode, like `poke`'s, is refused in `do_kern_addr_fault()`. The CPU's error
    code says which kind: bit 0 set means the page was present and the access
    forbidden. — `include/linux/mm_types.h`, `mm/memory.c`,
    `arch/x86/mm/fault.c`.
  - **Read:** https://docs.kernel.org/admin-guide/mm/concepts.html. Deepened by
    1.4 (memory after `fork`), 2.5 (separate address spaces) and the Page-Table
    Labyrinth (Act III).
- **Memory maps** (`proc-maps`)
  - **Simple:** `/proc/<pid>/maps` lists a process's memory regions: code, data,
    heap, stack, and what each one holds.
  - **Deep:** One line per `vm_area_struct`: start and end address, permissions,
    file offset, device, inode and path (or `[heap]`, `[stack]`, `[vdso]`). Linux
    randomizes where the program, stack, heap and libraries go (ASLR), on the
    Machine too. —
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
getconf PAGESIZE                      # 4096 on x86
```

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** 4 KiB pages; three-level PAE page tables; the MMU and page faults;
  the Machine's real `free`, `/proc/meminfo` and `/proc/<pid>/maps`; the 32-bit
  layout; ASLR; the page cache, `MemAvailable`, and the 9p root caching little;
  kswapd's role.
- **Simplified:** the drawing's frames and arrows are a picture; real page tables
  wait for Act III.

### Lab needs

None beyond the shared Machine. Engine: `sendfile64` data in the trace would let
`cat /proc/meminfo` meet `reads-meminfo` too.

---

## P.9 — Files, Doors and Wires

- **Id:** `prologue-machine-in-section-09-files-doors-wires` · **Region / NPC:** The Machine in Section, the files, devices and network floors / init; on the drawing: udev, the Harbormaster, the Tollkeeper · **Tracks:** `userland`, `kernel` · **Time:** ~25 min · **Prerequisites:** `drv-hardware-discovery`, `mem-virtual-memory-basics` · **Skills unlocked:** `io-everything-is-a-file`, `sys-kernel-subsystems`

### Scene

> **init:** The last floor, and the rule I promised. A file of settings. A number the kernel works out when you ask. A door to a driver. On Linux, you open all three the same way.
>
> **init:** That's the rule people quote: "everything is a file." It isn't quite everything. But it's close, and it's why one small `cat` can read half the Machine.

### See it (X-ray)

1. **One tree, many filesystems.** A **filesystem** is the way files and folders are
   laid out and found; several kinds are **mounted** (attached) into the one tree.
   `cat /proc/mounts` (real output):

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

   Eight mounts of seven kinds (`tmpfs` twice): **9p** at `/` (the Machine's files,
   from the game over the virtio share met in P.6, earlier the same night). None of
   the others is stored anywhere lasting: **procfs**, **sysfs** (P.6) and
   **tracefs** (the trace X-ray reads) make a file's contents when it is read;
   **devtmpfs** holds device nodes the kernel makes as drivers find devices,
   **devpts** the terminals' nodes, and **tmpfs** ordinary files kept in RAM. The ext4 filesystem on `/dev/sda1` is not mounted, so none of its
   files are in the tree: a filesystem joins the tree only when mounted.
2. **The VFS.** `cat` on three filesystems (real output); `cat` itself uses `open`
   and `sendfile64` (the kernel copies file to terminal without passing through
   `cat`'s memory). The read code differs underneath; the player watches it with
   `look` in Build it:

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
3. **Devices.** `ls -l /dev/null /dev/tty /dev/sda` (real output; BusyBox `ls`):

   ```
   crw-rw-rw-    1 root     root        1,   3 Oct 31 16:16 /dev/null
   brw-------    1 root     root        8,   0 Oct 31 16:16 /dev/sda
   crw-rw-rw-    1 root     root        5,   0 Oct 31 16:16 /dev/tty
   ```

   `c` is a **character device** (a stream of bytes, like a terminal), `b` a
   **block device** (storage read in fixed-size blocks, like a disk). The two
   numbers are the **major** (which driver: 8 is the SCSI disk driver, which also
   runs the IDE disk through libata) and **minor** (which device of that driver).
   `cat /dev/null` returns at once: the null driver always answers "end of file".
   The kernel made these nodes in devtmpfs; most systems run udev to set owners and
   names, the Machine runs none, so all stay root's and the disk is root-only.
4. **Networking, shown, not built.** `ls /sys/class/net` prints `eth0  lo` (`lo`,
   loopback, is a pretend network inside the Machine; `eth0` is the virtio card run
   by `virtio_net`, down, with no wire out of the browser yet).
   `cat /proc/net/dev` counts each one's bytes and **packets** (the small pieces data
   is sent in). The drawing shows one message's trip: a program's **socket** (a file
   descriptor for talking over a network) → **TCP** (keeps the bytes in order, resends
   lost ones) → **IP** (addresses each packet) → the netfilter gates → the network
   card's driver (`virtio_net`) → the wire. The Harbormaster: "I run the stack. Socket
   Harbor, 1.9." The Tollkeeper: "And I stand at the gates. Netfilter Wall, 2.11."
5. **Processes talking to each other** (one line): pipes, signals, shared memory and
   message queues. "The Aqueducts and the Alarm Bells, 1.7 and 1.8."
6. **The kernel's own log.** `dmesg` shows the boot from P.4 again, and the lines
   drivers wrote while taking their devices:

   ```
   [    0.000000] Linux version 6.18.63-0-virt (buildozer@build-3-24-x86) (cc (Alpine 15.2.0) 15.2.0, GNU ld (GNU Binutils) 2.45.1) #1-Alpine SMP PREEMPT_DYNAMIC 2026-11-11 03:02:54
   ...
   [    1.588336] scsi host0: ata_piix
   ...
   [    1.782304] ata1.00: ATA-0: v86 ATA HD, 1.00, max MWDMA2
   ```

   The kernel writes these with `printk()` into a ring buffer (a fixed-size log
   where the newest lines push out the oldest); BusyBox `dmesg` reads it with the
   `syslog` syscall. `kernel.dmesg_restrict` is 0 on the Machine, so uid 1000 may
   read it (many distributions set 1).
7. **What ties it together.** Every one of these went through the Syscall Gate:
   `open`, `read`, `write`. The Gatekeeper: "Every floor. Through me."

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
  - `./look` read successfully from files on the 9p root, procfs and sysfs (three
    runs; objectives `reads-9p`, `reads-procfs`, `reads-sysfs`), each read returning
    more than 0 bytes, each followed by a `write` on fd 1. The checker's mount table
    is tested against the Machine's `/proc/mounts` in `machine-facts.json`.
  - The three folder matches (drag-to-match, unjudged).
- **Golden runs:** `solution-9p`, `solution-procfs`, `solution-sysfs`; `dev-null`
  (the null driver answers end of file at once: rejected for all three reads).

### Watch it

**Predict:** before the `/sys` run: "Which filesystem will answer?" X-ray shows
`look`'s syscalls, the same three for each file; it does not show which
filesystem's code answered (nothing in the trace says so). init explains that part:
the VFS hands the `read` to `v9fs_file_read_iter()` for `/etc/motd` (9p asks the
game over the share), `proc_reg_read_iter()` for `/proc/uptime` (procfs works the
numbers out) and `kernfs_fop_read_iter()` for the card's address, which sysfs
formats from `dev_addr`, the address `virtio_net` stored in the card's
`struct net_device` at probe (`net/core/net-sysfs.c`). Real output; the emulator
picks the last three bytes at random:

```
$ ./look
00:22:15:76:df:a8
```

```
open("/sys/class/net/eth0/address", O_RDONLY|O_LARGEFILE) = 3
read(3, "00:22:15:76:df:a8\n", 256)      = 18
write(1, "00:22:15:76:df:a8\n", 18)       = 18
```

musl adds `O_LARGEFILE` on 32-bit (it lets a 32-bit program use files whose size
or offsets don't fit a 32-bit `off_t`, past 2 GiB) and uses `open`, not `openat`.

The whole Section drawing lights up once, floor by floor, then dims to show what is
still dark: everything but one lamp in Userland. init: "Every region on your map is
one of these parts. That's what we're rebuilding."

### Debrief

> **init:** You've seen every floor of the Machine. The kernel's parts, where they live in its source, and which street of the map will teach each one.
>
> **The Watchdog:** Pretty drawing. Now it's going to fall down again.
>
> **init:** What? Old dog, what did you do?
>
> **The Watchdog:** Nothing! Something in the boot entry. I can feel it. Next restart, we're stuck. You'll have to bring it up yourself.

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
    `read_iter` (or `read`). Each filesystem or driver supplies its own table:
    `v9fs_file_read_iter()`, `proc_reg_read_iter()`, `kernfs_fop_read_iter()`. —
    `fs/read_write.c` (`vfs_read()`), `include/linux/fs.h`
    (`struct file_operations`), `Documentation/filesystems/vfs.rst`.
  - **Read:** https://docs.kernel.org/filesystems/vfs.html. Try (on the Machine):
    `strace -e trace=open,sendfile64 cat /proc/uptime`. Deepened by 1.6 (file
    descriptors) and 2.5 (the Lantern's `file_operations`).
- **Filesystems and mounts** (`filesystems`, deepens: `files`)
  - **Simple:** Different filesystems (ext4 on a disk, 9p over a share, procfs,
    sysfs, devtmpfs, tmpfs) are attached into one tree; `/proc/mounts` lists them.
  - **Deep:** Each filesystem registers a `struct file_system_type`; mounting
    attaches its root at a directory. ext4 stores files on a block device; 9p asks
    a server over a transport (virtio on the Machine); tmpfs keeps files in memory;
    procfs, sysfs (built on kernfs) and devtmpfs make their contents in the kernel.
    A disk's filesystem is in the tree only once mounted. —
    `fs/namespace.c`, `fs/ext4/`, `fs/9p/`, `fs/proc/`, `fs/sysfs/`, `fs/kernfs/`,
    `drivers/base/devtmpfs.c`.
  - **Read:** man 5 `proc_mounts`, man 8 `mount`. Deepened by S.1 (procfs) and 2.7
    (procfs and sysfs files of your own).
- **Device files** (`device-files`, deepens: `drivers`)
  - **Simple:** Files in `/dev` are doors into drivers: `c` for character devices,
    `b` for block devices, with major and minor numbers.
  - **Deep:** A device node holds a `dev_t` (major, minor). Opening it finds the
    driver registered for that number (`cdev` for character devices), whose
    `file_operations` then serve every call. devtmpfs creates nodes as drivers
    register devices, owned by root; on most systems udev sets owners and names (the
    Machine runs none). Block major 8 is `sd`. — `fs/char_dev.c`,
    `drivers/char/mem.c` (`/dev/null`), `drivers/base/devtmpfs.c`, `drivers/scsi/sd.c`.
  - **Read:** man 4 `null`, man 7 `udev`. Deepened by 2.4 (`/dev/lantern`).
- **The network stack** (`network-stack`)
  - **Simple:** Programs talk through sockets; the kernel turns data into TCP or UDP
    segments, IP packets and frames for the network card.
  - **Deep:** A socket is a file descriptor; under it, `net/ipv4/tcp*.c` and
    `net/ipv4/ip_output.c` build packets as `struct sk_buff`, netfilter hooks
    inspect them, and the driver's `ndo_start_xmit()` sends them. Interfaces show
    in `/sys/class/net`, counters in `/proc/net/dev`. — `net/socket.c`,
    `net/ipv4/`, `net/netfilter/`, `drivers/net/virtio_net.c` (the Machine's card).
  - **Read:** man 7 `socket`, man 7 `tcp`. Deepened by 1.9 (sockets) and 2.11
    (netfilter).
- **printk and dmesg** (`printk-dmesg`)
  - **Simple:** The kernel's own log: messages from boot and from drivers, read with
    `dmesg`.
  - **Deep:** `printk()` (and `pr_info()`, `dev_info()`…) writes into a ring buffer
    with a log level; util-linux `dmesg` reads it from `/dev/kmsg`, BusyBox's with
    `syslog()` (klogctl). Many distributions set `kernel.dmesg_restrict` to 1 so only
    root may read it; the Machine leaves it 0. — `kernel/printk/printk.c`,
    `include/linux/printk.h`.
  - **Read:** man 1 `dmesg`. Try: `dmesg | tail -n 20` (no `sudo` on the Machine,
    and none needed there). Deepened by 2.2 (your own `pr_info()`).
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
sudo dmesg | tail -n 20                   # the newest kernel messages (sudo where only root may read them)
strace cat /proc/uptime                   # every call cat makes
```

On a 64-bit glibc system `strace` shows `openat` where the Machine's musl uses
`open`, and GNU `cat` copies with `read` and `write` (or `copy_file_range`) where
BusyBox's uses `sendfile64`. Browse the source tree at https://elixir.bootlin.com/linux/v6.18/source and
open `mm/`, `fs/` and `net/`.

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** the Machine's real `/proc/mounts`; the VFS function names for 9p,
  procfs and sysfs reads, as init names them; sysfs's `address` printing the
  `dev_addr` `virtio_net` stored at probe; `/dev` modes and numbers as devtmpfs makes them with no
  udev; `/sys/class/net` with `eth0` (`virtio_net`) and `lo`; `/proc/net/dev`;
  `cat`'s `open` + `sendfile64` and `look`'s `open`/`read`/`write` with
  `O_LARGEFILE`; `printk`'s ring buffer read by BusyBox `dmesg` with `syslog()`; the
  source tree layout.
- **Simplified:** X-ray shows `look`'s syscalls, not which filesystem answered them:
  the routing under the VFS is init's explanation, not something the trace shows;
  the network trip is a drawing (packets are built in 1.9); `eth0` has no network
  behind it.

### Lab needs

None beyond the shared Machine. Possible engine help: a `lab.mounts` field (or a
mount in the setup) would let `look` read a file on the ext4 disk, `/dev/sda1`,
and bring back an ext4 objective.

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
> **init:** You know every floor now. Bring it up. All the way up: the root, the network card, the memory. Then show me one command going all the way down to a driver and back.

### See it (X-ray)

**Status: built and recorded on the real Machine.** `lab.boot.args` writes a broken
entry into `grub.cfg`: the Machine's own line plus `root=/dev/sda3
module_blacklist=virtio_net mem=64M`. Every output below is copied from a real run.

The level opens on GRUB's menu. Enter boots the broken entry, which gets this far:

```
Loading Linux virt ...
Loading initial ramdisk ...
mount: mounting /dev/sda3 on /newroot failed: No such file or directory
Mounting root /dev/sda3 failed.
initramfs emergency recovery shell launched. Type 'exit' to try again.
sh: can't access tty; job control turned off
~ #
```

The kernel, its initcalls and the initramfs all worked; the initramfs's `/init`
couldn't mount the root named by `root=`, so it opened BusyBox `sh` as root before
init could start. Nothing is traced until the Machine is up (no tracefs, no bash),
so X-ray's boot view shows only the boot that succeeds.

### Build it

Four steps, in order. Command chips offer only the commands' names and one-line
explanations (no arguments): the player chooses what to look at and types it.

1. **Read the stop**, in the emergency shell (`uid=0`): `cat /proc/cmdline` shows the
   three words; `ls /dev` shows `sda` and `sda1`, no `sda3`; `free` shows
   `Mem: 45524` KiB in total. The root is the virtio share `host9p` (P.9's
   `/proc/mounts`), which `/init` mounts when there's no `root=`; `mem=64M` caps the
   RAM; `module_blacklist=virtio_net` will make the kernel refuse the card's driver
   when the start-up script loads it from the root.
2. **Back to GRUB:** `reboot -f` (`-f`: straight to the kernel; there's no init to
   ask) prints `reboot: Restarting system`. GRUB's own command line, `c` then `ls`,
   lists `(hd0) (hd0,msdos1) (fd0) (fd1)`.
3. **Fix the entry, all of it:** `e`, delete the three words, Ctrl-X. All in one
   edit: once bash runs the player is `you`, and `reboot` answers
   `reboot: : Operation not permitted`. With only `root=` fixed, the boot screen
   shows `modprobe: can't load module virtio_net
   (kernel/drivers/net/virtio_net.ko.gz): Operation not permitted`, `free` says
   45524 and `ls /sys/class/net` shows only `lo`. Then the player checks:
   `cat /proc/cmdline`; `free` (`Mem: 240008` after a GRUB boot);
   `ls /sys/class/net` (`eth0  lo`); `readlink /sys/class/net/eth0/device/driver`
   (`../../../../bus/virtio/drivers/virtio_net`); BusyBox `ps` (`/sbin/init` as
   PID 1, `[kthreadd]`).
4. **One command, end to end.** Raising a link needs root (as `you`:
   `ip: ioctl 0x8914 failed: Operation not permitted`), so the level's `runAs` cue
   has init run `ip link set eth0 up` as root once `card-bound` is met. Then
   `cat /sys/class/net/eth0/operstate` prints `up` (v86's virtio card reports a
   link, `carrier` 1, with nothing behind it).

- **Checker verifies (behavior):**
  - `root-found` (declared): `cat` read `/proc/cmdline` to the end without
    `root=/dev/sda3`; only a boot that mounted its root reaches bash.
  - `card-bound` (checker.ts): a `readlink` of `…/eth0/device/driver` succeeded (only
    `virtio_net` makes an `eth0`; the trace keeps the path, not always the target).
  - `full-memory` (checker.ts): `MemTotal` from `/proc/meminfo` or `free` above
    200 MiB.
  - `processes-listed` (checker.ts): BusyBox `ps` listed `/sbin/init` as PID 1 and
    `[kthreadd]`.
  - `operstate-up` (declared): `cat` read `operstate` to the end: `up`.
- **Golden runs:** `solution` (rescue shell, `reboot -f`, the full edit, the checks,
  init's `ip link set eth0 up`); `root-only` (only `root=` removed: `card-bound`,
  `full-memory` and `operstate-up` stay missing).

### Watch it

**Predict:** "Which floors of the Section does that one small read pass through?"
X-ray replays the run: bash `fork`s; the copy `execve`s `cat`; the scheduler runs
it; `open` walks the path through the VFS to sysfs; `sendfile64` copies the file to
the terminal while sysfs reports the card's state; the terminal's driver shows the
three bytes; `cat` calls `exit_group` and bash's `wait4` returns. (Wanted: the
order-the-path card game; until then the Predict is a question, and costs nothing.)

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

1. Nudge: "The Machine stopped before init could start. What did its last lines
   name, and what does `cat /proc/cmdline` say the kernel was told?"
2. Concept: "`root=` names the root filesystem: the Machine's is the share
   `host9p`, which its initramfs mounts when there's no `root=` at all.
   `module_blacklist=` makes the kernel refuse a module, and `mem=` makes it use
   only that much RAM. Once bash runs you're not root and can't restart, so fix the
   whole line in one edit."
3. Point at the spot: "Type `reboot -f` in the emergency shell. At GRUB, press `e`,
   go to the end of the `linux` line, delete `root=/dev/sda3
   module_blacklist=virtio_net mem=64M`, then press Ctrl-X."

### Codex (chapter: The Machine in Section)

- **The life of a command** (`command-lifecycle`)
  - **Simple:** A command travels from the shell through the kernel's parts to a
    driver and back: new process, program loaded, path walked, data read, text
    written, exit, prompt.
  - **Deep:** `fork()` (`clone()` with glibc) → `kernel_clone()`; `execve()` →
    `do_execveat_common()`; the scheduler runs the new task; `open()` (`openat()`
    with glibc) → `path_openat()`; `read()` → `vfs_read()` → the filesystem (for a
    disk file on ext4, the page cache, and on a miss the block layer and the disk
    driver; for sysfs, `kernfs_fop_read_iter()` and a driver's attribute); BusyBox
    `cat` copies with `sendfile64()` → `do_splice_direct()`; `write()` →
    `tty_write()`; `exit_group()` → `do_exit()`, `SIGCHLD` to the parent; `wait4()`
    → `do_wait()`. — `fs/splice.c`,
    `kernel/fork.c`, `fs/exec.c`, `fs/namei.c`, `fs/read_write.c`,
    `fs/kernfs/file.c`, `net/core/net-sysfs.c`, `drivers/tty/tty_io.c`,
    `kernel/exit.c`.
  - **Read:** man 2 `execve`, man 2 `wait4`. Deepened by 1.B (the syscall path)
    and 2.5 (a `read()` into your own driver).
- **root=, module_blacklist= and mem=** (`boot-parameters-that-break`)
  - **Simple:** Three boot settings: where the root filesystem is, which modules
    the kernel must refuse, and how much RAM it may use.
  - **Deep:** `root=` is read by the initramfs's `/init` (or, with no initramfs, by
    the kernel in `prepare_namespace()`). `module_blacklist=` is checked before a
    module loads (`blacklisted()`, early in `load_module()`): the load fails with
    `EPERM`. `mem=` caps the RAM the kernel uses (on x86, `parse_memopt()` trims the
    firmware's memory map). — `init/do_mounts.c`, `kernel/module/main.c`,
    `arch/x86/kernel/e820.c`, `Documentation/admin-guide/kernel-parameters.txt`.

### Real-world card

```sh
cat /proc/cmdline                          # what your kernel was told
grep ' / ' /proc/mounts                    # where your root really is
lspci -k | grep -A3 -i ethernet            # is your network card's driver in use?
strace -f -e trace=fork,clone,execve,open,openat,read,write,sendfile64,wait4 sh -c 'cat /sys/class/net/lo/operstate; true'
```

`; true` keeps `sh` from exec'ing `cat` in place, so the fork shows. On a test
virtual machine: at GRUB, press `e`, add `mem=512M` for one boot, and compare `free`
before and after; to make it last, edit `GRUB_CMDLINE_LINUX` and run
`grub-mkconfig -o /boot/grub/grub.cfg` (`update-grub` on Debian and Ubuntu).

### Taint

No Taint rules are live in the Prologue.

### Fidelity

- **Faithful:** GRUB 2.14's menu, editor and command line (`(hd0) (hd0,msdos1)`);
  one-boot edits; `module_blacklist=` making the kernel refuse `virtio_net` (EPERM);
  `mem=64M` leaving 45524 kB; `reboot` and `ip link set` needing root; `operstate`
  going from `down` to `up`; the order of syscalls in the route.
- **Simplified:** the initramfs `/init` is a short script written for the game,
  modelled on Alpine's, with its own messages (Debian's and Ubuntu's prompt is
  `(initramfs)`). The start-up script loads `virtio_net` with `modprobe`; on most
  systems udev does it from the card's `modalias`. init raises `eth0` through the
  game's control channel; a real system's network manager or `ifup` does it at boot.
  `eth0` has no network behind it.

### Lab needs

Done: `lab.boot`, the emergency shell, `reboot -f` back to GRUB, `runAs` as root.
Wanted: a Watchdog restart from the level UI (`useMachineReboot()`), so a player who
boots with only part of the line fixed isn't stuck as `you` until the level is set
up again; the boot view of a boot that stopped in the initramfs (no report reaches
the page without kf-control); the order-the-path Predict.
