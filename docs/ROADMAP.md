# Kernelfall: roadmap

Where the game stands and what comes next, so you can pick something to work on. Open an
issue before you start, so two people don't build the same thing.

## Where it stands

A real Linux 6.18 machine runs in the browser, and levels are judged by what its kernel
really did. All 16 built levels play on it and are fact-checked against it. They are now
being rewritten to the content standard ([LEVELS.md](LEVELS.md#concepts-and-budgets)):
one question each, a third of the words, and ideas that link from level to level.

| Region                 | Levels   | Built   | Fact-checked on the Machine | To the content standard |
| ---------------------- | -------- | ------- | --------------------------- | ----------------------- |
| First Boot             | P.1–P.4  | 4       | all                         | P.1                     |
| The Machine in Section | P.5–P.10 | 6       | all                         | P.6                     |
| Surface Survey         | S.1–S.5  | 5       | all                         | none yet                |
| Act I: Userland        | 1.0–1.B  | 1 (1.4) | 1.4                         | none yet                |
| Acts II and III        | 39       | 0       |                             |                         |

## Milestones

1. **0.1.0, The Surface.** The Prologue and the Survey complete, each level true to the
   Machine, fact-checked, and leading into the next. The game works offline.
2. **0.2.0, Act I.** Userland and systems C: 1.0 to 1.10 and the boss, 1.B.
3. **0.3.0, Act II.** Modules and a real character driver.
4. **1.0.0, Act III.** The kernel's core. The whole journey, Prologue to Act III.

## Next up

### Engine

- **Routes in the trace:** which filesystem or driver served each call, so X-ray names
  the real kernel part.
- **A boot record for a boot that stops** in the initramfs (P.10).
- **The terminal's real size** for the guest, so `less` and `top` fill the panel.
- **gcc's diagnostics in the editor**, as marks on the lines they name (0.2.0).

### Content

- **Rewrite P.2–P.5, P.7–P.10, S.1–S.5 and 1.4 to the content standard**, one region at a
  time, each fact-checked, with golden runs and a play-through, then enforced by
  `pnpm content:report`. P.1 and P.6 are the pilot.
- **One vocabulary:** the Section drawing's parts and the game's words (the Gate, floors,
  doors) in LEVELS.md, with a lint for stray metaphors.
- **Region recaps:** each region ends with the drawing it lit and quick recall cards.
- **Then Act I**, in play order, starting with 1.0.

### Later acts: gaps the public kernel roadmaps point to

- **Kernel linked lists** (`list_head`) in 2.9b's message history.
- **A syzbot-style crash report** to read and fix, the Linux Foundation mentorship's entry
  task, in 2.12.
- **A reviewer's reply and `git send-email --dry-run`** in 2.13's patch.
- **debugfs** beside sysfs and procfs in 2.7.
- **Kernel GDB, kselftest and sparse** as pointers in the take-home kits.

## Good first contributions

- **Check a built level on the Machine.** Play it, compare every command's output and
  every number with what the Machine prints, and open an **Inaccuracy** issue for each
  difference, with the real output.
- **Improve a Codex card:** a source path that doesn't exist in Linux 6.18, a broken
  link, a "try it" command that fails on a normal Linux.
- **Add a golden run** for a variant a level should reject (see [LEVELS.md](LEVELS.md)).
