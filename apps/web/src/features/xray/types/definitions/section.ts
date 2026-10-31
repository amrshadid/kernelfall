export type SectionFloor = 'userland' | 'kernel' | 'hardware'

export type SectionPartId =
  | 'programs'
  | 'syscalls'
  | 'processes'
  | 'scheduler'
  | 'memory'
  | 'vfs'
  | 'ipc'
  | 'drivers'
  | 'networking'
  | 'security'
  | 'modules'
  | 'logging'
  | 'cpu'
  | 'ram'
  | 'disk'
  | 'nic'

/** One part of the Machine as init's section drawing shows it. */
export interface SectionPart {
  readonly id: SectionPartId
  readonly floor: SectionFloor
  readonly name: string
  /** Where it lives in the Linux 6.18 tree, or what it is on the board. */
  readonly source: string
}

export interface SectionPartView extends SectionPart {
  /** How many of the run's syscalls passed through it. */
  readonly calls: number
  /** The syscalls that did, by name, first seen first. */
  readonly names: readonly string[]
}

export interface SectionView {
  readonly floors: readonly { readonly floor: SectionFloor; readonly parts: readonly SectionPartView[] }[]
  /** Syscalls the run made, all of which cross the syscall interface. */
  readonly total: number
}
