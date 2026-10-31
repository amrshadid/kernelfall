# @kernelfall/levels

The game's content and its loader: every act, region and level (story, starter, reference solution,
objectives, Taint rules, checker), the skill tree and the Kernel Map's text. The loader checks it all
with `@kernelfall/game`'s validators and hands the app one typed `LoadedContent`.

> **Note:** This package holds content and the logic that loads it. How to add a level is in
> [content/README.md](content/README.md); the rules are in [docs/LEVELS.md](../../docs/LEVELS.md).

## Structure

```
content/          → act → region → level, in play order (see content/README.md)
scripts/          → `pnpm vm:record`: plays every reference run on the real Machine (v86 in Node)
│                   and saves its traced commands as src/test/runs/<level>/<run>.json.gz
src/
├── types/        → LoadedContent, ContentFiles, Story, LevelPlace, LevelLabel; X-ray's text (xray)
├── utils/
│   ├── loader/   → CONTENT_FILES (import.meta.glob over content/), loadContent, appContent,
│   │               content paths (play-order prefixes)
│   ├── story/    → parseStory, sectionOf, slugify
│   ├── label/    → labelOf ("1.4 Run Anything")
│   ├── solutions/→ loadReferenceFiles (init's version, loaded lazily)
│   ├── terminal/ → plainText (a program's output without terminal colour codes)
│   └── xray/     → X-ray's syscall and process text, its templates and cache
├── test/         → loadedContent, levelUnderTest, LabEventLog (edge cases), REFERENCE_RUNS and
│                   the runs recorded from them on the real Machine; every reference solution
│                   through its checker with zero Taint (not exported)
└── index.ts      → Barrel export (the app uses `/types` and `/utils`)
```

## Key Features

- **Mirrors the map** — folders go act → region → level, numbered in play order; a level's id is
  `<act>-<region>-<level folder>`, so saves keep working when content moves.
- **Checked at startup** — every problem in every file is listed with its file and field; the app
  shows the list instead of a half-valid game.
- **More than levels** — `field-guide.yaml` (the Codex page of commands and folders) and each
  region's optional `placement.yaml` (tasks that let a player skip its levels) load with the rest.
- **Bundled** — Vite inlines the content at build time; `solution/` loads only when the
  player asks for init's version.
- **Reference solutions pass** — each built level's solution passes its checker with zero Taint.

## Dependencies

- `@kernelfall/game` — validators, `createGameContent`, `defineChecker` and the query toolkit
- `@kernelfall/machine` — the event types and uapi constants checkers read, the `lab:` block's schema
- `yaml` — parses the content files
