# Act I: Userland

Level specs for Act I (Basics). Read [GAME.md](../GAME.md) for the story and systems,
[LEVELS.md](../LEVELS.md) for the rules, and
[prologue.md](prologue.md) and [surface-survey.md](surface-survey.md) for what the
player already knows. [LEVELS.md](../LEVELS.md#4-the-journey) shows the whole path,
the callbacks between levels and how the starter code fades.

Kernel source paths follow Linux 6.18 (LTS), and were
checked against its source on 2026-10-29; glibc paths follow current glibc.
Anything still marked "(verify)" must be checked before the level ships.

## Learning outcome

> "I understand processes, file descriptors, signals, sockets and syscalls, and
> I've written a working shell and a chat server in C."

Concretely, by the end of Act I a player can:

- write C that uses strings, arrays, pointers, the heap, structs and function
  pointers without leaks or overflows, and build it with Make, `-Wall -Wextra` and
  AddressSanitizer;
- explain and use `fork`, `execve`, `waitpid`, `chdir`, `open`, `dup2`, `pipe`,
  `sigaction`, `socket`/`bind`/`listen`/`accept` and `poll`, including their error
  cases;
- read `/proc/<pid>` and an `strace` log and say what a program is doing;
- describe the path of one syscall from a C call to the kernel and back.

## Projects

- **`ksh-lite`**, the player's own shell (levels 1.0–1.8). Each level adds one
  piece: 1.0's word counter becomes the first pass of 1.1's tokenizer, and the shell
  replaces init's rescue shell as the player's terminal from 1.4 on. The player
  always continues from their own code; a player who skips or gets stuck can switch
  to the reference version at any point. It goes down into the Deep with them:
  every Act II command runs in it.
- **`harbor`**, a chat server (levels 1.9–1.10), run from `ksh-lite`. It reuses the
  line buffering, the build and the error-handling habits from the shell. Its
  traffic is what the Netfilter Wall counts in 2.11.

**Starter code fades** as skills grow: full (1.0–1.2), partial (1.3–1.4), stub
(1.5–1.8). A new program steps back one notch: `harbor` starts partial (1.9) and
fades to a stub (1.10). The first blank file is the boss's `knock.c`.

**Every level ends with a Debrief:** a short closing beat that gives a story
reason to walk on to the next level (usually something the player's code can't do
yet). The chain runs from the Surface Survey's last line (S.5: "before it can run
anything, a shell reads the line you typed and cuts it into words; learn how C
holds text") to 1.B's staircase into the Forge (2.1).

**Taught before penalized.** Compiler warnings are taught in 1.3, so 1.0–1.2 add
no Taint for them (init or the Smith may point one out); warning Taint starts at
1.3 and applies to every level after it.

## Story arc: the city comes back

The Kernelfall left Userland hollow. init's rescue shell can run programs, but the
city can't _do_ anything together. As `ksh-lite` grows, Userland comes back, one
district at a time:

| After            | What the player sees in the city                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Prologue         | One lamp over init's house. The console works.                                                                             |
| Surface Survey   | Street signs and padlocks: the player knows the folders, the doors and who may open them.                                  |
| 1.0–1.3          | The Compiler's Quarter's forges relight. The Compiler Smith can make tools again.                                          |
| 1.4              | The first new process walks out of a door in the Process District. The streets have people again.                          |
| 1.5              | Houses get addresses (working directories) and name plates (environment variables).                                        |
| 1.6              | The Archive opens: processes can write to files and read from them.                                                        |
| 1.7              | Aqueducts (pipes) connect the houses. Processes pass work to each other.                                                   |
| 1.8              | Alarm bells (signals) work. A runaway process can be stopped without burning the city down.                                |
| 1.9              | The lighthouse at Socket Harbor turns on. One ship docks.                                                                  |
| 1.10             | The harbor fills. init, the Compiler Smith, the Watchdog and the Harbormaster chat on the player's server. The city talks. |
| The Syscall Gate | The Gate between Userland and the Kernel opens. The Deep is dark below. Act II begins.                                     |

The Dangling is not met in Act I. It is felt: Taint shows as a faint grey rust on
whatever the player built, and in the boss the player finds a line in the kernel's
log that no process wrote: a `pstore:` line, and behind it a crash record the old
Lantern driver left before the Kernelfall. Not a living thing, a record; the bug
itself lives in the old driver's source, which Act II's finale reads.

## Skill tree (Act I)

Skill ids, names and prerequisites come from
[CURRICULUM.md section 2](../CURRICULUM.md#2-skills), which wins
if the two ever disagree. The Kernel Map shows these as nodes. A node lights up when
its level is completed (or placed, for the Compiler's Quarter).

| Unlocked by | Skill ids                                                                                                                                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prologue    | `sys-computer-basics`, `sys-user-kernel-mode`, `sys-shell-basics`, `sys-boot-chain`, `sys-kernel-role`, `drv-hardware-discovery`, `proc-process-basics`, `mem-virtual-memory-basics`, `io-everything-is-a-file`, `sys-kernel-subsystems`, `sys-command-lifecycle` |
| S.1–S.5     | `io-fs-hierarchy`, `io-permissions`, `proc-observe`, `io-find-files`, `sys-text-tools` (the Survey)                                                                                                                                                               |
| 1.0         | `c-strings-arrays`                                                                                                                                                                                                                                                |
| 1.1         | `c-pointers-memory`                                                                                                                                                                                                                                               |
| 1.2         | `c-structs-fnptrs`                                                                                                                                                                                                                                                |
| 1.3         | `c-build-warnings`, `dbg-gdb-sanitizers`                                                                                                                                                                                                                          |
| 1.4         | `proc-lifecycle`, `sys-errno`                                                                                                                                                                                                                                     |
| 1.5         | `proc-state-procfs`, `dbg-strace`                                                                                                                                                                                                                                 |
| 1.6         | `io-fd-table`, `io-read-contract`, `io-redirect-dup`, `c-bit-flags`                                                                                                                                                                                               |
| 1.7         | `io-pipes`                                                                                                                                                                                                                                                        |
| 1.8         | `proc-signals`, `sync-interleaving`                                                                                                                                                                                                                               |
| 1.9         | `net-sockets`, `net-stack-path`                                                                                                                                                                                                                                   |
| 1.10        | `net-poll`                                                                                                                                                                                                                                                        |
| Boss        | `sys-syscall-path` (and assesses `dbg-strace`, `sys-errno`, `io-pipes`)                                                                                                                                                                                           |

`c-container-of` is no longer taught here: Act II teaches it where drivers first
need it (2.8b). `dbg-gdb-sanitizers` is earned from the AddressSanitizer work in 1.3;
gdb is an optional beat in the same level.

## Codex chapters

The Codex has one chapter per region ([GAME.md](../GAME.md#the-codex)). Act I fills
four. Each level below lists its cards in teaching order, each with a **Simple**
line (plain words) and a **Deep** text (kernel functions, structs, source files,
docs), and an optional **Read** line. A card marked `deepens: <id>` adds to an
earlier card's chain instead of starting a new one. Card ids are unique across the
game.

| Chapter            | Levels   | Cards, in teaching order                                                                                                                                                                                                                                                                                                 |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Compiler's Quarter | 1.0–1.3  | `c-array`, `c-string`, `sizeof-strlen`, `compile-errors`; `pointer`, `heap`, `dangling-pointer`, `word-array`; `struct`, `ops-table`; `make`, `compiler-warnings`, `asan`, `gdb`                                                                                                                                         |
| Process District   | 1.4–1.8  | `fork`, `execve`, `wait`, `exit-status`, `errno`, `address-space`; `cwd`, `process-environment`, `proc-pid`, `process-state`, `strace`; `file-descriptor`, `open`, `bit-flags`, `dup2`, `read-contract`, `everything-is-a-file`; `pipe`, `sigpipe`; `signal`, `ctrl-c-tty`, `async-signal-safe`, `eintr`, `interleaving` |
| Socket Harbor      | 1.9–1.10 | `socket`, `byte-order`, `tcp`, `packet-path`, `time-wait`; `poll`, `select-epoll`, `sigpipe-sockets`                                                                                                                                                                                                                     |
| The Syscall Gate   | 1.B      | `syscall-path`, `root-capabilities`                                                                                                                                                                                                                                                                                      |

Chains that cross levels:

- from the Prologue: `compile-errors` (1.0) and `compiler-warnings` (1.3) deepen
  `compiler-diagnostics` (P.2); `read-contract` (1.6) deepens `write-syscall`
  (P.2); `file-descriptor` (1.6) deepens `file-descriptors` (P.2); `syscall-path`
  (1.B) deepens `syscall` (P.2); `word-array` (1.1) and `execve` (1.4) deepen
  `arguments` (P.3); `fork` (1.4) deepens `shell` (P.3); `cwd` (1.5) deepens
  `command` (P.3); `process-environment` (1.5) deepens `environment` (P.3);
  `signal` (1.8) deepens `signals` (P.5); `everything-is-a-file` (1.6) deepens
  `vfs` (P.9); `packet-path` (1.9) deepens `network-stack` (P.9);
- from the Surface Survey: `proc-pid` (1.5) deepens `procfs` (S.1);
  `process-state` (1.5) deepens `process-states` (S.3); `root-capabilities` (1.B)
  deepens `users-and-ids` (S.2);
- within Act I: `everything-is-a-file` (1.6) also deepens `ops-table` (1.2);
  `sigpipe-sockets` (1.10) deepens `sigpipe` (1.7), and 1.8's `signal` card only
  lists `SIGPIPE` and links there.

## Placement check (Compiler's Quarter)

Levels 1.0–1.3 are skippable. At the Quarter's entrance the Compiler Smith offers a
placement check: "Show me your hands. If they know the work, walk on through."

- **Format:** about 12 minutes, four small build tasks in the editor. No
  multiple-choice trivia, no timer.
  1. **Strings and arrays:** implement `count_words()` and `first_word()` (the 1.0
     task) against the same checker.
  2. **Pointers and the heap:** implement `split_line()` (the 1.1 task) against
     the same checker, under the sanitizer, with no leaks.
  3. **Structs and function pointers:** fill a three-entry table of
     `struct builtin` and write the lookup loop (the 1.2 task, smaller).
  4. **Build and debug:** given a two-file program and a broken `Makefile`, make it
     build with `-Wall -Wextra -g` and zero warnings; then read a provided
     AddressSanitizer report and click the faulting line in the source.
- **Result:** each task maps to one level. Passing a task places the player past
  that level: its skills light up (marked "placed"), and its reference code is
  merged into the player's `ksh-lite` so later levels have everything they need.
  A failed task sends the player to just that level. Nothing is lost; the check can
  be retaken any time, and placed levels stay playable from the map.
- **Taint:** none. The placement check never adds Taint.

---

## 1.0 — Letters in a Row

- **Region / NPC:** Compiler's Quarter / the Compiler Smith, init · **Tracks:** `c` · **Time:** ~15 min · **Prerequisites:** `sys-shell-basics` · **Skills unlocked:** `c-strings-arrays`

### Scene

> **The Compiler Smith:** _(hammering)_ A customer! First in a week. What'll it be?
>
> **init:** This one's going to build a shell, Smith. From scratch.
>
> **The Compiler Smith:** I'm the Compiler Smith. In your world, the C toolchain: compiler, linker, the lot. I turn your C into something the Machine can run.
>
> **The Compiler Smith:** A shell, eh? A shell reads a line like `ls -l /tmp` and splits it into words. So first: how does C hold a line of text?
>
> **The Compiler Smith:** C has no string type. Just a row of bytes, the characters' numbers, and a zero byte at the end, `\0`, so every reader knows where to stop.
>
> **init:** You've met one already. In your first program you wrote `sizeof(msg) - 1`. Today you find out what that `- 1` was for.
>
> **The Compiler Smith:** And the row lives on the _stack_: it's made when a function starts and gone when the function returns. Come, I'll show you.

### See it (X-ray)

The syscalls view plus the debugger's **memory panel** (boxes for stack memory;
unlocked here, and it gains heap boxes and arrows in 1.1). The Smith steps through
a tiny demo, `letters.c`, line by line:

- `char cmd[] = "ls -l";` shows six boxes on the stack: `l`, `s`, a space, `-`,
  `l`, and a grey `\0`. The compiler counted the letters and added the zero.
- `cmd[0]` lights the first box; `cmd[3]` the `-`. Indexes start at 0, so the last
  letter is `cmd[4]` and the `\0` is `cmd[5]`.
- A loop, `for (i = 0; cmd[i] != '\0'; i++)`, walks the boxes one by one and stops
  on the zero. "That's how every string function in C knows where to stop."
- `sizeof(cmd)` is 6: the size of the whole row, zero included, known when the
  program is compiled. `strlen(cmd)` is 5: the letters before the zero, counted
  while the program runs.
- `char buf[16] = "ls";` shows sixteen boxes: `l`, `s`, then fourteen zeros.
  `sizeof(buf)` is 16, `strlen(buf)` is 2. Room and contents are different things.
- The demo function returns, and its boxes disappear from the stack. "Stack arrays
  last as long as their function. Remember that tomorrow."

Meanwhile the syscalls view shows only the demo's `read` and `write`: indexing,
looping and `strlen` are plain user-mode work. No knock on the Kernel's door.

### Build it

The player writes the first two pieces of `ksh-lite`'s line handling.

- **Starter provides (full):** `words.c` with a `main()` that reads one line at a
  time with `read()` into `char line[256]`, turns the trailing `\n` into `\0`, and
  prints the results of the two functions below; a `make words` target. The
  starter doesn't build yet: `main()` sets its banner with
  `char banner[16]; banner = "words v1";`, and clang stops with a real error.

  ```c
  /* Count the words in line (separated by spaces or tabs). */
  size_t count_words(const char *line);
  /* Copy the first word of line into out (outsz bytes of room), with its '\0'.
   * Return its length, or -1 (and leave out as "") if it doesn't fit. */
  int first_word(const char *line, char *out, size_t outsz);
  ```

- **Player does:**
  - **Reads the compiler error again** (the Prologue showed one warning; this is an
    error, which stops the build). The terminal shows clang's real message:

    ```
    words.c:14:2: error: array type 'char[16]' is not assignable
    ```

    The editor jumps to line 14, column 2 (the line starts with a tab). An array
    can't be assigned after it's made; the player initializes it instead, `char banner[] = "words v1";` (or
    copies into it with `memcpy`).
  - Writes `count_words()`: walk the line until `\0`, and count each place where a
    word starts (a non-space after a space, or at the very beginning).
  - Writes `first_word()`: skip leading spaces, measure the word, check it fits
    _with its `\0`_ (`len + 1 <= outsz`), copy it letter by letter, and write the
    `\0`.
- **Checker verifies (behavior):** the program is built and run on fixed input.
  - It compiles (the error is fixed). Warnings don't fail it and add no Taint yet;
    the Smith just points them out.
  - `ls -l /tmp` gives 3 words, first word `ls`.
  - Leading, trailing and repeated spaces and tabs give the right count; an empty
    line and a line of only spaces give 0 and an empty first word.
  - With `outsz` 16, a 15-letter first word is copied (15 letters + `\0`); a
    16-letter one returns -1 and leaves `out` as `""`.
  - The input line is unchanged, `out` always ends in `\0`, and nothing is read past
    the line's `\0` or written past `out[outsz - 1]` (lab memory checks).

### Watch it

**Predict:** for `char cmd[] = "ls -l";`, what are `sizeof(cmd)` and `strlen(cmd)`?
The memory panel then counts the boxes, zero included.

```
$ ./words
ls -l /tmp
3 words, first: ls
     echo    spaced   out
3 words, first: echo
```

On the Smith's bench, each line the player types appears as a row of glowing
letters, with a dull zero at the end. The Smith taps the zero: "Without that, my
tongs wouldn't know where to stop."

### Debrief

> **The Compiler Smith:** You can count the words and pull out the first. A shell needs _all_ of them, each in its own box.
>
> **The Compiler Smith:** And here's the catch: your arrays vanish when `first_word` returns. The shell has to keep its words after the cutting's done.
>
> **init:** Memory that outlives a function. The heap.
>
> **The Compiler Smith:** Tomorrow. Bring your counting; you'll need it.

### Hints

1. Nudge: "Read the error line from left to right: file, line, column, then what
   the compiler didn't like. What is line 14 trying to do to the array?"
2. Concept: "A string is a `char` array that ends in `\0`. Loop with an index until
   you reach the `\0`. A word starts where a non-space follows a space, or at
   index 0. To copy a word of `len` letters you need `len + 1` bytes of room."
3. Point at the spot: "In `first_word`, compare `len + 1` with `outsz` before you
   copy. After the copy loop, did you write `out[len] = '\0'`?"

### Codex (chapter: Compiler's Quarter)

- **Array** (`c-array`)
  - **Simple:** a row of same-typed boxes, numbered from 0.
  - **Deep:** `int a[8]` holds 8 elements, `a[0]` to `a[7]`; C doesn't check the
    index, so `a[8]` reads past the end without any error (an overflow, undefined
    behavior). A local array lives on the stack and is gone when its function
    returns. An array can't be assigned as a whole (`a = b` is an error). — C11
    §6.5.2.1, §6.7.6.2 — the kernel's `ARRAY_SIZE()` in
    `include/linux/array_size.h`.
- **String in C** (`c-string`)
  - **Simple:** a `char` array that ends in a zero byte, `\0`.
  - **Deep:** a string literal `"ls"` is 3 bytes: `l`, `s`, `\0`. Every string
    function (`strlen`, `strcpy`, `printf`'s `%s`) reads until the `\0`; a string
    without one makes them read past the end. The kernel has no C library, so it
    carries its own string functions: `lib/string.c`, where `strscpy()` copies with
    a size limit and returns `-E2BIG` when the text doesn't fit. — man 3 `string`,
    man 7 `ascii` — `lib/string.c`, `include/linux/string.h`.
- **`sizeof` vs `strlen`** (`sizeof-strlen`)
  - **Simple:** `sizeof` is the room (fixed when you compile); `strlen` is the
    letters (counted when you run).
  - **Deep:** `sizeof` is an operator that yields a `size_t` at compile time; on an
    array it gives the whole array in bytes, `\0` and unused room included. On a
    pointer it gives the pointer's size (8 on x86-64), not the text's. `strlen`
    walks to the `\0`, which costs one step per letter. `ARRAY_SIZE(a)` in the
    kernel is `sizeof(a) / sizeof((a)[0])` plus a check that `a` really is an
    array. — man 3 `strlen`, C11 §6.5.3.4 — `include/linux/array_size.h`.
- **Compile errors** (`compile-errors`, deepens: `compiler-diagnostics`)
  - **Simple:** an error means there is no program yet; fix it where the compiler
    points.
  - **Deep:** errors come from code that breaks C's rules (a type mismatch, an
    array assigned as a whole, a missing declaration), so the compiler produces no
    object file at all. The message names the rule in the compiler's words
    (`array type 'char[16]' is not assignable`); the fix is to say what you meant
    in a form C allows. When several errors appear, fix the first and rebuild. —
    clang "Expressive Diagnostics" docs, C11 §6.5.16 (assignment needs a
    modifiable lvalue).

### Real-world card

```c
#include <stdio.h>
#include <string.h>

int main(void)
{
	char cmd[] = "ls -l";

	printf("sizeof %zu, strlen %zu\n", sizeof(cmd), strlen(cmd));
	for (size_t i = 0; cmd[i] != '\0'; i++)
		printf("cmd[%zu] = '%c'\n", i, cmd[i]);
	return 0;
}
```

```sh
cc -Wall -Wextra -o letters letters.c && ./letters   # sizeof 6, strlen 5
```

Then break it on purpose: write `cmd = "pwd";` after the declaration and compile
again to see the same "not assignable" error on your own machine.

### Taint

- **Compiler warnings:** no Taint yet (taught in 1.3); the Smith points each one
  out.
- **No room for the `\0`** (copying `len` bytes into a `len`-byte buffer, or
  forgetting to write the `\0`): fails the objective; the memory panel shows the
  missing zero and the read running past the end.
- **Calling `strlen(line)` in the loop condition:** +0, with a note: it re-counts
  the whole line on every step. Loop until `line[i] == '\0'` instead.

### Fidelity

- **Faithful:** C semantics (real clang compiles the code); clang's error and
  warning text and `file:line:column` format; `sizeof` and `strlen` results on
  x86-64.
- **Simplified:** the lab's interpreter checks every array access, so reading or
  writing past the end is reported at once. Real C doesn't check: the program
  silently corrupts nearby memory, or gcc's stack protector aborts it later with
  `*** stack smashing detected ***`. 1.3 brings the real tool that catches it,
  AddressSanitizer.

---

## 1.1 — Words on the Anvil

- **Region / NPC:** Compiler's Quarter / the Compiler Smith, init · **Tracks:** `c` · **Time:** ~20 min · **Prerequisites:** `c-strings-arrays` · **Skills unlocked:** `c-pointers-memory`

### Scene

> **The Compiler Smith:** Back again. You can count words and copy one. Now cut them all, and keep them.
>
> **The Compiler Smith:** A shell gets `ls -l /tmp` and needs `ls`, `-l`, `/tmp`, each in its own box, kept until the command has run. Stack arrays won't last that long.
>
> **The Compiler Smith:** So we take metal from the _heap_. Rule of the forge: if you take metal from the heap, you give it back. `malloc` takes, `free` gives back. Forget, and the heap fills with junk. That's a _leak_.
>
> **init:** And never use what you've given back. That's how the Dangling got its start.
>
> **The Compiler Smith:** Don't scare 'em. Pointers are just addresses. Like house numbers. Come on, I'll show you.

### See it (X-ray)

The X-ray syscalls view, plus the memory panel from 1.0, which now shows the heap
and draws pointers as arrows. The Smith runs a tiny demo, `words.c`, line by line:

- `char line[] = "ls -l";` shows 1.0's six boxes on the stack, `\0` included.
- `char *p = line + 3;` shows an arrow from `p` into the middle of `line`.
- `char *copy = malloc(3);` shows a new box on the heap.
- `free(copy);` greys the box out. The panel keeps the arrow from `copy`, now
  pointing at a grey box: "That's a dangling pointer. Don't follow it."

Meanwhile the syscalls view stays almost silent. The Smith: "Notice something?
`malloc` didn't knock on the Kernel's door. The heap is managed by the C library.
It only asks the Kernel for big chunks now and then (`brk` or `mmap`)." The demo then
allocates 1 MiB and the view shows one `mmap` call.

### Build it

The player writes the tokenizer for `ksh-lite`.

- **Starter provides (full):** `parse.h` with the two prototypes, the player's
  `count_words()` from 1.0 (or the reference), a test driver `tokenize.c` that
  reads lines from stdin and prints each word in brackets, and a `make tokenize`
  target.

  ```c
  /* Split line into words separated by spaces or tabs. Returns a heap-allocated,
   * NULL-terminated array of heap-allocated strings, or NULL if out of memory. */
  char **split_line(const char *line);
  void free_words(char **words);
  ```

- **Player writes:** `split_line()` (count the words, allocate the array, copy each
  word with `malloc` + `memcpy`, terminate each word and the array) and
  `free_words()` (free every word, then the array).
- **Checker verifies (behavior):** the driver is run on fixed input and its output
  compared; the lab's allocator is inspected at exit.
  - `ls -l /tmp` gives `[ls] [-l] [/tmp]`.
  - Leading, trailing and repeated spaces and tabs give no empty words.
  - An empty line and a line of only spaces give an array holding just `NULL`.
  - A 4,000-character line with 1,000 words works.
  - The input string is unchanged after the call.
  - No heap overflow or use-after-free (lab memory checks), and zero bytes still
    allocated after `free_words()` runs on every result.
  - When the lab makes `malloc` fail on the Nth call (fault injection), the function
    returns `NULL` and frees anything it already allocated.

### Watch it

```
$ ./tokenize
ls -l /tmp
[ls] [-l] [/tmp]
   echo    spaced   out
[echo] [spaced] [out]
```

The Smith's forge flares. Words drop off the anvil as glowing ingots onto a rack,
one per array slot, with the `NULL` slot shown as an empty hook. The memory panel at
exit shows an empty heap: "Clean bench. I like you."

### Debrief

> **init:** Let's try it on a real command. _(types `help`)_
>
> **The Compiler Smith:** `[help]`. Well cut. And then... nothing. Your words are just words.
>
> **The Compiler Smith:** A shell has to _do_ something with `help`. That takes tools on a rack, with name tags. Come round to the wall tomorrow.

### Hints

1. Nudge: "Before you allocate, you need to know how much. How many words are in
   the line? You counted them in 1.0."
2. Concept: "A `char **` is an array of pointers. Each pointer points at its own
   `malloc`'d string. Two passes work well: count first, then allocate and copy.
   Every string needs room for its `\0`, and the array needs one extra slot for
   `NULL`."
3. Point at the spot: "Look at the line where you allocate each word. Is the size
   `len` or `len + 1`? And after `memcpy`, did you write the `\0` at `word[len]`?"

### Codex (chapter: Compiler's Quarter)

- **Pointer** (`pointer`)
  - **Simple:** a variable that holds a memory address, like a house number.
  - **Deep:** `*p` reads what's at that address; `p + 1` moves by one element, not
    one byte. An array name used in an expression turns into a pointer to its
    first element, which is why `sizeof` on a pointer gives 8, not the text's
    length (`sizeof-strlen`). The kernel uses the same C. — C11 §6.3.2.1 (arrays
    to pointers), §6.5.6 (pointer arithmetic), man 3 `string`.
- **Heap (`malloc`/`free`)** (`heap`)
  - **Simple:** memory you ask for while running and must give back.
  - **Deep:** `malloc(n)` returns `n` bytes or `NULL`; `free(p)` returns them. The
    C library manages the heap and only occasionally asks the kernel for more with
    `brk` or `mmap` (glibc uses `mmap` directly for allocations at or above
    `M_MMAP_THRESHOLD`, 128 KiB by default). Act II's `kmalloc`/`kfree` (2.8a) are
    the kernel's own version. — man 3 `malloc`, man 2 `brk`, man 2 `mmap`, man 3
    `mallopt` — glibc `malloc/malloc.c`; kernel `mm/mmap.c` (the `brk` syscall),
    `mm/vma.c` (the memory-area code it calls).
- **Dangling pointer** (`dangling-pointer`)
  - **Simple:** a pointer to memory that was already given back.
  - **Deep:** reading or writing through it is undefined behavior ("use after
    free"): the memory may already belong to someone else. Setting the pointer to
    `NULL` after `free` makes a later mistake crash loudly instead of corrupting
    quietly. Remember this one. — man 3 `free`.
- **An array of words** (`word-array`, deepens: `arguments`)
  - **Simple:** the words your tokenizer makes are exactly the shape a program
    receives as its arguments.
  - **Deep:** a `char **` ending in `NULL` is what `main(int argc, char *argv[])`
    gets: `argv[argc]` is always `NULL`. In 1.4 your shell hands this array
    straight to `execvp`, and the kernel copies each string onto the new program's
    stack. — C11 §5.1.2.2.1 (`argv`), man 2 `execve` — `fs/exec.c`
    (`copy_strings()`).

### Real-world card

```sh
cc -Wall -Wextra -g -fsanitize=address -o tokenize tokenize.c parse.c
printf 'ls -l /tmp\n  a   b  \n' | ./tokenize
```

Then break it on purpose: change `len + 1` to `len` and run it again.
AddressSanitizer prints a `heap-buffer-overflow` report naming the exact line.
`valgrind --leak-check=full ./tokenize` is the classic alternative.

### Taint

- **Leaks** (bytes still allocated at exit, beyond the test's own): +1 per leaked
  allocation site. Long-running programs like shells die of a thousand small leaks.
- **Unchecked `malloc`** (the fault-injection run crashes instead of returning
  `NULL`): +2. Memory runs out in real systems, and kernel code must always check.
- **Using `strtok`** on a copy: +0 but a note: it works, but it's not reentrant and
  it modifies its input. `strtok_r` is fine.
- **Compiler warnings:** no Taint yet (taught in 1.3); init points them out.

### Fidelity

- **Faithful:** C semantics (real clang compiles the code); `malloc`/`free`
  behavior and `NULL` on failure; the AddressSanitizer report format; the idea that
  `malloc` rarely makes a syscall.
- **Simplified:** the lab's C library has its own small allocator, not glibc's
  `ptmalloc`, so the exact moments it calls `brk`/`mmap` differ; the 1 MiB demo is
  arranged to show one `mmap`. Memory checks come from the lab's interpreter, not
  real ASan shadow memory; addresses in reports differ from a real run.

---

## 1.2 — The Command Table

- **Region / NPC:** Compiler's Quarter / the Compiler Smith, init · **Tracks:** `c` · **Time:** ~12 min · **Prerequisites:** `c-pointers-memory` · **Skills unlocked:** `c-structs-fnptrs`

### Scene

> **The Compiler Smith:** You can cut words. Now, what does the shell _do_ with `help`?
>
> **The Compiler Smith:** You could write a hundred `if (strcmp(...))` lines. Ugly. Brittle. I've seen forges burn down for less.
>
> **The Compiler Smith:** Instead: a rack of tools. Each slot has a name tag and a tool. You look up the name, you grab the tool.
>
> **The Compiler Smith:** In C, the slot is a `struct`. The tool is a _function pointer_: a pointer to code instead of data.
>
> **init:** Pay attention to this one. Deep below, the Kernel does exactly this to talk to every device. It's called `file_operations`.
>
> **The Compiler Smith:** Right. Learn the rack here, and the Deep will feel like home.

### See it (X-ray)

The debugger's memory panel shows a `struct builtin` array as a rack: each row has a
`name` arrow pointing at a string and a `run` arrow pointing into the code area,
labeled with the function's name. The Smith steps through a lookup: the loop
compares `"help"` to each name, finds the match, and the call jumps along the `run`
arrow. The syscalls view shows that calling through a function pointer makes no
syscall at all; only the `write` inside `help` does.

### Build it

- **Starter provides (full):** `ksh.h`, a `main.c` loop that prints the prompt `ksh$ `,
  reads a line with `read()`, calls the player's `split_line()` (or the reference
  one), and calls `dispatch(words)`. Stubs for three builtins.
- **Player writes:**

  ```c
  struct builtin {
  	const char *name;
  	const char *help;
  	int (*run)(char **argv);
  };
  ```

  a `static const struct builtin builtins[]` table with `help`, `about` and
  `exit`; the three `run` functions; and `dispatch()`, which finds the matching
  entry and calls it, or prints `ksh-lite: <name>: command not found` to stderr.
- **Checker verifies (behavior):** `ksh-lite` is run with scripted terminal input.
  - `help` prints one line per builtin, including its name and help text (any
    order).
  - `about` prints a banner line.
  - `exit 3` ends the shell with exit status 3; `exit` alone with status 0.
  - `nosuch` prints the not-found message on fd 2 (not fd 1), and the next prompt
    appears.
  - An empty line just shows the next prompt.
  - End of input (Ctrl-D at the prompt) exits with status 0.

### Watch it

**Predict:** the player is about to type `help`. Between pressing Enter and the
first line appearing, how many syscalls does the lookup through the table make?
The syscalls view, with the lookup highlighted, then shows the answer: none. The
loop, the `strcmp` calls and the jump through `run` are plain user-mode code; the
next knock on the Kernel's door is `help`'s own `write`.

```
ksh$ help
help   show this list
about  who made this shell
exit   leave the shell
ksh$ about
ksh-lite 0.1, forged in the Compiler's Quarter
ksh$ nosuch
ksh-lite: nosuch: command not found
```

A rack of tools appears on the Smith's wall, one tool per builtin, each with a
glowing name tag. When the player types a command, the matching tool lifts off the
rack.

### Debrief

> **The Compiler Smith:** Three tools on the rack. And my apprentice already made you a fourth. A `history` command.
>
> **init:** In its own file, I see. And there'll be more files after that.
>
> **The Compiler Smith:** Which is why you can't keep typing one giant compile command. Tomorrow I teach you to write a work order. And to build with your eyes open.

### Hints

1. Nudge: "Where would you add a fourth command? If the answer is 'in three
   places', there's a simpler shape."
2. Concept: "A `struct` groups a name, a help line and a function pointer. An array
   of those structs is a table. Lookup is a loop with `strcmp`, then a call through
   the pointer: `b->run(argv)`."
3. Point at the spot: "In `dispatch`, loop over `builtins` up to
   `sizeof(builtins) / sizeof(builtins[0])`, compare `argv[0]` to `name`, and
   return `builtins[i].run(argv)` on a match."

### Codex (chapter: Compiler's Quarter)

- **struct** (`struct`)
  - **Simple:** one type that groups several named fields.
  - **Deep:** `s.field` reads a field; `p->field` reads it through a pointer
    (`(*p).field`). The compiler lays the fields out in order, with padding for
    alignment, so `sizeof` a struct can be more than the sum of its fields. Kernel
    code is built from structs: `task_struct`, `file`, `inode`. — C11 §6.7.2.1 —
    `include/linux/sched.h` (`struct task_struct`).
- **Function pointer / ops table** (`ops-table`)
  - **Simple:** a pointer to code; a struct of them is a table of "what to do".
  - **Deep:** a function pointer is called like the function itself. A struct full
    of function pointers is an _operations table_, the kernel's way of doing
    "methods". Every open file has a `const struct file_operations *` whose
    `open`, `read`, `write` (or `read_iter`, `write_iter`) the kernel calls for
    you; 1.6 shows why, and 2.5 has you write one. — man 3 `qsort` (a
    function-pointer API you already have) — `include/linux/fs.h`
    (`struct file_operations`).

### Real-world card

`qsort` takes a function pointer. Try it:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int by_name(const void *a, const void *b)
{
	return strcmp(*(char *const *)a, *(char *const *)b);
}

int main(void)
{
	const char *w[] = { "exit", "about", "help" };

	qsort(w, 3, sizeof(w[0]), by_name);
	for (int i = 0; i < 3; i++)
		puts(w[i]);
	return 0;
}
```

Then open `include/linux/fs.h` in a kernel tree and search for
`struct file_operations`. You'll write one of those in Act II.

### Taint

- **A long `if`/`strcmp` chain** instead of the table: +0, since behavior can't
  tell them apart. The debrief shows both versions side by side, and the next
  levels (and Act II's `file_operations`) build on the table.
- **Error messages on stdout:** +1. Errors go to stderr so that pipes and
  redirection (coming soon) don't swallow them.
- **A non-`const` table:** +0, with a note: make data that never changes `const`
  so the compiler and the reader both know.
- **Compiler warnings** (for example an incompatible function-pointer type): no
  Taint yet (taught in 1.3); the Smith points them out.

### Fidelity

- **Faithful:** C semantics; the layout and use of an ops table; the real name and
  file of `struct file_operations`.
- **Simplified:** reading the terminal with a single `read()` per line works
  because the lab's terminal is in canonical mode and returns one line per read,
  like a real terminal. Lines longer than the buffer are cut; the real fix (looping)
  is left as a stretch goal.

---

## 1.3 — A Proper Build

- **Region / NPC:** Compiler's Quarter / the Compiler Smith, init · **Tracks:** `c`, `debug` · **Time:** ~20 min · **Prerequisites:** `c-structs-fnptrs` · **Skills unlocked:** `c-build-warnings`, `dbg-gdb-sanitizers`

### Scene

> **The Compiler Smith:** Your shell's getting big. One file, one giant compile command. Every change, you rebuild everything.
>
> **The Compiler Smith:** A real smith keeps a work order. In your world: a `Makefile`. It says what depends on what, and `make` rebuilds only what changed.
>
> **The Compiler Smith:** Also, my apprentice made you a gift. A `history` command. Remembers your last eight lines.
>
> **init:** Your apprentice's gifts tend to explode, Smith.
>
> **The Compiler Smith:** ...Only sometimes. That's why we build with our eyes open. _Warnings_ on, every one of them, and the _sanitizer_ on: it watches every memory access and shouts when you step off the edge.

### See it (X-ray)

A split view: the editor and the terminal. The Smith runs `make` twice. The first
run prints every compile command; the second prints
`make: 'ksh-lite' is up to date.` Then the Smith touches `parse.c` and runs `make`
again: one compile, one link. A small dependency graph (targets as boxes, arrows
for prerequisites) lights the boxes that rebuild.

Then the Smith compiles the apprentice's `history.c` with `-Wall -Wextra`, and a
warning (not an error, as in 1.0) scrolls by:

```
history.c:31:20: warning: comparison of integers of different signs: 'int' and
'size_t' (aka 'unsigned long') [-Wsign-compare]
```

"It built. It also told you where it might lie to you." A negative `int` compared
with a `size_t` is first converted to a huge unsigned number, so `-1 < len` is
false. The memory panel shows the conversion on one example.

Last, the sanitizer on a tiny demo that writes one element past an array: the
program stops at the bad write and prints a report naming the file and line.

### Build it

- **Starter provides (partial):** `ksh-lite` split into `main.c`, `parse.c`, `builtins.c`,
  `ksh.h`; the apprentice's `history.c` and `history.h` (a fixed ring of 8
  `strdup`'d lines with a `history` builtin); an empty `Makefile`. The apprentice's
  code has two realistic faults, with no comment pointing at either: the
  `-Wsign-compare` warning above, and an off-by-one in the ring, whose wrap-around
  check uses `>` instead of `>=`, so the ninth line is written one slot past the
  end of the array.
- **Player writes:**
  - A `Makefile` with `CC`, `CFLAGS = -std=c11 -Wall -Wextra -g
    -fsanitize=address`, one object per source file, header dependencies, an `all`
    target (the default) and a `clean` target.
  - The `history` row in the command table (reuses 1.2).
  - The warning fixed at its cause (matching types), not silenced.
  - The ring fix in `history.c`, found from the sanitizer report.
- **Checker verifies (behavior):**
  - `make clean && make` builds `ksh-lite` with zero warnings.
  - A second `make` compiles nothing.
  - After `parse.c` changes, `make` recompiles only `parse.o` and relinks; after
    `ksh.h` changes, every object that includes it recompiles.
  - `make clean` removes the objects and the binary.
  - Running 19 commands and then `history` (line 20) prints the last 8, oldest first,
    numbered, with no sanitizer report and no leak report at exit (the overwritten
    oldest line must be freed).

### Watch it

**Predict:** the player changes `ksh.h`. Which objects will `make` rebuild? The
dependency graph then lights them: every object whose source includes `ksh.h`, and
the link.

```
ksh$ history
   13  about
   14  help
   ...
   20  history
```

Before the fix, the sanitizer report appears in the terminal in its real format:

```
==57==ERROR: AddressSanitizer: global-buffer-overflow on address 0x... ...
WRITE of size 8 at 0x... thread T0
    #0 0x... in history_add history.c:24
    #1 0x... in main main.c:41
```

(Pointer size follows x86-64, so a `char *` write is 8 bytes; see Fidelity.)

After the fix, the Smith's forges burn steadily, and the Quarter's gate on the
Kernel Map lights up. The Smith hands over a tool belt: from now on, every level
builds with the player's own `Makefile`.

**Optional: the debugger** (about 2 minutes, unchecked, no Taint). The Smith
offers one more tool: "When a report isn't enough, stop the program and look
inside." The player may open `ksh-lite` in the lab's gdb: `break history_add`,
`run`, type a few commands, `print next` on each stop, `backtrace`. The memory
panel follows along. Skipping it costs nothing; the `gdb` card is filed either way.

### Debrief

> **The Compiler Smith:** Clean build, quiet sanitizer. That's a shell I'd put my name on.
>
> **init:** Try `ls`.
>
> **The Compiler Smith:** `ksh-lite: ls: command not found`. Well, it isn't a builtin. `ls` is its own program, in `/bin`.
>
> **The Compiler Smith:** And running another program means starting a new _process_. My forge makes tools. It can't make people.
>
> **init:** Processes are born in my district. Come home with me; I'll show you how every one of them started.

### Hints

1. Nudge: "Read the first `#0` line of the sanitizer report. It names a file and a
   line. Start there. For the warning, read its last bracket: which flag fired?"
2. Concept: "An array of 8 has slots 0 to 7. A ring buffer wraps its index back to 0
   when it reaches the size. Watch `next` in the memory panel as you type commands:
   which value does it reach before it wraps? For the warning: make both sides of
   the comparison the same type, `size_t`."
3. Point at the spot: "Look at the wrap-around `if` in `history_add`. Which index
   does it allow to be written before it wraps?"

### Codex (chapter: Compiler's Quarter)

- **Make** (`make`)
  - **Simple:** a work order: what depends on what, so only changed parts rebuild.
  - **Deep:** a rule is `target: prerequisites` followed by a tab-indented recipe;
    `make` rebuilds a target when a prerequisite is newer (by timestamp). The
    kernel's build system, kbuild, is a large set of Makefiles you'll drive in 2.1.
    — GNU make manual (`info make`), man 1 `make` — `Makefile` and
    `scripts/Makefile.build` in the kernel tree.
- **Compiler warnings** (`compiler-warnings`, deepens: `compiler-diagnostics`)
  - **Simple:** the cheapest bug reports you'll ever get; build with them on and
    fix every one.
  - **Deep:** `-Wall` and `-Wextra` turn on the common warning groups (each
    message names its flag, like `[-Wsign-compare]`); `-Werror` makes them stop the
    build. Fix the cause, never silence it with `-w` or a cast that hides a real
    mismatch. The kernel builds with its own warning set (`W=1` adds more) and
    `CONFIG_WERROR`. — gcc "Warning Options", clang "Diagnostic flags" —
    `scripts/Makefile.extrawarn`, `Documentation/kbuild/kbuild.rst`.
- **AddressSanitizer** (`asan`)
  - **Simple:** a compiler option that catches bad memory accesses while the
    program runs and names the line.
  - **Deep:** `-fsanitize=address` instruments every load and store and checks a
    "shadow" map of which bytes are valid. A report names the bug type
    (`heap-buffer-overflow`, `global-buffer-overflow`, `heap-use-after-free`), the
    access, and stack traces. Its leak checker (LeakSanitizer) reports memory never
    freed at exit. The kernel has the same idea: KASAN, in 2.12. — clang
    AddressSanitizer docs — `Documentation/dev-tools/kasan.rst`, `mm/kasan/`.
- **gdb** (`gdb`)
  - **Simple:** a debugger: stop the program, look inside, step line by line.
  - **Deep:** `break` sets a breakpoint, `run` starts, `next`/`step` move one line
    (over or into calls), `print` shows a value, `backtrace` shows the call stack.
    It needs `-g` debug info. The kernel can be debugged the same way under QEMU
    (beyond v1.0). — man 1 `gdb` —
    `Documentation/process/debugging/gdb-kernel-debugging.rst`.

### Real-world card

```sh
make                      # build
touch parse.c && make     # only parse.o rebuilds
gdb ./ksh-lite            # optional
(gdb) break history_add
(gdb) run
(gdb) print next
(gdb) backtrace
```

Generate header dependencies automatically with `-MMD -MP` in `CFLAGS` and
`-include $(OBJS:.o=.d)` in the `Makefile`.

### Taint

Warning Taint starts here, for this level and every level after it.

- **Compiler warnings:** +1 each.
- **Silencing warnings** (`-w`, or removing `-Wall -Wextra`): +3. Warnings are the
  cheapest bug reports you'll ever get.
- **Masking the bug** (making the array 9 long, or catching the crash): +2. The
  sanitizer goes quiet but the logic is still wrong.
- **Hiding the warning with a cast** (`(int)len`, so a negative value still
  compares wrong): +1. The warning goes away; the bug it pointed at doesn't.
- **Leaking the overwritten history line:** +1 (reported by the leak checker).
- **Building without `-g`:** +0, with a note: sanitizer reports and the debugger
  can't name source lines without debug info.

### Fidelity

- **Faithful:** Make's rule, prerequisite and timestamp semantics for the features
  used; real clang warnings and their flag names; the AddressSanitizer report
  layout; in the optional beat, gdb command names and output shape for `break`,
  `run`, `next`, `step`, `print`, `backtrace`, `continue`.
- **Simplified:** the lab runs a small Make that supports variables, explicit and
  pattern rules, and `.PHONY`, not all of GNU make. The optional debugger is a
  gdb-like front end on the lab's interpreter with a subset of commands. Sanitizer checks
  come from the interpreter, so `-fsanitize=address` turns on the lab's checks
  rather than real ASan instrumentation. Pointers are reported as 8 bytes
  (x86-64); if the C toolchain targets 32-bit wasm, the lab must still present
  x86-64 sizes or the level must say so (open toolchain question).

---

## 1.4 — Run Anything

- **Region / NPC:** Process District / init, the Watchdog · **Tracks:** `userland` · **Time:** ~18 min · **Prerequisites:** `c-build-warnings`, `sys-shell-basics` · **Skills unlocked:** `proc-lifecycle`, `sys-errno`

### Scene

> **init:** Welcome to the Process District. My home. Look at it. Empty doorways. Nobody running.
>
> **init:** Your shell can do four tricks. A real shell can run _anything_. Here's how every process in this city was born.
>
> **init:** First, a process copies itself. That's `fork`. Two of you, each with a copy of the same memory, same code. Only the return value differs: the child gets 0.
>
> **init:** Then the copy becomes something else. That's `exec`. Same process ID, brand-new program.
>
> **init:** And the parent waits for the child to finish. That's `wait`. A finished child who isn't waited for becomes a _zombie_. It's dead, but it still holds its place in the process table.
>
> **The Watchdog:** Zombies. Ugh. I've seen whole districts full of them. Wait for your children, kid.
>
> **init:** When nobody waits, I end up adopting them. I'm old. Please don't make me.

### See it (X-ray)

The **processes view** unlocks. init runs `ls` from the rescue shell, as the player
did all through the Survey, and asks: "You ran `ls` a dozen times. Who started
it?" The view shows the process tree: `init(1)` → `rescue(300)`. Then:

1. `fork` returns twice: a second box appears with a new PID, labeled `rescue`,
   and the syscalls view shows `clone(...) = 412` in the parent and `= 0` in the
   child.
2. `execve("/bin/ls", ...)` in the child: the box keeps its PID but its label
   changes to `ls`.
3. `ls` writes its output and calls `exit_group(0)`. The box turns grey with a
   `Z` badge: a zombie.
4. The parent's `wait4` returns 412 and the box disappears: reaped.

A slow-motion replay button lets the player watch each step again with the
`task_struct` fields that changed (`pid`, `comm`, `state`, `exit_code`).

Three more short beats in the replay:

- **The exit status travels back.** `ls` called `exit_group(0)`; the parent's
  `wait4` fills an `int status`, and `WIFEXITED(status)` / `WEXITSTATUS(status)`
  read the 0 back out. A shell keeps it as `$?`, and has two numbers of its own:
  127 for "command not found", 128 + n for "killed by signal n" (1.8).
- **Errors come back as numbers.** init runs `nosuch`. The syscalls view shows the
  kernel's answer to `execve` as `-ENOENT`; the C library turns it into `-1` and
  sets `errno` to `ENOENT` (2). `strerror()` turns that into "No such file or
  directory".
- **Each process has its own memory** (about a minute). Right after `fork`, the
  memory panel shows the same variable at the same address in parent and child.
  The child changes it; the parent's copy doesn't move. Same address, different
  memory: each process has its own **virtual address space**, and `fork` gives the
  child a copy (Linux shares the pages until one side writes: _copy-on-write_).
  This beat backs the `address-space` card; the skill (`mem-address-spaces`) is
  earned in 2.5, where the driver must cross from the kernel into a process's
  memory.

The syscalls view is the X-ray name for these calls. In 1.5 the player gets the
same view as text, from a real tool: `strace`.

### Build it

- **Starter provides (partial):** the player's `ksh-lite` so far (or the reference)
  with a new `run_external(char **argv)` stub that `dispatch()` already calls when
  no builtin matches.
- **Player writes:** `run_external()`: `fork()`; in the child, `execvp(argv[0],
  argv)`, and if it returns, print `ksh-lite: <name>: command not found` (for
  `ENOENT`) or `ksh-lite: <name>: <strerror(errno)>` and `_exit(127)`; in the
  parent, `waitpid(pid, &status, 0)` and remember the exit status. Handle `fork()`
  failing. `exit` with no argument now exits with the last command's status.
- **Checker verifies (behavior):**
  - `ls /` prints the root directory listing, and the next prompt appears only
    after all of `ls`'s output.
  - `/bin/echo a b` prints `a b` (a path with a slash runs directly).
  - `nosuch` prints the not-found message on stderr; afterwards exactly one
    `ksh-lite` process exists (no second shell).
  - `false` followed by `exit` ends the shell with status 1; `true` then `exit`
    with 0; `nosuch` then `exit` with 127.
  - After 10 commands, `ksh-lite` has no zombie children in the process table.
  - When the lab makes `fork()` fail with `EAGAIN`, the shell prints an error and
    keeps running.

### Watch it

**Predict:** before running a small `fork` demo, the player says how many lines it
prints and what the child's copy of `count` holds after the child adds one. The run
and the memory panel show the answer.

```
ksh$ ls /
bin  dev  etc  home  proc  sys  tmp  usr
ksh$ nosuch
ksh-lite: nosuch: command not found
```

Each command the player runs appears as a small figure walking out of the shell's
house, doing its job, and walking back to be counted. The Process District's
streets fill with people. In the processes view, the tree under `ksh-lite` grows and
shrinks with each command. init, quietly: "No zombies. Good."

### Debrief

> **init:** The streets have people again. Let's send one somewhere. Type `cd /tmp`.
>
> **init:** `ksh-lite: cd: command not found`. Of course: there's no `cd` program to run. And there can't be.
>
> **The Watchdog:** People walking around with no address. Lost, the lot of them.
>
> **init:** Every process carries a few things of its own: where it stands, what it's called. Tomorrow I'll show you where the Kernel keeps them, and how to read them.

### Hints

1. Nudge: "After `fork()`, the same code runs in two processes. How does each one
   know which one it is?"
2. Concept: "`fork()` returns the child's PID to the parent and 0 to the child. The
   child calls `execvp`; if `execvp` returns at all, it failed. The parent calls
   `waitpid` on the child's PID and reads the status with `WIFEXITED` and
   `WEXITSTATUS`."
3. Point at the spot: "Look at what your child does when `execvp` fails. If it
   doesn't call `_exit`, it falls back into your shell's main loop, and now there
   are two shells reading the same terminal."

### Codex (chapter: Process District)

- **fork** (`fork`, deepens: `shell`)
  - **Simple:** a process makes a copy of itself; the copy is its child. Every
    command a shell runs starts this way.
  - **Deep:** the child gets a copy of the caller's memory, open files and signal
    handlers. Linux shares the memory pages copy-on-write: both point at the same
    pages until one side writes. `fork()` returns the child's PID in the parent and
    0 in the child, or -1 with `errno` (`EAGAIN`, `ENOMEM`). glibc's `fork()` uses
    the `clone` syscall, which is why traces show `clone`. — man 2 `fork`, man 2
    `clone` — `kernel/fork.c` (`kernel_clone()`, `copy_process()`).
- **execve** (`execve`, deepens: `arguments`)
  - **Simple:** a process swaps its program for another one; same PID, new
    program, with the arguments you pass.
  - **Deep:** `execve(path, argv, envp)` copies `argv` and `envp` onto the new
    program's stack; memory, code and stack are replaced; open file descriptors stay
    open (unless marked close-on-exec). It only returns on error. `execvp` is a
    library wrapper that searches `PATH`. Real Linux loads ELF files with
    `load_elf_binary()`. — man 2 `execve`, man 3 `exec` — `fs/exec.c`
    (`do_execveat_common()`, `bprm_execve()`), `fs/binfmt_elf.c`.
- **wait / zombies** (`wait`)
  - **Simple:** a parent collects its finished child; until it does, the child is
    a zombie.
  - **Deep:** a process that exits keeps its process-table entry, state `Z`, until
    its parent collects the exit status with `wait`/`waitpid` (the `wait4`
    syscall). If the parent dies first, the child is re-parented to init (or a
    subreaper), which reaps it. — man 2 `waitpid`, man 2 `wait4` —
    `kernel/exit.c` (`do_exit()`, `do_wait()`).
- **Exit status** (`exit-status`)
  - **Simple:** a number from 0 to 255 a program leaves behind; 0 means success.
  - **Deep:** `exit(n)`, `_exit(n)` or returning `n` from `main` ends the process
    with `n & 0xff`. The parent's `waitpid` gets a packed `int status`:
    `WIFEXITED(status)` is true for a normal exit and `WEXITSTATUS(status)` gives
    `n`; `WIFSIGNALED`/`WTERMSIG` say a signal killed it (1.8). Shells store it in
    `$?` and add conventions of their own: 127 "command not found", 126 "found
    but not executable", 128 + n "killed by signal n". `_exit` ends the process
    at once; `exit` first runs `atexit` handlers and flushes stdio buffers, which
    a forked child must not do twice. — man 2 `waitpid`, man 2 `_exit`, man 3
    `exit` — `kernel/exit.c` (`do_group_exit()`, `wait_task_zombie()`).
- **errno** (`errno`)
  - **Simple:** when a syscall fails, `errno` says why.
  - **Deep:** inside the kernel a failing syscall returns a negative error number
    (`-ENOENT`). The C library wrapper returns `-1` and stores the positive number
    in `errno`. Check the return value first; `errno` is only meaningful after a
    failure. `strerror()` gives the message. — man 3 `errno`, man 3 `strerror` —
    `include/uapi/asm-generic/errno-base.h`.
- **Virtual address space** (`address-space`)
  - **Simple:** every process has its own private memory, even at the same
    addresses.
  - **Deep:** each process sees its own range of addresses; the kernel maps them
    to real memory through page tables (Act III), so the same address in two
    processes can hold different data. `/proc/<pid>/maps` lists a process's
    regions. 2.5 puts the idea to work. — man 5 `proc_pid_maps` —
    `include/linux/mm_types.h` (`struct mm_struct`).

### Real-world card

```c
#include <stdio.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void)
{
	pid_t pid = fork();

	if (pid < 0) {
		perror("fork");
		return 1;
	}
	if (pid == 0) {
		execlp("ls", "ls", "-l", (char *)NULL);
		perror("execlp");
		_exit(127);
	}
	int status;

	if (waitpid(pid, &status, 0) < 0) {
		perror("waitpid");
		return 1;
	}
	printf("child %d exited with %d\n", pid, WEXITSTATUS(status));
	return 0;
}
```

Run `nosuch; echo $?` in bash (127). To see a zombie:
`bash -c 'sleep 1 & exec sleep 30' &` makes a parent that never waits; after a
second, `ps -e -o pid,ppid,stat,comm | grep sleep` shows the child with state `Z`.
After 1.5, come back and run the program under `strace -f ./a.out` to find the
`clone`, `execve` and `wait4` lines.

### Taint

- **Zombies left behind** (no `waitpid`, or waiting for the wrong PID): fails the
  objective; any zombie that survives to the end of the level also adds +2.
- **Calling `exit()` instead of `_exit()` in the child after `execvp` fails:** +1.
  `exit()` flushes stdio buffers copied from the parent, so buffered text prints
  twice. How it's observed: the checker runs one scripted pass with the shell's
  stdout on a pipe, so the lab's C library fully buffers it, as glibc does when
  stdout isn't a terminal; the prompts sit in the buffer at `fork`. A child that
  calls `exit()` after a failed `execvp` then makes a `write(1, …)` of the
  parent's buffered bytes before `exit_group`: the event stream shows a `write` on
  fd 1 from the child's PID, and the pipe receives the prompts twice. This needs
  stdio buffering in the lab's C library; until it has it, the rule is off and the
  debrief only plays a recording of the effect.
- **Ignoring `fork()`'s return value:** +2. A failed `fork` returns -1; treating it
  as a PID and calling `waitpid(-1, ...)` waits for any child, which is a different
  thing entirely.
- **Running commands through `system()` or `/bin/sh -c`:** +3, and the processes
  view shows the extra shell. It works, but you didn't build it.

### Fidelity

- **Faithful:** `fork`/`execve`/`wait4` semantics and return values; errno values
  (`ENOENT` 2, `EACCES` 13, `EAGAIN` 11); zombie and reparenting behavior; exit
  status encoding (`WIFEXITED`, `WEXITSTATUS`); shell conventions 127 and 128 + n;
  `clone` appearing in traces instead of `fork`; glibc's buffering rule (line
  buffered on a terminal, fully buffered otherwise), once the lab's C library has
  it.
- **Simplified:** the lab copies process memory on `fork` instead of using
  copy-on-write pages (X-ray still explains copy-on-write). The lab's `clone`
  supports only the flags glibc's `fork()` uses. `execve` loads the lab's own
  program format, not real ELF; X-ray names `load_elf_binary` as what real Linux
  does.

---

## 1.5 — An Address and a Name

- **Region / NPC:** Process District / init, the Watchdog · **Tracks:** `userland`, `debug` · **Time:** ~25 min · **Prerequisites:** `proc-lifecycle`, `io-fs-hierarchy` · **Skills unlocked:** `proc-state-procfs`, `dbg-strace`

### Scene

> **init:** People are walking the streets again. But they're lost. No addresses, no names.
>
> **init:** Every process carries a few things of its own. Where it stands: its _current working directory_. What it's called and what it knows: its _environment variables_.
>
> **init:** Children get a copy of both when they're born. But a copy is a copy. If a child moves house, the parent doesn't move.
>
> **init:** That's why `cd` can't be a program. You used mine all through the Survey; it was the rescue shell itself calling `chdir`. Now build your own.
>
> **The Watchdog:** And while you're at it, learn to read the house records. `/proc`. Everything about a process, written down while it runs.
>
> **init:** He's right for once. The Kernel keeps a file for every process, and you can just read it. And when the records aren't enough, you can watch a process live, call by call. That tool is `strace`.

### See it (X-ray)

Processes view plus a `/proc/<pid>` inspector panel, the same `status` file the
player read in S.3, now explained field by field. init runs a provided program,
`movehouse`, that calls `chdir("/tmp")` and then sleeps:

- The child's `cwd` field changes to `/tmp`; the rescue shell's stays `/home/you`.
- The inspector shows `/proc/<pid>/cwd -> /tmp` for the child only.
- While the child sleeps, `/proc/<pid>/status` shows `State: S (sleeping)`. When it
  exits and before it's reaped, `State: Z (zombie)`.

Then the environment: init runs `env` and the view shows the `envp` array copied
into the new program at `execve`. One more exact detail: `/proc/<pid>/environ`
shows the environment the program _started_ with; later `setenv` calls don't
change it.

Last, **`strace`**, the syscalls view as text. init runs `strace ./movehouse` and
the same calls X-ray drew since the Prologue scroll by, one per line, with
arguments, return values and errors:

```
execve("./movehouse", ["./movehouse"], ...) = 0
chdir("/tmp")                               = 0
clock_nanosleep(CLOCK_REALTIME, 0, {tv_sec=30, tv_nsec=0}, ...
```

(Current glibc's `sleep()` uses `clock_nanosleep`; the line stays open while the
process sleeps.)

`strace -f` follows children too, `-e trace=chdir` shows only the calls named.
Clicking a line highlights the same moment in X-ray.

### Build it

- **Starter provides (stub):** the player's `ksh-lite`; `ksh.h` declares
  `int expand_words(char **words)`, not yet called. The player adds the builtin
  rows (1.2's table) and wires the expansion in.
- **Player writes:**
  - `cd [dir]`: `chdir(dir)`, or `$HOME` with no argument. On error print
    `ksh-lite: cd: <dir>: <strerror(errno)>`.
  - `pwd`: `getcwd()` and print it.
  - `export NAME=value`: `setenv()`.
  - Expansion in `split_line`'s output: a word that is exactly `$NAME` becomes the
    variable's value (or disappears if unset), `$$` becomes the shell's PID, and `$?`
    becomes the last exit status.
- **Player does (with `strace`):** init's old `lamplighter` program, in
  `/home/you/lamp/`, exits with status 1 and prints nothing. The player runs it
  under `strace` from their own shell, finds the failing line,

  ```
  openat(AT_FDCWD, "wick.txt", O_RDONLY) = -1 ENOENT (No such file or directory)
  ```

  sees that the path is relative (resolved from the cwd), uses their new `cd` to
  stand in `/home/you/lamp`, and runs it again: `lamp lit`.
- **Checker verifies (behavior):**
  - `cd /tmp` then `pwd` prints `/tmp`; the lab confirms the shell's own cwd is
    `/tmp`; `ls` then runs in `/tmp`.
  - `cd` alone goes to `$HOME`.
  - `cd /nope` prints `ksh-lite: cd: /nope: No such file or directory` and the cwd
    is unchanged; `cd /etc/motd` prints `Not a directory`.
  - `export GREETING=hi` then `printenv GREETING` prints `hi` (a child sees it).
  - `echo $GREETING` prints `hi`; `echo $$` prints the shell's PID;
    `false` then `echo $?` prints `1`.
  - `cat /proc/$$/status` shows the shell's own record, with `State: S (sleeping)`
    (the shell is waiting in `waitpid` while `cat` runs) and `PPid:` equal to the
    rescue shell's PID.
  - `strace` ran `lamplighter` at least once (the lab's event stream shows the
    traced run and its `-ENOENT`), and a later `lamplighter` run exits 0 with the
    shell's cwd at `/home/you/lamp`.

### Watch it

**Predict:** before running `strace ./lamplighter`, which call will fail, and with
which error? Then the trace shows the `openat` and its `ENOENT`.

```
ksh$ cd /tmp
ksh$ pwd
/tmp
ksh$ export GREETING=hi
ksh$ printenv GREETING
hi
ksh$ grep -e State -e PPid /proc/$$/status
State:	S (sleeping)
PPid:	300
```

(`ksh-lite` has no quoting, so the pattern is given as two `-e` options.)

Houses in the Process District get glowing house numbers (their cwd) and name
plates (their environment). When the player runs `cd`, the shell's figure walks to
a new house on the map. init: "And you didn't take anyone else's house with you.
Good manners."

### Debrief

> **init:** Addresses, names, and a way to read anyone's records. Now let's keep one. Type `ls > list.txt`.
>
> **init:** `ls: cannot access '>': No such file or directory`. Your shell handed `>` to `ls` as a word, and `ls` went looking for a file by that name.
>
> **The Watchdog:** Sending output into a file isn't `ls`'s job. It's the shell's.
>
> **init:** Then you need to see where a process's output really goes. That's kept in the Archive. Come.

### Hints

1. Nudge: "Which process needs to change directory: the shell, or a child? For
   `lamplighter`: which call in the trace returned `-1`?"
2. Concept: "A builtin runs inside the shell process itself, so `chdir()` there
   changes the shell's cwd, and every later child inherits it. `setenv()` changes
   the shell's environment, and `execvp` passes the current environment to the
   child."
3. Point at the spot: "In your `cd` function, check `argv[1]`: if it's `NULL`, use
   `getenv("HOME")`. Then check `chdir()`'s return value and print `strerror(errno)`
   when it's -1."

### Codex (chapter: Process District)

- **Current working directory** (`cwd`, deepens: `command`)
  - **Simple:** where a process stands; relative paths start from there.
  - **Deep:** `chdir()` changes it for the calling process only; children inherit
    a copy at `fork`. That's why `cd` must be a shell builtin. The kernel keeps it
    in the process's `fs_struct` (`pwd`). — man 2 `chdir`, man 3 `getcwd` —
    `fs/open.c` (`chdir`), `fs/d_path.c` (`getcwd`), `include/linux/fs_struct.h`.
- **A process's environment** (`process-environment`, deepens: `environment`)
  - **Simple:** a list of `NAME=value` strings every process carries, `PATH`
    among them.
  - **Deep:** the kernel copies it into a new program at `execve`, next to
    `argv`; after that it's ordinary user memory managed by the C library
    (`getenv`, `setenv`). A child gets the parent's current list. — man 7
    `environ`, man 3 `setenv`, man 3 `getenv` — `fs/exec.c` (`copy_strings()`).
- **`/proc/<pid>`** (`proc-pid`, deepens: `procfs`)
  - **Simple:** one folder per process, written by the Kernel when you read it.
  - **Deep:** `status` (state, parent, IDs, signal masks), `cwd` and `exe`
    (symlinks), `cmdline` and `environ` (both NUL-separated), `fd/`. Each file is
    printed from the process's `task_struct` at read time; nothing is stored on
    disk. — man 5 `proc` — `fs/proc/base.c`, `fs/proc/array.c`
    (`proc_pid_status()`).
- **Process state** (`process-state`, deepens: `process-states`)
  - **Simple:** the letter that says what a process is doing right now.
  - **Deep:** `R` running or runnable, `S` sleeping (waiting for something), `D`
    uninterruptible sleep, `T` stopped, `Z` zombie. — man 5 `proc`
    (`/proc/pid/stat`, field 3) — `fs/proc/array.c` (`task_state_array`).
- **strace** (`strace`)
  - **Simple:** runs a program and prints every syscall it makes, as text.
  - **Deep:** each line is `name(arguments) = result`, with `-1 ENAME (message)`
    on failure. `-f` follows child processes, `-e trace=` filters, `-c` counts,
    `-p` attaches to a running process. It's built on `ptrace`, which stops the
    traced process at every syscall entry and exit. — man 1 `strace`, man 2
    `ptrace` — `kernel/ptrace.c`.

### Real-world card

```sh
cat /proc/$$/status | head      # your shell's own record
ls -l /proc/$$/cwd              # where your shell stands
tr '\0' '\n' < /proc/$$/environ | head
sh -c 'cd /; pwd'; pwd          # the child moved, you didn't
strace -e trace=openat cat /nosuch   # find the failing call
strace -f -e trace=clone,execve,wait4 sh -c 'ls; echo done'
```

Run `sleep 60 &` and then `cat /proc/$!/status | grep State` to see a sleeping
process.

### Taint

- **Implementing `cd` as a child process:** the objective fails, and the debrief
  shows why with X-ray.
- **Ignoring `chdir()` errors** (silently staying put): +1. Users deserve to know.
- **Writing to `environ` directly instead of `setenv()`:** +1. The C library owns
  that array; editing it by hand is easy to get wrong.
- **Leaking expanded strings** (expansion `malloc`s and never frees): +1 per site.

### Fidelity

- **Faithful:** `chdir`/`getcwd` semantics and errors (`ENOENT` 2, `ENOTDIR` 20,
  `EACCES` 13); inheritance across `fork` and `execve`; the format of
  `/proc/<pid>/status` lines shown (`State:`, `PPid:`, tab-separated); the
  "environ shows the starting environment" behavior.
- **Simplified:** `/proc/<pid>/status` shows only the fields Act I uses (`Name`,
  `State`, `Tgid`, `Pid`, `PPid`, `Uid`, `Gid`, `FDSize`, the `Sig*` masks); the rest
  are omitted and the debrief says so. Golden-output tests check the fields that
  are present. No mount namespaces or `chroot`. The lab's `strace` is a built-in
  tool that reads the lab's event stream, not a `ptrace`-based program; its output
  format follows real `strace`.

---

## 1.6 — Into the Archive

- **Region / NPC:** Process District, the Archive / init · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `proc-lifecycle`, `io-permissions` · **Skills unlocked:** `io-fd-table`, `io-read-contract`, `io-redirect-dup`, `c-bit-flags`

### Scene

> **init:** This is the Archive. Every file in the Machine is kept here. And every process has a little ticket book.
>
> **init:** Each ticket is a small number: a _file descriptor_. Ticket 0 is where you read from: standard input. 1 is where you write: standard output, which here is your terminal. 2 is where you complain: standard error.
>
> **init:** Your programs don't know what's behind a ticket. The terminal, a file, a pipe. They just read and write. "Everything is a file," as the old saying goes.
>
> **init:** So to send `ls`'s output into a file, you don't change `ls`. You swap ticket 1 before `ls` starts.
>
> **The Watchdog:** And give back tickets you don't need. Processes with pockets full of tickets. Messy.
>
> **init:** The tool for swapping is `dup2`. Copy one ticket onto another number.

### See it (X-ray)

The **files view** unlocks: for each process, an fd table (rows 0, 1, 2, …) with
arrows to `struct file` objects (with offset and flags) and from those to inodes.
init runs `ls > list.txt` in the reference shell:

1. After `fork`, the child's fd table is a copy: 0, 1 and 2 point at the terminal.
2. `openat(AT_FDCWD, "list.txt", O_WRONLY|O_CREAT|O_TRUNC, 0666) = 3`: a new row 3
   pointing at a new `struct file` for `list.txt`.
3. `dup2(3, 1) = 1`: row 1's arrow moves to the file. The terminal's `struct file`
   loses one reference.
4. `close(3) = 0`: row 3 disappears; the file is still reachable through row 1.
5. `execve("/bin/ls", ...)`: the table survives the exec unchanged. `ls` writes to
   fd 1 and has no idea it's a file.

Then init runs `cat out.txt`, the same `openat`/`read`/`write` the player watched
in S.1, and points at the **read contract**: `read` may return fewer bytes than
asked, each read moves the file offset, and a return of `0` means end of file.
Every `read` in Linux, including the driver you'll write in Act II, keeps this
promise. It is the same promise the Prologue's `write` made from the other side: a
count that may be short.

### Build it

- **Starter provides (stub):** the player's `ksh-lite`; `ksh.h` declares
  `struct redirect` (input and output file names, and whether output appends) and
  `int parse_redirects(char **words, struct redirect *r)`.
- **Guided step: the flags word** (about 3 minutes, in X-ray, before the code).
  `openat` in step 2 above got one number for "how": `0x241`. The flags panel
  shows it as a row of bits and lights the three that are set: `O_WRONLY` (`01`),
  `O_CREAT` (`0100`), `O_TRUNC` (`01000`, all octal). One integer, many yes/no
  options, one per bit: **set** with `|`, **test** with `&`, **clear** with `& ~`.
  The player then builds `>>`'s word by clicking bits (`O_WRONLY | O_CREAT |
  O_APPEND`, `O_APPEND` being `02000`) and the panel prints `0x441`. The `mode`
  argument is a separate number: `0666` asks for `rw-rw-rw-`, and the process's
  _umask_ (`022` here) clears the group and other write bits, so the file is made
  `0644`.
- **Player writes:** parse `>` `file`, `>>` `file` and `<` `file` (as separate
  words) out of the word list before running a command; in the child, after `fork`
  and before `execvp`, open the file with the flags from the guided step
  (`O_WRONLY | O_CREAT` plus `O_TRUNC` for `>` or `O_APPEND` for `>>`, with mode
  `0666`; `O_RDONLY` for `<`), `dup2` it onto 1 or 0, and `close` the original. On
  error, print `ksh-lite: <file>: <strerror(errno)>` and `_exit(1)`. Redirection
  applies to external commands; redirecting builtins is a stretch goal.
- **Checker verifies (behavior):**
  - `echo hi > out.txt` creates `out.txt` with contents `hi\n` and mode `0644`
    (`0666` with the lab's umask `022` cleared).
  - `echo bye > out.txt` leaves only `bye\n` (the file is truncated).
  - `echo a >> log.txt` twice leaves `a\na\n`: `>>` creates the file if missing and
    never truncates it.
  - `wc -l < /etc/motd` prints the line count.
  - `sort < names.txt > sorted.txt` works with both at once.
  - `cat < missing.txt` prints `ksh-lite: missing.txt: No such file or directory`,
    `$?` is 1, and the shell continues.
  - `echo x > /etc/locked` prints `Permission denied`: the kernel's permission
    check from S.2, now reported by the player's own error path.
  - After each command, the shell's own fds 0, 1, 2 still point at the terminal.
  - At every `execve`, the child holds only fds 0, 1 and 2 (no leaked fd 3).

### Watch it

**Predict:** which fds does the child running `ls > out.txt` hold at `execve`, and
where does each point? The files view then shows the table.

```
ksh$ echo hi > out.txt
ksh$ cat out.txt
hi
ksh$ ls -l out.txt
-rw-r--r-- 1 you you 3 Jan  1 00:00 out.txt
```

The Archive's doors open. Each redirect shows a clerk taking a ticket from the
process's book and stapling it to a drawer. Files the player writes appear as new
drawers. In the files view, the player's own shell keeps a tidy table of three
rows.

### Debrief

> **init:** Files written, files read. Now the trick I've been waiting for. Type `ls / | wc -l`.
>
> **init:** `ls: cannot access '|': No such file or directory`, and the same for `wc`. Your `ls` went looking for files called `|` and `wc`.
>
> **The Watchdog:** You've seen it done. That old recording, before the Kernelfall: water running from `ls` into `wc`.
>
> **init:** Two processes, one connected to the other. Tomorrow we dig the aqueducts.

### Hints

1. Nudge: "`ls` writes to fd 1. Can you make fd 1 mean something else before `ls`
   starts?"
2. Concept: "`open()` returns the lowest free fd, usually 3. `dup2(oldfd, newfd)`
   makes `newfd` refer to the same open file as `oldfd`. Do it in the child,
   between `fork` and `execvp`, so the shell's own table is untouched."
3. Point at the spot: "After `dup2(fd, 1)`, you have two rows pointing at the file.
   Look at the X-ray files view of your child at `execve`: which row should be gone?"

### Codex (chapter: Process District)

- **File descriptor** (`file-descriptor`, deepens: `file-descriptors`)
  - **Simple:** a small number a process uses to name an open file; 0, 1 and 2
    are standard input, output and error.
  - **Deep:** the number indexes the process's table of open files. Each entry
    points at a `struct file` (the open file, with its offset and flags), which
    points at the inode (the file itself). `fork` copies the table; `execve` keeps
    it. — man 2 `open`, man 2 `close`, man 3 `stdin` — `fs/file.c`,
    `include/linux/fdtable.h` (`struct fdtable`), `include/linux/fs.h`
    (`struct file`).
- **open** (`open`)
  - **Simple:** asks the Kernel for a file and gets back the lowest free fd.
  - **Deep:** `open(path, flags, mode)`: `O_CREAT` creates the file with
    `mode & ~umask`; `O_TRUNC` empties it; `O_APPEND` makes every write go to the
    end. glibc's `open()` uses the `openat` syscall. The kernel tests the flags
    with `&` (`do_open()` checks `open_flag & O_TRUNC`, and clears it with
    `&= ~O_TRUNC` when `O_CREAT` really made the file). — man 2 `open`, man 2
    `umask` — `fs/open.c` (`do_sys_openat2()`), `fs/namei.c` (`path_openat()`,
    `do_open()`).
- **Bit flags** (`bit-flags`)
  - **Simple:** one number holding many yes/no switches, one per bit.
  - **Deep:** set with `|`, test with `&`, clear with `& ~`. `O_WRONLY | O_CREAT
    | O_TRUNC` is built this way, and so are ioctl numbers (2.6). Use the names,
    not the numbers: some architectures give the `O_*` flags different values. —
    man 2 `open` — `include/uapi/asm-generic/fcntl.h`.
- **dup2** (`dup2`)
  - **Simple:** makes one fd number point where another one points.
  - **Deep:** `dup2(oldfd, newfd)` closes `newfd` if open, then makes it refer to
    the same `struct file` as `oldfd`; both share one offset. A shell does it in the
    child between `fork` and `execve`. — man 2 `dup2` — `fs/file.c` (`dup2`,
    `do_dup2()`).
- **The read contract** (`read-contract`, deepens: `write-syscall`)
  - **Simple:** `read` may give you less than you asked for, and `0` means the end.
  - **Deep:** `read(fd, buf, n)` returns how many bytes it read (maybe fewer than
    `n`), `0` at end of file, or `-1` with `errno`; `write` may likewise write
    fewer. Each call advances the file offset. Careful code loops until it has what
    it needs. In 2.5 you write the other side of this promise, for
    `/dev/lantern`. — man 2 `read`, man 2 `write` — `fs/read_write.c`
    (`vfs_read()`, `vfs_write()`).
- **"Everything is a file"** (`everything-is-a-file`, deepens: `ops-table`, `vfs`)
  - **Simple:** terminals, files, pipes, sockets and devices are all used with the
    same `read` and `write`.
  - **Deep:** every `struct file` carries a `const struct file_operations *f_op`,
    the ops table from 1.2. `vfs_read()` calls through it, so the same `read`
    reaches the terminal's code, a file system's or a driver's. — man 2 `read` —
    `include/linux/fs.h` (`struct file`, `struct file_operations`),
    `fs/read_write.c`.

### Real-world card

```sh
ls -l /proc/$$/fd                    # your shell's fd table
ls -l /proc/self/fd > fds.txt; cat fds.txt   # ls's fd 1 is fds.txt
strace -f -e trace=openat,dup2,close sh -c 'echo hi > out.txt'
strace -f -X raw -e trace=openat sh -c 'echo hi >> out.txt'   # the flags as a number
```

Old Unix shells redirected without `dup2`: `close(1)` then `open()`, relying on
"lowest free fd". It works, but `dup2` says what you mean.

### Taint

- **Leaked fds into children** (the original fd not closed after `dup2`): +1 per
  command. Programs inherit tickets they never asked for; a leaked pipe end can even
  hang a pipeline (next level).
- **Redirecting in the shell process and not restoring:** the objective fails; the
  shell's own output disappears into the file.
- **Creating files with mode `0777`:** +1. Data files shouldn't be executable; use
  `0666` and let the umask do its job.
- **Unchecked `open`/`dup2`:** +1 each.
- **Flags as a raw number** (`0x241` instead of `O_WRONLY | O_CREAT | O_TRUNC`):
  +0, with a note: it hides what you meant, and the values differ on some
  architectures.

### Fidelity

- **Faithful:** `open` flags and their bit values (asm-generic, as on x86-64), mode
  and umask; `O_APPEND` and `O_TRUNC` behavior; lowest-free-fd rule; `dup2` and
  `close` semantics; fd inheritance across `fork` and `execve`; errno values
  (`ENOENT` 2, `EACCES` 13, `EISDIR` 21, `EBADF` 9); `ls -l` permission format;
  `openat(AT_FDCWD, ...)` in traces.
- **Simplified:** the lab's VFS is an in-memory filesystem with no page cache, no
  hard links beyond what the levels use, and fixed timestamps. Only the `struct
  file` fields shown in X-ray (`f_pos`, `f_flags`, `f_mode`, refcount) are modeled.

---

## 1.7 — The Aqueducts

- **Region / NPC:** Process District / init, the Watchdog · **Tracks:** `userland` · **Time:** ~20 min · **Prerequisites:** `io-redirect-dup` · **Skills unlocked:** `io-pipes`

### Scene

> **init:** The houses can read and write. Now let's connect them. In the old days, water ran from house to house through aqueducts.
>
> **init:** Your world calls them _pipes_. One process writes into one end, another reads from the other end. The Kernel holds the water in between.
>
> **The Watchdog:** Last time someone built a pipe here, it froze. Reader waited forever. I had to bark for an hour.
>
> **init:** Because someone kept the write end open. A reader only sees the end of the water when _every_ write end is closed. Every single one.
>
> **init:** Remember that, and pipes are the most beautiful thing in Userland. `ls | wc -l`. Two small programs, one big idea.

### See it (X-ray)

Files view plus processes view. init runs `ls / | wc -l` in the reference shell:

1. `pipe2([3, 4], 0) = 0` (the C library's `pipe()`): a pipe object appears between
   the rows, with a read end (fd 3) and a write end (fd 4), and a buffer shown as a
   water tank.
2. Two `fork`s: both children inherit fds 3 and 4.
3. Child 1: `dup2(4, 1)`, closes 3 and 4, execs `ls`. Child 2: `dup2(3, 0)`,
   closes 3 and 4, execs `wc`. The parent closes 3 and 4.
4. `ls` writes; water fills the tank. `wc` reads; the tank drains.
5. `ls` exits; the write end's reference count drops to 0. `wc`'s next `read`
   returns 0 (end of file) and `wc` prints its count.

Then the bad version: init "forgets" to close fd 4 in the parent. The tank
empties, `wc` sits in `S (sleeping)` inside `read`, and an arrow points at the
parent's fd 4: "Still one writer. So the reader keeps waiting." (This is the
recording init played at the end of the Survey, now with the player's own shell
in it.) How the kernel puts `wc` to sleep, and wakes it, is a wait queue; you
build one for the Lantern in 2.10c.

Last, the other direction: `yes | head -n 1`. `head` prints one line and exits, so
the pipe has no reader left. `yes`'s next `write` gets no water through: the kernel
sends it the signal `SIGPIPE`, whose default action ends the process, and the
processes view shows `yes` "killed by signal 13". (With the signal ignored, the
`write` fails with `EPIPE` instead.) Signals get their own level next; this is the
first one the player meets.

### Build it

- **Starter provides (stub):** the player's `ksh-lite`; `ksh.h` declares
  `int run_pipeline(char ***stages, int n)`. Splitting on `|` and the rest is the
  player's.
- **Player writes:** split the word list on `|` into stages; for N stages create
  N-1 pipes; fork one child per stage; in each child, `dup2` the previous pipe's
  read end to 0 and the next pipe's write end to 1, close all pipe fds, apply any
  `<`/`>` redirection (first/last stage), and `execvp`. The parent closes all pipe
  fds and waits for every child. `$?` is the last stage's status.
- **Checker verifies (behavior):**
  - `ls / | wc -l` prints the right count.
  - `cat /etc/motd | grep kernel | wc -l` (three stages) works.
  - `sort < names.txt | uniq > out.txt` (pipes plus redirection) works.
  - `yes | head -n 1` prints `y` and finishes: `yes` is killed by `SIGPIPE` once
    `head` exits (the lab confirms the signal).
  - Every pipeline finishes within the lab's step budget; if a stage blocks
    forever, the checker reports which process still holds a write end.
  - `false | true` gives `$?` 0; `true | false` gives 1.
  - No zombies and no leftover pipe fds in the shell after each pipeline.

### Watch it

**Predict:** in init's "bad version", which process still holds a write end, and so
why does `wc` hang? The files view then draws the arrow.

```
ksh$ ls / | wc -l
8
ksh$ yes | head -n 1
y
```

Aqueducts appear between the houses of the Process District. Water flows from one
process to the next while a pipeline runs, and the tanks drain cleanly when it ends.
The Watchdog: "Huh. No freeze. Nice plumbing."

### Debrief

> **The Watchdog:** Did you see `yes` go? Nobody told it to stop. The Kernel rang a bell, and down it went.
>
> **init:** A signal. Bells like that ring all over the city: when a pipe breaks, when a child dies, when you press Ctrl-C.
>
> **The Watchdog:** Speaking of which. Run something long tomorrow and try to stop it. I want to watch.

### Hints

1. Nudge: "Draw it on paper first: which process writes into which pipe, and
   which reads from it?"
2. Concept: "Every process that holds a write end counts as a writer, including the
   shell itself. A reader gets end-of-file only when all writers have closed. So
   each process closes every pipe fd it doesn't use, and the parent closes them
   all."
3. Point at the spot: "If your pipeline hangs, open the files view on the stuck
   reader's pipe. The arrows into its write end show exactly who forgot to `close`."

### Codex (chapter: Process District)

- **Pipe** (`pipe`)
  - **Simple:** a one-way channel in the Kernel: one process writes in, another
    reads out.
  - **Deep:** `pipe(fds)` gives `fds[0]`, the read end, and `fds[1]`, the write
    end. Bytes come out in order. Reading an empty pipe blocks while any writer
    exists and returns 0 when none is left. The default capacity on Linux is
    65,536 bytes; a full pipe blocks the writer. A blocked reader sleeps in
    `pipe_read()` on the pipe's wait queue (`pipe->rd_wait`) until a writer wakes
    it (2.10c). — man 2 `pipe`, man 7 `pipe` — `fs/pipe.c` (`do_pipe2()`,
    `pipe_read()`, `pipe_write()`).
- **SIGPIPE** (`sigpipe`)
  - **Simple:** write to a pipe nobody reads, and the Kernel stops you with a
    signal.
  - **Deep:** when every read end is closed, `pipe_write()` sends the writer
    `SIGPIPE` (13), whose default action ends the process; a shell reports it as
    exit status 141 (128 + 13). If the process ignores or catches the signal, the
    `write` fails with `EPIPE` (32) instead. Sockets behave the same way (1.10). —
    man 7 `pipe`, man 7 `signal` — `fs/pipe.c` (`pipe_write()`).

### Real-world card

```sh
ls / | wc -l
strace -f -e trace=pipe,pipe2,dup2,close,execve bash -c 'ls / | wc -l'
yes | head -n 1; echo "${PIPESTATUS[@]}"   # 141 0: yes died of SIGPIPE (128+13)
```

Current glibc implements `pipe()` with the `pipe2` syscall (flags 0), so a real
trace shows `pipe2`; older glibc versions on x86-64 show `pipe`.

### Taint

- **Unclosed pipe fds that don't hang** (for example, a leaked read end): +1 per
  pipeline. Leaks that do hang fail the objective.
- **Waiting only for the last stage:** +2, and the earlier stages show up as
  zombies.
- **Using temporary files instead of pipes:** the objective's `yes | head` check
  never finishes, and the debrief explains why pipes stream and files don't.
- **Unchecked `pipe()`:** +1.

### Fidelity

- **Faithful:** pipe semantics (blocking, EOF when all writers close, `SIGPIPE` and
  `EPIPE` 32 with no readers, 65,536-byte default capacity, in-order bytes); the
  shell exit status convention 128 + signal number.
- **Simplified:** the lab schedules processes in a fixed, deterministic order, so
  the interleaving of a pipeline is the same every run. Writes of up to `PIPE_BUF`
  (4,096 bytes) are atomic as on Linux; the lab does not model pipe pages or
  `splice`.

---

## 1.8 — Alarm Bells

- **Region / NPC:** Process District / init, the Watchdog · **Tracks:** `userland` · **Time:** ~18 min · **Prerequisites:** `proc-lifecycle`, `io-pipes` · **Skills unlocked:** `proc-signals`, `sync-interleaving`

### Scene

> **The Watchdog:** Run `sleep 1000` in your shell. Go on. ...Now stop it.
>
> **The Watchdog:** Ha! You pressed Ctrl-C and your whole shell died with it. Not so tough now.
>
> **init:** He's teasing, but he's right. Ctrl-C rings a bell called a _signal_. `SIGINT`, number 2. The terminal rings it for every process in the foreground _process group_. Your shell is in that group too.
>
> **init:** A process can let the bell kill it (the default), ignore it, or _catch_ it with a handler. Your shell should survive; the program it's running should not.
>
> **The Watchdog:** And a handler is an interruption, not a tea party. Get in, set a flag, get out. No `printf` in there.
>
> **init:** One more secret. Ignored bells stay ignored, even after `exec`. Caught ones go back to default. Choose carefully.

### See it (X-ray)

Processes view plus a signals overlay. init runs `sleep 100` from the reference
shell and presses Ctrl-C:

1. The terminal shows `^C` (echo of the control character).
2. The terminal's line discipline sends `SIGINT` to the foreground process group:
   a bell icon flies to both the shell and `sleep`.
3. `sleep` has the default action, so it dies: `exit_group` never runs; its status
   says "killed by signal 2".
4. The shell has a handler: the view shows the kernel pausing `wait4`, running the
   handler, and `wait4` returning `-1 EINTR` (no `SA_RESTART`). The shell retries,
   reaps `sleep`, and prints a new prompt.

The inspector shows `/proc/<pid>/status` lines `SigIgn` and `SigCgt` as bitmasks
for both processes, with bit 1 (signal 2) highlighted.

### Build it

- **Starter provides (stub):** the player's own `ksh-lite`; `ksh.h` declares
  `extern volatile sig_atomic_t got_sigint;` and `void setup_signals(void);`,
  which nothing calls yet. Where the checks for `EINTR` go is the player's call.
- **Player writes:**
  - In the shell: in `setup_signals()`, install a `SIGINT` handler with
    `sigaction()` (no `SA_RESTART`)
    that only sets a `volatile sig_atomic_t` flag and writes a newline with `write()`.
  - Make the main loop handle `read()` returning -1 with `errno == EINTR`: discard
    the line and print a fresh prompt.
  - Make the wait loop retry `waitpid()` on `EINTR`.
  - In each child, before `execvp`, restore `SIGINT` to `SIG_DFL` if the shell ignores
    it (or rely on `execve` resetting caught signals, and know why that works).
  - `$?` becomes 128 + signal number for a child killed by a signal (use
    `WIFSIGNALED` and `WTERMSIG`).
- **Checker verifies (behavior):** the lab injects Ctrl-C into the terminal.
  - `sleep 100` then Ctrl-C: `sleep` is killed by `SIGINT`, the same shell PID
    prints a new prompt, and `echo $?` prints `130`.
  - Ctrl-C while typing `ech` at the prompt: the shell survives and shows a fresh
    prompt; the next command runs normally.
  - `sleep 100 | sleep 100` then Ctrl-C: both children die and are reaped.
  - `cat` (reading the terminal) then Ctrl-C: `cat` dies, the shell continues.
  - No zombies; Ctrl-D at the prompt still exits with status 0.

### Watch it

**Predict: the first race** (a beat to watch, nothing to build). A demo program
counts in its main loop with `count = count + 1`, and its `SIGINT` handler does the
same. The lab rings the bell at a chosen moment, between the main loop loading
`count` and storing it back. Before the run, the player predicts: after one pass of
the loop and one handler, is `count` up by 2? Then X-ray steps through it: the main
loop loads 5, the handler runs and stores 6, the main loop stores its old value
plus one: 6. One increment is lost. That is an **interleaving**: code can be
interrupted between any two instructions, and shared state breaks. Here the cure is
the one the player's shell already uses: keep the handler tiny, set a
`volatile sig_atomic_t` flag, and let the main loop do the work. 2.9 meets the same
race between two processes inside the Lantern.

```
ksh$ sleep 100
^C
ksh$ echo $?
130
```

Alarm bells go up on every street corner of the Process District. When the player
presses Ctrl-C, the bell rings, the runaway process stops, and the shell's house
stays lit. The Watchdog, grudgingly: "Fine. You can take a hit."

### Debrief

> **init:** Listen. Now that the bells are quiet, you can hear it. Out past the last street.
>
> **The Watchdog:** Ships' horns. Someone out at Socket Harbor is still trying to dock.
>
> **init:** And being turned away. Look. _(X-ray shows a visitor's `connect(3, {sa_family=AF_INET, sin_port=htons(7777), ...}, 16) = -1 ECONNREFUSED (Connection refused)`.)_ Nobody in the Machine is listening.
>
> **init:** Your shell talks to the city. Tomorrow, teach the city to answer the sea.

### Hints

1. Nudge: "Who receives the Ctrl-C bell? Look at the bell icons in X-ray: it's more
   than one process."
2. Concept: "The shell should catch `SIGINT`; the child should keep the default.
   A caught signal interrupts slow syscalls like `read` and `waitpid`, which then
   fail with `EINTR`. That's not an error to give up on; it's a reason to retry or
   re-prompt."
3. Point at the spot: "Look at your `waitpid` call. What does your code do when it
   returns -1 and `errno` is `EINTR`?"

### Codex (chapter: Process District)

- **Signal** (`signal`, deepens: `signals`)
  - **Simple:** a small bell the Kernel rings at a process; by default most bells
    end it.
  - **Deep:** an asynchronous notification: `SIGINT` (2) from Ctrl-C, `SIGKILL`
    (9, can't be caught or ignored), `SIGPIPE` (13, see `sigpipe`), `SIGTERM`
    (15), `SIGCHLD` (17 on x86). Each signal has a disposition: default, ignore,
    or a handler. `execve` resets handled signals to default but keeps ignored
    ones ignored. A child killed by a signal reports `WIFSIGNALED(status)` and
    `WTERMSIG(status)`; shells show 128 + n (`exit-status`). — man 7 `signal`,
    man 2 `sigaction`, man 2 `kill` — `kernel/signal.c` (`get_signal()`,
    `do_send_sig_info()`), `arch/x86/kernel/signal.c`.
- **Ctrl-C and the terminal** (`ctrl-c-tty`)
  - **Simple:** Ctrl-C isn't a key the program reads; the terminal turns it into
    `SIGINT`.
  - **Deep:** the terminal's line discipline turns the `INTR` character (Ctrl-C,
    when `ISIG` is set) into `SIGINT` for the whole foreground process group, and
    by default flushes the pending input line. Real shells use job control
    (`setpgid`, `tcsetpgrp`) to put each job in its own group. — man 3
    `termios`, man 2 `setpgid`, man 3 `tcsetpgrp` — `drivers/tty/n_tty.c`
    (`n_tty_receive_signal_char()`, `isig()`).
- **Async-signal-safe** (`async-signal-safe`)
  - **Simple:** a handler may run in the middle of anything, so it may do almost
    nothing.
  - **Deep:** a handler can run between any two instructions, even inside
    `malloc` or `printf`. Only functions on the async-signal-safe list (like
    `write` and `_exit`) may be called from it; the usual pattern is to set a
    `volatile sig_atomic_t` flag. The kernel has the same problem when an
    interrupt arrives (the Interrupt Spire, 2.10b). — man 7 `signal-safety`.
- **EINTR** (`eintr`)
  - **Simple:** "I was interrupted by a signal": try again, don't give up.
  - **Deep:** the error a blocking syscall returns when a caught signal interrupts
    it. `SA_RESTART` makes many syscalls restart automatically instead. Inside the
    kernel, the sleeping call returns `-ERESTARTSYS`, and signal delivery turns it
    into `EINTR` or a restart depending on that flag; your driver's blocking
    `read` does this in 2.10c. — man 7 `signal` ("Interruption of system calls
    and library functions by signal handlers") — `kernel/signal.c`,
    `arch/x86/kernel/signal.c`.
- **Interleaving** (`interleaving`)
  - **Simple:** code can be paused between any two steps, and whatever runs in
    between can change what it was working on.
  - **Deep:** `count = count + 1` is a load, an add and a store. A handler (or
    another CPU, or an interrupt) that runs between the load and the store makes
    one update vanish: a race. Keep shared work out of handlers, or protect it;
    2.9 brings locks for the same problem in the kernel. — man 7
    `signal-safety` — `Documentation/memory-barriers.txt` (background only).

### Real-world card

```sh
sleep 100            # press Ctrl-C; then:
echo $?              # 130 = 128 + 2
grep Sig /proc/$$/status   # your shell's signal masks
trap 'echo caught' INT     # make your shell catch it; press Ctrl-C
kill -l              # every signal and its number
```

### Taint

- **`printf` (or `malloc`, or anything not async-signal-safe) in the handler:** +2.
  It usually works in testing and deadlocks in production.
- **Ignoring `SIGINT` in children** (`SIG_IGN` inherited across `exec`): the
  objective fails, and X-ray shows the child's `SigIgn` mask.
- **Using `signal()` instead of `sigaction()`:** +0, with a note: `signal()`'s
  behavior differs between systems; `sigaction()` says exactly what you mean.
- **Treating `EINTR` as end of input** (the shell exits on Ctrl-C): the objective
  fails.
- **Catching `SIGINT` by busy-polling a flag in a loop:** +1.

### Fidelity

- **Faithful:** signal numbers on x86-64; default actions; `sigaction` flags used
  (`SA_RESTART`); `EINTR` (4) behavior for `read` on a terminal and `waitpid`;
  disposition rules across `fork` and `execve`; `^C` echo; `SigIgn`/`SigCgt`
  bitmask format in `/proc/<pid>/status`; exit status 128 + n.
- **Simplified:** no job control: `ksh-lite` and its children stay in one process
  group, which is why the shell must catch `SIGINT`. The debrief explains how real
  shells use process groups instead. Signals are delivered at the lab's
  deterministic scheduling points, not at arbitrary instructions (the race demo's
  point, between a load and a store, is placed there on purpose); `sigprocmask`,
  real-time signals and `SA_SIGINFO` are not modeled in Act I.

---

## 1.9 — The Lighthouse

- **Region / NPC:** Socket Harbor / the Harbormaster (the TCP/IP stack), init · **Tracks:** `net`, `userland` · **Time:** ~20 min · **Prerequisites:** `io-fd-table`, `proc-signals` · **Skills unlocked:** `net-sockets`, `net-stack-path`

### Scene

> **The Harbormaster:** Visitors! Mind the ropes. I'm the Harbormaster. Your world calls me the _TCP/IP stack_.
>
> **The Harbormaster:** I handle every ship coming in or out of the Machine: the handshakes, the queues, the lost cargo.
>
> **The Harbormaster:** But the lighthouse is dark. No process is _listening_. Ships come in and I have to turn them away. "Connection refused," over and over.
>
> **init:** Then we'll build a lighthouse. A server. A process that asks for a port and waits for ships.
>
> **The Harbormaster:** Four steps, sailor. `socket` gets you a hull. `bind` claims a berth: a port. `listen` lights the lamp. `accept` greets each ship that docks.
>
> **The Harbormaster:** One warning. TCP is a stream, not a stack of letters. Send "hello" and it might arrive as "hel" and then "lo". Buffer until you see the newline.

### See it (X-ray)

The **network view** unlocks: socket → TCP → IP → the loopback device, with packets
as boats. A small toll gate on the IP layer is labeled "netfilter hooks (Act II)".

First, one detail every ship's paperwork depends on: **byte order**. A port is a
16-bit number, two bytes. x86-64 stores numbers lowest byte first
(_little-endian_); network protocols send them highest byte first (_big-endian_,
called _network byte order_). Port 7777 is `0x1E61`: on the wire it must travel as
the bytes `1e 61`, but in an x86 variable it sits in memory as `61 1e`. `htons()`
("host to network, short") swaps the two bytes on a little-endian machine and does
nothing on a big-endian one; `ntohs()` swaps back. The memory panel shows both
layouts side by side. Forget the swap and the server asks for port `0x611E`, which
is 24862.

Then the Harbormaster runs a provided server and connects with `nc`:

1. `socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3`, then
   `bind(3, {sa_family=AF_INET, sin_port=htons(7777), sin_addr=inet_addr("0.0.0.0")}, 16) = 0`
   (that is how `strace` decodes a port already in network byte order), then
   `listen(3, 16) = 0`: a berth labeled 7777 lights up in state `LISTEN`.
2. The client's `connect`: three boats cross on the loopback device (SYN, SYN-ACK,
   ACK). A new connection waits in the accept queue.
3. `accept(3, ...) = 4`: the server gets a _new_ fd for this connection; fd 3 keeps
   listening.
4. The client sends `hello\n`; the lab splits it into two segments, `hel` and
   `lo\n`, and the server's two `read`s are shown separately.
5. The client closes: a FIN boat; the server's `read` returns 0.

### Build it

The player writes `harbor.c`, a single-client chat server, and adds a `harbor`
target to their `Makefile`.

- **Starter provides (partial, a new program):** `harbor.c` with an empty `main()`
  and an empty `serve_client(int fd)`, the `harbor` target skeleton, and `nc` in the
  lab. The game opens a second terminal pane for clients. The line buffering is the
  player's: the same "cut on `\n`" idea as 1.1's tokenizer, now over a stream.
- **Player writes:** `socket`, `setsockopt(SO_REUSEADDR)`, `bind` to port 7777 on
  all addresses, `listen`, and a loop: `accept` one client, send
  `welcome to the harbor\n`, read into a per-connection buffer, and for each complete
  line send back `harbor: <line>\n`; when `read` returns 0, close the connection and
  `accept` the next one. Lines longer than 511 bytes are cut into 511-byte pieces.
- **Checker verifies (behavior):**
  - `ss -tln` in the lab shows a `LISTEN` socket on port 7777 (not 24862: the
    port went through `htons`).
  - A client connecting gets `welcome to the harbor\n`.
  - `hello\n` sent in two segments (`hel`, `lo\n`) comes back as one
    `harbor: hello\n`.
  - Two lines in one segment (`a\nb\n`) come back as two replies.
  - A 2,000-byte line doesn't crash the server or overflow its buffer.
  - After the first client disconnects, a second client is served.
  - The server is stopped with `SIGTERM` while a client is connected and restarted at
    once: `bind` succeeds (thanks to `SO_REUSEADDR`, despite `TIME_WAIT`).

### Watch it

In the client pane:

```
$ nc localhost 7777
welcome to the harbor
hello
harbor: hello
```

The lighthouse at Socket Harbor turns on and sweeps the sea. The first ship docks:
init, who has connected from the other pane. The Harbormaster: "Haven't seen a
light on that tower since the Kernelfall."

### Debrief

> **The Harbormaster:** One ship docked. Now look behind it.
>
> **The Harbormaster:** _(in the client pane, the Watchdog connects too; nothing comes back, not even the welcome)_ That one's in, the handshake's done, and it's waiting in my queue. `ss` shows it: your berth's `Recv-Q` reads 1.
>
> **init:** Our server is talking to me, and asleep in my `read` for everyone else.
>
> **The Harbormaster:** One rope in your hand at a time. Tomorrow I'll teach you to hold them all.

### Hints

1. Nudge: "Before a ship can dock, you need a berth with a number on it. Which
   call claims the port?"
2. Concept: "`listen` turns a socket into a lamp; `accept` returns a brand-new fd
   for each connection. Read from the new fd, not the listening one. TCP has no
   message boundaries: keep a buffer, append what you read, and only handle the
   part up to each `\n`."
3. Point at the spot: "If your server only works when you type slowly, look at how
   you handle a `read` that ends in the middle of a line. Where do the leftover
   bytes go?"

### Codex (chapter: Socket Harbor)

- **Socket** (`socket`)
  - **Simple:** a network endpoint, used through a file descriptor like any file.
  - **Deep:** a TCP server calls `socket`, `bind`, `listen`, then `accept` for each
    connection; `accept` returns a new connected socket and the listening one keeps
    listening. `read` and `write` work on it, through the socket's own
    `file_operations`. — man 2 `socket`, man 2 `bind`, man 2 `listen`, man 2
    `accept`, man 7 `ip` — `net/socket.c` (`__sys_socket()`, `__sys_bind()`,
    `__sys_listen()`, `__sys_accept4()`, `socket_file_ops`),
    `net/ipv4/af_inet.c` (`inet_create()`, `inet_bind()`, `inet_listen()`).
- **Byte order** (`byte-order`)
  - **Simple:** networks send numbers biggest byte first; x86 stores them smallest
    byte first, so ports and addresses get swapped on the way out.
  - **Deep:** `htons`/`htonl` convert 16- and 32-bit values from host to network
    byte order (big-endian), `ntohs`/`ntohl` back. On a big-endian CPU they do
    nothing. `struct sockaddr_in`'s `sin_port` and `sin_addr` are always in
    network byte order. The kernel marks such values with the types `__be16` and
    `__be32`, which its static checker `sparse` enforces. — man 3 `byteorder`,
    man 7 `ip` — `include/uapi/linux/in.h`, `include/linux/byteorder/generic.h`.
- **TCP** (`tcp`)
  - **Simple:** a reliable, ordered stream of bytes between two sockets, with no
    message boundaries.
  - **Deep:** connections start with a three-way handshake (SYN, SYN-ACK, ACK) and
    end with FIN. Lost segments are resent and bytes arrive in order, but one
    `write` may arrive as several `read`s, or several as one. — man 7 `tcp` —
    `net/ipv4/tcp.c`, `net/ipv4/tcp_ipv4.c`, `net/ipv4/tcp_input.c`.
- **A packet's path** (`packet-path`, deepens: `network-stack`)
  - **Simple:** your bytes go down through TCP, then IP, then a network device,
    and come up the same way on the other side.
  - **Deep:** a `write` on a TCP socket queues data in the socket; TCP cuts it
    into segments, IP adds addresses and passes the packet through the netfilter
    hooks (where firewalls sit, 2.11), and a network device sends it; here the
    loopback device `lo` hands it straight back up the receive side. — man 7
    `tcp`, man 7 `ip`, man 8 `ip` — `net/ipv4/tcp_output.c`,
    `net/ipv4/ip_output.c`, `net/ipv4/ip_input.c`, `drivers/net/loopback.c`.
- **TIME_WAIT and SO_REUSEADDR** (`time-wait`)
  - **Simple:** a closed connection lingers for a minute; `SO_REUSEADDR` lets a
    restarted server take its port anyway.
  - **Deep:** the side that closes a TCP connection first keeps it in
    `TIME_WAIT` (60 seconds on Linux) so late packets don't confuse a new
    connection. Until then, `bind` to the same port fails with `EADDRINUSE` unless
    the socket sets `SO_REUSEADDR`. — man 7 `socket`, man 7 `tcp` —
    `net/ipv4/tcp_minisocks.c` (`tcp_time_wait()`), `include/net/tcp.h`
    (`TCP_TIMEWAIT_LEN`).

### Real-world card

```sh
nc -l 7777             # a one-line server (OpenBSD netcat syntax)
nc localhost 7777      # in another terminal; type and press Enter
ss -tlnp               # who is listening on which port
ss -tan state time-wait
sudo tcpdump -i lo -n port 7777   # watch the handshake on loopback
printf '%x\n' 7777     # 1e61: the two bytes htons puts on the wire
```

Build `harbor.c` with `make harbor` and run it on your real machine; the code is
plain POSIX.

### Taint

- **Assuming one `read` = one line:** fails the split-segment check.
- **No `htons` on the port:** fails the `LISTEN` check; the network view shows the
  berth numbered 24862 and the two bytes in the wrong order.
- **No `SO_REUSEADDR`:** the restart check fails with `EADDRINUSE`, and the
  network view shows the `TIME_WAIT` ghost holding the berth.
- **Unchecked socket calls:** +1 each.
- **Not closing a finished connection:** +1 per leaked fd; the files view shows them
  piling up.
- **Ignoring short writes from `write`/`send`:** +1. On a socket, `write` may send
  fewer bytes than asked; loop until all are sent.

### Fidelity

- **Faithful:** socket API names, signatures and errno values (`EADDRINUSE` 98,
  `ECONNREFUSED` 111, `ECONNRESET` 104, `EPIPE` 32); TCP state names as shown by `ss`;
  the handshake and FIN sequence; stream semantics; `TIME_WAIT` and
  `SO_REUSEADDR`; ports below 1024 need privilege (`EACCES`).
- **Simplified:** loopback only, one network namespace, no packet loss,
  retransmission or congestion control. Segment boundaries are chosen by the lab
  (deterministically) to exercise stream handling. `TIME_WAIT` lasts 60 simulated
  seconds. The `ss` output contains only the columns Act I uses.

---

## 1.10 — A Full Harbor

- **Region / NPC:** Socket Harbor / the Harbormaster (the TCP/IP stack), the Watchdog · **Tracks:** `net`, `userland` · **Time:** ~20 min · **Prerequisites:** `net-sockets` · **Skills unlocked:** `net-poll`

### Scene

> **The Harbormaster:** Your lighthouse works. One ship at a time. Look at the queue out there.
>
> **The Harbormaster:** While you're chatting with one ship, the rest wait in the dark. Your `read` is blocking. Your server sleeps on one fd and can't hear the others.
>
> **init:** We could fork a process per ship...
>
> **The Harbormaster:** Or you can watch every rope at once. `poll`: give the Kernel a list of fds, and it wakes you when any of them has something for you.
>
> **The Watchdog:** And don't just spin in a loop asking "anything? anything? anything?" I'll notice. Burning CPU for nothing makes me twitchy.
>
> **The Harbormaster:** One more thing: ships sink. If you write to one that's gone, you'll hear a bell, `SIGPIPE`, and its default is to sink _you_. Plan for it.

### See it (X-ray)

Network view plus the syscalls view. The Harbormaster runs a reference server with
three clients:

- The server sits in `poll([{fd=3, events=POLLIN}, {fd=4, ...}, {fd=5, ...},
  {fd=6, ...}], 4, -1)`; the process is shown as `S (sleeping)` with four ropes:
  the listening socket and three clients.
- A message on fd 5 tugs a rope: `poll` returns 1 with `revents=POLLIN` on fd 5. The
  server reads, writes to fds 4 and 6, and goes back to `poll`.
- A new ship arrives: `POLLIN` on the listening fd 3 means "accept is ready".
- A client vanishes mid-broadcast: the server's `write` gets `EPIPE` and the lab
  shows the `SIGPIPE` bell; the reference server ignores it and survives.

### Build it

- **Starter provides (stub):** the player's `harbor.c` from 1.9 and a `struct client`
  outline (fd, name, line buffer, used length).
- **Player writes:** up to 32 clients in an array of `struct client` and a matching
  `struct pollfd` array; a `poll` loop with timeout -1; accept new clients and name
  them `guest1`, `guest2`, … in arrival order; on a complete line from one client,
  send `<name>: <line>\n` to every other client; announce `* <name> joined` and
  `* <name> left`; remove clients whose `read` returns 0 or fails; ignore `SIGPIPE`
  (or use `send` with `MSG_NOSIGNAL`); turn away client 33 with `harbor full\n`.
- **Checker verifies (behavior):**
  - Three clients: a line from `guest1` reaches `guest2` and `guest3` as
    `guest1: <line>`, and not `guest1` itself.
  - `guest1` sends half a line, `guest2` sends a full line, then `guest1` finishes:
    both arrive whole and in that order.
  - A client that disconnects is announced as left and removed; its fd is closed.
  - A client that resets the connection while a broadcast is going out doesn't kill
    the server.
  - With no activity for 10 simulated seconds, the server makes no syscalls (it's
    blocked in `poll`).
  - The 33rd client gets `harbor full\n` and is closed; the others keep working.

### Watch it

```
$ nc localhost 7777
welcome to the harbor
* guest2 joined
guest2: is anyone out there?
guest3: yes! it's init
```

The harbor fills with ships. init, the Compiler Smith, the Watchdog and the
Harbormaster connect as scripted clients and talk on the player's server (the
Smith complains about the prices of iron; the Watchdog announces the time, every
time). The Kernel Map lights the whole of Userland. init: "Listen to that. The city
is talking again."

### Debrief

> **init:** Every street lit. A shell, a harbor, bells, aqueducts. And every one of those things went through the same door.
>
> **The Watchdog:** _(over the chat)_ guest3: there's a horn blowing at the edge of the map.
>
> **init:** The Syscall Gate. Every call you've made since the Prologue crossed it, and its keeper has been writing them down. The way down to the Kernel is behind it.
>
> **init:** He'll want to read your records before he lets anyone through. Let's make sure they're clean.

### Hints

1. Nudge: "Your server blocks in one `read`. What call lets you wait for many fds at
   once?"
2. Concept: "Put the listening fd and every client fd in a `struct pollfd` array with
   `events = POLLIN`. After `poll` returns, check each `revents`: on the listening fd,
   `accept`; on a client, `read`. A `read` of 0 means that client left. Each client
   needs its own line buffer, because half-lines from different ships must not mix."
3. Point at the spot: "If the server dies with no message when a client vanishes,
   check how it exited: killed by signal 13. Where do you handle `SIGPIPE`?"

### Codex (chapter: Socket Harbor)

- **poll** (`poll`)
  - **Simple:** hand the Kernel a list of fds and sleep until any of them is ready.
  - **Deep:** `poll(fds, n, timeout)` returns how many entries have events in
    `revents` (`POLLIN`: readable, `POLLOUT`: writable; `POLLHUP`, `POLLERR` and
    `POLLNVAL` are reported anyway). On a listening socket, `POLLIN` means
    `accept` won't block. Timeout -1 waits forever; a negative fd in the array is
    skipped. While waiting, the process sleeps on each fd's wait queue (2.10c). —
    man 2 `poll` — `fs/select.c` (`do_sys_poll()`, `do_poll()`).
- **select and epoll** (`select-epoll`)
  - **Simple:** the older and the faster cousins of `poll`.
  - **Deep:** `select` is limited to fd numbers below `FD_SETSIZE` (1024). `epoll`
    is Linux's scalable version: you register fds once and get only the ready ones
    back. — man 2 `select`, man 7 `epoll` — `fs/select.c`, `fs/eventpoll.c`.
- **SIGPIPE on sockets** (`sigpipe-sockets`, deepens: `sigpipe`)
  - **Simple:** a socket whose other side has gone rings the same bell as a pipe
    with no reader.
  - **Deep:** writing to a TCP connection the peer has closed or reset raises
    `SIGPIPE`; with the signal ignored, the write fails with `EPIPE`.
    `send(..., MSG_NOSIGNAL)` avoids the signal for one call; servers usually
    ignore `SIGPIPE` once at start-up. — man 2 `send`, man 7 `socket` —
    `net/ipv4/tcp.c` (`tcp_sendmsg_locked()`), `net/core/stream.c`
    (`sk_stream_error()`, which sends the `SIGPIPE`).

### Real-world card

```sh
make harbor && ./harbor &
for i in 1 2 3; do (nc localhost 7777 &) ; done   # or open three terminals
strace -e trace=poll,accept,read,write -p "$(pgrep harbor)"
```

Watch the server sleep in `poll` while nobody talks. For more, read the "Example
program" section of man 7 `epoll` and port `harbor` to it.

### Taint

- **Busy-waiting** (`poll` with timeout 0 in a loop, or non-blocking reads in a
  loop): fails the idle check, and the Watchdog barks: the CPU meter pegs at 100%.
- **One shared line buffer for all clients:** fails the interleaving check.
- **Not removing closed clients** (polling a closed fd): +1; `POLLNVAL` floods the
  syscalls view.
- **Leaking client fds:** +1 each.
- **Fixed-size arrays without a bounds check** (client 33 overflows the array): the
  memory checks catch it, +2.

### Fidelity

- **Faithful:** `poll` semantics and flags; `accept` readiness via `POLLIN`;
  `read` returning 0 on FIN; `SIGPIPE` and `EPIPE` (32) on writes after the peer has
  gone; `MSG_NOSIGNAL`.
- **Simplified:** writes to clients never block (the lab's socket buffers are large
  enough for the levels' traffic), so the player doesn't need `POLLOUT` and
  per-client output queues; the debrief says so and points to them as the next step.
  Disconnects and resets happen at deterministic points chosen by the checker.

---

## 1.B — The Syscall Gate (boss)

- **Region / NPC:** The Syscall Gate / the Gatekeeper, init, the Watchdog · **Tracks:** `debug`, `userland` · **Time:** ~30 min · **Prerequisites:** `dbg-strace`, `sys-errno`, `io-pipes`, `proc-signals`, `net-poll` · **Skills unlocked:** `sys-syscall-path`

### Scene

At the edge of Userland, a wall with one door. The door has no handle.

> **The Gatekeeper:** HALT. I am the Gatekeeper. Your world calls me the _system call entry_. Every request from Userland passes through me, or it doesn't pass at all.
>
> **The Gatekeeper:** You wish to go down into the Kernel. Many do. First, show me your crossings.
>
> **init:** The Gatekeeper doesn't take riddles or bribes. Only records. Every syscall your programs make, written down.
>
> **The Gatekeeper:** You have a tool for that. `strace`. Run your shell through it. I will read every line.
>
> **The Watchdog:** He's going to find everything you swept under the rug. Every leaked fd. Every zombie. Good luck, kid.
>
> **The Gatekeeper:** And when your record is clean, knock. Not with `printf`. Not with `write`. With your own hand: the number of the call, and its arguments. Then I open.
>
> **init:** I can't follow you past this door, little one. I never could. But I'll be here.

### See it (X-ray)

All four Act I views at once, side by side, for the first time: syscalls, processes,
files and network. The Gatekeeper runs the reference shell under `strace -f` with
`cat /etc/motd | grep -c kernel > count.txt`, and the player watches a single
command light every view in sync: `clone` (processes), `pipe2` and `dup2` (files),
`execve`, `read`, `write`, `wait4`. Each `strace` line is clickable and highlights
the matching moment in X-ray.

Then the Gatekeeper's own view: the **Gate view**, a zoom into one crossing, down
to the registers. The Prologue showed this path as a sketch; here every step is
named, and it is where the register-level detail of the act lives:

1. **In C:** `write(1, msg, 15)`. `write` is a small C library function, a
   _wrapper_, not the syscall itself.
2. **In the wrapper:** the syscall number goes in register `rax` (1 is `write` on
   x86-64), the arguments in `rdi` (1, the fd), `rsi` (`msg`, the address) and
   `rdx` (15, the count). A fourth, fifth and sixth argument would go in `r10`,
   `r8` and `r9` (`r10`, not `rcx`, because the `syscall` instruction overwrites
   `rcx` and `r11`). Then the `syscall` instruction.
3. **The crossing:** the CPU switches to kernel mode and jumps to the one address
   the kernel registered at boot, `entry_SYSCALL_64`. It switches to the kernel
   stack and saves the user registers there as a `struct pt_regs`.
4. **The table:** `do_syscall_64()` checks the number and looks it up in the
   syscall table, generated from `syscall_64.tbl`: entry 1 is `write`, whose
   handler is `__x64_sys_write()`. (Since Linux 6.9 the lookup is a generated
   `switch` in `x64_sys_call()`; older kernels called through the
   `sys_call_table` array. Same table, same numbers.)
5. **The handler:** `ksys_write()` → `vfs_write()` → the terminal's
   `file_operations` (`tty_write()`), the ops table from 1.2 and 1.6.
6. **The way back:** the handler's result goes in `rax`: 15 bytes written. The
   kernel restores the user registers and the CPU returns to user mode (`sysret`)
   right after the `syscall` instruction. A failure would come back as a negative
   number from -4095 to -1 (`-EBADF` is -9); the wrapper, back in user mode, sees
   it, stores 9 in `errno` and returns -1.

### Build it

The boss has two phases, both about building and observing, and one short check.

**Phase 1: The record.** The Gatekeeper runs a fixed "gauntlet" script through the
player's own `ksh-lite` under `strace -f`, then `harbor` with scripted clients. It
reads the trace and checks it live: each check is a stone in the Gate that turns
gold or shows a crack with the exact `strace` lines as evidence. The checks reuse
every Act I concept, nothing new:

- every `clone` has a matching `wait4` (no zombies);
- every `execve` happens with only fds 0, 1, 2 open (no leaked fds);
- every pipeline's `pipe` fds are closed in the shell afterwards;
- every failing syscall (`= -1 ENOENT`, `EACCES`, `EINTR`, …) is followed by an
  error message or a retry, never ignored;
- Ctrl-C during `sleep 100` kills `sleep` and not the shell;
- `harbor` survives a client reset during a broadcast and sleeps in `poll` when
  idle.

If the player's code has a crack, they fix it in their own code and re-run. A player
with a clean Act I passes Phase 1 in one run, with a flourish. A player who used the
reference version for some levels also passes: the reference is clean.

**Phase 2: The knock.** Starter: blank. The player writes `knock.c` from an empty
file using only `syscall()` from
`<unistd.h>` and `<sys/syscall.h>` (with `#define _GNU_SOURCE` at the top, since
the level builds with `-std=c11`), with no `printf`, `write` or `getpid`. It
must:

- get its own PID with `syscall(SYS_getpid)`;
- write `knock knock: <pid>\n` to fd 1 with `syscall(SYS_write, ...)` (formatting
  the number by hand into a buffer);
- try one call that fails on purpose, `syscall(SYS_close, 99)`, and check that it
  returns -1 with `errno == EBADF`;
- exit with `syscall(SYS_exit_group, 0)`.

**The Gatekeeper's question (order the path).** Before the door opens, the player
drags the steps of one `write` into order: libc wrapper, number in `rax` and
arguments in `rdi`/`rsi`/`rdx`, the `syscall` instruction, kernel mode at
`entry_SYSCALL_64`, the syscall table, `ksys_write()`, return in `rax`, back to
user mode, and the wrapper turning a `-errno` into `-1` and `errno`. Then they
point at the line in their own `knock` trace where the kernel answered `-EBADF`. The Gate view replays
the true order. A wrong order costs nothing; the player just sees why.

**Checker verifies (behavior):** Phase 1: all gauntlet checks pass on the player's
code. Phase 2: the lab's event stream for `knock` shows exactly the syscalls
`getpid` (39), `write` (1), `close` (3) returning `-EBADF`, and `exit_group` (231),
in that order, after `execve`; fd 1 receives `knock knock: <pid>\n` with the right
PID; the exit status is 0.

### Watch it

```
$ strace ./knock
execve("./knock", ["./knock"], ...) = 0
getpid()                            = 77
write(1, "knock knock: 77\n", 16)   = 16
close(99)                           = -1 EBADF (Bad file descriptor)
exit_group(0)                       = ?
+++ exited with 0 +++
```

The Gate view plays the player's own `write` all the way down and back. The
Gatekeeper steps aside. The door, which had no handle, opens downward: a staircase
into the dark. The whole of Userland is lit behind the player.

**Root, the honest way.** The Deep needs root: loading code into the Kernel takes
the capability `CAP_SYS_MODULE`. Nobody can hand that to a running process, and
the Gatekeeper doesn't try:

> **The Gatekeeper:** Clean crossings. It has been a long time. The way is open.
> But down there you will load your own code into the Kernel, and only root may do
> that.
>
> **The Gatekeeper:** Do not look at me. I hand out nothing. Every call that
> passes me carries its caller's credentials. I read them. I never write them.
>
> **init:** Then I'll give you what I have. I'm root; I'm PID 1, someone has to
> be. Watch.

init forks, and its child execs the player's own `ksh-lite`. The processes view
shows `init(1)` → `ksh-lite(512)` with a `uid 0` badge: a child inherits its
parent's credentials at `fork`, and `execve` of a program run by uid 0 gives it the
full capability set, `CAP_SYS_MODULE` included. The player's terminal switches to
this new shell, and the old one (uid 1000) exits. `id` prints:

```
uid=0(root) gid=0(root) groups=0(root)
```

the identity init had in S.2, when the kernel let it past `/etc/shadow`'s lock.
This is how real systems start a root shell too: something already running as
root starts it (init on a rescue console, `sudo` through a setuid program); a
process never "becomes" root by asking the kernel nicely. The player carries
`ksh-lite` through the door; it is their shell in the Deep.

> **The Watchdog:** I'll keep counting up here. When you need me, shout up
> through the Gate. Don't make me reboot you.

**Something left a record.** As root, the player can read the kernel's own log for
the first time (`dmesg`; the lab, like many distributions, sets
`kernel.dmesg_restrict = 1`, so it was closed to uid 1000). X-ray links each
console line to the `write` that made it. All of them match a `write` in the
trace except one, printed at boot:

```
[    0.912345] pstore: Registered ramoops as persistent store backend
```

> **The Gatekeeper:** That one didn't come through me. The Kernel writes its own
> log; it needs no syscall for that.
>
> **init:** pstore. It keeps a crash record across a reboot. _(`ls /sys/fs/pstore`
> shows one file, `dmesg-ramoops-0`.)_ The night of the Kernelfall left one.

The record is the same burnt log the Prologue showed one frame of. It is not a
creature: it is the last words of the crashed kernel, and the bug behind them lives
in the old Lantern driver's source, down below.

### Debrief

> **init:** You can't read that record properly yet. The Kernel down there is a generic one: no eyes for bad memory, no eyes for bad locks. Whatever wrote that log would slip right past it.
>
> **init:** The Smith went down ahead of you. There's a forge at the bottom of the stairs where kernels are made. Build yourself one that can see.
>
> **The Watchdog:** And take the stairs slowly. Tick. Tick.

Act II begins at the Forge (2.1).

### Hints

1. Nudge (Phase 1): "Find the cracked stone and read its evidence lines. Which
   process, which fd, which call?" / (Phase 2) "Every libc call you've used is a
   wrapper. What's underneath `write`?"
2. Concept: "`strace -f` follows children. A leaked fd shows up as an `execve` in a
   child that still has fd 3 or higher open. `syscall(number, args...)` makes a
   raw syscall: the numbers are in `<sys/syscall.h>` as `SYS_write`, `SYS_getpid`,
   and so on."
3. Point at the spot: "For Phase 1, click the first evidence line: X-ray jumps to
   the moment it happened and opens the matching file in your code. For Phase 2,
   turning the PID into text is a loop of `% 10` and `/ 10`, filling the buffer from
   the end."

### Codex (chapter: The Syscall Gate)

- **The syscall path (x86-64)** (`syscall-path`, deepens: `syscall`)
  - **Simple:** a libc wrapper loads a number and arguments into registers, the
    `syscall` instruction crosses into the Kernel, a table picks the handler, and
    the answer comes back in `rax`.
  - **Deep:** the C library puts the syscall number in `rax` and up to six
    arguments in `rdi`, `rsi`, `rdx`, `r10`, `r8`, `r9` (`r10` because `syscall`
    overwrites `rcx` and `r11`), then runs the `syscall` instruction. The CPU
    enters the kernel at `entry_SYSCALL_64`, which saves the registers as
    `struct pt_regs` and calls `do_syscall_64()`; that dispatches through the
    syscall table (`x64_sys_call()` since 6.9) to a handler such as
    `__x64_sys_write()`, defined with the `SYSCALL_DEFINE` macros. The result
    returns in `rax`; values from -4095 to -1 are errors that the C library turns
    into -1 and `errno`. — man 2 `syscall`, man 2 `syscalls` —
    `arch/x86/entry/entry_64.S` (`entry_SYSCALL_64`),
    `arch/x86/entry/syscall_64.c` (`do_syscall_64()`, `x64_sys_call()`; older
    kernels had it in `arch/x86/entry/common.c`),
    `arch/x86/entry/syscalls/syscall_64.tbl`, `include/linux/syscalls.h`.
- **Root and capabilities** (`root-capabilities`, deepens: `users-and-ids`)
  - **Simple:** root's power is a set of _capabilities_; a process gets them by
    being started by root, never by asking.
  - **Deep:** credentials (`struct cred`) are copied to the child at `fork`. When
    a process running as uid 0 calls `execve`, the kernel gives the new program the
    full capability set; each privileged operation then checks one capability:
    `CAP_SYS_MODULE` to load a module (2.2), `CAP_DAC_OVERRIDE` to pass file
    permission bits (S.2). The syscall entry path never changes credentials; only
    calls like `setuid()` (allowed to root) or a setuid program's `execve` do. —
    man 7 `capabilities`, man 7 `credentials`, man 2 `fork` — `kernel/cred.c`
    (`copy_creds()`), `security/commoncap.c` (`cap_bprm_creds_from_file()`),
    `kernel/module/main.c` (`may_init_module()`).

### Real-world card

```c
#define _GNU_SOURCE
#include <sys/syscall.h>
#include <unistd.h>

int main(void)
{
	static const char msg[] = "knock knock\n";

	syscall(SYS_write, 1, msg, sizeof(msg) - 1);
	return 0;
}
```

```sh
cc -Wall -Wextra -o knock knock.c && strace ./knock
strace -f -o trace.txt bash -c 'ls | wc -l'; less trace.txt
strace -c ls > /dev/null          # a summary table of every syscall
echo SYS_write | cpp -include sys/syscall.h -P - | tail -n 1   # prints 1 on x86-64
```

### Taint

- **Faking the record** (special-casing behavior when run under `strace`, or
  detecting the gauntlet): +5. The Gatekeeper notices, and so would any reviewer.
- **Using a libc wrapper in Phase 2** (`write`, `printf`, `getpid`): the objective
  fails; the Gate view shows the wrapper's frame.
- **Not checking the failing `close`:** +1. The whole point is to see the error come
  back.
- Cracks found in Phase 1 add no new Taint by themselves (the Taint was already
  counted in their own levels); fixing them here removes that Taint.

### Fidelity

- **Faithful:** `strace` output format for the calls shown (`name(args) = ret`,
  `-1 ENAME (Message)`, `+++ exited with N +++`, `-f` prefixes `[pid N]`); x86-64
  syscall numbers and register convention; the names of the kernel entry functions
  and files; the `-4095..-1` error range.
- **Simplified:** the lab's `strace` is a built-in tool, not a `ptrace`-based
  program, and only prints the syscalls the lab implements. The Gate view is an
  illustration of the real path; the lab dispatches syscalls in TypeScript and
  doesn't model CPU modes, `swapgs`, page-table switching or speculative-execution
  mitigations. The lab's `knock` trace shows only the program's own calls; on real
  Linux a dynamically linked `knock` first shows the loader's startup calls (`brk`,
  `mmap`, `openat` of libc, …) between `execve` and `getpid`, and the debrief says
  so. The `pstore:` line is real kernel output (`pstore_register()` in
  `fs/pstore/platform.c`; exact wording (verify) against 6.18), written by
  `printk` with no syscall, which Act II teaches. Its timestamp and the presence of
  `dmesg-ramoops-0` are lab state; a real machine has a pstore backend only if its
  firmware or kernel configuration provides one (ramoops, EFI, …). The "burnt"
  record is a story device. `dmesg_restrict` is set in the lab so root access
  visibly opens the log.
- **Faithful (root):** credentials inherited at `fork`; uid 0 getting the full
  capability set at `execve`; the `id` output format; the entry path never
  changing credentials.

---

## T1 — Take it home: your shell on a real machine (optional)

An optional quest that unlocks after the Syscall Gate. It is the proof that Act I
works outside the game. The game hands over a kit: the player's own `ksh-lite` and
`harbor`, a real `Makefile`, a test script and the success criteria. It runs on any
Linux, including WSL2 (macOS lacks `strace` and `/proc`). The tasks and criteria are
in [CURRICULUM.md section 3](../CURRICULUM.md#3-take-it-home-tasks):
build with zero warnings, run a pipeline with no zombies, pass AddressSanitizer,
annotate an `strace -f` of a pipeline, and read a child in `/proc/<pid>`. Reward: a
Codex badge. No Taint, no score, nothing is locked behind it.
