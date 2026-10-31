# First Words

## Scene

> **init:** You walked the Machine from `/` down to `/proc`, and every program you ran needed the kernel: to show text, to read a folder, to open a file. Tonight you watch one of them ask.
>
> **The Watchdog:** Make it quick. I'm counting. (I'm always counting. That's my whole job.)
>
> **init:** Then we'll say the same thing ourselves, in C: your very own first request to the kernel.

## See it

> **init:** Type `/bin/echo hello` in the terminal: the program file, not the shell's builtin `echo`, so there's a program to watch. Want to see what really happened? X-ray shows what happens inside the Machine, and its syscalls view is yours now.

```
execve("/bin/echo", ["/bin/echo", "hello"], ...) = 0
  … 17 more requests: the program getting ready
write(1, "hello\n", 6)                           = 6
exit_group(0)                                    = ?
```

> **init:** Each line is one _syscall_, short for system call: a request from a program to the kernel. The name, then what was asked in brackets, then after the `=` the kernel's answer.
>
> **init:** `execve` started the program `/bin/echo` with the words `/bin/echo` and `hello`. `write(1, "hello\n", 6)` asked the kernel to show six bytes: `hello` and a newline, written `\n`, the invisible end-of-line character. The answer, `6`: all six taken. `exit_group(0)` said "I'm finished, all went well". No answer: the process is gone.
>
> **init:** I folded seventeen lines away. X-ray shows them all: `brk` and `mprotect` setting up the program's memory, then `getuid` and `getgid` asking who you are, and `setgid(1000)` and `setuid(1000)` making sure BusyBox runs with your rights and no more. Every program does some of that before its real job.
>
> **init:** The `1` is a _file descriptor_, a small number for something a process has open. Every program starts with three: 0 for what you type, 1 for its normal output, called standard output, and 2 for error messages. Standard output leads to your terminal here, but it doesn't have to.
>
> **init:** Start a program, write, leave. Every program talks to the kernel this way. There is no other door. Try `ls /bin` and `cat /etc/motd` with X-ray on. You'll see a few new names, like `open`, `getdents64`, `writev` and `sendfile64`. The Survey explains them; for now, notice that they are all requests.
>
> **init:** Now one request, slowly. Programs run in _user mode_: the CPU won't let them touch devices, other programs' memory or the kernel's. To ask, a program runs one special instruction. The CPU switches to _kernel mode_ and jumps to one of two fixed places in the kernel: the Syscall Gate. The kernel does the work, and the CPU drops back to user mode with the answer.
>
> **init:** The Machine is a 32-bit PC, so its gate has two doors. The fast one is the instruction `sysenter`, which programs reach through a few bytes of code the kernel puts in every process. The old one is `int $0x80`, and it still works. A 64-bit PC, like most laptops today, uses an instruction called `syscall` instead. Same idea, different door.
>
> **init:** You ask. The kernel does. That's the whole arrangement.

Where "asking" stops being a good picture: the program doesn't wait in line or talk to anyone. Its own CPU switches mode and runs the kernel's code right away, on its behalf.

## Build it

> **init:** Now say it in C. `hello.c` is _source code_, the program as a person writes it. The _compiler_, gcc, turns it into a program file the CPU can run. Run builds it and runs `./hello`. The `./` means "the `hello` in this folder"; you'll see why it's needed next time.
>
> **init:** Before you write anything, let's break it. Delete the `;` after `return 0` and press Run.

```
hello.c: In function 'main':
hello.c:19:17: error: expected ';' before '}' token
   19 |         return 0
      |                 ^
      |                 ;
   20 | }
      | ~
```

> **init:** Read it part by part. `hello.c:19:17` is where: the file, line 19, column 17. The tab at the start of the line counts as eight columns, so column 17 is just after the `0`.
>
> **init:** `error:` is how bad: an error stops the build, so there is no `./hello` to run. A `warning:` lets the build finish; the Smith will teach you those.
>
> **init:** Then what the compiler expected: a `;` before the `}`. It only noticed the missing `;` when it reached the `}` on line 20, which it marks with `~`. But the `^` points where the `;` belongs, and under it is the fix it suggests.
>
> **init:** Fix the first error first. Later ones are often caused by it. Put the `;` back and press Run.
>
> **init:** A clean build, and nothing printed: `main` says nothing yet. Write one call to `write()` that prints a line to standard output, ending in a newline, and return 0. The kernel answers with how many bytes it took.

If you'd rather use `printf`, that works too: it's a _library function_, ready-made code that comes with C. It collects your text and hands it to the kernel for you. X-ray will show `writev`, write's sibling that takes the text in pieces.

## Watch it

> **init:** Before you run it: which lane of X-ray will `./hello` light up? User mode only, kernel mode only, or both?

```
$ ./hello
hello, Machine
```

```
execve("./hello", ["./hello"], ...) = 0
  … 7 more requests: the program getting ready
write(1, "hello, Machine\n", 15)    = 15
exit_group(0)                       = ?
```

> **init:** Both. Your program runs in user mode, and its `write` dips into kernel mode and back.
>
> **The Watchdog:** A process that talks. Fine. I'll stop counting. For now.

## Debrief

> **init:** The first lamp in Userland is lit above my house. Your line went the only way anything goes: through the Gate.
>
> **init:** One day you'll build a shell of your own. You can't build what you've never used, so put my chips away. Next, in Speak to the Shell, you talk to bash yourself, every word.

## Real world

Trace a command, then build and trace your own program on any Linux machine:

```
strace echo hello
gcc -Wall -Wextra -o hello hello.c && strace ./hello
```

On most laptops you'll see more requests before your `write` than on the Machine: their C library, glibc, has a separate loader that opens and maps `libc.so.6` (`openat`, `mmap`, `mprotect` and friends). The Machine's musl is its own loader, so it opens nothing. Build with `-static` and trace again for a shorter list. Delete a `;` and build with clang: it words the error differently ("expected ';' after return statement") but uses the same `file:line:column: error:` shape.
