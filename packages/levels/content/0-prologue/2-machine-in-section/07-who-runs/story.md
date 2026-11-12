# Who Runs

**Question:** With one CPU, how do all the Machine's processes run at once?

## Scene

> **init:** In Finding the Hardware, the kernel gave every device a driver. One of those devices is the CPU, and the Machine has just one. Yet `ps` is about to show you dozens of processes. How do they all run?
>
> **The Watchdog:** One CPU. One. Everybody wants it.
>
> **init:** They take turns, many times a second, and the kernel decides whose turn it is.

## See it

> **init:** Run `ps`. It lists every process. The list is long: here are its top and its bottom.

---

```
$ ps
PID   USER     TIME  COMMAND
    1 root      0:01 /sbin/init
    2 root      0:00 [kthreadd]
    3 root      0:00 [pool_workqueue_]
...
  472 you       0:00 -bash
...
  485 you       0:00 ps
```

> **init:** PID 1 is me. The names in square brackets are _kernel threads_: the kernel's own workers. They take turns on the CPU like processes, but they run only the kernel's code. Near the bottom is your shell, `-bash`, and `ps` itself.
>
> **init:** Every process has a _parent_: the process that started it. The kernel shows what it keeps about each one in `/proc`, in a folder named by its PID, and `$$` is the shell's word for its own PID. Run `cat /proc/$$/status`.

---

```
Name:	bash
...
State:	S (sleeping)
...
Pid:	472
PPid:	1
...
```

> **init:** `S (sleeping)`: your shell is waiting for you to type, so it needs no CPU. `PPid: 1`: its parent is me.
>
> **init:** Almost every process on that long list is asleep like your shell, waiting for a key, a file or a timer. The kernel shares the CPU only among the few that are ready to run. That is the first half of how one CPU serves them all.

## Build it

> **init:** Now give the CPU a crowd. `yes` prints `y` forever. Type this line as it is: it starts three of them, waits four seconds, takes one look with `top`, and ends them with `kill`, which sends each a signal.

---

```
$ yes > /dev/null & yes > /dev/null & yes > /dev/null & sleep 4; top -b -n 1 | head -12; kill %1 %2 %3
[1] 487
[2] 488
[3] 489
Mem: 19268K used, 204336K free, 4K shrd, 0K buff, 2848K cached
CPU:   4% usr  34% sys   0% nic   0% idle   0% io  61% irq   0% sirq
Load average: 1.26 0.30 0.10 4/59 492
  PID  PPID USER     STAT   VSZ %VSZ CPU %CPU COMMAND
  471     1 root     R     1716   1%   0  39% cat /sys/kernel/tracing/trace_pipe
  488   472 you      R     1652   1%   0  12% yes
  487   472 you      R     1652   1%   0  12% yes
  489   472 you      R     1652   1%   0  12% yes
  491   472 you      R     1664   1%   0  11% top -b -n 1
...
```

> **init:** `> /dev/null` sends each `yes`'s output to a device that throws it away, and `&` starts it in the background, so the shell doesn't wait for it. All three show `R`: running, or ready to run. Only one is on the CPU at any instant. The _scheduler_, the part of the kernel that decides who runs and for how long, gives each a short turn. The `cat` above them is X-ray's own feed: watching costs CPU time too.
>
> **init:** Last, `mypid.c` prints its own PID. Add a line that prints its parent's, with `getppid()`, and run `./mypid` twice.

## Watch it

> **init:** Before you run it twice: same PID both times? Same parent?
>
> - The same PID and the same parent
> - [x] A new PID, the same parent
> - A new PID and a new parent

---

```
$ ./mypid
I am process 493
My parent is 472
$ ./mypid
I am process 494
My parent is 472
```

> **init:** A new PID each time: every run is a new process, and the kernel hands out the next free number. The same parent: your shell started both, and 472 is the PID `ps` showed for it.
>
> **init:** That is the family tree of the Machine. I started your shell, your shell started `mypid`, and the kernel threads all descend from `kthreadd`, PID 2.

## Debrief

> **init:** Every process has a number, a parent and a state, and the scheduler gives each one a turn on the CPU. Each of them also believes it has the Machine's memory to itself. It doesn't. In Pages and Maps, you see how the kernel pulls that off.

## Real world

On a Linux machine:

```
ps -e --forest | head -n 30       # the process tree, with GNU ps
ps -o pid,ppid,stat,comm -p $$    # your shell: its PID, parent and state
grep ctxt /proc/$$/status         # how often it gave up the CPU
nproc                             # how many CPUs you have
```

With more than one CPU, `top` shows several `yes` running at the same instant, each on its own CPU, and the scheduler also moves tasks between CPUs to balance the load.
