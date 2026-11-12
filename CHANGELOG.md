# Changelog

All notable changes to Kernelfall are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/). 0.1.0 will be The Surface (the Prologue and
the Surface Survey), complete and checked; until then, releases are alpha pre-releases.

## [Unreleased]

### Added

- **The Guide shows a step one beat at a time.** It stops at the next thing you do and
  shows the rest once you've run it (or pressed Continue), so a result is on your
  terminal before it is explained, and a Predict's answer waits for your run. Level
  authors mark a pause with `---` in `story.md`.
- **init's drawing of the Machine is on screen in Power On.** It hangs beside the
  terminal, dark, and each command you run draws itself on it: the command in Userland,
  how many requests crossed the Gate, and the kernel parts that served them.
- **init's questions wait for your answer.** A question in the Guide now offers its
  answers; pick one (or "Just show me") and your call is marked beside what really
  happens. No score. When the question is about something you are about to run, your
  call is kept and the answer is marked only after you run it. Every built level asks
  one; level authors write it as a list under the question in `story.md`.
- **Recall cards when a level ends.** The level-complete screen names what the level
  taught and deals three Codex cards from earlier levels, face down: say what each one
  is, turn it, and mark it "I knew it" or "Not yet". No score; a card you missed comes
  back first. The last level of a region deals five cards from the whole region, under
  that region as the Kernel Map now draws it, every stop rebuilt. Your marks are saved
  with your progress.
- **A missed objective says what your last run did instead**, for example "Your program
  exited with status 3, not 0".
- `make` on the Machine, the loopback interface up, and `/dev/fd`, so bash's `<(…)`
  works.
- **Run shows its progress:** "Building…" while gcc compiles, "Running…" while the
  program runs (an interactive one until it exits), then Run again.
- `pnpm vm:facts` records what the Machine prints for the commands levels quote (uname,
  lspci, /proc, ps, BusyBox errors) into `packages/levels/src/test/machine-facts.json`.
- **Usage recordings with Microsoft Clarity** on the public site, only with the player's
  consent: a notice asks once ("Allow" or "No thanks"), and nothing loads until they
  allow it. Once allowed, Clarity records what is typed in the terminal and the editor
  too, and sets its analytics cookies. Settings → Privacy explains what is recorded and
  changes the answer; "Don't allow" stops a running recording. Builds without
  `VITE_CLARITY_ID` never ask or load it.

### Changed

- The Machine runs kernel 6.18.63. `tcc` is gone: it could never link a program there.
- **A quieter Guide.** The Scene shows only its story: the objectives appear with the
  first thing you are asked to do, and the level's Codex cards fold to one line until
  Watch it.
- **X-ray fits a small laptop screen.** On a 1280×720 screen its drawing is larger and the
  sentence under it is no longer hidden: the controls keep to one row, and on a short
  screen the title block gives its height to the drawing.
- The levels quote kernel 6.18.63's own lines (they still quoted 6.18.59's).
- After a build, X-ray opens on your program's own output, not on the compiler's calls.
- The Prologue and Survey specs describe the real Machine: one CPU, i386, BIOS, the 9p
  root, the IDE disk, virtio-net, and bash as init's shell.

### Fixed

- **A wrong address on the site shows the game's own "No such page".** An address that
  is no file of the site, like `/nope`, got the host's bare text page. It now gets a
  page in the manual's style, in the theme you chose, with the address as the Machine's
  `ls` would report it and a way back to the title.
- **The game starts offline.** On the public site the service worker threw as it loaded, so it never
  registered and nothing was kept for offline play. The build now runs the worker and
  fails if it throws.
- The Machine's image has the same version on every build machine: an image built on
  macOS and one built on Linux differed in one byte of the initramfs's gzip header.

## [0.1.0-alpha.1] - 2026-10-31

The first public pre-release: the engine, and the levels built so far, playable at
[kernelfall.shadid.dev](https://kernelfall.shadid.dev).

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

[Unreleased]: https://github.com/amrshadid/kernelfall/compare/v0.1.0-alpha.1...HEAD
[0.1.0-alpha.1]: https://github.com/amrshadid/kernelfall/releases/tag/v0.1.0-alpha.1
