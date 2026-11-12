# Finding Things

**Question:** A command prints answers and complaints on one screen. How are they kept apart, and how do you send each one somewhere else?

## Scene

> **init:** I told you someone had been hiding papers in your attic. It is `/home/you/attic`. Before the Kernelfall I kept my plans up there; then everything was thrown about, and now it is a mess of folders. One paper in there is a plan of mine, `lantern-plan.txt`.
>
> **init:** `ls` shows one folder. `find` walks a whole tree, and prints every path that passes its tests. Run `find attic -name lantern-plan.txt`.

## See it

---

```
$ find attic -name lantern-plan.txt
attic/boxes/old/lantern-plan.txt
```

> **init:** In X-ray, `find` repeats one pattern: it opens a folder, asks the kernel for the names in it with `getdents64`, asks about each one with `statx`, and goes into every folder it finds. The kernel only answers. The walking is `find`'s.
>
> **init:** `find` takes a folder to start from, then tests. `-name` keeps the paths whose last part is that name, `-type d` keeps only folders, and `-user guest` keeps only what `guest` owns. Now search the whole tree: `find / -name passwd`.

---

```
/etc/passwd
find: /proc/tty/driver: Permission denied
find: /proc/1/task/1/fd: Permission denied
...
find: /root: Permission denied
find: /sys/kernel/tracing: Permission denied
/usr/bin/passwd
```

> **init:** Two results, buried under nearly four hundred complaints: folders whose locks keep you out, like `/root`, root's home. `find` reports each one and walks on. Look at them in X-ray. The results left through `writev(1, …)`, and the complaints through `write(2, …)`. `writev` is a `write` of several pieces; what matters is the number.
>
> **init:** File descriptor 1 is _standard output_, for results. File descriptor 2 is _standard error_, for error messages. Both lead to your terminal, so they look mixed.
>
> **init:** bash can point either one somewhere else. That is _redirection_: `>` and a file moves standard output, `2>` and a file moves standard error. Run `find attic -type d`, then the same with `> folders.txt` at the end, then `cat folders.txt`.

## Build it

---

```
$ find attic -type d > folders.txt
$ cat folders.txt
attic
attic/boxes
attic/boxes/old
attic/shelf
```

> **init:** Nothing reached the screen, and the list is in the file. X-ray shows what bash's copy did just before it became `find`:

```
open("folders.txt", O_WRONLY|O_CREAT|O_TRUNC|…) = 3
dup2(3, 1)                                      = 1
```

> **init:** It opened the file for writing: made if it is missing, emptied if it isn't. The kernel handed back the lowest free file descriptor, 3. Then `dup2(3, 1)` made 1 lead to that same open file. `find` started, wrote to 1 as always, and never knew.
>
> **init:** Careful: `>` empties the file first. Point it at a file you need, and its old contents are gone.
>
> **init:** Your errand. `cat` the plan you found. Find the files in `/tmp` that `guest` owns. Then run `find / -name passwd` again with the complaints thrown away: `/dev/null` is a device file that swallows whatever is written to it.

## Watch it

---

> **init:** One more. `find / -name passwd > found.txt`: which lines still reach your screen?
>
> - the results
> - [x] the complaints
> - both

---

```
$ find / -name passwd > found.txt
find: /proc/tty/driver: Permission denied
...
find: /sys/kernel/tracing: Permission denied
$ cat found.txt
/etc/passwd
/usr/bin/passwd
```

> **init:** The complaints. `>` moved only file descriptor 1, and 2 still leads to your terminal. Your `2>/dev/null` did the opposite, with `dup2(3, 2)`. Each stream goes where its own number leads. The program doesn't choose: the shell does, before the program starts.
>
> **init:** And the plan you found is my handwriting. "The Lantern: a driver of our own." I never got further than "someday".

## Debrief

> **init:** So a program keeps answers and complaints apart by writing them to two file descriptors, and the shell decides where each one leads. In Counting and Sorting, you send one program's output straight into another program.
>
> **The Watchdog:** The attic lamp's on. Took you long enough.

## Real world

On any Linux with bash. Quote a pattern with `*` in it, so bash leaves it for `find`:

```sh
find /etc -name hostname
find ~ -maxdepth 2 -type d
find / -name 'passwd*' 2>/dev/null      # quote the *, hide the errors
find /tmp -user "$USER" > mine.txt      # save the list
```

GNU `find`, on most distributions, puts quotes around the path in its complaints.
