import { describe, expect, it } from 'vitest'
import { CONTENT_FILES, relativeToContent } from '#utils/loader/content-files.util'

describe('relativeToContent', () => {
  it('keys each file by its path inside content/, whatever form the bundler gives', () => {
    expect(relativeToContent({ '../../../content/0-prologue/act.yaml': 1, '/levels/content/skills.yaml': 2 })).toEqual({
      '0-prologue/act.yaml': 1,
      'skills.yaml': 2,
    })
  })
})

describe('CONTENT_FILES', () => {
  it('holds every kind of content file, and never a reference solution', () => {
    expect(Object.keys(CONTENT_FILES.acts)).toContain('0-prologue/act.yaml')
    expect(Object.keys(CONTENT_FILES.regions)).toContain('1-act-1/4-syscall-gate/region.yaml')
    expect(Object.keys(CONTENT_FILES.starters)).toContain('0-prologue/1-boot-path/02-first-words/starter/hello.c')
    expect(Object.keys(CONTENT_FILES.checkers)).toEqual(
      expect.arrayContaining([
        '0-prologue/1-boot-path/03-speak-to-shell/checker.ts',
        '1-act-1/2-process-district/04-run-anything/checker.ts',
      ])
    )
    expect(Object.keys(CONTENT_FILES.placements)).toContain('0-prologue/2-machine-in-section/placement.yaml')
    expect(CONTENT_FILES.skills).toContain('id: proc-lifecycle')
    expect(CONTENT_FILES.bedrock).toContain('key: bedrock')
    expect(CONTENT_FILES.fieldGuide).toContain('opensAt:')
    expect(Object.keys(CONTENT_FILES.starters).some((path) => path.includes('/solution/'))).toBe(false)
  })
})
