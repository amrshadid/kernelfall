import { useXray } from '@app/store'
import { XrayPanelPresentation } from '@features/xray/components/board'
import { useLiveRun, useXrayBoard, useXrayControls, useXrayMotion } from '@features/xray/hooks/board'
import { callFocusOf } from '@features/xray/utils/call-list'
import { lensesOf } from '@features/xray/utils/panel'
import { useActiveLevel } from '@kernelfall/game/hooks'
import { useBootRecord, useMachineCpus, useRunEvents, useSyscallTrace } from '@kernelfall/machine/hooks'
import { useMemo } from 'react'

/** With the X-ray setting off the trace keeps recording, but nothing is shown. */
export function XrayContainer() {
  const { xray } = useXray()
  const { level, phase } = useActiveLevel()
  const levelId = level?.id ?? null
  const lenses = useMemo(() => lensesOf(level?.xray), [level])
  const focus = useMemo(() => callFocusOf(level ?? null), [level])
  const { runs, latest } = useSyscallTrace()
  const state = useXrayControls(levelId, lenses, latest?.id)
  const picked = (state.runId !== null ? runs.find((r) => r.id === state.runId) : undefined) ?? latest
  const { run, events } = useLiveRun(picked, useRunEvents(picked?.id ?? null))
  const animate = useXrayMotion()
  const scope = useMemo(() => ({ levelId, step: phase }), [levelId, phase])
  const cpus = useMachineCpus()
  const boot = useBootRecord()
  const board = useXrayBoard({ runs, run, events, lenses, state, animate, scope, cpus, boot, focus })

  if (!xray) {
    return null
  }

  return <XrayPanelPresentation {...board} animate={animate} />
}
