import { describe, expect, it } from 'vitest'
// The repo root's file, read at test time; the app's aliases stop at src/.
import repoStyle from '@/../../../.clang-format?raw'
import { KERNEL_CLANG_FORMAT_STYLE } from './kernel-style.constants'

/** The settings alone: no comments, no blank lines. */
const settings = (yaml: string): string[] =>
  yaml.split('\n').filter((line) => line.trim() !== '' && !line.trimStart().startsWith('#'))

describe('KERNEL_CLANG_FORMAT_STYLE', () => {
  it("matches the repo's .clang-format setting for setting", () => {
    expect(settings(KERNEL_CLANG_FORMAT_STYLE)).toEqual(settings(repoStyle))
  })
})
