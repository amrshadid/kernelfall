# Kernelfall: roadmap

Where the game stands and what comes next, so you can pick something to work on. Open an
issue before you start, so two people don't build the same thing.

## Where it stands

The engine is done: a real Linux 6.18 machine runs in the browser, and levels are judged
by what its kernel really did. The content is not: of the 66 levels in v1.0, 16 are
built, and only P.1 is checked against the real Machine.

| Region                 | Levels   | Built   | Plays on the real Machine | Text checked against it |
| ---------------------- | -------- | ------- | ------------------------- | ----------------------- |
| First Boot             | P.1–P.4  | 4       | P.1–P.3                   | P.1                     |
| The Machine in Section | P.5–P.10 | 6       | P.5, P.7, P.8, P.9        | none yet                |
| Surface Survey         | S.1–S.5  | 5       | all                       | none yet                |
| Act I: Userland        | 1.0–1.B  | 1 (1.4) | 1.4                       | none yet                |
| Acts II and III        | 39       | 0       |                           |                         |

## Milestones

1. **0.1.0, The Surface.** The Prologue and the Survey complete, each level true to the
   Machine, fact-checked, and leading into the next. The game works offline.
2. **0.2.0, Act I.** Userland and systems C: 1.0 to 1.10 and the boss, 1.B.
3. **0.3.0, Act II.** Modules and a real character driver.
4. **1.0.0, Act III.** The kernel's core. The whole journey, Prologue to Act III.

## Next up

### Engine

- **GRUB on the data disk**, so P.4 and P.10 can edit and repair a real boot.
- **P.6's board program** and its device tree (`dtc` is on the Machine).
- **Offline play:** a service worker that keeps the app itself, like the Machine's files.
- **`sendfile64` data in the trace**, so `cat` into a pipe or file can be judged.
- **X-ray's boot view** from the real boot record (`useBootRecord()`), for P.4.
- **gcc's diagnostics in the editor**, as marks on the lines they name.

### Content

- **Rewrite P.2–P.10 and S.1–S.5 for the real Machine:** one CPU, 256 MiB, i386, BusyBox
  output, bash (there is no limited "rescue shell"), the real PCI devices and disk.
- **Fact-check each level** against Linux 6.18, the man pages and the Machine itself,
  following the quality gate in [LEVELS.md](LEVELS.md).
- **Close the gap after S.5:** its debrief leads to 1.0, which isn't built yet.
- **Then Act I**, in play order.

## Good first contributions

- **Check a built level on the Machine.** Play it, compare every command's output and
  every number with what the Machine prints, and open an **Inaccuracy** issue for each
  difference, with the real output.
- **Improve a Codex card:** a source path that doesn't exist in Linux 6.18, a broken
  link, a "try it" command that fails on a normal Linux.
- **Add a golden run** for a variant a level should reject (see [LEVELS.md](LEVELS.md)).
