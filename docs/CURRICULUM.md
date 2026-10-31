# Kernelfall curriculum

What a player learns in Kernelfall v1.0. This file is the **source of truth for the
skill tree**: level files use the skill ids below in their `skills` and
`prerequisites` fields, and `packages/levels/content/skills.yaml` follows it. Kernel facts follow
Linux 6.18 (LTS).

## 1. Who it's for and the promise

### Entry assumptions

A player starting Kernelfall can:

- program a little in at least one language (variables, loops, functions);
- read English technical text.

A player does **not** need to know what an operating system, a kernel, a process, a
file or a terminal really is: the Prologue starts there, with every word explained
the first time it appears. Nor do they need the terminal, C, Linux internals or
operating-systems theory: the Surface Survey teaches the shell, and Act I levels
1.0–1.3 teach the C they need. Players who already know a part can skip it with a
placement check (P.5–P.9, the Survey, 1.0–1.3).

### The promise

After v1.0 (the Prologue, the Surface Survey and Acts I, II and III) a player can
honestly say:

> **"I can write, debug and explain a Linux driver, I understand how a program
> talks to the kernel, and I can explain how Linux runs the whole machine, from
> power-on to a packet, and find out why it stopped."**

The promise has four verbs. Every skill below serves at least one of them.

| Verb           | What it means in practice                                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Write**      | Build, load and unload a char driver with `read`, `write`, `ioctl`, `mmap` and a sysfs attribute, with correct error paths and locking; write a platform driver, a PCI driver, a tiny filesystem and a NAPI network driver. |
| **Debug**      | Read an oops, a KASAN, lockdep, kmemleak or KCSAN report, a soft lockup or RCU stall warning, and a crash dump, and turn each into a fix.                                                                                   |
| **Explain**    | Trace a `read()` from a C program, through the syscall entry and the VFS, into the driver and back; follow the boot from firmware to PID 1 and a packet from the wire to a socket, naming the real functions.               |
| **Understand** | Describe the user/kernel boundary (privilege, separate address spaces, syscalls, errno, why the kernel never trusts a user pointer), and how the kernel shares CPUs, memory and devices.                                    |

### Honest limits

- Kernelfall runs a real Linux kernel on an emulated 32-bit PC with one CPU. A skill
  only counts as learned when it also works on the player's own Linux machine, which
  is why each act ends with a task there ([section 3](#3-take-it-home-tasks)).
- The game's own hardware (the lighthouse board and the Lantern card) exists only in
  the game, so T3 checks the same skills on QEMU's devices (`edu`, `virtio`).

## 2. Skills

102 skills in nine competency areas. Each skill is an **observable outcome**:
something a player does that a checker or a Predict beat can verify. The **Name** is
what the Kernel Map shows; **Needs** lists its prerequisites; **Level** is where it
is taught. Skills marked † come from an optional side level, and no required level
needs them.

| Part           | Skills |
| -------------- | ------ |
| Prologue       | 11     |
| Surface Survey | 5      |
| Act I          | 20     |
| Act II         | 37     |
| Act III        | 29     |

Rules for changing the list:

- Add a skill only with a level that teaches it.
- Never rename an id that has shipped; players' saves reference it. Deprecate it instead.
- Ids are kebab-case with an area prefix: `c-`, `sys-`, `proc-`, `io-`, `net-`,
  `mem-`, `sync-`, `irq-`, `drv-`, `dbg-`, `kdev-`.

### Area 1: C for systems work (`c`)

The kernel is written in C with heavy use of pointers, structs of function pointers
and embedded structs. Most kernel bugs are C memory bugs.

| Id                  | Name                         | The player can…                                                                                                         | Needs                             | Level |
| ------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----- |
| `c-strings-arrays`  | Strings and arrays           | use arrays and NUL-terminated strings, tell `sizeof` from `strlen`, never write past a buffer, and read a compile error | `sys-shell-basics`                | 1.0   |
| `c-pointers-memory` | Pointers and the heap        | write C that uses pointers, arrays and `malloc`/`free` correctly, and explain stack vs heap lifetime                    | `c-strings-arrays`                | 1.1   |
| `c-structs-fnptrs`  | Structs of function pointers | write a struct of function pointers and dispatch through it (the pattern behind `file_operations`)                      | `c-pointers-memory`               | 1.2   |
| `c-build-warnings`  | Build clean                  | build with a Makefile and `-Wall -Wextra`, and fix every warning instead of ignoring it                                 | `c-pointers-memory`               | 1.3   |
| `c-bit-flags`       | Bits and flags               | set, test and clear bits with masks, and decode flag words like `O_RDONLY \| O_CREAT` or an `_IOW()` ioctl number       | `c-pointers-memory`               | 1.6   |
| `c-container-of`    | From member to container     | explain how `container_of` finds the outer struct from a pointer to an embedded member, and use it                      | `c-structs-fnptrs`, `mem-kmalloc` | 2.8b  |

### Area 2: The system: boot, processes, scheduling and the syscall boundary (`userland`, `kernel`)

The kernel exists to serve processes. This is the "how a program talks to the
kernel" half of the promise, and the "how Linux runs the whole machine" half.

| Id                      | Name                             | The player can…                                                                                                                                                                                                       | Needs                                           | Level |
| ----------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----- |
| `sys-computer-basics`   | What a computer is               | name a computer's parts (CPU, memory, storage, devices), say what an operating system does and what its kernel is, and tell a program from a process                                                                  | —                                               | P.1   |
| `sys-user-kernel-mode`  | Two worlds: user and kernel mode | explain user mode vs kernel mode, why a process can't touch hardware or kernel memory, and that a syscall is how a process asks the kernel for anything                                                               | `sys-computer-basics`                           | P.2   |
| `sys-shell-basics`      | Speak to the shell               | say what the prompt, a command, arguments and options are; find help with `man`; complete names with Tab; read the environment; explain `PATH`                                                                        | `sys-user-kernel-mode`                          | P.3   |
| `sys-boot-chain`        | Boot the Machine                 | describe the boot chain (firmware, bootloader, kernel, initcalls, initramfs, root, PID 1), choose a boot entry and change the kernel command line                                                                     | `sys-shell-basics`                              | P.4   |
| `sys-kernel-role`       | What the kernel does             | say what a kernel owns and why programs must ask it; explain monolithic with modules, kernel vs distribution, and mainline, stable and LTS                                                                            | `sys-user-kernel-mode`                          | P.5   |
| `proc-process-basics`   | Who runs                         | list processes and kernel threads, read a process's PID, parent and state in `/proc`, and say how the scheduler shares the CPUs                                                                                       | `sys-kernel-role`                               | P.7   |
| `sys-kernel-subsystems` | The kernel's parts               | name the kernel's major parts, the source folder of each, a command that shows it, and the map region that teaches it                                                                                                 | `io-everything-is-a-file`                       | P.9   |
| `sys-command-lifecycle` | Bring the Machine up             | trace one command from the shell through the kernel's parts to the hardware and back, and troubleshoot a boot from its messages                                                                                       | `sys-kernel-subsystems`, `sys-boot-chain`       | P.10  |
| `proc-observe`          | Processes from outside           | find a process with `ps` and `/proc`, read its state and parent, and stop, pause, resume or end it with `kill`                                                                                                        | `io-permissions`, `proc-process-basics`         | S.3   |
| `sys-text-tools`        | Counting and sorting             | count, search, slice, sort and de-duplicate lines in files with `wc`, `grep`, `head`, `tail`, `sort` and `uniq`                                                                                                       | `sys-shell-basics`                              | S.5   |
| `proc-lifecycle`        | fork, exec, wait                 | write `fork`/`exec`/`wait` code, predict what parent and child print, and explain zombies and orphans                                                                                                                 | `c-pointers-memory`, `sys-user-kernel-mode`     | 1.4   |
| `sys-errno`             | Errors and errno                 | check every syscall's return value, read `errno`, and explain common codes (`ENOENT`, `EACCES`, `EINTR`, `EFAULT`, `EAGAIN`)                                                                                          | `proc-lifecycle`                                | 1.4   |
| `proc-state-procfs`     | Read a process in /proc          | read a process's state, parent, cwd, environment and fds from `/proc/<pid>`, and say which kernel structure (`task_struct`) holds them                                                                                | `proc-lifecycle`, `io-fs-hierarchy`             | 1.5   |
| `proc-signals`          | Signals                          | install a handler with `sigaction`, explain default actions, and explain why a handler may only call async-signal-safe functions                                                                                      | `proc-lifecycle`                                | 1.8   |
| `sys-syscall-path`      | Through the Syscall Gate         | trace a libc call to the kernel and back: wrapper, syscall number, registers, the instruction that enters the kernel, the syscall table, the handler, and the return value (negative errno becomes `-1` plus `errno`) | `dbg-strace`, `sys-errno`, `io-pipes`           | 1.B   |
| `sys-boot-firmware`     | Power-on to kernel               | explain BIOS vs UEFI boot (MBR vs EFI system partition, Secure Boot's shim), what the bootloader loads and hands over, and how an x86 kernel image reaches `start_kernel()`                                           | `sys-boot-chain`, `kdev-config-build`           | 3.1   |
| `sys-kernel-cmdline`    | Speak to the kernel at boot      | say how the kernel parses its command line (early params, `__setup`, `module.param=`, unknown words passed to init), set parameters for one boot or for good, and reserve crash memory                                | `sys-boot-firmware`, `drv-module-params`        | 3.1   |
| `sys-early-boot`        | Before PID 1                     | follow `start_kernel()` to `rest_init()`, say what PID 0, 1 and 2 become, explain initcall levels and find a built-in driver's initcall with `initcall_debug`                                                         | `sys-kernel-cmdline`, `drv-module-lifecycle`    | 3.2   |
| `sys-initramfs`         | Your own /init                   | write an initramfs `/init` that mounts `/proc`, `/sys` and `/dev`, mounts the real root and hands over with a switch-root, and explain why PID 1 must never exit                                                      | `sys-early-boot`, `proc-lifecycle`, `sys-errno` | 3.2   |
| `proc-threads`          | Threads                          | write a program with pthreads (create, join, mutex, condition variable), explain that a thread is a task sharing an `mm`, and how a contended mutex sleeps in `futex`                                                 | `proc-lifecycle`, `sync-mutex`, `net-poll`      | 3.6   |
| `proc-scheduler`        | How the Judge picks              | explain EEVDF (weights from nice, lag, eligibility, virtual deadlines), predict CPU shares from nice values, and read a task's scheduler statistics                                                                   | `proc-threads`, `proc-process-basics`           | 3.7   |
| `proc-kthreads`         | Kernel threads                   | run kernel work in a kthread that sleeps, wakes and stops cleanly with `kthread_stop()` before its data is freed                                                                                                      | `proc-scheduler`, `irq-wait-queues`             | 3.8   |

### Area 3: Files, I/O and networking (`userland`, `net`)

"Everything is a file" is the interface a char driver plugs into. A driver's `read`
must follow the same contract that `cat` relies on. Sockets are file descriptors too.

| Id                        | Name                     | The player can…                                                                                                                                                                   | Needs                                                             | Level |
| ------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----- |
| `io-everything-is-a-file` | Everything is a file     | explain how the VFS gives disk files, `/proc`, `/sys` and devices one `open`/`read`/`write` interface                                                                             | `drv-hardware-discovery`                                          | P.9   |
| `io-fs-hierarchy`         | The streets of Userland  | move around the tree with absolute and relative paths, and create, copy, move, rename and remove files and folders                                                                | `sys-shell-basics`                                                | S.1   |
| `io-permissions`          | Who may enter            | read an `ls -l` mode string, explain uids, groups and root, and say how the kernel's permission check picks owner, group or other and answers `EACCES` (and when `EPERM` instead) | `io-fs-hierarchy`                                                 | S.2   |
| `io-find-files`           | Finding things           | find files by name, type and owner with `find`, and tell normal output from error messages (standard error)                                                                       | `io-fs-hierarchy`                                                 | S.4   |
| `io-fd-table`             | File descriptors         | explain the chain fd → `struct file` → inode, and what `fork` and `exec` do to the fd table                                                                                       | `proc-lifecycle`, `io-permissions`                                | 1.6   |
| `io-read-contract`        | The read/write contract  | explain the `read`/`write` contract: short reads and writes, `0` means end of file, file position, blocking                                                                       | `io-fd-table`                                                     | 1.6   |
| `io-redirect-dup`         | Redirection              | implement `>` and `<` with `open` and `dup2`                                                                                                                                      | `io-fd-table`                                                     | 1.6   |
| `io-pipes`                | Pipes                    | implement pipelines with `pipe`, and explain why a reader only sees EOF after every write end is closed                                                                           | `io-redirect-dup`                                                 | 1.7   |
| `net-sockets`             | Sockets                  | write a TCP server and client, and explain the difference between TCP and UDP                                                                                                     | `io-fd-table`                                                     | 1.9   |
| `net-stack-path`          | A packet's journey       | describe a packet's path: socket, TCP/UDP, IP, netfilter hooks, network device                                                                                                    | `net-sockets`                                                     | 1.9   |
| `net-poll`                | Many clients with poll   | serve many clients with `poll`, and explain readiness vs blocking                                                                                                                 | `net-sockets`                                                     | 1.10  |
| `net-netfilter-hook`      | Netfilter hooks          | write a kernel module that registers a netfilter hook and counts packets safely on many CPUs                                                                                      | `net-poll`, `net-stack-path`, `sync-atomics`, `drv-module-params` | 2.11  |
| `io-vfs-filesystem`       | A filesystem of your own | explain the VFS objects (superblock, inode, dentry, file) and the dentry cache, and write a tiny filesystem that mounts, lists and reads files                                    | `io-everything-is-a-file`, `drv-fops`, `sync-rcu`                 | 3.16  |
| `io-page-cache` †         | The page cache, deep     | explain page cache hits and misses, readahead, dirty pages and writeback, and predict when a `read()` touches the disk                                                            | `io-vfs-filesystem`, `mem-page-faults`                            | 3.17  |
| `io-block-layer` †        | A block driver           | write a blk-mq block driver and follow a `read()` from the page cache to a `bio`, a request and the driver's `queue_rq()`                                                         | `io-page-cache`, `drv-error-unwinding`                            | 3.17  |
| `net-napi`                | A network driver         | write a network driver's receive path: a `net_device`, `sk_buff`s built from a ring, and a NAPI poll that respects its budget                                                     | `drv-pci`, `irq-deferred-work`, `net-netfilter-hook`              | 3.18  |
| `net-xdp` †               | XDP                      | write and attach an XDP program that parses headers within bounds and drops traffic before an `sk_buff` exists                                                                    | `net-napi`, `dbg-ebpf`                                            | 3.19  |

### Area 4: Memory (`kernel`)

Memory bugs (leaks, use-after-free, bad user pointers) are the most common and most
dangerous kernel bugs. The villain of Act II is one.

| Id                          | Name                             | The player can…                                                                                                                                                          | Needs                                                            | Level                         |
| --------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ----------------------------- |
| `mem-virtual-memory-basics` | Pages and maps                   | explain physical vs virtual memory, pages and page tables, read `/proc/meminfo` and `/proc/<pid>/maps`, and say what the page cache is                                   | `proc-process-basics`                                            | P.8                           |
| `mem-address-spaces`        | Every process has its own memory | explain that each process has its own virtual address space, read `/proc/<pid>/maps`, and say why the same address in parent and child after `fork` holds different data | `proc-lifecycle`, `mem-virtual-memory-basics`                    | 2.5 (explained in 1.4)        |
| `mem-user-copy`             | Crossing the boundary safely     | move data across the boundary with `copy_to_user`/`copy_from_user`, handle a partial copy with `-EFAULT`, and explain why a user pointer is never dereferenced directly  | `mem-address-spaces`, `drv-chardev-register`                     | 2.5                           |
| `mem-kmalloc`               | Kernel allocation                | allocate and free kernel memory with `kmalloc`/`kzalloc`/`kfree`, and choose `GFP_KERNEL` or `GFP_ATOMIC` from the calling context                                       | `drv-fops`                                                       | 2.8a (2.10a for `GFP_ATOMIC`) |
| `mem-leak-kmemleak`         | Find a leak                      | find and fix a kernel memory leak from a kmemleak report                                                                                                                 | `mem-kmalloc`                                                    | 2.8a                          |
| `mem-object-lifetime`       | Who frees this?                  | explain who owns an object and when it may be freed, and use a reference count (`refcount_t` or `kref`) or ordered teardown to make it safe                              | `mem-kmalloc`                                                    | 2.8b                          |
| `mem-uaf-fix`               | Defeat the Dangling              | find a use-after-free whose pointer outlives its object in deferred work, and fix it by stopping that work before the free or giving it its own reference                | `dbg-kasan`, `mem-object-lifetime`, `irq-timers`                 | 2.12                          |
| `mem-page-tables`           | The four-level walk              | translate a virtual address by hand through x86-64's page tables, decode PTE flags and `/proc/<pid>/pagemap`, and explain what the TLB caches                            | `mem-address-spaces`, `mem-virtual-memory-basics`, `c-bit-flags` | 3.3                           |
| `mem-page-faults`           | Faults on purpose                | explain demand paging, minor and major faults, the zero page and copy-on-write after `fork`, follow a fault to `handle_mm_fault()`, and count faults                     | `mem-page-tables`, `proc-lifecycle`                              | 3.4                           |
| `mem-mmap`                  | Mapping memory                   | explain VMAs and `mmap` (private or shared, file or anonymous), and implement a driver `mmap` with a fault handler                                                       | `mem-page-faults`, `drv-fops`, `mem-object-lifetime`             | 3.5                           |

### Area 5: Concurrency and synchronization (`kernel`)

The kernel runs on many CPUs at once (the Machine has one, shared in time slices)
and can be interrupted at almost any point. A driver that works for one user and
breaks for two is the most common broken driver.

| Id                      | Name                      | The player can…                                                                                                                                                             | Needs                                         | Level |
| ----------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----- |
| `sync-interleaving`     | Interrupted at any moment | explain how two processes (or a process and a signal handler) can interleave between any two instructions, and why that breaks shared state                                 | `proc-signals`                                | 1.8   |
| `sync-race-diagnosis`   | Spot a race               | find a read-modify-write race in driver code from its symptoms and an X-ray interleaving                                                                                    | `sync-interleaving`, `drv-fops`               | 2.9   |
| `sync-mutex`            | Mutexes                   | protect shared driver state with a mutex in process context, using the interruptible lock and returning `-ERESTARTSYS` or `-EINTR` correctly                                | `sync-race-diagnosis`                         | 2.9   |
| `sync-deadlock-lockdep` | Defeat the Deadlock Twins | read a lockdep "possible circular locking dependency" report and fix an ABBA deadlock with a lock ordering rule                                                             | `sync-mutex`, `dbg-lockdep`                   | 2.9b  |
| `sync-atomic-context`   | Code that must not sleep  | explain atomic context (interrupt, softirq, timer callback, spinlock held), why code there must not sleep, and what to use instead (`GFP_ATOMIC`, no mutex)                 | `irq-timers`, `sync-mutex`                    | 2.10a |
| `sync-spinlocks`        | Spinlocks                 | protect data shared with an interrupt handler with a spinlock, and pick the variant (`spin_lock_irqsave`, `_bh`) from who else takes it                                     | `sync-atomic-context`, `dbg-lockdep`          | 2.10b |
| `sync-atomics`          | Atomic counters           | use `atomic_t`/`atomic64_t` (or per-CPU counters) for a simple shared counter instead of a lock                                                                             | `sync-spinlocks`                              | 2.11  |
| `sync-memory-ordering`  | Memory ordering           | explain why compilers and CPUs reorder memory accesses, pass data without a lock with `READ_ONCE`/`WRITE_ONCE` and acquire/release, and say what x86 hides that arm64 shows | `sync-atomics`, `proc-threads`                | 3.12  |
| `sync-rcu`              | RCU                       | convert a read-mostly list to RCU (readers under `rcu_read_lock()`, writers under a lock, frees after a grace period), and read an RCU stall warning                        | `sync-memory-ordering`, `mem-object-lifetime` | 3.13  |
| `sync-wakeup-fix`       | No lost wake-ups          | fix a lost wake-up by replacing a hand-written check-then-sleep with `wait_event()` or a `completion`, and say why the order of "set state" and "check" matters             | `dbg-kdump-crash`, `irq-wait-queues`          | 3.21  |

### Area 6: Time, interrupts and deferred work (`kernel`)

Devices talk to the kernel through interrupts, and drivers do most real work later,
in timers and workqueues. The context code runs in decides which APIs are allowed.

| Id                  | Name                         | The player can…                                                                                                         | Needs                                                       | Level |
| ------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----- |
| `irq-timers`        | Timers                       | run periodic work with a `timer_list` and `jiffies`, and stop it safely before the data it uses is freed                | `drv-fops`, `mem-kmalloc`, `c-container-of`                 | 2.10a |
| `irq-handlers`      | Interrupt handlers           | register an interrupt handler with `request_irq`, keep it short, and return `IRQ_HANDLED` or `IRQ_NONE`                 | `sync-atomic-context`                                       | 2.10b |
| `irq-deferred-work` | Workqueues and bottom halves | move slow work from an interrupt handler to a workqueue, and explain top half vs bottom half and where `ksoftirqd` fits | `irq-handlers`                                              | 2.10b |
| `irq-wait-queues`   | Sleep until there's data     | make a `read` sleep until data arrives with a wait queue, and wake it from the producer                                 | `irq-deferred-work`, `io-pipes`, `net-poll`, `proc-signals` | 2.10c |

### Area 7: Modules, devices and drivers (`kernel`)

The "write a driver" half of the promise.

| Id                       | Name                        | The player can…                                                                                                                                                                   | Needs                                                           | Level |
| ------------------------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----- |
| `drv-hardware-discovery` | Finding the hardware        | say how Linux finds hardware (ACPI and PCI on x86, a device tree on most ARM and RISC-V boards), read a device in `/sys`, and explain driver binding                              | `sys-kernel-role`                                               | P.6   |
| `drv-kernel-env`         | Life inside the kernel      | explain how kernel code differs from user code: no libc, `printk` not `printf`, a small fixed stack, errors as negative errno, a bug can take down the machine                    | `kdev-config-build`                                             | 2.2   |
| `drv-module-lifecycle`   | Your first module           | write, build (Kbuild), load and unload a module with `module_init`/`module_exit` and `MODULE_LICENSE`                                                                             | `drv-kernel-env`                                                | 2.2   |
| `drv-module-params`      | Module parameters           | add module parameters and inspect them with `modinfo` and `/sys/module/<name>/parameters`                                                                                         | `drv-module-lifecycle`                                          | 2.3   |
| `drv-chardev-register`   | A device node               | register a char device (`alloc_chrdev_region`, `cdev_add`, a class and device so `/dev/<name>` appears) and explain major and minor numbers                                       | `drv-module-lifecycle`, `io-fd-table`, `io-permissions`         | 2.4   |
| `drv-error-unwinding`    | Clean up on failure         | write `goto`-based cleanup so every failure path releases what was acquired, in reverse order, and returns the right negative errno                                               | `drv-chardev-register`, `sys-errno`                             | 2.4   |
| `drv-fops`               | file_operations             | implement `open`, `release`, `read` and `write` in a `file_operations`, keeping per-open state in `file->private_data` and honoring `*ppos`                                       | `c-structs-fnptrs`, `io-read-contract`, `mem-user-copy`         | 2.5   |
| `drv-read-path`          | From read() to your driver  | trace a user `read()` on `/dev/lantern` through `vfs_read()` to the driver's read function and back, naming each step                                                             | `drv-fops`, `sys-syscall-path`                                  | 2.5   |
| `drv-ioctl`              | ioctl commands              | define ioctl commands with `_IO`/`_IOR`/`_IOW`, validate arguments, and return `-ENOTTY` for unknown commands                                                                     | `drv-fops`, `c-bit-flags`                                       | 2.6   |
| `drv-sysfs-procfs`       | Status pages                | expose a value through a sysfs attribute (`show`/`store`), and choose between sysfs, procfs and debugfs for a given need                                                          | `drv-fops`                                                      | 2.7   |
| `drv-platform-dt`        | A driver from a device tree | write a platform driver that binds through a `compatible` string, takes its registers and IRQ with `devm_` helpers, uses a subsystem class, and say how ACPI does the same on x86 | `drv-hardware-discovery`, `irq-handlers`, `drv-error-unwinding` | 3.14  |
| `drv-pci`                | A PCI driver                | write a PCI driver: ID table, `probe`/`remove`, map a BAR, read and write registers, use an MSI interrupt, and move a device from one driver to another                           | `drv-platform-dt`, `mem-page-tables`                            | 3.15  |

### Area 8: Debugging and tooling (`debug`)

Kernel developers spend more time reading reports than writing new code. A crash is
information, not a failure.

| Id                    | Name                | The player can…                                                                                                                        | Needs                                                          | Level |
| --------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----- |
| `dbg-gdb-sanitizers`  | gdb and sanitizers  | find a user-space memory bug with AddressSanitizer (and, optionally, gdb: breakpoint, backtrace, inspect)                              | `c-build-warnings`                                             | 1.3   |
| `dbg-strace`          | Watch the syscalls  | use `strace` to list the syscalls a program makes, and diagnose a failure (for example a missing file) from the trace                  | `proc-lifecycle`                                               | 1.5   |
| `dbg-printk-dmesg`    | printk and dmesg    | log with `pr_info`/`pr_err` and the right log level, and read `dmesg`                                                                  | `drv-module-lifecycle`                                         | 2.2   |
| `dbg-oops-reading`    | Read an oops        | read an oops: the fault type, the faulting function and offset, the call trace and the taint flags, and map it to a source line        | `dbg-printk-dmesg`                                             | 2.2   |
| `dbg-kasan`           | Read a KASAN report | read a KASAN report (bad access, allocation stack, free stack) and name the root cause of a use-after-free or out-of-bounds bug        | `dbg-oops-reading`, `mem-kmalloc`                              | 2.8b  |
| `dbg-lockdep`         | Read lockdep        | run a lockdep-enabled kernel and read its reports (a lock held on return to user space, a bad unlock), and say what lockdep proves     | `kdev-config-build`, `drv-fops`                                | 2.9   |
| `dbg-lockups`         | Lockups             | explain the preemption models and why kernel code must reach the scheduler, read a soft lockup report, and fix a loop that hogs a CPU  | `proc-kthreads`, `sync-spinlocks`                              | 3.8   |
| `dbg-ftrace`          | ftrace              | trace the kernel through tracefs: the function and function_graph tracers, filters, and trace events                                   | `dbg-printk-dmesg`, `drv-read-path`                            | 3.9   |
| `dbg-tracepoints`     | Your own tracepoint | add a tracepoint to a driver with `TRACE_EVENT()` and read it in the trace buffer                                                      | `dbg-ftrace`                                                   | 3.9   |
| `dbg-perf` †          | perf                | count events with `perf_event_open(2)` and `perf stat`, and find a hot spot with a sampling profile (`perf record`, `perf report`)     | `dbg-ftrace`, `proc-scheduler`                                 | 3.10  |
| `dbg-ebpf`            | eBPF                | write a small eBPF program with a map, attach it to a tracepoint, read the map from user space, and fix a program the verifier rejects | `dbg-tracepoints`, `c-pointers-memory`                         | 3.11  |
| `dbg-kcsan`           | Read a KCSAN report | read a KCSAN data-race report (the two accesses, their contexts) and decide whether the race needs a fix or an annotation              | `sync-memory-ordering`, `dbg-kasan`                            | 3.12  |
| `dbg-stall-diagnosis` | Defeat the Stall    | diagnose a CPU stall from soft lockup and RCU stall reports with ftrace and BPF (and perf, if learned), and fix its cause              | `dbg-lockups`, `sync-rcu`, `dbg-ebpf`, `net-napi`              | 3.20  |
| `dbg-kdump-crash`     | Read a dead Machine | set up kdump, capture a vmcore, and find a hang's cause in it with `crash` (`log`, `ps`, `bt`, `struct`, `vtop`)                       | `sys-kernel-cmdline`, `dbg-stall-diagnosis`, `mem-page-tables` | 3.21  |

### Area 9: The kernel codebase, build and community (`kernel`)

The kernel is a project of more than 30 million lines with its own build system,
rules and review culture.

| Id                  | Name                   | The player can…                                                                                                                                  | Needs                                   | Level             |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ----------------- |
| `kdev-config-build` | Build your own kernel  | configure a kernel (Kconfig), turn on debug options such as KASAN and lockdep, build it with kbuild and boot it                                  | `c-build-warnings`, `sys-boot-chain`    | 2.1               |
| `kdev-read-source`  | Read the kernel source | find a definition in the kernel tree (Elixir or `git grep`), read it, and find the matching page on docs.kernel.org                              | `kdev-config-build`                     | 2.1               |
| `kdev-abi-vs-api`   | Stable ABI, moving API | explain why the syscall interface to user space is stable ("don't break user space") but the in-kernel API is not                                | `sys-syscall-path`                      | 2.1               |
| `kdev-coding-style` | Kernel coding style    | write code that follows the kernel coding style and passes `checkpatch.pl`                                                                       | `drv-module-lifecycle`                  | 2.2 (Taint), 2.13 |
| `kdev-patch`        | Send a patch           | write an upstream-style patch: a commit message that says what and why, a `Signed-off-by` line, `git format-patch`, and `get_maintainer.pl`      | `kdev-coding-style`, `kdev-read-source` | 2.13              |
| `kdev-dev-process`  | How mainline works     | describe how a change reaches mainline: mailing-list review, maintainers, the merge window, release candidates, stable and LTS                   | `kdev-patch`                            | 2.13              |
| `kdev-kunit`        | Tests that stay        | write KUnit tests for driver logic with a fake device behind an ops table, run them with `kunit.py`, and send fixes as a series with their tests | `kdev-patch`, `c-structs-fnptrs`        | 3.22              |

## 3. Take it home tasks

Each act ends with an optional quest on a real machine. The game gives a kit (the
player's own code, a `Makefile`, a test script and the success criteria) and a Codex
badge as the reward. Nothing is locked behind it.

Do Acts II and III's tasks in a virtual machine, never on a computer you depend on:
a buggy module can crash or corrupt a running kernel, and on some distributions
Secure Boot blocks unsigned modules.

**T1: Act I, "Your shell on a real machine"** (any Linux, including WSL2; macOS lacks
`strace` and `/proc`):

| #   | Task                                       | Success criteria                                                                  |
| --- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| 1   | Build `ksh-lite` with the system compiler  | `make` with `-Wall -Wextra` gives zero warnings                                   |
| 2   | Run `ls \| grep c > out.txt` in your shell | Same output as bash; no zombie processes left (`ps`)                              |
| 3   | Run the kit's test under AddressSanitizer  | No ASan or leak reports                                                           |
| 4   | `strace -f` your shell running a pipeline  | Say which `pipe`, `fork`, `dup2`, `execve`, `wait4` calls belong to which command |
| 5   | Inspect a running child in `/proc/<pid>`   | Name its state, its parent and where fd 1 points                                  |

**T2: Act II, "The Lantern on a real kernel"** (a VM running a 6.18 kernel with its
headers; ideally built with `CONFIG_KASAN`, `CONFIG_PROVE_LOCKING` and
`CONFIG_DEBUG_KMEMLEAK`, which the kit explains):

| #   | Task                                                     | Success criteria                                                                                                                                      |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Build the Lantern out-of-tree against the running kernel | `make -C /lib/modules/$(uname -r)/build M=$PWD` succeeds with no warnings                                                                             |
| 2   | Load and use it                                          | `insmod` works; `/dev/lantern` appears; `echo`/`cat` round-trip a message; the kit's ioctl tool sets brightness; the sysfs attribute reads and writes |
| 3   | Stress it                                                | The kit's script runs parallel readers and writers, and unloads during use: no oops, no KASAN, no lockdep splat in `dmesg`                            |
| 4   | Check for leaks                                          | `echo scan > /sys/kernel/debug/kmemleak` reports nothing from the Lantern                                                                             |
| 5   | Unload cleanly                                           | `rmmod` works; `/dev/lantern` is gone; reloading works                                                                                                |
| 6   | Style                                                    | `checkpatch.pl --no-tree -f` reports no errors                                                                                                        |

**T3: Act III, "The Core on a real kernel"** (QEMU, x86-64, with a 6.18 kernel the
kit helps build). The tasks are in
[act-3-the-core.md](levels/act-3-the-core.md#t3--take-it-home-the-core-on-a-real-kernel-optional):
boot with your own `/init` and a reserved crash kernel, run `lens` on real Linux,
bind your PCI driver to QEMU's `edu` device, watch the Lantern's tracepoints with
bpftrace, run your KUnit tests, and read a vmcore with `crash`.

## 4. What v1.0 doesn't teach, and where to go next

These are left out on purpose: each is big enough to need its own levels. The
epilogue's debrief points players here. "Act IV idea" means a candidate, not a
promise ([GAME.md](GAME.md#8-after-v10)).

| Topic                                                              | Planned for         | Where to learn it now                                                                                                                                      |
| ------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Namespaces and cgroups (what a container is)                       | Act IV idea         | man 7 `namespaces`, man 7 `cgroups`; [cgroup v2 docs](https://docs.kernel.org/admin-guide/cgroup-v2.html)                                                  |
| Security: capabilities in depth, LSMs (SELinux, AppArmor), seccomp | Act IV idea         | man 7 `capabilities`; [LSM docs](https://docs.kernel.org/admin-guide/LSM/index.html); LFD420                                                               |
| Virtualization (KVM)                                               | Act IV idea         | [KVM docs](https://docs.kernel.org/virt/kvm/index.html)                                                                                                    |
| USB drivers; DMA in depth (mapping APIs, IOMMU)                    | Act IV idea         | LDD3; LFD430; [DMA API](https://docs.kernel.org/core-api/dma-api.html)                                                                                     |
| Power management, `io_uring`, Rust in the kernel                   | Act IV idea         | docs.kernel.org; [Rust for Linux](https://rust-for-linux.com/)                                                                                             |
| Filesystems in depth (journaling, ext4 and btrfs internals)        | not planned         | Linux Kernel Labs filesystem labs; docs.kernel.org `filesystems/`                                                                                          |
| Kernel GDB with QEMU, kselftest                                    | not planned         | [GDB kernel debugging](https://docs.kernel.org/process/debugging/gdb-kernel-debugging.html), [kselftest](https://docs.kernel.org/dev-tools/kselftest.html) |
| Driver `poll` file operation                                       | possible side level | LDD3 chapter 6 (APIs have changed since)                                                                                                                   |
| Bringing up real, physical hardware                                | out of scope        | Bootlin kernel and embedded training slides                                                                                                                |

**After v1.0, a player is ready for:**
[LFD103](https://training.linuxfoundation.org/training/a-beginners-guide-to-linux-kernel-development-lfd103/)
(free, and it gets them a first real patch),
[_Linux Device Drivers_ (LDD3)](https://lwn.net/Kernel/LDD3/) read alongside its
[updated examples](https://github.com/martinezjavier/ldd3),
[_The Linux Kernel Module Programming Guide_](https://sysprog21.github.io/lkmpg/),
the [Linux Kernel Labs](https://linux-kernel-labs.github.io/refs/heads/master/)
exercises, and the kernelnewbies
[First Kernel Patch](https://kernelnewbies.org/FirstKernelPatch) guide.
