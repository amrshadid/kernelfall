import { NoticeStackPresentation } from '@features/notices/components/notices'
import { useGameNotices } from '@features/notices/hooks/game'
import { levelTitleOf } from '@features/notices/utils/notices'
import type { LevelId } from '@kernelfall/game/types'
import { appContent } from '@kernelfall/levels/utils'

// Not useContent(): notices render beside the router, also when content failed its checks.
function titleOf(levelId: LevelId): string {
  const content = appContent()
  return levelTitleOf(content.ok ? content.value : null, levelId)
}

export function NoticesContainer() {
  const { notice, waiting, dismiss } = useGameNotices(titleOf)
  return <NoticeStackPresentation notice={notice ?? null} waiting={waiting} onDismiss={dismiss} />
}
