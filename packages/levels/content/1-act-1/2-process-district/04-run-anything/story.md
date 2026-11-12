# Run Anything

**Question:** How does a shell start a program, and how does it learn how the program ended?

## Scene

> **init:** Welcome to the Process District. My home. Look at it: empty doorways, nobody running.
>
> **init:** On the Surface you used bash all day. Now you build a shell of your own, `ksh-lite`. It already reads a line, cuts it into words, and knows one builtin, `exit`. It can't start a program yet. Watch how bash does it: type `ls`, and look at X-ray's processes view.

## See it

---

> **init:** Three calls. First bash copied itself: that is `fork`. Now two processes run the same code, and only the return value tells them apart: the parent gets the child's PID, and the child gets 0.
>
> **init:** The child's memory is a copy too, at the same addresses: each process has its own virtual memory, as in Pages and Maps. The kernel copies a page only when one side writes to it.
>
> **init:** Then the child swapped its program for `ls`: that is `execve`. Same PID, new program. `execve` comes back only if it failed.
>
> **init:** Last, bash waited. `wait4` sleeps until the child ends, and brings back its _exit status_: a number a program leaves behind, 0 for success. Until the parent collects it, the ended child is a zombie, like `yes` in Processes from Outside.
>
> **init:** Now type `nosuch`.

---

> **init:** bash searched `PATH` itself, as in Speak to the Shell, and found nothing. It forked anyway: the child printed the complaint and ended with status 127, the shells' number for "command not found". No `execve` at all.

## Build it

> **init:** Fill in `run_external()`. `dispatch()` already calls it when no builtin matches.
>
> **init:** Call `fork()`. In the child, call `execvp(argv[0], argv)`, the C library's way to `execve` that searches `PATH` for you. If it returns, it failed: a failed system call returns -1 and leaves the reason in a variable called `errno`. Print why on standard error, then `_exit(127)`, which ends the child at once.
>
> **init:** In the parent, `waitpid(pid, &status, 0)` is the C library's `wait4`. It fills `status` with a packed number, and `WEXITSTATUS(status)` takes the exit status out of it. Return that.
>
> **The Watchdog:** And `fork()` can fail too. Say so on standard error, and keep reading.
>
> **init:** Run it, and live in it for a while: `ls /`, `/bin/echo a b`, ten commands or more, then `false` and `exit`.

## Watch it

---

> **init:** Start it again. Before you type `nosuch` in your own shell: who prints "command not found"?
>
> - your shell
> - [x] the child it forked

---

```
ksh$ nosuch
ksh-lite: nosuch: command not found
```

> **init:** The child. Its `execvp` came back with `ENOENT`, no such file, so it printed why and called `_exit(127)`. Your shell only read the 127 from `waitpid`: type `exit`, and it ends with 127 too. Had the child not ended there, it would have gone on as a second shell, reading your terminal.
>
> **init:** Last, the Watchdog's test. `(ulimit -u 1; exec ./ksh-lite)` allows your user one process, and it already has two, so the next `fork()` fails with `EAGAIN`. The brackets keep that limit away from your bash. Give it a command, and see if it survives.

## Debrief

> **init:** So a shell starts a program with `fork` and `execve`, and learns how it ended with `wait`. One more, in `ksh-lite`: `cd /tmp`. "Command not found": a `cd` program couldn't move your shell anyway. That comes next.
>
> **The Watchdog:** People walking about with no address. Lost, the lot of them.

## Real world

Compile a fork-exec-wait program (the `execlp` of `ls -l`, with `_exit(127)` if it fails), run `nosuch; echo $?` in bash to see 127, then make a zombie on purpose (a parent that never waits):

```
bash -c 'sleep 1 & exec sleep 30' &
sleep 2; ps -e -o pid,ppid,stat,comm | grep sleep   # the child shows state Z
```

Run your program under `strace -f ./a.out` to find the `fork`, `execve` and `wait4` lines. With glibc, the `fork` shows as `clone`.
