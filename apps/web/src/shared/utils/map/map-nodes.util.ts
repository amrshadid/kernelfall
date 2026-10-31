import type {
  Act,
  ActOutline,
  KernelMap,
  LevelId,
  LevelProgress,
  LevelStatus,
  RegionOutline,
  SlotOutline,
} from '@kernelfall/game/types'
import type { LoadedContent } from '@kernelfall/levels/types'
import type { MapNode, NodeState } from '@shared/types'
import { DONE_STATES, STATUS_WORDS } from './map-nodes.constants'

export function isDone(node: Pick<MapNode, 'state'>): boolean {
  return DONE_STATES.has(node.state)
}

/** The road is inked up to the last stop that isn't locked. */
export function isReached(node: Pick<MapNode, 'state'>): boolean {
  return node.state !== 'locked'
}

/** `act2/mainline`. */
export function regionKeyOf(act: Act, regionId: string): string {
  return `${act}/${regionId}`
}

function nodeStateOf(status: LevelStatus, record: LevelProgress | undefined): NodeState {
  switch (status) {
    case 'locked':
      return 'locked'
    case 'available':
      return 'available'
    case 'in_progress':
      return 'progress'
    case 'completed':
      if (record?.best?.via === 'reference') {
        return 'helped'
      }
      return record?.best?.taint === 0 ? 'clean' : 'done'
  }
}

function slotNode(
  slot: SlotOutline,
  region: RegionOutline,
  act: ActOutline,
  map: KernelMap,
  hereId: LevelId | null
): MapNode {
  const regionKey = regionKeyOf(act.act, region.id)
  const shared = {
    key: `${regionKey}/${slot.number}`,
    number: slot.number,
    title: slot.title,
    act: act.act,
    regionId: region.id,
    regionKey,
    side: slot.optional,
    boss: region.boss,
    summary: slot.summary ?? `Part of ${region.name}, which covers ${region.caption}.`,
    minutes: slot.minutes ?? null,
  }
  if (slot.levelId === null) {
    return {
      ...shared,
      levelId: null,
      state: 'locked',
      status: 'not built yet',
      playable: false,
      planned: true,
      here: false,
    }
  }
  const entry = map.byId.get(slot.levelId)
  // A slot whose level the game doesn't know can't be played.
  const status = entry?.status ?? 'locked'
  const state = nodeStateOf(status, entry?.record)
  const here = slot.levelId === hereId
  return {
    ...shared,
    levelId: slot.levelId,
    state,
    status: here ? `${STATUS_WORDS[state]}, you are here` : STATUS_WORDS[state],
    playable: status !== 'locked',
    planned: false,
    here,
  }
}

/** The stops in play order; `hereId` is where Continue goes. */
export function mapNodes(content: LoadedContent, map: KernelMap, hereId: LevelId | null): readonly MapNode[] {
  return content.acts.flatMap((act) =>
    act.regions.flatMap((region) => region.slots.map((slot) => slotNode(slot, region, act, map, hereId)))
  )
}

/** The act of where Continue goes, else of the last level finished, else the first act. */
export function currentAct(nodes: readonly MapNode[]): Act {
  const here = nodes.find((node) => node.here)
  if (here) {
    return here.act
  }
  const lastDone = [...nodes].reverse().find(isDone)
  return lastDone?.act ?? nodes[0]?.act ?? 'prologue'
}
