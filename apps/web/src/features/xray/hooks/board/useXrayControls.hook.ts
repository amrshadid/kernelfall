import { useXrayPrefs } from '@app/store'
import type { XrayChoice, XrayControlState, XrayLens } from '@features/xray/types'
import { useEffect, useState } from 'react'

/** Depth, Predict and the view per level survive reloads; the rest is per visit. A new command always takes the panel to it. */
export function useXrayControls(
  levelId: string | null,
  lenses: readonly XrayChoice<XrayLens>[],
  latestRunId: number | undefined
): XrayControlState {
  const prefs = useXrayPrefs()
  const [runId, setRunId] = useState<number | null>(null)
  const [pick, setPick] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: only a new run resets the selection
  useEffect(() => {
    setRunId(null)
    setPick(null)
  }, [latestRunId])

  // The level's first view leads, unless the player picked one it has.
  const picked = levelId !== null ? prefs.lenses[levelId] : undefined
  const lens = picked !== undefined && lenses.some((l) => l.id === picked) ? picked : (lenses[0]?.id ?? 'syscalls')

  return {
    lens,
    depth: prefs.depth,
    predict: prefs.predict,
    runId,
    pick,
    expanded,
    setLens: (next) => {
      if (levelId !== null) {
        prefs.setLens(levelId, next)
      }
      setPick(null)
    },
    setDepth: prefs.setDepth,
    setPredict: prefs.setPredict,
    selectRun: (id) => {
      setRunId(id)
      setPick(null)
    },
    select: setPick,
    setExpanded,
  }
}
