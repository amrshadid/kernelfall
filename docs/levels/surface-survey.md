# Surface Survey: the streets of Userland

Level specs for the Surface Survey, the on-ramp between the Prologue and Act I. Read
[GAME.md](../GAME.md) for the story and systems, [LEVELS.md](../LEVELS.md) for the
rules, and [prologue.md](prologue.md) for what the player already knows. The whole
path is in [LEVELS.md](../LEVELS.md#4-the-journey).

Kernel source paths follow Linux 6.18 (LTS). Anything marked "(verify)" must be
checked before the level ships.

**Five levels, about 1 hour 40 minutes,** played after the Prologue's capstone
(P.10). The shell itself is taught earlier, in the Prologue's
[P.3 Speak to the Shell](prologue.md#p3--speak-to-the-shell), right after the first
syscall, so the player types every command from P.3 on. Each new idea here comes
with two or three worked examples and a practice errand the checker can see. Every
new word is explained in plain words the first time, and added to the Codex
glossary (started in the [Prologue](prologue.md#glossary-first-meeting-words)).

| #   | Level id                                    | Title                   | Time    | Skills unlocked   |
| --- | ------------------------------------------- | ----------------------- | ------- | ----------------- |
| S.1 | `prologue-surface-survey-01-streets`        | The Streets of Userland | ~25 min | `io-fs-hierarchy` |
| S.2 | `prologue-surface-survey-02-who-may-enter`  | Who May Enter           | ~20 min | `io-permissions`  |
| S.3 | `prologue-surface-survey-03-processes`      | Processes from Outside  | ~20 min | `proc-observe`    |
| S.4 | `prologue-surface-survey-04-finding-things` | Finding Things          | ~15 min | `io-find-files`   |
| S.5 | `prologue-surface-survey-05-text-tools`     | Counting and Sorting    | ~20 min | `sys-text-tools`  |

**New skills** (to add to [CURRICULUM.md](../CURRICULUM.md); the first two keep
their ids, `io-fs-hierarchy` with a wider outcome):

| Id                          | The player can…                                                                                                                    | Needs                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `io-fs-hierarchy` (updated) | move around the tree with absolute and relative paths, and create, copy, move, rename and remove files and folders                 | `sys-shell-basics`                      |
| `io-permissions`            | (unchanged) read an `ls -l` mode string, explain uids, groups and root, and say how the kernel's check answers `EACCES` or `EPERM` | `io-fs-hierarchy`                       |
| `proc-observe`              | find a process with `ps` and `/proc`, read its state and parent, and stop, pause, resume or end it with `kill`                     | `io-permissions`, `proc-process-basics` |
| `io-find-files`             | find files by name, type and owner with `find`, and tell normal output from error messages (standard error)                        | `io-fs-hierarchy`                       |
| `sys-text-tools`            | count, search, slice, sort and de-duplicate lines in files with `wc`, `grep`, `head`, `tail`, `sort` and `uniq`                    | `sys-shell-basics`                      |

`sys-shell-basics` is now granted by P.3 (see [prologue.md](prologue.md)).

**Where it leads:** every command the player runs here comes back in Act I, built
by their own hands: cutting a line into words (1.0 and 1.1's tokenizer), running a
program found through `PATH` (1.4), `cd` and the environment (1.5), `cat`'s
`read`/`write` and `Permission denied` (1.6), `|` (1.7), signals (1.8), and
`/proc/<pid>/status` (1.5). Root, met in S.2, is granted at the Syscall Gate (1.B)
and needed in the Deep (2.2, 2.4).

**What the Survey doesn't do:** the rescue shell has no pipes (`|`), no redirection
(`>`, `<`), no variables (`$HOME`), no quoting and no wildcards (`*`). Act I builds
those into the player's own shell (1.5–1.7). So the Survey uses programs, never
those shell features: `sort -o out.txt` instead of `sort > out.txt`, two steps
instead of a pipe. When a real shell would differ, the level says so.

**Project:** none yet. The player uses init's rescue shell. Its gaps are why they
build `ksh-lite` in Act I.

## Glossary additions (Survey)

| Word                       | In plain words                                                                               | Examples on screen                                                         | First met |
| -------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------- |
| absolute and relative path | a path from the root (starts with `/`), or from where you stand (doesn't)                    | `/etc/motd`; `motd`; `../tmp`                                              | S.1       |
| working directory          | the folder a process is "standing in"; relative paths start there                            | `/home/you`; `/etc` after `cd /etc`                                        | S.1       |
| inode                      | the kernel's record of one file: its data, size, owner; names in folders point to it         | `ls -i` shows its number                                                   | S.1       |
| user ID, group             | the number the kernel knows a user by; a group is a named set of users                       | `you` is 1000; `root` is 0; group `shadow`                                 | S.2       |
| root                       | the administrator, user ID 0, allowed past almost every check                                | init; `sudo` on real systems                                               | S.2       |
| permission bits            | nine on/off switches on every file: read, write, execute, for owner, group and everyone else | `rw-r--r--`; `rwx------`                                                   | S.2       |
| standard error             | fd 2, where programs write error messages, kept apart from normal output                     | `Permission denied` lines from `find`; `cat: x: No such file or directory` | S.4       |
| line                       | text up to a newline character; most tools work one line at a time                           | one row of `census.txt`; one `/etc/passwd` entry                           | S.5       |

## Placement check

Players who already live in a terminal can skip the Survey. At the edge of
init's street, init offers: "Know your way around? Show me, and walk on."

- **Format:** about 7 minutes, five errands in the rescue shell, one per level. No
  trivia, no timer.
  1. Make `/tmp/survey`, copy `/etc/motd` into it, and rename the copy `motd.old`.
  2. Make `notes.txt` readable by you only, and keep it readable by you.
  3. Pause init's `sleep` process, then end it.
  4. Find the file `lantern-plan.txt` somewhere under `/home/you/attic`.
  5. Print how many lines of `census.txt` contain `dark`.
- **Result:** each errand maps to one level. Passing places the player past it
  (skills marked "placed"); a failed errand sends them to just that level. The
  check can be retaken any time, and placed levels stay playable from the map.
- **Taint:** none.

## The Field Guide (Codex page)

An always-available page in the Codex, opened at the start of P.3 (it lives here
because most of its entries are Survey commands). One entry per
command and per folder. Each entry says what it is in one line, lists the syscalls
it makes (each a link to its Codex card), names the level where the player first
meets it, and the level that teaches the mechanism underneath. An entry appears
when the level that first uses it starts, and that level introduces the command in
a line before any checker relies on it.

| Entry          | What it is                                                                                                 | Syscalls (in the lab)                                       | First met | Built or deepened in |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------- | -------------------- |
| `echo`         | print its arguments                                                                                        | `write`                                                     | P.1       | P.2                  |
| `ls`           | list a folder (`-l` long form, `-a` names starting with `.` too, `-i` inode numbers)                       | `openat`, `getdents64`, `write` (`-l`: a `statx` per entry) | P.1       | S.1, 2.7             |
| `cat`          | copy files to standard output                                                                              | `openat`, `read`, `write`, `close`                          | P.1       | 1.6, 2.5             |
| `dmesg`        | print the kernel's log                                                                                     | `openat` of `/dev/kmsg`, `read`                             | P.4       | 2.2                  |
| `uname`        | print the kernel's name, release and CPU type                                                              | `uname`                                                     | P.5       | P.5                  |
| `lspci`        | list PCI devices (`-k`: and their drivers)                                                                 | reads `/sys/bus/pci` (`openat`, `getdents64`, `read`)       | P.6       | 2.4                  |
| `dtc`          | compile a device tree from text to binary                                                                  | `openat`, `read`, `write`                                   | P.6       | P.6                  |
| `ps`           | list processes                                                                                             | reads `/proc` (`openat`, `getdents64`, `read`)              | P.7       | S.3, 1.4, 1.5        |
| `nproc`        | print how many CPUs this process may use                                                                   | `sched_getaffinity`                                         | P.7       | P.7                  |
| `yes`          | print `y` forever, until stopped                                                                           | `write`, again and again                                    | P.7       | 1.7                  |
| `free`         | show memory use                                                                                            | reads `/proc/meminfo`                                       | P.8       | 2.8                  |
| `reboot`       | restart the Machine                                                                                        | `reboot`                                                    | P.10      | P.10                 |
| `pwd`          | print the working directory                                                                                | `getcwd`                                                    | P.3       | 1.5                  |
| `man`          | show a manual page; `q` quits                                                                              | `openat`, `read`, `write`                                   | P.3       | P.3                  |
| `printenv`     | print environment variables (`printenv PATH`: just one)                                                    | `write` (the environment is already in its memory)          | P.3       | 1.5                  |
| `env`          | print the environment, or run a program with a setting added                                               | `write`, `execve`                                           | P.3       | 1.5                  |
| `wc`           | count lines, words and bytes (`-l` lines, `-w` words, `-c` bytes)                                          | `openat`, `read`, `write`                                   | P.3       | S.5, 1.6             |
| `cd`           | change the shell's working directory (part of the shell, not a program)                                    | `chdir`                                                     | S.1       | 1.5                  |
| `mkdir`        | make a folder (`-p`: and any missing folders above it)                                                     | `mkdir`                                                     | S.1       | S.1                  |
| `rmdir`        | remove an empty folder                                                                                     | `rmdir`                                                     | S.1       | S.1                  |
| `cp`           | copy a file                                                                                                | `openat`, `read`, `write`, `close`                          | S.1       | 1.6                  |
| `mv`           | move or rename a file (no bytes are copied on one filesystem)                                              | `renameat2`                                                 | S.1       | S.1                  |
| `rm`           | remove a file's name; there is no bin to get it back from                                                  | `unlinkat`                                                  | S.1       | S.1                  |
| `id`           | show your user and group IDs                                                                               | `getuid`, `getgid`, `getgroups` and friends                 | S.2       | S.2, 1.B             |
| `chmod`        | change a file's permission bits                                                                            | `fchmodat`                                                  | S.2       | S.2                  |
| `kill`         | send a signal to a process (`-STOP`, `-CONT`, `-TERM`, `-KILL`; `-l` lists them)                           | `kill`                                                      | S.3       | 1.8                  |
| `sleep`        | wait a number of seconds, then exit                                                                        | `clock_nanosleep`                                           | S.3       | 1.4, 1.5             |
| `find`         | search a folder tree for files by name, type, owner                                                        | `openat`, `getdents64`, a stat call per entry               | S.4       | S.4                  |
| `grep`         | print the lines that contain a word (`-c` count, `-n` numbers, `-v` the others, `-i` any case)             | `openat`, `read`, `write`                                   | S.5       | 1.7                  |
| `head`         | print the first lines (`-n 3`: three)                                                                      | `openat`, `read`, `write`                                   | S.5       | 1.7                  |
| `tail`         | print the last lines                                                                                       | `openat`, `read`, `write`                                   | S.5       | 2.2                  |
| `sort`         | print lines in order (`-r` reversed, `-n` by number, `-o file` into a file)                                | `openat`, `read`, `write`                                   | S.5       | 1.6                  |
| `uniq`         | drop repeated neighbouring lines (`-c`: count them)                                                        | `openat`, `read`, `write`                                   | S.5       | 1.7                  |
| `true`/`false` | do nothing, and exit 0 or 1                                                                                | `exit_group`                                                | 1.7       | 1.7                  |
| `dd`           | copy data in blocks of a chosen size (`bs=1`: one byte per `read`)                                         | `openat`, `read`, `write`                                   | 2.5       | 2.5, 2.8             |
| `cmd \| cmd`   | connect two programs (not in the rescue shell)                                                             | `pipe2`, `clone`, `dup2`, `execve`, `wait4`                 | S.5       | 1.7                  |
| `/`            | the root of the one tree; every path starts here or at the working directory                               |                                                             | P.1       | S.1                  |
| `.`, `..`      | this folder, and the one above it; real entries in every folder                                            |                                                             | P.3       | S.1                  |
| `/bin`, `/usr` | programs (`/usr/bin`) and their shared files; on most current distributions `/bin` is a link to `/usr/bin` |                                                             | P.1       | P.3, 1.4             |
| `/boot`        | the kernels, initramfs files and GRUB                                                                      |                                                             | P.4       | 2.1                  |
| `/etc`         | system settings: `motd`, `passwd`, `group`, `shadow`, `os-release`                                         |                                                             | P.1       | S.2                  |
| `/home`        | one home folder per user; yours is `/home/you`                                                             |                                                             | P.1       | S.1, 1.5             |
| `/tmp`         | scratch space anyone may write                                                                             |                                                             | S.1       | 1.6                  |
| `/dev`         | device files: doors into drivers                                                                           |                                                             | P.9       | 2.4                  |
| `/proc`        | files the kernel writes at the moment you read them                                                        |                                                             | P.7       | S.1, 1.5, 2.7        |
| `/sys`         | the kernel's devices and drivers, one value per file                                                       |                                                             | P.6       | 2.3, 2.7             |
| `/lib/modules` | the kernel's modules, one folder per kernel release                                                        |                                                             | P.5       | 2.2                  |

The Field Guide grows with the game: Act I also adds `strace`, `make`, `gdb`, `nc`
and `ss`; Act II adds `insmod`, `rmmod`, `lsmod`, `modinfo` and `git`. The levels
from 1.4 on that first use a row above must name the command in a line of their
scene or See it.

---

## S.1 — The Streets of Userland

- **Id:** `prologue-surface-survey-01-streets` · **Region / NPC:** Userland's streets, from init's house to the edge of the Process District / init, the Watchdog · **Tracks:** `userland` · **Time:** ~25 min · **Prerequisites:** `sys-shell-basics`, `sys-command-lifecycle` · **Skills unlocked:** `io-fs-hierarchy`

### Scene

> **init:** The Machine's up, all the way. You've peeked into a few folders on the way. Now walk with me. You can't fix a city you've never seen.
>
> **init:** Userland is one big tree of folders. The streets are folders: `/bin`, `/etc`, `/home`, `/tmp`, `/usr`. Every house is a file.
>
> **The Watchdog:** And every step you take asks the Kernel. Same as before.
>
> **init:** Today you don't just look. You build a little: make folders, copy, rename, clean up. Like moving into a house.

### See it (X-ray)

1. **Where you stand.** Every process has a **working directory**, the folder it is
   "standing in". `pwd` prints the shell's: `/home/you`.
2. **Absolute and relative paths.** Three ways to name the same file, from
   `/home/you`:

   ```
   $ cat /etc/motd          # absolute: starts at the root /
   $ cat ../../etc/motd     # relative: up to /home, up to /, down into etc
   $ cd /etc
   $ cat motd               # relative to the new working directory
   ```

   X-ray shows `cd /etc` as one call in the rescue shell itself:
   `chdir("/etc") = 0`. `cd` has to change the shell's own working directory, so it
   can't be a separate program (1.5 builds it).
3. **Reading a folder.** `ls /`:

   ```
   openat(AT_FDCWD, "/", O_RDONLY|O_NONBLOCK|O_CLOEXEC|O_DIRECTORY) = 3
   getdents64(3, /* 12 entries */, 32768) = 296
   getdents64(3, /* 0 entries */, 32768)  = 0
   close(3)                               = 0
   write(1, "bin  boot  dev  etc  home  lib  proc  sys  tmp  usr\n", 52) = 52
   ```

   A folder is a file too: `ls` opens it, reads its entries with `getdents64` until
   it gets 0 (the end), sorts them, and writes one line. (The 12 entries include `.`
   and `..`, which `ls` hides without `-a`.)
4. **Reading a file.** `cat motd`:

   ```
   openat(AT_FDCWD, "motd", O_RDONLY)          = 3
   read(3, "Welcome to the Machine.\nThe ker"..., 262144) = 80
   write(1, "Welcome to the Machine.\nThe ker"..., 80) = 80
   read(3, "", 262144)                         = 0
   close(3)                                    = 0
   ```

   A `read` that returns 0 means the end of the file.

### Build it

No C. Worked examples first, then an errand: set up a survey office in `/tmp`.

- **Starter provides:** the rescue shell in `/home/you` and the Field Guide page.
- **Worked examples (init does one, the player does the next two):**
  - **Moving around.** `cd /etc`, `pwd`; `cd ..`, `pwd` (now `/`); `cd home/you`
    (relative, from `/`), `pwd`.
  - **Making folders.** `mkdir /tmp/survey`; `mkdir /tmp/survey/maps`;
    `mkdir -p /tmp/survey/notes/old` (`-p` makes the missing `notes` too).
  - **Copying.** `cp /etc/motd /tmp/survey/maps/motd`; `cp /etc/os-release
    /tmp/survey/maps/`; then `ls -i /etc/motd /tmp/survey/maps/motd`: two
    different inode numbers. A copy is a new file.
  - **Moving and renaming.** `cd /tmp/survey/maps`; `mv motd motd.old` (rename);
    `ls -i motd.old` (the same inode number as before: the file didn't move, only
    its name); `mv motd.old ../notes/` (into another folder, same inode again).
  - **Removing.** `rm ../notes/motd.old`; `rmdir ../notes/old` (an empty folder);
    `rmdir ../notes` fails if anything is still inside: `Directory not empty`.
- **Errand:** leave `/tmp/survey` holding exactly `maps/os-release` and an empty
  `notes/`, and stand in `/tmp/survey` with the shell.
- **Checker verifies (behavior, from the lab's event stream and final state):**
  - Successful `chdir` calls with an absolute path, with `..`, and with a relative
    path that isn't `..`.
  - `mkdir` with `-p` created two folders in one run.
  - `ls -i` was run on a file before and after an `mv`, and printed the same inode
    number; and on a copy, printing a different one.
  - A `rmdir` failed with `ENOTEMPTY` and a later one succeeded.
  - The final tree of `/tmp/survey` is as asked, and the shell's working directory
    is `/tmp/survey`.

X-ray on the new commands:

```
mkdir("/tmp/survey", 0777)                                        = 0
openat(AT_FDCWD, "/etc/motd", O_RDONLY)                           = 3
openat(AT_FDCWD, "/tmp/survey/maps/motd", O_WRONLY|O_CREAT|O_EXCL, 0644) = 4
renameat2(AT_FDCWD, "motd", AT_FDCWD, "motd.old", RENAME_NOREPLACE) = 0
unlinkat(AT_FDCWD, "../notes/motd.old", 0)                        = 0
rmdir("../notes")                                                 = -1 ENOTEMPTY (Directory not empty)
```

init points at the `mv`: "No `read`, no `write`. Not one byte moved. The folder just
got a new name for the same file." And at the `rm`: "It removed the name. There's no
bin to fish it out of."

### Watch it

**Predict:** "How big is `/proc/uptime` on the disk?" (P.9 showed procfs answering a
`read`.) `ls -l /proc/uptime` shows a size of `0`, and `cat /proc/uptime` prints text
anyway: nothing is stored; the kernel writes the numbers into the `read` right then.
(The letters at the start of the `ls -l` line are S.2's topic.)

```
$ ls -l /proc/uptime
-r--r--r-- 1 root root 0 Jan  1 00:00 /proc/uptime
$ cat /proc/uptime
1312.47 1290.10
```

Street signs light up as the player visits each folder, and the Kernel Map gets its
first Userland outline, still dark inside.

### Debrief

> **init:** Now you know the streets, and you can change them. And you passed one door you couldn't open, back in `/etc`: a house called `shadow`.
>
> **init:** Every house has a lock. Let's find out who holds the keys.

S.2 begins.

### Hints

1. Nudge: "Where are you standing right now? There's a command that just tells you."
2. Concept: "A path that starts with `/` is absolute: from the root. Any other path
   is relative: from your working directory. `..` is one step up. `mkdir -p` makes
   every missing folder on the way."
3. Point at the spot: "From `/tmp/survey`, `ls -R` shows what's left. Remove what
   doesn't belong with `rm` (files) and `rmdir` (empty folders)."

### Codex (chapter: Surface Survey)

Each card has a **Simple** line, a **Deep** text and an optional **Read** line; a
card marked `deepens: <id>` adds to an earlier card's chain. Card ids are unique
across the game.

- **The filesystem hierarchy** (`filesystem-hierarchy`, deepens: `files`)
  - **Simple:** One tree of folders, starting at `/`. A path starting with `/` is
    walked from the root; any other from your working directory.
  - **Deep:** The kernel resolves a path one name at a time, starting at the root
    or the process's working directory (both kept in its `struct fs_struct`). The
    layout follows the Filesystem Hierarchy Standard. — `fs/namei.c`
    (`path_lookupat()`), `include/linux/fs_struct.h`.
  - **Read:** man 7 `hier`, man 7 `path_resolution`. Deepened by 1.5 (the working
    directory).
- **Reading a folder** (`reading-a-directory`)
  - **Simple:** A folder is a file that lists names. `ls` opens it and reads the
    names with `getdents64`.
  - **Deep:** A folder is opened like a file (`O_DIRECTORY`) and read with
    `getdents64`, which fills a buffer with entries (inode number, type, name),
    `.` and `..` among them, and returns 0 at the end. `readdir(3)` and `ls` sit on
    top of it. — `fs/readdir.c` (`iterate_dir()`).
  - **Read:** man 2 `getdents64`, man 3 `readdir`.
- **Names and files** (`directory-entries`)
  - **Simple:** A folder maps names to files. `mv` changes a name, `rm` removes
    one, `cp` makes a new file; `ls -i` shows which file a name points to.
  - **Deep:** A file (its inode) can have several names. `rename` moves a name
    within one filesystem without touching the data; across filesystems `mv` has
    to copy and delete. `unlink` removes a name; the kernel frees the file only
    when no names and no open file descriptors are left. `rmdir` refuses a folder
    that isn't empty (`ENOTEMPTY`). — `fs/namei.c` (`do_mkdirat()`,
    `do_renameat2()`, `do_unlinkat()`, `do_rmdir()`), `struct inode`'s `i_nlink`
    in `include/linux/fs.h`.
  - **Read:** man 2 `rename`, man 2 `unlink`, man 2 `mkdir`, man 2 `rmdir`.
    Deepened by 1.6 (file descriptors and inodes).
- **procfs** (`procfs`, deepens: `filesystems`)
  - **Simple:** `/proc` holds no stored files. Each read runs kernel code that
    prints the current state.
  - **Deep:** procfs is the filesystem mounted at `/proc`, with one numbered
    folder per process. Its files show size 0 because their text is made at `read`
    time. — `fs/proc/root.c`, `fs/proc/base.c` (`proc_pid_readdir()`),
    `fs/proc/array.c` (`proc_pid_status()`).
  - **Read:** man 5 `proc`. Deepened by S.3, 1.5 (`/proc/<pid>`) and 2.7 (writing
    a proc file).

### Real-world card

```sh
cd /etc && pwd && cat os-release       # which Linux is this?
cd ~ && pwd                            # home again (~ is bash's name for it)
mkdir -p /tmp/survey/maps && cp /etc/os-release /tmp/survey/maps/
ls -i /etc/os-release /tmp/survey/maps/os-release   # different inodes
mv /tmp/survey/maps/os-release /tmp/survey/maps/old && ls -i /tmp/survey/maps/old
rm -r /tmp/survey                      # remove it all (-r: folders too). Careful.
strace mkdir /tmp/x 2>&1 | grep mkdir; rmdir /tmp/x
```

### Taint

No Taint rules are live in the Survey.

### Fidelity

- **Faithful:** the names and order of the syscalls shown for `ls`, `cd`, `cat`,
  `mkdir`, `mv`, `rm` and `rmdir`; `getdents64` returning 0 at the end; `chdir`
  changing only the calling process; `rename` moving no data and keeping the inode;
  `cp` making a new inode; `unlink` removing a name; `ENOTEMPTY`; `/proc` contents
  made on read, with size 0 in `ls -l`; the standard folder names.
- **Simplified:** the lab's `ls`, `cat`, `cp` and `mkdir` are small programs. Real
  GNU tools make extra calls (loading locale files, `fstat`, an `ioctl` for the
  terminal width), and GNU `cp` first tries to clone or `copy_file_range` instead of
  `read`/`write` (verify the exact calls). GNU `mv` calling `renameat2` with
  `RENAME_NOREPLACE`, `rm` calling `unlinkat` and `mkdir` calling `mkdir` with mode
  `0777` (the kernel then applies the umask) are current coreutils and glibc
  behavior on x86-64 (verify against coreutils 9.5). `cat`'s 256 KiB buffer
  (`262144`) is coreutils 9.5 and later; older versions show `131072`. The lab's
  tree holds only the folders and files the levels use; `/bin` is a real folder,
  not the "merged /usr" link most distributions use now. In bash, `pwd` is a builtin
  that usually prints `$PWD` without a syscall; the rescue shell runs `/bin/pwd`,
  which calls `getcwd`.

### Lab needs

`pwd`, `mkdir` (`-p`), `rmdir`, `cp`, `mv`, `rm`, `ls -i`, `ls -R`; inode numbers
that stay with a file across `rename`; `ENOTEMPTY`; `/tmp` writable by all;
`/proc/uptime` size 0.

---

## S.2 — Who May Enter

- **Id:** `prologue-surface-survey-02-who-may-enter` · **Region / NPC:** Userland's locked doors / init, a neighbour process (user `guest`, uid 1001) · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `io-fs-hierarchy` · **Skills unlocked:** `io-permissions`

### Scene

> **init:** Try the house at `/etc/shadow`.
>
> **init:** "Permission denied." Good. That door should stay shut to you.
>
> **init:** The Kernel knows every user by a number, a _user ID_. Yours is 1000. Every file has an owner and nine little switches: read, write, execute, for the owner, the owner's group, and everyone else.
>
> **The Watchdog:** And the Kernel checks them on every open. No exceptions. Except one.
>
> **init:** User ID 0. _root_, the administrator. The Kernel lets root past almost every check. I run as root; I'm PID 1, someone has to. You'll need it too, one day. Not today.

### See it (X-ray)

The syscalls view plus the **Gate view** from P.2, zoomed into a failing call. init
runs `id`, then `ls -l /etc/shadow`, then `cat /etc/shadow`:

```
uid=1000(you) gid=1000(you) groups=1000(you)
-rw-r----- 1 root shadow 512 Jan  1 00:00 /etc/shadow
openat(AT_FDCWD, "/etc/shadow", O_RDONLY) = -1 EACCES (Permission denied)
```

Reading the `ls -l` line, left to right: `-` a plain file (`d` would be a folder,
`c` a character device); then three groups of three letters, `rw-` for the owner,
`r--` for the group, `---` for everyone else (a letter is on, a `-` is off); then
the number of names, the owner `root`, the group `shadow`, the size, the date and
the name.

Inside the Gate: the kernel walks the path to the file, then `may_open()` →
`inode_permission()` → `generic_permission()` compares the process with the file.
uid 1000 is not the owner (0), and group `you` is not `shadow`, so the "other" bits
apply: `---`. The Kernel answers with the error `EACCES` ("permission denied"; 1.4
shows how a program reads it), and `cat` prints `Permission denied`.

Then init runs the same `openat` as root: it succeeds, by the same rule. Root
(uid 0) owns `/etc/shadow`, so the owner bits `rw-` apply. (init closes the file
without showing it: "Not mine to share.") Root's real override, a capability (a
single named privilege), shows up in Watch it, on a file root doesn't own.

Last, `ls -l /dev/null /dev/mem`: `crw-rw-rw-` and `crw-r-----`. "Doors in `/dev`
have locks too. Down in the Deep, you'll build one."

### Build it

- **Starter provides:** `/home/you/notes.txt` (mode `-rw-r--r--`), the rescue
  shell, and the Field Guide entry for `chmod` (or `man chmod`).
- **Worked examples:**
  - **Reading modes.** `ls -l notes.txt /etc/passwd /etc/shadow /bin/ls`: for each,
    init asks "may you read it? may you change it?" and the player answers before
    the next line lights.
  - **Number modes.** `chmod` with numbers adds r=4, w=2, x=1 for each of owner,
    group and other: `644` is `rw-r--r--`, `600` is `rw-------`, `755` is
    `rwxr-xr-x`.
  - **The execute bit.** `cp hello hi`, then `chmod -x hi` and `./hi`:
    `rescue: ./hi: Permission denied` (the kernel refused to run it: `execve`
    returned `EACCES`). `chmod u+x hi` (owner gets `x` back) and `./hi` works.
  - **A folder's `x`.** `mkdir box`, `cp notes.txt box/`, `chmod 644 box`, then
    `cat box/notes.txt`: `Permission denied`. On a folder, `x` means "may pass
    through"; without it, nothing inside can be reached. `chmod 755 box` and it
    works.
- **Errand:**
  - Read `ls -l notes.txt` and say who may read it. Then watch the neighbour
    process (`guest`, uid 1001) `cat` the note: it works.
  - Make the note private: `chmod 600 notes.txt` (or `chmod go-r notes.txt`).
    The neighbour tries again and gets `Permission denied`.
  - Try `chmod 666 /etc/motd`: `Operation not permitted`. Only a file's owner (or
    root) may change its mode; that's `EPERM`, a different "no" from `EACCES`.
- **Checker verifies (behavior):**
  - An `execve` of `./hi` returned `-EACCES`, and a later one succeeded.
  - An `openat` through `box` failed with `-EACCES`, and a later one succeeded.
  - `notes.txt` has no read bit for group or other, and the neighbour's `openat` of
    it returns `-EACCES`.
  - The owner can still read it (mode `000` fails the objective with a gentle
    "you locked yourself out").
  - `/etc/motd` is unchanged, and the player's `fchmodat` on it returned `-EPERM`.

### Watch it

**Predict:** with `notes.txt` at `-rw-------`, who can read it: you (uid 1000), the
neighbour (uid 1001), init (uid 0)? Then all three try, and X-ray shows each
check: the owner bits for you, the "other" bits for the neighbour, and for init the
"other" bits fail too, then `generic_permission()` lets root through with a
capability (`CAP_DAC_READ_SEARCH` for a read; `CAP_DAC_OVERRIDE` would cover a
write).

```
$ chmod 600 notes.txt
$ ls -l notes.txt
-rw------- 1 you you 57 Jan  1 00:00 notes.txt
$ chmod 666 /etc/motd
chmod: changing permissions of '/etc/motd': Operation not permitted
```

Doors across Userland show small padlocks.

### Debrief

> **init:** Owner, group, everyone else. Read, write, execute. And root, who walks past most locks.
>
> **init:** Locks stop _who_ can touch a file. Next, the ones doing the touching: processes. You can watch them, pause them, and stop them, as long as they're yours.

S.3 begins.

### Hints

1. Nudge: "Read the `ls -l` line from left to right. Who owns the note, and which
   letters are on for everyone else?"
2. Concept: "The nine letters after the first are three groups of `rwx`: owner,
   group, other. The kernel uses only one of the three: the owner bits if you own
   the file, else the group bits if you're in its group, else the other bits.
   `chmod` with numbers adds r=4, w=2, x=1 for each group."
3. Point at the spot: "You want owner `rw-`, group `---`, other `---`: that's 6, 0,
   0."

### Codex (chapter: Surface Survey)

- **Users and IDs** (`users-and-ids`)
  - **Simple:** Every process runs as a user, named by a number: you are 1000,
    root is 0. Groups let several users share files.
  - **Deep:** Every process has user and group IDs (real, effective and more); the
    kernel keeps them in its credentials, `struct cred`. `/etc/passwd` and
    `/etc/group` only map numbers to names. — `include/linux/cred.h`,
    `kernel/cred.c`.
  - **Read:** man 7 `credentials`, man 1 `id`, man 5 `passwd`. Deepened by 1.B
    (becoming root).
- **Permission bits** (`permission-bits`)
  - **Simple:** Nine switches on every file: read, write, execute, for the owner,
    the group and everyone else. On a folder, `x` means "may pass through".
  - **Deep:** Each inode has an owner, a group and a mode. `ls -l` shows the file
    type letter (`-` file, `d` folder, `c` character device), then `rwx` for
    owner, group and other. — `include/uapi/linux/stat.h`, `struct inode`'s
    `i_mode` in `include/linux/fs.h`.
  - **Read:** man 1 `chmod`, man 7 `inode`.
- **The permission check** (`permission-check`)
  - **Simple:** On every open, run and path step, the kernel picks one class
    (owner, group or other) and checks its bits. A "no" is `EACCES`.
  - **Deep:** `may_open()` → `inode_permission()` → `generic_permission()`. When the
    bits say no, root still passes most checks through capabilities:
    `CAP_DAC_READ_SEARCH` (read and search) and `CAP_DAC_OVERRIDE` (write, and
    execute if any `x` bit is set). Operations reserved to an owner or a privilege
    (like `chmod` on someone else's file) fail with `EPERM` (1) instead of
    `EACCES` (13). — `fs/namei.c` (`inode_permission()`, `generic_permission()`),
    `fs/attr.c` (`setattr_prepare()`), `security/commoncap.c`.
  - **Read:** man 7 `path_resolution`, man 7 `capabilities`, man 2 `chmod`.
    Deepened by 1.6 (`Permission denied` in the player's error path) and 2.4
    (a lock on `/dev/lantern`).

### Real-world card

```sh
id
ls -l /etc/passwd /etc/shadow
cat /etc/shadow                          # Permission denied
strace -e trace=openat cat /etc/shadow   # = -1 EACCES
cd /tmp && echo secret > note.txt && chmod 600 note.txt && ls -l note.txt
sudo -u nobody cat /tmp/note.txt         # Permission denied: "other" has no r
```

### Taint

No Taint rules are live in the Survey.

### Fidelity

- **Faithful:** the `ls -l` mode string; the owner, then group, then other
  selection rule; `EACCES` (13) from `openat` and `execve`, and `EPERM` (1) from
  `chmod` by a non-owner; a folder's `x` as search permission; root passing the read
  check; the `id` and `chmod` message formats; `/etc/shadow` and `/dev/mem` modes as
  on Debian-family systems.
- **Simplified:** no ACLs, no SELinux or AppArmor, no setuid programs, no `sudo`.
  Root is modeled as uid 0 holding every capability; the lab models only the
  capability checks the levels use (`CAP_DAC_READ_SEARCH` and `CAP_DAC_OVERRIDE`
  here, `CAP_KILL` in S.3, `CAP_SYS_MODULE` in Act II). Home folders are `0755`;
  many distributions now use `0750`. `/etc/shadow` holds no real password hashes.
  The rescue shell's "Permission denied" message follows bash's.

### Lab needs

`id`, `chmod` (numbers and `u+x`, `go-r`, `-x`), `ls -l`; a neighbour process as
uid 1001 that the level can run; permission checks on `openat`, `execve` and path
lookup (search `x`); `EPERM` for `chmod` by a non-owner.

---

## S.3 — Processes from Outside

- **Id:** `prologue-surface-survey-03-processes` · **Region / NPC:** the edge of the Process District / init, the Watchdog · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `io-permissions`, `proc-process-basics` · **Skills unlocked:** `proc-observe`

The player looks at processes from the outside and sends them signals. Handling a
signal inside a program is 1.8's job; starting processes from C is 1.4's.

### Scene

> **init:** I've started two processes for you, as you: a `sleep` that waits ten minutes, and a `yes` that shouts `y` into `/dev/null` as fast as it can. They're yours, so you may stop them.
>
> **The Watchdog:** One of them's eating the whole CPU. Guess which.
>
> **init:** To a process, you speak with _signals_: short notices the Kernel delivers. "Pause." "Carry on." "Please stop." "Stop now." The program called `kill` sends them. Grim name; most of what it sends isn't fatal.

### See it (X-ray)

1. **Finding them.** `ps -e -o pid,ppid,user,stat,time,comm`:

   ```
     PID  PPID USER     STAT     TIME COMMAND
       1     0 root     Ss   00:00:00 init
     300     1 you      Ss   00:00:00 rescue
     401     1 you      S    00:00:00 sleep
     402     1 you      R    00:01:12 yes
     410   300 you      R+   00:00:00 ps
   ```

   The first letter of `STAT` is the state: `R` running (or ready to run), `S`
   sleeping (waiting for something), `T` stopped, `Z` zombie (finished but not yet
   collected by its parent; 1.4). Extra letters are details (`s` leads a session,
   `+` runs in the terminal's foreground). `yes` has used over a minute of CPU time;
   `sleep` almost none.
2. **The signals themselves.** `kill -l` lists them; four matter today:

   | Signal    | Number (x86-64) | Default effect                   |
   | --------- | --------------- | -------------------------------- |
   | `SIGTERM` | 15              | end the process (it may tidy up) |
   | `SIGKILL` | 9               | end it now; it can't refuse      |
   | `SIGSTOP` | 19              | pause it; it can't refuse        |
   | `SIGCONT` | 18              | let a paused process carry on    |

   `kill PID` sends `SIGTERM`; `kill -STOP PID` sends `SIGSTOP`, and so on.
3. **One signal, through the Gate.** init runs `kill -STOP 401`:

   ```
   kill(401, SIGSTOP) = 0
   ```

   and `/proc/401/status` now says `State:	T (stopped)`.

### Build it

- **Starter provides:** the two processes, the rescue shell, the Field Guide entry
  for `kill`.
- **Worked examples:**
  - **Pause and resume.** `kill -CONT 401`, then `cat /proc/401/status`: its
    `State:` line says `S (sleeping)` again. (Pausing was init's example; resuming
    is yours.)
  - **The family tree.** Read `PPid` in `/proc/300/status` (the shell's parent is
    1. and in `/proc/402/status` (`yes`'s parent is 1 too: init started it).
  - **Who's busy.** Run `ps -e -o pid,stat,time,comm` twice, a few seconds apart:
    `yes`'s `TIME` grew, `sleep`'s didn't.
- **Errand:**
  - Pause `yes` with `SIGSTOP`, check its state is `T` and its `TIME` stops
    growing, then end it with `SIGTERM` while it is paused. (A paused process still
    receives `SIGTERM`, but only acts on it once continued; the kernel continues
    it first when the signal is `SIGKILL`. init explains, and the player sends
    `SIGCONT` or uses `kill -KILL`.)
  - End `sleep` with `kill 401`.
  - Try `kill 1`: `Operation not permitted`. You may signal only your own processes
    (root may signal anyone).
- **Checker verifies (behavior):**
  - `kill` sent `SIGSTOP` to `yes` and its state became `T`.
  - `yes` ended by a signal (`SIGTERM` after `SIGCONT`, or `SIGKILL`).
  - `sleep` ended by `SIGTERM`.
  - `kill(1, ...)` returned `-EPERM`.
  - `/proc/<pid>/status` of a process the player didn't start was read.

### Watch it

**Predict:** "You send `SIGTERM` to `yes` while it's paused. Does it end right away?"
No: it stays `T` until continued, then acts on the waiting `SIGTERM` and ends. X-ray
shows the signal waiting on the process, then `SIGCONT`, then the end:

```
kill(402, SIGTERM) = 0
kill(402, SIGCONT) = 0
--- 402 killed by SIGTERM ---
kill(1, SIGTERM)   = -1 EPERM (Operation not permitted)
```

The CPU lane in X-ray goes quiet. The Watchdog: "Finally. I could hear myself tick."
In the world, the first houses at the edge of the Process District show lit windows.

### Debrief

> **init:** You can find any process, read its state and its parent, and pause, wake or end the ones that are yours.
>
> **init:** One more skill before the Quarter: finding things. The city's big, and someone has been hiding papers in your attic.

S.4 begins.

### Hints

1. Nudge: "Which column of `ps` says whether a process is paused?"
2. Concept: "`kill -STOP PID` pauses, `kill -CONT PID` resumes, `kill PID` asks it to
   end. A paused process acts on signals only once it's resumed, except `SIGKILL`."
3. Point at the spot: "`yes` is PID 402. `kill -STOP 402`, check, then
   `kill 402` and `kill -CONT 402`."

### Codex (chapter: Surface Survey)

- **Process states** (`process-states`, deepens: `process`)
  - **Simple:** A process is running or ready (`R`), sleeping (`S`), stopped
    (`T`) or a zombie (`Z`). `ps` and `/proc/<pid>/status` show it.
  - **Deep:** The state lives in `task_struct->__state`; `/proc` prints it from a
    fixed table of letters. `D` is an uninterruptible sleep (waiting on I/O),
    which even `SIGKILL` can't end until it wakes. — `fs/proc/array.c`
    (`task_state_array`), `include/linux/sched.h`.
  - **Read:** man 1 `ps` (PROCESS STATE CODES), man 5 `proc_pid_status`.
    Deepened by 1.4 (zombies) and 1.5.
- **Sending signals** (`sending-signals`, deepens: `signals`)
  - **Simple:** `kill` sends a signal to a process: `SIGTERM` asks it to end,
    `SIGKILL` ends it, `SIGSTOP` and `SIGCONT` pause and resume it.
  - **Deep:** `kill(2)` checks that the sender may signal the target (same user,
    or `CAP_KILL`), else `EPERM`. `SIGKILL` and `SIGSTOP` can't be caught or
    ignored. A stopped task keeps other signals pending until `SIGCONT`; `SIGKILL`
    wakes it. — `kernel/signal.c` (`kill_pid_info()`, `check_kill_permission()`).
  - **Read:** man 1 `kill`, man 2 `kill`, man 7 `signal`. Deepened by 1.8 (catching
    signals in your own shell).

### Real-world card

```sh
sleep 600 &                      # bash runs it in the background and prints its PID
ps -o pid,stat,time,comm
kill -STOP %1; ps -o pid,stat,comm; kill -CONT %1
kill %1                          # bash's %1 means "job 1"; a PID works too
kill 1                           # Operation not permitted
```

### Taint

No Taint rules are live in the Survey.

### Fidelity

- **Faithful:** `ps` columns and state letters; signal numbers on x86-64; default
  actions; `SIGKILL` and `SIGSTOP` can't be caught; pending signals on a stopped
  task; `EPERM` when signalling another user's process; the `kill` syscall.
- **Simplified:** the lab's `ps` accepts only the options the levels use. The
  "killed by SIGTERM" line is the lab's wording.

### Lab needs

init starting `sleep 600` and `yes` (into `/dev/null`) as uid 1000; `ps` with `-e`
and `-o pid,ppid,user,stat,time,comm`; `kill` (`-l`, `-STOP`, `-CONT`, `-TERM`,
`-KILL`); stopped state `T` with pending signals; `EPERM` for PID 1;
`/proc/<pid>/status` updating live.

---

## S.4 — Finding Things

- **Id:** `prologue-surface-survey-04-finding-things` · **Region / NPC:** init's attic / init · **Tracks:** `userland` · **Time:** ~15 min · **Prerequisites:** `io-fs-hierarchy` · **Skills unlocked:** `io-find-files`

### Scene

> **init:** Before the Kernelfall I kept plans in the attic. Then everything got thrown about. `/home/you/attic` is a mess of folders now.
>
> **init:** `ls` shows one folder at a time. `find` walks a whole tree, and prints every path that matches what you ask.

### See it (X-ray)

Three worked examples, from `/home/you`:

```
$ find /etc -name motd
/etc/motd
$ find attic -type d
attic
attic/boxes
attic/boxes/old
attic/shelf
$ find /tmp -user guest
/tmp/guest-note.txt
```

- `-name motd`: paths whose last part is exactly `motd`.
- `-type d`: only folders (`-type f`: only plain files).
- `-user guest`: only files owned by `guest`.

X-ray shows `find` doing what `ls` does, over and over: open a folder, read its
names with `getdents64`, check each one, go into each subfolder.

Then `find / -name ls` from `/`:

```
/bin/ls
find: '/root': Permission denied
```

Two kinds of lines. X-ray shows them leaving through different doors: the result
through `write(1, ...)`, **standard output**, and the complaint through
`write(2, ...)`, **standard error** (fd 2, kept for error messages, so results and
errors can be told apart; 1.6 sends them to different places).

### Build it

- **Starter provides:** `/home/you/attic`, a tree four levels deep with about 30
  files, one of them `lantern-plan.txt`; a few files in `/tmp` owned by `guest`.
- **Errand:**
  - Find `lantern-plan.txt` and `cat` it (the plan for Act II's Lantern, in init's
    handwriting: "Someday.").
  - List every folder in the attic.
  - Find the files in `/tmp` that belong to `guest`.
  - Run `find / -name passwd`, and say which lines are results and which are errors
    (the game highlights the line the player clicks; X-ray shows its fd).
- **Checker verifies (behavior):**
  - A `find` run with `-name` printed the plan's path, and `cat` read it.
  - A `find` with `-type d` ran on the attic.
  - A `find` with `-user guest` ran.
  - The player marked one standard-error line and one standard-output line of the
    `find /` run correctly (a Predict-style beat: a wrong pick costs nothing).

### Watch it

**Predict:** "`find /` writes results and errors. If your shell could send
standard output to a file (it will, in 1.6), which lines would still show on your
screen?" The errors: they go to fd 2. X-ray colours the two streams.

In the world: the attic's lamp lights, and the Lantern's plan pins itself to the
Kernel Map's Device Quarter, far below, as a faint outline.

### Debrief

> **init:** You can find anything in the tree now, and you know an answer from a complaint.
>
> **init:** Last lesson on the surface: what to do with a file once you've found it. Count it, search it, sort it.

S.5 begins.

### Hints

1. Nudge: "You know the file's name but not its folder. Which command walks a whole
   tree?"
2. Concept: "`find` takes a starting folder, then tests: `-name` for the name,
   `-type d` for folders, `-user` for the owner."
3. Point at the spot: "`find attic -name lantern-plan.txt`."

### Codex (chapter: Surface Survey)

- **Finding files** (`finding-files`, deepens: `reading-a-directory`)
  - **Simple:** `find` walks a folder tree and prints every path that matches its
    tests: name, type, owner and more.
  - **Deep:** `find` opens each folder, reads it with `getdents64`, checks each
    entry (often with a `stat` call for type, size and owner) and descends. The
    kernel just answers the reads; the walking is all user space. GNU find uses
    gnulib's `fts`.
  - **Read:** man 1 `find`.
- **Standard error** (`standard-error`, deepens: `file-descriptors`)
  - **Simple:** fd 2, where programs write error messages, so they stay apart from
    normal output (fd 1).
  - **Deep:** Both usually lead to the same terminal, so they look mixed; a shell
    can send them to different places (`2>` in bash). The C library's `stderr` is
    unbuffered, so errors appear at once. — `fs/read_write.c`.
  - **Read:** man 3 `stderr`. Deepened by 1.6 (redirection).

### Real-world card

```sh
find /etc -name hostname
find ~ -type d -maxdepth 2
find / -name 'passwd*' 2>/dev/null      # quote the * so bash leaves it to find; hide errors
find /tmp -user "$USER"
```

In bash, `*` in a word is expanded by the shell before the program runs, so
patterns for `find -name` go in quotes. The rescue shell has no wildcards, so the
game uses exact names.

### Taint

No Taint rules are live in the Survey.

### Fidelity

- **Faithful:** `find`'s tests and output format; the `Permission denied` error
  format; results on fd 1 and errors on fd 2.
- **Simplified:** the lab's `find` supports only `-name` (exact), `-type`, `-user`
  and `-maxdepth`.

### Lab needs

`find` with `-name`, `-type`, `-user`, `-maxdepth`, errors to fd 2; the attic tree
with `lantern-plan.txt`; `guest`-owned files in `/tmp`; an unreadable `/root`; X-ray
colouring fd 1 and fd 2 writes.

---

## S.5 — Counting and Sorting

- **Id:** `prologue-surface-survey-05-text-tools` · **Region / NPC:** init's survey desk / init, the Watchdog · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `sys-shell-basics` · **Skills unlocked:** `sys-text-tools`

### Scene

> **init:** Your survey's done. I wrote it all down in `census.txt`: one line per house you passed, the district and whether its lamp is lit or dark.
>
> **init:** A _line_ is text up to a newline. Most tools here work one line at a time: count them, pick some, sort them, squash the repeats.

### See it (X-ray)

`/home/you/census.txt` starts:

```
userland lit
process-district dark
socket-harbor dark
userland lit
compilers-quarter dark
...
```

init's worked examples, one per tool:

```
$ wc -l census.txt
40 census.txt
$ head -n 3 census.txt
userland lit
process-district dark
socket-harbor dark
$ tail -n 2 census.txt
syscall-gate dark
userland lit
$ grep harbor census.txt
socket-harbor dark
socket-harbor dark
...
$ grep -c dark census.txt
31
$ sort census.txt
compilers-quarter dark
compilers-quarter dark
...
```

X-ray shows each one the same way: `openat`, `read` the whole file, then `write`
what's left. The kernel only moves bytes; the idea of a "line" lives in the tools.

### Build it

- **Starter provides:** `census.txt` (40 lines), `/etc/passwd`, the Field Guide
  entries.
- **Worked examples (the player runs each after init):**
  - `wc -l`, `wc -w`, `wc -c` on `census.txt`: lines, words, bytes.
  - `grep -n lit census.txt` (with line numbers), `grep -v dark census.txt` (lines
    without `dark`), `grep -i HARBOR census.txt` (any case).
  - `grep you /etc/passwd`: your own line in the user list (name, uid 1000, home
    folder, shell).
  - `sort census.txt`, `sort -r census.txt`.
- **Errand: how many houses per district?**
  - `sort -o sorted.txt census.txt` (sort into a file; `-o` is `sort`'s own option,
    not shell redirection).
  - `uniq sorted.txt`: one line per kind of house. `uniq` drops a line only if it
    repeats the line just above it, which is why the file is sorted first.
  - `uniq -c sorted.txt`: each kind with its count.
- **Checker verifies (behavior):**
  - `wc -l` ran on `census.txt`.
  - `grep -c dark census.txt` ran and printed the right count.
  - `grep` ran on `/etc/passwd` and printed the player's line.
  - `sorted.txt` exists and holds `census.txt`'s lines in sorted order.
  - `uniq -c` ran on `sorted.txt`.

### Watch it

**Predict:** "`uniq census.txt`, without sorting first: how many lines come out?"
Many more than with `sorted.txt`: repeats that aren't neighbours survive. The run
shows both.

Then the player tries the shortcut: `sort census.txt | uniq -c`. The rescue shell
answers `rescue: pipes not supported`. init plays an old X-ray recording from before
the Kernelfall: `pipe2`, two `clone`s, bytes flowing from `sort` straight into
`uniq`, with no file in between.

### Debrief

> **init:** One program's output, another's input, no file in between. That's what the city lost. Your shell will bring it back.
>
> **init:** But every shell starts small. Before it can run anything, it reads the line you typed and cuts it into words: `sort`, `census.txt`. You watched mine do it all day.
>
> **init:** In C, a line of text is just bytes in a row, ending in a zero. Go see the Compiler Smith. First, learn how C holds text.

Act I begins with 1.0.

### Hints

1. Nudge: "`uniq` only squashes repeats that sit next to each other. How do you put
   all the same lines next to each other?"
2. Concept: "`sort -o out in` writes the sorted lines into the file `out`. Then
   `uniq -c out` counts each run of equal lines."
3. Point at the spot: "`sort -o sorted.txt census.txt`, then `uniq -c sorted.txt`."

### Codex (chapter: Surface Survey)

- **Lines and text tools** (`text-tools`)
  - **Simple:** Text tools read files line by line (text up to a newline) and
    count, pick, sort or squash those lines.
  - **Deep:** The kernel knows nothing of lines: `read()` returns bytes. Each tool
    splits at `\n` itself. `wc`, `grep`, `head`, `tail`, `sort` and `uniq` are
    separate programs (GNU coreutils and GNU grep), each doing one job, made to be
    joined with pipes. — `fs/read_write.c`.
  - **Read:** man 1 `wc`, man 1 `grep`, man 1 `sort`, man 1 `uniq`. Deepened by
    1.7 (pipes).
- **The user list** (`passwd-file`, deepens: `users-and-ids`)
  - **Simple:** `/etc/passwd` has one line per user: name, uid, group, home folder
    and shell, separated by `:`.
  - **Deep:** The kernel never reads it; it only knows numbers. The C library's
    `getpwnam()` reads it (through NSS) to turn names into numbers for programs
    like `id` and `ls`. Passwords are in `/etc/shadow`.
  - **Read:** man 5 `passwd`.

### Real-world card

```sh
wc -l /etc/passwd                    # how many users
grep -c bash /etc/passwd             # how many use bash
cut -d: -f7 /etc/passwd | sort | uniq -c    # shells, counted (pipes!)
head -n 3 /etc/passwd; tail -n 3 /etc/passwd
```

The third line is the errand in one go, with pipes, as your own shell will run it
in 1.7.

### Taint

No Taint rules are live in the Survey.

### Fidelity

- **Faithful:** the output formats of `wc`, `head`, `tail`, `grep` (`-c`, `-n`,
  `-v`, `-i`), `sort` (`-r`, `-o`) and `uniq` (`-c`); `uniq` only merging adjacent
  lines; `sort -o` safe on its own input; the `/etc/passwd` format.
- **Simplified:** the lab's tools support only the options the levels use, and
  sort bytes in the C locale (real `sort` follows the locale's order). The pipe
  recording is replayed, not run.

### Lab needs

`wc`, `head` and `tail` (`-n`), `grep` (`-c`, `-n`, `-v`, `-i`), `sort` (`-r`,
`-n`, `-o`), `uniq` (`-c`); `census.txt`; `/etc/passwd` with `root`, `you`, `guest`;
the pipe refusal message and the recorded pipe replay.
