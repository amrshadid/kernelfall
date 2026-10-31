import type { MapNote, MapNotes, MapNoteTarget, SceneLayer } from '@features/map/types'
import { levelTimeOf } from '@features/map/utils/detail'
import type { KernelMap } from '@kernelfall/game/types'
import type { LayerId, MapLayer, MapNode, MapRegion } from '@shared/types'
import { isDone } from '@shared/utils/map'
import { NOTE_STATES, NOTE_TAGS } from './map-note.constants'

/** "a", "a and b", "a, b and c". */
function listOf(words: readonly string[]): string {
  return words.length < 2 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

/** The stops that teach the skills a locked level still needs, in play order. */
function blockersOf(node: MapNode, nodes: readonly MapNode[], map: KernelMap): readonly MapNode[] {
  const needs = map.byId.get(node.levelId ?? '')?.level.prerequisites ?? []
  const missing = needs.filter((skill) => !map.unlockedSkills.has(skill))
  return nodes.filter((candidate) => {
    const taught = map.byId.get(candidate.levelId ?? '')?.level.skills ?? []
    return candidate.key !== node.key && taught.some((skill) => missing.includes(skill))
  })
}

/** "Next up", "Done, Taint 2", "Locked: finish P.3 Speak to the Shell first". */
export function stopStateOf(node: MapNode, nodes: readonly MapNode[], map: KernelMap): string {
  const taint = map.byId.get(node.levelId ?? '')?.taint ?? 0
  switch (node.state) {
    case 'locked': {
      if (node.planned) {
        return NOTE_STATES.planned
      }
      const blockers = blockersOf(node, nodes, map).map((stop) => `${stop.number} ${stop.title}`)
      return blockers.length === 0 ? NOTE_STATES.lockedUnknown : `Locked: finish ${listOf(blockers)} first`
    }
    case 'available':
      return node.here ? NOTE_STATES.next : NOTE_STATES.available
    case 'progress':
      return NOTE_STATES.progress
    case 'helped':
      return `${NOTE_STATES.helped}, Taint ${taint}`
    default:
      return `${NOTE_STATES.done}, Taint ${taint}`
  }
}

export function stopNoteOf(node: MapNode, region: MapRegion, nodes: readonly MapNode[], map: KernelMap): MapNote {
  const record = map.byId.get(node.levelId ?? '')?.record
  const tag = node.boss ? NOTE_TAGS.boss : node.side ? NOTE_TAGS.side : null
  return {
    title: `${node.number} · ${node.title}`,
    text: node.summary,
    facts: [
      stopStateOf(node, nodes, map),
      levelTimeOf(node, record && isDone(node) ? record.activeMs : null),
      tag,
      region.info ? `Guide: ${region.info.guide}` : null,
    ].filter((fact) => fact !== null),
  }
}

export function regionNoteOf(region: MapRegion): MapNote {
  const done = region.nodes.filter(isDone).length
  return {
    title: region.name,
    text: region.info
      ? `The part of Linux it stands for: ${region.info.caption}. In the kernel source: ${region.info.source}.`
      : '',
    facts: [
      region.boss ? NOTE_TAGS.boss : null,
      region.info ? `Guide: ${region.info.guide}` : null,
      `${done} of ${region.nodes.length} rebuilt`,
    ].filter((fact) => fact !== null),
  }
}

export function layerNoteOf(layer: MapLayer): MapNote {
  return { title: `What lives here · ${layer.name}`, text: layer.note, facts: [] }
}

export function mapNotesOf(layers: readonly MapLayer[], map: KernelMap): MapNotes {
  const regions = layers.flatMap((layer) => layer.regions)
  const nodes = regions.flatMap((region) => region.nodes)
  return {
    stops: new Map(
      regions.flatMap((region) => region.nodes.map((node) => [node.key, stopNoteOf(node, region, nodes, map)] as const))
    ),
    regions: new Map(regions.map((region) => [region.key, regionNoteOf(region)] as const)),
    layers: new Map(layers.map((layer) => [layer.id, layerNoteOf(layer)] as const)),
  }
}

/** The note for the target, else for the layer in view. */
export function noteOf(target: MapNoteTarget | null, notes: MapNotes, inView: LayerId | null): MapNote | undefined {
  const found =
    target?.kind === 'stop'
      ? notes.stops.get(target.key)
      : target?.kind === 'region'
        ? notes.regions.get(target.key)
        : target?.kind === 'layer'
          ? notes.layers.get(target.id)
          : undefined
  return found ?? (inView ? notes.layers.get(inView) : undefined)
}

export function sameTarget(a: MapNoteTarget | null, b: MapNoteTarget | null): boolean {
  if (a === null || b === null) {
    return a === b
  }
  return a.kind === 'layer' ? b.kind === 'layer' && a.id === b.id : a.kind === b.kind && 'key' in b && a.key === b.key
}

/** The region band or layer at drawing height `y`; stops answer for themselves. */
export function targetAt(layers: readonly SceneLayer[], y: number): MapNoteTarget | null {
  const layer = layers.find((candidate) => y >= candidate.top && y < candidate.bottom)
  if (!layer) {
    return null
  }
  const region = layer.regions.find((candidate) => y >= candidate.top && y < candidate.bottom)
  return region ? { kind: 'region', key: region.key } : { kind: 'layer', id: layer.id }
}
