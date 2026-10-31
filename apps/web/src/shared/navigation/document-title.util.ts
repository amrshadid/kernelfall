import type { LoadedContent } from '@kernelfall/levels/types'
import { labelOf } from '@kernelfall/levels/utils'
import { APP_NAME as APP, APP_TAGLINE as TAGLINE } from '@shared/constants/app'
import type { Route } from '@shared/types/definitions/route'

// Level numbers that name a level on their own: "1.4", "2.10a", "S.1".
const NUMBERED_LEVEL = /^(\d|S\.)/

const SMALL_SCREEN_TITLE = `Needs a bigger screen · ${APP}`
const CONTENT_ERROR_TITLE = `Content errors · ${APP}`

/** `content` is null when it failed its checks; below the play width every route shows the small-screen wall. */
export function screenTitleOf(route: Route, content: LoadedContent | null, wide: boolean): string {
  if (content === null) {
    return CONTENT_ERROR_TITLE
  }
  return wide ? documentTitleOf(route, content) : SMALL_SCREEN_TITLE
}

/** Most specific part first, so a narrow tab still says which screen or level it is. */
export function documentTitleOf(route: Route, content: LoadedContent): string {
  switch (route.name) {
    case 'title':
      return `${APP}: ${TAGLINE}`
    case 'map':
      return `Kernel Map · ${APP}`
    case 'play': {
      const term = route.card === undefined ? null : cardTermOf(route.card, content)
      return term ? `${term} · Codex · ${APP}` : `${levelTitleOf(route.levelId, content) ?? 'Level'} · ${APP}`
    }
    case 'codex': {
      const term = route.cardId === null ? null : cardTermOf(route.cardId, content)
      return term ? `${term} · Codex · ${APP}` : `Codex · ${APP}`
    }
    case 'settings':
      return `Settings · ${APP}`
    case 'placement': {
      const region = content.acts
        .find((act) => act.act === route.act)
        ?.regions.find((each) => each.id === route.regionId)
      return region ? `${region.name}: placement check · ${APP}` : `Placement check · ${APP}`
    }
    case 'not-found':
      return `Page not found · ${APP}`
  }
}

/** `1.4 Run Anything`, `S.1 The Streets`, or `Prologue: First Boot` for unnumbered levels. */
function levelTitleOf(levelId: string, content: LoadedContent): string | null {
  const label = labelOf(content, levelId)
  if (!label) {
    return null
  }
  return NUMBERED_LEVEL.test(label.number) ? `${label.number} ${label.title}` : `${label.actName}: ${label.title}`
}

function cardTermOf(cardId: string, content: LoadedContent): string | null {
  for (const level of content.game.levels) {
    const card = level.codex.find((candidate) => candidate.id === cardId)
    if (card) {
      return card.term
    }
  }
  return null
}
