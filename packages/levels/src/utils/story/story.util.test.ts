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

  it('reads --- as a pause, and leaves one inside a code block alone', () => {
    const paced = parseStory('## Build it\n\n> **init:** Press Run.\n\n---\n\n```\na\n---\nb\n```\n')
    expect(paced.get('build-it')).toEqual([
      { kind: 'line', speaker: 'init', text: 'Press Run.' },
      { kind: 'pause' },
      { kind: 'code', text: 'a\n---\nb' },
    ])
  })

  it('reads a list after a line as a question with its answers, [x] the one that happens', () => {
    const asked = parseStory('## Watch it\n\n> **init:** Who read the file?\n>\n> - `cat` itself\n> - [x] the kernel\n')
    expect(asked.get('watch-it')).toEqual([
      {
        kind: 'predict',
        speaker: 'init',
        text: 'Who read the file?',
        options: [
          { text: '`cat` itself', right: false },
          { text: 'the kernel', right: true },
        ],
      },
    ])
  })

  it('leaves a list with no [x] as a list', () => {
    const errand = parseStory('## Build it\n\n> **init:** Now the errand:\n>\n> - find the file\n> - read it\n')
    expect(errand.get('build-it')).toEqual([
      { kind: 'line', speaker: 'init', text: 'Now the errand:' },
      { kind: 'line', speaker: null, text: '- find the file - read it' },
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
