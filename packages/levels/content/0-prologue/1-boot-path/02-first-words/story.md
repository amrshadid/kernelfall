# First Words

## Scene

> **init:** You walked the Machine from `/` down to `/proc`, and every program you ran needed the Kernel: to show text, to read a folder, to open a file. Let's watch one of them ask.
>
> **The Watchdog:** Make it quick. I'm counting. (I'm always counting. That's my whole job.)
>
> **init:** Then we'll say the same thing ourselves, in C: your very own first request to the Kernel.

## See it

> **init:** Type `/bin/echo hello` in the terminal: the program file, not the shell's builtin `echo`, so there's a program to watch. Want to see what really happened? X-ray shows what happens inside the Machine; its syscalls view is yours now.

```
execve("/bin/echo", ["/bin/echo", "hello"], ...) = 0
write(1, "hello\n", 6)                           = 6
exit_group(0)                                    = ?
```

> **init:** Each line is one _syscall_: a request from a program to the Kernel. The name, then what was asked in brackets, then after the `=` the Kernel's answer.
>
> **init:** `execve` started the program `/bin/echo` with the words `/bin/echo` and `hello`. `write(1, "hello\n", 6)` asked the Kernel to show six bytes: `hello` and a newline, the invisible end-of-line character. The answer, `6`: all six taken. `exit_group(0)` said "I'm finished, all went well". No answer: the process is gone.
>
> **init:** The `1` is a _file descriptor_, a small number for something a process has open. Every program starts with three: 0 for what you type, 1 for its normal output, standard output, and 2 for error messages. Standard output leads to your terminal here, but it doesn't have to.
>
> **init:** Start a program, write, leave. Every program talks to the Kernel this way. There is no other door. Try `ls /bin` and `cat /etc/motd` with X-ray on.
>
> **init:** Now one request, slowly. Programs run in _user mode_: the CPU won't let them touch devices, other programs' memory or the Kernel's. To ask, a program runs one special instruction, `syscall`. The CPU switches to _kernel mode_ and jumps to one fixed place in the Kernel: the Syscall Gate. The Kernel does the work and the CPU drops back to user mode with the answer.
>
> **init:** You ask. The Kernel does. That's the whole arrangement.

Where "asking" stops being a good picture: the program doesn't wait in line or talk to anyone. Its own CPU switches mode and runs the Kernel's code right away, on its behalf.

## Build it

> **init:** Now say it in C. `hello.c` is source code; the compiler, clang, turns it into a program the CPU can run. Run builds it and runs `./hello` in my shell.
>
> **init:** Before you write anything, let's break it. Delete the `;` after `return 0` and press Run.

```
hello.c:19:10: error: expected ';' after return statement
   19 |         return 0
      |                 ^
      |                 ;
1 error generated.
```

> **init:** Read it part by part. `hello.c:19:10` is where: the file, line 19, column 10. `error:` is how bad: an error stops the build, so there is no `./hello` to run. A `warning:` lets the build finish; the Smith will teach you those. Then what the compiler expected, the line with a `^` under the spot, and the fix it suggests.
>
> **init:** Fix the first error first. Later ones are often caused by it. Put the `;` back and press Run.
>
> **init:** A clean build, and nothing printed: `main` says nothing yet. Write one call to `write()` that prints a line to standard output, ending in a newline, and return 0. The Kernel answers with how many bytes it took.

## Watch it

> **init:** Before you run it: which lane of X-ray will `./hello` light up? User mode only, kernel mode only, or both?

```
$ ./hello
hello, Machine
```

> **init:** Both. Your program runs in user mode, and its `write` dips into kernel mode and back.
>
> **The Watchdog:** A process that talks. Fine. I'll stop counting. For now.
>
> **init:** Now try `echo hi > note.txt`. In a full shell, `>` sends the output to a file instead of the terminal.
>
> **init:** `rescue: redirection not supported`. My shell can't even do that.

## Debrief

> **init:** The first lamp in Userland is lit above my house. Your line went the only way anything goes: through the Gate.
>
> **init:** The city needs a real shell, and one day you'll build one. You can't build what you've never used. So stop clicking my chips, and speak to mine yourself.

## Real world

Trace a command, then build and trace your own program on any Linux machine:

```
strace echo hello
cc -Wall -Wextra -o hello hello.c && strace ./hello
```

You'll see many more syscalls than in the game before your `write`: the dynamic loader maps shared libraries (`openat`, `mmap`, `mprotect` and friends). Build with `-static` and trace again for a shorter list. Delete a `;` and build again: gcc words the error differently ("expected ';' before '}' token") but uses the same `file:line:column: error:` shape.
