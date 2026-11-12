# Counting and Sorting

**Question:** How does one program's output become another program's input, with no file in between?

## Scene

> **init:** You found my plan, and you sent a list into a file. One more skill on the Surface. Your survey is in `census.txt`: one line for each stop you passed, with its district and whether its lamp is lit or dark.
>
> **init:** A _line_ is text up to a newline, an invisible character that ends it. The tools you meet now work one line at a time. Start by counting them: `wc -l census.txt`.

## See it

---

```
$ wc -l census.txt
40 census.txt
```

> **init:** Forty lines. `wc -w` counts words and `wc -c` counts bytes: 80 and 742. Each of these tools is a small program that does one job. `grep` you know from The Boot Path: it prints the lines that hold a word, and with `-c` it only counts them. Run `grep -c dark census.txt`. Then find your own line in the Machine's list of users: `grep you /etc/passwd`.

---

```
$ grep -c dark census.txt
31
$ grep you /etc/passwd
you:x:1000:1000:you:/home/you:/bin/bash
```

> **init:** Thirty-one dark stops; `grep -v dark census.txt` prints the lines without the word, the nine lit ones. And your line: your name, your user ID and group ID, both 1000, your name again as a description, your home folder and your shell, with colons between them. The `x` says your password is kept in `/etc/shadow`, the file you couldn't open.
>
> **init:** In X-ray these tools look alike: `open` the file, `read` it, up to 1024 bytes at a time, write the answer. The kernel only moves bytes. The idea of a line lives in the tools.

## Build it

> **init:** Your errand: how many stops of each kind? `uniq -c` counts repeated lines, but it only sees a line that repeats the one just above it. Try `uniq census.txt` as it is: thirty-seven lines come out of forty, because only three repeated the line above them. So sort first: `sort` prints the lines in order, which puts equal lines next to each other. Keep its output in a file with `>`, then count.

```
$ sort census.txt > sorted.txt
$ uniq -c sorted.txt
      8 compilers-quarter dark
      8 process-district dark
      7 socket-harbor dark
      5 syscall-gate dark
      3 userland dark
      9 userland lit
```

---

> **init:** Six kinds of stop, and the counts add up to forty. Only Userland has any light. And you didn't need `sorted.txt` at all. In The Boot Path you typed `dmesg | grep`. That `|` is a _pipe_: it hands one program's output straight to the next program. Run `sort census.txt | uniq -c`.

## Watch it

---

> **init:** The same six lines. Before you look in X-ray: `sort` wrote its lines to file descriptor 1. Where did they go?
>
> - into a hidden file
> - [x] into a buffer inside the kernel
> - straight into `uniq`'s memory

---

```
pipe([3, 4])                                    = 0
dup2(4, 1)                                      = 1    in sort's process
dup2(3, 0)                                      = 0    in uniq's process
writev(1, "compilers-quarter dark\ncomp"…)      = 719  sort
read(0, "compilers-quarter dark\ncomp"…, 1024)  = 719  uniq
```

> **init:** `pipe` asked the kernel for a buffer, a piece of its memory that holds bytes on their way, with two ends: 3 to read from, 4 to write into. Before the programs started, bash led `sort`'s file descriptor 1 to the writing end, and `uniq`'s file descriptor 0, _standard input_, to the reading end: `dup2` again.
>
> **init:** `sort` wrote its 742 bytes as a first line of 23, then these 719. `uniq` read them, and neither knew a pipe was there. No file was used.

## Debrief

> **init:** So a pipe is a buffer in the kernel: one program writes into it, and the next reads from it. That is the Surface, surveyed. Below it, in 1.4, Run Anything, you stop using a shell and start building one.
>
> **The Watchdog:** Counted, sorted, the lamps tallied. About time.

## Real world

The errand in one go on any Linux, with pipes:

```sh
wc -l /etc/passwd                            # how many users
grep -c bash /etc/passwd                     # how many use bash
cut -d: -f7 /etc/passwd | sort | uniq -c     # shells, counted: two pipes
head -n 3 /etc/passwd; tail -n 3 /etc/passwd # the first and the last lines
```
