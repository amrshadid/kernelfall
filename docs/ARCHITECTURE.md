# Kernelfall: architecture

How the code fits together. The code rules (layout, imports, file names) are in
[CONTRIBUTING.md](../CONTRIBUTING.md).

## Constraints

- **Client-side only.** A static site; the Linux machine runs in the player's browser.
  No backend; one third-party service: Microsoft Clarity session recordings, loaded
  only when the build sets `VITE_CLARITY_ID` and the player allows it in the consent
  notice (or later in Settings → Privacy). Once allowed, Clarity may set its analytics
  cookies (ad storage stays denied); nothing is masked, and Settings → Privacy says what
  is recorded.
- **Real Linux.** The Machine is a real Linux 6.18 kernel with real programs. What
  players see is what that kernel does and prints.
- **Same state, same start.** Every level starts from the same saved boot and the same
  setup, so its checks always run on the same Machine.

## The event stream

```
 ┌───────────────────────────── Web Worker ──────────────────────────────┐
 │  v86 emulates a 32-bit PC running Alpine Linux (kernel 6.18)          │
 │                                                                       │
 │  COM1  the player's terminal: bash, as uid 1000 (`you`)               │
 │  COM2  the kernel's trace: tracefs tracepoints and probes             │
 │  COM3  root's control channel: level setup, reports                   │
 │                                                                       │
 │  COM2 ─▶ parser ─▶ TracedCommand, one per command line                │
 └───────────────────────────────┬───────────────────────────────────────┘
                                 │  LabEvent (sys_enter, sched_process_fork, …)
           ┌──────────────┬──────┴───────┬───────────────┐
         X-ray         checkers        Taint       golden runs
```

Everything that observes the Machine reads the same typed `LabEvent`s, named after
the kernel's tracepoints, so X-ray, checkers, Taint and tests never disagree.

## Packages

| Package    | Holds                                                                                        | Depends on    |
| ---------- | -------------------------------------------------------------------------------------------- | ------------- |
| `core`     | the event bus, `ServiceResponse` and its error handler, the logger, storage keys, validation | nothing       |
| `theme`    | Section 2 token values: palettes, typography, spacing, motion, colour utils                  | nothing       |
| `machine`  | the VM: v86 in a Web Worker, the image build, the trace pipeline, level setup, hooks         | core          |
| `game`     | a pure engine: rules, checks, Codex, progress, saves; knows no level by id                   | core, machine |
| `levels`   | the content ([LEVELS.md](LEVELS.md)), its loader, the recorder and the golden runs           | game, machine |
| `apps/web` | the game: pages, features, the design system                                                 | all           |

Packages hold logic or values, never UI. Each one uses the roles it needs: `config.ts`
(what the app injects), `events/` (names, payloads, listeners), `services/` (`api/`
boundaries returning `ServiceResponse`, `utils/` helpers, engines beside them),
`store/` (zustand), `hooks/` (the business flows), `types/`, `utils/` and `test/`.
Hooks call services, write the store and emit events. The app uses packages only
through hooks, types and utils. Each package's `package.json` enforces the dependency
column (pnpm and TypeScript reject anything else), and Biome keeps the app off
services, stores and events.

## Engine and content

The game is an engine; the levels are data.

1. **`levels` loads the content.** Vite bundles `packages/levels/content/` at build
   time. The loader parses every YAML file, checks it with `game`'s validators and
   returns one typed `LoadedContent`, or every problem with its file and field. The
   app passes its `game` part to `configureGame()`; invalid content shows its errors
   instead of a half-valid game.
2. **`game` judges a level.** An objective or Taint rule with a declared `check:` is
   judged by the engine from the Machine's events. Anything else is judged by the
   level's own `checker.ts`, written with `defineChecker()` and `game`'s query toolkit.
   Both report by id, so the engine merges them.
3. **`machine` sets up the level's Machine** from its `lab:` block (a `LabSetup`):
   users, groups, files, programs built at setup, running processes, the player's cwd
   and environment.

## The machine

- **The VM.** v86 0.5.471 emulates a 32-bit PC with one CPU and 256 MiB of memory.
  The guest is Alpine 3.24 (i386) with kernel 6.18 (`linux-virt`), bash 5.3, BusyBox,
  gcc 15, tcc, musl, man pages and strace. The root filesystem is served over
  virtio-9p. A 16 MiB data disk is the first IDE disk: GRUB 2.14 in its MBR, and an
  ext4 `/dev/sda1` holding `/boot` (not mounted at boot). On a restart SeaBIOS boots
  GRUB from it, which loads the kernel and initramfs; the root stays on 9p. eth0 is a
  virtio network card with no backend.
- **The worker.** v86 runs in a Web Worker, reached through Comlink (`VmSession`). The
  page never touches the emulator; it uses `machine`'s hooks.
- **The player.** busybox init starts bash on the serial console as `you` (uid 1000,
  home `/home/you`). There is no login and no stand-in shell: the terminal is the
  guest's console.
- **The trace.** At boot, the guest sets up tracefs: the syscall tracepoints,
  scheduler and signal events, return probes that read user buffers, a kprobe on
  `n_tty_write` for what reaches the terminal, and an eprobe for execve's argv. Only
  the player's shell and its children are traced. Bash writes a marker into
  `trace_marker` before and after each command line, so the events split by command. The trace goes out on COM2; the
  worker parses it into one `TracedCommand` per command line, with the i386 syscall
  table generated from Linux v6.18's `syscall_32.tbl` (`pnpm vm:syscalls`).
- **Live runs.** While a command runs, the worker sends its events as
  `LAB_COMMAND_PROGRESS` (throttled, and at once when the program waits for input), so
  X-ray follows an interactive program live. The finished command goes out as
  `LAB_COMMAND_FINISHED`, which replaces the live run. Once Linux is up, a report over
  the control channel (dmesg, sysfs, `/proc`) gives the CPU count and the boot record
  as `LAB_BOOTED`.
- **The control channel.** A root shell on COM3 takes one command line at a time and
  answers each with `kf-done <status>`. The page never shows it.
- **Level setup.** The worker restores the clean boot saved in the browser, runs the
  level's setup lines as root on the control channel, then restarts the player's shell
  so it starts in the level's session (user, cwd, environment).
- **The first visit.** Linux boots from scratch, then the worker saves the booted
  state. Later visits and every level restore it.

## Player C

Players write C in the editor (CodeMirror). The editor writes their files into
`/home/you` over 9p, and **Run** types the level's build command into the player's
terminal (by default `gcc -Wall -Wextra x.c -o x && ./x`). gcc's errors and warnings are its real output, and the
program runs on the real kernel, traced like any other command.

## The image

- `pnpm vm:image` builds the guest from pinned Alpine packages. Every download (the
  minirootfs, each `.apk`, the BIOS files) must match its checksum in
  `packages/machine/scripts/vm-image/vm-image.lock.json`.
- Alpine deletes superseded packages, so downloads fall back to the `vm-mirror`
  GitHub release (or `KF_VM_MIRROR`). `pnpm vm:mirror` writes the mirror files.
- The output goes to `apps/web/public/vm/` (gitignored, about 117 MB): the files under
  `vm/<version>/`, named by a content hash, and `vm/manifest.json` with that version
  and the kernel release.

## Storage

Everything stays in the player's browser.

| Data                         | Where                                                         |
| ---------------------------- | ------------------------------------------------------------- |
| Settings, recording consent  | localStorage `kernelfall:v1:settings`                         |
| Progress, Taint, hints, code | localStorage `kernelfall:v1:profile:<slot>`                   |
| The booted Machine           | IndexedDB `kernelfall-vm`, store `boots`, per image version   |
| The image's files            | Cache Storage `kernelfall-vm-files-v1`                        |
| The app, for offline play    | Cache Storage `kernelfall-app-<build>`, by the service worker |
| The image's last manifest    | Cache Storage `kernelfall-offline-v1`, used only offline      |

- The service worker (`apps/web/src/sw.ts`, production builds only) precaches the built
  app and serves it when the network is gone; the manifest stays network-first. A new
  build takes over on the next load, never mid-level.

- Saves go through the `StorageAdapter` the app passes to `configureGame()`; tests use
  an in-memory one.
- Writes are atomic: the new save goes to `.next`, the old one is kept as `.prev`,
  so a corrupt save falls back to the last good copy.
- Records are versioned. Older saves are migrated; a save from a newer version is
  refused, never overwritten.
- Without storage (private window, full disk) saves stay in memory, a banner says so
  and offers **Export save**, and the game stays playable.
- A saved boot is used only with the image version it was made from.

## Testing

All tests run on Vitest.

| Layer    | What                                                                     |
| -------- | ------------------------------------------------------------------------ |
| packages | unit and flow tests (hook flows without React)                           |
| machine  | the trace parser, strace's format, level setup scripts, the image build  |
| levels   | golden runs: every reference solution, judged by its checker, zero Taint |
| web      | utils, stores and hooks                                                  |

**Golden runs.** `pnpm vm:record` boots the real image in Node, sets up each level,
types its reference commands and saves the kernel's events as gzipped JSON in
`packages/levels/src/test/runs/`. The level tests judge those recordings, so they run
without booting a VM.

## Deploy

- **CI** (`ci.yml`): Biome, clang-format on the C files, type checks, tests and the
  build, on every pull request and on `main`. `pr-title.yml` checks the PR title.
- **Vercel** (`vercel.json`): every push to `main` deploys the game, and every pull
  request gets a preview. The build runs `pnpm vm:image`, then builds the app; the
  image files are served with a year's cache (they're content-addressed), the manifest
  with none.
- **Releases** (`release.yml`): on a `v*` tag, verifies, builds and creates the GitHub
  Release, and uploads the pinned downloads to the `vm-mirror` release.

## Decisions

- Client-side only: free to host as a static site.
- Microsoft Clarity for session recordings, only after the player allows it: analytics
  cookies then (never ad storage), unmasked; "No thanks" or a later change in Settings
  stops it and it isn't loaded again.
- The Machine is real Linux in v86, in a Web Worker reached through Comlink.
- One CPU (v86 emulates one); levels teach time slicing on one CPU.
- Linux 6.18 LTS for the Machine, the Codex and the take-home kits.
- The image is built from pinned packages, checked against a lock file, with a
  `vm-mirror` release as fallback.
- An ext4 data disk on IDE gives the disk lessons a real block device; GRUB on that
  disk is planned for the boot lessons.
- The kernel's own trace (tracefs) feeds X-ray, checkers, Taint and tests.
- Player C is built by gcc inside the Machine.
- Init's shell is the Machine's real bash.
- Level setup restores the clean boot, then applies the level's `lab:` block as root.
- Golden runs recorded on the real image judge the levels in tests.
- React, TypeScript and Vite in a pnpm workspace; zustand for state; Biome for lint
  and format.
- Packages hold logic and values; UI lives in `apps/web`.
- `game` is a pure engine; levels are content in `@kernelfall/levels`, judged by
  declared checks or a level's own `checker.ts`.
- Progress in localStorage; the booted Machine in IndexedDB; image files in Cache
  Storage.
- CodeMirror 6 for the editor, xterm.js for the terminal.
- Hosting on Vercel: `main` is production, pull requests get previews; GitHub Actions
  runs CI and releases.
- The "Section 2" brand ([BRAND.md](BRAND.md)).
