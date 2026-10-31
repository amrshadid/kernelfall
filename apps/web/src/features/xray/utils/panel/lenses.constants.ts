import type { XrayLens } from '@features/xray/types'

export const LENS_LABELS: Readonly<Record<XrayLens, string>> = {
  syscalls: 'Syscalls',
  processes: 'Processes',
  cpus: 'CPUs',
  route: 'Route',
  section: 'Section',
}

/**
 * The lenses each level view (level.yaml `xray:`) opens. Processes brings its CPU
 * lanes; files brings the route a call takes to its filesystem or driver.
 */
export const LENSES_OF_VIEW: Readonly<Record<string, readonly XrayLens[]>> = {
  syscalls: ['syscalls'],
  processes: ['processes', 'cpus'],
  files: ['route'],
  // TODO(#vm-boot-lens): draw the real boot from the VM's dmesg; P.4 asks for it.
  boot: [],
  section: ['section'],
}

/** Lenses that draw a whole run at once. */
export const WHOLE_RUN_LENSES: ReadonlySet<XrayLens> = new Set(['cpus', 'route', 'section'])
