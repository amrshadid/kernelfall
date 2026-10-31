import type { ContinueTarget } from '@features/title/types'
import type { ActSummary, LastActive } from '@kernelfall/game/types'
import type { LevelLabel } from '@kernelfall/levels/types'
import { hrefOf } from '@shared/navigation'
import type { ContentsEntry } from '@shared/types'
import { formatLastPlayed } from '@shared/utils/format'
import { stepLabelOf } from '@shared/utils/level'
import { shortActName } from '@shared/utils/map'

export interface ContinueTargetInput {
  readonly target: LastActive
  readonly label: LevelLabel
  /** " · last played 2 days ago", or empty before the first save. */
  readonly lastPlayed: string
}

export interface TitleContentsInput {
  /** The act the player is in, short: "Act I". */
  readonly actName: string
  readonly actSummary: ActSummary | undefined
  readonly codexCards: number
  readonly onNewGame: () => void
}

export function titleContentsOf({ actName, actSummary, codexCards, onNewGame }: TitleContentsInput): ContentsEntry[] {
  return [
    { id: 'new', name: 'New game', reference: 'from First Boot', onSelect: onNewGame },
    {
      id: 'map',
      name: 'Kernel Map',
      reference: actSummary ? `${actName}, ${actSummary.completed} of ${actSummary.total} rebuilt` : 'the Machine',
      href: hrefOf({ name: 'map' }),
    },
    {
      id: 'codex',
      name: 'Codex',
      reference: `${codexCards} card${codexCards === 1 ? '' : 's'} filed`,
      href: hrefOf({ name: 'codex', cardId: null }),
    },
    {
      id: 'settings',
      name: 'Settings',
      reference: 'theme, motion, saves',
      href: hrefOf({ name: 'settings', section: null }),
    },
  ]
}

export function continueTargetOf({ target, label, lastPlayed }: ContinueTargetInput): ContinueTarget {
  return {
    href: hrefOf({ name: 'play', levelId: target.levelId }),
    // A region named like its only level (the Prologue's First Boot) is said once.
    where: [...new Set([shortActName(label.actName), label.regionName, label.heading])].join(' · '),
    step: `Step: ${stepLabelOf(target.phase)}${lastPlayed}`,
  }
}

export function lastPlayedText(now: number, lastSavedAt: number | null): string {
  return lastSavedAt === null ? '' : ` · last played ${formatLastPlayed(now, lastSavedAt)}`
}
