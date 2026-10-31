import type { KernelLogLine } from '@kernelfall/machine/types'

export type BootStageKind = 'firmware' | 'kernel' | 'cmdline' | 'initcalls' | 'initramfs' | 'init' | 'root' | 'panic'

export interface BootStageView {
  readonly kind: BootStageKind
  readonly title: string
  /** Backticks mark real terms. */
  readonly note: string
  /** Null when only /proc shows the stage happened, with no dmesg line to time it. */
  readonly time: number | null
  readonly lines: readonly KernelLogLine[]
  readonly failed: boolean
}

export interface BootParam {
  readonly text: string
  /** The kernel didn't know it and passed it on to init. */
  readonly unknown: boolean
}

export interface BootRulerMark {
  readonly number: number
  /** 0 at the kernel's start, 1 at its last line. */
  readonly at: number
  readonly labelled: boolean
  readonly failed: boolean
}

export interface BootView {
  readonly kernel: string
  readonly stages: readonly BootStageView[]
  readonly params: readonly BootParam[]
  readonly end: number
  readonly marks: readonly BootRulerMark[]
  readonly log: readonly KernelLogLine[]
}
