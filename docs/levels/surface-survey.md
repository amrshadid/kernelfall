# Surface Survey: the streets of Userland

Level specs for the Surface Survey, the on-ramp between the Prologue and Act I. Read
[GAME.md](../GAME.md) for the story and systems, [LEVELS.md](../LEVELS.md) for the
rules, and [prologue.md](prologue.md) for what the player already knows. The whole
path is in [LEVELS.md](../LEVELS.md#4-the-journey).

Kernel source paths follow Linux 6.18 (LTS). Every output, message and syscall below
was copied from a run on the Machine (one CPU, i386, Alpine 3.24, kernel
`6.18.63-0-virt`, bash 5.3, BusyBox, musl); the level files hold the same text.

**Five levels, about 1 hour 45 minutes,** played after the Prologue's capstone
(P.10). The shell itself is taught earlier, in the Prologue's
[P.3 Speak to the Shell](prologue.md#p3--speak-to-the-shell), so the player types
every command from P.3 on. Each new idea comes with two or three worked examples and
an errand the checker can see. Every new word is explained in plain words the first
time, and added to the Codex glossary (started in the
[Prologue](prologue.md#glossary-first-meeting-words)).

| #   | Level id                                    | Title                   | Time    | Skills unlocked   |
| --- | ------------------------------------------- | ----------------------- | ------- | ----------------- |
| S.1 | `prologue-surface-survey-01-streets`        | The Streets of Userland | ~25 min | `io-fs-hierarchy` |
| S.2 | `prologue-surface-survey-02-who-may-enter`  | Who May Enter           | ~20 min | `io-permissions`  |
| S.3 | `prologue-surface-survey-03-processes`      | Processes from Outside  | ~20 min | `proc-observe`    |
| S.4 | `prologue-surface-survey-04-finding-things` | Finding Things          | ~20 min | `io-find-files`   |
| S.5 | `prologue-surface-survey-05-text-tools`     | Counting and Sorting    | ~20 min | `sys-text-tools`  |

**Skills:**

| Id                | The player can…                                                                                                                          | Needs                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `io-fs-hierarchy` | move around the tree with absolute and relative paths, and create, copy, move, rename and remove files and folders                       | `sys-shell-basics`                      |
| `io-permissions`  | read an `ls -l` mode string, explain uids, groups and root, and say how the kernel's check answers `EACCES` or `EPERM`                   | `io-fs-hierarchy`                       |
| `proc-observe`    | find a process with `ps` and `/proc`, read its state and parent, and stop, pause, resume or end it with `kill`                           | `io-permissions`, `proc-process-basics` |
| `io-find-files`   | find files by name, type and owner with `find`, tell standard output from standard error, and redirect each with `>` and `2>`            | `io-fs-hierarchy`                       |
| `sys-text-tools`  | count, search, slice, sort and de-duplicate lines with `wc`, `grep`, `head`, `tail`, `sort` and `uniq`, and join two of them with a `\|` | `sys-shell-basics`                      |

**Where it leads:** every command the player runs here comes back in Act I, built
by their own hands: cutting a line into words (1.0 and 1.1's tokenizer), running a
program found through `PATH` (1.4), `cd` and the environment (1.5), `>` and
`Permission denied` (1.6), `|` (1.7), signals (1.8), and `/proc/<pid>/status` (1.5).
Root, met in S.2, is granted at the Syscall Gate (1.B) and needed in the Deep (2.2,
2.4).

**The shell's features as tools:** init's shell is the Machine's real bash, so pipes
(`|`), redirection (`>`, `2>`), variables (`$HOME`, `$$`), quoting and wildcards all
work. The Survey teaches redirection and pipes as tools, each with its real trace: for
`> file` bash's forked child calls `open(…, O_WRONLY|O_CREAT|O_TRUNC|O_LARGEFILE,
0666)`, `dup2(3, 1)` and `close(3)` before its `execve` (S.4); for `a | b` bash calls
`pipe`, forks a child per side, and each child `dup2`s its end onto fd 1 or fd 0
before its `execve` (S.5). How a shell does them inside is what the player builds in
Act I (1.6, 1.7).

**Project:** none yet. The player uses bash; in Act I they build their own shell,
`ksh-lite`.

## Glossary additions (Survey)

| Word                       | In plain words                                                                               | Examples on screen                                | First met |
| -------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------- |
| absolute and relative path | a path from the root (starts with `/`), or from where you stand (doesn't)                    | `/etc/motd`; `motd`; `../../etc/motd`             | S.1       |
| working directory          | the folder a process is "standing in"; relative paths start there                            | `/home/you`; `/etc` after `cd /etc`               | S.1       |
| inode                      | the kernel's record of one file: its size, owner, and where its data lies; names point to it | `ls -i` shows its number                          | S.1       |
| user ID, group             | the number the kernel knows a user by; a group is a named set of users                       | `you` is 1000; `root` is 0; group `shadow`        | S.2       |
| root                       | the administrator, user ID 0, allowed past almost every check                                | init; `runuser`; `sudo` on other systems          | S.2       |
| permission bits            | nine on/off switches on every file: read, write, execute, for owner, group and everyone else | `rw-r--r--`; `rwx------`                          | S.2       |
| signal                     | a short notice the kernel delivers to a process: pause, carry on, stop                       | `SIGSTOP`, `SIGTERM`; `kill -STOP`                | S.3       |
| zombie                     | a process that has ended, waiting for its parent to collect its exit status                  | `Z` in `ps`                                       | S.3       |
| standard error             | fd 2, where programs write error messages, kept apart from normal output                     | `find: /root: Permission denied`                  | S.4       |
| redirection                | sending a command's standard output (`>`) or standard error (`2>`) into a file               | `find attic -type d > folders.txt`; `2>/dev/null` | S.4       |
| line                       | text up to a newline character; most tools work one line at a time                           | one row of `census.txt`; one `/etc/passwd` entry  | S.5       |
| pipe                       | a channel in the kernel that hands one program's output straight to another's input          | `sort census.txt \| uniq -c`                      | S.5       |

## Placement check

Players who already live in a terminal can skip the Survey. At the edge of init's
street, init offers: "Know your way around? Show me, and walk on."

- **Format:** about 7 minutes, five errands in bash, one per level
  (`placement.yaml`). No trivia, no timer.
  1. Make `/tmp/survey/maps` with one `mkdir`, copy `/etc/motd` into it, show with
     `ls -i` that the copy is a new file, and rename the copy `motd.old`.
  2. Make `notes.txt` readable by you only, and show it with `ls -l`.
  3. Find init's `yes` process, pause it and show it paused, then end it.
  4. Find the file `lantern-plan.txt` somewhere under `/home/you/attic`.
  5. Print how many lines of `census.txt` contain `dark`.
- **Result:** each errand is judged by its level's checker. Passing places the player
  past that level (skills marked "placed"); a failed errand sends them to just that
  level. The check can be retaken any time, and placed levels stay playable.
- **Taint:** none.

## The Field Guide (Codex page)

An always-available page in the Codex, opened at the start of P.3 (it lives here
because most of its entries are Survey commands). One entry per command and per
folder: what it is in one line, the key syscalls it makes on the Machine (each a link
to its Codex card), the level where the player first meets it, and the level that
teaches the mechanism underneath. An entry appears when the level that first uses it
starts.

The syscall column was **measured on the Machine** with `strace` and the game's trace,
and uses the names of i386's `syscall_32.tbl`. It leaves out what every program does
to start and stop (`execve`, `brk`, `mmap2`, `mprotect`, `rt_sigprocmask`,
`exit_group`) and BusyBox's own start-up calls (`getuid32`, `setuid32` and friends).
On a 64-bit PC with GNU tools the names differ (`openat`, `newfstatat`,
`renameat2`, `unlinkat`); the kernel underneath is the same.

| Entry          | What it is                                                                                                | Syscalls (on the Machine)                                                                                     | First met | Built or deepened in |
| -------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------- | -------------------- |
| `echo`         | print its arguments (a bash builtin; `/bin/echo` is the program)                                          | `writev` (bash's own; `/bin/echo` uses `write`)                                                               | P.1       | P.2                  |
| `ls`           | list a folder (`-l` long form, `-a` names starting with `.` too, `-i` inode numbers)                      | `open`, `getdents64`, `statx` per name, `close`, `writev`                                                     | P.1       | S.1, 2.7             |
| `cat`          | copy files to standard output                                                                             | `open`, `sendfile64` (the kernel copies), `close`                                                             | P.1       | 1.6, 2.5             |
| `dmesg`        | print the kernel's log                                                                                    | `syslog` (reads the log buffer), `writev`                                                                     | P.4       | 2.2                  |
| `uname`        | print the kernel's name, release and CPU type                                                             | `uname`, `writev`                                                                                             | P.5       | P.5                  |
| `lspci`        | list PCI devices (`-k`: and their drivers)                                                                | `open`, `getdents64`, `pread64` (config), `read`, `readlink` (of `/sys/bus/pci/devices`), `writev`            | P.6       | 2.4                  |
| `dtc`          | compile a device tree from text to binary                                                                 | `open`, `readv`, `writev`, `close`                                                                            | P.6       | P.6                  |
| `ps`           | list processes                                                                                            | `sysinfo`, `open`, `getdents64`, `statx`, `read` (`/proc/N/stat`; `cmdline` without `-o`), `close`, `writev`  | P.7       | S.3, 1.4, 1.5        |
| `nproc`        | print how many CPUs this process may use                                                                  | `sched_getaffinity`, `writev`                                                                                 | P.7       | P.7                  |
| `yes`          | print `y` forever, until stopped                                                                          | `writev`, again and again                                                                                     | P.7       | 1.7                  |
| `free`         | show memory use                                                                                           | `sysinfo`, then `open` and `read` of `/proc/meminfo`, `writev`                                                | P.8       | 2.8a                 |
| `reboot`       | restart the Machine                                                                                       | `sync`, `kill` (signals PID 1; init makes the `reboot` call)                                                  | P.10      | P.10                 |
| `pwd`          | print the working directory (a bash builtin)                                                              | `writev` only (`/bin/pwd` calls `getcwd`)                                                                     | P.3       | 1.5                  |
| `man`          | show a manual page; `q` quits                                                                             | `open`, `readlink`, `dup2`, `writev` (into a file in `/tmp`), `fork`, `execve`, `wait4` (the pager), `unlink` | P.3       | P.3                  |
| `printenv`     | print environment variables (`printenv PATH`: just one)                                                   | `writev` (the environment is already in its memory)                                                           | P.3       | 1.5                  |
| `env`          | print the environment, or run a program with a setting added                                              | `execve` per folder of `PATH` until one works, `writev`                                                       | P.3       | 1.5                  |
| `wc`           | count lines, words and bytes (`-l`, `-w`, `-c`)                                                           | `open`, `read`, `close`, `writev`                                                                             | P.3       | S.5, 1.6             |
| `cd`           | change the shell's working directory (a bash builtin)                                                     | `statx`, `chdir` (to the absolute path bash worked out)                                                       | S.1       | 1.5                  |
| `mkdir`        | make a folder (`-p`: and any missing folders above it)                                                    | `mkdir` (`-p`: one per folder on the way, `EEXIST` for those there)                                           | S.1       | S.1                  |
| `rmdir`        | remove an empty folder                                                                                    | `rmdir`                                                                                                       | S.1       | S.1                  |
| `cp`           | copy a file                                                                                               | `statx`, `open`, `sendfile64`, `close`                                                                        | S.1       | 1.6                  |
| `mv`           | move or rename a file (no bytes are copied on one filesystem)                                             | `statx`, `rename`                                                                                             | S.1       | S.1                  |
| `rm`           | remove a file's name; there is no bin to get it back from                                                 | `statx`, `access`, `unlink`                                                                                   | S.1       | S.1                  |
| `id`           | show your user and group IDs                                                                              | `getuid32`, `geteuid32`, `getgid32`, `getegid32`, `getgroups32`, `writev`                                     | S.2       | S.2, 1.B             |
| `chmod`        | change a file's permission bits                                                                           | `statx`, `chmod`                                                                                              | S.2       | S.2                  |
| `kill`         | send a signal to a process (`-STOP`, `-CONT`, `-TERM`, `-KILL`; `-l` lists them)                          | `kill` (bash's builtin and `/bin/kill` alike)                                                                 | S.3       | 1.8                  |
| `sleep`        | wait a number of seconds, then exit                                                                       | `nanosleep`                                                                                                   | S.3       | 1.4, 1.5             |
| `find`         | search a folder tree for files by name, type, owner                                                       | `statx` per entry, `open` and `getdents64` per folder, `close`, `writev` (errors: `write`)                    | S.4       | S.4                  |
| `cmd > file`   | send standard output into a file (`2> file`: standard error)                                              | in bash's child: `open`, `dup2`, `close`, then `execve`                                                       | S.4       | 1.6                  |
| `grep`         | print the lines that contain a word (`-c`, `-n`, `-v`, `-i`)                                              | `open`, `read`, `close`, `writev`                                                                             | S.5       | 1.7                  |
| `head`         | print the first lines (`-n 3`: three)                                                                     | `open`, `read`, `writev`, `_llseek` (gives back what it read too far)                                         | S.5       | 1.7                  |
| `tail`         | print the last lines                                                                                      | `open`, `_llseek` (to learn the size), `read`, `write`                                                        | S.5       | 2.2                  |
| `sort`         | print lines in order (`-r` reversed, `-n` by number, `-o file` into a file)                               | `open`, `read`, `close`, `writev`                                                                             | S.5       | 1.6                  |
| `uniq`         | drop repeated neighbouring lines (`-c`: count them)                                                       | `open`, `read`, `close`, `writev`                                                                             | S.5       | 1.7                  |
| `cmd \| cmd`   | connect two programs: one's standard output becomes the other's input                                     | `pipe`, `fork` per side, `dup2`, `close`, `execve`, `wait4` (bash adds a pipe of its own)                     | S.5       | 1.7                  |
| `true`/`false` | do nothing, and exit 0 or 1                                                                               | none as bash builtins; `/bin/true` only starts and exits                                                      | 1.7       | 1.7                  |
| `dd`           | copy data in blocks of a chosen size (`bs=1`: one byte per `read`)                                        | `open`, `dup2` (input onto fd 0), `read` and `write` per block                                                | 2.5       | 2.5, 2.8a            |
| `/`            | the root of the one tree; every path starts here or at the working directory                              |                                                                                                               | P.1       | S.1                  |
| `.`, `..`      | this folder, and the one above it; real entries in every folder                                           |                                                                                                               | P.3       | S.1                  |
| `/bin`, `/usr` | programs and their shared files; most distributions make `/bin` a link to `/usr/bin`, the Machine doesn't |                                                                                                               | P.1       | P.3, 1.4             |
| `/boot`        | the kernel and its boot files (`vmlinuz-virt`, its config, `System.map`)                                  |                                                                                                               | P.4       | 2.1                  |
| `/etc`         | system settings: `motd`, `passwd`, `group`, `shadow`, `os-release`                                        |                                                                                                               | P.1       | S.2                  |
| `/home`        | one home folder per user; yours is `/home/you`                                                            |                                                                                                               | P.1       | S.1, 1.5             |
| `/tmp`         | scratch space anyone may write                                                                            |                                                                                                               | S.1       | 1.6                  |
| `/dev`         | device files: doors into drivers                                                                          |                                                                                                               | P.9       | 2.4                  |
| `/proc`        | files the kernel writes at the moment you read them                                                       |                                                                                                               | P.7       | S.1, 1.5, 2.7        |
| `/sys`         | the kernel's devices and drivers, one value per file                                                      |                                                                                                               | P.6       | 2.3, 2.7             |
| `/lib/modules` | the kernel's modules, one folder per kernel release                                                       |                                                                                                               | P.5       | 2.2                  |

The Field Guide grows with the game: Act I also adds `strace`, `make`, `gdb`, `nc`
and `ss`; Act II adds `insmod`, `rmmod`, `lsmod`, `modinfo` and `git`. Any later level
that first uses a row above names the command in a line of its scene or See it.

---

## S.1 — The Streets of Userland

- **Id:** `prologue-surface-survey-01-streets` · **Region / NPC:** Userland's streets / init, the Watchdog · **Tracks:** `userland` · **Time:** ~25 min · **Prerequisites:** `sys-shell-basics`, `sys-command-lifecycle` · **Skills unlocked:** `io-fs-hierarchy`

**Question:** What is a folder, and what really moves when you move a file? A folder
is a list of names, each pointing at an inode; a move changes a name, not the bytes.

**Teaches:** `working-directory`, `inode`, `builtin`. **Uses:** `file-tree`, `shell`,
`process`, `syscall`, `proc-fs`, `distribution`. The story text is the level's
`story.md`; this section lists its beats.

### Scene

Opens from P.10 ("You brought the Machine up and saw it from my doorstep. Now walk
it"). Userland is one tree of folders, the file tree from Power On, and every program
stands somewhere in it; every step asks the kernel; today the player builds a little.

### See it (X-ray)

1. **Name:** _working directory_, the folder a process's paths start from. **Do:**
   `pwd` prints `/home/you`.
2. **Name:** _absolute_ (starts with `/`, walked from the root) and _relative_ (walked
   from the working directory; `..` is one folder up). **Do:** `cd /etc`, `pwd`,
   `cd ..`, `pwd` (`/etc`, then `/`).
3. **Name:** _builtin_, a command the shell does itself. X-ray on `cd /etc` shows no
   program started, only bash's own `chdir("/etc")`. It has to be a builtin: a working
   directory belongs to one process, so a program started for the job would move
   itself and exit.
4. **Do:** `cd home/you`, then `cat ../../etc/motd`. X-ray: bash worked the path out
   and handed the kernel `chdir("/home/you")`; `cat` handed over `../../etc/motd` as
   typed (`open("../../etc/motd", O_RDONLY|O_LARGEFILE) = 3`), and the kernel walked
   it from `cat`'s working directory.

### Build it

- **Worked examples:** `mkdir /tmp/survey`, `mkdir /tmp/survey/maps`, `mkdir -p /tmp/survey/notes/old`;
  `cp /etc/motd /tmp/survey/maps/motd`, `cp /etc/os-release /tmp/survey/maps/`,
  `ls -i /etc/motd /tmp/survey/maps/motd` (two numbers, e.g. `142` and `6`: inode
  numbers on `/tmp` vary by run); `mv motd motd.old` keeps the number; `rm`;
  `rmdir ../notes` → `rmdir: '../notes': Directory not empty`.
- **Errand:** leave `/tmp/survey` holding exactly `maps/os-release` and an empty
  `notes/`, and stand in `/tmp/survey`.
- **X-ray on the new commands:**

  ```
  mkdir("/tmp/survey", 0777)                                    = 0
  mkdir("/", 0777)                                              = -1 EEXIST (File exists)
  statx(AT_FDCWD, "/", ...)                                     = 0
  mkdir("/tmp/", 0777)                                          = -1 EEXIST (File exists)
  statx(AT_FDCWD, "/tmp/", ...)                                 = 0
  mkdir("/tmp/survey/", 0777)                                   = -1 EEXIST (File exists)
  statx(AT_FDCWD, "/tmp/survey/", ...)                          = 0
  mkdir("/tmp/survey/notes/", 0777)                             = 0
  mkdir("/tmp/survey/notes/old", 0777)                          = 0
  open("/etc/motd", O_RDONLY|O_LARGEFILE)                       = 3
  open("/tmp/survey/maps/motd", O_WRONLY|O_CREAT|O_EXCL|O_LARGEFILE, 0100644) = 4
  sendfile64(4, 3, NULL, 16777216)                              = 124
  rename("motd", "motd.old")                                    = 0
  unlink("../notes/motd.old")                                   = 0
  rmdir("../notes")                                             = -1 ENOTEMPTY (Directory not empty)
  ```

  `mkdir -p` tries every folder on the way (`EEXIST` and a `statx` for those already
  there).
- **Checker:** a successful `chdir` to `/etc`; one to `/` right after bash `statx`ed a
  folder (bash checks the folder before each `..`; `cd /` checks none); a program
  `open`ing a path that starts with `..` (bash makes every `cd` path absolute, so a
  relative `cd` can't be told from an absolute one); a `mkdir` run with
  two successful calls; an `ls -i` with two names of one file and different inodes;
  an `mv` with a `rename` and no data call (`read`, `write`, `readv`, `writev`,
  `pread64`, `pwrite64`, `sendfile`, `sendfile64`, `copy_file_range`, `splice`) after its
  `execve`; `rmdir` failing with `ENOTEMPTY` and one succeeding; an `ls -R` showing
  the exact tree; the shell printing `/tmp/survey`.

### Watch it

**Predict:** "`ls -l` prints a file's size. What size will it print for
`/proc/uptime`?" 0 bytes. Real output (the date is the boot's, the numbers the
moment's):

```
$ ls -l /proc/uptime
-r--r--r--    1 root     root             0 Nov 12 18:43 /proc/uptime
$ cat /proc/uptime
36.24 3.18
```

Size 0, and `cat` prints text anyway: as with `/proc/version` in Power On, nobody
stored it. The name is in a folder like any other, but behind it is kernel code
that writes the text at read time, not stored bytes. Then the `mv`: each made one `rename` and no `read`
or `write`; `rm` was one `unlink`, which removed a name.

### Debrief

A folder is a list of names, and moving a file changes a name, not its bytes. The
lock the player has already seen, `-r--r--r--` in `ls -l /proc/uptime`; S.2, Who May
Enter, begins.

### Hints

1. Nudge: "Where are you standing right now? There's a command that just tells you."
2. Concept: absolute and relative paths, `..`, and `mkdir -p`.
3. Point at the spot: `ls -R /tmp/survey` shows what's left; `rm` for files, `rmdir`
   for empty folders, then `pwd`.

### Codex (chapter: Surface Survey)

`filesystem-hierarchy` (deepens `files`), `reading-a-directory`,
`directory-entries` (inodes; `rename`, `unlink`, `ENOTEMPTY`), `procfs` (deepens
`filesystems`).

### Real-world card and fidelity

The same walk with `strace` on any Linux; the card notes GNU's `openat`,
`renameat2` and `unlinkat` on a 64-bit PC. Fidelity: everything shown is the
Machine's; the street signs and the Map are drawings; `pwd`'s output is judged as
text, which an `echo` of the same text would match.

### Moved out of the story

| What                                                                     | Where it is now                       |
| ------------------------------------------------------------------------ | ------------------------------------- |
| `ls /` and its `getdents64` calls, the hidden `.` and `..`               | Codex `reading-a-directory`           |
| `cat motd`'s `sendfile64` calls                                          | X-ray, on the player's own `cat`      |
| `pwd` as a builtin with a single `writev`                                | fidelity note                         |
| `mkdir -p`'s `EEXIST` tries                                              | this spec (X-ray on the new commands) |
| What `/proc/uptime`'s two numbers mean                                   | Codex `procfs`'s "try it"             |
| GNU `cp`'s `ioctl(FICLONE)`, and which kernel function each call ends in | dropped                               |

---

## S.2 — Who May Enter

- **Id:** `prologue-surface-survey-02-who-may-enter` · **Region / NPC:** Userland's locked files / init, the neighbour (user `guest`, uid 1001) · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `io-fs-hierarchy` · **Skills unlocked:** `io-permissions`

**Question:** Who decides whether you may open a file, and by what rule? The kernel,
on every open: it picks owner, group or everyone else, then checks that one's three
letters.

**Teaches:** `uid`, `permissions`, `capability`. **Uses:** `inode`, `file-tree`,
`process`. The story text is the level's `story.md`; this section lists its beats.

### Lab

`guest` replaces Alpine's own (uid 405) as uid 1001; `/home/you/notes.txt` (57 bytes,
`-rw-r--r--`); `/usr/local/bin/say`, a small C program built by gcc at setup that
prints its arguments. (`cp /bin/echo hi` can't be the example: `/bin/echo` is a link
to BusyBox, and its copy answers `hi: applet not found`.)

### Scene and See it

```
$ cat /etc/shadow
cat: can't open '/etc/shadow': Permission denied
$ id
uid=1000(you) gid=1000(you) groups=1000(you)
$ ls -l /etc/shadow
-rw-r-----    1 root     shadow         274 Jan  1  1970 /etc/shadow
```

```
open("/etc/shadow", O_RDONLY|O_LARGEFILE) = -1 EACCES (Permission denied)
```

The Scene opens from S.1's `-r--r--r--` and has the player try a locked file.
See it names the _user ID_ (`id`), the _group_, and the _permissions_: the first
character is the kind, then three letters each for owner, group and everyone else,
kept in the file's inode. The kernel uses one of the three: not the owner, not in
the file's group, so the last three, `---`, and `EACCES`.

### Build it

- **The execute bit:** `cp /usr/local/bin/say hi`, `chmod -x hi`, `./hi hello,
  Machine` → `-bash: ./hi: Permission denied`: the kernel refuses the `execve` with
  `EACCES`. `chmod u+x hi` and it prints `hello, Machine` (`u`, `g`, `o` named).
- **A folder's `x`:** "may pass through". `chmod`'s numbers (r 4, w 2, x 1) are
  introduced here: `mkdir box`, `cp notes.txt box/`, `chmod 644 box`,
  `cat box/notes.txt` → `cat: can't open 'box/notes.txt': Permission denied`;
  `chmod 755 box` and it reads.
- **Errand:** `notes.txt` is `-rw-r--r--`; make it the player's alone and check with
  `ls -l notes.txt`. Then `chmod 666 /etc/motd` →
  `chmod: /etc/motd: Operation not permitted`. A lockout is undone by the owner.
- **Checker:** a failed `execve` with `EACCES`, and an exec of `hi` after an earlier
  `chmod` took its owner's `x` away; a player `cat` through `box` refused while an
  earlier `chmod` (or none since `mkdir box`) left `box` without its owner's `x`, and
  allowed; an `ls -l` line for `notes.txt` with `r` for the
  owner only (BusyBox colours the name on a terminal, so the line is read as plain
  text); the neighbour's `cat` (run by `runuser`, `su` or `setpriv`: in the same task, or
  in a child it forked, as `runuser` does for its PAM session) refused with `EACCES`;
  `chmod` failing with `EPERM`.

### Watch it

**Predict:** at `-rw-------`, who can read it: you, the neighbour, init? You by the
owner bits; the neighbour not (init's knock: `cat: can't open '/home/you/notes.txt':
Permission denied`); init, user 0, _root_, by a _capability_, a named privilege the
kernel checks when the letters say no. `EPERM` from `chmod` is a different error
from `EACCES`: only a file's owner, or root, may change its permissions.

### Debrief

The kernel decides on every open; locks say who may touch a file, and S.3, Processes
from Outside, meets the ones doing the touching.

### Hints

1. Nudge: read the `ls -l` line left to right: who owns the note, which letters are
   on for everyone else?
2. Concept: three groups of `rwx`, one of them used; `chmod`'s numbers.
3. Point at the spot: `rw-` for the owner, `---` for group and others; work out each
   number (the digits themselves aren't given).

### Moved out of the story

| What                                                           | Where it is now          |
| -------------------------------------------------------------- | ------------------------ |
| The `may_open()` → `generic_permission()` chain                | Codex `permission-check` |
| `CAP_DAC_READ_SEARCH` and `CAP_DAC_OVERRIDE` by name           | Codex `permission-check` |
| The other kind letters (`l`, `c`, `b`) and the rest of `ls -l` | Codex `permission-bits`  |
| `/dev/null` and `/dev/sda`'s locks                             | dropped (P.9 lists them) |
| bash's child, `execve` and exit status 126                     | Act I (1.4)              |
| `runuser`, `su`, and the knock before the note is private      | fidelity note; dropped   |
| Reading three `ls -l` lines as a drill                         | dropped                  |

### Codex

`users-and-ids`, `permission-bits`, `permission-check`.

### Fidelity

Everything shown is the Machine's real check. The Machine has no sudo, ACLs or
SELinux. The neighbour's knock is init's: once `note-private` is met, the game runs
`cat /home/you/notes.txt` as `guest` through `runuser`, as root (level.yaml `runAs`).
The refusals and runs are judged from the kernel's events; the modes `hi` and `box`
had before are read from the earlier command lines (a plain `chmod` that exited 0, and
`mkdir box`), since a check sees one command's events.

---

## S.3 — Processes from Outside

- **Id:** `prologue-surface-survey-03-processes` · **Region / NPC:** the edge of the Process District / init, the Watchdog · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `io-permissions`, `proc-process-basics` · **Skills unlocked:** `proc-observe`

**Question:** How do you pause or end a running process from outside, and when does
it obey? With signals; it acts on one the next time it runs, and a stopped process
doesn't run.

**Teaches:** `process-state`, `pending-signal`, `zombie`. **Uses:** `signal` (from
P.5), `process`, `pid`, `parent`, `kernel-thread`, `proc-fs`, `uid`, `capability`,
`hex`, `builtin`. The story text is the level's `story.md`; this section lists its
beats.

### Lab

Setup runs `sh -c 'yes > /dev/null & exec sleep 86400'` as `you`, in a subshell that
exits: init adopts `sleep` (PPID 1), and `yes` is `sleep`'s child. `sleep` never waits,
so an ended `yes` stays a zombie until `sleep` ends too and init adopts and collects
it. No fixed PIDs: the player reads them from `ps`.

### Scene

Opens from S.2 ("the ones doing the touching"): init started a `sleep` and a `yes`
as the player. Signals are called back from The Kernel, Up Close (`poke`'s
`SIGSEGV`); today the player sends them.

### See it

```
$ ps -o pid,ppid,user,stat,time,comm
PID   PPID  USER     STAT TIME  COMMAND
    1     0 root     S     0:00 init
    2     0 root     SW    0:00 kthreadd
...
  481     1 you      S     0:00 sleep
  483   481 you      R     0:01 yes
  484     1 you      S     0:00 bash
  487   484 you      R     0:00 ps
```

**Name:** the _state_, the first `STAT` letter: `R` running or ready, `S` sleeping;
`TIME` is CPU time used. The `PPID` 2 lines are the kernel's threads from Who Runs.
`kill` sends a signal and is a builtin (`kill(481, SIGSTOP) = 0` is bash's own call).
**Do:** `kill -STOP` and `kill -CONT` on `sleep`, then `cat /proc/PID/status`:
`State:	S (sleeping)`, `PPid:	1`.

### Build it

- Run `ps -o pid,stat,time,comm` twice and watch `yes`'s `TIME` grow.
- **Errand:** pause `yes`, check `T` and a `TIME` that stops; send `SIGTERM` (plain
  `kill`) while paused and `cat` its status; `kill -CONT`; `ps` again; end `sleep`;
  check with `ps` that it is gone; try `kill 1`.
- **Checker:** a `ps` listing with `sleep` and `yes`; a read of `sleep`'s or `yes`'s
  `/proc/<pid>/status` (its `Name:` line); `yes` shown in `T` by `ps` or its status;
  its status with `State:	T (stopped)` and `ShdPnd:	0000000000004000`; a full `ps`
  listing with a `COMMAND` column (`ps -o pid` names no one) where `yes` is a zombie
  or gone, and one without `sleep`; `kill(1, …)` = `-EPERM`. The setup's processes
  aren't traced, so their state is judged from what `ps` and `/proc` print.

### Watch it

**Predict:** does a paused `yes` end on `SIGTERM`? No: the signal waits in `ShdPnd`
(`4000` hexadecimal, the fifteenth bit), `State` stays `T`; after `SIGCONT` it ends,
and `ps` shows `483 Z    yes`, a _zombie_: its parent, `sleep`, never collects it.
Once the player ends `sleep`, init adopts the zombie and collects it. `kill 1` →
`-bash: kill: (1) - Operation not permitted`: `EPERM`; root may signal anyone, by
another capability.

### Debrief

A process is found with `ps` and spoken to with signals; it obeys the next time it
runs. S.4, Finding Things, begins.

### Hints

1. Nudge: which `ps` column says a process is paused, and which gives `kill` its
   number?
2. Concept: `kill -STOP`, `kill -CONT`, `kill`; a paused process acts on signals once
   resumed.
3. Point at the spot: the order (pause, end, read the status, wake); no command line
   is given.

### Codex

`process-states` (deepens `process`), `sending-signals` (deepens `signals`).

### Moved out of the story

| What                                                         | Where it is now         |
| ------------------------------------------------------------ | ----------------------- |
| The signal table (`SIGKILL` 9, `SIGTERM` 15, `SIGCONT` 18…)  | Codex `sending-signals` |
| `SIGKILL` and `SIGSTOP` can't be refused; `CAP_KILL` by name | Codex `sending-signals` |
| States `I`, `D`, and BusyBox's `W`, `<`, `N`                 | Codex `process-states`  |
| How a signal is marked and delivered                         | Act I                   |
| `$$` and reading the shell's own status                      | dropped                 |

---

## S.4 — Finding Things

- **Id:** `prologue-surface-survey-04-finding-things` · **Region / NPC:** init's attic / init · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `io-fs-hierarchy` · **Skills unlocked:** `io-find-files`

### Lab

`/home/you/attic` (four folders, about 30 files, one `lantern-plan.txt` in
`boxes/old`), two `guest` files and one of yours in `/tmp`.

**Question:** A command prints answers and complaints on one screen. How are they
kept apart, and how do you send each one somewhere else? Two file descriptors, 1 and
2, and the shell decides where each leads before the program starts.

**Teaches:** `stderr`, `redirection`. **Uses:** `fd`, `terminal`, `shell`,
`file-tree`, `permissions`, `device-file`. The story text is the level's `story.md`;
this section lists its beats.

### Scene

Opens from S.3's debrief (the papers hidden in the attic): init's plan,
`lantern-plan.txt`, is somewhere under `attic`. `find` walks a whole tree; the player
runs `find attic -name lantern-plan.txt` (`attic/boxes/old/lantern-plan.txt`).

### See it

The beats: how `find` walks (`open`, `getdents64`, `statx`, into every folder; the
kernel only answers); its tests `-name`, `-type d`, `-user`; `find / -name passwd`
with two results among nearly four hundred complaints; _standard output_ (fd 1) and
_standard error_ (fd 2), both leading to the terminal; _redirection_ with `>` and
`2>`. The outputs the story quotes or the errand produces:

```
$ find attic -type d
attic
attic/boxes
attic/boxes/old
attic/shelf
$ find /tmp -user guest
/tmp/lamp-oil.txt
/tmp/guest-note.txt
$ find / -name passwd
/etc/passwd
find: /proc/tty/driver: Permission denied
find: /proc/1/task/1/fd: Permission denied
...                                             395 complaints in all
find: /root: Permission denied
find: /sys/kernel/tracing: Permission denied
/usr/bin/passwd
```

Results leave through `writev(1, …)`, complaints through `write(2, …)`. Under
`/proc`, each root-owned process's `fd`, `fdinfo`, `ns` and `map_files` are closed to
the player. Then the two redirections:

```
$ find / -name passwd 2>/dev/null
/etc/passwd
/usr/bin/passwd
$ find attic -type d > folders.txt
```

The child of `find attic -type d > folders.txt` (trimmed: before these it closes and
reads bash's own pipe, `close(4)`, `read(3, …, 1)`, `close(3)`):

```
open("folders.txt", O_WRONLY|O_CREAT|O_TRUNC|O_LARGEFILE, 0666) = 3
dup2(3, 1)                                                       = 1
close(3)                                                         = 0
execve("/usr/bin/find", ["find", "attic", "-type", "d"], ...)    = 0
```

For `2>/dev/null` it opens `/dev/null` and calls `dup2(3, 2)`. The story shows only
the `open` and the `dup2`.

### Build it

- **Worked example:** `find attic -type d > folders.txt` and `cat folders.txt`, then
  the `open` (made if missing, emptied if not, lowest free fd 3) and `dup2(3, 1)`.
  `>` empties the file first.
- **Errand:** `cat` the plan; find `guest`'s files in `/tmp`; run
  `find / -name passwd` again with the complaints thrown away (`/dev/null` is named
  as a device file that swallows what is written to it; the player puts `2>` and it
  together).
- **Checker:** one `find` path ending `/lantern-plan.txt`; `cat` opened it and printed
  `Someday.` (read from the terminal's bytes, or from `sendfile64`'s data once the
  trace has it); the attic's four folders, on the screen and redirected into a file
  (an `open` and a `dup2(…, 1)` before `execve`); `guest`'s two files; a
  `find` printing `/etc/passwd` on fd 1 and `Permission denied` on fd 2 with neither
  redirected; the same with fd 2 redirected to `/dev/null` (a file of the player's
  keeps the errors, it doesn't throw them away).

### Watch it

**Predict:** with `> found.txt`, which lines still show? The complaints: only fd 1
went into the file; `2>/dev/null` did the opposite with `dup2(3, 2)`. The program
doesn't choose: the shell does, before the program starts. init then owns up to the
plan: "The Lantern: a driver of our own."

### Debrief

Two file descriptors keep answers and complaints apart, and the shell decides where
each leads. S.5, Counting and Sorting, sends one program's output into another.

### Hints

1. Nudge: which command walks a whole tree?
2. Concept: `find`'s tests, `> file` and `2> file`.
3. Point at the spot: the complaints leave on fd 2; which of `>` and `2>` moves it,
   and which file swallows what is written to it (the command isn't given).

### Moved out of the story

| What                                                       | Where it is now        |
| ---------------------------------------------------------- | ---------------------- |
| bash's child, its `close(3)` and `execve` after the `dup2` | Codex `redirection`    |
| Which `/proc` folders are closed to the player, and why    | dropped                |
| `find /etc -name motd`, and the order `find` prints in     | dropped                |
| Unbuffered `stderr`                                        | Codex `standard-error` |

### Codex

`finding-files` (deepens `reading-a-directory`; BusyBox find, GNU find quotes paths),
`standard-error` (deepens `file-descriptors`), `redirection`.

---

## S.5 — Counting and Sorting

- **Id:** `prologue-surface-survey-05-text-tools` · **Region / NPC:** init's survey desk / init, the Watchdog · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `sys-shell-basics` · **Skills unlocked:** `sys-text-tools`

### Lab

`/home/you/census.txt`: 40 lines, 80 words, 742 bytes; 31 `dark`, 9 `lit`.

**Question:** How does one program's output become another program's input, with no
file in between? Through a pipe, a buffer in the kernel: one program writes into it
and the next reads from it.

**Teaches:** `text-line`, `pipe` (named in P.4's `dmesg | grep`). **Uses:**
`redirection`, `fd`, `shell`, `syscall`, `uid`. The story text is the level's
`story.md`; this section lists its beats.

### Scene, See it and Build it

Opens from S.4 (the plan found, a list sent into a file). **Name:** a _line_, text up
to a newline. **Do:** `wc -l census.txt` (`40 census.txt`; `wc -w` 80 and `wc -c` 742
are told), `grep -c dark census.txt` (`31`; `grep -v dark` is told), and
`grep you /etc/passwd` (`you:x:1000:1000:you:/home/you:/bin/bash`; the `x` points at
`/etc/shadow` from S.2). Each tool: `open`, `read` in pieces, write; the idea of a
line lives in the tools.

- **Errand:** `uniq` only sees a line repeating the one above it (`uniq census.txt`
  gives 37 of 40), so `sort census.txt > sorted.txt`, then `uniq -c sorted.txt`:

  ```
        8 compilers-quarter dark
        8 process-district dark
        7 socket-harbor dark
        5 syscall-gate dark
        3 userland dark
        9 userland lit
  ```

- **Checker:** `wc -l` printing `40 census.txt`; `grep` printing `31`, or `wc` printing
  `31` after reading from a pipe exactly the bytes a `grep` of `census.txt` wrote
  (`grep dark census.txt | wc -l`, for the placement check); `grep` printing
  the player's `/etc/passwd` line; `sort` writing every byte it read into `sorted.txt`
  in byte order (through `>` or `-o`); `uniq -c` on `sorted.txt` printing six counts
  that add up to 40; `uniq -c` reading a pipe (its fd 0 `dup2`'d from a non-file
  before `execve`) and printing the same counts.

### Watch it

The _pipe_ is named at the end of Build it, with the callback to The Boot Path's
`dmesg | grep`; the player runs `sort census.txt | uniq -c`. **Predict:** "`sort`
wrote its lines to file descriptor 1. Where did they go?" Into a buffer inside the
kernel. The story shows five lines of bash's real trace (the `pipe`, the two `dup2`s,
the 719-byte `writev` and `read`) and names _standard input_, fd 0. The whole trace
(PIDs are the recording's):

```
pipe([3, 4])                                            = 0
pipe([5, 6])                                            = 0
fork()                                                  = 511
fork()                                                  = 512
[pid 511] dup2(4, 1)                                    = 1
[pid 511] execve("/usr/bin/sort", ...)                  = 0
[pid 512] dup2(3, 0)                                    = 0
[pid 512] execve("/usr/bin/uniq", ...)                  = 0
[pid 511] writev(1, "compilers-quarter dark\n", ...)       = 23
[pid 512] read(0, "compilers-quarter dark\n", 1024)      = 23
[pid 511] writev(1, "compilers-quarter dark\ncomp"..., ...) = 719
[pid 512] read(0, "compilers-quarter dark\ncomp"..., 1024) = 719
...
wait4(-1, ...)                                          = 511
wait4(-1, ...)                                          = 512
```

The data pipe comes first (3, 4); the second (5, 6) is bash's own, made before every
command it starts, and holds `sort` until `uniq` exists too. A pipe holds
64 KiB by default and stores nothing on a disk.

### Debrief

A pipe is a buffer in the kernel. Ends the Surface and hands on to 1.4, Run
Anything, where the player stops using a shell and starts building one.

### Hints

1. Nudge: `uniq` only squashes neighbours; how do equal lines get next to each other?
2. Concept: `>` into a file, as in Finding Things; `|` straight into the next command.
3. Point at the spot: two steps with a file, then the same two commands with `|`
   where the file was (the command lines aren't given).

### Moved out of the story

| What                                                    | Where it is now          |
| ------------------------------------------------------- | ------------------------ |
| `head`, `tail`, `grep -n`, `grep -i`, `sort -r`         | real-world card; dropped |
| bash's `fork`s, `execve`s, `wait4`s and its second pipe | Codex `shell-pipeline`   |
| The pipe's 64 KiB and a reader's end of file            | Codex `shell-pipeline`   |
| The carriage return that Enter sends                    | dropped                  |
| The Compiler's Quarter and 1.0 as coming later          | dropped                  |

### Codex

`text-tools` (BusyBox applets on the Machine), `passwd-file` (deepens
`users-and-ids`; musl reads `/etc/passwd` itself, glibc through NSS),
`shell-pipeline`.

### Taint (all levels)

No Taint rules are live in the Survey.
