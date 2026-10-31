# Power On

## Scene

The screen is black, except for a drawing of a power button. Press it: a fan spins up, and the Machine draws itself in outline, part by part, as it starts. Lines of text scroll past too fast to read. You'll read these properly soon.

Near the end, one burnt, garbled line flashes: `...fade...` and `Kernel panic - not syncing`. A shadow slips out of frame.

> **The Watchdog:** Tick. Tick. Oh good, something's awake. You. You're new.
>
> **The Watchdog:** I'm the Watchdog. A timer, really. If nobody resets me in time, I restart the whole Machine. Tonight I had to.
>
> **The Watchdog:** The core of the Machine crashed. Everything stopped mid-step. We call it the Kernelfall. I restarted us, and... well. Look around.
>
> **init:** Easy, old dog. Hello, little one. I'm init. I'm the first program the Machine ran today, and I look after everyone who runs after me. Including you.
>
> **init:** Here's the plan. The core that crashed is called the _kernel_, and together we're going to bring it back, part by part. You can't fix what you've never seen, so tonight you'll just look around.
>
> **init:** You don't know what any of this is yet. That's fine. First what a computer is made of, then a walk through the Machine's folders, top to bottom, until we reach the kernel itself.

## See it

The Section drawing, a cutaway of the Machine like a page from a service manual, lights one part at a time.

> **init:** Every computer is made of four kinds of parts. A phone has them, a laptop has them, and so does the Machine.
>
> **init:** The _CPU_ is the chip that carries out instructions: add these, compare those, copy this there. Millions of them a second, even in the Machine. It has one CPU, so it runs one program at a time, and switches between them so fast they all seem to run at once.
>
> **init:** _Memory_, or RAM, is fast storage for whatever is running right now. It forgets everything when the power goes off. The Machine has 256 MiB of it: room for about 268 million _bytes_. One byte holds one small number, from 0 to 255. Everything in memory is numbers, text included: an agreed table, an _encoding_, gives each character its number. In UTF-8, the encoding Linux systems use, `h` is 104 and `hello` is five bytes; a letter like `é` or `ش` takes two.
>
> **init:** _Storage_, a disk or an SSD, is slower, but it keeps _files_ when the power is off. A file is a named piece of data: a photo, a message, a program.
>
> **init:** And _devices_ are everything else: the keyboard, the screen, the network card, the disk itself.
>
> **init:** Now, many programs want the same CPU, the same memory and the same devices at once. The _operating system_ is the software that runs the computer for all of them. It starts programs and stops them. It shares the CPU and memory between them and keeps them out of each other's way. It keeps files in folders. And it talks to the devices, so no program has to know every keyboard and disk ever made. Windows, macOS and Android are operating systems. So are Ubuntu and the Machine's own, Alpine Linux.
>
> **init:** At the core of the operating system is the _kernel_: the one part with full control of the hardware. Every other program has to ask it for what it needs. Linux is a kernel. Android, Ubuntu and the Machine all run it.
>
> **init:** Think of a city's public works. You don't dig up the street to get water: you ask, and they open the valve.

Where the picture stops being true: public works is a crew that is always busy somewhere. The kernel isn't a separate worker running beside your program. It is code that runs only when something calls on it: a program's request, a device that needs attention, a timer. Between those moments, the CPU runs your program, not the kernel.

> **init:** A _program_ is instructions saved in a file, waiting: `/bin/ls`, `/bin/cat`, a game you installed. A _process_ is a program while it runs, with its own memory and its own number, a _PID_, a process ID.
>
> **init:** A program is a recipe. A process is someone cooking from it right now. Two cooks can follow the same recipe at the same time: one program, two processes.

Where it stops being true: a process doesn't do the work itself; the CPU does, switching between processes many times a second. And a process owns more than a recipe card: memory, open files, a number. init is a process, PID 1. So are you.

> **init:** Now the files. Linux keeps every file in one tree of folders. Its top is called the _root_, and it's written as a single `/`. A path like `/etc/motd` means: start at `/`, go into the folder `etc`, take the file `motd`.
>
> **init:** Each top folder has one job. `/bin` holds programs. `/etc` holds settings, as plain text you can read. `/home` holds each person's own folder; yours is `/home/you`.
>
> **init:** Then two strange ones. `/dev` holds devices, shown as files: a program writes to the terminal's file and the text appears in your terminal. And `/proc` holds files that aren't stored anywhere. When a program reads one, the kernel writes the answer on the spot. It's the kernel's own window, and we'll look through it before the night is out.

Where it stops being true: the Machine's own files don't live on a disk. They come from the game through a _virtio_ share, a device that works like one. The Machine does have a small disk, `/dev/sda`, which you'll open later; on your laptop the main disk is called something like `sda` or `nvme0n1`.

> **init:** Last, the window you're looking at. The _terminal_ is a window for typing text and reading text back: this game's terminal, Terminal on a Mac, the console of a Linux server. Inside it runs a _shell_, a program that reads each line you type and runs the program you named. The Machine's shell is `bash`. That line is a _command_: the program's name, then what it should work on.

## Build it

> **init:** Here's the shell. Tell me your name first, so I know what to call you.
>
> **init:** Each chip below is a command, with what it does. Click it, or type it yourself and press Enter. Go in order: we're walking from the top of the tree down to the kernel.
>
> **init:** `echo hello`: `echo` prints what you give it. It's so small that the shell does it itself, without starting a program: a _builtin_. Now give it something else: your name, a greeting, anything.

```
$ echo hello
hello
```

> **init:** `ls /`: the program `ls` lists a folder. This is the root, the top of the tree. You'll see `bin`, `etc`, `home`, `dev`, `proc` and a few more.
>
> **init:** `ls /bin`: the folder of programs. Each name in it is a program you can run. Most of them here are links to one small program, BusyBox, that does each job by the name you call it with.
>
> **init:** `cat /etc/motd`: the program `cat` shows what's in a file. `/etc/motd`, the message of the day, is my message to the city. `cat /etc/hostname` shows the Machine's name.
>
> **init:** `ls /dev`: the devices. `ttyS0` is the line your terminal is on. `null` swallows whatever is written to it, `zero` hands out zeros forever, and `random` hands out random bytes.
>
> **init:** `cat /proc/version`: and now the kernel itself. No file holds this text. The kernel writes it at the moment `cat` reads: its name, Linux, and its version.
>
> **init:** And if you get lost: `pwd` prints the folder you're in. It's another builtin.

## Watch it

> **init:** Before we go on: when you typed `cat /etc/motd`, who put my message on the screen? The shell, the program `cat`, or the kernel?

Three parts of the drawing light up, one after the other.

> **init:** All three, each doing one job. The shell started `cat`. `cat` asked for the file and passed its text on. And the kernel, the only part allowed to touch the storage and the terminal's device, did both for it. With `echo`, the shell did `cat`'s job itself; the kernel still delivered the text.
>
> **init:** And `cat /proc/version`? Same three, with one twist: there was no file to fetch. The kernel made the text up as `cat` asked for it.

On the outside of the Section drawing, one part lights and stays lit: `ttyS0`, the line your terminal is on.

## Debrief

> **init:** CPU, memory, storage, devices. An operating system that runs them for everyone. A kernel at its core that everyone must ask, and a tree of folders where `/dev` and `/proc` lead straight to it.
>
> **init:** You asked the kernel for something with every command just now, without seeing it. Next, in First Words, you switch on X-ray and watch the asking itself. Then you write your own first request, in C.

## Real world

On a Linux machine, or in a Mac's Terminal, which works the same for most of these:

```
ls /
cat /etc/hostname 2>/dev/null || hostname    # your computer's name
cat /proc/version                            # Linux only: the kernel's own words
ls /dev
```

On Windows, the Windows Subsystem for Linux (WSL) gives you a real Linux terminal.
