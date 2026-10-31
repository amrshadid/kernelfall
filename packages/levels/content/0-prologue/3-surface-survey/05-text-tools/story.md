# Counting and Sorting

## Scene

> **init:** Your survey's done. I wrote it all down in `census.txt`: one line per house you passed, the district and whether its lamp is lit or dark.
>
> **init:** A _line_ is text up to a newline, an invisible character that ends it. (Enter sends a different one, a carriage return; the kernel's terminal driver turns it into a newline before bash reads it.) Most tools here work one line at a time: count them, pick some, sort them, squash the repeats.

## See it

> **init:** One example per tool. Watch me, then run each one yourself.

```
$ head -n 5 census.txt
userland lit
process-district dark
socket-harbor dark
userland lit
compilers-quarter dark
$ wc -l census.txt
40 census.txt
$ tail -n 2 census.txt
syscall-gate dark
userland lit
$ grep harbor census.txt
socket-harbor dark
socket-harbor dark
socket-harbor dark
socket-harbor dark
socket-harbor dark
socket-harbor dark
socket-harbor dark
$ grep -c dark census.txt
31
$ sort census.txt
compilers-quarter dark
compilers-quarter dark
...
```

> **init:** `wc` counts, `head` and `tail` print the first and last lines, `grep` prints the lines that contain a word (`-c`: just how many), `sort` prints them in order.
>
> **init:** In X-ray they all look alike: `open` the file, `read` it in pieces of up to 1,024 bytes, then `writev` what's left. The kernel only moves bytes. The idea of a "line" lives in the tools.

## Build it

> **init:** Your turn, one tool at a time.

```
$ wc -l census.txt
40 census.txt
$ wc -w census.txt
80 census.txt
$ wc -c census.txt
742 census.txt
```

> **init:** Lines, words, bytes. Now `grep`'s options: `-n` numbers the lines, `-v` prints the lines _without_ the word, `-i` ignores upper and lower case.

```
$ grep -n lit census.txt
1:userland lit
4:userland lit
11:userland lit
16:userland lit
23:userland lit
28:userland lit
33:userland lit
38:userland lit
40:userland lit
```

> **init:** `grep -v dark census.txt` leaves only the lit houses, and `grep -i HARBOR census.txt` finds `harbor` in any case.
>
> **init:** Now find your own line in the Machine's list of users: `grep you /etc/passwd`. Name, `x`, user ID, group ID, a description, your home folder and your shell, separated by colons.

```
$ grep you /etc/passwd
you:x:1000:1000:you:/home/you:/bin/bash
```

> **init:** Then `sort census.txt`, and `sort -r census.txt` for the reverse.
>
> **init:** Now the errand: how many houses per district? `uniq` drops a line only if it repeats the line just above it. So first put the same lines next to each other, and keep them in a file with `>`, as you did in the attic.

```
$ sort census.txt > sorted.txt
$ uniq sorted.txt
compilers-quarter dark
process-district dark
socket-harbor dark
syscall-gate dark
userland dark
userland lit
$ uniq -c sorted.txt
      8 compilers-quarter dark
      8 process-district dark
      7 socket-harbor dark
      5 syscall-gate dark
      3 userland dark
      9 userland lit
```

> **init:** Thirty-one dark, nine lit, and only Userland has any light at all.

## Watch it

> **init:** `uniq census.txt`, without sorting first: how many lines come out?

```
$ uniq census.txt
userland lit
process-district dark
socket-harbor dark
userland lit
compilers-quarter dark
process-district dark
userland dark
...
$ uniq census.txt | wc -l
37
```

> **init:** Thirty-seven lines, against six from `sorted.txt`. Only three lines repeated the one just above them, like the second `process-district dark`, and only those were squashed. Repeats that aren't neighbours survive.
>
> **init:** And that `|` you just used is a _pipe_: it hands one program's output straight to the next. The file in between, `sorted.txt`, was only a waiting room. Skip it:

```
$ sort census.txt | uniq -c
      8 compilers-quarter dark
      8 process-district dark
      7 socket-harbor dark
      5 syscall-gate dark
      3 userland dark
      9 userland lit
```

What X-ray shows bash doing for that line (trimmed):

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
[pid 489] writev(1, "      8 compilers-quarter dark\n", ...) = 31
...
wait4(-1, ...)                                          = 488
wait4(-1, ...)                                          = 489
```

> **init:** `pipe` asks the kernel for a pipe: a buffer inside the kernel with two ends, fd 3 to read from and fd 4 to write into. Bash forks one child per program. The `sort` child moves the write end onto its fd 1 with `dup2`, the `uniq` child moves the read end onto its fd 0, and each becomes its program with `execve`. Bash waits for both.
>
> **init:** `sort` writes to fd 1 as always, and `uniq` reads fd 0 as always. Neither knows a pipe is there. `sort` wrote its 742 bytes in two pieces, 23 and 719, and each `read` of `uniq` took what was waiting. The second `pipe`, fds 5 and 6, is bash's own, made before every command it starts: it holds `sort` back until `uniq` exists too, and carries no data.

Where the "waiting room" stops being true: a pipe isn't a file. Nothing is stored on any disk, and the kernel holds only 64 KiB in it at a time (the default size); a writer with more waits until the reader takes some.

> **The Watchdog:** Counted, sorted, and the lamps tallied. The surface is surveyed.

## Debrief

> **init:** You walked every street of the surface. You know the folders, the locks, the processes, how to find things, and how to count them. And every tool you used is just a program asking the kernel for help, through the same few calls.
>
> **init:** That's the end of the Surface. Next comes Act I: down into Userland's workshops, where you stop using programs and start writing them, starting with a shell of your own. Before it can run anything, a shell reads the line you typed and cuts it into words: `sort`, `census.txt`. You watched bash do that all day.
>
> **init:** The Compiler's Quarter opens in the next release, with 1.0, Letters in a Row. Until then, one door down there is already open: 1.4, Run Anything, where your own shell starts its first program. Go and have a look.

## Real world

The errand in one go on any Linux, with a pipe:

```sh
wc -l /etc/passwd                            # how many users
grep -c bash /etc/passwd                     # how many use bash
cut -d: -f7 /etc/passwd | sort | uniq -c     # shells, counted: two pipes
head -n 3 /etc/passwd; tail -n 3 /etc/passwd
sort -o sorted.txt sorted.txt                # sort's own -o can write over its input; > would empty it first
```
