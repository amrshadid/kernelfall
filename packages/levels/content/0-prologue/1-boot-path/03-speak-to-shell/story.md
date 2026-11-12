# Speak to the Shell

**Question:** How does the shell turn the line you type into a running program?

## Scene

> **init:** In First Words, `execve` started `/bin/echo` with a list of words. Who made that list, and who found the file? The shell: bash, the program that reads each line you type. One day you'll build one.
>
> **The Watchdog:** And whatever it starts asks the kernel for everything. You've seen it.
>
> **init:** I've left my own `hello.c` in the editor, the same lines as yours. Press Run once to build it: you'll need `hello` at the end.

## See it

> **init:** Type `/bin/echo one two three`, then `ls -l /etc`. X-ray shows the words the shell handed each program.

---

```
execve("/bin/echo", ["/bin/echo", "one", "two", "three"], ...) = 0
execve("/bin/ls", ["ls", "-l", "/etc"], ...)                   = 0
```

> **init:** The shell cut each line into words at the spaces. The first word is the _command_. The others are its _arguments_, and one with a dash, like `-l`, is an _option_: it changes how the program works. The program gets every word as one list, its own name first: its argument vector, `argv`.
>
> **init:** I wrote `/bin/echo`, a path, because plain `echo` is a _builtin_: the shell does it itself and starts no program. For `ls`, the shell had to find the file. Run `man ls`, press `q`, and look at what the shell did first.

---

```
statx("/usr/local/sbin/man", ...) = -1 ENOENT (No such file or directory)
statx("/usr/local/bin/man", ...)  = -1 ENOENT (No such file or directory)
statx("/usr/sbin/man", ...)       = -1 ENOENT (No such file or directory)
statx("/usr/bin/man", ...)        = 0
faccessat2(..., "/usr/bin/man", X_OK, ...) = 0
fork()                            = 491
[491] execve("/usr/bin/man", ["man", "ls"], ...) = 0
```

> **init:** `statx` asks the kernel about a file. Three folders had no `man`, and the kernel answered `ENOENT`: no such file. The fourth had it. The shell then copied itself with `fork`, and the copy, its child, became `man` with `execve`. The number `fork` answered is the copy's process number, its PID.
>
> **init:** Where did those folders come from? Run `printenv PATH`.

---

```
$ printenv PATH
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```

> **init:** `PATH` is an _environment variable_: a `NAME=value` setting every process gets from its parent. It lists the folders the shell searches, in order, with `:` between them.

## Build it

> **init:** Your errands now, and you type every word.
>
> **init:** Arguments: `/bin/echo` with four words of your own. Options: `ls -l`, then `ls -a`, then both joined in one word, `ls -la`. An option and an argument together: `wc -l /etc/motd` counts the lines of my note.

---

```
$ wc -l /etc/motd
3 /etc/motd
```

> **init:** When you forget an option, the Machine keeps a manual. `man wc` shows the page for `wc`: arrows scroll, `q` quits. `man 2 write` opens section 2, the syscalls, at the `write` you called in First Words.
>
> **init:** Tab finishes a name for you. Type `cat /etc/mot`, press Tab, then Enter. Do the same with `printen`.
>
> **init:** Last, the environment. `env GREETING=hi printenv GREETING` starts `printenv` with one extra setting, and it prints `hi`. Then `printenv GREETING` alone prints nothing: the setting lived only in that one child.

## Watch it

> **init:** `hello` is in `/home/you`, the folder you're in. Type just `hello`: where will the shell look for it?
>
> - here, in `/home/you`
> - [x] in the six `PATH` folders
> - everywhere

---

```
$ hello
-bash: hello: command not found
$ ./hello
hello, Machine
```

```
statx("/usr/local/sbin/hello", ...) = -1 ENOENT (No such file or directory)
statx("/usr/local/bin/hello", ...)  = -1 ENOENT (No such file or directory)
statx("/usr/sbin/hello", ...)       = -1 ENOENT (No such file or directory)
statx("/usr/bin/hello", ...)        = -1 ENOENT (No such file or directory)
statx("/sbin/hello", ...)           = -1 ENOENT (No such file or directory)
statx("/bin/hello", ...)            = -1 ENOENT (No such file or directory)
fork()                              = 500
[500] writev(2, ..., "hello: command not found", ...) = 24
[500] exit_group(127)               = ?
```

> **init:** Only in the `PATH` folders, never the one you're in. Six `ENOENT`s, and the shell gave up. Its child printed the complaint on file descriptor 2 and ended with status 127, the shell's number for "command not found"; 0 would mean all went well. No `execve`: nothing was started.
>
> **init:** `./hello` has a `/` in it, so it is a path, and the shell doesn't search. `.` means the folder you're in.
>
> **init:** It is left out of `PATH` on purpose: a stray `ls` in a shared folder must never run in place of the real one.

## Debrief

> **init:** So the shell cuts your line into words, finds the program through `PATH`, and starts it with `fork` and `execve`. All of that needs a Machine that is already running. In The Boot Path you watch how it woke when you pressed the power button.

## Real world

```
echo $SHELL                  # the shell you log in with
printenv PATH                # your PATH; it may list other folders
type cat cd echo             # cat is a file found through PATH; cd and echo are builtins
ls -la ~                     # your home, hidden files too
man 2 write                  # section 2: the syscall from First Words; q quits
env GREETING=hi printenv GREETING
strace -f -e trace=%%stat,execve,fork,clone bash -c 'nosuchcmd; true'
```

The last line shows bash's search. `%%stat` is strace's name for every call that asks about a file: `statx` on the Machine, often `newfstatat` on a 64-bit laptop. You'll find one call for each `PATH` folder, then a copy that prints "command not found". Other shells word it their own way: on the Machine, `sh -c nosuchcmd` says `sh: nosuchcmd: not found`.
