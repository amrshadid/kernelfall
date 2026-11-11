# Power On

**Question:** Who is in charge of the Machine?

## Scene

The screen is black but for a power button. Press it: the Machine draws itself in section, part by part, as text scrolls past. One burnt line flashes: `Kernel panic - not syncing`.

> **The Watchdog:** The Machine's core crashed tonight: the Kernelfall. I restarted everything. I can't promise it holds.
>
> **init:** Easy, old dog. Hello. I'm init: I start the Machine's programs and look after them. Before we bring its core back, let's ask who is in charge.

## See it

Beside the terminal hangs init's drawing of the Machine in section: three floors, most of them dark.

> **init:** The Machine answers questions about itself. Type `cat /proc/version` in the terminal and press Enter.

---

```
$ cat /proc/version
Linux version 6.18.63-0-virt (buildozer@build-3-24-x86) (cc (Alpine 15.2.0) 15.2.0, GNU ld (GNU Binutils) 2.45.1) #1-Alpine SMP PREEMPT_DYNAMIC 2026-11-11 03:02:54
```

> **init:** That is Linux, version 6.18, naming itself. Linux is the Machine's _kernel_: the one program with full control of the hardware. Every other program has to ask it for what it needs, and `cat` just did. No disk holds that line: the kernel wrote it at the moment `cat` read it.

The drawing labels its parts, top to bottom. Userland, where programs run. A red line across the middle: the Gate, which every request to the kernel crosses. The kernel's floor, its parts still dark: each one lights as we bring it back. And the hardware: a CPU that runs instructions, memory that holds what is running, storage that keeps files, and devices for everything else.

> **init:** While `cat` ran, it was a _process_: a program running, with memory of its own. The kernel keeps track of every process, so it always knows who is asking. I'm one too.

## Build it

> **init:** Now walk down to the kernel from the top. Linux keeps every file in one tree of folders, the _file tree_. Its top is called the root, written `/`. Run `ls /` to list it.

---

```
$ ls /
bin    dev    home   media  opt    root   sbin   sys    usr
boot   etc    lib    mnt    proc   run    srv    tmp    var
```

> **init:** Every file on the Machine sits somewhere below `/`. `proc` is one of these folders; `etc` is another, and it holds settings as plain text you can read. A path names the way down: `/etc/motd` means start at `/`, open the folder `etc`, take the file `motd`. Show it with `cat /etc/motd`.

---

```
$ cat /etc/motd
Welcome to the Machine.
The kernel panicked tonight, and every process froze.
Find the way down, and bring the kernel back.
```

> **init:** My note, written before you woke. Someone wrote `/etc/motd` and saved it. Nobody wrote `/proc/version`: the kernel made it when you asked.

## Watch it

> **init:** One question before we go on. When `cat` showed my note, who read the file?
>
> - `cat` itself
> - [x] the kernel

On the drawing, two lines run from `cat` in Userland down through the Gate into the kernel.

> **init:** The kernel. The `cat` process can't touch a file on its own. It asked the kernel to open the file, then asked it to copy the file to your terminal, and the kernel did both. Each request crossed the Gate; in First Words you see every one `cat` made.
>
> **init:** That is the whole arrangement on the drawing: programs above the Gate, the kernel below it, and only the kernel reaches down to the hardware.

## Debrief

> **init:** So the kernel is in charge. You can find any file by its path, and ask the kernel its name. Every command you ran crossed the Gate to ask it for something. How does a program ask? In First Words, you watch one do it, request by request.

## Real world

On a Linux machine:

```
cat /proc/version                            # the kernel's own words
ls /                                         # the top of the file tree
cat /etc/hostname 2>/dev/null || hostname    # your computer's name
lsblk                                        # your disks: sda, nvme0n1 or similar
```

A Mac's Terminal lists `/` too, but has no `/proc`: macOS runs a different kernel, XNU. On Windows, the Windows Subsystem for Linux gives you a real Linux terminal.
