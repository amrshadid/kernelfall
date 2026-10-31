# Processes from Outside

## Scene

> **init:** I've started two processes for you, as you: a `sleep` that waits a whole day, 86,400 seconds, and a `yes` that shouts `y` into `/dev/null` as fast as it can. They're yours, so you may stop them.
>
> **The Watchdog:** One of them's eating the whole CPU. Guess which.
>
> **init:** To a process, you speak with _signals_: short notices the kernel delivers. "Pause." "Carry on." "Please stop." "Stop now." The command called `kill` sends them. Grim name; most of what it sends isn't fatal.

Where that picture stops being true: a signal isn't a message the process reads when it likes. The kernel marks it on the process, and acts on it the next time the process runs: it calls the program's handler for it, or does the signal's default action, like ending or pausing the process.

## See it

> **init:** First, find them. `ps` lists processes; `-o` picks the columns: the PID, the parent's PID, the user, the state, the CPU time used, and the command's name.

```
$ ps -o pid,ppid,user,stat,time,comm
PID   PPID  USER     STAT TIME  COMMAND
    1     0 root     S     0:00 init
    2     0 root     SW    0:00 kthreadd
    3     2 root     SW    0:00 pool_workqueue_
...
   15     2 root     SW    0:00 ksoftirqd/0
...
  476     1 you      S     0:00 sleep
  478     1 you      R     0:01 yes
  480     1 you      S     0:00 bash
  483   480 you      R     0:00 ps
```

> **init:** Your PIDs will differ from mine: the kernel hands out the next free number each time a process starts. Read them from your own list.
>
> **init:** The first letter of `STAT` is the state. `R`: running, or ready to run. `S`: sleeping, waiting for something. `T`: stopped. `Z`: a _zombie_, finished but not yet collected by its parent. `I`, on many of the kernel's threads: idle, waiting for work. Letters after the first are details: `W` means the process has no memory of its own for a program (true of every kernel thread), `<` a raised priority, `N` a lowered one.
>
> **init:** The long run of `PPID 2` lines are the kernel's own threads, the ones you met in Who Runs. Their parent is `kthreadd`, PID 2, not me. And `sleep`, `yes` and your `bash` all have me, PID 1, as their parent.
>
> **init:** `TIME` is the CPU time used, in minutes and seconds. `yes` has had a second of it already, and more each time you look. `sleep`, nothing: sleeping costs nothing.

`kill -l` lists every signal. Four matter today:

| Signal    | Number (x86) | Default effect                   |
| --------- | ------------ | -------------------------------- |
| `SIGTERM` | 15           | end the process (it may tidy up) |
| `SIGKILL` | 9            | end it now; it can't refuse      |
| `SIGSTOP` | 19           | pause it; it can't refuse        |
| `SIGCONT` | 18           | let a paused process carry on    |

> **init:** `kill PID` sends `SIGTERM`. `kill -STOP PID` sends `SIGSTOP`, and so on. `kill` is built into bash, so the shell makes the call itself. Watch one go through the Gate. I'll pause `sleep`, PID 476 on my Machine:

```
$ kill -STOP 476
```

```
kill(476, SIGSTOP) = 0
```

```
$ cat /proc/476/status
Name:	sleep
Umask:	0022
State:	T (stopped)
...
```

> **init:** `/proc/476/status` is the kernel's own page on process 476. `State: T (stopped)`.

## Build it

> **init:** Pausing was my example. Resuming is yours: `kill -CONT` with `sleep`'s PID, then read its status again. Its `State:` line should say `S (sleeping)`.
>
> **init:** Then the family tree. Every process has a parent: `PPid` in its status. Read `/proc/$$/status`, your shell's (bash puts its own PID in `$$`), and `yes`'s. Who started them?
>
> **init:** And who's busy? Run `ps -o pid,stat,time,comm` twice, a few seconds apart. Whose `TIME` grew?

```
$ ps -o pid,stat,time,comm
...
  478 R     0:03 yes
...
$ ps -o pid,stat,time,comm
...
  478 R     0:06 yes
```

> **init:** Now the errand:
>
> - Pause `yes` with `SIGSTOP`. Check its state is `T`, and that its `TIME` stops growing.
> - Send it `SIGTERM` while it's paused, and read its whole status with `cat`.
> - Wake it with `SIGCONT`, and look again with `ps`.
> - End `sleep` with `kill`.
> - Try `kill 1`.

## Watch it

> **init:** You send `SIGTERM` to `yes` while it's paused. Does it end right away?

```
$ kill -STOP 478
$ kill 478
$ cat /proc/478/status
Name:	yes
...
State:	T (stopped)
...
SigPnd:	0000000000000000
ShdPnd:	0000000000004000
...
$ kill -CONT 478
$ ps -o pid,stat,comm
...
  478 Z    yes
```

> **init:** No. A stopped process doesn't run, so it can't act on anything. The `SIGTERM` waits on it, _pending_, and `yes` stays `T`. `ShdPnd` shows the signals waiting for the whole process, one bit per signal: `4000` in hexadecimal is bit 15 counted from 1, `SIGTERM`. Once `SIGCONT` wakes it, it acts on the waiting signal and ends. Only `SIGKILL` doesn't wait: the kernel wakes the process just to end it.
>
> **init:** And now it's a zombie, `Z`: finished, its exit status kept until its parent collects it. I'm its parent, so that's my job, and in a moment it's gone from the list.

```
$ kill 1
-bash: kill: (1) - Operation not permitted
```

```
kill(1, SIGTERM) = -1 EPERM (Operation not permitted)
```

> **init:** You may signal only your own processes. I'm root's. Root may signal anyone; that privilege has a name, `CAP_KILL`.
>
> **The Watchdog:** Finally. I could hear myself tick.

The CPU lane in X-ray goes quiet. At the edge of the Process District, the first houses show lit windows.

## Debrief

> **init:** You can find any process, read its state and its parent, and pause, wake or end the ones that are yours.
>
> **init:** Two more skills before the Quarter: finding things, then counting them. The city's big, and next, in Finding Things, someone has been hiding papers in your attic.

## Real world

On any Linux, bash starts a process in the background with `&` and puts its PID in `$!`; `%1` means "job 1":

```sh
sleep 600 &                      # bash prints the job number and the PID
ps -o pid,stat,time,comm
kill -STOP %1; ps -o pid,stat,comm; kill -CONT %1
kill %1
kill 1                           # Operation not permitted
```

GNU `ps` (procps) also wants `-e` to list every process; BusyBox's lists them all anyway.
