# @kernelfall/game

The game's rules, with no level built in: the level loop (scene → see it → build it → watch it →
card), checkers (declared checks and a query toolkit over the Machine's events), hints and Taint, the
Codex, achievements, and the player's progress saved in the browser. The levels themselves come
from `@kernelfall/levels`.

> **Note:** This package contains only the logic layer. The app uses `configureGame()`,
> `setupGameListeners()`, `/hooks`, `/types` and `/utils`; the screens live in `apps/web/src/features/`.

## Structure

```
src/
├── types/        → levels (and their command chips), checks (objective and Taint kinds), checker,
│                   queries, outline (acts, regions, slots, map layers), placement, field guide,
│                   content, runner, hints, taint, codex, achievements, progress, saves, config
├── services/
│   ├── api/      → saveApi: load, write, remove (atomic writes, `.prev` fallback)
│   └── utils/    → the save queue, saveProgress, storage keys, and the game's failures as
│                   ServiceResponses (storage, locked level, invalid save…)
├── store/        → progress store
├── hooks/
│   ├── level/    → useLevelActions, useLevelCode, useRunDispatch (the loop's shared step),
│   │               useActiveLevel, useLevelStatus, useLevelCheck
│   ├── map/      → useKernelMap
│   ├── notifications/ → useAchievementUnlocked, useCodeReplaced, useLevelCompleted, useSaveFailed,
│   │                    useHintRevealed
│   ├── saves/    → useSaveActions, useAnnounceProgress
│   ├── progress/ → useProgress, useContinue
│   ├── placement/ → usePlacementActions
│   ├── hints/    → useHints
│   ├── codex/    → useCodex, useCodexChapters, useFieldGuide
│   └── summary/  → useProgressSummary
├── utils/        → queries (processes, children, execs and their argv, exits, reaps, syscalls,
│                   writes, files opened and read, errno, the terminal), checker (declared checks,
│                   levelChecker, defineChecker, verdicts), content (createGameContent), validate
│                   (level.yaml, act.yaml, region.yaml, placement.yaml, field-guide.yaml,
│                   skills.yaml), placement (judge, merge, result), field-guide, runner, map, taint,
│                   hints, progress, saves, achievements, codex (cards, chapters), skills, summary
├── events/       → GAME_EVENTS (opened, level started/completed, hint, achievement, saved…), autosave
├── test/         → example level and outline, hand-written lab events, fake clock, memory storage,
│                   installTestGame, renderGameActions, RTL setup (not exported)
├── config.ts     → configureGame (storage, content, options), getGameConfig, resetGameConfig
└── index.ts      → configureGame, setupGameListeners, cleanupGameListeners
```

## Key Features

- **A pure engine** — no level is known by id: content is validated and bundled by
  `createGameContent({ acts, levels, skills, checkers, fieldGuide })`.
- **Declared checks** — an objective's or Taint rule's `check:` in level.yaml (`compiles`,
  `build-fixed`, `exit-status`, `wrote`, `terminal`, `syscall`, `no-zombies-after`, `ran`,
  `read-to-end`; `unreaped-children`, `ran-program`) is judged by the engine; the rest goes in the
  level's own `checker.ts`, written with `defineChecker()` and the query toolkit.
- **Placement checks** — a region's tasks are judged by its levels' own checkers; a passed task
  completes its level `via: 'placement'`, with no score and no Taint.
- **Checkers read behaviour** — verdicts come from the Machine's event stream, never the player's source.
- **Never lose progress** — every change autosaves before the flow resolves; a save that can't be
  read is never overwritten; a save from a newer version is refused.
- **No dead ends** — the player can always continue with init's reference version.

## Dependencies

- `@kernelfall/core` — event bus, service responses, storage adapter
- `@kernelfall/machine` — the event types checkers read, errno names, the `lab:` block's schema
- `zustand` — the progress store
