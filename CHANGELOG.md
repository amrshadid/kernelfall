# Changelog

All notable changes to Kernelfall are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/). Nothing is released yet: the first release,
0.1.0, will be The Surface (the Prologue and the Surface Survey), complete and checked.

## [Unreleased]

### Added

- **A real Linux machine in the browser.** v86 runs a 32-bit PC (one CPU, 256 MiB) with
  Alpine Linux 3.24 and kernel 6.18 in a Web Worker: bash 5.3, BusyBox, gcc 15, tcc,
  musl, man pages, strace, an ext4 data disk (`/dev/sda1`) and a network card (`eth0`).
  The first visit boots it and saves the booted state in the browser; later visits and
  every level restore it.
- **The kernel's own trace.** tracefs tracepoints and probes report every syscall,
  process event, signal and terminal write of the player's commands, as typed events
  that X-ray, the checkers, Taint and the tests all read.
- **Levels judged on the real Machine.** Each level sets up its own Machine (users,
  files, programs built with gcc, running processes, cwd, environment). Objectives and
  Taint rules are checked against what the kernel really did, including gcc's own
  errors and warnings.
- **Golden runs.** `pnpm vm:record` boots the real image in Node, runs each level's
  reference commands and saves the kernel's events; the level tests judge those runs.
- **Built levels:** the Prologue (P.1–P.10), the Surface Survey (S.1–S.5) and 1.4 Run
  Anything. P.1 is checked against the real Machine; the others are being rewritten
  for it ([ROADMAP.md](docs/ROADMAP.md)).
- **X-ray** draws each syscall's path through the 32-bit kernel (`int $0x80` or
  `sysenter`, `do_int80_syscall_32`, the `__ia32_sys_*` handler, `iret`), with views of
  the processes, the CPU, a file's route through the kernel and the Machine in section.
- **The game around it:** the Kernel Map, the Codex of man-page cards, Taint, hints,
  init's reference version for every level, a guided tour, replay for any level,
  autosave with a fallback copy, export and import of saves, and the "Section 2" day
  and night prints.
- **Tooling:** the reproducible image build (`pnpm vm:image`, pinned packages and
  checksums, a mirror for packages Alpine drops), CI on every pull request, Vercel
  deploys of `main` with previews for pull requests, and tagged releases.

### Known gaps

- P.4, P.6 and P.10 can't be played yet: they need a real GRUB on the disk and P.6's
  board program.
- The trace carries no data for `sendfile64`, so `cat` into a pipe or file can't be
  judged by what it read.
- The game doesn't work offline yet: the Machine's files are cached, the app is not.
- Act I has one level (1.4); Acts II and III aren't built.

[Unreleased]: https://github.com/amrshadid/kernelfall/commits/main
