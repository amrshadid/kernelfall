# Who Runs

## Scene

> **init:** Remember: a program is a file; a process is a program running, with its own memory and its own number. Every process also has a parent: the process that started it.
>
> **The Watchdog:** And two CPUs. Two. Everybody wants one.
>
> **init:** So the Kernel takes turns for us. Hundreds of times a second, on each CPU. Let's watch.

## See it

> **init:** `ps -e` lists every process. Run it.

```
$ ps -e
  PID TTY          TIME CMD
    1 ?        00:00:00 init
    2 ?        00:00:00 kthreadd
   14 ?        00:00:00 ksoftirqd/0
   21 ?        00:00:00 ksoftirqd/1
   31 ?        00:00:00 kswapd0
  300 tty1     00:00:00 rescue
  318 tty1     00:00:00 ps
```

> **init:** PID 1 is me. PID 2, `kthreadd`, is the parent of the _kernel threads_: the Kernel's own workers. The scheduler runs them like processes, but they only ever run the Kernel's code.
>
> **init:** `ksoftirqd/0` and `ksoftirqd/1` finish interrupt work, one per CPU. `kswapd0` frees memory. The rest are ordinary programs: my shell, and `ps` itself.

`/proc` is a folder the Kernel fills in when you look, with one folder per process, named by its PID.

> **init:** See what the Kernel keeps about my shell: `cat /proc/300/status`.

```
Name:	rescue
State:	S (sleeping)
Pid:	300
PPid:	1
VmRSS:	    1024 kB
voluntary_ctxt_switches:	42
nonvoluntary_ctxt_switches:	3
```

> **init:** `S (sleeping)`: it's waiting for you to type. `PPid: 1`: its parent is me. `VmRSS` is the memory it's using right now.
>
> **init:** The last two count how often it gave up the CPU because it had to wait (voluntary), and how often the CPU was taken away because its turn was over (nonvoluntary).

**The scheduler.** The **scheduler** is the part of the Kernel that decides which process runs on each CPU, and for how long. `nproc` prints `2`: two CPUs. init starts `yes` three times, a program that prints `y` forever, with its output thrown away into `/dev/null`.

X-ray shows one lane per CPU, each with its own **run queue**: the line of tasks ready to run there. Two `yes` run at the same moment, one on each CPU. The third waits in a run queue and takes turns, in short slices, with the one on that CPU. `ps -e -o pid,stat,time,comm` shows all three `R` (running, or ready to run), each with its CPU time growing. init stops them.

**Many at once.** One picture: two processes add 1 to the same counter at the same moment, and one of the additions is lost.

> **The Verger:** (from the drawing) That's why the Kernel has locks, and why I write down the order every lock is taken.

## Build it

> **init:** Your turn to ask the Kernel who you are. `whoami.c` prints its own PID already. Add a line that prints its parent's, with `getppid()`.
>
> **init:** Then run `./whoami` twice, and `ps` once.

## Watch it

> **init:** Before you run it twice: same PID both times? Same parent?

```
$ ./whoami
I am process 321
My parent is 300
$ ./whoami
I am process 322
My parent is 300
```

> **init:** Different PIDs: each run is a new process. The same parent: my shell started both.

The processes floor of the Section drawing fills with small figures: init at the root, the shell under it, the kernel threads off to one side.

## Debrief

> **init:** Every process has a number, a parent and a state, and the Kernel takes turns giving each one a CPU.
>
> **init:** But each of them also thinks it has the whole Machine's memory to itself. It doesn't. Let's see how the Kernel pulls that off.

## Real world

On any Linux machine:

```
ps -e --forest | head -n 30       # the process tree
ps -o pid,ppid,stat,comm -p $$    # your shell: its PID, parent and state
grep ctxt /proc/$$/status         # how often it gave up the CPU
nproc                             # how many CPUs you have
```
