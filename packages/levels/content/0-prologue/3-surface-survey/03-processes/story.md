# Processes from Outside

**Question:** How do you pause or end a running process from outside, and when does it obey?

## Scene

> **init:** Locks said who may touch a file. Now the ones doing the touching. I started two processes for you, as you: a `sleep` that waits a whole day, and a `yes` that writes `y` as fast as it can, to nowhere.
>
> **The Watchdog:** One of them is eating the whole CPU. Guess which.
>
> **init:** In The Kernel, Up Close, the kernel ended `poke` with a signal: a short notice it delivers to a process. Today you send them.

## See it

> **init:** First, find them. `ps` lists processes, and `-o` picks its columns. Run `ps -o pid,ppid,user,stat,time,comm`.

---

```
PID   PPID  USER     STAT TIME  COMMAND
    1     0 root     S     0:00 init
    2     0 root     SW    0:00 kthreadd
...
  483     1 you      S     0:00 sleep
  485     1 you      R     0:01 yes
  487     1 you      S     0:00 bash
  490   487 you      R     0:00 ps
```

> **init:** Read the PIDs from your own list: the kernel numbers processes in the order they start. The first letter of `STAT` is the _state_: `R` is running, or ready to run, and `S` is sleeping, waiting for something. `TIME` is the CPU time used. `yes` has used some already; `sleep` has used none.
>
> **init:** The lines with `PPID` 2 are the kernel's own threads, the ones from Who Runs: their parent is `kthreadd`. `sleep`, `yes` and your shell have me, PID 1, as their parent; `ps` has your shell, which started it.
>
> **init:** `kill` sends a signal. It is a builtin, so X-ray shows bash making the `kill` call itself. `kill -STOP` sends `SIGSTOP`, which pauses a process, and `kill -CONT` sends `SIGCONT`, which lets it carry on. Pause `sleep`, wake it, then read the kernel's own page on it: `cat /proc/PID/status`, with its PID.

---

```
Name:	sleep
Umask:	0022
State:	S (sleeping)
...
PPid:	1
```

> **init:** Sleeping again. `PPid` is its parent's PID: 1, me.

## Build it

> **init:** Your errand is `yes`. First see who is busy: run `ps -o pid,stat,time,comm` twice, a few seconds apart, and watch whose `TIME` grows.
>
> **init:** Now pause `yes`, and run that `ps` again: its state should be `T`, stopped, and its `TIME` should stop growing. A stopped process gets no CPU time at all.
>
> **init:** While it is paused, ask it to end: `kill` with only a PID sends `SIGTERM`, the signal that asks a process to stop for good. Read its `/proc/PID/status`, wake it with `kill -CONT`, and look again with `ps`.
>
> **init:** Then end `sleep` with `kill`, check with `ps` that it is gone, and try one more: `kill 1`. That one is me.

## Watch it

> **init:** `SIGTERM` reaches `yes` while it is paused. Does `yes` end right away?
>
> - yes, at once
> - [x] no, not yet

---

```
State:	T (stopped)
...
ShdPnd:	0000000000004000
```

> **init:** Not yet. A stopped process doesn't run, so it can't act on a signal. The `SIGTERM` waits on it, _pending_. `ShdPnd` has one on-or-off switch for each signal, and `4000` in hexadecimal has only the fifteenth on: `SIGTERM` is signal 15. When `SIGCONT` woke `yes`, it acted on the waiting signal and ended.

```
  485 Z    yes
```

> **init:** A quick `ps` catches this. `Z` is a _zombie_: an ended process, listed until its parent collects its result. I'm its parent, so a moment later it is gone.

```
$ kill 1
-bash: kill: (1) - Operation not permitted
```

> **init:** `EPERM` again: you may signal only your own processes. Root may signal anyone, by another capability.

## Debrief

> **init:** So you find a process with `ps`, and you speak to it with signals. It obeys the next time it runs, and a stopped one doesn't run. Next, in Finding Things, someone has been hiding papers in your attic.
>
> **The Watchdog:** Finally. I could hear myself tick.

## Real world

On any Linux, bash starts a process in the background with `&` and puts its PID in `$!`; `%1` means "job 1":

```sh
sleep 600 &                      # bash prints the job number and the PID
ps -o pid,stat,time,comm
kill -STOP %1; ps -o pid,stat,comm; kill -CONT %1
kill %1
kill 1                           # Operation not permitted
```

The `ps` on most distributions, from procps, also wants `-e` to list every process; BusyBox's lists them all anyway.
