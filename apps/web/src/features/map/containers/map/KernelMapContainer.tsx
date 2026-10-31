import { useScreenChrome } from '@features/chrome/hooks/screen'
import { useContent } from '@features/content/hooks/content'
import { KernelMapPresentation } from '@features/map/components/map'
import { useMapMotion } from '@features/map/hooks/drawing'
import type { MapView } from '@features/map/types'
import { EMPTY_DETAIL, mapDetailOf } from '@features/map/utils/detail'
import { mapNotesOf } from '@features/map/utils/note'
import { useTourScreen } from '@features/tour/hooks/tour'
import { useContinue, useKernelMap, useProgressSummary } from '@kernelfall/game/hooks'
import { labelOf } from '@kernelfall/levels/utils'
import { APP_VERSION_LABEL } from '@shared/constants/app'
import { hrefOf, navigateTo } from '@shared/navigation'
import { actNameOf, currentAct, mapLayers, mapNodes } from '@shared/utils/map'
import { useCallback, useMemo, useState } from 'react'

export function KernelMapContainer() {
  const chrome = useScreenChrome()
  useTourScreen('map')
  const content = useContent()
  const map = useKernelMap()
  const target = useContinue()
  const summary = useProgressSummary()
  const reducedMotion = useMapMotion()
  const [view, setView] = useState<MapView>('levels')

  const hereId = target?.levelId ?? null
  const nodes = useMemo(() => mapNodes(content, map, hereId), [content, map, hereId])
  // In the Skills view a built level's stop is named by the first skill it teaches.
  const shown = useMemo(
    () =>
      view === 'levels'
        ? nodes
        : nodes.map((node) => {
            const first = node.levelId ? content.game.level(node.levelId)?.skills[0] : undefined
            const title = first ? content.game.skills.find((skill) => skill.id === first)?.title : undefined
            return title ? { ...node, title } : node
          }),
    [nodes, view, content]
  )
  const layers = useMemo(() => mapLayers(content, shown), [content, shown])
  const notes = useMemo(() => mapNotesOf(layers, map), [layers, map])
  const hereNode = nodes.find((node) => node.here)
  const [selectedKey, setSelectedKey] = useState<string | null>(hereNode?.key ?? null)
  const selected = nodes.find((node) => node.key === selectedKey) ?? hereNode ?? nodes[0]

  // Stable while the nodes are, so the memoized drawing doesn't render for a selection.
  const play = useCallback(
    (key: string) => {
      const node = nodes.find((candidate) => candidate.key === key)
      if (node?.playable && node.levelId) {
        navigateTo({ name: 'play', levelId: node.levelId })
      }
    },
    [nodes]
  )

  const act = currentAct(nodes)
  const actSummary = summary.acts.find((entry) => entry.act === act)
  const recommendedLabel = target ? labelOf(content, target.levelId) : null

  return (
    <KernelMapPresentation
      chrome={chrome}
      titleHref={hrefOf({ name: 'title' })}
      view={view}
      onView={setView}
      recommended={
        target && recommendedLabel
          ? { label: recommendedLabel.heading, href: hrefOf({ name: 'play', levelId: target.levelId }) }
          : null
      }
      section={{
        layers,
        notes,
        selectedKey: selected?.key ?? null,
        reducedMotion,
        onSelect: setSelectedKey,
        onPlay: play,
      }}
      detail={selected ? mapDetailOf(selected, { acts: content.acts, skills: content.game.skills, map }) : EMPTY_DETAIL}
      summary={`${actNameOf(content.acts, act)}: ${actSummary?.completed ?? 0} of ${actSummary?.total ?? 0} built levels rebuilt · Taint ${actSummary?.taint ?? 0}`}
      version={APP_VERSION_LABEL}
    />
  )
}
