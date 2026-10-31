import type { FieldGuideRow, FieldGuideSection } from '@features/codex/types'
import type { FieldGuideEntry } from '@kernelfall/game/types'
import { hrefOf } from '@shared/navigation'

/** A slot of the outline, for naming the levels an entry points at. */
export interface FieldGuideSlot {
  readonly number: string
  readonly title: string
}

/** A Codex card the player has found, to link a syscall to. */
export interface FieldGuideCard {
  readonly id: string
  readonly term: string
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The card about a syscall: `write(2)`, or a term that names it in brackets, `reading a folder (getdents64)`. */
export function cardForSyscall(cards: readonly FieldGuideCard[], syscall: string): FieldGuideCard | undefined {
  const name = escapeRegExp(syscall)
  const pattern = new RegExp(`^${name}\\(\\d?\\)|\\(${name}\\)$|^${name}$`)
  return cards.find((card) => pattern.test(card.term))
}

function slotText(slots: ReadonlyMap<string, FieldGuideSlot>, number: string): string {
  const slot = slots.get(number)
  return slot ? `${slot.number} ${slot.title}` : number
}

function rowOf(
  entry: FieldGuideEntry,
  cards: readonly FieldGuideCard[],
  slots: ReadonlyMap<string, FieldGuideSlot>
): FieldGuideRow {
  return {
    name: entry.name,
    what: entry.what,
    syscalls: entry.syscalls.map((syscall) => {
      const card = cardForSyscall(cards, syscall)
      return { text: syscall, href: card ? hrefOf({ name: 'codex', cardId: card.id }) : null }
    }),
    syscallNote: entry.syscallNote ?? null,
    firstMet: slotText(slots, entry.firstMet),
    deepenedIn: entry.deepenedIn.map((number) => slotText(slots, number)),
  }
}

/** The page in two parts, commands then folders, each in the guide's own order. */
export function fieldGuideSections(
  entries: readonly FieldGuideEntry[],
  cards: readonly FieldGuideCard[],
  slots: readonly FieldGuideSlot[]
): readonly FieldGuideSection[] {
  const bySlot = new Map(slots.map((slot) => [slot.number, slot]))
  const section = (title: string, kind: FieldGuideEntry['kind']): FieldGuideSection => ({
    title,
    rows: entries.filter((entry) => entry.kind === kind).map((entry) => rowOf(entry, cards, bySlot)),
  })
  return [section('Commands', 'command'), section('Folders', 'folder')].filter((s) => s.rows.length > 0)
}
