import type { Stage, TranscriptEntry } from '@features/xray/types'

/** Game text without its inline marks, for plain-text reading. */
export function plainText(text: string): string {
  return text.replaceAll('`', '').replaceAll('**', '')
}

export function transcriptOf(stages: readonly Stage<unknown>[]): readonly TranscriptEntry[] {
  return stages.map((stage, i) => ({
    key: stage.key,
    title: `${i + 1}. ${plainText(stage.title)}`,
    what: plainText(stage.what),
    why: plainText(stage.why),
  }))
}
