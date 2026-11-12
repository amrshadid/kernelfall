# First Words

**Question:** How does a program ask the kernel for something?

## Scene

> **init:** In Power On, `cat` could not read my note on its own. It asked the kernel, and the request crossed the Gate. Tonight you watch a program ask, one request at a time.
>
> **The Watchdog:** Make it quick. I'm counting.
>
> **init:** Then you ask the kernel yourself, with your first program: a few lines of C, the language Linux itself is written in.

## See it

> **init:** Type `/bin/echo hello` in the terminal. X-ray lists every request that program made to the kernel.

---

```
execve("/bin/echo", ["/bin/echo", "hello"], ...) = 0
  … 17 more requests: the program getting ready
write(1, "hello\n", 6)                           = 6
exit_group(0)                                    = ?
```

> **init:** Each line is one _syscall_, short for system call: a request from a program to the kernel. First its name, then what was asked, then after the `=` the kernel's answer.
>
> **init:** `execve` started the program. `write(1, "hello\n", 6)` asked the kernel to show six bytes, one for each character: `hello` and `\n`, the character that ends a line. The answer is `6`: all six were taken. `exit_group(0)` said the program was finished, and its `0` means all went well. It gets no answer, because the process is gone.
>
> **init:** The `1` is a _file descriptor_: a small number for something a process has open. Every program starts with three. 0 is what you type, 1 is its output, 2 is its error messages. Here, 1 leads to your terminal.
>
> **init:** Why ask at all? The CPU runs programs in _user mode_, where it won't let them touch a device or the kernel's memory. A syscall switches the CPU to _kernel mode_ at the Gate. The kernel does the work, and the CPU switches back with the answer.

## Build it

> **init:** Now ask in C. `hello.c` is a program as a person writes it. The compiler, gcc, turns it into a file the CPU can run, and Run builds it and starts it. `main` is where a C program begins, each step in it ends with `;`, and text goes between double quotes.
>
> **init:** Before you write anything, break it. Delete the `;` after `return 0` and press Run.

---

```
hello.c: In function 'main':
hello.c:19:17: error: expected ';' before '}' token
   19 |         return 0
      |                 ^
      |                 ;
   20 | }
      | ~
```

> **init:** `hello.c:19:17` is where: the file, the line, the column. `error:` means the build stopped, so there is no program to run. The `^` points at the place, and under it is the fix gcc suggests. Put the `;` back and press Run.

---

> **init:** A clean build, and nothing printed: `main` says nothing yet. Above `return 0`, add one line: a `write` that sends a line of text to file descriptor 1. End the text with `\n`.

## Watch it

> **init:** Before you run it: where does the work for `./hello` get done?
>
> - in Userland only
> - in the kernel only
> - [x] on both sides of the Gate

---

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

> **init:** Both. Your code runs in Userland, in user mode. Its `write` crosses the Gate, runs in the kernel, and comes back with the bytes the kernel took: `15` for this line. You never wrote `exit_group`. Returning from `main` made that request for you.
>
> **init:** Seven requests got your program ready, where `/bin/echo` needed seventeen: it had more to set up before its one `write`.
>
> **The Watchdog:** A process that talks. Fine. I'll stop counting. For now.

## Debrief

> **init:** That is how a program asks: a syscall, through the Gate, and the kernel's answer back. So far I chose every command. In Speak to the Shell you choose the words yourself, and see how the shell finds the program you name.

## Real world

Trace a command, then build and trace your own program on a Linux machine:

```
strace echo hello
gcc -Wall -Wextra -o hello hello.c && strace ./hello
```

On most laptops you'll see more requests before your `write` than on the Machine. Their C library, glibc, has a separate loader that opens and maps `libc.so.6`, with `openat`, `mmap` and `mprotect`. The Machine's C library, musl, is its own loader, so it opens nothing. Build with `-static` and trace again for a shorter list.
