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
/tmp/lamp-oil.txt
/tmp/guest-note.txt
```

> **init:** `-name motd`: paths whose last part is exactly `motd`. `-type d`: only folders (`-type f`: only plain files). `-user guest`: only files owned by `guest`. The order is the order each folder hands its names out, not the alphabet.
>
> **init:** In X-ray, `find` does what `ls` does, over and over: `open` a folder, read its names with `getdents64`, `statx` each one to learn its type and owner, go into each subfolder. The kernel only answers. The walking is all `find`'s.

Then from `/`, the whole tree:

```
$ find / -name passwd
/etc/passwd
find: /proc/tty/driver: Permission denied
find: /proc/1/task/1/fd: Permission denied
find: /proc/1/task/1/fdinfo: Permission denied
...                                             about 380 lines like these
find: /root: Permission denied
find: /sys/kernel/tracing: Permission denied
/usr/bin/passwd
```

> **init:** Two results, buried in complaints. Watch them leave in X-ray: the results through `writev(1, ...)`, _standard output_. The complaints through `write(2, ...)`, _standard error_: file descriptor 2, kept for error messages, so results and errors can be told apart.
>
> **init:** What's behind those locks? `/root` is root's home, and its lock is `rwx------`. Under `/proc`, each process's `fd`, `fdinfo`, `ns` and `map_files` show its open files and more: for my processes and the kernel's threads, they're root's, so they're closed to you. Yours are open.

Both streams end up on your terminal, so they look mixed. Bash can send each one somewhere else. Add `2>` and a file to the end of the command, and standard error goes into that file. `/dev/null`, from the doors in `/dev`, swallows everything written to it:

```
$ find / -name passwd 2>/dev/null
/etc/passwd
/usr/bin/passwd
```

And `>` does the same for standard output:

```
$ find attic -type d > folders.txt
$ cat folders.txt
attic
attic/boxes
attic/boxes/old
attic/shelf
```

> **init:** Who did that, `find` or bash? Watch X-ray. Bash forks a child to run `find`, as always. Then, before the child becomes `find`, it does three more calls. The child of `find attic -type d > folders.txt` (trimmed: just before these, it closes and reads bash's own pipe, which holds it until bash is ready):

```
open("folders.txt", O_WRONLY|O_CREAT|O_TRUNC|O_LARGEFILE, 0666) = 3
dup2(3, 1)                                                       = 1
close(3)                                                         = 0
execve("/usr/bin/find", ["find", "attic", "-type", "d"], ...)    = 0
```

> **init:** It opens the file: for writing, made if it's missing, emptied if it isn't. The kernel hands back the lowest free number, 3. `dup2(3, 1)` makes fd 1 point at that same open file, and `close(3)` drops the spare. Then `execve` starts `find`, and open files stay open across `execve`. `find` writes its results to fd 1 as always, and never knows they go into a file. For `2>/dev/null`, it's `open("/dev/null", …)` and `dup2(3, 2)`: the complaints go nowhere.
>
> **init:** Careful: `>` empties the file first. Point it at something you need, and it's gone.

## Build it

> **init:** Your errand, in the attic:
>
> - Find `lantern-plan.txt`, somewhere under `attic`, and `cat` it.
> - List every folder in the attic, then save that list in `folders.txt` with `>`.
> - Find the files in `/tmp` that belong to `guest`.
> - Run `find / -name passwd`. Click one line that's a result and one that's an error; X-ray shows each one's fd. Then run it again with the complaints sent to `/dev/null`.

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

> **init:** `find / -name passwd > found.txt`: which lines still show on your screen?

```
$ find / -name passwd > found.txt
find: /proc/tty/driver: Permission denied
...
find: /sys/kernel/tracing: Permission denied
$ cat found.txt
/etc/passwd
/usr/bin/passwd
```

> **init:** The complaints. Only fd 1 went into the file; fd 2 still points at your terminal. Each stream goes where its own fd points.
>
> **The Watchdog:** The attic lamp's on. Took you long enough.

The Lantern's plan pins itself to the Kernel Map's Device Quarter, far below, as a faint outline.

## Debrief

> **init:** You can find anything in the tree now, tell an answer from a complaint, and send each one where you want it.
>
> **init:** Last lesson on the surface, in Counting and Sorting: what to do with a file once you've found it. Count it, search it, sort it, and pass one program's output straight to another.

## Real world

On any Linux with bash. Quote a pattern with `*` in it, so bash leaves it for `find` instead of expanding it first:

```sh
find /etc -name hostname
find ~ -maxdepth 2 -type d
find / -name 'passwd*' 2>/dev/null      # quote the *, hide the errors
find /tmp -user "$USER" > mine.txt      # save the list
```

GNU `find`, on most distributions, puts quotes around the path in its complaints: `find: '/root': Permission denied`.
