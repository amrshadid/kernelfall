import { describe, expect, it } from 'vitest'
import { parseStory, sectionOf, slugify } from '#utils/story/story.util'

const STORY = `# Run Anything

## Scene

> **init:** Welcome to the Process District.
>
> **The Watchdog:** Zombies. Ugh.

## Real world

Run this on any machine:

\`\`\`
strace -f ./a.out
\`\`\`
`

describe('parseStory', () => {
  it('reads spoken lines with their speaker', () => {
    expect(parseStory(STORY).get('scene')).toEqual([
      { kind: 'line', speaker: 'init', text: 'Welcome to the Process District.' },
      { kind: 'line', speaker: 'The Watchdog', text: 'Zombies. Ugh.' },
    ])
  })

  it('keeps narration and code blocks in order', () => {
    expect(parseStory(STORY).get('real-world')).toEqual([
      { kind: 'line', speaker: null, text: 'Run this on any machine:' },
      { kind: 'code', text: 'strace -f ./a.out' },
    ])
  })

  it('ignores text before the first section', () => {
    expect([...parseStory(STORY).keys()]).toEqual(['scene', 'real-world'])
  })
})

describe('slugify and sectionOf', () => {
  it('match the story refs used in level.yaml', () => {
    expect(slugify('Real world')).toBe('real-world')
    expect(slugify('See it')).toBe('see-it')
    expect(sectionOf('story.md#real-world')).toBe('real-world')
  })
})
