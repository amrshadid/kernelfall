export interface AppConfig {
  /** Microsoft Clarity's project id; null (local dev, forks, tests) means Clarity never loads or asks. */
  readonly clarityId: string | null
}

const DEFAULT_APP_CONFIG: AppConfig = { clarityId: null }

let current: AppConfig = DEFAULT_APP_CONFIG

// Clarity ids are short and alphanumeric; anything else must never reach a script URL.
const CLARITY_ID = /^[a-z0-9]{1,32}$/i

export function clarityIdOf(raw: string | undefined): string | null {
  const id = raw?.trim() ?? ''
  return CLARITY_ID.test(id) ? id : null
}

export function configureApp(options: { readonly clarityId?: string | undefined } = {}): void {
  current = { clarityId: clarityIdOf(options.clarityId) }
}

export function appConfig(): AppConfig {
  return current
}

export function resetAppConfig(): void {
  current = DEFAULT_APP_CONFIG
}
