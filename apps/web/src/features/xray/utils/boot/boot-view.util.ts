import type { BootParam, BootRulerMark, BootStageKind, BootStageView, BootView } from '@features/xray/types'
import type { BootRecord, BootSummary, KernelLogLine } from '@kernelfall/machine/types'
import {
  BOOT_LABEL_GAP,
  BOOT_NOTES,
  BOOT_STAGE_RULES,
  INIT_PROCESS,
  INITRAMFS_INIT,
  INITRAMFS_ROOT,
} from './boot-view.constants'

/** Each line goes to the first stage whose pattern it matches; most lines belong to none. */
function linesByStage(log: readonly KernelLogLine[]): Map<BootStageKind, KernelLogLine[]> {
  const picked = new Map<BootStageKind, KernelLogLine[]>()
  let continuing: KernelLogLine[] | null = null
  for (const line of log) {
    if (continuing && /^\s/.test(line.text)) {
      continuing.push(line)
      continue
    }
    continuing = null
    const rule = BOOT_STAGE_RULES.find((r) => r.patterns.some((pattern) => pattern.test(line.text)))
    if (!rule) {
      continue
    }
    const lines = picked.get(rule.kind) ?? []
    lines.push(line)
    picked.set(rule.kind, lines)
    if (rule.follow) {
      continuing = lines
    }
  }
  return picked
}

function initNote(lines: readonly KernelLogLine[], fromInitramfs: boolean): string {
  const path = lines.map((line) => INIT_PROCESS.exec(line.text)?.[1]).find((found) => found !== undefined)
  if (path === undefined) {
    return 'The kernel frees its start-up code, then starts PID 1, the first process in user space.'
  }
  const origin = fromInitramfs && path === INITRAMFS_INIT ? ' The program comes from the initramfs.' : ''
  return `The kernel frees its start-up code and runs \`${path}\` as PID 1, the first process in user space.${origin}`
}

function rootNote(device: string | null, failed: boolean): string {
  if (!failed && device !== null) {
    return `The real root filesystem is mounted on \`/\`. \`/proc/mounts\` names its device: \`${device}\`.`
  }
  return device === INITRAMFS_ROOT
    ? '`/` is still `rootfs`, the initramfs: the real root filesystem was never mounted.'
    : '`/proc/mounts` lists nothing on `/`: the real root filesystem was never mounted.'
}

function noteOf(
  kind: BootStageKind,
  summary: BootSummary,
  lines: readonly KernelLogLine[],
  picked: Map<BootStageKind, KernelLogLine[]>
): string {
  switch (kind) {
    case 'firmware':
      return summary.firmware === 'uefi' ? BOOT_NOTES.firmwareUefi : BOOT_NOTES.firmwareBios
    case 'cmdline':
      return summary.unknownParams.length > 0 ? BOOT_NOTES.cmdlineUnknown : BOOT_NOTES.cmdline
    case 'init':
      return initNote(lines, picked.has('initramfs'))
    case 'root':
      return rootNote(summary.rootDevice, summary.outcome === 'initramfs')
    default:
      return BOOT_NOTES[kind]
  }
}

function rulerOf(stages: readonly BootStageView[], end: number): BootRulerMark[] {
  const marks: BootRulerMark[] = []
  let lastLabel = Number.NEGATIVE_INFINITY
  stages.forEach((stage, index) => {
    if (stage.time === null) {
      return
    }
    const at = end > 0 ? Math.min(stage.time / end, 1) : 0
    const labelled = at - lastLabel >= BOOT_LABEL_GAP
    if (labelled) {
      lastLabel = at
    }
    marks.push({ number: index + 1, at, labelled, failed: stage.failed })
  })
  return marks
}

/** The stages this boot went through, each with its own dmesg lines; a stage the record doesn't show isn't drawn. */
export function bootViewOf(record: BootRecord): BootView {
  const { summary, log } = record
  const picked = linesByStage(log)
  const order = (kind: BootStageKind) => BOOT_STAGE_RULES.findIndex((rule) => rule.kind === kind)
  const rootFailed = summary.outcome === 'initramfs'
  const stages = BOOT_STAGE_RULES.flatMap((rule): BootStageView[] => {
    const lines = picked.get(rule.kind) ?? []
    // The root is also known from /proc/mounts, when dmesg says nothing about it.
    const shown = lines.length > 0 || (rule.kind === 'root' && (summary.rootDevice !== null || rootFailed))
    if (!shown) {
      return []
    }
    return [
      {
        kind: rule.kind,
        title: rule.title,
        note: noteOf(rule.kind, summary, lines, picked),
        time: lines[0]?.time ?? null,
        lines,
        failed: rule.kind === 'panic' || (rule.kind === 'root' && rootFailed),
      },
    ]
  }).sort(
    (a, b) =>
      (a.time ?? Number.POSITIVE_INFINITY) - (b.time ?? Number.POSITIVE_INFINITY) || order(a.kind) - order(b.kind)
  )
  const params: BootParam[] = summary.cmdline
    .split(/\s+/)
    .filter((text) => text !== '')
    .map((text) => ({ text, unknown: summary.unknownParams.includes(text) }))
  const end = log.at(-1)?.time ?? 0
  return { kernel: summary.kernel, stages, params, end, marks: rulerOf(stages, end), log }
}

/** A line as `dmesg` prints it: `[    1.733345] scsi host0: ata_piix`. */
export function dmesgLine(line: KernelLogLine): string {
  return `[${line.time.toFixed(6).padStart(12)}] ${line.text}`
}
