import { CLARITY_SCRIPT_ID, CLARITY_TAG_URL } from './clarity.constants'

type ClarityCall = ((command: string, ...args: unknown[]) => void) & { q?: unknown[][] }

/** `clarity` is Clarity's global: a queue until its tag loads, then the real API. */
export interface ClarityWindow {
  clarity?: ClarityCall
}

export function isClarityLoaded(doc: Document): boolean {
  return doc.getElementById(CLARITY_SCRIPT_ID) !== null
}

// Same as Clarity's official snippet: calls made before the tag arrives wait in `clarity.q`.
// No consent call: the project runs with cookies off, so Clarity stays cookieless.
export function loadClarity(id: string, win: ClarityWindow, doc: Document): void {
  if (isClarityLoaded(doc)) {
    return
  }
  if (!win.clarity) {
    const queue: ClarityCall = (...args) => {
      queue.q = queue.q ?? []
      queue.q.push(args)
    }
    win.clarity = queue
  }
  const script = doc.createElement('script')
  script.id = CLARITY_SCRIPT_ID
  script.async = true
  script.src = `${CLARITY_TAG_URL}${encodeURIComponent(id)}`
  doc.head.appendChild(script)
}
