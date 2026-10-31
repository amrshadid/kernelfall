# Act II: The Deep (level specs)

Level-by-level design specs for Act II, the Dangling finale and the Mainline
epilogue. The story, characters and systems come from [GAME.md](../GAME.md); the
rules every level follows come from [LEVELS.md](../LEVELS.md).

Kernel APIs move between versions. This file follows **Linux 6.18** (LTS). API
names, source paths and report formats were checked against the v6.18 source on
2026-10-29. Sample output is abridged: addresses, offsets and some frames differ
between machines. Anything still marked **(verify)** could not be confirmed from
upstream sources. Golden-output tests remain the final check before a level ships.

Numbering: levels `2.1` to `2.11`, with the Slab Mines split into `2.8a` and `2.8b`,
the Lock Cathedral boss `2.9b`, the Interrupt Spire split into `2.10a`, `2.10b` and
`2.10c`, the finale `2.12` and the epilogue `2.13`. After the epilogue comes the
optional transfer task T2.

## Learning outcome

> **"I can write, debug and explain a simple Linux character driver."**

By the end of Act II the player has written one driver, the Lantern, from an empty
file to a module with a character device, `read`/`write`, `ioctl`, procfs and sysfs
files, reference-counted memory, correct locking, a timer, an interrupt handler with
a spinlock, a workqueue, a blocking read on a wait queue and a netfilter hook with an
atomic counter. They have read an oops, a kmemleak report, a KASAN report, lockdep
and hung-task reports, fixed a real use-after-free, and written the fix up as an
upstream-style patch.

## Act I's projects in the Deep

The Deep is one continuous loop with Userland, not a new game. The whole path and
every callback are in [LEVELS.md](../LEVELS.md#4-the-journey).

- **`ksh-lite` is the terminal.** The player arrives as root with their own shell.
  Every in-game command in this act runs in it (prompt `ksh$`, no `sudo`, since the
  player is uid 0). Checkers drive the Lantern through it too: `echo hi >
  /dev/lantern` uses the player's 1.6 redirection, `cat /dev/lantern` their 1.4
  `fork`/`exec`, `dmesg | tail` their 1.7 pipes, and Ctrl-C their 1.8 handler. If a
  check fails because of the shell rather than the driver, the checker says so and
  offers the reference `ksh-lite` for that run. `ksh-lite` splits words on spaces
  only, so in-game commands use no quotes, `;`, `&&` or loops; real-world cards use
  bash.
- **Act I's tools return.** `strace` (1.5, and the Gatekeeper's tool at 1.B) traces
  the player's own driver from user space (2.5, 2.6); `lanternctl` and
  `lantern-stress` build with the player's 1.3 `Makefile` habits; `harbor` (1.9,
  1.10) is the traffic the Netfilter Wall counts (2.11).
- **Starter code fades again**, starting one notch lower than Act I: partial
  (2.1–2.2), stub (2.3–2.6, and 2.8a–2.8b for the new memory model), blank
  from 2.7 on. A starter file that is the bug itself (2.9b's salvaged patch) is content, not
  scaffolding.
- **Every level ends with a Debrief:** a short closing beat that gives a story
  reason to walk on to the next level. The chain runs from 1.B's staircase into the
  Forge (2.1) to the reboot after Mainline (2.13).

## Story arc

The Syscall Gate (end of Act I) opens downward. The player's process now runs as
root, and init has started a fresh `ksh-lite` for them; the stray `pstore:` line
from the Gate's trace came from below. The player goes down into **the Deep**. It is
dark: none of its lamps have burned since the Kernelfall.

init and the Watchdog stay above and speak through the Gate. In-world, their lines
are log lines the player reads in `dmesg`, the way any program's lines appear there
when it writes to `/dev/kmsg`. In scenes their lines come through the Gate unless
the scene says otherwise. The player never speaks; they act.

**What the Deep holds.** Nothing in the Deep lived through the reboot: a reboot
starts every process and every kernel object from scratch. Two things survived.
**pstore** kept the end of the kernel log from the night of the Kernelfall (the
`pstore:` line at the Gate), and the Deep's archives hold the **old Lantern
driver's source**. The Dangling is the bug pattern in that source: a fade timer
that kept a raw pointer to a message after the message was freed, and read and
wrote through it. It is not a creature waiting below. It is a mistake any driver
can make again, including the player's.

**The Lantern grows, the Deep lights up.** Each level adds one piece to the Lantern,
and each piece lights one more part of the Deep:

| Level    | The Lantern gains          | What lights up                                                        |
| -------- | -------------------------- | --------------------------------------------------------------------- |
| 2.1      | (a kernel to run in)       | The Forge's furnace. The boot banner shows the player's kernel name   |
| 2.2      | it loads and says hello    | The first lamp on the Module Docks                                    |
| 2.3      | settings                   | The lamp's colour and brightness follow the player's parameters       |
| 2.4      | `/dev/lantern`             | A door with the Lantern's number appears in the Device Quarter        |
| 2.5      | read and write             | Messages written to the Lantern appear on the Quarter's street signs  |
| 2.6      | brightness control         | A dial: the whole Quarter dims and brightens with `ioctl`             |
| 2.7      | status pages               | Signposts (`/proc`, `/sys`) light up so anyone can read the Lantern   |
| 2.8a     | messages of any size       | Mine carts light up in the Slab Mines, one per message                |
| 2.8b     | readers keep their message | Each cart stays lit until its last rider leaves                       |
| 2.9      | many users at once         | The Cathedral's bells ring in order instead of all at once            |
| 2.9b     | a message history          | The Cathedral's great doors open                                      |
| 2.10a    | blinking                   | The Interrupt Spire's beacon blinks                                   |
| 2.10b    | a light sensor             | The city dims itself at "dawn"                                        |
| 2.10c    | a sensor to wait on        | The night watch sleeps until the light changes, then wakes            |
| 2.11     | a packet gate              | The Netfilter Wall glows with every packet from the player's chat app |
| Finale   | messages that fade         | The last dark corner lights up; the Dangling's pattern is removed     |
| Mainline | —                          | The Machine reboots clean (or not, depending on Taint)                |

**Foreshadowing the Dangling.** The Dangling is never a riddle. It shows up as real
kernel evidence the player learns to read, a little more clearly each time, and
every clue is about the past:

- **Prologue:** the boot replay ends on one burnt frame of the crash log, kept in
  pstore, with the word `fade` in it. The Watchdog says "Not now."
- **1.B:** a `pstore:` line on the console that no process in the trace wrote.
- **2.1:** the Forge's boot log explains it: the kernel registered a pstore backend
  and found a record from before the reboot. Its last line is readable:
  `Kernel panic - not syncing: Fatal exception in interrupt`. The Watchdog keeps the
  rest closed: "Not until you can read it."
- **2.5:** after the "crash on purpose" step, init remarks that the Kernelfall's
  oops looked "a lot like this one, except it happened in a timer, and nobody was
  calling it."
- **2.8a:** X-ray's memory view shows freed slab objects filled with the poison byte
  `0x6b` (SLUB's free poison, with slab poisoning on). kswapd: "The night it all
  went dark, the carts looked like that. Something kept reading the empty ones."
- **2.9b:** the Deadlock Twins: "Don't blame us for the Kernelfall. We only ever
  froze things. Whatever brought the Machine down read from the empty carts."
- **2.10a:** ksoftirqd: the last callback he ran that night was a fade timer whose
  message was already gone.
- **Finale:** the Watchdog opens the whole record: a general protection fault at
  `0x6b6b6b6b6b6b6b6b` in `lantern_fade_fn`, in a timer softirq, then the panic. The
  old source shows why. The poison says "freed"; KASAN says who freed it. The
  player's Lantern is about to grow the same feature.

## Skill tree (Act II)

Skill ids, names and prerequisites come from
[CURRICULUM.md section 2](../CURRICULUM.md#2-skills), which wins
if the two ever disagree. The player ends Act I with root (uid 0, so
`CAP_SYS_MODULE`), granted at the Syscall Gate, and with the `harbor` chat server
from Act I listening on TCP port 7777.

| Level | Skill ids                                                                        |
| ----- | -------------------------------------------------------------------------------- |
| 2.1   | `kdev-config-build`, `kdev-read-source`, `kdev-abi-vs-api`                       |
| 2.2   | `drv-kernel-env`, `drv-module-lifecycle`, `dbg-printk-dmesg`, `dbg-oops-reading` |
| 2.3   | `drv-module-params`                                                              |
| 2.4   | `drv-chardev-register`, `drv-error-unwinding`                                    |
| 2.5   | `mem-address-spaces`, `mem-user-copy`, `drv-fops`, `drv-read-path`               |
| 2.6   | `drv-ioctl`                                                                      |
| 2.7   | `drv-sysfs-procfs`                                                               |
| 2.8a  | `mem-kmalloc`, `mem-leak-kmemleak`                                               |
| 2.8b  | `mem-object-lifetime`, `c-container-of`, `dbg-kasan`                             |
| 2.9   | `sync-race-diagnosis`, `sync-mutex`, `dbg-lockdep`                               |
| 2.9b  | `sync-deadlock-lockdep` (and assesses `dbg-lockdep`, `sync-mutex`)               |
| 2.10a | `irq-timers`, `sync-atomic-context`                                              |
| 2.10b | `irq-handlers`, `sync-spinlocks`, `irq-deferred-work`                            |
| 2.10c | `irq-wait-queues`                                                                |
| 2.11  | `sync-atomics`, `net-netfilter-hook`                                             |
| 2.12  | `mem-uaf-fix` (and assesses `dbg-kasan`, `mem-object-lifetime`, `irq-timers`)    |
| 2.13  | `kdev-coding-style`, `kdev-patch`, `kdev-dev-process`                            |

New in this act's tree: `dbg-lockdep` (2.9), `sync-spinlocks` (2.10b) and
`mem-uaf-fix` (2.12). `c-container-of` is taught here (2.8b), not in Act I, and
`dbg-kasan` moved from the finale to 2.8b, so both bosses only assess.

## Codex chapters

The Codex has one chapter per region ([GAME.md](../GAME.md#the-codex)). Act II fills
nine. Each level below lists its cards in teaching order, each with a **Simple**
line (plain words) and a **Deep** text (kernel functions, structs, source files,
docs), and an optional **Read** line. A card marked `deepens: <id>` adds to an
earlier card's chain instead of starting a new one. Card ids are unique across the
game.

| Chapter         | Levels    | Guide / real Linux                            | Cards, in teaching order                                                                                                                                                                      |
| --------------- | --------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The Forge       | 2.1       | the Compiler Smith / Kconfig, kbuild          | `kconfig`, `kbuild`, `kernel-source`, `debug-kernel`, `stable-abi`, `pstore`                                                                                                                  |
| Module Docks    | 2.2–2.3   | the Dockmaster / the module loader            | `loadable-module`, `kernel-env`, `printk`, `oops`, `taint-flags`; `module-param`                                                                                                              |
| Device Quarter  | 2.4–2.7   | udev / char devices and the VFS               | `char-device`, `goto-unwinding`, `devtmpfs-udev`; `file-operations`, `user-kernel-split`, `smap`, `copy-to-user`, `driver-read-contract`, `read-path`; `ioctl`; `seq-file`, `sysfs-attribute` |
| Slab Mines      | 2.8a–2.8b | kswapd / the slab allocator and reclaim       | `kmalloc`, `gfp-flags`, `kmemleak`, `flexible-array`; `kasan`, `private-data`, `kref`, `container-of`                                                                                         |
| Lock Cathedral  | 2.9–2.9b  | the Verger / locking and lockdep              | `race-condition`, `mutex`, `lockdep`, `hung-task`; `git-basics`, `abba-deadlock`, `circular-dependency`                                                                                       |
| Interrupt Spire | 2.10a–c   | ksoftirqd / timers, interrupts, deferred work | `kernel-timer`, `softirq`, `atomic-context`, `timer-shutdown`; `interrupt-handler`, `spinlock`, `workqueue`; `wait-queue`, `erestartsys`                                                      |
| Netfilter Wall  | 2.11      | the Tollkeeper / netfilter                    | `netfilter-hook`, `atomic-counter`, `sk-buff`                                                                                                                                                 |
| The Dangling    | 2.12      | the whole Deep / use-after-free               | `use-after-free`, `stop-before-free`, `pstore-ramoops`                                                                                                                                        |
| Mainline        | 2.13      | the Maintainer / the upstream process         | `submitting-patches`, `checkpatch`, `coding-style`, `signed-off-by`, `mainline-process`                                                                                                       |

Chains that cross levels: `kernel-source` deepens `kernel-source-tree` (P.9);
`loadable-module` deepens `monolithic-kernel` (P.5); `printk` deepens
`printk-dmesg` (P.9); `char-device` deepens `device-files` (P.9); `taint-flags`
deepens the Prologue's `taint-meter` (P.2);
`file-operations` deepens `everything-is-a-file` (1.6, itself deepening 1.2's
`ops-table`); `user-kernel-split` deepens `address-space` (1.4); `copy-to-user`
deepens the Prologue's `write-syscall`; `driver-read-contract` deepens
`read-contract` (1.6); `read-path` deepens `syscall-path` (1.B); `ioctl` deepens
`bit-flags` (1.6); `seq-file` deepens `proc-pid` (1.5); `kasan` deepens `asan`
(1.3); `race-condition` deepens `interleaving` (1.8); `circular-dependency` deepens
`lockdep` (2.9); `timer-shutdown` deepens `kernel-timer` (2.10a); `wait-queue`
deepens `pipe` (1.7); `erestartsys` deepens `eintr` (1.8); `netfilter-hook` deepens
`packet-path` (1.9); `use-after-free` deepens `dangling-pointer` (1.1);
`stop-before-free` deepens `kref` (2.8b); `pstore-ramoops` deepens `pstore` (2.1);
`submitting-patches` deepens `git-basics` (2.9b).

**You can now…** lines close each chapter, from CURRICULUM.md's outcomes for the
chapter's skills.

## Boss designs

Both bosses follow the level loop and teach no new mechanism: every tool and report
they use was met in an earlier level. The player still builds and watches; the
"fight" is seeing a real bug happen in code they didn't write, reading the report
they already know, and building the fix. Nothing is hidden: the bug is reproduced on
demand by the lab's deterministic scheduler.

### The Deadlock Twins (2.9b)

- **Who they are:** two threads, **Ab** and **Ba** (named after the ABBA
  deadlock). Ab always takes lock A then lock B. Ba takes B then A. Each one
  ends up holding the lock the other needs, forever.
- **How they arrive:** init finds a salvaged patch from before the Kernelfall that
  gives the Lantern a message history. The player reads it and applies it with
  `git am` (the short git beat that opens the level; git is tooling, not a kernel
  mechanism). It works in single-user tests. Under load, the Cathedral freezes.
- **Phase 1, the freeze:** two processes hang. The one waiting in the patch's plain
  `mutex_lock()` sleeps in `D` state; a waiter in `mutex_lock_interruptible()`
  sleeps in `S`. The hung-task detector reports only `D` (both met in 2.9). X-ray's
  locks view draws the wait-for cycle. After (compressed) time, the hung-task
  warning prints. The lab restores the snapshot.
- **Phase 2, the witness:** with lockdep on (2.1, read in 2.9), even a single run of
  each path, one after the other with no deadlock, makes lockdep print "possible
  circular locking dependency detected". The Verger's rule from 2.9 ("I write down
  every order I see") is the whole explanation: lockdep proves the bug from lock
  order alone, before it ever hangs.
- **Phase 3, the fix:** the player picks and documents one lock order and makes
  every path follow it. The Twins line up and walk through the doors one at a time.

### The Dangling (2.12)

- **What it is:** the bug pattern that caused the Kernelfall. The old Lantern faded
  old messages with one timer in the device, which kept a raw `struct lantern_msg *`
  to the message it was dimming. When a write evicted that message from the
  history, its last reference was dropped and it was freed, but the timer still
  held the pointer. The next tick, in softirq context, read and wrote through it.
- **Phase 1, the record:** the Watchdog opens the full pstore record: a general
  protection fault at `0x6b6b6b6b6b6b6b6b` in `lantern_fade_fn`, in a timer softirq,
  then `Kernel panic - not syncing: Fatal exception in interrupt`. The poison bytes
  say "freed memory" (2.8a); they don't say who freed it or why the timer still had
  the address. That kernel had no KASAN.
- **Phase 2, the build:** the player adds the fade feature to their own Lantern
  (timers from 2.10a, kref from 2.8b, the history from 2.9b), following the old
  driver's design. The lab replays the night of the Kernelfall. A first version
  that drops the evicted message while the fader can still reach it is caught by
  KASAN at the exact bad read in `lantern_fade_fn` (the report format from 2.8b),
  with the "Allocated by" and "Freed by" stacks. A player whose first version is
  already safe corners the Dangling at once, then reproduces it on purpose in a
  scratch copy so they still read the report.
- **Phase 3, the fix:** the fader's pointer must never outlive a reference: stop
  the timer with `timer_delete_sync()` before the evicted message is dropped, or
  give the fader its own reference. Module exit shuts the timer down for good with
  `timer_shutdown_sync()` (2.10a). KASAN stays quiet across the replay, kmemleak is
  clean, the Deep is fully lit.

## Taint endings

Total Taint at the end of Act II picks one of three endings ([GAME.md](../GAME.md#taint-meter)).
The thresholds and the per-level cap are implemented in `@kernelfall/game`. Severity
points per rule:

| Severity | Points | Examples                                                                                     |
| -------- | ------ | -------------------------------------------------------------------------------------------- |
| Minor    | 1      | compiler warning, `checkpatch.pl` warning, wrong but harmless errno, noisy `printk`          |
| Moderate | 3      | leak found by kmemleak, missing error-path cleanup, ignored return value, missing unregister |
| Severe   | 5      | KASAN, lockdep or "sleeping in atomic" report during the checker run; code that oopses later |

Rules:

1. Only the **latest completion** of a level is scored. Oopses, crashes and failed
   attempts while experimenting never add Taint (pillar 6).
2. A level's Taint is capped at 10, and replaying a level replaces its score with
   the new one, so Taint can always be paid back.
3. Hints never add Taint (they only lower the level's score). "Continue with the
   reference version" gives the level zero Taint and zero score, still unlocks its
   skills and Codex cards, and marks it **completed with help** on the Kernel Map
   until replayed (LEVELS.md rule 12).
4. Act I Taint is shown but does not count toward the Act II ending.

| Act II total | Ending                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------- |
| 0–9          | **Clean reboot:** the Dangling's pattern is gone from the Machine for good                |
| 10–29        | **Unstable reboot:** the Machine runs, but the lights flicker                             |
| 30+          | **The Dangling survives:** the pattern lives on in the Machine as Act III begins below it |

Every ending leads into Act III: the reboot after Mainline is the one on which the
Lantern card answers on the PCI bus ([act-3-the-core.md](act-3-the-core.md#story-arc)).
Act III has its own Taint total and its own tinted final scene. Act I Taint is shown
but picks no ending.

Extra rule: if the **finale** fix itself is a hack (for example it leaks the message
so it is never freed, or adds a delay), the ending can be at best "unstable",
whatever the total. You can't hide the Dangling, only remove it.

The Codex also shows the **real** kernel taint flags next to the meter (for
example `O` for an out-of-tree module, `B` after a KASAN report). They are related
ideas, not the same number, and the card says so.

---

## 2.1 — The Forge: build your own kernel

- **Region / NPC:** The Forge / the Compiler Smith (cameo from Act I), init, the Watchdog · **Tracks:** `kernel`, `debug` · **Time:** ~15 min · **Prerequisites:** `c-build-warnings`, `sys-boot-chain`, `sys-syscall-path` · **Skills unlocked:** `kdev-config-build`, `kdev-read-source`, `kdev-abi-vs-api`

### Scene

The staircase from the Gate ends at a cold furnace. The player's `ksh$` prompt
blinks; init started this `ksh-lite` for them, as root.

> **init** (through the Gate): You're in. That shell is yours, running as root. The
> `pstore:` line in the Gatekeeper's trace was printed down there. Follow it.
>
> **The Compiler Smith:** Followed you down, didn't I? This is the Forge. Every
> kernel is built here, from a `.config` file. Thousands of switches. And the
> build? Work orders, like your shell's `Makefile`. Just a few thousand of them.
>
> **The Watchdog** (through the Gate): The kernel running down there is a generic
> one. Blind.
>
> **The Compiler Smith:** Then we give it eyes. Three, today. KASAN sees bad memory
> access. lockdep sees bad lock order. kmemleak sees memory nobody frees.
>
> **The Watchdog:** And they slow everything down.
>
> **The Compiler Smith:** A little. That's why you turn them on for testing, not for
> everyone. Name your kernel, too. You'll want to know it's yours.
>
> **init:** If the Machine had had those eyes on the night of the Kernelfall…
> never mind. Build.

### See it (X-ray)

**Kconfig view (unlocked here):** the player toggles
`CONFIG_KASAN` in a small menu and X-ray shows the dependency graph light up:
`KASAN` depends on `HAVE_ARCH_KASAN` (plus compiler support) and on `!SLUB_TINY`;
turning on `PROVE_LOCKING` _selects_ `LOCKDEP` and friends. Then a time-lapse of
`make`: the `.config` turns into `include/generated/autoconf.h`
(`#define CONFIG_KASAN 1`), `.c` files become `.o` files, which are linked into
`vmlinux` and packed into `bzImage`.

### Build it

The player writes a **config fragment**, `lantern.config`, and builds a kernel:

```
CONFIG_LOCALVERSION="-lantern"
CONFIG_IKCONFIG=y
CONFIG_IKCONFIG_PROC=y
CONFIG_MODULES=y
CONFIG_MODULE_UNLOAD=y
CONFIG_DEBUG_INFO_DWARF_TOOLCHAIN_DEFAULT=y
CONFIG_KASAN=y
CONFIG_KASAN_GENERIC=y
CONFIG_PROVE_LOCKING=y
CONFIG_DEBUG_ATOMIC_SLEEP=y
CONFIG_DEBUG_KMEMLEAK=y
CONFIG_DETECT_HUNG_TASK=y
CONFIG_PSTORE=y
CONFIG_PSTORE_RAM=y
```

(All of these symbols exist in 6.18; the debug-info choice was renamed in earlier
versions, so older guides may show a different name. The last two keep pstore's
RAM backend, so the new kernel can still read the record the old one left.)

Starter (partial): a kernel source tree (simulated), `make defconfig` already run. The
player runs `scripts/kconfig/merge_config.sh .config lantern.config` (or
`scripts/config -e KASAN …` then `make olddefconfig`), then `make -j4`, then boots.

**Source dive (the first one):** before building, the Smith asks where `KASAN` is
defined. The player finds it with `git grep -n "config KASAN$"` (or the in-game
source browser) in `lib/Kconfig.kasan` and reads its `depends on` lines.

Checker verifies (behavior):
- The booted kernel's `uname -r` ends with `-lantern`.
- `zcat /proc/config.gz` shows `CONFIG_KASAN=y`, `CONFIG_PROVE_LOCKING=y`,
  `CONFIG_LOCKDEP=y` (pulled in by `select`), `CONFIG_DEBUG_KMEMLEAK=y`,
  `CONFIG_MODULES=y`, `CONFIG_MODULE_UNLOAD=y`, `CONFIG_PSTORE_RAM=y`.
- The boot log shows that KASAN and lockdep initialised.
- `/sys/kernel/debug/kmemleak` exists (after `mount -t debugfs none /sys/kernel/debug`).

### Watch it

The furnace roars and the Forge lights up. The boot log scrolls past with the
player's kernel name, and the line from the Gate is there too:

```
[    0.000000] Linux version 6.18.0-lantern (you@forge) (gcc ...) #1 SMP PREEMPT_DYNAMIC ...
[    0.000000] KernelAddressSanitizer initialized (generic)
[    0.123456] Lock dependency validator: Copyright (c) 2006 Red Hat, Inc., Ingo Molnar
[    1.402311] pstore: Registered ramoops as persistent store backend
ksh$ ls /sys/fs/pstore
dmesg-ramoops-0
ksh$ tail -1 /sys/fs/pstore/dmesg-ramoops-0
<0>[ 8812.402113] Kernel panic - not syncing: Fatal exception in interrupt
```

(Message text as in 6.18; timestamps and the order of lines depend on the config.)
The `pstore:` line was the kernel itself, at boot, so no process wrote it: that is
why the Gatekeeper's trace had no matching `write`. The record is the tail of the
log from before the reboot. The rest of it is "burnt"; the Watchdog: "Not until you
can read it."

### Debrief

> **The Compiler Smith:** That kernel's yours now. Eyes and all. But a kernel nobody
> adds to is a furnace with nothing in it.
>
> _A bell rings across the water._
>
> **The Dockmaster:** Cargo! Anyone got cargo? The Docks have been empty since the
> Kernelfall.

Next: the Module Docks (2.2).

### Hints

1. **Nudge:** You don't need to edit `.config` by hand. Write only the lines you
   want to change, then let the build tools fill in the rest.
2. **Concept:** Kconfig options have dependencies. `depends on` means "only
   visible if…"; `select` means "turning me on forces that on too". `make
   olddefconfig` resolves them and drops options whose dependencies aren't met.
3. **Point at the spot:** Check what actually ended up in the config: `grep KASAN
   .config`. If it's missing, look at `lib/Kconfig.kasan` to see what it depends on.

### Codex (chapter: The Forge)

- **Kconfig** (`kconfig`)
  - **Simple:** The kernel's settings: thousands of on/off switches, saved in `.config`.
  - **Deep:** Every option is a `config` entry with a type, help text, `depends on`
    and `select`. `.config` becomes `CONFIG_*` macros that C code tests with
    `#ifdef` or `IS_ENABLED()`. —
    https://docs.kernel.org/kbuild/kconfig-language.html — `scripts/kconfig/`,
    `scripts/kconfig/merge_config.sh`, `scripts/config`
- **kbuild** (`kbuild`)
  - **Simple:** The kernel's build system: Makefiles that list what to build.
  - **Deep:** Each directory's Makefile adds objects to `obj-y` (built in) or
    `obj-m` (built as a module); the top-level `Makefile` links `vmlinux`. —
    https://docs.kernel.org/kbuild/makefiles.html — `Makefile`,
    `scripts/Makefile.build`
- **Reading the kernel source** (`kernel-source`, deepens: `kernel-source-tree`)
  - **Simple:** One huge tree; find any definition with `git grep` or Elixir.
  - **Deep:** `kernel/`, `mm/`, `fs/`, `drivers/`, `net/`, `arch/`, `include/`;
    `Documentation/` is the source of docs.kernel.org. `git grep -n` and
    https://elixir.bootlin.com/linux/v6.18/source find definitions and callers. —
    https://docs.kernel.org/ — `Documentation/`, `MAINTAINERS`
- **Debug kernels** (`debug-kernel`)
  - **Simple:** Checkers built into the kernel, for testing, not for everyone.
  - **Deep:** KASAN (bad memory access), lockdep (lock rules) and kmemleak (leaks)
    cost speed and memory, so distributions ship without them and developers test
    with them. — https://docs.kernel.org/dev-tools/kasan.html,
    https://docs.kernel.org/locking/lockdep-design.html,
    https://docs.kernel.org/dev-tools/kmemleak.html — `lib/Kconfig.kasan`,
    `lib/Kconfig.debug`
- **Stable ABI, moving API** (`stable-abi`)
  - **Simple:** Programs never break on a new kernel; kernel code often does.
  - **Deep:** The syscall interface to user space never breaks ("we don't break user
    space"), so your Act I shell runs here unchanged. Functions _inside_ the kernel
    change freely between versions, which is why the Codex follows one pinned
    version. — https://docs.kernel.org/process/stable-api-nonsense.html —
    `Documentation/process/stable-api-nonsense.rst`
- **pstore** (`pstore`)
  - **Simple:** A small box that keeps the end of the kernel log across a reboot.
  - **Deep:** On an oops or panic, `kmsg_dump()` hands the log's tail to a pstore
    backend (ramoops: a reserved RAM region that survives a warm reboot;
    efi-pstore: firmware variables). After boot the records are files in
    `/sys/fs/pstore/`. — https://docs.kernel.org/admin-guide/ramoops.html —
    `fs/pstore/`, `kernel/printk/printk.c` (`kmsg_dump()`)

### Real-world card

Use a VM or a spare machine; you'll boot a kernel you built.

```sh
git clone --depth 1 --branch linux-6.18.y https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git
cd linux
make defconfig
scripts/config --set-str LOCALVERSION "-lantern" -e IKCONFIG -e IKCONFIG_PROC \
  -e KASAN -e PROVE_LOCKING -e DEBUG_KMEMLEAK -e DEBUG_ATOMIC_SLEEP
make olddefconfig
grep -E 'KASAN|LOCKDEP|KMEMLEAK' .config
make -j"$(nproc)"
```

The easiest way to boot it is `virtme-ng` (`vng`), which boots the tree you just
built inside QEMU: run `vng` in the source directory, then `uname -r` and
`zcat /proc/config.gz | grep KASAN` (check `vng --help` for current flags). Or use
plain QEMU: `qemu-system-x86_64 -kernel arch/x86/boot/bzImage -append
"console=ttyS0" -nographic` with an initramfs. On your own machine,
`ls /sys/fs/pstore` shows any crash records the firmware or ramoops kept.

### Taint

- Building with **every** debug option on "just in case" (for example
  `CONFIG_KASAN` plus `CONFIG_KCSAN`, which conflict, or turning on
  `CONFIG_PANIC_ON_OOPS` so every experiment reboots): +1, because it makes the
  lab slow and noisy and hides which tool caught what.
- Editing generated files (`include/generated/autoconf.h`) instead of `.config`:
  +3, it is overwritten on the next build and teaches the wrong model.

### Fidelity

**Faithful:** option names, `depends on`/`select` behavior for the options used,
`.config` format, `merge_config.sh`/`scripts/config`/`olddefconfig` behavior,
`/proc/config.gz`, `uname -r` with `LOCALVERSION`, the pstore registration line and
`/sys/fs/pstore/` record names.
**Simplified:** compilation is simulated and takes seconds; only the Kconfig
symbols the game uses are modelled; no real `vmlinux` is produced. SIMPLIFIED: the
lab's ramoops region is set up for you (real ramoops needs a reserved memory region
from the kernel command line or device tree), and the story withholds the rest of
the record until the finale; a real record is readable in full.

---

## 2.2 — Module Docks: hello from the Deep

- **Region / NPC:** Module Docks / the Dockmaster (the module loader), init · **Tracks:** `kernel`, `debug` · **Time:** ~20 min · **Prerequisites:** `kdev-config-build`, `c-structs-fnptrs`, `sys-errno` · **Skills unlocked:** `drv-kernel-env`, `drv-module-lifecycle`, `dbg-printk-dmesg`, `dbg-oops-reading`

### Scene

> **The Dockmaster:** New ship? Every module docks here. You hand me a `.ko`, I load
> it into the kernel, and I call its init function. When it leaves, I call its exit.
> No `main()`.
>
> **The Dockmaster:** No `printf` either. Down here you talk with `printk`, and
> folks read you in `dmesg`.
>
> **The Watchdog:** And no libc. Nothing from user space runs down there.
>
> **The Dockmaster:** And show me a licence. Ships without a GPL-compatible one get
> flagged, and they can't use half the cargo (symbols exported as GPL-only).
>
> **init:** Make it say hello. I want to hear it from up here.

### See it (X-ray)

**Modules and devices view (unlocked here):** the Dockmaster loads a sample
module. X-ray follows `insmod` → the `finit_module` syscall → the kernel checks the
caller may load modules (`CAP_SYS_MODULE`, which the player got with root at the
Syscall Gate), checks the module, resolves its symbols, runs `hello_init()`, and
adds it to the module list. `lsmod` shows it. `rmmod` → `delete_module` →
`hello_exit()` → gone. A replay of the same `insmod` as uid 1000 stops at the first
check: `Operation not permitted` (`EPERM`), the "you may not do this at all" answer
from S.2, not the `EACCES` of a locked file.

### Build it

**Beat 1: the module.** The player writes `lantern.c`:
- `// SPDX-License-Identifier: GPL-2.0` first line, `#define pr_fmt(fmt) KBUILD_MODNAME ": " fmt`.
- `static int __init lantern_init(void)` that logs a greeting with `pr_info()` and
  returns `0`; `static void __exit lantern_exit(void)` that logs goodbye.
- `module_init()`, `module_exit()`, `MODULE_LICENSE("GPL")`, `MODULE_AUTHOR()`,
  `MODULE_DESCRIPTION()`.

Starter (partial): a one-line `Kbuild` (`obj-m += lantern.o`) and a `Makefile`
calling `make -C /lib/modules/$(uname -r)/build M=$(PWD) modules`, the same `make`
the player wrote rules for in 1.3; `lantern.c` itself starts empty.

Checker verifies:
- `make` builds `lantern.ko` with no warnings.
- `insmod lantern.ko` succeeds; `lsmod` lists `lantern`; `dmesg` has exactly one new
  line with the `lantern: ` prefix at `KERN_INFO` level.
- `rmmod lantern` succeeds and logs a goodbye line; the module is gone from `lsmod`.
- Load/unload three times in a row works.
- `modinfo lantern.ko` shows `license: GPL` and a description.

**Beat 2: crash on purpose, then read it (guided, ~5 min).** Only after Beat 1
passes. init asks for one bad line in a scratch copy: `*(int *)NULL = 1;` in
`lantern_init()`. Loading it oopses. The Oops panel opens with "That was the goal";
the snapshot restores, and the real `lantern.c` was never touched. The scratch
copy's `Kbuild` adds `KASAN_SANITIZE := n`, so this first oops is the plain page
fault below: the player learns to read a plain oops first, and KASAN gets its own
entrance in 2.8b. (With KASAN instrumentation on, the inline shadow check faults
first: `Oops: general protection fault, probably for non-canonical address
0xdffffc0000000000` plus `KASAN: null-ptr-deref in range [...]`. Same bug, a
different first line.)

Then the panel walks the oops **one line at a time**. Each step highlights a line,
init says what that kind of line means, and the player clicks the part that
answers the question (abridged; exact lines vary by CPU and config):

```
BUG: kernel NULL pointer dereference, address: 0000000000000000
#PF: supervisor write access in kernel mode
#PF: error_code(0x0002) - not-present page
Oops: Oops: 0002 [#1] SMP KASAN NOPTI
CPU: 0 UID: 0 PID: 287 Comm: insmod Tainted: G           O        6.18.0-lantern #1 PREEMPT(voluntary)
Tainted: [O]=OOT_MODULE
RIP: 0010:lantern_init+0x15/0xff0 [lantern]
Call Trace:
 do_one_initcall+0x...
 do_init_module+0x...
 __x64_sys_finit_module+0x...
 do_syscall_64+0x...
```

1. **What went wrong?** The first line: a NULL pointer dereference, at address 0.
2. **Read or write, and by whom?** `#PF: supervisor write access in kernel mode`:
   kernel code wrote. The error code says nothing was mapped there.
3. **How many so far?** `[#1]`: the first oops since boot. Later oopses can be
   fallout from the first; always read `#1`.
4. **Who was running?** `Comm: insmod`, PID 287: the task inside `finit_module`.
   `Tainted:` lists the kernel's taint flags (`O`: an out-of-tree module).
5. **Where exactly?** `RIP: lantern_init+0x15/0xff0 [lantern]`: 0x15 bytes into a
   function 0xff0 bytes long, in module `lantern`. The player clicks the matching
   line in the editor; X-ray maps the offset to the line through debug info.
6. **How did it get there?** The call trace, read bottom-up: the syscall,
   `finit_module`, `do_init_module()`, `do_one_initcall()`, then `lantern_init()`.

After the oops the kernel stays up: the faulting task is killed and the kernel is
tainted `D`.

### Watch it

**Predict:** a module's init function returns `-ENOMEM`. Does `lsmod` list it
afterwards? (No: a failing init refuses the load, and `insmod` reports the error.)

A lamp on the Docks flickers on. The player sees:

```
ksh$ insmod lantern.ko
ksh$ dmesg | tail -2
[  301.442190] lantern: loading out-of-tree module taints kernel.
[  301.443012] lantern: the Lantern is lit. Hello from the Deep.
ksh$ lsmod | grep lantern
lantern                12288  0
```

The real kernel flags out-of-tree modules with taint flag `O`. The Codex explains
it, and the game does **not** add game Taint for it.

### Debrief

> **The Dockmaster:** One lamp lit. Same dull white as every other lamp on these
> Docks, mind.
>
> **init:** The city will want to choose its own light. Can a module take settings
> when it's loaded?
>
> **The Dockmaster:** Funny you should ask.

Next: settings (2.3).

### Hints

1. **Nudge:** A module is a library the kernel loads, not a program. What does the
   kernel need to find in it?
2. **Concept:** `module_init()` names the function to run at load, `module_exit()`
   the one to run at unload. Kernel functions return `0` on success or a negative
   errno (`-ENOMEM`, `-EINVAL`) on failure. An init function that returns an error
   refuses the load, and `insmod` reports it.
3. **Point at the spot:** Look at `lantern_init()`'s return statement and at the
   `MODULE_LICENSE()` line near the end of the file.

### Codex (chapter: Module Docks)

- **Loadable module** (`loadable-module`, deepens: `monolithic-kernel`)
  - **Simple:** Kernel code you can load and unload while the machine runs.
  - **Deep:** A `.ko` file loaded by `finit_module`. Init runs once at load; if it
    fails, the module is not loaded. `__init` code is freed after init. —
    https://docs.kernel.org/kbuild/modules.html — `kernel/module/main.c` (before
    5.19: `kernel/module.c`), `include/linux/module.h`
- **Life inside the kernel** (`kernel-env`)
  - **Simple:** No libc, no `printf`, a tiny stack, and a bug can stop everything.
  - **Deep:** No floating point, a small fixed stack (16 KiB on x86-64, 32 KiB with
    KASAN), errors as negative errno, and a bug can take down the whole machine. —
    https://docs.kernel.org/kernel-hacking/hacking.html —
    `include/uapi/asm-generic/errno-base.h`, `include/linux/errno.h`
- **printk and dmesg** (`printk`, deepens: `printk-dmesg`)
  - **Simple:** The kernel's `printf`: lines go to a log that `dmesg` reads.
  - **Deep:** `printk()` writes to the ring buffer with a log level; `pr_info()`,
    `pr_err()` and friends are shortcuts, and `pr_fmt` adds a prefix to all of
    them. — https://docs.kernel.org/core-api/printk-basics.html —
    `kernel/printk/printk.c`, `include/linux/printk.h`
- **Reading an oops** (`oops`)
  - **Simple:** The kernel's crash report: what went wrong, where, and how it got there.
  - **Deep:** First line: the fault. `#PF` lines: read or write, kernel or user.
    `[#1]`: the count. `RIP`: function+offset/length [module]. Call trace:
    bottom-up path. `Tainted:` flags. After an oops the task is killed and the
    kernel is tainted `D`. — https://docs.kernel.org/admin-guide/bug-hunting.html —
    `arch/x86/mm/fault.c`, `arch/x86/kernel/dumpstack.c`
- **Game Taint vs kernel taint flags** (`taint-flags`, deepens: `taint-meter`)
  - **Simple:** The game's Taint scores your code; the kernel's taint flags are real.
  - **Deep:** Kernel **taint flags** are letters in every oops (`O` out-of-tree
    module, `P` proprietary module, `W` a warning fired, `D` an oops happened, `B`
    bad page or a KASAN report; `G` means no proprietary module) that tell bug
    readers "this kernel ran something unusual". Loading your module sets `O` and
    adds zero game Taint. A module without a GPL-compatible licence can't use
    GPL-only symbols and sets `P`; with no `MODULE_LICENSE()` at all, the build
    fails (`modpost` reports "missing MODULE_LICENSE()"). —
    https://docs.kernel.org/admin-guide/tainted-kernels.html — `kernel/panic.c`,
    `scripts/mod/modpost.c`

### Real-world card

Use a VM: a buggy module can crash the machine.

```sh
sudo apt install build-essential linux-headers-$(uname -r)   # Debian/Ubuntu
make
sudo insmod lantern.ko
sudo dmesg | tail
lsmod | grep lantern
modinfo lantern.ko
sudo rmmod lantern
cat /proc/sys/kernel/tainted
```

If `insmod` fails with "Key was rejected by service", Secure Boot is blocking
unsigned modules; use a VM without Secure Boot or sign the module.

### Taint

- No `MODULE_LICENSE()` or a non-GPL one: +3 (real kernel taint `P`, no GPL-only symbols).
- Init function that can fail but always returns `0`: +3.
- Using `printk()` without a log level, or no `pr_fmt` prefix: +1 (logs nobody can filter).
- Compiler warnings: +1 each kind.

### Fidelity

**Faithful:** `module_init`/`module_exit`, `__init`/`__exit`, return value rules,
`printk` levels and `dmesg` timestamp format, `insmod`/`rmmod`/`lsmod`/`modinfo`
output shape, the out-of-tree taint message, the oops format.
**Simplified:** no ELF relocation or real symbol resolution; module sizes in
`lsmod` are plausible values, not computed; no module signing.

---

## 2.3 — Module Docks: settings

- **Region / NPC:** Module Docks / the Dockmaster, init · **Tracks:** `kernel` · **Time:** ~12 min · **Prerequisites:** `drv-module-lifecycle` · **Skills unlocked:** `drv-module-params`

### Scene

> **The Dockmaster:** Every lamp on the Docks burns the same dull white. Boring.
>
> **init:** Can the Lantern be told its colour when it's loaded?
>
> **The Dockmaster:** Module parameters. `insmod lantern.ko brightness=200`. I set
> the variable before your init runs.
>
> **init:** And check them. A sailor once loaded a lamp with brightness nine thousand.
>
> **The Dockmaster:** We don't talk about that sailor.
>
> **The Watchdog:** Bad input at load time is your problem, not mine. Refuse it.

### See it (X-ray)

**Modules and devices view:** X-ray shows `insmod lantern.ko brightness=200
colour=amber` parsing the arguments, writing them into the module's variables, and
creating `/sys/module/lantern/parameters/brightness` before `lantern_init()` runs.
Then `modinfo` reads the descriptions straight out of the `.ko` file.

### Build it

Starter (stub): the player's `lantern.c` from 2.2, with the two `MODULE_PARM_DESC()`
texts written as comments. The player adds:
- `static unsigned int brightness = 128;` with `module_param(brightness, uint, 0444)`
  (`0444` is S.2's `r--r--r--`: everyone may read the parameter's sysfs file, nobody
  may write it) and `MODULE_PARM_DESC()`.
- `static char *colour = "white";` with `module_param(colour, charp, 0444)`.
- A range check in `lantern_init()`: brightness above 255 makes init return `-EINVAL`
  with a `pr_err()` that says why.

Checker verifies:
- `insmod lantern.ko` with no arguments logs the defaults.
- `insmod lantern.ko brightness=200 colour=amber` logs those values;
  `cat /sys/module/lantern/parameters/brightness` prints `200`.
- `insmod lantern.ko brightness=999` fails with `Invalid argument` (EINVAL), and the
  module is not in `lsmod`.
- `modinfo` lists both parameters with descriptions and types.

### Watch it

The Docks' lamp turns amber and gets brighter.

```
ksh$ modinfo -F parm lantern.ko
brightness:Initial brightness, 0-255 (uint)
colour:Light colour (charp)
ksh$ insmod lantern.ko brightness=999
insmod: ERROR: could not insert module lantern.ko: Invalid parameters
ksh$ echo $?
1
ksh$ dmesg | tail -1
[  412.007310] lantern: brightness 999 is out of range (0-255)
```

(kmod's `insmod` has its own wording for a few errors: `EINVAL` prints "Invalid
parameters", even when it came from your init function. Other errors print
`strerror(errno)`.)

### Debrief

> **udev** (from the Device Quarter, across the water): Pretty lamp. Shame nobody in
> the city can reach it. No door, no visitors.
>
> **init:** In Userland everything was a file. Down here, a driver has to ask for
> its door.

Next: the Device Quarter (2.4).

### Hints

1. **Nudge:** The Dockmaster sets your variables before `lantern_init()` runs.
   Where is the first place you can look at them?
2. **Concept:** `module_param(name, type, perm)`: `perm` is the file mode of
   `/sys/module/<mod>/parameters/<name>`. `0` means no sysfs file; `0444` read-only;
   the kernel rejects world-writable modes at compile time.
3. **Point at the spot:** In `lantern_init()`, before the greeting: test
   `brightness` and return a negative errno if it's too big.

### Codex (chapter: Module Docks)

- **Module parameters** (`module-param`)
  - **Simple:** Settings you pass to a module when you load it.
  - **Deep:** Set on the `insmod`/`modprobe` command line (or the kernel command
    line for built-in code, as `lantern.brightness=200`), visible in
    `/sys/module/<name>/parameters/`. Types include `bool`, `int`, `uint`, `charp`;
    `module_param_cb()` validates runtime writes. —
    https://docs.kernel.org/admin-guide/kernel-parameters.html —
    `include/linux/moduleparam.h`, `kernel/params.c`

### Real-world card

```sh
sudo insmod lantern.ko brightness=200 colour=amber
cat /sys/module/lantern/parameters/brightness
modinfo -F parm lantern.ko
sudo rmmod lantern
sudo insmod lantern.ko brightness=999; echo $?
# Compare a real driver's parameters:
modinfo -F parm snd_hda_intel | head
ls /sys/module/snd_hda_intel/parameters/
```

### Taint

- Writable parameter (`0644`) with no handling for changes at runtime: +1. The
  variable can change under the driver's feet; real drivers use
  `module_param_cb()` to validate writes, or keep it read-only.
- Accepting an out-of-range value, or clamping silently without a log line: +3.
- Missing `MODULE_PARM_DESC()`: +1.

### Fidelity

**Faithful:** `module_param` types and permissions, `/sys/module/.../parameters`,
`modinfo` output, init failure stops the load.
**Simplified:** `modprobe` and `/etc/modprobe.d` options are not modelled; the
world-writable check is reported as a compile error with the real macro name.

---

## 2.4 — Device Quarter: `/dev/lantern`

- **Region / NPC:** Device Quarter / udev (the device manager that makes `/dev` nodes), init · **Tracks:** `kernel` · **Time:** ~18 min · **Prerequisites:** `drv-module-lifecycle`, `io-fd-table`, `io-permissions`, `sys-errno` · **Skills unlocked:** `drv-chardev-register`, `drv-error-unwinding`

### Scene

> **udev:** Welcome to the Device Quarter. Every door here is a file in `/dev`.
>
> **init:** "Everything is a file," we said in the Archive. The Lantern isn't one yet.
>
> **udev:** Not yet. First the kernel gives you a number: a major for your driver,
> a minor for each device. Then I put a door with that number in `/dev`.
>
> **init:** When a process opens that door, the kernel looks up the number and
> knocks on your driver.
>
> **udev:** And when you leave, take your door with you. Doors that lead nowhere
> are bad for business.

### See it (X-ray)

**Modules and devices view:** `ls -l /dev/null` shows `c 1, 3`. X-ray follows
`open("/dev/null")`: the inode's device number `1:3` → the char device table →
the `mem` driver's `file_operations`. Then the same for `/dev/lantern` once it
exists, showing `cdev_add()` putting the Lantern into that table.

Then init teaches the kernel's way to clean up: **`goto` unwinding**. Registering
the Lantern takes four steps, and any of them can fail. Each step that succeeds gets
a label at the bottom of the function that undoes it; a failure jumps to the label
that undoes everything done so far, in reverse order, and returns the negative
errno.

### Build it

**Source dive:** before filling in its first field, the player opens
`include/linux/fs.h`, finds `struct file_operations`, and compares it with the
command table from 1.2: the same shape, a struct of function pointers. Today only
`.owner` is set; 2.5 fills `.read` and `.write`.

Starter (stub): the player's `lantern.c` from 2.3 and empty `err_*` labels at the
bottom of `lantern_init()`. The player adds to `lantern_init()` (with `goto`
unwinding in reverse order):
- `alloc_chrdev_region(&lantern_devt, 0, 1, "lantern")` for a dynamic major.
- `cdev_init()` with a `file_operations` that has only `.owner = THIS_MODULE` for
  now, then `cdev_add()`.
- `class_create("lantern")` and `device_create(..., "lantern")` so udev/devtmpfs
  makes `/dev/lantern`. In 6.18, `class_create()` takes only the name (its `owner`
  argument went away in 6.4). Both return an error pointer on failure, not `NULL`:
  check with `IS_ERR()` and get the errno with `PTR_ERR()`.
- In `lantern_exit()`: `device_destroy()`, `class_destroy()`, `cdev_del()`,
  `unregister_chrdev_region()`.

Checker verifies:
- After `insmod`, `/proc/devices` lists `lantern` under "Character devices" with
  some major M; `/dev/lantern` is a character device with major M, minor 0.
- `open("/dev/lantern", O_RDONLY)` succeeds; `read()` on it fails with `EINVAL`
  (no read method yet).
- The node is `crw-------` and owned by root: opened by a process running as uid
  1000, it fails with `EACCES`, the same permission check as `/etc/shadow` in S.2.
- After `rmmod`, `/dev/lantern` and the `/proc/devices` entry are gone.
- Load/unload three times works with no warnings in `dmesg`.
- Fault injection, once per step: when `alloc_chrdev_region()`, `cdev_add()`,
  `class_create()` or `device_create()` fails, `insmod` fails with that step's
  errno and nothing is left registered (no `/proc/devices` entry, no class, no
  leak).

### Watch it

A door with the Lantern's number appears in the Quarter.

```
ksh$ grep lantern /proc/devices
239 lantern
ksh$ ls -l /dev/lantern
crw------- 1 root root 239, 0 Jan  1 00:05 /dev/lantern
```

The major (here 239) is chosen by the kernel and may differ. The `c` reads like
`/dev/mem` in S.2: a door into a driver. `rw-------` is stricter than its
`rw-r-----`: only root can pass. Your door, this time.

### Debrief

> **udev:** Door's up. Go on, knock.
>
> ```
> ksh$ cat /dev/lantern
> cat: /dev/lantern: Invalid argument
> ```
>
> **init:** A door with nothing behind it. And the street signs out there are blank.
> Let people write to the Lantern, and read it back.

Next: read and write (2.5).

### Hints

1. **Nudge:** Two things must exist for `open()` to work: a number the kernel
   knows, and a file in `/dev` with that number.
2. **Concept:** `alloc_chrdev_region()` reserves numbers, `cdev_add()` connects
   them to your `file_operations` (the device is live from that moment), and
   `device_create()` tells udev to make the node.
3. **Point at the spot:** Read your error labels at the bottom of `lantern_init()`
   from bottom to top: they must undo exactly what succeeded, in reverse order.

### Codex (chapter: Device Quarter)

- **Character device** (`char-device`, deepens: `device-files`)
  - **Simple:** A device you read and write as a stream of bytes, found by a number.
  - **Deep:** Named by a major and minor number; the kernel maps the number to a
    `struct cdev` and its `file_operations`. For one simple device,
    `misc_register()` does all of this in one call; the Lantern does it by hand so
    you see each step. — https://docs.kernel.org/core-api/kernel-api.html#char-devices,
    https://docs.kernel.org/admin-guide/devices.html — `fs/char_dev.c`,
    `include/linux/cdev.h`, `drivers/base/core.c` (`device_create()`),
    `drivers/char/misc.c`
- **Error unwinding with `goto`** (`goto-unwinding`)
  - **Simple:** On failure, undo what you did, in reverse order, then return the error.
  - **Deep:** Acquire in order, release in reverse: each step gets a label that
    undoes it, and a failure jumps to the label for everything already acquired.
    One exit path, no duplicated cleanup. —
    https://docs.kernel.org/process/coding-style.html ("Centralized exiting of
    functions") — `Documentation/process/coding-style.rst`
- **devtmpfs and udev** (`devtmpfs-udev`)
  - **Simple:** The kernel makes the `/dev` file; udev dresses it up.
  - **Deep:** The kernel creates the node in devtmpfs; udev (a userspace daemon)
    applies names, permissions and symlinks from its rules. — man 7 `udev` —
    `drivers/base/devtmpfs.c`, `drivers/base/class.c` (`class_create()`)

### Real-world card

```sh
sudo insmod lantern.ko
grep lantern /proc/devices
ls -l /dev/lantern
cat /dev/lantern          # without sudo: Permission denied (crw------- root root)
udevadm info /dev/lantern
ls /sys/class/lantern/
sudo rmmod lantern
ls -l /dev/null /dev/tty /dev/sda 2>/dev/null   # compare majors and minors
```

### Taint

- Hard-coded major with `register_chrdev(240, ...)`: +3, can collide with another driver.
- Missing `device_destroy()`, `class_destroy()` or `unregister_chrdev_region()` in
  exit: +3. A leftover class makes the next `insmod` warn
  `sysfs: cannot create duplicate filename '/class/lantern'`.
- Error path that leaks earlier registrations: +3.
- `cdev_add()` before the driver's data is ready: +1 (the device is live immediately).

### Fidelity

**Faithful:** major/minor numbers, dynamic allocation, `/proc/devices` format,
`ls -l` device output, `EINVAL` when there's no read method, registration order
and unwinding.
**Simplified:** udev is a built-in helper that only creates and removes nodes
(no rules); the dynamic major is deterministic in the lab.

---

## 2.5 — Device Quarter: read and write

- **Region / NPC:** Device Quarter / udev, init · **Tracks:** `kernel`, `debug` · **Time:** ~20 min · **Prerequisites:** `drv-chardev-register`, `proc-lifecycle`, `io-read-contract`, `sys-syscall-path`, `dbg-oops-reading` · **Skills unlocked:** `mem-address-spaces`, `mem-user-copy`, `drv-fops`, `drv-read-path`

This level is about one thing: crossing the user/kernel boundary in a driver's
`read` and `write`. The device's state stays in one global; per-open state
(`file->private_data`) and `container_of` wait for 2.8b, where shared messages need
them.

### Scene

> **init:** The street signs are blank. If people could _write_ to the Lantern, the
> signs could show their messages.
>
> **udev:** Your `write` gets a pointer to the user's bytes. Every newcomer just
> `memcpy`s from it. Try it. Go on. The lab saves your work first.
>
> _The player loads the provided `memcpy` version and writes to it._
>
> **The Watchdog:** …and there it goes.
>
> **init:** That pointer belongs to the process, not to you. It might be unmapped;
> it might be a lie. The kernel has special doors for that: `copy_from_user` and
> `copy_to_user`.
>
> **init:** The Kernelfall's oops looked a lot like this one. Except it happened in
> a timer, and nobody was calling it.

### See it (X-ray)

**Syscalls + Modules and devices views:** `echo hi > /dev/lantern`, typed in the
player's own `ksh-lite`: their 1.6 code opens the node and `dup2`s it onto fd 1,
then `echo` calls `write()` → `vfs_write()` → `lantern_write()`. This is the other
side of the `cat` the player traced in S.1 and the read contract from 1.6: now the
kernel's half is theirs to write. X-ray shows two address spaces side by side, as
in 1.4 after `fork` (same address, different memory): the user buffer lives in the
process's half, the Lantern's buffer in the kernel's half.

**Crash on purpose:** the provided `memcpy` version from the Scene. The lab shows
the real oops (SMAP blocks the kernel from touching user memory directly), X-ray
points at the faulting line, and the snapshot restores. As in 2.2, the scratch copy
is built with `KASAN_SANITIZE := n`: on an instrumented build, KASAN's checked
`memcpy` sees the user address first, prints
`BUG: KASAN: user-memory-access in lantern_write` and skips the copy, so there is
no SMAP oops at all. Here the lesson is the plain oops and SMAP.

### Build it

Starter (stub): the player's `lantern.c` from 2.4 with empty `lantern_read()` and
`lantern_write()` signatures (the `__user` marks included). The device's state goes
in one global, `static struct lantern_dev ldev`: the `struct cdev` from 2.4, a
64-byte message buffer and its length. Then `.read` and `.write`:
- `lantern_write()`: reject `count > sizeof(ldev.msg)` with `-EINVAL`;
  `copy_from_user()`; if it doesn't copy everything, return `-EFAULT`; store the
  length; return `count`.
- `lantern_read()`: return bytes from `*ppos` up to the length, advance `*ppos`,
  return `0` at the end (EOF). `copy_to_user()` failure returns `-EFAULT`.
  (`simple_read_from_buffer()` is allowed and mentioned in the Codex.)

`*ppos` is the file position the VFS keeps in each open file (`struct file`'s
`f_pos`), so every `open()` starts reading at 0.

Checker verifies (driving the device through the player's `ksh-lite`):
- `echo hello > /dev/lantern`, then `cat /dev/lantern`, prints `hello`.
- Reading one byte at a time (`dd bs=1`) returns the full message, then EOF.
- A second `cat` from a new `open()` starts at the beginning again.
- A test program passing an invalid pointer to `read()` and `write()` gets
  `EFAULT`, and the kernel does not oops.
- Writing 65 bytes fails with `EINVAL`; the old message is unchanged.

### Watch it

**Predict:** two processes each call `write()` on `/dev/lantern` with `buf` at the
same address, `0x7ffc3a1e2b10`, one holding `dawn` and one `dusk`. What does
`copy_from_user()` copy each time? X-ray shows both address spaces: the same
address, different memory, and `copy_from_user()` reads through the address space
of the process that made the call.

**Order the path:** the player drags the steps of `cat /dev/lantern` into order:
libc `read()`, the `syscall` instruction, the syscall table, `ksys_read()`,
`vfs_read()`, `lantern_read()`, `copy_to_user()`, return to user mode. X-ray replays
it: the same Gate from the Prologue and the Syscall Gate, now ending in the
player's own code.

The street signs light up with the message. Then the player traces their own
driver from user space with the Gatekeeper's tool (1.B): the second `read`
returning 0 is their EOF.

```
ksh$ echo the Deep is waking up > /dev/lantern
ksh$ cat /dev/lantern
the Deep is waking up
ksh$ strace -e trace=read cat /dev/lantern
read(3, "the Deep is waking up\n", 262144) = 22
read(3, "", 262144)                     = 0
```

(The 262144-byte request is coreutils `cat`'s 256 KiB buffer, coreutils 9.5 and
later; older versions ask for 131072. Real `strace` also shows the dynamic
loader's `read` of libc first.)

The crash-on-purpose oops (abridged; the copy routine in `RIP` depends on the CPU,
and this needs a CPU with SMAP):

```
BUG: unable to handle page fault for address: 00007ffc3a1e2b10
#PF: supervisor read access in kernel mode
#PF: error_code(0x0001) - permissions violation
Oops: Oops: 0001 [#1] SMP KASAN NOPTI
RIP: 0010:memcpy_orig+0x...
Call Trace:
 lantern_write+0x.../0x... [lantern]
 vfs_write+0x...
 ksys_write+0x...
 do_syscall_64+0x...
```

### Debrief

> **udev:** Messages on every sign. Now the lamplighters want to turn the whole
> Quarter up and down, without writing a word on anybody's sign.

Next: brightness control (2.6).

### Hints

1. **Nudge:** Who owns the memory behind `buf`? Look at the `__user` in the signature.
2. **Concept:** `copy_to_user()`/`copy_from_user()` return the number of bytes they
   **could not** copy. `0` means success; anything else means return `-EFAULT`.
   `read()` must return `0` to say "end of file", or `cat` never stops.
3. **Point at the spot:** In `lantern_read()`, compare `*ppos` with the message
   length before copying, and update `*ppos` after.

### Codex (chapter: Device Quarter)

- **file_operations** (`file-operations`, deepens: `everything-is-a-file`)
  - **Simple:** The driver's ops table: the functions the kernel calls on your file.
  - **Deep:** `open`, `read`, `write`, `release`, `unlocked_ioctl`… The VFS finds
    the table through the inode's device number and calls it for every syscall on
    the file: the same pattern as your Act I command table. —
    https://docs.kernel.org/filesystems/vfs.html — `include/linux/fs.h`,
    `fs/read_write.c`, `fs/char_dev.c` (`chrdev_open()`)
- **The user/kernel split** (`user-kernel-split`, deepens: `address-space`)
  - **Simple:** A user pointer means something only inside the process that sent it.
  - **Deep:** Each process has its own address space (1.4); the kernel's half is
    shared. A `__user` pointer is valid only in the address space of the process
    that made the syscall, which is why the driver copies through `copy_*_user()`
    while that process is current. — man 5 `proc_pid_maps` —
    `include/linux/mm_types.h` (`struct mm_struct`), `include/linux/compiler_types.h`
    (`__user`)
- **SMAP and user pointers** (`smap`)
  - **Simple:** The CPU stops kernel code from touching user memory by accident.
  - **Deep:** Supervisor Mode Access Prevention makes the CPU fault when kernel
    code touches user memory outside the `copy_*_user()` helpers (which open a
    window with `stac`/`clac`). That is why the `memcpy` version oopses. —
    https://docs.kernel.org/admin-guide/bug-hunting.html — `arch/x86/mm/fault.c`,
    `arch/x86/include/asm/smap.h`
- **copy_to_user / copy_from_user** (`copy-to-user`, deepens: `write-syscall`)
  - **Simple:** The safe doors for moving bytes between a process and the kernel.
  - **Deep:** The Prologue's `write` copied your bytes with `copy_from_user()`. They
    check the address is a user address, handle faults without crashing, and return
    the number of bytes **not** copied. `simple_read_from_buffer()` wraps the common
    read case. — https://docs.kernel.org/kernel-hacking/hacking.html —
    `include/linux/uaccess.h`, `lib/usercopy.c`, `fs/libfs.c`
- **The driver's half of the read contract** (`driver-read-contract`,
  deepens: `read-contract`)
  - **Simple:** Return how many bytes you gave, move the position; `0` is the end.
  - **Deep:** `read(file, buf, count, ppos)`: copy at most `count` bytes starting at
    `*ppos`, advance `*ppos` by what you copied, return that count; return `0` at
    EOF, a negative errno on failure. `*ppos` is the open file's `f_pos`. —
    https://docs.kernel.org/filesystems/vfs.html — `fs/read_write.c`
    (`vfs_read()`), `include/linux/fs.h` (`struct file`)
- **Your read() path** (`read-path`, deepens: `syscall-path`)
  - **Simple:** From `cat`'s `read()` all the way down to your function and back.
  - **Deep:** `read()` → `syscall` → `entry_SYSCALL_64` → syscall table →
    `ksys_read()` → `vfs_read()` → the driver's `.read` → `copy_to_user()` →
    return in `rax`. — https://docs.kernel.org/filesystems/vfs.html — `fs/read_write.c`,
    `arch/x86/entry/entry_64.S`

### Real-world card

```sh
make && sudo insmod lantern.ko
echo "hello" | sudo tee /dev/lantern
sudo cat /dev/lantern
sudo dd if=/dev/lantern bs=1 status=none
sudo strace -e trace=read,write cat /dev/lantern
```

Only in a throwaway VM: load the `memcpy` version and watch the oops in
`dmesg`. Then reboot the VM; after an oops the kernel is tainted (`D`).

### Taint

- Ignoring the return value of `copy_*_user()`: +3.
- Returning the wrong count (for example always `count` from `read`): +3; `cat`
  loops or prints garbage.
- Dereferencing a `__user` pointer directly (submitted, not just the experiment): +5.
- `sparse`-style warnings about mixing `__user` and kernel pointers: +1.

### Fidelity

**Faithful:** `read`/`write` signatures, `*ppos` semantics, EOF on `0`,
`copy_*_user()` return values, `EFAULT`, the oops format and SMAP behavior.
**Simplified:** no page cache or `read_iter`; the user/kernel split is modelled
per process, not by real page tables; the buffer is not yet protected against
concurrent writers (fixed in 2.9).

---

## 2.6 — Device Quarter: brightness control

- **Region / NPC:** Device Quarter / udev, init · **Tracks:** `kernel`, `userland` · **Time:** ~15 min · **Prerequisites:** `drv-fops`, `c-bit-flags` · **Skills unlocked:** `drv-ioctl`

### Scene

> **udev:** The Lantern reads and writes words. Now the Quarter wants a dial.
>
> **init:** We could look for "brightness=50" inside messages. Then every message
> that happens to contain "brightness=" changes the lights. Commands and data should
> use different doors.
>
> **udev:** `ioctl`: "do this command, here's an argument". Each command has a
> number that also says which way the data goes and how big it is.
>
> **The Watchdog:** And say "no idea" properly when you don't know a command.
> `ENOTTY`. Yes, it says "tty". Long story.

### See it (X-ray)

**Syscalls view:** `ioctl(fd, TCGETS, &t)` on the terminal, then the same call on
a regular file returning `ENOTTY`. X-ray decodes a command number into its four
fields: direction, size, type ("magic") and number, using the real `_IOC` layout.

### Build it

Starter (stub): an empty `lanternctl.c` with a `lanternctl` target in the player's
own user-space `Makefile` (1.3's rules, `-Wall -Wextra`). The player writes a
shared header `lantern_ioctl.h` (usable from user and kernel code, `__u32` types):
- `LANTERN_IOC_MAGIC` (a value the game reserves; real drivers pick one from
  `ioctl-number.rst`), `LANTERN_SET_BRIGHTNESS` as `_IOW(magic, 1, __u32)` and
  `LANTERN_GET_BRIGHTNESS` as `_IOR(magic, 2, __u32)`.
- `.unlocked_ioctl = lantern_ioctl` (and `.compat_ioctl = compat_ptr_ioctl`).
  Unknown commands return `-ENOTTY`; values over 255 return `-EINVAL`; bad
  pointers return `-EFAULT`.
- A small userspace tool `lanternctl get|set N` that uses the header.

Checker verifies:
- `lanternctl set 200` then `lanternctl get` prints `200`.
- `set 300` fails with `EINVAL` and the brightness stays 200.
- An unknown command number fails with `ENOTTY`.
- A bad pointer fails with `EFAULT`, no oops.
- `brightness=N` given at load (2.3) is the starting value.

### Watch it

The whole Device Quarter dims and brightens as the player turns the dial.

```
ksh$ lanternctl set 40
ksh$ lanternctl get
40
ksh$ strace -e trace=ioctl lanternctl set 300
ioctl(3, _IOC(_IOC_WRITE, 0x..., 0x1, 0x4), 0x7ffd...) = -1 EINVAL (Invalid argument)
```

`strace` decodes the command's direction and size because `_IOW` packed them into
its bits, the same bit-flag trick as the `O_*` flags you packed for `>` and `>>` in 1.6.

### Debrief

> **init:** Up in Userland they can see the Quarter brighten. They'd like to read
> the dial too, without writing a C program for it.
>
> **udev:** Then it needs signposts.

Next: status pages (2.7).

### Hints

1. **Nudge:** The command number should tell the kernel which way the data moves.
   Which macro means "userspace writes to the driver"?
2. **Concept:** `_IOW` = user writes, kernel reads (`copy_from_user`/`get_user`);
   `_IOR` = user reads, kernel writes (`copy_to_user`/`put_user`). `arg` is a user
   address, not a kernel one.
3. **Point at the spot:** The `default:` case of your `switch (cmd)` decides what
   unknown commands return.

### Codex (chapter: Device Quarter)

- **ioctl** (`ioctl`, deepens: `bit-flags`)
  - **Simple:** A per-device "do this command" call, separate from the data.
  - **Deep:** Command numbers are built with `_IO`, `_IOR`, `_IOW`, `_IOWR` from a
    direction, size, type and number packed into bits. Unknown commands return
    `-ENOTTY`. New drivers prefer simple, fixed-size structures and few ioctls. —
    https://docs.kernel.org/driver-api/ioctl.html,
    https://docs.kernel.org/userspace-api/ioctl/ioctl-number.html —
    `include/uapi/asm-generic/ioctl.h`, `fs/ioctl.c`

### Real-world card

```sh
gcc -Wall -Wextra -o lanternctl lanternctl.c
sudo ./lanternctl set 200 && sudo ./lanternctl get
sudo strace -e trace=ioctl ./lanternctl set 300
# A real ioctl you use every day:
strace -e trace=ioctl stty size
```

### Taint

- Unknown command returns `-EINVAL` instead of `-ENOTTY`: +1.
- Magic numbers instead of `_IOR`/`_IOW` macros: +3; tools like `strace` can't
  decode them and the size isn't encoded.
- Using `long` or pointers in the shared header instead of fixed-size `__u32`/`__u64`:
  +1 (their size differs between 32-bit userspace and a 64-bit kernel).
- Treating `arg` as a kernel pointer: +5.

### Fidelity

**Faithful:** `_IOC` encoding (x86 layout), `unlocked_ioctl` signature, `ENOTTY`,
`compat_ptr_ioctl`, `strace` decoding.
**Simplified:** no 32-bit userspace in the lab, so the compat path is declared but
not exercised.

---

## 2.7 — Device Quarter: status pages

- **Region / NPC:** Device Quarter / udev, init · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `drv-fops`, `drv-module-params` · **Skills unlocked:** `drv-sysfs-procfs`

### Scene

> **udev:** Two kinds of signpost. `/proc` is for processes and old-style status
> pages. `/sys` is the kernel's object tree, one value per file.
>
> **init:** Tell them why there are two.
>
> **udev:** History. `/proc` came first and got messy. `/sys` has rules. A human
> summary goes in `/proc/lantern`; the brightness knob goes in `/sys`.
>
> **The Watchdog:** And `echo 50 > brightness` should just work. Shell scripts are
> people too.

### See it (X-ray)

**Files view:** `cat /proc/uptime` (the size-0 file from S.1's Predict) and
`cat /sys/class/net/lo/mtu`. X-ray shows that no disk is involved: the VFS calls a
`show()` function in the kernel, which prints into a buffer, at the moment of
`read()`. Then it replays 1.5's `cat /proc/$$/status` from the kernel's side:
`proc_pid_status()` printing the lines the player once read. "Every `/proc` file
you've read was somebody's show function. Now write one."

### Build it

Starter (blank): only the player's own Lantern. The player adds:
- `/proc/lantern` with `proc_create_single("lantern", 0444, NULL, lantern_proc_show)`;
  `lantern_proc_show()` uses `seq_printf()` to print the message length,
  brightness and colour. Removed with `proc_remove()` in exit.
- A device attribute `brightness` with `DEVICE_ATTR_RW()`, `brightness_show()`
  using `sysfs_emit()` and `brightness_store()` parsing with `kstrtouint()`,
  registered through `ATTRIBUTE_GROUPS()` and `device_create_with_groups()`.

Checker verifies:
- `cat /proc/lantern` shows the current values; they change after `lanternctl set`.
- `cat /sys/class/lantern/lantern/brightness` prints the value with one newline.
- `echo 50 > .../brightness` changes the value, and `lanternctl get` agrees.
- `echo abc > .../brightness` and `echo 300 > ...` fail with `EINVAL`.
- `brightness` is `-rw-r--r--` (from `DEVICE_ATTR_RW`): a uid-1000 process can read
  it, and its write fails with `EACCES` (S.2's check, on a file you made).
- Fault injection (2.4's unwinding, re-checked): when `proc_create_single()` or
  the attribute group fails, `insmod` fails cleanly and nothing is left registered.
- After `rmmod`, `/proc/lantern` and the sysfs directory are gone.

### Watch it

Signposts light up across the Quarter.

```
ksh$ cat /proc/lantern
message: 22 bytes (max 64)
brightness: 200
colour: amber
ksh$ cat /sys/class/lantern/lantern/brightness
200
ksh$ echo 50 > /sys/class/lantern/lantern/brightness
ksh$ lanternctl get
50
```

### Debrief

The signpost reads `max 64`.

> **kswapd** (from the shaft below the Quarter): Sixty-four bytes? That's your
> Lantern's whole memory? The city has longer things to say than that. Come down to
> the Mines.

Next: the Slab Mines (2.8a).

### Hints

1. **Nudge:** You don't write `read()` for these files. The kernel calls a
   function to print the current state whenever someone reads.
2. **Concept:** sysfs: one value per file, `show()` fills a page-sized buffer
   with `sysfs_emit()`, `store()` parses and returns the number of bytes consumed
   (or a negative errno). procfs + `seq_file` handles buffering and offsets for you.
3. **Point at the spot:** `brightness_store()` should check `kstrtouint()`'s return
   and the range before changing anything, then `return count`.

### Codex (chapter: Device Quarter)

- **seq_file and procfs** (`seq-file`, deepens: `proc-pid`)
  - **Simple:** A `/proc` file is a function that prints the current state when read.
  - **Deep:** You print with `seq_printf()`; `seq_file` handles partial reads,
    offsets and buffer sizes. `proc_create_single()` is the shortest form;
    `/proc/<pid>/status` is `proc_pid_status()` doing the same. —
    https://docs.kernel.org/filesystems/seq_file.html — `fs/seq_file.c`,
    `fs/proc/generic.c`, `fs/proc/array.c`
- **sysfs attributes** (`sysfs-attribute`)
  - **Simple:** One kernel value per file under `/sys`, readable and maybe writable.
  - **Deep:** `show()` fills the buffer with `sysfs_emit()`; `store()` parses and
    returns the bytes consumed. Created with the device, in groups, so they exist
    before userspace hears about the device. —
    https://docs.kernel.org/filesystems/sysfs.html — `fs/sysfs/file.c`
    (`sysfs_emit()`), `include/linux/device.h`, `drivers/base/core.c`

### Real-world card

```sh
sudo insmod lantern.ko
cat /proc/lantern
cat /sys/class/lantern/lantern/brightness
echo 50 | sudo tee /sys/class/lantern/lantern/brightness
udevadm info -a /dev/lantern | head -20
cat /sys/class/net/lo/mtu   # real attributes look the same
```

### Taint

- `sprintf()` instead of `sysfs_emit()` in `show()`: +1 (the sysfs documentation
  says new `show()` methods use only `sysfs_emit()` or `sysfs_emit_at()`).
- Several values in one sysfs file: +1, breaks the sysfs rule.
- Forgetting `proc_remove()`: +5. After `rmmod`, reading `/proc/lantern` calls code
  that no longer exists and oopses.
- Adding attributes with `device_create_file()` after the device appeared: +1
  (userspace can race and miss them).
- `store()` that accepts bad input: +3.

### Fidelity

**Faithful:** `proc_create_single`, `seq_printf`, `DEVICE_ATTR_RW`,
`ATTRIBUTE_GROUPS`, `sysfs_emit`, `kstrtouint`, paths under `/sys/class`.
**Simplified:** the sysfs tree only contains what levels use; no uevents beyond
add/remove.

---

## 2.8a — Slab Mines: messages of any size

- **Region / NPC:** Slab Mines / kswapd (the memory reclaim thread), init · **Tracks:** `kernel`, `debug` · **Time:** ~15 min · **Prerequisites:** `drv-fops`, `kdev-config-build` · **Skills unlocked:** `mem-kmalloc`, `mem-leak-kmemleak`

### Scene

> **kswapd:** Welcome to the Slab Mines. I'm kswapd. I don't hand out memory, mind:
> the slab allocator does that. I'm the one who digs when memory runs low. I
> reclaim pages so allocations can succeed.
>
> **init:** The Lantern needs room for messages of any size. In Userland, we'd call
> `malloc`.
>
> **kswapd:** Down here it's `kmalloc`, and you tell it how you can wait.
> `GFP_KERNEL` says "I can sleep": if memory is tight, you wait while pages get
> reclaimed, by you or by me. Can't sleep? Ask for `GFP_ATOMIC`, and don't count on
> me. I'll start digging, but you can't wait for me: you get what's free right now,
> maybe from the emergency reserve, or `NULL`.
>
> **kswapd:** Either way, check for `NULL`. And whatever you take, give back. The
> Mines remember everything nobody returns.

### See it (X-ray)

**Memory view (unlocked here):** `kmalloc(40, GFP_KERNEL)` lands in the
`kmalloc-64` slab cache; X-ray shows the slab page split into equal objects. A
`kfree()` returns the object; with slab poisoning on (the lab boots with
`slub_debug=P`), it fills with `0x6b` bytes. Then a demo module that "forgets" one
`kfree()`: `echo scan > /sys/kernel/debug/kmemleak` finds it.

### Build it

Starter (stub, one notch up for a new memory model): the player's Lantern from 2.7,
a `struct lantern_msg` definition and a stress tool:

```c
struct lantern_msg {
	size_t len;
	char text[];	/* flexible array member: the text follows the struct */
};
```

The player:
- Moves the device to the heap: `ldev = kzalloc(sizeof(*ldev), GFP_KERNEL)` first
  thing in `lantern_init()` (`-ENOMEM` on failure, `kfree(ldev)` as the last
  unwinding step and the last line of exit). From here on `ldev` is a pointer.
- Replaces the 64-byte buffer with `struct lantern_msg *msg` in the device.
- `lantern_write()`: reject `count > LANTERN_MSG_MAX` (4096) with `-EINVAL`;
  allocate with `kmalloc(struct_size(msg, text, count), GFP_KERNEL)` and return
  `-ENOMEM` on `NULL`; `copy_from_user()` into `text` (on failure, free the new
  message and return `-EFAULT`); swap it in as the current message and `kfree()`
  the old one.
- `lantern_read()`: the 2.5 contract, now reading from `ldev->msg`.
- Exit frees the current message, then the device.

`struct_size()` computes the struct's size plus `count` bytes of `text`, without
overflow. The flexible array member is optional reading: the Codex card explains
it, and a version with a separately allocated text buffer passes too.

Checker verifies:
- Messages of 1 byte and 4096 bytes round-trip; 4097 bytes fail with `EINVAL`.
- The 2.5 read contract still holds on the new buffer: a 4096-byte message read
  one byte at a time (`dd bs=1`) comes back whole, then EOF.
- With the lab's fault injection (failslab), the next `kmalloc()` fails: `write()`
  returns `ENOMEM`, the old message is intact, no oops.
- Failslab on the device allocation at load: `insmod` fails with `ENOMEM` and
  nothing is left registered (2.4's unwinding).
- After 1000 writes, then `rmmod`: kmemleak reports nothing and the `kmalloc-*`
  object counts return to their baseline.

### Watch it

**Predict:** `kmalloc(40, GFP_KERNEL)` succeeds. How many bytes did it really take
from the Mines? (64: the request is rounded up to the `kmalloc-64` cache.
`ksize()` would tell you.)

Mine carts light up, one per live message, and go dark when freed.

```
ksh$ echo scan > /sys/kernel/debug/kmemleak
ksh$ cat /sys/kernel/debug/kmemleak
ksh$
```

What a leak looks like (from the See-it demo; abridged, and the hex dump, CRC and
addresses differ every run):

```
unreferenced object 0xffff888005e3c180 (size 64):
  comm "echo", pid 214, jiffies 4294937012
  hex dump (first 32 bytes):
    06 00 00 00 00 00 00 00 68 65 6c 6c 6f 0a 00 00  ........hello...
  backtrace (crc 5c1e0f3a):
    __kmalloc_noprof+0x...
    lantern_write+0x.../0x... [lantern]
    vfs_write+0x...
```

X-ray's freed carts are full of `6b 6b 6b …`.

> **kswapd** (quietly): The night it all went dark, the carts looked like that.
> Something kept reading the empty ones.

### Debrief

> **init:** A reader was halfway through a long message when a writer replaced it.
> The rest of their `cat` came from the new message. Half of one, half of another.
>
> **kswapd:** So each reader should keep the message it opened. Then who frees it?
> The writer? The last reader? Down the next shaft. I'll show you how we count.

Next: who frees this? (2.8b).

### Hints

1. **Nudge:** Every `kmalloc()` needs exactly one `kfree()`. Where does each
   message stop being needed?
2. **Concept:** `kmalloc()` returns `NULL` on failure, never an error pointer.
   `GFP_KERNEL` may sleep, which is fine in `write()` (process context). Check the
   size before allocating: userspace chooses `count`.
3. **Point at the spot:** In `lantern_write()`, look at the old message pointer
   after the new one is in place, and at the failure path after `copy_from_user()`.

### Codex (chapter: Slab Mines)

- **kmalloc and kfree** (`kmalloc`)
  - **Simple:** The kernel's `malloc`: small blocks of memory from ready-cut caches.
  - **Deep:** `kmalloc()` hands out physically contiguous objects from slab caches
    (`kmalloc-8` … `kmalloc-8k`), rounding the size up; `kzalloc()` zeroes them;
    `kfree()` returns them; `NULL` means failure. `/proc/slabinfo` and `slabtop`
    show the caches. — https://docs.kernel.org/core-api/memory-allocation.html —
    `include/linux/slab.h`, `mm/slub.c`, `mm/slab_common.c`
- **GFP flags** (`gfp-flags`)
  - **Simple:** How an allocation may wait: "I can sleep" or "I can't".
  - **Deep:** `GFP_KERNEL` (`__GFP_RECLAIM | __GFP_IO | __GFP_FS`) may sleep and
    reclaim directly; right in process context. `GFP_ATOMIC` (`__GFP_HIGH |
    __GFP_KSWAPD_RECLAIM`) never sleeps: it only wakes kswapd, may dip into
    reserves, and fails more easily. Use it only where you can't sleep (2.10a). —
    https://docs.kernel.org/core-api/memory-allocation.html —
    `include/linux/gfp_types.h`, `mm/vmscan.c` (`kswapd()`)
- **kmemleak** (`kmemleak`)
  - **Simple:** Finds memory nobody points to any more: a leak.
  - **Deep:** Scans memory for allocated objects with no references left, like a
    garbage collector that only reports. Reports the allocation backtrace; only
    objects older than a few seconds are reported. —
    https://docs.kernel.org/dev-tools/kmemleak.html — `mm/kmemleak.c`
- **Flexible array members** (`flexible-array`, optional)
  - **Simple:** A struct whose last field is "the rest of the allocation".
  - **Deep:** `char text[];` as the last member; allocate with `struct_size(p,
    text, n)`, which checks for overflow. Replaces the old `text[0]`/`text[1]`
    tricks. — https://docs.kernel.org/process/deprecated.html (zero-length and
    one-element arrays) — `include/linux/overflow.h` (`struct_size()`)

### Real-world card

On a kernel built with `CONFIG_DEBUG_KMEMLEAK` (see 2.1):

```sh
sudo mount -t debugfs none /sys/kernel/debug 2>/dev/null
sudo insmod lantern.ko
for i in $(seq 100); do echo "msg $i" | sudo tee /dev/lantern >/dev/null; done
sudo rmmod lantern
echo scan | sudo tee /sys/kernel/debug/kmemleak
sudo cat /sys/kernel/debug/kmemleak
sudo slabtop -o | head -20
```

kmemleak only reports objects older than a few seconds, so scan again if a
fresh leak doesn't show yet.

### Taint

- Leak found by kmemleak: +3.
- Not checking `kmalloc()` for `NULL`: +3.
- Allocating `count` without checking a maximum: +3 (userspace can ask for huge allocations).
- `GFP_ATOMIC` in process context "to be safe": +1 (wastes emergency reserves).

### Fidelity

**Faithful:** `kmalloc` size classes, GFP semantics, `struct_size`, kmemleak report
shape, failslab-style injection, the `0x6b` free poison with `slub_debug=P`.
**Simplified:** only the `kmalloc-*` caches exist; reclaim, NUMA and page
allocator details are not modelled; kmemleak scans are instant. A reader racing a
writer on another CPU is not triggered yet (2.9).

---

## 2.8b — Slab Mines: who frees this?

- **Region / NPC:** Slab Mines / kswapd, init · **Tracks:** `kernel`, `debug` · **Time:** ~20 min · **Prerequisites:** `mem-kmalloc`, `c-structs-fnptrs`, `dbg-oops-reading` · **Skills unlocked:** `mem-object-lifetime`, `c-container-of`, `dbg-kasan`

### Scene

> **init:** Every reader should keep the message they opened, even after a new one
> arrives.
>
> **kswapd:** Then a message has many owners. Free it while one of them is still
> reading and you've made the worst kind of bug: the memory's gone, the pointer
> isn't.
>
> **init:** The grey box from the Compiler's Quarter. A dangling pointer.
>
> **kswapd:** Down here it doesn't crash one program. It can corrupt anything.
> Your kernel has eyes for it now, though. KASAN. Let's make one on purpose so you
> know what it looks like.
>
> **kswapd:** Then the cure: count who's holding each message. Whoever lets go last
> frees it. That's a `kref`.

### See it (X-ray)

**Memory view:** first, what "keep the message you opened" means. The VFS gives
every `open()` its own `struct file`, and `file->private_data` is a pointer the
driver may use for that one open file. X-ray draws two open files, each with an
arrow to the cart it opened.

**Crash on purpose:** a scratch copy of the player's Lantern where `lantern_open()`
stores the current message in `file->private_data`, but `lantern_write()` still
`kfree()`s the old one. The lab runs: a `cat` opens (its arrow points at cart A),
a writer replaces A and frees it (cart A goes grey), the `cat` reads. This time the
scratch copy is built **with** KASAN instrumentation. KASAN stops the read and
prints its report; X-ray marks the arrow into the grey cart red. Snapshot restores.

KASAN is the kernel's AddressSanitizer: the player's 1.3 report had the same parts
(what, where, and for a freed object, who allocated it and who freed it).

### Build it

Starter (stub, the new memory model continues): the player's Lantern from 2.8a,
`struct lantern_msg` with a `struct kref ref;` added as its first member, an empty
`lantern_msg_release(struct kref *ref)`, and empty `lantern_open()` and
`lantern_release()` signatures. The player:
- `lantern_write()`: `kref_init()` the new message (count 1: the device's
  reference), swap it in, then `kref_put(&old->ref, lantern_msg_release)` instead of
  `kfree()`.
- `lantern_open()`: `kref_get()` the current message and store it in
  `file->private_data` (with no message yet, it stores `NULL` and `read()` returns
  EOF). `lantern_release()`, the `.release` the VFS calls when the last reference
  to that open file is closed, drops it with `kref_put()`. `lantern_read()` reads
  from `file->private_data`.
- `lantern_msg_release()`: it receives a `struct kref *`, a pointer to the member,
  not the message. `container_of(ref, struct lantern_msg, ref)` finds the message
  around it; then `kfree()`.
- Module exit drops the device's reference.

**Source dive:** `include/linux/container_of.h`. `container_of(ptr, type, member)`
is pointer arithmetic: the member's address minus `offsetof(type, member)`, with a
compile-time check that `ptr` has the member's type. The same trick takes the VFS
from `inode->i_cdev` to a driver's device struct, and takes a timer callback to its
device in 2.10a.

Checker verifies:
- A reader that opened before a write keeps reading the **old** message, whole; a
  new `open()` sees the new one.
- The crash-on-purpose sequence runs clean on the player's code: no KASAN report.
- 2.8a's checks still pass (sizes, `ENOMEM`, `dd bs=1`).
- Each message is freed exactly once: no refcount warning; after 1000 writes, opens
  and closes, then `rmmod`, kmemleak is clean and the object counts are back to
  baseline.

### Watch it

**Predict:** a `cat` holds message A open. A writer replaces A with B. Then the
`cat` closes. Which call frees A? X-ray shows A's count: 2 (device and `cat`), 1
after the write, 0 in `lantern_release()`, and the release function runs there.

**Point at it:** the KASAN report from the crash on purpose. The player clicks:
_what_ (a use-after-free, a read of 8 bytes), _where_ (`lantern_read`, by `cat`),
_who allocated_ (`lantern_write`), _who freed_ (`lantern_write` again, another
task), _which object_ (8 bytes into a freed 32-byte object, `len`), and the shadow
bytes `fa fb`, which mean "freed slab memory" (abridged; addresses, offsets and the
shadow rows differ every run):

```
==================================================================
BUG: KASAN: slab-use-after-free in lantern_read+0x4e/0x1d0 [lantern]
Read of size 8 at addr ffff888005e3c188 by task cat/251

CPU: 1 UID: 0 PID: 251 Comm: cat Tainted: G           O        6.18.0-lantern #1 PREEMPT(voluntary)
Tainted: [O]=OOT_MODULE
Call Trace:
 <TASK>
 dump_stack_lvl+0x...
 print_report+0x...
 kasan_report+0x...
 lantern_read+0x4e/0x1d0 [lantern]
 vfs_read+0x...
 ksys_read+0x...
 do_syscall_64+0x...
 entry_SYSCALL_64_after_hwframe+0x...
 </TASK>

Allocated by task 249:
 kasan_save_stack+0x...
 kasan_save_track+0x...
 __kasan_kmalloc+0x...
 __kmalloc_noprof+0x...
 lantern_write+0x.../0x... [lantern]
 vfs_write+0x...
 ksys_write+0x...
 do_syscall_64+0x...

Freed by task 252:
 kasan_save_stack+0x...
 kasan_save_track+0x...
 kasan_save_free_info+0x...
 __kasan_slab_free+0x...
 kfree+0x...
 lantern_write+0x.../0x... [lantern]
 vfs_write+0x...
 ksys_write+0x...
 do_syscall_64+0x...

The buggy address belongs to the object at ffff888005e3c180
 which belongs to the cache kmalloc-32 of size 32
The buggy address is located 8 bytes inside of
 freed 32-byte region [ffff888005e3c180, ffff888005e3c1a0)
...
Memory state around the buggy address:
 ffff888005e3c100: 06 fc fc fc 00 00 06 fc fc fc 00 00 06 fc fc fc
>ffff888005e3c180: fa fb fb fb fc fc 00 00 06 fc fc fc 00 00 06 fc
                      ^
 ffff888005e3c200: fc fc 00 00 06 fc fc fc 00 00 06 fc fc fc 00 00
==================================================================
```

After a KASAN report the kernel is tainted `B`.

The Mines' carts now stay lit until their last rider leaves.

### Debrief

> **kswapd:** Every cart keeps its light until its last rider gets off. Tidy.
>
> **init:** With one visitor at a time. The Cathedral's bells are ringing: the
> stress tool is waiting at its door with four writers on two CPUs.
>
> _The bells clang, all at once._

Next: the Lock Cathedral (2.9).

### Hints

1. **Nudge:** Who frees a message: the writer that replaced it, or the last reader
   to close it? It depends on who finishes last.
2. **Concept:** `kref_init()` sets the count to 1 (the creator's reference).
   Every `kref_get()` needs one `kref_put()`. The release function runs exactly
   once, when the count reaches zero, and gets a pointer to the `kref` inside the
   object.
3. **Point at the spot:** Look at what happens to the old message pointer in
   `lantern_write()` after the new one is in place, and at what `lantern_release()`
   does with `file->private_data`.

### Codex (chapter: Slab Mines)

- **KASAN** (`kasan`, deepens: `asan`)
  - **Simple:** The kernel's AddressSanitizer: it catches bad memory access live.
  - **Deep:** Generic KASAN keeps "shadow memory" (one byte per 8 bytes) that says
    which bytes are valid, and the compiler checks every load and store against
    it. Freed memory is held in a quarantine so late accesses are caught. A report
    names the bug type, the access, the task, and the allocation and free stacks;
    it taints the kernel `B`. — https://docs.kernel.org/dev-tools/kasan.html —
    `mm/kasan/generic.c`, `mm/kasan/report.c`, `mm/kasan/quarantine.c`
- **Per-open state** (`private-data`)
  - **Simple:** Each `open()` gets its own slot where the driver can keep a pointer.
  - **Deep:** Every `open()` creates a `struct file`; `file->private_data` is the
    driver's to use, from `.open` to `.release` (called when the last reference to
    that open file goes away, not on every `close()` of a `dup`ed fd). —
    https://docs.kernel.org/filesystems/vfs.html — `include/linux/fs.h`
    (`struct file`), `fs/file_table.c` (`__fput()`)
- **kref** (`kref`)
  - **Simple:** A count of who's holding an object; the last one out frees it.
  - **Deep:** `kref_init()` (1), `kref_get()`, `kref_put(ref, release)`; the
    release function runs once, at zero. Built on `refcount_t`, which warns on
    underflow ("refcount_t: underflow; use-after-free."). The kernel uses the
    pattern everywhere (`struct device`, `struct file`, `sk_buff`). —
    https://docs.kernel.org/core-api/kref.html — `include/linux/kref.h`,
    `include/linux/refcount.h`
- **container_of** (`container-of`)
  - **Simple:** From a pointer to a member, find the struct it lives in.
  - **Deep:** `container_of(ptr, type, member)` subtracts `offsetof(type, member)`
    from `ptr`, with a type check. Kernel objects embed generic parts (`struct
    kref`, `struct cdev`, `struct timer_list`) and callbacks get the part, so this
    is how they find the whole. — man 3 `offsetof` —
    `include/linux/container_of.h`

### Real-world card

On the KASAN kernel from 2.1, in a VM:

```sh
make && sudo insmod lantern.ko       # the scratch version that kfree()s too early
echo first | sudo tee /dev/lantern
sudo sh -c 'exec 3</dev/lantern; echo second > /dev/lantern; cat <&3'
sudo dmesg | grep -A40 'BUG: KASAN'
cat /proc/sys/kernel/tainted
```

Then load the kref version and run the same lines: no report.

### Taint

- Freeing the message directly instead of `kref_put()`: +5 (a reader still uses it).
- A `kref_get()` without a matching `kref_put()` (leak found by kmemleak): +3.
- Release function that doesn't use `container_of()` (casting the `kref *` instead):
  +1; it works only while `ref` stays the first member.

### Fidelity

**Faithful:** `kref` API and release semantics, `container_of`, `file->private_data`
and `.release` timing, the KASAN slab-use-after-free report structure (bug type,
access, three stacks, cache and offset, shadow bytes `fa`/`fb`/`fc`), `B` taint.
**Simplified:** KASAN shadow is modelled per allocation, not per real memory page;
frame offsets are plausible, not computed from real machine code. Concurrent opens
and writes on two CPUs are not triggered yet (2.9).

---

## 2.9 — Lock Cathedral: many users at once

- **Region / NPC:** Lock Cathedral / the Verger (lockdep), the Deadlock Twins (cameo), init · **Tracks:** `kernel`, `debug` · **Time:** ~25 min · **Prerequisites:** `sync-interleaving`, `drv-fops`, `mem-object-lifetime`, `kdev-config-build` · **Skills unlocked:** `sync-race-diagnosis`, `sync-mutex`, `dbg-lockdep`

### Scene

> **The Verger:** Shh. In the Cathedral, many processes run at once, on many CPUs.
>
> **init:** The Lantern's fine with one visitor.
>
> **The Verger:** Watch two. Both swap the message. Both drop the old one. The same
> reference, dropped twice.
>
> **init:** Like the signal handler in Userland that lost a count. Same shape,
> bigger stakes.
>
> **The Verger:** So you take turns. A **mutex** is a lock you may sleep while
> holding. Whoever can't get it waits in line, asleep.
>
> **The Verger:** And I keep the register. In your world I'm lockdep, the kernel's
> lock validator. I write down every lock taken, by whom, and in what order. Break
> a rule and I say so at once, even before anything goes wrong.
>
> **Ab and Ba** (from the balcony, together): We love locks.
>
> **The Verger:** Ignore them. For now.

### See it (X-ray)

**Locks and timing view (unlocked here):** the lab's scheduler runs two writers
on two CPUs and stops them at the exact interleaving that breaks the Lantern: both
read the same current-message pointer and both `kref_put()` it. The first put frees
the message; the second touches freed memory, and KASAN reports it as in 2.8b
(without KASAN the kernel may only print `refcount_t: underflow;
use-after-free.`). Replay with a mutex: the second writer sleeps in the queue, then
proceeds.

### Build it

**Beat 1: the mutex.** **Source dive:** the player finds
`mutex_lock_interruptible()` in `kernel/locking/mutex.c` and reads its kernel-doc
comment: it returns `-EINTR` if a signal arrives while waiting.

Starter (blank): only the player's Lantern; `lantern-stress` is a test tool, not
scaffolding. The player adds a `struct mutex msg_lock` to the device
(`mutex_init(&ldev->msg_lock)`) that protects the current-message pointer and a
`writes` counter shown in `/proc/lantern`. It is held in `write` (swap and count),
`open` (take a reference), `ioctl` and the `show` functions. Paths a user's syscall
waits on take it with `mutex_lock_interruptible()` and return `-ERESTARTSYS` when
that fails, so a waiting process can still be stopped with Ctrl-C.

**Beat 2: break a rule on purpose (guided, ~5 min).** A scratch copy of the
player's Lantern has one early `return -EINVAL;` inside `lantern_write()`'s locked
section, and its `lantern_ioctl()` takes the lock with plain `mutex_lock()`.
1. `echo` hits the early return. The moment its `write()` returns to user space,
   the Verger speaks: lockdep's "lock held when returning to user space" report,
   naming the lock and the line that took it.
2. `lanternctl get` now waits for a lock nobody will release. In plain
   `mutex_lock()` it sleeps in `D` state (uninterruptible): Ctrl-C does nothing.
   A `cat /proc/lantern` waiting in `mutex_lock_interruptible()` sleeps in `S`,
   and Ctrl-C frees it.
3. After compressed time, khungtaskd prints the hung-task warning for the `D` task
   only. The snapshot restores.

The lesson: lockdep reported the bug at the first wrong step; the hang came later,
and only to whoever was unlucky enough to wait. The Verger adds his second rule
for later: "Two locks? Always the same order. I write down every 'held A, took B'.
The first time anyone takes them the other way round, I'll say so."

Checker verifies (with the lab's deterministic race harness, 4 processes on 2 CPUs,
replaying known bad interleavings):
- No refcount warning, no KASAN report, no oops across all interleavings.
- Every reader sees a whole message, never a mix of two.
- `writes` in `/proc/lantern` equals the exact number the harness did.
- A writer waiting for the lock is sent a signal: its `write()` ends and the lock
  is not left held.
- lockdep reports nothing during the run (no lock held on return to user space on
  any error path, including injected `ENOMEM` and `EFAULT`).

### Watch it

**Predict:** two writers each run `writes++` 1,000 times with no lock, and the
harness picks the worst interleaving. What does `writes` end at? Then the run with
the mutex.

The Cathedral's bells ring one after another instead of all at once.

```
ksh$ lantern-stress --writers 2 --readers 2 --rounds 1000
ok: 2000 writes, 4000 opens, 0 torn reads
ksh$ cat /proc/lantern
message: 14 bytes
brightness: 200
colour: amber
writes: 2000
```

The two reports from Beat 2 (abridged; addresses and offsets differ every run):

```
================================================
WARNING: lock held when returning to user space!
6.18.0-lantern #1 Tainted: G           O
------------------------------------------------
echo/233 is leaving the kernel with locks still held!
1 lock held by echo/233:
 #0: ffff888004c2a0d8 (&ldev->msg_lock){+.+.}-{4:4}, at: lantern_write+0x8e/0x2c0 [lantern]
```

```
INFO: task lanternctl:240 blocked for more than 120 seconds.
      Tainted: G           O        6.18.0-lantern #1
"echo 0 > /proc/sys/kernel/hung_task_timeout_secs" disables this message.
task:lanternctl      state:D stack:0     pid:240   ...
Call Trace:
 <TASK>
 __schedule+0x...
 schedule+0x...
 schedule_preempt_disabled+0x...
 __mutex_lock+0x...
 lantern_ioctl+0x.../0x... [lantern]
 ...
```

lockdep reports once, then turns itself off until the next boot ("debug_locks"
off); the lab's snapshot restore turns it back on.

### Debrief

> **init:** I found something in the old archives. A patch from before the
> Kernelfall: "lantern: keep a history of messages". The last five, in
> `/proc/lantern`.
>
> **The Verger:** Patches are how the kernel moves. Bring it in. I'll watch the
> locks.
>
> **Ab and Ba** (from the balcony): A second lock? We _love_ a second lock.

Next: the Deadlock Twins (2.9b).

### Hints

1. **Nudge:** List every place that reads or changes the current-message pointer.
   Which of them can run at the same time?
2. **Concept:** A mutex makes a block of code run one task at a time. Copying from
   userspace and `kmalloc(GFP_KERNEL)` may sleep, which is allowed under a mutex,
   but a short critical section keeps everyone else waiting less. Every path out of
   the section, including every error path, unlocks.
3. **Point at the spot:** In `lantern_write()`, do the allocation and the copy
   _before_ taking the lock; hold it only for the pointer swap and the counter.

### Codex (chapter: Lock Cathedral)

- **Race condition** (`race-condition`, deepens: `interleaving`)
  - **Simple:** Two tasks touch the same data at once and the result depends on luck.
  - **Deep:** At least one writes and nothing forces an order. `x++` is three steps
    (load, add, store), and another CPU can run between any two. —
    https://docs.kernel.org/kernel-hacking/locking.html — none.
- **Mutex** (`mutex`)
  - **Simple:** A lock you may sleep while holding; waiters sleep in line.
  - **Deep:** One owner, released by the owner, never in interrupt context.
    `mutex_lock()` waits in `D` state; `mutex_lock_interruptible()` lets a signal
    end the wait (`-EINTR`; drivers return `-ERESTARTSYS`). —
    https://docs.kernel.org/locking/mutex-design.html — `kernel/locking/mutex.c`,
    `include/linux/mutex.h`
- **lockdep** (`lockdep`)
  - **Simple:** The kernel's lock referee: it reports broken rules before they hang.
  - **Deep:** Groups locks into classes (by where they're initialised, e.g.
    `&ldev->msg_lock`), records every "held A, then took B", and checks rules: no
    lock held on return to user space, a consistent order between classes, the
    right lock for the context. It reports the first problem, then turns itself
    off. Enabled by `CONFIG_PROVE_LOCKING`. —
    https://docs.kernel.org/locking/lockdep-design.html —
    `kernel/locking/lockdep.c` (`lockdep_sys_exit()`)
- **Hung tasks** (`hung-task`)
  - **Simple:** A watchman that reports tasks stuck asleep for too long.
  - **Deep:** khungtaskd checks for tasks in `D` (uninterruptible) state that haven't
    run for `hung_task_timeout_secs` (120 by default) and prints their stack.
    Tasks in `S` are not reported: a signal can still wake them. —
    https://docs.kernel.org/admin-guide/sysctl/kernel.html (hung_task_*) —
    `kernel/hung_task.c`

### Real-world card

On a debug kernel (2.1) with 2+ CPUs:

```sh
sudo insmod lantern.ko
for i in $(seq 4); do (for j in $(seq 1000); do echo "w$i-$j" | sudo tee /dev/lantern >/dev/null; done) & done; wait
cat /proc/lantern
sudo dmesg | grep -E 'BUG|WARNING|refcount|blocked for' || echo clean
cat /proc/sys/kernel/hung_task_timeout_secs
```

Real races are not deterministic: no output doesn't prove there's no race.
That's why tools like lockdep and KCSAN exist.

### Taint

- One big lock held across the whole `read()` including `copy_to_user()`: +1
  (correct with a mutex, but readers block each other for no reason).
- `mutex_lock()` without a matching unlock on an error path: +5 (lockdep reports it).
- Ignoring the return value of `mutex_lock_interruptible()`: +5 (the code then
  runs without the lock).
- Using `mutex_trylock()` in a loop instead of `mutex_lock()`: +3.

### Fidelity

**Faithful:** mutex APIs and rules, `-EINTR` from `mutex_lock_interruptible()` and
the `-ERESTARTSYS` convention, the refcount underflow warning, lockdep's "lock held
when returning to user space" report and report-once behavior, `D` vs `S` and the
hung-task message.
**Simplified:** the race harness forces specific interleavings; real races
depend on timing. Two CPUs only; no memory-ordering effects beyond what locks
guarantee; the hung-task timeout is compressed. (6.15 and later can also name the
task likely holding the mutex with `CONFIG_DETECT_HUNG_TASK_BLOCKER`; not shown
(verify).)

---

## 2.9b — The Deadlock Twins (boss)

- **Region / NPC:** Lock Cathedral / Ab and Ba (the Deadlock Twins), the Verger, init, the Watchdog · **Tracks:** `kernel`, `debug` · **Time:** ~25 min · **Prerequisites:** `sync-mutex`, `dbg-lockdep` · **Skills unlocked:** `sync-deadlock-lockdep`

### Scene

> **init:** Here's the patch. It adds a second lock, `history_lock`, for the
> history.
>
> **The Verger:** Two locks. Then there's an order, whether anyone wrote it down or
> not.
>
> **Ab:** I take the message lock, then the history lock.
>
> **Ba:** I take the history lock, then the message lock.
>
> **Ab and Ba:** Together, we take _everything_.
>
> **The Watchdog:** Two tasks stuck forever. I'd bark, but that's not my job.
> That's khungtaskd's.
>
> **The Verger:** And I don't need them to actually get stuck to know they will.

### See it (X-ray)

**Beat 1: the record (git, guided, ~4 min).** The **Git and patches view**
unlocks here. The lab has committed each level's work, so the Lantern already has a
history. Guided, one command at a time:
1. `git log --oneline`: one commit per level, newest first ("lantern: take turns
   with a mutex", "lantern: count references to messages", …).
2. `git show HEAD`: one commit: author, message, then the diff of what 2.9 changed
   (`-` lines removed, `+` lines added).
3. `git diff`: what changed since the last commit (nothing yet).
4. The salvaged patch, `0001-lantern-keep-a-history-of-messages.patch`, opened in
   the editor: it's an email. `From:`, `Subject: [PATCH] lantern: keep a history of
   messages`, the message, a `---` line, a diffstat, then the diff.
5. `git am 0001-lantern-keep-a-history-of-messages.patch` applies it as a commit,
   keeping its author and message; `git log --oneline` shows it on top. (`git
   apply` would only change the files.)

**Beat 2: the freeze.** The player runs `lantern-stress --with-history`. The lab
drives the deadly interleaving: a writer (Ab) holds `msg_lock` and waits for
`history_lock`; a reader of `/proc/lantern` (Ba) holds `history_lock` and waits for
`msg_lock`. X-ray draws the cycle. The writer, stuck in the patch's
`mutex_lock(&history_lock)`, sits in `D` state; the reader, in
`mutex_lock_interruptible(&msg_lock)`, sits in `S` (Ctrl-C frees it, but the
writer stays stuck). After compressed time the hung-task warning prints for the
`D` task, then the snapshot restores.

**Beat 3: the witness.** The player runs one write and one `cat /proc/lantern`,
**one after the other**, no deadlock. lockdep still reports the cycle: the Verger's
"I write down every order" from 2.9.

### Build it

Starter (blank, plus the salvaged patch as content). The player:
- Reads the lockdep report and finds the two call paths.
- Chooses one order (`msg_lock` before `history_lock`), writes it down in a
  comment above the lock definitions, and changes `lantern_proc_show()` to follow
  it (or to copy what it needs under one lock at a time).

Checker verifies:
- The deadly interleaving (and 50 other forced interleavings) completes: no task
  stuck, no hung-task warning.
- lockdep reports nothing during a full stress run, including the single-run
  order test.
- `/proc/lantern` shows the five most recent messages, newest first, matching what
  the harness wrote.
- kmemleak clean after `rmmod` (history entries hold references, see 2.8b).
- The patch is in `git log` as its own commit (applied, not retyped).

### Watch it

The Twins walk through the Cathedral doors one at a time; the doors stay open.

The hung task (abridged):

```
INFO: task lantern-stress:231 blocked for more than 120 seconds.
      Tainted: G           O        6.18.0-lantern #1
"echo 0 > /proc/sys/kernel/hung_task_timeout_secs" disables this message.
```

The lockdep report (abridged; addresses and offsets differ every run):

```
======================================================
WARNING: possible circular locking dependency detected
6.18.0-lantern #1 Tainted: G           O
------------------------------------------------------
cat/240 is trying to acquire lock:
ffff888004c2a0d8 (&ldev->msg_lock){+.+.}-{4:4}, at: lantern_proc_show+0x5e/0x1a0 [lantern]

but task is already holding lock:
ffff888004c2a118 (&ldev->history_lock){+.+.}-{4:4}, at: lantern_proc_show+0x2b/0x1a0 [lantern]

which lock already depends on the new lock.
...
 Possible unsafe locking scenario:

       CPU0                    CPU1
       ----                    ----
  lock(&ldev->history_lock);
                               lock(&ldev->msg_lock);
                               lock(&ldev->history_lock);
  lock(&ldev->msg_lock);

 *** DEADLOCK ***
```

### Debrief

> **Ab:** Fine. One at a time.
>
> **Ba:** But don't blame _us_ for the Kernelfall. We only ever froze things.
> Whatever brought the Machine down read from the empty carts.
>
> **ksoftirqd** (from the stair beyond the doors): Doors open? Finally! Somebody
> come up the Spire. The beacon hasn't blinked since that night.

Next: the Interrupt Spire (2.10a).

### Hints

1. **Nudge:** Read the report's two stack traces. Which function takes which lock first?
2. **Concept:** A deadlock needs a cycle. If every path takes locks in the same
   global order, no cycle can form. lockdep checks the order, not the timing.
3. **Point at the spot:** `lantern_proc_show()` takes `history_lock` first. Every
   other path takes `msg_lock` first.

### Codex (chapter: Lock Cathedral)

- **git basics** (`git-basics`)
  - **Simple:** A project's history: who changed what, when, and why.
  - **Deep:** `git log` lists commits; `git show` shows one (message and diff);
    `git diff` shows uncommitted changes. A patch file is an email with a diff;
    `git am` applies it as a commit with its author and message, `git apply` only
    edits files. The kernel's whole history is in git. —
    https://git-scm.com/docs/git-am, https://docs.kernel.org/process/submitting-patches.html
    — `.git/` in any kernel tree
- **ABBA deadlock** (`abba-deadlock`)
  - **Simple:** Two tasks each hold the lock the other needs, forever.
  - **Deep:** Two tasks, two locks, opposite orders. A waiter in `mutex_lock()`
    sleeps in `D` (the hung-task detector reports it); one in
    `mutex_lock_interruptible()` can be killed, but that doesn't break the cycle for
    the others. The fix is a lock order, documented next to the locks. —
    https://docs.kernel.org/kernel-hacking/locking.html — `kernel/hung_task.c`
- **Circular locking dependency** (`circular-dependency`, deepens: `lockdep`)
  - **Simple:** lockdep's warning that two paths take the same locks in opposite orders.
  - **Deep:** The first time a "held B, took A" is seen after a "held A, took B",
    lockdep prints both chains and the "possible unsafe locking scenario", even if
    the two paths never ran at the same time. —
    https://docs.kernel.org/locking/lockdep-design.html — `kernel/locking/lockdep.c`

### Real-world card

On the debug kernel from 2.1:

```sh
git log --oneline -5
git am 0001-lantern-keep-a-history-of-messages.patch
make && sudo insmod lantern.ko    # the version with the history patch, before the fix
echo hello | sudo tee /dev/lantern
cat /proc/lantern
sudo dmesg | grep -A40 'circular locking'
cat /proc/lockdep_stats | head
# If you do hit the real deadlock:
ps -eo pid,stat,comm | awk '$2 ~ /D/'
sudo cat /proc/<pid>/stack
echo w | sudo tee /proc/sysrq-trigger && sudo dmesg | tail -40
```

### Taint

- "Fixing" with `mutex_trylock()` and retrying, or dropping one lock entirely: +5
  (hides the cycle or reintroduces the 2.9 race).
- Fix with no comment stating the lock order: +1.
- Holding both locks for the whole of `lantern_proc_show()` when one at a time
  would do: +1.

### Fidelity

**Faithful:** the ABBA mechanism, `D` state, hung-task message, lockdep's
circular-dependency report structure and "possible unsafe locking scenario",
lockdep's report-once behavior, `git log`/`show`/`diff`/`am` behavior and the patch
email format.
**Simplified:** hung-task timeout is compressed; lockdep's lock-class keys,
annotations and chain hashing are modelled only for the Lantern's locks; git is a
minimal built-in subset.

---

## 2.10a — Interrupt Spire: blinking

- **Region / NPC:** Interrupt Spire / ksoftirqd (the per-CPU softirq thread), init · **Tracks:** `kernel` · **Time:** ~18 min · **Prerequisites:** `drv-sysfs-procfs`, `mem-kmalloc`, `sync-mutex`, `c-container-of` · **Skills unlocked:** `irq-timers`, `sync-atomic-context`

This level is timers and the rule they bring: code that must not sleep. Spinlocks
wait for 2.10b, where an interrupt handler and a kworker share data.

### Scene

> **ksoftirqd:** Busy busy busy! Timers, packets, tasklets. Deliver, deliver!
>
> **init:** The Lantern should blink. That's a timer, isn't it?
>
> **ksoftirqd:** A `timer_list`. When it expires, its callback runs in **softirq
> context**. Usually right after an interrupt returns, on whichever CPU took it.
> When there's too much of that, the leftovers come to me, ksoftirqd, and I run
> them in my own thread. Either way: fast, and no sleeping. Strictly.
>
> **init:** The Lantern's mutex sleeps.
>
> **ksoftirqd:** Then the mutex stays home. And if a callback needs memory, it asks
> for `GFP_ATOMIC`. kswapd told you why.
>
> **ksoftirqd** (quieter): The last thing I ran the night it all went dark was a
> timer like yours. Its message was already gone. I ran it anyway. That's the job.

### See it (X-ray)

**Locks and timing view:** a timeline with two lanes, softirq and process
context. The blink timer fires every 500 ms on the softirq lane; a write to the
sysfs `blink` file runs on the process lane. X-ray marks which lane may sleep (only
process). Then the bad version: the callback takes `msg_lock`, and the lab prints
the real report (abridged):

```
BUG: sleeping function called from invalid context at kernel/locking/mutex.c:...
in_atomic(): 1, irqs_disabled(): 0, non_block: 0, pid: 0, name: swapper/0
```

X-ray shows why: the softirq borrowed whatever task was running (here the idle
task), and that task can't be put to sleep on the softirq's behalf. Run by
ksoftirqd, it would be the same rule: softirq context is atomic either way.

### Build it

Starter (blank): only the player's Lantern. The player adds:

- A **blink timer**: `timer_setup(&ldev->blink, lantern_blink_fn, 0)`, armed with
  `mod_timer(&ldev->blink, jiffies + msecs_to_jiffies(blink_ms))`. The callback
  finds its device with `timer_container_of(ldev, t, blink)` (2.8b's
  `container_of`, for timers), toggles the lamp state and re-arms itself with
  `mod_timer()`. `blink_ms` is a module parameter (2.3).
- A sysfs attribute `blink` (0/1). Its `store()` runs in process context, so it
  holds `msg_lock` (two writers to `blink` take turns): `1` arms the timer, `0`
  stops it with `timer_delete_sync()`, which deletes a pending timer and waits for a
  running callback, including one that is re-arming itself. The callback never
  takes `msg_lock`, so waiting for it under that lock can't deadlock.
- The lamp state is written only by the callback and read by `/proc/lantern`: mark
  both sides with `WRITE_ONCE()`/`READ_ONCE()`. Data that both sides _write_ needs a
  lock that works in atomic context, which 2.10b brings.
- Module exit, after the device and its attributes are gone:
  `timer_shutdown_sync(&ldev->blink)`. It waits like `timer_delete_sync()` and also
  makes every later `mod_timer()` on it a no-op, so nothing can bring it back while
  the device is torn down.

Checker verifies:

- `echo 1 > .../blink` toggles the lamp every `blink_ms` of simulated time;
  `echo 0` stops it within one period, and no timer is left pending.
- No "sleeping in atomic", lockdep or KASAN report under stress (sysfs writes and
  timer ticks interleaved by the harness, including a tick that interrupts a sysfs
  write on the same CPU).
- `rmmod` while blinking: no oops, no callback runs after unload, kmemleak clean.

### Watch it

**Choose and justify:** "The blink callback wants to show the current brightness,
which `msg_lock` guards. Can it take `msg_lock`?", then "because…": no, the
callback runs in softirq context and must not sleep. A second one: "It needs a
small buffer: `GFP_KERNEL` or `GFP_ATOMIC`?"

The Spire's beacon blinks.

```
ksh$ echo 1 > /sys/class/lantern/lantern/blink
ksh$ dmesg | tail -1
[ 1203.551204] lantern: blinking every 500 ms
ksh$ grep TIMER /proc/softirqs
      TIMER:       5821       6012
```

### Debrief

> **init:** The beacon blinks. Now the city wants more than a blink: the Lantern
> should dim itself when the sun comes up. There's a light sensor on the Spire.
>
> **ksoftirqd:** It raises an interrupt when the light changes. Hard-IRQ context!
> Even stricter than mine. Next floor up.

Next: the light sensor (2.10b).

### Hints

1. **Nudge:** Which of your functions run in the timer's lane? Mark each one "may
   sleep" or "must not sleep".
2. **Concept:** Timer callbacks run in softirq context: no mutex, no `GFP_KERNEL`,
   no `copy_to_user()`. `timer_delete_sync()` stops a timer and waits for a running
   callback; `timer_shutdown_sync()` does the same and refuses to be re-armed.
3. **Point at the spot:** In `lantern_exit()`, check the order: the `blink`
   attribute must be gone before the timer is shut down, and the timer before the
   device is freed.

### Codex (chapter: Interrupt Spire)

- **Kernel timers** (`kernel-timer`)
  - **Simple:** Run a function once, a little later; re-arm it to run again.
  - **Deep:** `struct timer_list`, `timer_setup()`, `mod_timer()` with an expiry in
    `jiffies` (`msecs_to_jiffies()`), `timer_container_of()` in the callback,
    `timer_delete_sync()` to stop it and wait for a running callback. Older code
    says `from_timer()` and `del_timer_sync()`. —
    https://docs.kernel.org/driver-api/basics.html (timer API) —
    `kernel/time/timer.c`, `include/linux/timer.h`
- **Softirqs and ksoftirqd** (`softirq`)
  - **Simple:** Deferred kernel work that runs right after interrupts, never asleep.
  - **Deep:** Timers, networking and a few others raise softirqs; they usually run
    in `irq_exit()` on the CPU that took the interrupt. When too many are pending,
    the per-CPU `ksoftirqd/N` thread runs the rest. Either way it is softirq
    context. `/proc/softirqs` counts them. —
    https://docs.kernel.org/kernel-hacking/hacking.html — `kernel/softirq.c`
    (`handle_softirqs()`, `run_ksoftirqd()`)
- **Atomic context** (`atomic-context`)
  - **Simple:** Places where code must not sleep, not even for a moment.
  - **Deep:** Hard and soft interrupts, timer callbacks, and anything holding a
    spinlock. No mutexes, no `GFP_KERNEL`, no `copy_to_user()`; allocate with
    `GFP_ATOMIC`. `CONFIG_DEBUG_ATOMIC_SLEEP` makes `might_sleep()` report
    mistakes. `READ_ONCE()`/`WRITE_ONCE()` mark plain shared reads and writes. —
    https://docs.kernel.org/kernel-hacking/hacking.html — `include/linux/preempt.h`,
    `kernel/sched/core.c` (`__might_sleep()`)
- **timer_shutdown_sync()** (`timer-shutdown`, deepens: `kernel-timer`)
  - **Simple:** Stop a timer for good before you tear down what it uses.
  - **Deep:** Like `timer_delete_sync()`, and later re-arming becomes a no-op. Added
    in 6.2 ("timers: Provide timer_shutdown[_sync]()") for teardown paths, where
    other code might still try to re-arm the timer. —
    https://docs.kernel.org/driver-api/basics.html (timer API) —
    `kernel/time/timer.c`

### Real-world card

```sh
sudo insmod lantern.ko blink_ms=500
echo 1 | sudo tee /sys/class/lantern/lantern/blink
sudo dmesg -w            # watch the blink log, Ctrl-C to stop
cat /proc/softirqs | head
ps -e | grep ksoftirqd
```

### Taint

- A mutex, `GFP_KERNEL` or anything else that sleeps in the timer callback: +5
  ("sleeping function called from invalid context").
- `timer_delete()` (not `_sync`) before freeing what the callback uses: +5; the
  callback may still be running on another CPU.
- No timer stop in exit: +5 (a callback into unloaded code).
- `GFP_ATOMIC` in process context "to be safe": +1 (wastes emergency reserves).

### Fidelity

**Faithful:** `timer_setup`/`mod_timer`/`timer_delete_sync`/`timer_shutdown_sync`
semantics, `timer_container_of`, `jiffies` and `msecs_to_jiffies`, softirq context
and what may sleep, softirqs on IRQ exit with ksoftirqd as the fallback, the
"sleeping function called from invalid context" report.
**Simplified:** one timer wheel with exact expiry; no high-resolution timers;
ksoftirqd's hand-off threshold is not modelled.

---

## 2.10b — Interrupt Spire: the light sensor

- **Region / NPC:** Interrupt Spire / ksoftirqd, init · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `sync-atomic-context`, `drv-error-unwinding`, `dbg-lockdep` · **Skills unlocked:** `irq-handlers`, `sync-spinlocks`, `irq-deferred-work`

### Scene

> **init:** The sensor raises an interrupt when the light changes. The Lantern
> should answer it.
>
> **ksoftirqd:** An interrupt handler runs in hard-IRQ context, with interrupts off
> on its CPU. Grab the reading, leave.
>
> **init:** Setting the brightness takes `msg_lock`. That's a mutex.
>
> **ksoftirqd:** Then it doesn't happen in the handler. Anything slow goes in a
> workqueue: a kworker does it later, in process context, where sleeping is fine.
>
> **init:** And the reading itself? The handler writes it, the kworker reads it,
> maybe on another CPU at the same moment.
>
> **ksoftirqd:** A **spinlock**. You wait by spinning, a few instructions at most,
> and never sleep while you hold it. If a handler takes it, everyone else takes it
> with interrupts off. Otherwise the handler interrupts you on your own CPU while
> you hold it, and spins forever.
>
> **init:** Two halves, then. A quick top half that answers the bell, and a bottom
> half that does the work.

### See it (X-ray)

**Locks and timing view**, three lanes now: hard-IRQ, softirq, process. One
pipeline: the sensor raises IRQ 11 → `lantern_irq()` runs on the IRQ lane (the
**top half**), stores the reading and calls `schedule_work()` → the handler
returns `IRQ_HANDLED` a few microseconds later → a kworker runs the work on the
process lane (the **bottom half**), takes the mutex and sets the brightness.

Then two bad versions:
1. The handler takes `msg_lock` itself. The lab prints the real "BUG: sleeping
   function called from invalid context" report, and X-ray marks the IRQ lane as
   "must not sleep", like 2.10a's softirq lane, only stricter.
2. The kworker takes `sensor_lock` with plain `spin_lock()`. The harness raises
   the IRQ on the same CPU while the kworker holds it: the handler spins on a lock
   its own CPU holds, and that CPU will never run the kworker again. X-ray shows the
   CPU stuck. lockdep (2.9) saw it coming the first time both uses happened:
   `WARNING: inconsistent lock state` / `inconsistent {IN-HARDIRQ-W} ->
   {HARDIRQ-ON-W} usage.` The snapshot restores.

### Build it

Starter (blank): only the player's Lantern and the lab's sensor helper. The player
adds:

- An **IRQ handler** for the simulated photocell: `request_irq(irq, lantern_irq, 0,
  "lantern", ldev)` at load. The handler reads the sensor value (lab helper),
  stores it under `sensor_lock` (a `spinlock_t`, `spin_lock_init()`; plain
  `spin_lock()` is enough here, since interrupts are already off in the handler),
  calls `schedule_work(&ldev->sensor_work)` and returns `IRQ_HANDLED`.
- A **work item** (`INIT_WORK(&ldev->sensor_work, lantern_sensor_work)`) that
  copies the reading out under `spin_lock_irqsave()`, then (outside the spinlock)
  takes `msg_lock`, sets the brightness and logs it.
- Teardown in exit, producers first: `free_irq()`, then `cancel_work_sync()`. A
  failed `request_irq()` at load unwinds what came before it (2.4).

Checker verifies:

- Raising the simulated IRQ 10 times increments the `lantern` line in
  `/proc/interrupts` by 10, and brightness follows the sensor value.
- The brightness update runs in a kworker, never in the handler.
- No "sleeping in atomic", lockdep or KASAN report under stress (IRQs, work and
  sysfs writes interleaved by the harness, including an IRQ on the CPU that holds
  `sensor_lock`).
- `rmmod` while an IRQ's work is pending: no oops, no work runs after unload,
  kmemleak clean.

### Watch it

**Order the path:** IRQ raised, `lantern_irq()`, `schedule_work()`, the handler
returns, the kworker runs the work, the brightness is set. X-ray replays it lane by
lane.

When the simulated dawn comes, the city dims.

```
ksh$ grep lantern /proc/interrupts
 11:         10          0   IO-APIC  11-edge      lantern
ksh$ dmesg | tail -1
[ 1203.551204] lantern: sensor 812 lux, brightness set to 37
```

(The `/proc/interrupts` chip and trigger columns are simulated but follow the real
layout.)

### Debrief

> **init:** The night watch wants more than a dimmer. They want to ask the sensor
> and _sleep_ until the light changes. You've seen a process sleep like that
> before.
>
> **ksoftirqd:** Sleep? Not in my lanes. One more floor, then.

Next: the night watch (2.10c).

### Hints

1. **Nudge:** Which of your two new functions is allowed to sleep? Mark each one.
   Then mark which ones touch the reading.
2. **Concept:** IRQ handlers run in hard-IRQ context and must be short; work items
   run in a kworker thread and may sleep. Data shared with a handler is protected by
   a spinlock that process context takes with `spin_lock_irqsave()`.
3. **Point at the spot:** In `lantern_exit()`, check the order: stop the thing that
   schedules work (`free_irq()`) before cancelling the work.

### Codex (chapter: Interrupt Spire)

- **Interrupt handlers** (`interrupt-handler`)
  - **Simple:** The function the kernel runs the instant a device rings: be quick.
  - **Deep:** `request_irq(irq, handler, flags, name, dev)`; the handler runs in
    hard-IRQ context with interrupts off on its CPU and returns `IRQ_HANDLED` or
    `IRQ_NONE` (not mine, for shared lines). The "top half"; anything slow is
    deferred. `/proc/interrupts` counts them. —
    https://docs.kernel.org/core-api/genericirq.html — `kernel/irq/manage.c`
    (`request_irq()`), `include/linux/interrupt.h`
- **Spinlocks** (`spinlock`)
  - **Simple:** A lock you wait for by spinning; hold it briefly and never sleep.
  - **Deep:** `spin_lock()`; `spin_lock_bh()` also holds off softirqs on this CPU
    (for data shared with a timer or softirq); `spin_lock_irqsave()` holds off hard
    interrupts (for data shared with a handler). Pick the variant from the most
    urgent context that takes the lock. On non-RT kernels it disables preemption;
    on PREEMPT_RT most spinlocks become sleeping locks. —
    https://docs.kernel.org/locking/spinlocks.html,
    https://docs.kernel.org/kernel-hacking/locking.html — `include/linux/spinlock.h`,
    `kernel/locking/spinlock.c`
- **Workqueues** (`workqueue`)
  - **Simple:** Work handed to a kernel thread to do later, where sleeping is fine.
  - **Deep:** The "bottom half" that runs in process context, in a kworker.
    `INIT_WORK()` sets a work item up, `schedule_work()` queues it on the system
    workqueue, `cancel_work_sync()` cancels it and waits for a running instance. —
    https://docs.kernel.org/core-api/workqueue.html — `kernel/workqueue.c`,
    `include/linux/workqueue.h`

### Real-world card

```sh
sudo insmod lantern.ko
cat /proc/interrupts | head
ps -e | grep kworker | head
```

A real VM has no photocell: the Lantern's real-world version uses a module
parameter to skip the IRQ part and a timer as a fake sensor, or you can try a GPIO
interrupt on a Raspberry Pi.

### Taint

- A mutex or `GFP_KERNEL` in the IRQ handler: +5.
- `spin_lock()` in the work for data the handler also takes: +5 (lockdep reports an
  inconsistent lock state; the lab can deadlock the CPU).
- Calling something that sleeps while holding `sensor_lock`: +5.
- Doing the brightness update directly in the IRQ handler instead of deferring: +1.
- No `cancel_work_sync()` before freeing what the work uses: +5.
- Returning `IRQ_NONE` for an interrupt the driver handled: +3.

### Fidelity

**Faithful:** `request_irq`/`free_irq`, `IRQ_HANDLED`, spinlock variants and the
same-CPU deadlock they prevent, lockdep's inconsistent-lock-state report,
`INIT_WORK`/`schedule_work`/`cancel_work_sync`, `/proc/interrupts` counting, which
contexts may sleep, the "sleeping function called from invalid context" report.
**Simplified:** the photocell is a lab device on a fixed IRQ given as a module
parameter, read through a lab helper instead of `ioremap()`/`readl()` and a
platform driver; no real interrupt controller; no PREEMPT_RT.

---

## 2.10c — Interrupt Spire: the night watch

- **Region / NPC:** Interrupt Spire / ksoftirqd, init, the Watchdog · **Tracks:** `kernel`, `userland` · **Time:** ~20 min · **Prerequisites:** `irq-deferred-work`, `io-pipes`, `net-poll`, `proc-signals` · **Skills unlocked:** `irq-wait-queues`

### Scene

> **init:** The night watch wants to _wait_ for dawn: read the sensor and sleep
> until the light changes. You've seen a process sleep like that before: `wc`,
> waiting on an empty pipe in the Aqueducts. Your harbor, sleeping in `poll`.
> Today you build the bed they slept in.
>
> **ksoftirqd:** Sleep? Up here? Not in my lanes. But your kworker can ring a bell
> when the reading changes, and whoever's asleep wakes up.
>
> **The Watchdog:** And if I need one of them to stop waiting, they'd better hear
> me. Ctrl-C works on sleepers, or it doesn't work at all.

### See it (X-ray)

**Locks and timing view:** first, a replay of 1.7's stuck pipeline from the
kernel's side. `wc` sits in `pipe_read()`, asleep on the pipe's wait queue
(`pipe->rd_wait`); `ls`'s `write` lands in `pipe_write()`, which wakes it. Then
the player presses Ctrl-C: the sleeping `read` returns `-ERESTARTSYS`, and signal
delivery turns that into death by `SIGINT`, `EINTR` or a silent restart, the
choice the player made with `SA_RESTART` in 1.8.

Then the Lantern's version, on 2.10b's three lanes: a `cat` on the process lane
calls `read()` and goes to sleep on the sensor's wait queue (state `S`, no CPU
used) → the sensor raises IRQ 11 → `lantern_irq()` schedules the work → the
kworker stores the new reading, then calls `wake_up_interruptible()` → the `cat`
wakes, checks its condition, finds a new reading and prints it. Same shape as the
pipe: a reader sleeps, a producer wakes it.

### Build it

Starter (blank): only the player's Lantern from 2.10b. The player adds:

- A second device node, `/dev/lantern-sensor` (minor 1 of the same driver, so
  2.4's registration and unwinding grow to two minors), with its own
  `file_operations`.
- A `wait_queue_head_t sensor_wq` (`init_waitqueue_head()`) and a counter
  `sensor_seq` that the 2.10b work item bumps, under `sensor_lock`, before it calls
  `wake_up_interruptible(&ldev->sensor_wq)`: change the condition first, then
  wake.
- The sensor's `read()`: at offset 0 it notes `sensor_seq`, sleeps in
  `wait_event_interruptible(ldev->sensor_wq, <sensor_seq has moved on>)`, then
  returns the new reading as one line and advances `*ppos`; at a later offset it
  returns `0` (2.5's EOF), so each `cat` prints one reading and exits. If a signal
  arrives while it sleeps, `wait_event_interruptible()` returns `-ERESTARTSYS`, and
  `read()` passes it on, exactly as `pipe_read()` does. Stretch (not required):
  with `O_NONBLOCK` and no new reading, return `-EAGAIN`.

Checker verifies:

- A reader blocked on `/dev/lantern-sensor` is in state `S` and uses no CPU; it
  wakes after the next IRQ's work runs and reads that value, then EOF.
- Two readers asleep at once both wake on one reading.
- The lab's scheduler runs the work between a reader's condition check and its
  sleep: the reader still wakes (no lost wake-up).
- Signals, through the player's own shell: Ctrl-C in `ksh-lite` while
  `cat /dev/lantern-sensor` sleeps kills `cat`, the shell survives (1.8), and
  `echo $?` prints `130`. A reader with a handler installed without `SA_RESTART`
  gets `EINTR`; with `SA_RESTART`, its `read()` restarts and waits again.
- Fault injection on the second minor's setup: the load fails cleanly and
  `/dev/lantern` is gone too (2.4).
- No lockdep or KASAN report under stress (IRQs, work and readers interleaved by
  the harness); `rmmod` after the readers exit is clean, kmemleak clean.

### Watch it

**Predict:** `cat /dev/lantern-sensor` is asleep and the player presses Ctrl-C.
What does `echo $?` print, and does `ksh-lite` survive? (`130`, `128 + SIGINT`,
and yes: the shell's 1.8 handler is untouched by the driver's sleep.)

When the simulated dawn comes, every sleeper in the night watch wakes at once and
calls out the reading.

```
ksh$ cat /dev/lantern-sensor
812
ksh$ cat /dev/lantern-sensor
^C
ksh$ echo $?
130
```

(The first `cat` sleeps, using no CPU, until the light changes; the second is
stopped while it sleeps.)

### Debrief

_A knock from below the Spire._

> **The Tollkeeper:** You, with the lamp. The city is talking again, and every word
> of it passes my Wall. Come and count it.

Next: the Netfilter Wall (2.11).

### Hints

1. **Nudge:** What should `read()` do when there is no new reading yet? What did
   `wc` do on an empty pipe?
2. **Concept:** `wait_event_interruptible(wq, condition)` sleeps until the
   condition is true or a signal arrives, and checks the condition again after
   every wake-up. The producer changes the condition first, then calls
   `wake_up_interruptible(&wq)`. A non-zero return means a signal: pass it on.
3. **Point at the spot:** In your work function, is `sensor_seq` bumped before or
   after `wake_up_interruptible()`? And in `read()`, what do you return when
   `wait_event_interruptible()` doesn't return `0`?

### Codex (chapter: Interrupt Spire)

- **Wait queues** (`wait-queue`, deepens: `pipe`)
  - **Simple:** Where a task sleeps until something it's waiting for happens.
  - **Deep:** `wait_event_interruptible(wq, condition)` sleeps until the condition
    is true or a signal arrives (then it returns `-ERESTARTSYS`); the producer calls
    `wake_up_interruptible(&wq)`, which wakes every non-exclusive sleeper. Blocking
    reads, pipes (1.7) and `poll()` (1.10) are built on it. —
    https://docs.kernel.org/driver-api/basics.html (wait queues) —
    `include/linux/wait.h`, `kernel/sched/wait.c`, `fs/pipe.c` (`pipe_read()`)
- **-ERESTARTSYS** (`erestartsys`, deepens: `eintr`)
  - **Simple:** The kernel's "a signal interrupted me"; user space never sees it.
  - **Deep:** On the way out, signal delivery turns it into `EINTR`, or restarts
    the syscall if the handler has `SA_RESTART` (or there is no handler and the
    signal didn't kill the task). — man 7 `signal` — `include/linux/errno.h`,
    `arch/x86/kernel/signal.c` (`handle_signal()`)

### Real-world card

```sh
sudo insmod lantern.ko
sudo timeout 5 cat /dev/lantern-sensor; echo $?   # 124: still asleep after 5 s
sudo sh -c 'cat /dev/lantern-sensor & sleep 1; ps -o pid,stat,comm -p $!'
```

The `S` in `ps` is the reader asleep on your wait queue. `cat /proc/<pid>/stack`
(as root) shows where.

### Taint

- A reader that can't be interrupted (`wait_event()` instead of the interruptible
  form): +3; Ctrl-C can't stop `cat`.
- Busy-waiting in `read()` instead of sleeping: +3.
- Waking before the new reading is stored (a lost wake-up the lab triggers): +3.
- Returning `-EINTR` instead of passing on `-ERESTARTSYS`: +1; `SA_RESTART` stops
  working.
- The second minor not unwound when its setup fails: +3.

### Fidelity

**Faithful:** wait queue semantics (`wait_event_interruptible`,
`wake_up_interruptible`, condition re-checked after every wake-up), `-ERESTARTSYS`
becoming `EINTR` or a restart, `-EAGAIN` with `O_NONBLOCK`, task state `S` while
asleep, exit status `130` after `SIGINT`.
**Simplified:** one wait queue and no exclusive waits; the photocell is still the
lab device from 2.10b.

---

## 2.11 — Netfilter Wall: a gate that counts packets

- **Region / NPC:** Netfilter Wall / the Tollkeeper (netfilter's hook points), init · **Tracks:** `kernel`, `net` · **Time:** ~20 min · **Prerequisites:** `net-poll`, `net-stack-path`, `sync-spinlocks`, `drv-module-params` · **Skills unlocked:** `sync-atomics`, `net-netfilter-hook`

### Scene

> **The Tollkeeper:** Every packet passes my Wall. At five gates: before routing,
> on the way in, forwarding, on the way out, after routing.
>
> **init:** The harbor the player built in Userland is still running. Can the
> Lantern watch its traffic?
>
> **The Tollkeeper:** Put a hook on the "local in" gate. I'll hand you each packet
> before it reaches a socket. You answer: accept, or drop.
>
> **init:** Accept. Always accept. We just want to _count_.
>
> **The Tollkeeper:** And be quick. You run in softirq context, on any CPU, many at
> once. No sleeping. No `printk` for every packet unless you want a flood.
>
> **init:** A counter that many CPUs bump at once. The spinlock from the Spire?
>
> **The Tollkeeper:** For one number? Use an atomic counter. The CPU adds one in a
> single step that no other CPU can split.

### See it (X-ray)

**Network view (Act I) + Locks and timing view:** a chat message from the Act I
client travels socket → TCP → IP → loopback → back up through `ip_rcv()` →
`NF_INET_PRE_ROUTING` → routing → `NF_INET_LOCAL_IN` → TCP → the server's socket.
X-ray highlights the two netfilter gates and shows they run on the softirq lane.

### Build it

Starter (blank): only the player's Lantern, and the player's own `harbor` binary
from 1.10, rebuilt with their Act I `Makefile`. The player adds:
- A read-only module parameter `chat_port` (2.3's pattern, `0444`), default 7777,
  the port `harbor` listens on.
- A `struct nf_hook_ops` with `.hook = lantern_nf_hook`, `.pf = NFPROTO_IPV4`,
  `.hooknum = NF_INET_LOCAL_IN`, `.priority = NF_IP_PRI_FIRST`, registered with
  `nf_register_net_hook(&init_net, &ops)` and removed with
  `nf_unregister_net_hook()`.
- `lantern_nf_hook(void *priv, struct sk_buff *skb, const struct nf_hook_state *state)`:
  if `ip_hdr(skb)->protocol == IPPROTO_TCP`, read the TCP header with
  `skb_header_pointer()`, and if `th->dest == htons(chat_port)`, count it with
  `atomic64_inc()` on an `atomic64_t`. Always return `NF_ACCEPT`.
- A sysfs attribute `chat_packets` (read-only, `atomic64_read()`); the Lantern's
  glow follows the rate.

Checker verifies:
- Running the player's own `harbor` from Act I and 3 `nc` clients sending 20
  messages: `chat_packets` equals the lab's own count of TCP segments received for
  that port (including handshakes and ACKs), exactly. If the player's `harbor`
  itself misbehaves, the checker says so and offers the reference server.
- `chat_port` defaults to 7777 and appears read-only in
  `/sys/module/lantern/parameters/`; loaded with `chat_port=7778`, the hook counts
  that port instead.
- Packets to other ports and UDP packets are not counted.
- Chat still works: every message arrives (nothing dropped).
- 2 CPUs receiving at once: no lost counts, no lockdep or atomic-sleep report.
- After `rmmod`, packets still flow and nothing calls the hook.

### Watch it

**Order the path:** the player orders a chat message's trip from the client's
`write()` to the server's `read()`: socket, TCP, IP, loopback device, `ip_rcv()`,
`NF_INET_PRE_ROUTING`, routing, `NF_INET_LOCAL_IN` (their hook), TCP, the server's
socket. The network view replays it.

The Wall glows brighter with every chat message the city sends.

```
ksh$ cat /sys/class/lantern/lantern/chat_packets
0
ksh$ echo hello Deep | nc -q 1 localhost 7777
welcome to the harbor
ksh$ cat /sys/class/lantern/lantern/chat_packets
6
```

(`welcome to the harbor` is the player's own 1.9 greeting. A short TCP session:
SYN, ACK, data, then FIN/ACK exchanges arriving at the server; the exact number
depends on the session and is checked against the lab's count, not a constant.)

### Debrief

> **The Tollkeeper:** Busiest the Wall's been since the Kernelfall.
>
> **init:** Every region of the Deep is lit, except the corner where it happened.
> Watchdog. They've earned it. Open the record.
>
> **The Watchdog:** …Fine. It's been in pstore since that night. I never deleted it.

Next: the finale (2.12).

### Hints

1. **Nudge:** Your hook sees every IPv4 packet that arrives for this machine. How
   do you know which ones belong to the chat server?
2. **Concept:** Port numbers in headers are big-endian (network byte order). The
   TCP header may not be in the linear part of the `skb`;
   `skb_header_pointer()` copies it safely when needed.
3. **Point at the spot:** Compare `th->dest` with `htons(chat_port)`, not with
   `chat_port`.

### Codex (chapter: Netfilter Wall)

- **Netfilter hooks** (`netfilter-hook`, deepens: `packet-path`)
  - **Simple:** Checkpoints in the network stack where a module can see every packet.
  - **Deep:** Five IPv4 hook points (`PRE_ROUTING`, `LOCAL_IN`, `FORWARD`,
    `LOCAL_OUT`, `POST_ROUTING`); a hook returns a verdict (`NF_ACCEPT`,
    `NF_DROP`, …) and runs in softirq context on receive. iptables, nftables and
    conntrack are built on them. Hooks are registered per network namespace. —
    https://wiki.nftables.org/wiki-nftables/index.php/Netfilter_hooks —
    `net/netfilter/core.c`, `include/linux/netfilter.h`,
    `include/uapi/linux/netfilter_ipv4.h`, `net/ipv4/ip_input.c`
- **Atomic counters** (`atomic-counter`)
  - **Simple:** A number many CPUs can bump at once without a lock.
  - **Deep:** `atomic_t`/`atomic64_t` give read-modify-write operations
    (`atomic64_inc()`, `atomic_dec_and_test()`) that can't be split by another CPU
    or an interrupt. Right for one counter; anything bigger needs a lock. Very hot
    counters use per-CPU variables instead. —
    https://docs.kernel.org/core-api/wrappers/atomic_t.html — `include/linux/atomic.h`
- **sk_buff (preview)** (`sk-buff`)
  - **Simple:** The kernel's packet: the data plus its headers and bookkeeping.
  - **Deep:** `struct sk_buff` carries the data, header offsets (`ip_hdr()`) and
    metadata; non-linear packets need `skb_header_pointer()`. Act III goes deep. —
    https://docs.kernel.org/networking/skbuff.html — `include/linux/skbuff.h`

### Real-world card

```sh
sudo insmod lantern.ko chat_port=7777
./harbor &
echo "hello" | nc -q 1 localhost 7777
cat /sys/class/lantern/lantern/chat_packets
sudo tcpdump -i lo -n tcp port 7777     # compare the count with what tcpdump sees
sudo nft list ruleset                  # nftables uses the same hook points
```

### Taint

- Counter updated without a lock or atomic: +5 (lost counts on two CPUs).
- A spinlock around one counter: +1 (correct, but an atomic does it in one step).
- `pr_info()` for every packet: +1 (use `pr_info_ratelimited()` or no log at all).
- Returning `NF_DROP` for anything, or `NF_STOLEN` without consuming the skb: +5.
- Missing `nf_unregister_net_hook()`: +5, the next packet after `rmmod` jumps into
  freed module code and oopses.
- Reading `tcp_hdr()` without checking the protocol: +3.

### Fidelity

**Faithful:** hook points, `nf_hook_ops` fields, hook signature, verdicts,
`skb_header_pointer`, byte order, loopback traffic passing `LOCAL_IN`, softirq
context.
**Simplified:** only `init_net` exists (real drivers usually register per
namespace with `pernet_operations`); IPv4 only; no conntrack, GRO or real NIC.

---

## 2.12 — Finale: The Dangling

- **Region / NPC:** The whole Deep / the Dangling (the bug pattern), init, the Watchdog, every NPC (cameos) · **Tracks:** `kernel`, `debug` · **Time:** ~25 min · **Prerequisites:** `dbg-kasan`, `mem-object-lifetime`, `irq-timers`, `sync-deadlock-lockdep` · **Skills unlocked:** `mem-uaf-fix` (and assesses `dbg-kasan`, `mem-object-lifetime`, `irq-timers`)

### Scene

> **The Watchdog:** Here. The whole record, as pstore kept it.
>
> **init** (reading): "general protection fault… address `0x6b6b6b6b6b6b6b6b`…
> `lantern_fade_fn`… Fatal exception in interrupt." The old Lantern. The one
> before yours.
>
> **kswapd** (from the Mines): `6b`. Freed memory. Told you something was reading
> the empty carts.
>
> **init:** The old driver's source is still in the archive. Its messages faded: a
> timer dimmed the oldest message a little every tick.
>
> **The Watchdog:** The poison says "freed". It doesn't say who freed it, or why
> the timer still had its address. Nobody could tell. That kernel had no eyes.
>
> **init:** Yours does. Build the fade into your Lantern, the way the old one
> worked. If the old mistake is in there, KASAN will name it.

### See it (X-ray)

**Memory + Locks and timing views:** first, 1.1's memory panel, one frame: the
arrow from `copy` to a grey, freed box. "That's a dangling pointer. Don't follow
it." Then the archived crash, replayed with the old source beside it. The old
Lantern kept its history on a list; one timer in the device faded the oldest
message through a raw `struct lantern_msg *fading`, a pointer that held no
reference. A write evicts that message (the history's reference is dropped, it was
the last) → `kfree()` → the cart turns grey and fills with `6b` (the old Machine
booted with slab poisoning). On the softirq lane, the fade timer was still queued →
fires → reads the freed message, follows its list pointer, now
`0x6b6b6b6b6b6b6b6b` → general protection fault → an oops in interrupt context →
panic. The record (abridged; the `<n>[time]` prefixes are cut):

```
Panic#1 Part1
Oops: general protection fault, probably for non-canonical address 0x6b6b6b6b6b6b6b6b: 0000 [#1] SMP NOPTI
CPU: 1 UID: 0 PID: 0 Comm: swapper/1 Tainted: G           O        6.18.0 #1 PREEMPT(voluntary)
Tainted: [O]=OOT_MODULE
RIP: 0010:lantern_fade_fn+0x2f/0x90 [lantern]
Call Trace:
 <IRQ>
 call_timer_fn+0x...
 __run_timers+0x...
 run_timer_base+0x...
 run_timer_softirq+0x...
 handle_softirqs+0x...
 </IRQ>
Kernel panic - not syncing: Fatal exception in interrupt
```

Then the same replay on a KASAN kernel: the first bad read is stopped and reported
in `lantern_fade_fn`, with who allocated the message and who freed it.

### Build it

Starter (blank): only the player's Lantern, the sum of every Act II level. The
player adds the fade feature, following the old driver's design:
- `struct lantern_msg` gains `unsigned int glow`; new messages start at 255.
- `struct lantern_dev` gains `struct timer_list fade` and `struct lantern_msg
  *fading`: the message the fader is dimming, the oldest in the 2.9b history.
- `lantern_fade_fn()` finds the device with `timer_container_of(ldev, t, fade)`,
  lowers `ldev->fading->glow` (`WRITE_ONCE()`), and re-arms itself every 200 ms
  until it reaches 0. `/proc/lantern` shows each message's glow.
- When a write changes the history, the fader moves to the new oldest message and
  is armed again.

**The Dangling.** `fading` is a pointer that outlives any reference: nothing stops
the history from dropping the last reference to the message it points at. A first
version usually drops the evicted message and then moves the fader, or moves the
fader first and then drops the message. Both leave a window: a tick on another CPU
may already have read the old pointer. The lab replays the night of the
Kernelfall (six quick writes, so the oldest falls out of the history and is freed
while its fade tick is due), and the harness opens exactly that window. KASAN
reports it, and the Dangling speaks for the first time, from the report.

The player reads the report (the 2.8b skill) and fixes the lifetime. Either fix
passes; the checker tests behavior:
1. **Stop, move, then drop.** In the write path, `timer_delete_sync(&ldev->fade)`
   (it waits for a running tick; the write path holds `msg_lock`, which the
   callback never takes, so the wait can't deadlock), point `fading` at the new
   oldest, re-arm, and only then `kref_put()` the evicted message.
2. **The fader holds its own reference.** `kref_get()` when it takes a message,
   `kref_put()` when it lets go (in the callback once glow reaches 0, or in the
   write path after stopping the timer). A put from the callback runs the release
   function in softirq context, which is fine only because it just calls `kfree()`.

Module exit shuts the timer down for good with `timer_shutdown_sync(&ldev->fade)`
(2.10a) before the history and the device are freed.

If the player's first version is already correct, the Dangling is cornered
immediately; the level then asks them to move the `kref_put()` before the stop in
a scratch copy and reproduce the report, so everyone reads it.

Checker verifies:
- The replay and 100 other forced interleavings of write/evict/tick run with no
  KASAN report, no oops, no lockdep or "sleeping in atomic" report.
- Glow values fade correctly for live messages, oldest first.
- kmemleak clean after `rmmod` (the fix must not leak the message to "avoid" the bug).
- `rmmod` with a fade pending is clean; no tick runs after unload.

### Watch it

**Point at it:** the KASAN report on the buggy version. The player clicks _what_
(a use-after-free, a read of 4 bytes: `glow`), _where_ (`lantern_fade_fn`, in a
timer softirq, "by task swapper/0" only because the CPU was idle), _who allocated_
(`lantern_write`), _who freed_ (`lantern_msg_release` via the history), and the
object (4 bytes into a freed 32-byte message) (abridged; addresses, offsets and the
shadow rows differ every run):

```
==================================================================
BUG: KASAN: slab-use-after-free in lantern_fade_fn+0x3c/0xb0 [lantern]
Read of size 4 at addr ffff888006b2e264 by task swapper/0/0

CPU: 0 UID: 0 PID: 0 Comm: swapper/0 Tainted: G           O        6.18.0-lantern #1 PREEMPT(voluntary)
Tainted: [O]=OOT_MODULE
Call Trace:
 <IRQ>
 dump_stack_lvl+0x...
 print_report+0x...
 kasan_report+0x...
 lantern_fade_fn+0x3c/0xb0 [lantern]
 call_timer_fn+0x...
 __run_timers+0x...
 run_timer_base+0x...
 run_timer_softirq+0x...
 handle_softirqs+0x...
 __irq_exit_rcu+0x...
 irq_exit_rcu+0x...
 sysvec_apic_timer_interrupt+0x...
 </IRQ>
 <TASK>
 asm_sysvec_apic_timer_interrupt+0x...
 ...
 </TASK>

Allocated by task 301:
 kasan_save_stack+0x...
 kasan_save_track+0x...
 __kasan_kmalloc+0x...
 __kmalloc_noprof+0x...
 lantern_write+0x.../0x... [lantern]
 vfs_write+0x...
 ksys_write+0x...
 do_syscall_64+0x...

Freed by task 306:
 kasan_save_stack+0x...
 kasan_save_track+0x...
 kasan_save_free_info+0x...
 __kasan_slab_free+0x...
 kfree+0x...
 lantern_msg_release+0x.../0x... [lantern]
 lantern_history_push+0x.../0x... [lantern]
 lantern_write+0x.../0x... [lantern]
 vfs_write+0x...

The buggy address belongs to the object at ffff888006b2e260
 which belongs to the cache kmalloc-32 of size 32
The buggy address is located 4 bytes inside of
 freed 32-byte region [ffff888006b2e260, ffff888006b2e280)
...
Memory state around the buggy address:
 ffff888006b2e180: 06 fc fc fc 00 00 06 fc fc fc 00 00 06 fc fc fc
>ffff888006b2e200: 00 00 06 fc fc fc 00 00 06 fc fc fc fa fb fb fb
                                                       ^
 ffff888006b2e280: fc fc 00 00 06 fc fc fc 00 00 06 fc fc fc 00 00
==================================================================
```

> **The Dangling** (from the report): Eyes? Ha. I'm just a pointer. Pointers are
> allowed.
>
> **The Watchdog:** Not ones to freed memory.

When the fix is in, the replay runs to the end. The last dark corner of the Deep
lights up; the fader lets go before the message does, the Dangling's pointer points
at nothing, and it's gone.

### Debrief

> **init:** It's gone. Not dead, a pattern doesn't die. Gone from your Lantern.
>
> **The Watchdog:** And the next driver that keeps a pointer to something it
> doesn't own?
>
> **init:** Then tell the world how this one was fixed, so the next one reads it.
> Mainline is that way.

Next: the epilogue (2.13).

### Hints

1. **Nudge:** Read the three stacks in the report. The access, the allocation and
   the free each happened in a different place. What could still reach the message
   after it was freed?
2. **Concept:** A pointer that can be used later is a claim on the object. Either
   it holds a reference, or whatever uses it is stopped before the last reference is
   dropped. Moving the pointer first is not enough: a tick may already have read it.
3. **Point at the spot:** In the write path where the oldest message leaves the
   history: what happens to `ldev->fading` and the fade timer before the
   `kref_put()`?

### Codex (chapter: The Dangling)

- **Use-after-free** (`use-after-free`, deepens: `dangling-pointer`)
  - **Simple:** Using memory after it was freed: the kernel's most dangerous mistake.
  - **Deep:** The slab may already have given the memory to someone else, so reads
    return garbage and writes corrupt another object; the crash often comes later,
    somewhere unrelated. With slab poisoning, freed memory reads as `0x6b` and a
    followed pointer faults at `0x6b6b6b6b6b6b6b6b`; KASAN catches the first bad
    access and names the allocation and the free. One of the most common kernel
    bug classes, and often exploitable. —
    https://docs.kernel.org/dev-tools/kasan.html — `mm/kasan/report.c`, `mm/slub.c`
- **Stop before you free** (`stop-before-free`, deepens: `kref`)
  - **Simple:** Before an object goes, stop everything that could still reach it.
  - **Deep:** Every pointer that can be used later (a timer's, a work item's, an
    IRQ handler's) either holds a reference or is stopped first:
    `timer_delete_sync()`, `cancel_work_sync()`, `free_irq()`, then the put or the
    free. Never wait for a callback while holding a lock it takes. —
    https://docs.kernel.org/core-api/kref.html — `kernel/time/timer.c`,
    `kernel/workqueue.c`
- **pstore and ramoops** (`pstore-ramoops`, deepens: `pstore`)
  - **Simple:** How the old crash log survived the reboot that followed it.
  - **Deep:** On the oops and panic, `kmsg_dump()` wrote the log's tail into the
    ramoops region; RAM keeps it across a warm reboot, and the next boot shows it as
    `/sys/fs/pstore/dmesg-ramoops-0` (a "Panic#1 Part1" header, then the lines). —
    https://docs.kernel.org/admin-guide/ramoops.html — `fs/pstore/ram.c`,
    `fs/pstore/platform.c`

### Real-world card

On the KASAN kernel from 2.1, in a VM:

```sh
git switch -c dangling-repro         # the buggy version
make && sudo insmod lantern.ko
for i in $(seq 6); do echo "msg $i" | sudo tee /dev/lantern >/dev/null; done
sleep 1
sudo dmesg | grep -A60 'BUG: KASAN'
cat /proc/sys/kernel/tainted
# Turn a raw address into a source line:
./scripts/faddr2line lantern.ko lantern_fade_fn+0x3c/0xb0   # from a kernel tree
```

On a real machine the race may need a few tries; KASAN catches it as soon as it
happens, which is the whole point. Search the kernel's history for the same
mistake in real drivers: `git log --oneline --grep='use-after-free' -- drivers/ |
grep -i timer`.

### Taint

- "Fixing" by never freeing the message (leak): +5, and caps the ending at
  "unstable" (see Taint endings).
- `timer_delete()` (non-sync) or a `msleep()` before the put: +5; still races.
  (Older guides call it `del_timer()`, removed before 6.18.)
- Moving `fading` to the next message before the put, without stopping the timer:
  +5; a tick on another CPU may already hold the old pointer.
- Waiting for the timer while holding a lock the callback takes: +5 (deadlock;
  lockdep reports it).
- Checking `glow` in the callback to "detect" freed memory: +5; freed memory can
  contain anything.
- No `timer_shutdown_sync()` (or `timer_delete_sync()`) in exit: +5.

### Fidelity

**Faithful:** the bug pattern (a timer's raw pointer outliving its kref'd object),
timer softirq context, the poison-pointer GPF and "Fatal exception in interrupt"
panic, KASAN report structure (bug type, access size, three stacks, cache and
offset, shadow bytes), `B` taint, pstore record naming, `timer_delete_sync` and
`timer_shutdown_sync` semantics.
**Simplified:** the race is forced by the lab scheduler; KASAN shadow is
modelled per allocation, not per real memory page; the pstore record and the old
driver's source are story artifacts; inline frame and offset numbers are plausible,
not computed from real machine code.

---

## 2.13 — Epilogue: Mainline

- **Region / NPC:** Mainline / the Maintainer (a subsystem maintainer on the mailing list), init, the Watchdog · **Tracks:** `kernel` · **Time:** ~20 min · **Prerequisites:** `mem-uaf-fix`, `kdev-read-source` · **Skills unlocked:** `kdev-coding-style`, `kdev-patch`, `kdev-dev-process`

### Scene

> **init:** You fixed it. Now tell the world, so nobody builds the same bug again.
>
> **The Maintainer:** Patches go to the list as plain-text email. One fix per
> patch. A subject that says what it does. A body that says _why_.
>
> **The Watchdog:** Just write "fixed bug". Done.
>
> **The Maintainer:** You can. I'll just reply "what bug?". Show the KASAN report,
> trimmed. Point at the commit that broke it with a Fixes tag. Sign it off.
>
> **The Watchdog:** And run checkpatch. Nobody wants to read your tabs-versus-spaces
> war.
>
> **The Maintainer:** If I ask for changes, send a v2. Don't take it personally.
> Everyone gets a v2.

### See it (X-ray)

**Git and patches view** (from 2.9b): the Lantern's history as a chain of commits,
the salvaged history patch among them. The player sees the commit "lantern: fade
old messages" (the finale's feature) and the fix on top of it. Then an annotated
patch email, the same parts as the one they applied with `git am`: subject line,
body, tags, `---`, diffstat, diff.

### Build it

Starter (blank): the Lantern's git history and the player's fix from 2.12. The
player:
- Commits the fix with a message like:

  ```
  lantern: stop the fade timer before dropping an evicted message

  When a write evicts the oldest message from the history,
  lantern_history_push() drops its reference, which can free it. The fade
  timer may still point at that message through ldev->fading, so its next
  tick reads and writes freed memory:

    BUG: KASAN: slab-use-after-free in lantern_fade_fn+0x3c/0xb0 [lantern]
    Read of size 4 at addr ffff888006b2e264 by task swapper/0/0

  Stop the timer with timer_delete_sync() and move it to the next oldest
  message before dropping the reference. The callback takes no locks, so
  waiting for it under msg_lock is safe.

  Fixes: 3f9a2c41b7de ("lantern: fade old messages")
  Signed-off-by: Your Name <you@machine.example>
  ```

- Runs `./scripts/checkpatch.pl --strict` on the patch and fixes any problems.
- `git format-patch -1`, finds recipients with `./scripts/get_maintainer.pl`,
  sends it (simulated `git send-email`).
- Gets a review asking for one change (for example "please say why moving the
  pointer first isn't enough") and sends `v2` with `git format-patch -v2`, a
  changelog below the `---` line.

Checker verifies (behavior of the patch, not wording):
- The patch applies cleanly with `git am` on the pre-fix tree, builds, and the
  fixed tree passes the finale replay with no KASAN report.
- `checkpatch.pl --strict` reports 0 errors and 0 warnings.
- The `Fixes:` tag names the commit that introduced the fade (12+ character
  hash and the subject in quotes, matching `git log`), and there is a valid
  `Signed-off-by:` line.
- The subject has the `lantern: ` prefix, is in imperative mood (checked by a
  small list of rules, explained in the hint), and fits in 75 characters.
- v2 has `[PATCH v2]` in the subject and a changelog under `---` (not in the
  commit message).

### Watch it

**Point at it:** the player finds `timer_delete_sync()` in `kernel/time/timer.c`
and clicks the kernel-doc sentence that justifies the fix ("Upon exit the timer is
not queued and the handler is not running on any CPU"; the last source dive). In
the `get_maintainer.pl` output they click the person to send the patch to and the
list to copy; in the timeline of a release (merge window, `-rc` weeks, release,
stable), they point at where their fix lands first.

The Maintainer replies: "Applied, thanks!" The patch appears in the Machine's
`git log`.

```
ksh$ ./scripts/checkpatch.pl --strict 0001-lantern-stop-the-fade-timer-before-dropping-an-evict.patch
total: 0 errors, 0 warnings, 0 checks, 24 lines checked

0001-lantern-stop-the-fade-timer-before-dropping-an-evict.patch has no obvious style problems and is ready for submission.
```

(`git format-patch` cuts long subjects so the file name, without `.patch`, stays
within 57 characters (`--filename-max-length`, 64 by default, counts the suffix);
the v2 file is `v2-0001-lantern-stop-the-fade-timer-before-dropping-an-ev.patch`.
The line count depends on the diff.)

### Debrief

The Watchdog starts the reboot. The ending plays according to Act II's Taint
(clean, unstable, or the Dangling survives), then T2 unlocks on the Kernel Map.
During the reboot, a fourth device answers on the PCI bus: Act III, The Core,
begins ([act-3-the-core.md](act-3-the-core.md#story-arc)).

> **init:** Whatever the next kernel finds, it won't find this one.
>
> **The Watchdog:** Rebooting. Don't make me do it again.

### Hints

1. **Nudge:** Imagine a reviewer who has never seen the Lantern. What do they need
   to know to trust this small change?
2. **Concept:** Subject: `subsystem: imperative summary`. Body: the problem, its
   effect, why the fix is right. Tags at the end: `Fixes:` (which commit broke it),
   `Signed-off-by:` (the Developer's Certificate of Origin). Version notes go under
   `---` so they don't end up in git history.
3. **Point at the spot:** `git log --oneline --abbrev=12` shows the hash and
   subject you need for the `Fixes:` line.

### Codex (chapter: Mainline)

- **Submitting patches** (`submitting-patches`, deepens: `git-basics`)
  - **Simple:** How a fix travels: a plain-text email that says why, to the right people.
  - **Deep:** One logical change per patch, a description of the problem and the
    fix, `Signed-off-by`, tags like `Fixes:`, `Reported-by:`,
    `Cc: stable@vger.kernel.org` for fixes that should be backported;
    `git format-patch`, `git send-email` or `b4`. —
    https://docs.kernel.org/process/submitting-patches.html —
    `Documentation/process/submitting-patches.rst`, `MAINTAINERS`
- **checkpatch.pl** (`checkpatch`)
  - **Simple:** A script that checks a patch against the kernel's style rules.
  - **Deep:** Catches style and common mistakes; not the final word, but reviewers
    expect a clean run. `--strict` adds the "CHECK" level. —
    https://docs.kernel.org/dev-tools/checkpatch.html — `scripts/checkpatch.pl`
- **Coding style** (`coding-style`)
  - **Simple:** Tabs of 8, short lines: one look that every reviewer reads fast.
  - **Deep:** 80-column preference, kernel-doc comments, `goto` error unwinding,
    no typedefs for structs. — https://docs.kernel.org/process/coding-style.html —
    `Documentation/process/coding-style.rst`, `.clang-format`
- **Signed-off-by and the DCO** (`signed-off-by`)
  - **Simple:** Your signature that you may contribute this code.
  - **Deep:** `Signed-off-by:` certifies the Developer's Certificate of Origin: you
    wrote the change or have the right to submit it under the kernel's license. No
    sign-off, no merge. — https://docs.kernel.org/process/submitting-patches.html —
    `Documentation/process/submitting-patches.rst`
- **How mainline works** (`mainline-process`)
  - **Simple:** Maintainers collect patches; Linus merges them in a two-week window.
  - **Deep:** Patches go to the maintainer and list that `get_maintainer.pl` names.
    Every release opens a two-week merge window, then weekly release candidates
    (`-rc1`, `-rc2`, …) until the release. Fixes are backported to stable releases,
    and one release a year becomes a longterm (LTS) release, like the 6.18 this game
    follows. — https://docs.kernel.org/process/development-process.html —
    `MAINTAINERS`, `scripts/get_maintainer.pl`

### Real-world card

In a kernel tree (any small, real fix you made, or a typo in a comment):

```sh
git commit -s                       # -s adds Signed-off-by
git log --oneline --abbrev=12 -3
git format-patch -1 --base=auto -o out/
./scripts/checkpatch.pl --strict out/0001-*.patch
./scripts/get_maintainer.pl out/0001-*.patch
git send-email --dry-run --to=<maintainer> --cc=<list> out/0001-*.patch
```

The `b4` tool (`b4 prep`, `b4 send`) automates much of this. Read
`Documentation/process/submitting-patches.rst` and lurk on the relevant list
before your first real submission; Documentation/process/ also has a guide for
newcomers.

### Taint

- `checkpatch.pl` errors: +3; warnings: +1 each kind (capped).
- Missing or wrong `Fixes:` tag: +1.
- Changelog for v2 inside the commit message instead of under `---`: +1.
- A patch that also reformats unrelated code: +3 (one logical change per patch).
- An HTML or attachment-style email (the simulated mailer can be switched to it): +1.

### Fidelity

**Faithful:** commit message conventions, tag formats, `checkpatch.pl` output
shape, `git format-patch` naming and `[PATCH v2]`, the `---` convention,
`get_maintainer.pl` purpose.
**Simplified:** `checkpatch.pl` runs a subset of its rules in the lab; the
mailing list, the Maintainer and their review are scripted; git is a minimal
built-in subset (`log`, `show`, `diff`, `commit`, `am`, `format-patch`, `switch`).

---

## T2 — Take it home: the Lantern on a real kernel (optional)

An optional quest that unlocks after the epilogue, and the strongest proof the
promise is true. The kit holds the player's own Lantern, a real `Kbuild` and
`Makefile`, `lanternctl`, a stress script and the success criteria. It runs in a
virtual machine with a 6.18 kernel and its headers, ideally built with
`CONFIG_KASAN`, `CONFIG_PROVE_LOCKING` and `CONFIG_DEBUG_KMEMLEAK` (the kit explains
how). The safety note comes first: never load your module on a computer you depend
on. The tasks and criteria are in
[CURRICULUM.md section 3](../CURRICULUM.md#3-take-it-home-tasks):
build out of tree with no warnings, load and use every interface, survive the
stress script with a clean `dmesg`, a clean kmemleak scan, a clean unload and a
clean `checkpatch.pl`. Reward: a Codex badge. No Taint, no score, nothing is locked
behind it. The kit is tested in CI against the pinned kernel.
