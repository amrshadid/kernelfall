import { useContent } from '@features/content/hooks'
import { PlacementPresentation } from '@features/placement/components/placement'
import { usePlacementCheck } from '@features/placement/hooks/check'
import { placementRows, placementSummary } from '@features/placement/utils/check'
import { usePlacementActions } from '@kernelfall/game/hooks'
import type { LevelId, PlacementCheck, RegionOutline } from '@kernelfall/game/types'
import { labelOf } from '@kernelfall/levels/utils'
import { useCommandResults, useMachineSetup } from '@kernelfall/machine/hooks'
import { hrefOf } from '@shared/navigation'
import type { ReactNode } from 'react'

export interface PlacementContainerProps {
  act: string
  regionId: string
  terminal: ReactNode
  /** The editor for a task's level, with that level's starter files. */
  editor: (levelId: LevelId) => ReactNode
}

/** A region's placement check: the offer, one task at a time on that level's Machine, then the result. */
export function PlacementContainer({ act, regionId, terminal, editor }: PlacementContainerProps) {
  const content = useContent()
  const region = content.game.acts.find((each) => each.act === act)?.regions.find((each) => each.id === regionId)
  if (!region?.placement) {
    return (
      <p className="placement">
        This region has no placement check. <a href={hrefOf({ name: 'map' })}>Back to the map</a>
      </p>
    )
  }
  return <Check region={region} check={region.placement} terminal={terminal} editor={editor} />
}

interface CheckProps {
  region: RegionOutline
  check: PlacementCheck
  terminal: ReactNode
  editor: (levelId: LevelId) => ReactNode
}

function Check({ region, check, terminal, editor }: CheckProps) {
  const content = useContent()
  const { place } = usePlacementActions()
  const state = usePlacementCheck({ content: content.game, check, place })
  const levelId = check.tasks[state.index]?.levelId ?? null
  // Each task runs on its own level's Machine and is judged by what its commands made the kernel do.
  useMachineSetup(levelId ? content.game.level(levelId)?.lab : undefined, `placement:${levelId ?? 'none'}`)
  useCommandResults((result) => state.judge(result.events))

  const nameOf = (id: LevelId) => {
    const label = labelOf(content, id)
    return label ? `${label.number} ${label.title}` : id
  }
  const lastTask = check.tasks.at(-1)?.levelId
  const afterTasks = region.slots.slice(region.slots.findIndex((slot) => slot.levelId === lastTask) + 1)
  const capstone = afterTasks.find((slot) => slot.levelId !== null)?.levelId ?? null
  const next = state.result?.sendTo ?? capstone
  const first = check.tasks[0]?.levelId

  return (
    <PlacementPresentation
      regionName={region.name}
      offer={check.offer}
      minutes={check.minutes}
      step={state.step}
      rows={placementRows(check, state.progress, nameOf)}
      index={state.index}
      summary={state.result ? placementSummary(state.result, nameOf) : null}
      firstLevelHref={first ? hrefOf({ name: 'play', levelId: first }) : hrefOf({ name: 'map' })}
      nextHref={next ? hrefOf({ name: 'play', levelId: next }) : hrefOf({ name: 'map' })}
      workbench={
        <>
          {levelId && editor(levelId)}
          {terminal}
        </>
      }
      onBegin={state.begin}
      onGoTo={state.goTo}
      onFinish={() => void state.finish()}
      onRetake={state.retake}
    />
  )
}
