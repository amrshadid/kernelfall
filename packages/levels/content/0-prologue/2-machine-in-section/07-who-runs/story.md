# Who Runs

## Scene

> **init:** The bottom floor's done: the hardware, and a driver for each part. One floor up, someone has to decide who gets to use the CPU.
>
> **init:** Remember: a program is a file; a process is a program running, with its own memory and its own number. Every process also has a parent: the process that started it.
>
> **The Watchdog:** And one CPU. One. Everybody wants it.
>
> **init:** So the kernel takes turns for us, many times a second. Let's watch.

## See it

> **init:** `ps` lists every process. Run it. It's a long list: here are its top and its bottom.

```
$ ps
PID   USER     TIME  COMMAND
    1 root      0:00 /sbin/init
    2 root      0:00 [kthreadd]
    3 root      0:00 [pool_workqueue_]
...
   15 root      0:00 [ksoftirqd/0]
...
   39 root      0:00 [kswapd0]
...
  471 root      0:01 cat /sys/kernel/tracing/trace_pipe
  473 root      0:00 {kf-control} /bin/sh /usr/sbin/kf-control
  480 you       0:00 -bash
  491 you       0:00 ps
```

Your PIDs will differ a little: the kernel hands out the next free number each time. So will every count and size below, which change from moment to moment.

> **init:** PID 1 is me, `/sbin/init`. PID 2, `kthreadd`, is the parent of the _kernel threads_: the kernel's own workers, shown in square brackets. The scheduler runs them like processes, but they only ever run the kernel's code. There are dozens of them.
>
> **init:** `ksoftirqd/0` finishes interrupt work for CPU 0, the only CPU. `kswapd0` frees memory when it runs short. Near the bottom, the ordinary programs: the trace reader that feeds X-ray, the game's control shell, your shell `-bash` (the dash means it's a login shell), and `ps` itself.

`/proc` is a folder the kernel fills in when you look, with one folder per process, named by its PID. `$$` is a word the shell replaces with its own PID before running the line.

> **init:** See what the kernel keeps about your shell: `cat /proc/$$/status`. It's long. These are the lines that matter today:

```
Name:	bash
State:	S (sleeping)
Pid:	480
PPid:	1
...
VmRSS:	    2236 kB
...
voluntary_ctxt_switches:	218
nonvoluntary_ctxt_switches:	294
```

> **init:** `S (sleeping)`: it's waiting for you to type. `PPid: 1`: its parent is me. `VmRSS` is the memory it's using right now.
>
> **init:** The last two count how often it gave up the CPU because it had to wait (voluntary), and how often the CPU was taken away because its turn was over (nonvoluntary).

**The scheduler.** The **scheduler** is the part of the kernel that decides which process runs on the CPU, and for how long. `nproc` prints `1`: one CPU. Here's a crowd for it: `yes`, a program that prints `y` forever, three times at once.

> **init:** Type this line as it is. `> /dev/null` throws each `yes`'s output away, and `&` starts it in the background, so the shell doesn't wait for it. Then `top` takes one look at who's using the CPU, and `kill` stops all three.

```
$ yes > /dev/null & yes > /dev/null & yes > /dev/null & sleep 4; top -b -n 1 | head -12; kill %1 %2 %3
[1] 495
[2] 496
[3] 497
Mem: 21200K used, 202452K free, 8K shrd, 0K buff, 2852K cached
CPU:   5% usr  54% sys   0% nic   0% idle   0% io  39% irq   0% sirq
Load average: 0.90 0.21 0.07 5/62 500
  PID  PPID USER     STAT   VSZ %VSZ CPU %CPU COMMAND
  471     1 root     R     1716   1%   0  25% cat /sys/kernel/tracing/trace_pipe
  495   480 you      R     1652   1%   0  10% yes
  497   480 you      R     1652   1%   0   9% yes
  496   480 you      R     1652   1%   0   9% yes
  499   480 you      R     1664   1%   0   7% top -b -n 1
...
```

> **init:** Three `yes`, all `R`: running, or ready to run. Only one can be on the CPU at any instant, so the others wait in the **run queue**, the line of tasks ready to run, and the scheduler hands each one a short slice of time in turn. The `CPU` column says `0` for all of them: there is no other.
>
> **init:** And look who else is busy. Every `write` the three make is a syscall the kernel traces for X-ray, so the trace reader takes a quarter of the CPU, and the kernel's own work on all those calls fills the `sys` share. The `irq` share is the kernel answering interrupts, and most of them come from `ttyS1`, the serial line that carries the trace out to X-ray: in those four seconds it interrupted about 5,000 times, as often as the timer, while your terminal's `ttyS0` managed 80. Watching costs something too.

X-ray shows the one CPU's lane, with the three `yes` taking turns on it, slice after slice.

**Many at once.** One picture: two processes add 1 to the same counter, one is stopped halfway through its addition while the other does its own, and one of the additions is lost. One CPU is enough for that: it only takes a turn ending at the wrong moment.

> **The Verger:** (from the drawing) That's why the kernel has locks, and why I write down the order every lock is taken.

## Build it

> **init:** Your turn to ask the kernel who you are. `mypid.c` prints its own PID already. Add a line that prints its parent's, with `getppid()`.
>
> **init:** Then run `./mypid` twice.

## Watch it

> **init:** Before you run it twice: same PID both times? Same parent?

```
$ ./mypid
I am process 502
My parent is 480
$ ./mypid
I am process 503
My parent is 480
```

> **init:** Different PIDs: each run is a new process. The same parent: your shell started both, and its PID is the one `echo $$` prints.

The processes floor of the Section drawing fills with small figures: init at the root, your shell under it, the kernel threads off to one side under `kthreadd`.

## Debrief

> **init:** Every process has a number, a parent and a state, and the kernel takes turns giving each one the CPU.
>
> **init:** But each of them also thinks it has the whole Machine's memory to itself. It doesn't. Let's see how the kernel pulls that off, in Pages and Maps.

## Real world

On any Linux machine:

```
ps -e --forest | head -n 30       # the process tree (GNU ps; BusyBox ps has no --forest)
ps -o pid,ppid,stat,comm -p $$    # your shell: its PID, parent and state (GNU ps)
grep ctxt /proc/$$/status         # how often it gave up the CPU
nproc                             # how many CPUs you have
```

With more than one CPU, `top` shows several `yes` running at the same instant, each on its own CPU, and the scheduler also moves tasks between CPUs to balance the load.
