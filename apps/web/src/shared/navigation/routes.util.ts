import { type Route, SETTINGS_SECTIONS, type SettingsSectionId } from '@shared/types/definitions/route'

function isSettingsSection(value: string): value is SettingsSectionId {
  return (SETTINGS_SECTIONS as readonly string[]).includes(value)
}

function segmentsOf(hash: string): string[] {
  return hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) => decodeURIComponent(segment))
}

const CARD_PARAM = 'card'

/** Hash routes need no server rewrites on a static host. */
export function parseRoute(hash: string): Route {
  const [path = '', query] = hash.split('?', 2)
  const [screen, param, extra, beyond] = segmentsOf(path)
  if (screen === 'placement') {
    return param !== undefined && extra !== undefined && beyond === undefined
      ? { name: 'placement', act: param, regionId: extra }
      : { name: 'not-found' }
  }
  if (extra !== undefined) {
    return { name: 'not-found' }
  }
  switch (screen) {
    case undefined:
      return { name: 'title' }
    case 'map':
      return param === undefined ? { name: 'map' } : { name: 'not-found' }
    case 'play': {
      if (param === undefined) {
        return { name: 'not-found' }
      }
      const card = new URLSearchParams(query).get(CARD_PARAM)
      return card ? { name: 'play', levelId: param, card } : { name: 'play', levelId: param }
    }
    case 'codex':
      return { name: 'codex', cardId: param ?? null }
    case 'settings':
      if (param === undefined) {
        return { name: 'settings', section: null }
      }
      return isSettingsSection(param) ? { name: 'settings', section: param } : { name: 'not-found' }
    default:
      return { name: 'not-found' }
  }
}

/** The inverse of `parseRoute`. */
export function hrefOf(route: Route): string {
  switch (route.name) {
    case 'title':
    case 'not-found':
      return '#/'
    case 'map':
      return '#/map'
    case 'play': {
      const level = `#/play/${encodeURIComponent(route.levelId)}`
      return route.card === undefined ? level : `${level}?${new URLSearchParams({ [CARD_PARAM]: route.card })}`
    }
    case 'codex':
      return route.cardId === null ? '#/codex' : `#/codex/${encodeURIComponent(route.cardId)}`
    case 'settings':
      return route.section === null ? '#/settings' : `#/settings/${route.section}`
    case 'placement':
      return `#/placement/${encodeURIComponent(route.act)}/${encodeURIComponent(route.regionId)}`
  }
}
