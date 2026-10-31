# Surface Survey: the streets of Userland

Level specs for the Surface Survey, the on-ramp between the Prologue and Act I. Read
[GAME.md](../GAME.md) for the story and systems, [LEVELS.md](../LEVELS.md) for the
rules, and [prologue.md](prologue.md) for what the player already knows. The whole
path is in [LEVELS.md](../LEVELS.md#4-the-journey).

Kernel source paths follow Linux 6.18 (LTS). Every output, message and syscall below
was copied from a run on the Machine (one CPU, i386, Alpine 3.24, kernel
`6.18.59-0-virt`, bash 5.3, BusyBox, musl); the level files hold the same text.

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

### Scene

Opens from P.10's debrief ("Time you walked the streets you're rebuilding"). init
names _Userland_ (where programs live, outside the kernel) and its streets, the
folders; every step asks the kernel; today the player builds a little.

### See it (X-ray)

1. **Where you stand.** Every process has a **working directory**. `pwd` prints the
   shell's, `/home/you`. `pwd` is a bash builtin (`type pwd` → `pwd is a shell
   builtin`): bash prints the path it keeps, and X-ray shows a single `writev`.
2. **Absolute and relative paths.** `cat /etc/motd`, `cat ../../etc/motd`,
   `cd /etc` then `cat motd`. `cd /etc` is bash's own `chdir("/etc") = 0`; `cd ..`
   shows `chdir("/")`: bash works the path out and hands the kernel the result.
   A program hands the kernel a relative path as it is:
   `open("../../etc/motd", O_RDONLY|O_LARGEFILE) = 3`.
3. **Reading a folder.** `ls /`:

   ```
   open("/", O_RDONLY|O_LARGEFILE|O_CLOEXEC|O_DIRECTORY) = 3
   getdents64(3, /* 20 entries */, 2048)  = 488
   statx(AT_FDCWD, "/bin", ...)           = 0
   ...                                      one statx per name
   getdents64(3, /* 0 entries */, 2048)   = 0
   close(3)                               = 0
   writev(1, "\e[1;34mbin\e[m    ...", ...) = 150    one per line on the screen
   ```

   ```
   bin    dev    home   media  opt    root   sbin   sys    usr
   boot   etc    lib    mnt    proc   run    srv    tmp    var
   ```

   Twenty entries, eighteen names: `.` and `..` are hidden without `-a`. 150 bytes a
   line: BusyBox's `ls` colours each folder name (`\e[1;34m` … `\e[m`).
   `O_LARGEFILE` is added by musl to every `open` of a 32-bit program.
4. **Reading a file.** `cat motd` from `/etc`:

   ```
   open("motd", O_RDONLY|O_LARGEFILE)     = 3
   sendfile64(1, 3, NULL, 16777216)       = 124
   sendfile64(1, 3, NULL, 16777216)       = 0
   close(3)                               = 0
   ```

   BusyBox's `cat` has the kernel copy from the file to the terminal; 0 is the end.

### Build it

- **Worked examples:** `cd /etc`, `pwd`, `cd ..`, `pwd`, `cd home/you`, `pwd`,
  `cat ../../etc/motd` (`cd home/you` reaches the kernel as `chdir("/home/you")`,
  `cat`'s path as `open("../../etc/motd", …)`);
  `mkdir /tmp/survey`, `mkdir /tmp/survey/maps`, `mkdir -p /tmp/survey/notes/old`;
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
  `pread64`, `pwrite64`, `sendfile64`, `copy_file_range`, `splice`) after its
  `execve`; `rmdir` failing with `ENOTEMPTY` and one succeeding; an `ls -R` showing
  the exact tree; the shell printing `/tmp/survey`.

### Watch it

**Predict:** "How big is `/proc/uptime` on the disk?"

```
$ ls -l /proc/uptime
-r--r--r--    1 root     root             0 Oct 31 16:31 /proc/uptime
$ cat /proc/uptime
28.17 3.34
```

Seconds since start, and seconds the one CPU sat idle (summed over CPUs on bigger
machines). The Kernel Map gets its first Userland outline.

### Debrief

The lock the player has already seen, `-r--r--r--` in `ls -l /proc/uptime`; S.2, Who
May Enter, begins.

### Codex (chapter: Surface Survey)

`filesystem-hierarchy` (deepens `files`), `reading-a-directory`,
`directory-entries` (BusyBox's `mkdir`, `rename`, `unlink`, `rmdir` vs GNU's
`renameat2`, `unlinkat` on 64-bit; all end in `do_renameat2()`, `do_unlinkat()`,
`do_rmdir()`, `do_mkdirat()`), `procfs` (deepens `filesystems`).

### Real-world card and fidelity

The same walk with `strace` on any Linux; the card notes GNU's `openat`,
`renameat2`, `unlinkat`, and coreutils 9 `cp`'s `ioctl(FICLONE)` (a reflink) before
`copy_file_range`. Fidelity: everything shown is the
Machine's; the street signs and the Map are drawings; `pwd`'s output is judged as
text, which an `echo` of the same text would match.

---

## S.2 — Who May Enter

- **Id:** `prologue-surface-survey-02-who-may-enter` · **Region / NPC:** Userland's locked doors / init, the neighbour (user `guest`, uid 1001) · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `io-fs-hierarchy` · **Skills unlocked:** `io-permissions`

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
-rw-r-----    1 root     shadow         285 Oct 31 16:31 /etc/shadow
```

```
open("/etc/shadow", O_RDONLY|O_LARGEFILE) = -1 EACCES (Permission denied)
```

`may_open()` → `inode_permission()` → `generic_permission()`: not the owner, not in
the file's group, so the "other" bits. Then `/dev`:

```
crw-rw-rw-    1 root     root        1,   3 Oct 31 16:30 /dev/null
brw-------    1 root     root        8,   0 Oct 31 16:30 /dev/sda
```

The disk opens only for root (no udev here, so no `disk` group on the node).

### Build it

- **Reading modes:** `ls -l notes.txt /etc/passwd /etc/shadow` (`/etc/passwd` 735
  bytes, root:root `-rw-r--r--`).
- **The execute bit:** `cp /usr/local/bin/say hi`, `chmod -x hi`, `./hi hello,
  Machine` → `-bash: ./hi: Permission denied` (status 126): bash's child calls
  `execve`, the kernel answers `EACCES`, the child explains and exits. `chmod u+x hi`
  and it prints `hello, Machine`; `ls -l hi` shows `-rwxr--r--`.
- **A folder's `x`:** `mkdir box`, `cp notes.txt box/`, `chmod 644 box`,
  `cat box/notes.txt` → `cat: can't open 'box/notes.txt': Permission denied`;
  `chmod 755 box` and it reads.
- **Errand:** make the note private. init knocks as root with
  `runuser -u guest -- cat /home/you/notes.txt`: before, it prints the note; after
  `chmod 600`, `cat: can't open '/home/you/notes.txt': Permission denied`. Then
  `chmod 666 /etc/motd` → `chmod: /etc/motd: Operation not permitted`.
- **Checker:** a failed `execve` with `EACCES` and an exec of `hi`; a player `cat`
  through `box` refused and allowed; an `ls -l` line for `notes.txt` with `r` for the
  owner only (BusyBox colours the name on a terminal, so the line is read as plain
  text); the neighbour's `cat` (run by `runuser`, `su` or `setpriv`: in the same task, or
  in a child it forked, as `runuser` does for its PAM session) refused with `EACCES`;
  `chmod` failing with `EPERM`.

### Watch it

**Predict:** at `-rw-------`, who can read it: you, the neighbour, init? You by the
owner bits; the neighbour not; init by `CAP_DAC_READ_SEARCH`. `EPERM` from `chmod` is
"not yours to change", a different "no" from `EACCES`. A `chmod 000` lockout is undone
by the owner with `chmod 600`.

### Debrief

S.3, Processes from Outside, begins.

### Codex

`users-and-ids`, `permission-bits`, `permission-check`.

### Fidelity

Everything shown is the Machine's real check. The Machine has no sudo, ACLs or
SELinux. The neighbour's knock is init's: once `note-private` is met, the game runs
`cat /home/you/notes.txt` as `guest` through `runuser`, as root (level.yaml `runAs`).

---

## S.3 — Processes from Outside

- **Id:** `prologue-surface-survey-03-processes` · **Region / NPC:** the edge of the Process District / init, the Watchdog · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `io-permissions`, `proc-process-basics` · **Skills unlocked:** `proc-observe`

### Lab

Setup starts `sleep 86400` and `yes > /dev/null` as `you`, in a subshell that exits,
so init adopts them (PPID 1). No fixed PIDs: the player reads them from `ps`, and the
story says "your PIDs will differ".

### See it

```
$ ps -o pid,ppid,user,stat,time,comm
PID   PPID  USER     STAT TIME  COMMAND
    1     0 root     S     0:00 init
    2     0 root     SW    0:00 kthreadd
...
  476     1 you      S     0:00 sleep
  478     1 you      R     0:01 yes
  480     1 you      S     0:00 bash
  483   480 you      R     0:00 ps
```

BusyBox's `ps` lists every process without `-e`. The first `STAT` letter is the state
(`R`, `S`, `T`, `Z`, and `I` for an idle kernel thread); BusyBox adds `W` for no user
memory at all (VSZ 0), `<` and `N` for a raised or lowered priority (nice). The
kernel's threads have parent 2. `kill -l` lists the
signals; on x86 (32- and 64-bit alike) `SIGKILL` 9, `SIGTERM` 15, `SIGCONT` 18,
`SIGSTOP` 19. init pauses `sleep`: `kill(476, SIGSTOP) = 0` (bash's builtin makes the
call), and `/proc/476/status` says `State:	T (stopped)`.

### Build it

- Resume `sleep` (`kill -CONT`), read `PPid` in `/proc/$$/status` and in `yes`'s
  status (both 1), watch `yes`'s `TIME` grow (`0:03`, then `0:06`).
- **Errand:** pause `yes`, check `T`; send `SIGTERM` while paused and `cat` its
  status; `SIGCONT`; end `sleep`; try `kill 1`.
- **Checker:** a `ps` listing with `sleep` and `yes`; a read of `sleep`'s or `yes`'s
  `/proc/<pid>/status` (its `Name:` line); `yes` shown in `T` by `ps` or its status;
  its status with `State:	T (stopped)` and `ShdPnd:	0000000000004000`; a full `ps`
  listing with a `COMMAND` column (`ps -o pid` names no one) where `yes` is a zombie
  or gone, and one without `sleep`; `kill(1, …)` = `-EPERM`. The setup's processes
  aren't traced, so their state is judged from what `ps` and `/proc` print.

### Watch it

**Predict:** does a paused `yes` end on `SIGTERM`? No: the signal waits in `ShdPnd`
(bit 15), `State` stays `T`; after `SIGCONT` it ends, and `ps` shows `478 Z    yes`
until init collects it. `kill 1` → `-bash: kill: (1) - Operation not permitted`
(`CAP_KILL` is root's).

### Debrief

S.4, Finding Things, begins.

### Codex

`process-states` (deepens `process`), `sending-signals` (deepens `signals`).

---

## S.4 — Finding Things

- **Id:** `prologue-surface-survey-04-finding-things` · **Region / NPC:** init's attic / init · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `io-fs-hierarchy` · **Skills unlocked:** `io-find-files`

### Lab

`/home/you/attic` (four folders, about 30 files, one `lantern-plan.txt` in
`boxes/old`), two `guest` files and one of yours in `/tmp`.

### See it

```
$ find /etc -name motd
/etc/motd
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
...                                             about 380 lines
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

For `2>/dev/null` it opens `/dev/null` and calls `dup2(3, 2)`.

### Build it

- **Errand:** find and `cat` the plan; list the attic's folders and save them with
  `>`; find `guest`'s files; run `find / -name passwd`, then with `2>/dev/null`.
- **Checker:** one `find` path ending `/lantern-plan.txt`; `cat` opened it and printed
  `Someday.` (read from the terminal's bytes, or from `sendfile64`'s data once the
  trace has it); the attic's four folders, on the screen and redirected into a file
  (an `open` and a `dup2(…, 1)` before `execve`); `guest`'s two files; a
  `find` printing `/etc/passwd` on fd 1 and `Permission denied` on fd 2 with neither
  redirected; the same with fd 2 redirected to `/dev/null` (a file of the player's
  keeps the errors, it doesn't throw them away).

### Watch it

**Predict:** with `> found.txt`, which lines still show? The complaints: only fd 1
went into the file.

### Debrief

S.5, Counting and Sorting, begins.

### Codex

`finding-files` (deepens `reading-a-directory`; BusyBox find, GNU find quotes paths),
`standard-error` (deepens `file-descriptors`), `redirection`.

---

## S.5 — Counting and Sorting

- **Id:** `prologue-surface-survey-05-text-tools` · **Region / NPC:** init's survey desk / init, the Watchdog · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `sys-shell-basics` · **Skills unlocked:** `sys-text-tools`

### Lab

`/home/you/census.txt`: 40 lines, 80 words, 742 bytes; 31 `dark`, 9 `lit`.

### See it and Build it

`head -n 5`, `wc -l` (`40 census.txt`), `tail -n 2`, `grep harbor` (7 lines),
`grep -c dark` (`31`), `sort`; `wc -w` (`80`), `wc -c` (`742`), `grep -n lit` (lines
1, 4, 11, 16, 23, 28, 33, 38, 40), `grep -v dark`, `grep -i HARBOR`,
`grep you /etc/passwd` (`you:x:1000:1000:you:/home/you:/bin/bash`), `sort -r`.
Each tool: `open`, `read` in pieces of up to 1,024 bytes, `writev`.

- **Errand:** `sort census.txt > sorted.txt`, `uniq sorted.txt` (six kinds),
  `uniq -c sorted.txt`:

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

**Predict:** `uniq census.txt` unsorted: `uniq census.txt | wc -l` → 37. Then
`sort census.txt | uniq -c`, with bash's real trace:

```
pipe([3, 4])                                            = 0
pipe([5, 6])                                            = 0
fork()                                                  = 488
fork()                                                  = 489
[pid 488] dup2(4, 1)                                    = 1
[pid 488] execve("/usr/bin/sort", ...)                  = 0
[pid 489] dup2(3, 0)                                    = 0
[pid 489] execve("/usr/bin/uniq", ...)                  = 0
[pid 488] writev(1, "compilers-quarter dark\n", ...)       = 23
[pid 489] read(0, "compilers-quarter dark\n", 1024)      = 23
[pid 488] writev(1, "compilers-quarter dark\ncomp"..., ...) = 719
[pid 489] read(0, "compilers-quarter dark\ncomp"..., 1024) = 719
...
wait4(-1, ...)                                          = 488
wait4(-1, ...)                                          = 489
```

The data pipe comes first (3, 4); the second (5, 6) is bash's own, made before every
command it starts, and holds `sort` until `uniq` exists too. A pipe holds
64 KiB by default and stores nothing on a disk.

### Debrief

Ends The Surface: Act I opens next; the Compiler's Quarter (1.0, Letters in a Row)
comes in the next release, and 1.4, Run Anything, is open now as a preview.

### Codex

`text-tools` (BusyBox applets on the Machine), `passwd-file` (deepens
`users-and-ids`; musl reads `/etc/passwd` itself, glibc through NSS),
`shell-pipeline`.

### Taint (all levels)

No Taint rules are live in the Survey.
