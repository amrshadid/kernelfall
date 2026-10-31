# Content

The folders mirror the Kernel Map: act → region → level. A number prefix gives the play order
(`10-x` comes after `9-y`); ids never include it.

```
skills.yaml                 the skill tree
bedrock.yaml                the map's bottom layer, under every act
xray/
  syscalls.yaml             per syscall: argument names, its kernel path, sources, one plain sentence
  narration.yaml            every word X-ray's storyboards say, with {placeholders}
0-prologue/
  act.yaml                  id, name, the act's map layer
  1-boot-path/
    region.yaml             id (the folder name after its number), name, boss, map caption,
                            kernel source, guide, layer or inLayer, slots in play order
    02-first-words/
      level.yaml            the level (docs/LEVELS.md); its act and region come from these folders
      story.md              scene, debrief, real-world card
      checker.ts            optional: what level.yaml can't declare
      starter/              the player's code at the start
      solution/             init's version, loaded only when asked for
```

A level's id is `<act id>-<region id>-<level folder>`, e.g. `prologue-boot-path-02-first-words`.

## Add a level

1. Make its folder in the region, named `<nn>-<slug>`, and point a slot of `region.yaml` at it:
   `- { number: "1.5", title: An Address and a Name, level: 05-address-and-name }`.
   Quote the number, so YAML keeps `1.10` as written.
2. Write `level.yaml` with the id above and `story.md` with every section it points at.
3. Give each objective and Taint rule a `check:` when a declared kind fits
   (`packages/game/src/types/definitions/checks.ts`). For the rest, write `checker.ts`:
   `export const checker = defineChecker({ check(input) { … } })`, using the query toolkit from
   `@kernelfall/game/utils`.
4. Add the reference solution's run (the lines typed at bash, the files put in place) to
   `REFERENCE_RUNS` in `src/test/reference-runs.ts`, then run `pnpm vm:record <level>`: it plays
   the run on the real Machine and writes the gzipped trace to `src/test/runs/<level>/`.
   `src/test/level-checkers.test.ts` checks every recorded run: the solution must pass with zero
   Taint.

## Explain a syscall in X-ray

A syscall missing from `xray/syscalls.yaml` still shows in X-ray, with its raw arguments and
entry point. To explain it, add an entry named as the i386 syscall table and strace name it
(`openat`, `fstatat64`) with its `args` in register order, `path` from its 32-bit wrapper inward
(`__ia32_` + the entry point in `arch/x86/entry/syscalls/syscall_32.tbl`, e.g.
`__ia32_sys_mmap_pgoff` for `mmap2`), `sources` and a `desk`
sentence; give it a `family` only if one of the storyboards (write, exit, execve, fork, wait)
fits. The comment at the top of each file lists its fields and placeholders. Both files are
checked when they load: a misspelt field, an unknown family or argument, or a missing stage
fails the levels tests.
