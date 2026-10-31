# Kernelfall brand: Section 2

The visual identity for everything Kernelfall ships. The tokens (palettes, type,
spacing, motion) are in `@kernelfall/theme`; the components that use them are in
`apps/web/src/shared/ui/`.

**The game is the Machine's own service manual.** Man page section 2 is "System
calls", and this direction dresses Kernelfall in the printed artifacts of real
systems work: man pages, engineering drawings, Bell Labs and IBM reference cards,
teletype printouts. Paper and ink, one signal red, zero radius, heavy 2px rules.
The Machine is drawn as a sectional elevation: Userland above grade, the Syscall
Gate as the section line A–A, the Deep cross-hatched below.

Signature screens: the title (the wordmark cut by the section line, a table of
contents, Fig. 1 the Machine in section); the level screen with a drawing title
block (Revision = Taint); the Kernel Map as a general drawing with a scale bar and
a legend of node shapes; the "Watch it" moment where the `FORK(2)` card feeds out
of a printer slot and gets stamped "Filed"; and X-ray as exploded sequence drawings.

## Concept

A man page is the first piece of kernel documentation every developer meets, and
it is honest: NAME, SYNOPSIS, DESCRIPTION, RETURN VALUE, SEE ALSO. Section 2 turns
that honesty into a look. Chrome is borrowed from real documents instead of
invented: the running head of a man page (`RUN ANYTHING(1.4)` left and right), a
drawing's title block in the corner of the level screen, a table of contents with
leader dots on the title screen, figure captions, a scale bar on the map ("one
segment, about 20 minutes of play"). The brand mark is the word **Kernelfall cut in
section**: solid ink above a red chain line, hatched below. It is the whole story
(a city above, a fallen kernel below, one boundary between them) in one wordmark.

## Why it fits Kernelfall and its audience

- **The audience already trusts this register.** Developers learning kernel
  internals spend their time in man pages, `Documentation/`, datasheets and source.
  A game that looks like the best version of those documents says "this is
  accurate" before a word is read, which is pillar 3 (correct beats passing) made
  visible.
- **The Codex is literally a man page.** The card format is the real one, so the
  player learns to read `man 2 fork` by collecting cards.
- **Code and terminal are the most legible things on screen.** Ink on paper, a
  tone step for the terminal, no glow, no tinted backgrounds behind syntax.
- **It avoids the usual "hacker game" defaults:** no navy, no amber, monospace only
  where text is real code, no rounded cards, no gradients.

## Palette

Measured with the WCAG 2.x contrast formula (sRGB relative luminance).

### Day print (light, default)

| Token        | Hex       | Role                                                                       |
| ------------ | --------- | -------------------------------------------------------------------------- |
| `--ground`   | `#EEEEE9` | the desk the sheets lie on                                                 |
| `--sheet`    | `#FAFAF7` | panels, editor                                                             |
| `--soft`     | `#E5E5DF` | terminal paper, table headers, one tone step                               |
| `--ink`      | `#141414` | text, rules, solid fills                                                   |
| `--ink-2`    | `#55554F` | secondary text                                                             |
| `--red`      | `#C8201A` | the one accent: primary action, you-are-here, current step, open objective |
| `--red-wash` | `#F3E9E6` | highlighted row                                                            |
| `--blue`     | `#1F4FA3` | links, focus ring, X-ray data arrows                                       |
| `--green`    | `#1D6B3A` | passed, saved, clean                                                       |
| `--taint`    | `#A3195B` | Taint ("errata" magenta)                                                   |
| `--hatch`    | `#8A8A83` | cross-hatching (decorative)                                                |

| Pair                                 | Ratio   | Grade        |
| ------------------------------------ | ------- | ------------ |
| ink on sheet                         | 17.62:1 | AAA          |
| ink on ground                        | 15.83:1 | AAA          |
| ink on soft (terminal)               | 14.57:1 | AAA          |
| ink-2 on sheet                       | 7.18:1  | AAA          |
| ink-2 on soft                        | 5.93:1  | AA           |
| red on sheet                         | 5.46:1  | AA           |
| red on soft (stderr in the terminal) | 4.52:1  | AA           |
| sheet on red (primary button text)   | 5.46:1  | AA           |
| blue on sheet                        | 7.42:1  | AAA          |
| green on sheet                       | 6.24:1  | AA           |
| taint on sheet                       | 7.05:1  | AAA          |
| code preprocessor `#7A4A00` on sheet | 7.15:1  | AAA          |
| hatch on sheet (non-text graphics)   | 3.32:1  | ≥ 3:1 for UI |

### Night print (dark)

Same roles, inverted like a blueprint negative but kept neutral (no navy).

| Token             | Hex                               |
| ----------------- | --------------------------------- |
| `--ground`        | `#141514`                         |
| `--sheet`         | `#1C1E1D`                         |
| `--soft`          | `#262928`                         |
| `--ink`           | `#EAEAE4`                         |
| `--ink-2`         | `#A3A39B`                         |
| `--red`           | `#FF6A5C` (button text `#141414`) |
| `--red-wash`      | `#3A2421`                         |
| `--blue`          | `#8FB0FF`                         |
| `--green`         | `#6FCF97`                         |
| `--taint`         | `#F27BB5`                         |
| code preprocessor | `#E8C27A`                         |

| Pair                              | Ratio   | Grade        |
| --------------------------------- | ------- | ------------ |
| ink on sheet                      | 13.88:1 | AAA          |
| ink on ground                     | 15.16:1 | AAA          |
| ink on soft (terminal)            | 12.16:1 | AAA          |
| ink-2 on sheet                    | 6.60:1  | AA           |
| ink-2 on soft                     | 5.78:1  | AA           |
| red on sheet                      | 5.96:1  | AA           |
| red on soft (stderr)              | 5.22:1  | AA           |
| button text on red                | 6.55:1  | AA           |
| ink on red-wash (highlighted row) | 11.96:1 | AAA          |
| blue on sheet                     | 7.84:1  | AAA          |
| green on sheet                    | 8.82:1  | AAA          |
| taint on sheet                    | 6.61:1  | AA           |
| code preprocessor on sheet        | 9.92:1  | AAA          |
| hatch on sheet (graphics)         | 3.22:1  | ≥ 3:1 for UI |

Status never relies on colour: passed is a filled square with a tick, open is an
empty square, map nodes differ by shape (solid, half-filled, double square, dashed
with a padlock, plus a diamond "clean" mark).

## Typography

| Role                               | Face                                                  | Notes                                                                                |
| ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Display                            | **Archivo**, `wdth` 125, weight 800, tracking −0.03em | wordmark, screen titles, stage titles; the expanded width reads like a drawing title |
| UI and prose                       | **Archivo**, `wdth` 100, 14–17px                      | one family carries everything, the width axis does the work                          |
| Dense labels                       | **Archivo**, `wdth` 75                                | man-page heads, drawing callouts, map labels                                         |
| Code, terminal, kernel identifiers | **IBM Plex Mono** 400/600, 13–14px, ligatures off     | the engineering-document mono; distinct `0`/`O`, `1`/`l`                             |

Two families, both OFL and self-hostable. Uppercase appears only where the real
convention uses it (man page heads and section names on the Codex card).

## Iconography

Square-cut line icons on a 24px grid with a 2px stroke, matching the rule weight:
chevrons, a padlock, a hint mark. Icons always sit next to a label. Game marks are
drafting symbols rather than pictograms: section arrows, a drawing title block, a
scale bar, a "Filed" stamp.

## Illustration and NPC portraits

Single-weight technical line drawing, ink on paper, with the accent used only for
light (lit windows, init's lamp) and for "you". The world is drawn in elevation and
section, never in perspective. NPCs are pictograms in the same line: **init** is a
draftsman-lamplighter carrying a lamp, with a `1` badge; **the Watchdog** is a
square-jawed dog whose eye is a clock; **the Gatekeeper** is an arched gate with a
numbered slot that shows the syscall number; **the Dangling** would be the only
thing drawn off-register (a second, offset stroke), in the Taint magenta. Each
portrait reads at 32px and 96px.

## Motion

Motion behaves like machinery, not like a web page: things are **fed, stamped,
stepped and indexed**.

- The Codex card feeds out of a slot in 14 discrete steps (`steps()` timing), then
  a stamp lands (scale 1.6 → 1, 320ms).
- X-ray moves on rails: a red "instruction pointer" triangle steps down the left
  margin from your code, through the section line, along the kernel call path and
  back. Bytes slide across the section line as a copied strip; the original stays
  put, because it is a copy.
- The CPU mode cell flips (scaleY) when the ring changes.
- Transform and opacity only; durations from the motion tokens in `@kernelfall/theme`
  (80/150/220/400/800ms).
- Under reduced motion everything becomes an instant state change and X-ray is a
  slideshow with the same narration.

## Sound mood (optional)

Office machinery of a well-kept lab: a soft teletype tick per objective, a stamp
thud for a filed card, a relay click when the CPU changes ring. No music under
work; a low, slow pad on the title screen.

## X-ray: how it is built

- **Rendering:** inline SVG built from small pieces: boxes, tables, code lines,
  byte-cell strips. Every label is real text (selectable, zoomable, read by screen
  readers through the narration), and it themes through the CSS variables.
- **State, not timelines:** each stage is a pure function `render(stage)` that sets
  text, classes and transforms. Stepping back is just rendering an earlier stage.
  Transitions animate only when moving forward by one. Playback is a timer that
  advances stages (4.2s ÷ speed); `Predict` pauses before chosen stages and never
  reveals the answer until the player has picked.
- **Depth switch:** `simple` and `deep` are two layers of the same drawing (CSS
  hides `.deep` or `.simple`). Simple shows the Gatekeeper, a "request slip"
  (the registers in plain words) and an "in the kernel now" desk; deep shows the CPU
  registers, `struct pt_regs`, `syscall_32.tbl`, the call path, page frames.
- **Mapping to the Machine's event stream:** the kernel's trace gives `sys_enter`
  (`pid`, `nr`, `name`, `args`, and `data` for a user buffer), `sys_exit` (`ret`),
  `sched_process_exit` and `console_write` (`bytes`). Those events anchor the
  stages: `sys_enter` opens stages 1–6 (number, arguments and buffer bytes come
  straight from the event), `console_write` drives stage 8, `sys_exit` drives 9–10.
  For fork: `sys_enter`/`sys_exit` of `fork` or `clone` (the child's pid in the
  parent, 0 in the child), `execve`, `write`, `exit_group`, then `sched_process_exit` (zombie) and
  `wait4`'s `sys_exit` (reaped). The trace has no register-level or kernel-function
  events, so the deep layer (the i386 registers, `pt_regs`, the entry code,
  `do_wp_page`) is a **scripted explanation keyed off those events**.
- **Content lives in data:** each stage is `{title, what, why, deeper, source[],
  gate?, predict?}`, kept apart from the drawing code.

## Pitfalls

- **Keep it a game, not a document.** The joy comes from motion and the world
  drawings (stamps, the district filling up, the instruction pointer).
- **Don't overdo heavy rules.** Every 2px line must be a real boundary (sheet edge,
  table, section line).
- **Light first, dark fully supported.** The theme follows the system setting.
- The editor (CodeMirror) and terminal (xterm.js) themes map directly onto the tokens.
