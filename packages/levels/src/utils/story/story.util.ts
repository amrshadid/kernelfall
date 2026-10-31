import type { Story, StoryBlock } from '#types/index'

const SECTION_HEADING = /^##\s+(.+?)\s*$/
const SPOKEN_LINE = /^\*\*(.+?):\*\*\s*(.*)$/
const CODE_FENCE = /^```/
const QUOTE_PREFIX = /^>\s?/

/** `Real world` → `real-world`, the slug that `story.md#real-world` points at. */
export function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Parses a level's `story.md`. Sections start at `## Heading`. Inside one,
 * `> **Name:** text` is a spoken line, a paragraph is narration and a fenced
 * block is code.
 */
export function parseStory(markdown: string): Story {
  const sections = new Map<string, StoryBlock[]>()
  let blocks: StoryBlock[] | null = null
  let code: string[] | null = null
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (blocks && paragraph.length > 0) {
      blocks.push({ kind: 'line', speaker: null, text: paragraph.join(' ') })
    }
    paragraph = []
  }

  for (const raw of markdown.split(/\r?\n/)) {
    if (code) {
      if (CODE_FENCE.test(raw)) {
        blocks?.push({ kind: 'code', text: code.join('\n') })
        code = null
      } else {
        code.push(raw)
      }
      continue
    }
    const heading = SECTION_HEADING.exec(raw)
    if (heading?.[1]) {
      flushParagraph()
      blocks = []
      sections.set(slugify(heading[1]), blocks)
      continue
    }
    if (!blocks) {
      continue
    }
    if (CODE_FENCE.test(raw)) {
      flushParagraph()
      code = []
      continue
    }
    const line = raw.replace(QUOTE_PREFIX, '').trim()
    if (line === '') {
      flushParagraph()
      continue
    }
    const spoken = SPOKEN_LINE.exec(line)
    if (spoken?.[1] !== undefined && spoken[2] !== undefined) {
      flushParagraph()
      blocks.push({ kind: 'line', speaker: spoken[1], text: spoken[2] })
      continue
    }
    paragraph.push(line)
  }
  flushParagraph()
  return sections
}

/** The section a story ref like `story.md#scene` points at. */
export function sectionOf(ref: string): string {
  return ref.slice(ref.indexOf('#') + 1)
}
