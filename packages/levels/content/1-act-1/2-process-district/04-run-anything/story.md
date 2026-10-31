# Run Anything

## Scene

> **init:** Welcome to the Process District. My home. Look at it. Empty doorways. Nobody running.
>
> **init:** Your shell can do four tricks. A real shell can run _anything_. Here's how every process in this city was born.
>
> **init:** First, a process copies itself. That's `fork`. Two of you, each with a copy of the same memory, same code. Only the return value differs: the child gets 0.
>
> **init:** Then the copy becomes something else. That's `exec`. Same process ID, brand-new program.
>
> **init:** And the parent waits for the child to finish. That's `wait`. A finished child who isn't waited for becomes a _zombie_. It's dead, but it still holds its place in the process table.
>
> **The Watchdog:** Zombies. Ugh. I've seen whole districts full of them. Wait for your children, kid.
>
> **init:** When nobody waits, I end up adopting them. I'm old. Please don't make me.

## See it

> **init:** You ran `ls` a dozen times. Who started it? Watch the processes view: `init(1)`, then bash under it.
>
> **init:** `fork` returns twice: a second box appears with a new PID, and the syscalls view shows `fork() = 412` in the parent, `= 0` in the child.
>
> **init:** Then `execve("/bin/ls", ...)` in the child: same PID, new name. When `ls` calls `exit_group(0)` it becomes a zombie, until the parent's `wait4` reaps it.
>
> **init:** The exit status travels back. `wait4` fills an `int status`, and `WIFEXITED` and `WEXITSTATUS` read the 0 back out. A shell keeps it as `$?`, with two numbers of its own: 127 for "command not found", 128 + n for "killed by signal n".
>
> **init:** Errors come back as numbers. Run `nosuch`: the Kernel answers `execve` with `-ENOENT`, and the C library turns that into `-1` with `errno` set to `ENOENT`, 2. `strerror()` turns it into "No such file or directory".
>
> **init:** One more thing. Right after `fork`, look at the memory panel: the same variable at the same address in parent and child. The child changes it; the parent's copy doesn't move. Same address, different memory. Each process has its own _virtual address space_, and `fork` gives the child a copy. Linux shares the pages until one side writes: _copy-on-write_.

## Build it

> **init:** Fill in `run_external()`. `dispatch()` already calls it when no builtin matches.
>
> **init:** `fork()`. In the child, `execvp()`; if it returns, it failed, so print why and `_exit(127)`. In the parent, `waitpid()` for that child and keep its status. `exit` with no argument ends the shell with the last command's status.
>
> **The Watchdog:** And `fork()` can fail too. Check it. Zombies. Ugh. Wait for your children, kid.
>
> **init:** Run it, and live in it for a while: `ls /`, `/bin/echo a b`, a command that doesn't exist, ten commands or more, then `false` and `exit`. Then once more: `nosuch` and `exit`. I watch every process it starts.
>
> **The Watchdog:** Then I break your `fork()` on purpose. `(ulimit -u 1; exec ./ksh-lite)` lets your user have one process at most, and your user already has two: bash and your shell. So its next `fork()` gets `EAGAIN`. Ask it for a command and see if it survives.

## Watch it

> **init:** Before you run the little `fork` demo: how many lines will it print, and what will the child's copy of `count` hold after the child adds one?

```
ksh$ ls /
bin  dev  etc  home  proc  sys  tmp  usr
ksh$ nosuch
ksh-lite: nosuch: command not found
```

> **init:** Each command you type walks out of your shell's door as a new process, does its job, and comes back to be counted by `waitpid`.
>
> **init:** No zombies. Good.

## Debrief

> **init:** The streets have people again. Let's send one somewhere. Type `cd /tmp`.
>
> **init:** `ksh-lite: cd: command not found`. Of course: there's no `cd` program to run. And there can't be.
>
> **The Watchdog:** People walking around with no address. Lost, the lot of them.
>
> **init:** Every process carries a few things of its own: where it stands, what it's called. Tomorrow I'll show you where the Kernel keeps them, and how to read them.

## Real world

Compile a fork-exec-wait program (the `execlp` of `ls -l`, with `_exit(127)` if it fails), run `nosuch; echo $?` in bash to see 127, then make a zombie on purpose (a parent that never waits):

```
bash -c 'sleep 1 & exec sleep 30' &
sleep 2; ps -e -o pid,ppid,stat,comm | grep sleep   # the child shows state Z
```

After 1.5, come back and run your program under `strace -f ./a.out` to find the `fork`, `execve` and `wait4` lines.
