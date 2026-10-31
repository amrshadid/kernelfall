import { describe, expect, it } from 'vitest'
import { XRAY_FILES } from '#utils/xray/xray-files.util'

describe('XRAY_FILES', () => {
  it("holds the text of X-ray's syscall and narration files", () => {
    expect(XRAY_FILES.syscalls).toContain("What X-ray knows about each syscall beyond the lab's trace")
    expect(XRAY_FILES.narration).toContain("Everything X-ray's storyboards say")
  })
})
