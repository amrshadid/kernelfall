# Speak to the Shell

## Scene

> **init:** So far you've clicked my chips. Now speak to the shell yourself, every word. One day you'll build one.
>
> **init:** The Machine's shell is bash, the same program millions of Linux machines run. It prints a _prompt_, `kernelfall:~$ `: the Machine's name, a colon, the folder you're in, and `$`, which means "your turn". `~` is short for your home folder, `/home/you`. You type a line. It cuts the line into words, finds the program the first word names, runs it, waits for it to finish, and prompts again.
>
> **The Watchdog:** And whatever it runs asks the kernel for everything. You've seen it.
>
> **init:** The first word is the _command_. The other words are its _arguments_. The ones that start with a dash are _options_. And when you forget what a command does, the Machine keeps a manual.
>
> **init:** One thing first. Every level starts on a freshly restored Machine, so your `hello` from First Words is gone. I've put my own `hello.c` in the editor, the same few lines as yours. Press Run once to build it.

## See it

> **init:** Watch X-ray while I type three lines. It shows how the shell cut each one into words, and the list of words it handed the program.

```
execve("/bin/echo", ["/bin/echo", "one", "two", "three"], ...) = 0
execve("/bin/echo", ["/bin/echo", "one", "two"], ...)          = 0
execve("/bin/ls", ["ls", "-l", "/etc"], ...)                   = 0
```

> **init:** I typed `/bin/echo`, not `echo`. Plain `echo` is a builtin: the shell prints the words itself and starts no program, so there's no `execve` to watch. `/bin/echo` is the same job as a program file, so the shell has to start it and hand it the words.
>
> **init:** `/bin/echo one two three`: three arguments. `/bin/echo one      two`: two. The shell splits on spaces, and how many doesn't matter; `echo` puts one space back between its words.
>
> **init:** `ls -l /etc`: `-l` is an option, it changes _how_ `ls` works: one long line per file. `/etc` is an argument, it says _what_ to work on. The shell doesn't know what `-l` means; `ls` does. The program gets all the words, its own name first, as a list called its argument vector, `argv`. Its name is the word you typed: `ls`, or `/bin/echo`.
>
> **init:** Now `man ls`. Look what the shell did before it started anything.

```
statx("/usr/local/sbin/man", ...) = -1 ENOENT (No such file or directory)
statx("/usr/local/bin/man", ...)  = -1 ENOENT (No such file or directory)
statx("/usr/sbin/man", ...)       = -1 ENOENT (No such file or directory)
statx("/usr/bin/man", ...)        = 0
faccessat2(..., "/usr/bin/man", X_OK, ...) = 0
fork()                            = 491
[491] execve("/usr/bin/man", ["man", "ls"], ...) = 0
```

> **init:** I never told it where `man` lives. It looked. `statx` asks the kernel about a file: "is there one here, and what is it?" Three times the kernel answered `ENOENT`, "no such file". The fourth folder had it. `faccessat2` asked "may I run this file?", and the kernel said yes.
>
> **init:** Then the shell made a copy of itself, with `fork`. The copy got a new process number, a _PID_; yours will differ. The copy, `[491]`, became `man` with `execve`. The shell itself waited.
>
> **init:** Where did that list of folders come from? `printenv PATH`:

```
$ printenv PATH
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```

> **init:** `PATH` is one of the process's _environment variables_: a list of `NAME=value` settings every process gets from its parent. This one lists the folders the shell searches, in order, separated by `:`. Six folders; `man` was in the fourth.
>
> **init:** Run `man wc` next, and watch: no search this time. bash remembers where it found each command. `hash` lists what it remembers.

## Build it

> **init:** My errands, and you type every word. Each one fills a line of your Field Guide, the Codex page of commands and folders.
>
> **init:** Arguments first. `/bin/echo one two three`, then `/bin/echo` with four words of your own, and watch the list arrive in X-ray.
>
> **init:** Options. In your home: `ls`, then `ls -l`, then `ls -a`. See the two extra names, `.` and `..`? `.` is this folder, `..` the one above it. Names starting with `.` stay hidden without `-a`. Now `ls -la`: two options joined in one word. Most programs take that.

```
$ ls -a
.        ..       hello    hello.c
```

> **init:** Both together. `wc /etc/motd` counts lines, words and bytes. `wc -l /etc/motd` counts lines only, `wc -w /etc/motd` words only.

```
$ wc /etc/motd
        3        21       124 /etc/motd
$ wc -l /etc/motd
3 /etc/motd
```

> **init:** The manual. `man ls`, and find what `-a` does: "do not ignore entries starting with .". Arrows scroll, `q` quits. Then `man wc`, and find the option that counts bytes.
>
> **init:** One thing the manual won't tell you. Its pages for `ls` and `wc` were written for GNU's versions, which most Linux systems use. The Machine's `ls` and `wc` are BusyBox, smaller programs that take the common options but not every long one. `ls --help` prints BusyBox's own list: `-a  Include names starting with .`. Same option, different words.
>
> **init:** Then `man 2 write`. The manual has numbered sections: 1 for commands, 2 for syscalls, 3 for C library functions. Section 2 holds the `write()` you called yourself.
>
> **init:** Tab. Type `cat /etc/mot` and press Tab: the shell finishes `/etc/motd` for you. When more than one name fits, like `cat /etc/mo`, it stops where they part; press Tab again and it lists all four. Then `printen` and Tab, and `ls /us` and Tab. Watch X-ray: no new program starts. The shell itself reads the folders' names to finish yours.
>
> **init:** The environment. `printenv HOME` is your home folder, `printenv USER` your name on the Machine, then `printenv PATH`, then `env` for all of them.
>
> **init:** Now `env GREETING=hi printenv GREETING`. `env` starts `printenv` with one extra setting, and `printenv` sees it: `hi`. Then `printenv GREETING` alone: nothing. The setting lived only in that one child.
>
> **init:** Last, `PATH` again. `ls /bin`, and find `ls` itself in the list: commands are files. `type ls cd` tells you which is which: `ls is hashed (/bin/ls)`, a file the shell found in `PATH` and remembered (the `hash` from before), and `cd is a shell builtin`.

## Watch it

> **init:** `hello` is in `/home/you`, where you're standing. If you type just `hello`, where will the shell look for it? Here, in `/home/you`; in the six `PATH` folders; or everywhere?

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

> **init:** Only the `PATH` folders, never the one you're in. (X-ray also shows a `statx(".")` before the hunt: that's a question about the folder itself, not about a `hello` in it.) Six `ENOENT`s, and the shell gave up. Its copy printed the complaint on fd 2, the error output, and ended with status 127, the shell's number for "command not found". No `execve` at all: nothing was started. `echo $?` prints the status of the last command, if you want to see the 127 yourself.
>
> **init:** `./hello` has a `/` in it, so it's a path and the shell doesn't search: it means "`hello`, in `.`, this folder". X-ray shows no `statx` hunt, just `fork` and `execve("./hello", ...)`.
>
> **init:** The folder you're in is left out of `PATH` on purpose. Someone could drop a program called `ls` in a shared folder like `/tmp`; it must never run in place of the real one.

A signpost appears at init's door, its arms pointing down the six `PATH` folders. The Field Guide fills its first rows.

## Debrief

> **init:** Now you can speak to a shell. Command, arguments, options, and `man` when you forget. Tab when you're lazy. `PATH` when it can't find something.
>
> **init:** Good, because the next thing I'll show you happens before any shell exists: how the Machine woke up when you pressed the power button. In The Boot Path, we watch it again, slowly.
>
> **The Watchdog:** You saw it scroll past in a blur. Earlier tonight, something down there went wrong at that speed.

## Real world

```
echo $SHELL                  # the shell you log in with
printenv PATH                # your PATH; yours may list other folders
type cat cd echo             # cat is a file found through PATH; cd and echo are builtins
ls -la ~                     # your home, hidden files too
man 2 write                  # section 2: the syscall from First Words (q quits)
env GREETING=hi printenv GREETING
strace -f -e trace=%%stat,execve,fork,clone bash -c 'nosuchcmd; true'
```

The last line shows bash's search: `%%stat` is strace's name for every call that asks about a file, whatever the system calls it (`statx` on the Machine, often `newfstatat` on a 64-bit laptop). Among bash's own start-up questions you'll find one call per `PATH` folder for `nosuchcmd`, then a copy that prints "command not found". Other shells word it their own way: on the Machine, `sh` is BusyBox's, and `sh -c nosuchcmd` says `sh: nosuchcmd: not found`.
