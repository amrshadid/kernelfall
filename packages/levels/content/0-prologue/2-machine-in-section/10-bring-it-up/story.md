# Bring the Machine Up

## Scene

> **The Watchdog:** Restarting. Not my fault. ...It's stuck. I'm counting, and nobody's resetting me.
>
> **init:** Someone changed the boot entry. Maybe the Dangling, maybe a tired admin. Either way, the Machine can't find its feet.
>
> **init:** You know every floor now. Bring it up. All the way up: disk, network, memory. Then show me one command going all the way down and back.

## See it

The Machine restarts and stops partway. The boot view shows how far it got:

```
Loading, please wait...
Gave up waiting for root file system device.  Common problems:
 - Boot args (cat /proc/cmdline)
   - Check rootdelay= (did the system wait long enough?)
 - Missing modules (cat /proc/modules; ls /dev)
ALERT!  /dev/vda3 does not exist.  Dropping to a shell!


BusyBox v1.37.0 (Debian 1:1.37.0-6) built-in shell (ash)
Enter 'help' for a list of built-in commands.

(initramfs)
```

> **init:** `quiet` hid the Kernel's own lines, but they're all in its log. The Kernel started, its initcalls ran, and the initramfs ran its `/init`. But that `/init` couldn't find the partition named by `root=`. So it stopped, and opened a tiny emergency shell, `(initramfs)`, before I could even start.

X-ray points at the boot view's lane: stage 5, the root.

## Build it

> **init:** Four steps, in order. My chips only say what each command is for now. You choose what to look at.

**1. Find the root.** In the `(initramfs)` shell, `ls /dev` shows `vda`, `vda1` and `vda2`, and no `vda3`. `cat /proc/cmdline` shows what the Kernel was told: `root=/dev/vda3`.

> **init:** Restart with `reboot`. At the GRUB menu, press `e` on the entry, fix `root=` on the `linux` line, and boot with Ctrl-X.

GRUB has a command line of its own too: press `c`, then type `ls`, and it lists the disk and its partitions in its own names: `(proc) (hd0) (hd0,gpt2) (hd0,gpt1)`. `(proc)` is GRUB's own small folder of facts; the partitions come last one first.

**2. Light the harbor.** The Machine boots, but the network is dark: `ls /sys/class/net` shows only `lo`.

> **init:** Find out why, from the hardware up. Is the card there? Does it have a driver? What did the Kernel say?

`lspci -k` still lists the network card, but with no `Kernel driver in use`. Its `driver` link in `/sys/bus/pci/devices/0000:00:02.0` is missing. And `dmesg` says:

```
[    0.412318] Module e1000 is blacklisted
```

`/proc/cmdline` shows `module_blacklist=e1000`: the boot entry told the Kernel not to load that driver.

**3. Check the memory.** `free` shows about 42 MiB in total, but the Machine has 512 MiB: you saw it on the hardware floor. `dmesg` shows the Kernel was told to use less:

```
[    0.000000] Command line: ... module_blacklist=e1000 mem=64M
[    0.031020] Memory: 41540K/65024K available (...)
```

kswapd's figure on the drawing runs back and forth, clearing room that isn't there.

> **init:** Restart again. GRUB forgets an edit made with `e` once that boot is over, so fix `root=` again too, and remove both `module_blacklist=e1000` and `mem=64M`.

Then check: `free` shows about 490 MiB, `ls /sys/class/net` shows `eth0`, the card's `driver` link points at `e1000`, and `ps -e` shows init as PID 1, the shell under it and the Kernel's threads.

**4. One command, end to end.** First a prediction, then the run: `cat /sys/class/net/eth0/operstate`, with X-ray's full route on. It prints `up`.

## Watch it

> **init:** Before the last run: put the path in order.

Nine cards: the shell reads your line; `clone` makes a new process; `execve` turns it into `cat`; the scheduler runs it; `openat` walks the path in the VFS; `read` goes to sysfs, which asks the network driver for the card's state; the bytes are copied to `cat`'s memory; `write(1)` hands them to the terminal's driver, which shows them; `cat` exits and the shell's `wait4` returns.

Then the run replays in that order, each step lighting its floor of the Section drawing. A wrong order costs nothing: the replay shows the right one and marks the card that moved.

```
read(0, "cat /sys/class/net/eth0/operstate\n", ...)   rescue       tty
clone(...)                                  = 340      rescue       kernel/fork.c
execve("/bin/cat", ["cat", "/sys/..."], ...) = 0       cat          fs/exec.c
openat(AT_FDCWD, "/sys/class/net/eth0/operstate", O_RDONLY) = 3     fs/namei.c, sysfs
read(3, "up\n", 262144)                     = 3        cat          kernfs → net-sysfs → e1000
write(1, "up\n", 3)                         = 3        cat          tty
exit_group(0)                               = ?        cat          kernel/exit.c
wait4(340, [{WIFEXITED(s) && WEXITSTATUS(s) == 0}], 0, NULL) = 340  rescue
```

> **The Watchdog:** Reset. Properly. First time since the Kernelfall.

The Watchdog's meter fills and stays full. The Kernel Map's Prologue regions are fully drawn, the network card glows at the bottom of the Section, and a wire runs from it to the dark harbor.

> **init:** The wire's live. Nobody's talking on it yet.

## Debrief

> **init:** You brought the Machine up from a dead stop: the root, the driver, the memory. And you followed one command all the way down to a driver and back.
>
> **init:** You know what the Machine is made of now, top to bottom. But you've only seen the city from my doorstep. Time you walked the streets you're rebuilding.

## Real world

On any Linux machine:

```
cat /proc/cmdline                          # what your kernel was told
sudo dmesg | grep -i -E 'blacklist|memory:'
lspci -k | grep -A2 -i ethernet            # is your network card's driver in use?
strace -f -e trace=clone,execve,openat,read,write,wait4 sh -c 'cat /sys/class/net/lo/operstate'
```

On a test virtual machine: at GRUB, press `e`, add `mem=512M` for one boot, and compare `free` before and after. To make a change last, Debian and Ubuntu keep the kernel's command line in `GRUB_CMDLINE_LINUX` in `/etc/default/grub`; run `sudo update-grub` after editing it.
