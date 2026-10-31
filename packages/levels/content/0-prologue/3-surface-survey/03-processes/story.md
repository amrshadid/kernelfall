# Processes from Outside

## Scene

> **init:** I've started two processes for you, as you: a `sleep` that waits ten minutes, and a `yes` that shouts `y` into `/dev/null` as fast as it can. They're yours, so you may stop them.
>
> **The Watchdog:** One of them's eating the whole CPU. Guess which.
>
> **init:** To a process, you speak with _signals_: short notices the Kernel delivers. "Pause." "Carry on." "Please stop." "Stop now." The program called `kill` sends them. Grim name; most of what it sends isn't fatal.

## See it

> **init:** First, find them. `ps` lists processes; `-e` means every one, and `-o` picks the columns.

```
$ ps -e -o pid,ppid,user,stat,time,comm
  PID  PPID USER     STAT     TIME COMMAND
    1     0 root     Ss   00:00:00 init
    2     0 root     S    00:00:00 kthreadd
   14     2 root     S    00:00:00 ksoftirqd/0
   21     2 root     S    00:00:00 ksoftirqd/1
   31     2 root     S    00:00:00 kswapd0
  300     1 you      Ss   00:00:00 rescue
  401     1 you      S    00:00:00 sleep
  402     1 you      R    00:00:07 yes
  403   300 you      R+   00:00:00 ps
```

> **init:** The first letter of `STAT` is the state. `R`: running, or ready to run. `S`: sleeping, waiting for something. `T`: stopped. `Z`: a zombie, finished but not yet collected by its parent. Extra letters are details: `s` leads a session, `+` runs in the terminal's foreground.
>
> **init:** PIDs 2 to 31 are the Kernel's own threads, the ones you met in Who Runs. Their parent is `kthreadd`, PID 2, not me.
>
> **init:** `TIME` is the CPU time used. `yes` has had seconds of it already, and more each time you look. `sleep`, nothing: sleeping costs nothing.

`kill -l` lists every signal. Four matter today:

| Signal    | Number (x86-64) | Default effect                   |
| --------- | --------------- | -------------------------------- |
| `SIGTERM` | 15              | end the process (it may tidy up) |
| `SIGKILL` | 9               | end it now; it can't refuse      |
| `SIGSTOP` | 19              | pause it; it can't refuse        |
| `SIGCONT` | 18              | let a paused process carry on    |

> **init:** `kill PID` sends `SIGTERM`. `kill -STOP PID` sends `SIGSTOP`, and so on. Watch one signal go through the Gate. I'll pause `sleep`:

```
$ kill -STOP 401
```

```
kill(401, SIGSTOP) = 0
```

```
$ cat /proc/401/status
Name:	sleep
Umask:	0022
State:	T (stopped)
...
```

> **init:** `/proc/401/status` is the Kernel's own page on process 401. `State: T (stopped)`.

## Build it

> **init:** Pausing was my example. Resuming is yours: `kill -CONT 401`, then read its status again. Its `State:` line should say `S (sleeping)`.
>
> **init:** Then the family tree. Every process has a parent: `PPid` in its status. Read `/proc/$$/status`, your shell's (bash puts its own PID in `$$`), and `/proc/402/status`. Who started them?
>
> **init:** And who's busy? Run `ps -e -o pid,stat,time,comm` twice, a few seconds apart. Whose `TIME` grew?
>
> **init:** Now the errand:
>
> - Pause `yes` with `SIGSTOP`. Check its state is `T`, and that its `TIME` stops growing.
> - End it with `SIGTERM` while it's paused.
> - End `sleep` with `kill 401`.
> - Try `kill 1`.

## Watch it

> **init:** You send `SIGTERM` to `yes` while it's paused. Does it end right away?

```
kill(402, SIGTERM) = 0
kill(402, SIGCONT) = 0
--- 402 killed by SIGTERM ---
kill(1, SIGTERM)   = -1 EPERM (Operation not permitted)
```

> **init:** No. A stopped process can't act on anything, so the `SIGTERM` waits on it, _pending_, and `yes` stays `T`. `/proc/402/status` shows it waiting: `ShdPnd: 0000000000004000`, one bit per signal, and bit 15 counted from 1 is `SIGTERM`. Once `SIGCONT` wakes it, it acts on the waiting signal and ends. Only `SIGKILL` doesn't wait: the Kernel wakes the process just to end it.
>
> **init:** And `kill 1`: `Operation not permitted`. You may signal only your own processes. I'm root's. Root may signal anyone; that privilege has a name, `CAP_KILL`.
>
> **The Watchdog:** Finally. I could hear myself tick.

The CPU lane in X-ray goes quiet. At the edge of the Process District, the first houses show lit windows.

## Debrief

> **init:** You can find any process, read its state and its parent, and pause, wake or end the ones that are yours.
>
> **init:** One more skill before the Quarter: finding things. The city's big, and someone has been hiding papers in your attic.

## Real world

On a real system, bash starts the process in the background with `&`, and `%1` means "job 1" (a PID works too):

```sh
sleep 600 &                      # bash prints its PID
ps -o pid,stat,time,comm
kill -STOP %1; ps -o pid,stat,comm; kill -CONT %1
kill %1
kill 1                           # Operation not permitted
```
