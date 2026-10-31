# Levels

How to build a level, and how the levels fit together as one journey. The story and
systems are in [GAME.md](GAME.md); the spec of every level is in
[`docs/levels/`](levels/):

| File                                          | Levels                                                      |
| --------------------------------------------- | ----------------------------------------------------------- |
| [prologue.md](levels/prologue.md)             | P.1–P.10 (P.5–P.9 skippable with a placement check)         |
| [surface-survey.md](levels/surface-survey.md) | S.1–S.5 (skippable with a placement check)                  |
| [act-1-userland.md](levels/act-1-userland.md) | 1.0–1.10, the Syscall Gate (1.B), T1                        |
| [act-2-the-deep.md](levels/act-2-the-deep.md) | 2.1–2.13 with 2.8a–b, 2.9b, 2.10a–c, T2                     |
| [act-3-the-core.md](levels/act-3-the-core.md) | 3.1–3.22 (3.10, 3.17 and 3.19 are optional side levels), T3 |

## 1. Level anatomy

Content lives in `packages/levels/content/` and mirrors the Kernel Map: act → region →
level. A number prefix gives the play order (`10-x` comes after `9-y`); ids never
include it.

```
packages/levels/content/
  skills.yaml                  the skill tree, matching CURRICULUM.md
  bedrock.yaml                 the map's bottom layer, under every act
  field-guide.yaml             the Codex page of commands and folders
  xray/
    syscalls.yaml              what X-ray knows of each syscall: args, kernel path, sources, a sentence
    narration.yaml             every word X-ray's storyboards say, with {placeholders}
  0-prologue/
    act.yaml
    1-boot-path/
      region.yaml
      placement.yaml           optional: the check that lets players skip the region's levels
      02-first-words/
        level.yaml             objectives, hints, Taint rules, codex, fidelity, lab
        story.md               scene, debrief, real-world card
        checker.ts             optional: what level.yaml can't declare
        starter/               the player's code at the start, opened in the editor
        solution/              the reference solution, loaded only when asked for
  1-act-1/
    2-process-district/
      04-run-anything/
```

A level's id is `<act id>-<region id>-<level folder>`
(`act1-process-district-04-run-anything`); the loader checks that `level.yaml` says
the same. The Surface Survey is a region of the prologue act
(`prologue-surface-survey-01-streets`).

### `act.yaml`, `region.yaml`, `bedrock.yaml`, `skills.yaml`

- **`act.yaml`:** `id` (`prologue`, `act1`, `act2`, `act3`), `name`, `layer` (the
  act's map layer).
- **`region.yaml`:** `id` (the folder name after its number), `name`, `boss`,
  `caption`, `source`, `guide`, and `slots` in play order, each
  `{ number, title, level?, optional?, summary?, minutes? }`. A region is drawn in its act's layer, in
  a `layer` of its own (the Syscall Gate), or in another act's layer named by
  `inLayer` (the Survey in Userland).
- **`placement.yaml`** (optional, beside `region.yaml`): `offer` (init's line),
  `minutes`, and `tasks` in play order, each `{ level, task, files?, objectives }`:
  the level folder it stands for, what init asks, the starter files it opens, and
  objective ids of that level. Each task is judged by its level's whole checker
  (declared checks and `checker.ts`); a passed task places the player past its level,
  a failed one sends them to it. No Taint, no timer.
- **`field-guide.yaml`:** `opensAt` (the slot whose level opens the page) and
  `entries`, each `{ name, kind, what, syscalls, syscallNote?, firstMet, deepenedIn? }`
  with `kind` `command` or `folder`. An entry appears when its `firstMet` slot's level
  starts.
- **`bedrock.yaml`:** a map layer, the hardware under every act.
- **`skills.yaml`:** a list of `{ id, title, region, prerequisites }`.
- **`xray/syscalls.yaml`:** one entry per syscall, keyed by its kernel name: `args` in
  register order, `pointers`, `pathArg`, `path` (the kernel functions from the
  syscall's entry point in), `sources`, `desk` (one plain sentence), `returns`, and a
  `family` when one of the storyboards (write, exit, execve, fork, wait) fits. A syscall
  that isn't listed still shows with its raw arguments; adding it here explains it.
- **`xray/narration.yaml`:** every word X-ray says: `parts` (fragments), `desks`, and the
  stages of the Syscalls and Processes views, filled from the Machine's events through
  `{placeholders}`. Each file's header lists its fields and placeholders.

A map layer has `key`, `name`, `short`, `kicker`, `caption`, `note`, `source` and
`guides`. A slot's `number` is the number the player sees, quoted so YAML keeps it as
written (`"P.2"`, `"1.10"`, `"1.B"`); `level` names the level's folder, and a slot
without one is planned but not built; `optional: true` marks a side level; `summary`
is the Kernel Map's one or two plain sentences and `minutes` about how long it takes,
for a planned level (a built level's own `summary` and `minutes` win).

## 2. `level.yaml` schema

The type is `LevelDefinition` in `@kernelfall/game`; `validateLevel()` checks a
parsed file and lists every error with its path.

```yaml
id: act1-compilers-quarter-01-hello-write # <act>-<region>-<level folder>
title: A Voice in the Quarter
summary: Write your first program and make it print. # optional: the Kernel Map's plain-words note
minutes: 20 # optional: about how long it takes a new player, 1 to 120
tracks: [c, userland] # c | userland | kernel | net | debug (one or more)
skills: [write-to-stdout] # skill-tree nodes it unlocks (one or more)
prerequisites: [] # skills needed to play it
objectives: # what the checker verifies by behavior (one or more)
  - id: prints-hello
    text: Your program prints hello to the console.
    check: { kind: wrote, fd: 1, text: { contains: hello } } # optional: a declared check
hints: # exactly three: nudge, concept, point at the spot
  - Which file descriptor does the console already have open for you?
  - write(2) takes a file descriptor, a buffer and a length …
  - Look at the line where main() returns …
chips: # optional: commands "build it" offers; whole lines before P.3, names alone from P.3 on
  - { command: ls /bin, explain: "list the folder /bin" }
xray: [syscalls] # syscalls | processes | files | network | modules | memory | locks | boot (Act III adds vm | sched | trace | order | buses | storage | dump); [] for none
xrayFocus: [pipe, fork, dup2] # optional: calls X-ray keeps open beyond those the declared checks name (the shell's side)
codex: # cards it adds (one or more)
  - id: write-syscall # unique across the game
    term: write(2)
    summary: Asks the kernel to copy bytes from your buffer to an open file descriptor.
    simple: Ask the kernel to put your bytes somewhere. # optional: the Simple line
    deep: … # optional: the Deep text
    deepens: syscall # optional: the earlier card this one adds to
    sources: [fs/read_write.c] # kernel tree paths
    docs: https://man7.org/linux/man-pages/man2/write.2.html
    tryIt: strace -e trace=write echo hello
taint: # hacks the checker reports by id
  - id: ignored-write-error
    kind: ignored_error # one of the game's TAINT_KINDS
    points: 2
    description: write() failed and the program still exited with status 0.
    # check: optional, a declared Taint check
fidelity:
  faithful: [write(2) return values and errno]
  simplified: [the console is a single tty with no line discipline]
story: # sections of story.md
  scene: story.md#scene
  debrief: story.md#debrief
  realWorld: story.md#real-world
lab: # optional: the Machine the level starts on (LabSetup); left out, the shared one
  users: [{ name: guest, uid: 1001 }] # gid, home, shell optional
  groups: [{ name: staff, gid: 50, members: [you] }]
  files: # created in order, missing parents owned by root
    - { path: /home/you/notes, kind: dir, owner: you }
    - { path: /home/you/notes/todo, mode: "0600", owner: you, content: "fix the shell\n" }
  player: you # the user the player logs in as
  cwd: /home/you
  env: { EDITOR: vi }
  bin: [lamp] # gcc builds /usr/local/src/lamp.c into /usr/local/bin/lamp at setup
  processes: # running before the player's first command
    - { argv: [sleep, "600"], pid: 412, user: you, stdout: /dev/null }
  boot: { args: "console=ttyS0 rw quiet initcall_debug" } # starts at GRUB's menu (below)
runAs: # optional: commands root runs as a user once an objective is first met
  - { after: note-private, user: guest, command: cat /home/you/notes.txt }
```

- Ids (objectives, skills, Taint rules) are kebab-case and unique within their list;
  codex card ids are unique across the whole game.
- Unknown fields are errors, so typos don't pass silently.
- Skill ids must exist in the skill tree (`validateSkillTree()`).
- There is no time budget and no difficulty field.
- The act and region come from the folders, not from `level.yaml`.
- A file's `mode` is a quoted octal string (`"0644"`): YAML reads a bare `0644` as 644.

### The `lab:` block on the Machine

Each level starts from the clean saved boot; then the level's `lab:` block runs as root
(`setupScript()` in `@kernelfall/machine`), and the player's shell restarts in the
level's session.

| Field       | What the Machine does                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `users`     | `adduser`; a user of the same name (Alpine ships `guest`) is replaced                          |
| `groups`    | `addgroup`, then each member is added                                                          |
| `files`     | creates each path, then `chown` and `chmod`; contents are UTF-8 text                           |
| `bin`       | `gcc -std=c11 -Wall -Wextra -O2` builds `/usr/local/src/<name>.c` into `/usr/local/bin/<name>` |
| `processes` | starts each one with its user's login environment; `pid` sets the pid it gets                  |
| `player`    | the user the shell runs as; left out, `you`                                                    |
| `cwd`       | where the shell starts; left out, the player's home                                            |
| `env`       | exported in the player's shell, after the login defaults                                       |
| `boot`      | writes GRUB's entry, then restarts the Machine: the level starts at GRUB's menu                |

There is no `cpus` field: the Machine has one CPU, and a `cpus:` key is an error.

**`boot`** (P.4, P.10): `boot: {}` keeps the Machine's own entry; `args` is the whole
kernel command line written after `linux /boot/vmlinuz-virt` in `/boot/grub/grub.cfg`
on `/dev/sda1`. Always keep `console=ttyS0` in it: without it the kernel's log and the
initramfs's emergency shell go to a screen nobody sees. Setup applies the other fields,
writes `grub.cfg` and reboots, so a boot level can't use `player`, `cwd`, `env`,
`processes` or files under `/tmp` and `/run` (the restart loses them). The player
drives GRUB with real keys (`e`, Ctrl-N, Ctrl-E, Ctrl-X); an edit lasts one boot.
Nothing is traced before bash starts, so checks judge what the player reads after the
boot (`/proc/cmdline`, `dmesg`). A reference run drives GRUB with `keys` lines (see
`reference-runs.ts`).

**`runAs`** (S.2, P.10): each cue `{ after, user, command }` runs `command` once, as
`user` (root, `you` or one of `lab.users`), the first time objective `after` is met.
Root runs it on the control channel, out of the terminal, traced apart from the
player's shell, and its events reach the checkers: S.2's neighbour tries to read the
note, and P.10's init raises `eth0`, which only root may do. A golden run plays the cue
as a line with `as: <user>`.

Facts about the Machine that levels must respect:

- It is a 32-bit PC (i386): Alpine 3.24, kernel 6.18 (`linux-virt`), one CPU, 256 MiB.
  Syscall numbers, registers and the syscall table are i386's (`syscall_32.tbl`).
- The shell is bash 5.3; most commands are BusyBox, so their options and output are
  BusyBox's unless the image ships the GNU tool. gcc 15, tcc, musl, `strace` and man
  pages are installed.
- The root filesystem is 9p (`/` is not on a block device). The data disk is
  `/dev/sda1` (ext4, label `kernelfall`), not mounted until a level or the player
  mounts it. eth0 exists, with no network behind it.
- The player is `you` (uid 1000, `/home/you`); root's work happens in the setup, out
  of the player's sight.
- The trace keeps only the first bytes of large buffers (about 1 KiB per `write` or
  `read`), and a level's checker sees only what its command's trace holds.

### Checkers

A level is judged by behavior: the kernel's events for each command the player runs.
Objectives met by one run stay met for the rest of the play-through. `build-fixed` and
compiler-warning Taint also read the build history the app passes to the check.

**Declared checks** (`check:` in `level.yaml`), judged by the engine. By default they
judge the player's own programs; `program: ls` judges every process that ran `ls`.

| Objective kind     | Met when                                                                            |
| ------------------ | ----------------------------------------------------------------------------------- |
| `compiles`         | a program the player built ran                                                      |
| `build-fixed`      | a build failed with an error earlier, and the latest one built                      |
| `exit-status`      | a process exited normally with `status`                                             |
| `wrote`            | a process's writes on `fd` were taken in full and match `text` (if given)           |
| `terminal`         | what reached the terminal while the process ran matches `text`                      |
| `syscall`          | a process called one of `names`, returning `ret` or failing with `errno` (`EAGAIN`) |
| `no-zombies-after` | a process forked at least `commands` children and waited for every one              |
| `ran`              | a process was started by execve() with `args` (`min`, `match`) and exited `status`  |
| `read-to-end`      | a process read `path` until the kernel answered 0 (a folder: getdents64), `text`    |

| Taint kind          | Found when                                                      |
| ------------------- | --------------------------------------------------------------- |
| `unreaped-children` | a process forked a child it never waited for                    |
| `ran-program`       | another process ran one of `programs` (a shell from `system()`) |

`text` takes `equals`, `notEquals`, `contains`, `notContains` and `endsWith`; every one
given must hold. A shell builtin such as `echo` starts no program, so `program:` can't
name it; judge it in `checker.ts`.

**A level's own `checker.ts`** judges what the kinds can't, with `game`'s query
toolkit (processes, children, execs, exits, writes, failed calls…):

```ts
import { defineChecker, playerPrograms, writtenTo } from '@kernelfall/game/utils'

export const checker = defineChecker({
  applies: ({ events }) => playerPrograms(events).length > 0, // which commands to judge
  check({ events }) {
    const greets = playerPrograms(events).some((pid) => writtenTo(events, pid, 1) === 'hello\n')
    return { objectivesMet: greets ? ['prints-hello'] : [], taint: [] }
  },
})
```

It reports objectives and Taint rules by their ids in `level.yaml`, and the engine
merges its report with the declared checks. It must be pure: the same events always
give the same report.

### Add a level

1. Make its folder in the region, `<nn>-<slug>`, and point a slot of `region.yaml` at
   it: `- { number: "1.5", title: An Address and a Name, level: 05-address-and-name }`.
2. Write `level.yaml` with the id `<act>-<region>-<nn>-<slug>`, and `story.md` with
   every section it points at. Add `starter/` and `solution/`.
3. Give each objective and Taint rule a `check:` when a kind fits; write `checker.ts`
   for the rest.
4. Record its golden runs (below): the reference solution must pass with zero Taint.
5. Add its skills to `skills.yaml` and its spec to [`docs/levels/`](levels/).

### Golden runs

Level tests judge the kernel's real events, recorded on the real image:

1. Build the image once: `pnpm vm:image`.
2. Add the level's runs to `packages/levels/src/test/reference-runs.ts`: `solution`
   (init's version) and one run for each mistake a checker must catch. A run lists
   the files put in `/home/you` and the lines typed at the prompt, with any input the
   program reads.
3. `pnpm vm:record <level id>` boots the image in Node, sets up the level, types each
   line and saves the events as `src/test/runs/<level>/<run>.json.gz`. Commit them.
4. List the level in `src/test/level-checkers.test.ts`. An objective the Machine can't
   show yet goes in its `KNOWN_GAPS`, with the reason.

Record again whenever the level's setup, its reference runs or the image change.

### Codex cards in a spec

Every spec writes its cards the same way, under `### Codex (chapter: <region>)`:

```md
- **write()** (`write-syscall`, deepens: `syscall`)
  - **Simple:** one line in plain words.
  - **Deep:** the kernel functions, structs and source files; docs.
  - **Read:** optional man pages and links.
```

A card's `deepens:` ids must exist earlier in play order, and a required level's
card never deepens a side level's card.

## 3. Rules

1. **Follow the level loop:** scene → see it → build it → watch it → real-world card.
   "Watch it" may open with a short **Predict** beat ([GAME.md](GAME.md#6-the-level-loop-1030-minutes-each)):
   an in-world prediction, never a quiz, that costs nothing when wrong.
2. **Build, don't puzzle.** The player adds a real piece to the act's project (the
   shell, the Lantern, `lens`). No riddles, no hidden tricks.
3. **One new concept per level.** Earlier concepts may be reused, never assumed untaught.
4. **Bosses and finales assess, they don't teach.** A boss (1.B, 2.9b, 3.20) or a
   finale (2.12, 3.21) uses tools and reports met earlier in its act; the player
   builds the fix. Its skill names the combination (`sys-syscall-path`,
   `sync-deadlock-lockdep`, `dbg-stall-diagnosis`). Exceptions, kept small and
   stated in the spec: 2.9b opens with a short `git am` beat (tooling, not a kernel
   mechanism); 3.21 introduces one tool, `crash`, and one fix pattern (a completion).
5. **The world reacts.** Every level has a visible effect in the Machine when the
   player's code works.
6. **Checkers test behavior, not text.** Run the shell, open the device, send the
   packet, read the result. Never search the player's source for "the right line".
7. **Taint runs alongside pass/fail:** leaks, KASAN/lockdep/KCSAN reports, unbalanced
   locks, missing error cleanup, compiler warnings (from 1.3), style errors.
8. **The reference solution passes with zero Taint.** Kernel-style code also passes
   upstream `checkpatch.pl`.
9. **Same start, every time.** Every level starts from the same saved boot and the
   same setup. The Machine has one CPU: concurrency is time slicing, and a level that
   needs a race makes it happen on purpose, never by luck.
10. **True to the Machine.** Real names, signatures, output formats and behavior, as
    the Machine shows them. Fill in `fidelity` honestly; the debrief shows anything
    the game leaves out.
11. **Realistic bugs only.** Planted, "Dangling" or "Stall" bugs must be bugs that
    really happen in kernel code. Cite a real upstream fix when there is one.
12. **Hints teach, not solve.** Nudge → concept → point at the spot. Never paste the fix.
13. **Never a dead end.** A player can always continue with the reference version.
    It adds no Taint and gives no score; the level counts as _completed with help_.
14. **Take it home.** The real-world card shows how to do the same on real Linux.
15. **One journey, not separate tutorials.** A level grows the player's own project
    and names the earlier levels it calls back to. Its starter says how much help it
    gives (full, partial, stub or blank), and help fades over the act. Its checker
    re-tests at least one earlier skill (section 5). Its debrief hands off to the
    next level.
16. **Inject failures.** Where a level teaches error handling or concurrency, its
    checks also drive the paths players don't trigger by hand (a second writer, a
    signal during a blocking call, a failed allocation).
17. **Side levels stay optional.** A side level (marked † and `optional: true`) earns
    its skills and cards as usual, but no required level, boss or checker may need
    them; a required level may offer them as a bonus.

### Content quality gate

Players start knowing nothing, so a level ships only when:

- Someone other than its writer has checked every fact against Linux 6.18 source, the
  man pages and the real Machine.
- Facts about the Machine (versions, devices, paths, pids, users) come from the VM,
  not from memory or another distribution: `src/test/machine-facts.json` holds its
  outputs (`pnpm vm:facts` re-records them after the image changes).
- Output shown in the story, hints or Codex is copied from a real run on the Machine.
- Every term is explained the first time it appears.
- Every analogy says where it stops being true.
- The debrief hands off to the next level.

C code follows [C in levels](../CONTRIBUTING.md#c-in-levels). Kernel-side levels
also ship a real out-of-tree `Kbuild`/`Makefile`, so players can build them on real
Linux.

## 4. The journey

The player builds four things, and none of them is thrown away:

1. **`ksh-lite`**, their shell (1.0–1.8). It runs beside the Machine's bash, is
   traced at the Syscall Gate, and is the terminal for Acts II and III. Every
   `echo … > /dev/lantern`, `cat /dev/lantern` and Ctrl-C in the Deep runs through
   code the player wrote; in 3.2 it is the shell their own `/init` falls back to.
2. **`harbor`**, their chat server (1.9–1.10). It is checked at the Syscall Gate,
   comes back as the traffic the Netfilter Wall counts (2.11), gains a thread (3.6)
   and is the task the Stall freezes (3.20).
3. **The Lantern**, their driver (2.2–2.12, then Act III). It grows one feature per
   level, is driven from `ksh-lite`, controlled by `lanternctl`, hosts Act II's bugs,
   becomes the patch in Mainline, then goes to the Core: boot parameter, `mmap`,
   kthread, tracepoints, RCU, and real hardware (the lighthouse board, the Lantern
   card, its filesystem and network link).
4. **`lens`**, their own X-ray for real Linux (3.3–3.11), the tool T3 takes home.

Act II and III checkers drive the Lantern through the player's own `ksh-lite` and
fall back to the reference shell only for that run, saying why. In-game transcripts
there use `ksh$`, no `sudo` and no quotes; real-world cards keep bash and `sudo`.

| #     | New concept                                      | Project gains                              | Starter | Time    |
| ----- | ------------------------------------------------ | ------------------------------------------ | ------- | ------- |
| P.1   | a computer, an OS and its kernel                 | first commands                             | full    | ~15 min |
| P.2   | a program asks the kernel through syscalls       | `hello.c`                                  | full    | ~20 min |
| P.3   | speaking to the shell                            | Field Guide entries                        | full    | ~20 min |
| P.4   | the boot path                                    | a boot entry of your own                   | full    | ~20 min |
| P.5   | what the kernel owns                             | `myuname.c`                                | full    | ~20 min |
| P.6   | how Linux finds hardware                         | the lighthouse board's lamp, bound         | full    | ~25 min |
| P.7   | processes and the scheduler                      | `whoami.c`                                 | full    | ~20 min |
| P.8   | virtual memory                                   | `where.c`                                  | full    | ~25 min |
| P.9   | the VFS and the kernel's parts                   | `look.c`                                   | full    | ~25 min |
| P.10  | one command through the whole Machine (capstone) | a stalled Machine, fully up                | partial | ~30 min |
| S.1   | the filesystem tree, walked and changed          | `/tmp/survey`                              | full    | ~25 min |
| S.2   | users, permission bits and the kernel's check    | a private `notes.txt`                      | full    | ~20 min |
| S.3   | processes from the outside, signals              | a paused, then ended process               | full    | ~20 min |
| S.4   | finding files, standard error                    | the lost plan, found                       | full    | ~20 min |
| S.5   | text tools                                       | a census, counted and sorted               | full    | ~20 min |
| 1.0   | strings and arrays in C                          | `ksh-lite`: a word counter                 | full    | ~15 min |
| 1.1   | pointers and the heap                            | tokenizer                                  | full    | ~20 min |
| 1.2   | structs of function pointers                     | command table                              | full    | ~12 min |
| 1.3   | build and debug tools                            | Makefile, `history`                        | partial | ~20 min |
| 1.4   | `fork`/`exec`/`wait`                             | runs any program                           | partial | ~18 min |
| 1.5   | per-process state (cwd, environment)             | `cd`, `pwd`, `export`, `$VAR`              | stub    | ~25 min |
| 1.6   | file descriptors and redirection                 | `>`, `>>` and `<`                          | stub    | ~20 min |
| 1.7   | pipes                                            | `\|` pipelines                             | stub    | ~20 min |
| 1.8   | signals and interleaving                         | survives Ctrl-C                            | stub    | ~18 min |
| 1.9   | sockets and TCP streams                          | `harbor`: one client                       | partial | ~20 min |
| 1.10  | `poll`: many fds at once                         | `harbor`: many clients                     | stub    | ~20 min |
| 1.B   | the syscall path, named step by step (boss)      | both traced clean; `knock.c`               | blank   | ~30 min |
| T1    | (optional, on real Linux)                        | ksh-lite and harbor on real Linux          | kit     | —       |
| 2.1   | Kconfig and kbuild                               | a `-lantern` kernel with KASAN and lockdep | partial | ~15 min |
| 2.2   | loadable modules (and reading an oops)           | the Lantern loads                          | partial | ~20 min |
| 2.3   | module parameters                                | brightness and colour                      | stub    | ~12 min |
| 2.4   | char device registration and `goto` unwinding    | `/dev/lantern`                             | stub    | ~18 min |
| 2.5   | crossing the boundary in `file_operations`       | read and write                             | stub    | ~20 min |
| 2.6   | `ioctl`                                          | `lanternctl` and a dial                    | stub    | ~15 min |
| 2.7   | procfs and sysfs                                 | `/proc/lantern`, `brightness`              | blank   | ~20 min |
| 2.8a  | kernel memory                                    | a message buffer of any size               | stub    | ~15 min |
| 2.8b  | object lifetime, read with KASAN                 | readers keep their message                 | stub    | ~20 min |
| 2.9   | races and mutexes                                | many users at once                         | blank   | ~25 min |
| 2.9b  | lock ordering, read with lockdep (boss)          | message history                            | blank   | ~25 min |
| 2.10a | timers and atomic context                        | blinking                                   | blank   | ~18 min |
| 2.10b | interrupts, spinlocks and deferred work          | the light sensor                           | blank   | ~20 min |
| 2.10c | wait queues: a blocking `read`                   | `/dev/lantern-sensor`                      | blank   | ~20 min |
| 2.11  | atomic counters in a netfilter hook              | a packet counter                           | blank   | ~20 min |
| 2.12  | fixing a use-after-free (finale)                 | fading messages, fixed                     | blank   | ~25 min |
| 2.13  | the upstream patch                               | a merged fix                               | blank   | ~20 min |
| T2    | (optional, on real Linux)                        | the Lantern on a real 6.18 kernel          | kit     | —       |
| 3.1   | firmware, the loader and the command line        | a boot parameter; a crash kernel loaded    | partial | ~15 min |
| 3.2   | from `start_kernel()` to PID 1                   | a built-in Lantern; your own `/init`       | partial | ~20 min |
| 3.3   | page tables                                      | `lens walk`                                | partial | ~18 min |
| 3.4   | page faults                                      | `lens faults`                              | stub    | ~15 min |
| 3.5   | `mmap` and a driver's fault handler              | the light map                              | stub    | ~20 min |
| 3.6   | threads                                          | `harbor`'s second thread                   | stub    | ~15 min |
| 3.7   | EEVDF                                            | `lens sched`                               | stub    | ~18 min |
| 3.8   | kernel threads and lockups                       | the Lantern's heartbeat                    | blank   | ~15 min |
| 3.9   | ftrace and tracepoints                           | the Lantern's tracepoints                  | partial | ~15 min |
| 3.10† | perf                                             | `lens stat`                                | stub    | ~12 min |
| 3.11  | eBPF and the verifier                            | `lens bpf`, a write counter                | partial | ~20 min |
| 3.12  | memory ordering, read with KCSAN                 | a lock-free sensor ring                    | blank   | ~20 min |
| 3.13  | RCU                                              | an RCU history                             | blank   | ~20 min |
| 3.14  | a platform driver from a device tree             | the lighthouse beacon                      | partial | ~18 min |
| 3.15  | a PCI driver                                     | the Lantern card                           | stub    | ~20 min |
| 3.16  | the VFS objects                                  | `lanternfs`                                | partial | ~20 min |
| 3.17† | the page cache and the block layer               | a block device                             | stub    | ~20 min |
| 3.18  | a network driver and NAPI                        | the light link                             | partial | ~20 min |
| 3.19† | XDP                                              | an XDP gate                                | stub    | ~15 min |
| 3.20  | a CPU stall, diagnosed live (boss)               | the old card driver's NAPI fix             | blank   | ~25 min |
| 3.21  | a dead Machine, read with `crash` (finale)       | the calibration fix                        | blank   | ~30 min |
| 3.22  | regression tests                                 | KUnit tests and a patch series             | blank   | ~20 min |
| T3    | (optional, on real Linux)                        | the Core on a real 6.18 kernel in QEMU     | kit     | —       |

† Optional side level.

| Part           | Levels                     | Time                                 |
| -------------- | -------------------------- | ------------------------------------ |
| Prologue       | 10                         | ~3 h 40 min                          |
| Surface Survey | 5                          | ~1 h 40 min                          |
| Act I          | 12                         | ~4 h                                 |
| Act II         | 17                         | ~5 h 30 min                          |
| Act III        | 22 (19 main path + 3 side) | ~6 h main path, ~6 h 50 min with all |
| v1.0           | 66 (63 main path + 3 side) | ~20 h 50 min main path, ~21 h 40 min |

### Starter levels

| Help        | What the starter holds                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------- |
| **full**    | a working harness and the surrounding code; the player fills one function or runs guided commands |
| **partial** | the files and function signatures, already wired in; the player writes the bodies                 |
| **stub**    | a named hook or prototype that nothing calls yet; the player writes and wires it                  |
| **blank**   | only the player's own project; they decide where the code goes                                    |

Help fades within an act. A **new program** (`harbor`, `lens`, an initramfs `/init`),
a **new memory model** (2.8a) or a **new subsystem** with its own boilerplate (BPF,
the driver model, a filesystem, a net device) steps back one notch, then fades
again. Acts II and III start at partial, because the player already knows how to
grow a project. Test tools (`lantern-stress`, `nc`), salvaged code and planted bugs
are content, not scaffolding.

## 5. Callbacks

An earlier topic returns at a deeper level, and later checkers re-test it. The
third column names the spec section that carries it.

| Earlier                                  | Returns in                        | How (spec section)                                                                                                                                                                      |
| ---------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P.2 `write` and the Gate view            | S.2, 1.B, 2.5                     | a refused `openat` in the Gate (S.2 See it); the full path (1.B); ending in `lantern_read()` (2.5 Watch it)                                                                             |
| P.4 the boot path                        | 2.1, 3.1, 3.2                     | booting your own kernel (2.1); the loader and command line (3.1); `start_kernel()` to PID 1 (3.2)                                                                                       |
| P.6 the lighthouse board's device tree   | 3.14                              | the same `lighthouse.dts`, now with a driver of your own (3.14 Build it)                                                                                                                |
| P.7 processes, the scheduler on one CPU  | S.3, 1.4, 3.7                     | processes from outside (S.3); `fork` (1.4); EEVDF's run queues (3.7)                                                                                                                    |
| P.8 virtual memory, `/proc/<pid>/maps`   | 2.5, 3.3                          | two address spaces side by side (2.5); the page-table walk and `pagemap` (3.3)                                                                                                          |
| S.1 `ls` as a program                    | 1.4                               | "You ran `ls` a dozen times. Who started it?" (1.4 See it)                                                                                                                              |
| S.1 `cd` (`chdir` in the shell)          | 1.5                               | the player builds the builtin they used (1.5 Scene)                                                                                                                                     |
| S.1 / 1.5 reading `/proc`                | 2.7                               | the size-0 file and `proc_pid_status()` replayed from the kernel side, then `/proc/lantern` (2.7 See it)                                                                                |
| S.1 `cat`, 1.6 fds and the read contract | 2.5, 2.8a                         | the other side of `read`/`write` (2.5 See it); `dd bs=1` still works on the new buffer (2.8a checker)                                                                                   |
| S.2 permissions and root                 | 1.6, 1.B, 2.2, 2.3, 2.4, 2.7, 3.3 | `Permission denied` in the player's error path (1.6 checker); `EPERM` for non-root `insmod` (2.2); `EACCES` as uid 1000 on `/dev/lantern` (2.4 checker); a hidden PFN as uid 1000 (3.3) |
| S.3 `/proc/<pid>/status`                 | 1.5                               | the same file, explained field by field (1.5 See it)                                                                                                                                    |
| S.5 pipe teaser                          | 1.7                               | the recording init played, now with the player's shell (1.7 See it)                                                                                                                     |
| 1.1 dangling pointer (grey box)          | 2.12                              | the same memory-panel frame opens the finale (2.12 See it)                                                                                                                              |
| 1.2 command table                        | 2.4, 2.5, 3.22                    | `struct file_operations` source dive (2.4 Build it); the driver's ops table (2.5 Codex); fakes behind an ops table for KUnit (3.22)                                                     |
| 1.6 bit flags                            | 2.6, 3.3                          | `_IOW` packs direction and size; `strace` decodes them (2.6 Watch it); PTE flags (3.3)                                                                                                  |
| 1.3 Makefile                             | 2.1, 2.2, 2.6, 2.11               | "work orders, a few thousand of them" (2.1 Scene); kbuild `Makefile` (2.2); `lanternctl` and `harbor` targets (2.6, 2.11)                                                               |
| 1.3 AddressSanitizer                     | 2.8b, 2.12                        | KASAN as the kernel's ASan, same report parts (2.8b See it); the finale's report (2.12)                                                                                                 |
| 1.4 errno                                | 2.2                               | kernel functions return negative errno (2.2 Hints, Codex)                                                                                                                               |
| 1.4 address spaces after `fork`          | 2.5, 3.4                          | "same address, different memory" before `copy_to_user`; the skill is earned here (2.5 See it, Predict); copy-on-write (3.4)                                                             |
| 1.5 / 1.B `strace`                       | 2.5, 2.6, 3.9                     | tracing the player's own driver from user space (2.5, 2.6 Watch it); trace events inside the kernel (3.9)                                                                               |
| 1.6 redirection, 1.7 pipes in `ksh-lite` | all of Acts II and III            | the Deep's terminal is `ksh-lite`; checkers drive the Lantern through it                                                                                                                |
| 1.7 a reader sleeping on a pipe          | 2.10c                             | `pipe_read()` asleep on `pipe->rd_wait`, replayed; the Lantern's wait queue has the same shape (2.10c Scene, See it, Codex)                                                             |
| 1.8 `EINTR` and `SA_RESTART`             | 2.9, 2.10c                        | `mutex_lock_interruptible()` (2.9); `-ERESTARTSYS` becomes `EINTR` or a restart; Ctrl-C through `ksh-lite` (2.10c checker)                                                              |
| 1.8 interleaving                         | 2.9                               | "like the signal handler that lost a count" (2.9 Scene)                                                                                                                                 |
| 1.9 network view, 1.10 `harbor`          | 2.11, 3.6, 3.18, 3.20             | the player's own server counted at `NF_INET_LOCAL_IN` (2.11); a second thread (3.6); the driver lane under Act I's view (3.18); frozen by the Stall (3.20)                              |
| 1.10 sleeping in `poll`                  | 2.10c                             | "Your harbor, sleeping in `poll`" (2.10c Scene)                                                                                                                                         |
| 1.B root and `CAP_SYS_MODULE`            | 2.2                               | the capability check at the start of `finit_module` (2.2 See it)                                                                                                                        |
| 2.3 module parameters                    | 2.10a, 2.11, 3.1                  | `blink_ms` (2.10a); `chat_port`, checked read-only (2.11 checker); `lantern.param=` on the kernel command line (3.1)                                                                    |
| 2.4 `goto` unwinding                     | 2.7, 2.10b, 2.10c, 3.14           | fault injection on the proc and sysfs steps (2.7 checker); `request_irq()` failing (2.10b); a second minor (2.10c checker); `devm_` helpers (3.14)                                      |
| 2.8b kref, 2.9b history, 2.10a timers    | 2.12, 3.13                        | the finale's bug is exactly their combination (2.12); the history under RCU (3.13)                                                                                                      |
| 2.9 hung tasks                           | 3.8, 3.21                         | soft lockups next to hung tasks (3.8); the hung task that panics the Machine (3.21)                                                                                                     |
| 2.10a timers, 2.10b spinlock             | 3.8, 3.12                         | a kernel thread beside the timer (3.8); the sensor spinlock replaced by acquire/release (3.12)                                                                                          |
| 2.11 `sk_buff`                           | 3.18                              | the `sk_buff` built from a receive ring (3.18)                                                                                                                                          |
| 2.12 stop before free                    | 3.13                              | generalized by grace periods (3.13)                                                                                                                                                     |
| 2.13 the upstream patch                  | 3.22                              | a patch series with its tests (3.22)                                                                                                                                                    |

From 2.8a on, every checker runs kmemleak after `rmmod`; 2.10b, 2.10c, 2.11 and 2.12
also fail on "sleeping in atomic" reports, and Act III adds KCSAN, RCU-lockdep,
soft lockup, RCU stall and hung-task reports.
