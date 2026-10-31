# @kernelfall/machine

The player's Machine: real Linux (Alpine, kernel 6.18, gcc) running in v86 inside a Web Worker, the
kernel's event model that X-ray and the checkers read, and the hooks the app reaches both through.

> **Note:** The worker (`services/vm/vm.worker.ts`) never runs on the page; the page reaches it only
> through the hooks. The app uses `configureMachine()`, `setupMachineListeners()`, `/hooks`, `/types`
> and `/utils`; `/events` is for other packages (game, levels).

## Structure

```
scripts/vm-image/   → `pnpm vm:image`: builds the guest image from pinned Alpine packages, and its
                      data disk (disk.ts: the guest's own mke2fs makes it, booted in Node);
                      `pnpm vm:syscalls` (syscall-table.ts): the i386 table from Linux v6.18
src/
├── config.ts       → configureMachine (worker factory, image and wasm URLs), getMachineConfig, resetMachineConfig
├── events/
│   ├── types.ts    → MACHINE_EVENTS (REVEAL), LAB_EVENTS (COMMAND_FINISHED, COMMAND_PROGRESS, BOOTED),
│   │                 LabEvent: the tracepoint stream (sys_enter, sched_process_fork, signal_generate…)
│   └── listeners.ts → setupMachineListeners: finished and running commands fill the trace store
├── hooks/
│   ├── vm/         → useLinuxTerminal, useMachineStatus, useMachineFiles, useTerminalCommand,
│   │                 useMachineSetup, useCommandResults, useMachineCpus, useBootRecord, useRunAs
│   ├── trace/      → useSyscallTrace, useRunEvents, useTraceCall
│   └── reveal/     → useReveal, useRevealRequests (a clicked `file:line` opens in the editor)
├── services/vm/    → connection, session, root control channel (COM3), trace reader (COM2), files
│                     cache, saved boots, the worker entry
├── store/          → trace store (runs and their events), vm store (status)
├── types/definitions/
│   ├── vm.ts, config.ts, endpoint.ts → the VM, its options and its worker
│   ├── trace.ts, syscall-info.ts, route.ts → trace runs and calls, syscall cards, where a call went
│   ├── vm-trace.ts, syscall-table.ts → TracedCommand, the trace's limits, the i386 syscall table
│   ├── errno.ts, errno-names.ts, signal.ts, fcntl.ts, stat.ts, unistd.ts, wait.ts → uapi constants
│   ├── task.ts, cred.ts, boot.ts, source.ts
│   └── lab-setup.ts → a level's `lab:` block
├── utils/
│   ├── trace/      → buildRun, appendRun, findCall, live-run helpers, syscallInfo, kernelSourceUrl
│   ├── strace/     → strace's exact line format: formatStraceLine, formatCall, formatReturn, quoteBuffer
│   ├── vm-trace/   → parseTraceLine, syscallName, the probes' captured data (argv, paths, buffers)
│   ├── vm-setup/   → setupScript (a `lab:` block as root commands), runAsScript, shellQuote
│   ├── boot/       → BOOT_REPORT_SCRIPT, parseBootReport, parseKernelLog
│   ├── lab-setup/  → validateLabSetup, accounts
│   └── bytes/      → byteString
├── test/           → trace event fixtures, an in-memory IndexedDB, RTL setup (not exported)
└── index.ts        → configureMachine, setupMachineListeners, cleanupMachineListeners
```

## Key Features

- **Real Linux** — the terminal is the guest's console; the image is built reproducibly from a lock file.
- **One event stream** — X-ray, checkers and Taint read the same `LabEvent`s, named after the kernel's
  tracepoints, so they never disagree.
- **The trace** — tracefs in the guest (`scripts/vm-image/trace-probes.ts`): the syscall tracepoints,
  plus probes for what they don't print: buffers read when the call returns (write and read up to
  1 KiB, writev 4 iovecs of 512 bytes, `dataCut` when the call moved more), paths, execve's argv, and
  what reaches the terminal (`n_tty_write`, so `console_write` is in order and has its writer's pid).
  What the shell does between commands, except editing the line, goes to the next command.
- **strace's format** — trace lines print exactly as `strace -f` would.
- **A real disk** — `disk.img` is v86's first IDE disk: the guest sees `/dev/sda` (ata_piix, sd) with
  one ext4 partition, `sda1`, labelled `kernelfall`. Nothing mounts it at boot; a level (or the player)
  runs `mount /dev/sda1 /mnt`. A level's restore brings the disk back to its clean contents too.
- **The Machine's own facts** — once Linux is up, one root-channel report (dmesg, sysfs, /proc) gives
  the CPU count and the boot record, published as `LAB_EVENTS.BOOTED`.
- **Live trace** — `LAB_EVENTS.COMMAND_PROGRESS` shows a running command as a live run, which its
  `COMMAND_FINISHED` replaces.

## The image build

`pnpm vm:image` builds from `scripts/vm-image/vm-image.lock.json`: every download (the minirootfs, each
.apk, the BIOS files) must match its pinned checksum. A package new to the list is pinned when first
fetched; `--update` re-pins everything to what Alpine has now.

Alpine deletes an .apk once a newer build replaces it, so each download falls back to a mirror: a flat
folder of the pinned files, published as the assets of a GitHub Release. Its base URL comes from
`KF_VM_MIRROR` (ending in `/`), else `DEFAULT_MIRROR` in `mirror.ts`: the repository's `vm-mirror`
release. `pnpm vm:mirror` builds the image and writes every pinned file it used, and a `SHA256SUMS`,
into `node_modules/.cache/kernelfall-vm-mirror`; the release workflow uploads them to `vm-mirror`.

## Dependencies

- `@kernelfall/core` — event bus, validation
- `v86` — the x86 emulator
- `comlink` — the worker channel
- `zustand` — stores
