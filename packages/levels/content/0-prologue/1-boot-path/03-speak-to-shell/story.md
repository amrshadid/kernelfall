# Speak to the Shell

## Scene

> **init:** So far you've clicked my chips. Now speak to the shell yourself. You'll be building one soon.
>
> **init:** The shell prints a _prompt_, the `$ ` you see, which means "your turn". You type a line. It cuts the line into words, finds the program the first word names, runs it, waits for it to finish, and prompts again.
>
> **The Watchdog:** And whatever it runs asks the Kernel for everything. You've seen it.
>
> **init:** The first word is the _command_. The other words are its _arguments_. The ones that start with a dash are _options_. And when you forget what a command does, the Machine keeps a manual.

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
> **init:** Now `man ls`. Look: the shell tried twice.

```
execve("/bin/man", ["man", "ls"], ...)     = -1 ENOENT (No such file or directory)
execve("/usr/bin/man", ["man", "ls"], ...) = 0
```

> **init:** I never told it where `man` lives. It looked. `printenv PATH` prints `/bin:/usr/bin`. `PATH` is one of the process's _environment variables_: a list of `NAME=value` settings every process gets from its parent. This one lists the folders the shell searches, in order, separated by `:`. There was no `man` in `/bin`, so the Kernel answered `ENOENT`, "no such file", and the shell tried the next folder.

## Build it

> **init:** My errands, and you type every word. Each one fills a line of your Field Guide, the Codex page of commands and folders.
>
> **init:** Arguments first. `/bin/echo one two three`, then `/bin/echo` with four words of your own, and watch the list arrive in X-ray.
>
> **init:** Options. `ls`, then `ls -l`, then `ls -a`. See the two extra names, `.` and `..`? `.` is this folder, `..` the one above it. Names starting with `.` stay hidden without `-a`. Now `ls -la`: two options joined in one word. Most programs take that.
>
> **init:** Both together. `wc /etc/motd` counts lines, words and bytes. `wc -l /etc/motd` counts lines only, `wc -w /etc/motd` words only.
>
> **init:** The manual. `man ls`, and find what `-a` does: "do not ignore entries starting with .". Press `q` to quit. Then `man wc`, and find the option that counts bytes. Then `man 2 write`: section 2 of the manual is syscalls, and there's the `write()` you called yourself.
>
> **init:** Tab. Type `cat /etc/mot` and press Tab: the shell finishes `/etc/motd` for you. When more than one name fits, like `cat /etc/mo`, it stops where they part; press Tab again and it lists them all. Then `ec` and Tab, and `ls /us` and Tab. Watch X-ray: no new program starts. The shell itself reads the folder's names to finish yours.
>
> **init:** The environment. `printenv HOME` is your home folder, `printenv USER` your name on the Machine, then `printenv PATH`, then `env` for all of them.
>
> **init:** Now `env GREETING=hi printenv GREETING`. `env` starts `printenv` with one extra setting, and `printenv` sees it. Then `printenv GREETING` alone: nothing. The setting lived only in that one child.
>
> **init:** Last, `PATH`. `ls /bin`, and find `ls` itself in the list: commands are files.

## Watch it

> **init:** `hello` is in `/home/you`, where you're standing. If you type just `hello`, where will the shell look for it? Here, in `/home/you`; in `/bin` then `/usr/bin`; or everywhere?

```
$ hello
rescue: hello: command not found
$ ./hello
hello, Machine
```

```
execve("/bin/hello", ["hello"], ...)     = -1 ENOENT (No such file or directory)
execve("/usr/bin/hello", ["hello"], ...) = -1 ENOENT (No such file or directory)
execve("./hello", ["./hello"], ...)      = 0
```

> **init:** Only the `PATH` folders, never the one you're in. A name with a `/` in it is a path, so the shell doesn't search: `./hello` means "`hello`, in `.`, this folder".
>
> **init:** The folder you're in is left out of `PATH` on purpose. Someone could drop a program called `ls` in a shared folder like `/tmp`; it must never run in place of the real one.

A signpost appears at init's door, its two arms pointing down `/bin` and `/usr/bin`. The Field Guide fills its first rows.

## Debrief

> **init:** Now you can speak to a shell. Command, arguments, options, and `man` when you forget. Tab when you're lazy. `PATH` when it can't find something.
>
> **init:** Good, because the next thing I'll show you happens before any shell exists: how the Machine woke up this morning.
>
> **The Watchdog:** You saw it scroll past in a blur. Last night, something down there went wrong at that speed.

## Real world

```
echo $SHELL                  # the shell you log in with
printenv PATH                # usually longer than the lab's
type cat cd echo             # cat is a file found through PATH; cd and echo are builtins
ls -la ~                     # your home, hidden files too
man 2 write                  # section 2: the syscall from First Words (q quits)
env GREETING=hi printenv GREETING
strace -f -e trace=execve sh -c nosuchcmd
```

On Debian and Ubuntu, `sh` is dash, which searches `PATH` the way the rescue shell does: one failed `execve` per folder. bash checks each folder with `stat` first and remembers where it found a command (`hash`), so its trace shows no failed `execve`.
