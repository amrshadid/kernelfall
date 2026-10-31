# Contributing to Kernelfall

Thanks for helping people learn the Linux kernel. Read
[ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the code fits together, and
[LEVELS.md](docs/LEVELS.md) if you're making a level. [ROADMAP.md](docs/ROADMAP.md) lists
what to work on next.

## Setup

Requirements: Node.js 22 (see `.nvmrc`; 24.15+ and 26+ also work, 23 doesn't), pnpm 10+,
and a network connection for the first image build.

```sh
pnpm install
pnpm vm:image    # build the Linux image the game boots (once, and after the lock changes)
pnpm dev         # run the game locally
pnpm test        # all tests
pnpm type-check  # TypeScript in every package
pnpm format      # format and apply safe lint fixes (Biome; clang-format for C)
pnpm verify      # everything CI runs: lint, types, tests, build
```

`pnpm vm:image` writes the image to `apps/web/public/vm/` (about 117 MB, not committed).
Level authors also use `pnpm vm:record` to record golden runs on it
([LEVELS.md](docs/LEVELS.md#golden-runs)).

## Workflow

- Open an issue before a new feature, package, dependency or level.
- One concern per branch and per pull request. Branch names: `<type>/<topic>`,
  e.g. `fix/trace-parser`.
- Commits and PR titles use [Conventional Commits](https://www.conventionalcommits.org/):
  `feat(machine): trace sendfile's data`. Types: `feat`, `fix`, `refactor`, `test`,
  `docs`, `chore`, `build`, `ci`, `perf`. Scopes: `core`, `machine`, `theme`, `game`,
  `levels`, `web`, `docs`, `repo`, `ci`, `deps`.
- PRs are squash-merged, so the PR title becomes the commit on `main`.

## Code rules

Biome formats and lints everything. TypeScript is `strict`: no `any`, named exports
only, and expected failures are values (`ServiceResponse`), not exceptions. Log through
core's `logger`, never `console` (only the logger and the Node scripts may use it).

### Packages hold logic or values, never UI

No components or CSS in `packages/`; React only in a package's `hooks/`. All UI lives
in `apps/web`. A package may import only the packages in its `package.json`
(pnpm and TypeScript reject anything else); the allowed ones are in
[ARCHITECTURE.md](docs/ARCHITECTURE.md#packages).

### Package layout

A package's `src/` holds only role folders; domains are sub-folders inside a role,
each with an `index.ts` barrel. Each package's README shows its tree.

```
packages/game/src/
  index.ts                            exports everything + configureGame
  config.ts                           what the app injects: configureGame(), getGameConfig()…
  events/types.ts                     GAME_EVENTS = { LEVEL_STARTED: 'GAME_LEVEL_STARTED' } + payloads
  events/listeners.ts                 setupGameListeners() / cleanupGameListeners()
  services/api/save.api.ts            saveApi: a boundary, every method returns ServiceResponse
  services/utils/error-handling.service.ts
  store/progress.store.ts             zustand: State + Actions, initialState, devtools, reset
  hooks/level/useLevelActions.hook.ts runs a flow: calls services, writes the store, emits events
  types/definitions/level.ts          shared types and their constants
  utils/runner/level-runner.util.ts   pure functions, tested in level-runner.util.test.ts
  test/                               fakes and fixtures, never exported
```

- **Types:** a type used by one file is declared in that file. Types used by several
  files go in `types/definitions/<domain>.ts`. No `*.types.ts` files.
- A group of services that work together sits in one folder beside `api/` and `utils/`
  (`machine/services/vm/`).
- `machine` also holds `scripts/vm-image/` (the image build) and `levels` holds
  `scripts/` (the recorder).
- `theme` holds values only: `palettes/`, `typography/`, `spacing/`, `motion/`, `utils/`.
- `levels` also holds `content/`, laid out act → region → level, numbered in play order
  ([LEVELS.md](docs/LEVELS.md)):

  ```
  packages/levels/content/
    1-act-1/act.yaml
    1-act-1/2-process-district/region.yaml
    1-act-1/2-process-district/04-run-anything/{level.yaml, story.md, checker.ts?, starter/, solution/}
  ```

- `package.json` exports `.` and a sub-entry for each role the package has (`./types`,
  `./hooks`, `./utils`, `./services`, `./store`, `./events`). The app imports only
  `/hooks`, `/types`, `/utils` and the root's `configureX` and `setupXListeners`.

### Imports

In a package: one `#` map per role in `package.json`, no extension, barrels by path,
never relative.

```ts
import { useProgressStore } from '#store/progress.store'
import type { LevelDefinition } from '#types/index'
import { eventBus } from '@kernelfall/core/services' // across packages
```

In the app: `@/`, `@app/`, `@shared/`, `@features/`, `@pages/`; `./x` only for a file
in the same folder; never `../`.

```ts
import { useActiveLevel } from '@kernelfall/game/hooks'
import { LevelLayoutContainer } from '@features/level'
import { panelsFor } from '@features/level/utils/view'
```

### File names

| Where              | Names                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| packages           | kebab-case + role: `.api.ts` `.service.ts` `.store.ts` `.util.ts` `.schema.ts` `.constants.ts` `.test.ts` |
| shared types       | `types/definitions/<domain>.ts`                                                                           |
| hooks (everywhere) | `useX.hook.ts`, tested in `useX.hook.test.ts`                                                             |
| `apps/web`         | `XPage.tsx`, `XContainer.tsx`, `XPresentation.tsx`, building blocks `PascalCase.tsx`                      |
| `apps/web` utils   | `<name>.util.ts`, with `<name>.constants.ts` beside it                                                    |

Biome checks these names: role suffixes in `services/`, `store/`, `utils/` and `hooks/`,
kebab-case elsewhere in packages. Tests sit next to the file they test. Use the real
kernel name when there is one (`copy_to_user`, `sys_enter`).

### Web app layers

```
apps/web/src/
  main.tsx, App.tsx   configure every package, then render
  app/                providers (setupXListeners), routing, store, theme
  pages/<area>/       XPage.tsx, lazy-loaded from index.ts
  features/<f>/
    components/<group>/   LevelScreenPresentation.tsx, LevelTopBar.tsx, index.ts
    containers/<group>/   LevelLayoutContainer.tsx, index.ts
    hooks/<area>/         useLevelRun.hook.ts, index.ts
    types/definitions/    types shared inside the feature
    utils/<area>/         level-view.util.ts (+ level-view.constants.ts), index.ts
    index.ts              exports the containers
  shared/             components/<group>/, constants/, hooks/<area>/, navigation/, styles/,
                      types/definitions/, utils/<area>/
```

- **Pages** render containers and may pass one container into another as a slot.
- **Containers** (`XContainer.tsx`) call package hooks and render one presentation.
- **Presentations** (`XPresentation.tsx`) are only what a container renders. They take
  props and call callbacks, and never import containers, package hooks or stores.
  Their building blocks are plain components (`LevelTopBar.tsx`), never `*Presentation`.
- **Hooks and utils** live in an area folder with an `index.ts` barrel, never flat in
  `hooks/` or `utils/`. Feature hooks hold UI concerns only (view state, focus,
  layout); business flows are package hooks.
- **State:** packages own theirs; the app's `useAppStore` holds UI settings.

### Comments and docstrings

Comments say _why_, not _what_. Add a docstring only where the name and type aren't
enough.

```ts
// Copy so listeners can unsubscribe while being notified.
for (const listener of [...this.#listeners]) { … }
```

Fixed markers, so they can be searched:

| Marker                           | Example                             |
| -------------------------------- | ----------------------------------- |
| `// models <path>: <function>()` | `// models fs/pipe.c: pipe_write()` |
| `// SIMPLIFIED: …`               | `// SIMPLIFIED: no partial writes`  |
| `// TODO(#issue): …`             | `// TODO(#42): handle O_NONBLOCK`   |

No commented-out code, and no comments in `starter/` that hint at a planted bug.

### C in levels

Player C is compiled by gcc inside the Machine. The C files in the repo (starters and
reference solutions) are formatted by clang-format with the repo's `.clang-format`
(the kernel style); `pnpm check:c` checks them.

Kernel code follows the
[kernel coding style](https://www.kernel.org/doc/html/latest/process/coding-style.html)
(tabs, `/* */` comments), starts with `// SPDX-License-Identifier: GPL-2.0`, declares
`MODULE_LICENSE("GPL")`, documents functions with
[kernel-doc](https://www.kernel.org/doc/html/latest/doc-guide/kernel-doc.html) where
needed, and unwinds errors with `goto`:

```c
	err = cdev_add(&lantern_cdev, devt, 1);
	if (err)
		goto out_unregister;
	return 0;

out_unregister:
	unregister_chrdev_region(devt, 1);
	return err;
```

Reference solutions pass `checkpatch.pl`. Userspace C is C11, builds cleanly with
`gcc -Wall -Wextra`, and checks every syscall's return value.

## Pull request checklist

- [ ] The PR title follows Conventional Commits.
- [ ] `pnpm verify` passes.
- [ ] New behavior has tests; a level change has golden runs recorded on the real image.
- [ ] Docs are updated if a rule or decision changed.
- [ ] A change players or contributors notice has a line under `Unreleased` in
  [CHANGELOG.md](CHANGELOG.md).

Found something that doesn't match real Linux? Open an **Inaccuracy** issue with a
source (kernel code, docs or a man page).
