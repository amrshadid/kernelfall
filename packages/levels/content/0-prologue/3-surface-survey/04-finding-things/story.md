# Finding Things

## Scene

> **init:** Before the Kernelfall I kept plans in the attic. Then everything got thrown about. `/home/you/attic` is a mess of folders now.
>
> **init:** `ls` shows one folder at a time. `find` walks a whole tree, and prints every path that matches what you ask.

## See it

> **init:** Three examples, from `/home/you`. `find` takes a folder to start from, then _tests_ that each path must pass.

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
/tmp/lamp-oil.txt
```

> **init:** `-name motd`: paths whose last part is exactly `motd`. `-type d`: only folders (`-type f`: only plain files). `-user guest`: only files owned by `guest`.
>
> **init:** In X-ray, `find` does what `ls` does, over and over: open a folder, read its names with `getdents64`, check each one, go into each subfolder. The Kernel only answers the reads. The walking is all `find`'s.

Then from `/`, the whole tree:

```
$ find / -name ls
/bin/ls
find: '/proc/1/fd': Permission denied
find: '/proc/2/fd': Permission denied
find: '/proc/14/fd': Permission denied
find: '/proc/21/fd': Permission denied
find: '/proc/31/fd': Permission denied
find: '/root': Permission denied
```

> **init:** Two kinds of lines. Watch them leave in X-ray: the result through `write(1, ...)`, _standard output_. The complaints through `write(2, ...)`, _standard error_: fd 2, kept for error messages, so results and errors can be told apart.
>
> **init:** What's behind those locks? `/root` is root's home, and its lock is `rwx------`. Each `/proc/<pid>/fd` lists the files one process has open: mine, PID 1, and the Kernel's own threads. Those belong to root, so they're closed to you. Yours are open.

## Build it

> **init:** Your errand, in the attic:
>
> - Find `lantern-plan.txt`, somewhere under `attic`, and `cat` it.
> - List every folder in the attic.
> - Find the files in `/tmp` that belong to `guest`.
> - Run `find / -name passwd`. Then click one line that's a result and one that's an error; X-ray shows each one's fd.

```
$ find attic -name lantern-plan.txt
attic/boxes/old/lantern-plan.txt
$ cat attic/boxes/old/lantern-plan.txt
The Lantern: a driver of our own.
One door in /dev. Write to it, and a lamp lights.
Someday.
```

> **init:** My handwriting. I never got further than "someday".

## Watch it

> **init:** `find /` writes results and errors. If your shell could send standard output to a file, which lines would still show on your screen?

```
write(1, "/etc/passwd\n", 12)                              = 12
write(2, "find: '/proc/1/fd': Permission denied\n", 38)    = 38
...
write(2, "find: '/root': Permission denied\n", 33)         = 33
```

> **init:** The errors. They go to fd 2, and only fd 1 would go to the file. My shell can't send either one anywhere else. Yours will.
>
> **The Watchdog:** The attic lamp's on. Took you long enough.

The Lantern's plan pins itself to the Kernel Map's Device Quarter, far below, as a faint outline.

## Debrief

> **init:** You can find anything in the tree now, and you know an answer from a complaint.
>
> **init:** Last lesson on the surface: what to do with a file once you've found it. Count it, search it, sort it.

## Real world

In bash, `*` in a word is expanded by the shell before the program runs, so patterns for `find -name` go in quotes. `2>/dev/null` sends standard error away:

```sh
find /etc -name hostname
find ~ -maxdepth 2 -type d
find / -name 'passwd*' 2>/dev/null      # quote the *, hide the errors
find /tmp -user "$USER"
```
