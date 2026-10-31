import type { MapDetail } from '@features/map/types'
import type { ActOutline, KernelMap, KernelMapLevel, SkillNode } from '@kernelfall/game/types'
import { hrefOf } from '@shared/navigation'
import type { MapNode } from '@shared/types'
import { formatDuration } from '@shared/utils/format'
import { STEPS, stepIndexOf, stepLabelOf } from '@shared/utils/level'
import { isDone, shortActName } from '@shared/utils/map'
import { PLAN_NOTES, TYPICAL_LEVEL_TIME } from './map-detail.constants'

/** What the panel reads besides the stop itself. */
export interface MapDetailSource {
  readonly acts: readonly ActOutline[]
  readonly skills: readonly SkillNode[]
  readonly map: KernelMap
}

/** The stop's action: back into a level under way, a replay of a done one, else a first play. */
export function playLabelOf(node: Pick<MapNode, 'state'>): string {
  if (node.state === 'progress') {
    return 'Continue'
  }
  return isDone(node) ? 'Replay' : 'Play'
}

/** Why the stop can't be played yet, or null when it can. */
export function planNoteOf(node: Pick<MapNode, 'levelId' | 'side' | 'state'>): string | null {
  if (node.levelId === null) {
    return node.side ? PLAN_NOTES.side : PLAN_NOTES.main
  }
  return node.state === 'locked' ? PLAN_NOTES.locked : null
}

/** "Played 23 min" once played; before that the level's own estimate, else the typical one. */
export function levelTimeOf(node: Pick<MapNode, 'minutes'>, activeMs: number | null): string {
  if (activeMs !== null) {
    return `Played ${formatDuration(activeMs)}`
  }
  return node.minutes === null ? TYPICAL_LEVEL_TIME : `About ${node.minutes} min`
}

function bestTaintOf(entry: KernelMapLevel | undefined): string {
  const best = entry?.record?.best
  if (best) {
    return `${best.taint}${best.taint === 0 ? ', clean' : ''}`
  }
  return entry?.record?.completedAt ? String(entry.taint) : 'Not finished yet'
}

export function mapDetailOf(node: MapNode, source: MapDetailSource): MapDetail {
  const outline = source.acts.find((candidate) => candidate.act === node.act)
  const regionName = outline?.regions.find((region) => region.id === node.regionId)?.name ?? ''
  const entry = node.levelId ? source.map.byId.get(node.levelId) : undefined
  const level = entry?.level
  const record = entry?.record
  const phase = record?.run?.phase
  const skillTitle = (id: string) => source.skills.find((skill) => skill.id === id)?.title ?? id
  return {
    // A region named like its only stop is said once.
    place: [...new Set([shortActName(outline?.name ?? ''), regionName, node.number])].join(' · '),
    title: node.title,
    state: node.state,
    planned: node.planned,
    status: node.status.charAt(0).toUpperCase() + node.status.slice(1),
    skills: (level?.skills ?? []).map((id) => ({ id, title: skillTitle(id) })),
    needs: (level?.prerequisites ?? []).map((id) => ({ id, met: source.map.unlockedSkills.has(id) })),
    step: phase ? `${stepLabelOf(phase)}, ${stepIndexOf(phase) + 1} of ${STEPS.length}` : null,
    time: levelTimeOf(node, record ? record.activeMs : null),
    bestTaint: bestTaintOf(entry),
    codex: (level?.codex ?? []).map((card) => ({
      id: card.id,
      term: card.term,
      href: hrefOf({ name: 'codex', cardId: card.id }),
    })),
    play:
      node.playable && node.levelId
        ? { label: playLabelOf(node), href: hrefOf({ name: 'play', levelId: node.levelId }) }
        : null,
    note: planNoteOf(node),
  }
}
