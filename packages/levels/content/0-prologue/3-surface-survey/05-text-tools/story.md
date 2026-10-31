# Counting and Sorting

## Scene

> **init:** Your survey's done. I wrote it all down in `census.txt`: one line per house you passed, the district and whether its lamp is lit or dark.
>
> **init:** A _line_ is text up to a newline. Most tools here work one line at a time: count them, pick some, sort them, squash the repeats.

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
> **init:** In X-ray they all look the same: `openat`, `read` the whole file, then `write` what's left. The Kernel only moves bytes. The idea of a "line" lives in the tools.

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
you:x:1000:1000:you:/home/you:/bin/sh
```

> **init:** Then `sort census.txt`, and `sort -r census.txt` for the reverse.
>
> **init:** Now the errand: how many houses per district? `uniq` drops a line only if it repeats the line just above it. So first put the same lines next to each other.

```
$ sort -o sorted.txt census.txt
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

> **init:** `-o sorted.txt` is `sort`'s own option: it writes into that file. My shell can't send output into a file for you; `sort` does it itself.

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
```

> **init:** Thirty-seven lines, against six from `sorted.txt`. Only three lines repeated the one just above them, like the second `process-district dark` here, and only those were squashed. Repeats that aren't neighbours survive.
>
> **init:** You'd like to skip the file in between. In a real shell you'd type this:

```
$ sort census.txt | uniq -c
rescue: pipes not supported
```

> **init:** My shell can't hand one program's output to another. That `|` is a _pipe_, and the city lost them. Here's an old recording, from before the Kernelfall:

```
pipe2([3, 4], 0)                                       = 0
clone(...)                                             = 512
clone(...)                                             = 513
[pid 512] write(1, "compilers-quarter dark\ncompil"..., 742)  = 742
[pid 513] read(0, "compilers-quarter dark\ncompil"..., 4096)  = 742
[pid 513] write(1, "      8 compilers-quarter dark\n"..., 157) = 157
```

> **init:** One `pipe2`, two `clone`s, and bytes flowing from `sort` straight into `uniq`, with no file in between.

## Debrief

> **init:** One program's output, another's input, no file in between. That's what the city lost. Your shell will bring it back.
>
> **init:** But every shell starts small. Before it can run anything, it reads the line you typed and cuts it into words: `sort`, `census.txt`. You watched mine do it all day.
>
> **init:** In C, a line of text is just bytes in a row, ending in a zero. Go see the Compiler Smith. First, learn how C holds text.

## Real world

The errand in one go, with pipes, as your own shell will run it in 1.7:

```sh
wc -l /etc/passwd                    # how many users
grep -c bash /etc/passwd             # how many use bash
cut -d: -f7 /etc/passwd | sort | uniq -c    # shells, counted (pipes!)
head -n 3 /etc/passwd; tail -n 3 /etc/passwd
```
