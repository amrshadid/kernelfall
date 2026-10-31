// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReferenceRun } from './useReferenceRun.hook'

const LEVEL = 'prologue-boot-path-02-first-words'
const REFERENCE = { 'hello.c': 'int main(void) { return 0; }\n' }
const STARTER = { 'hello.c': 'int main(void) {}\n', 'notes.txt': 'starter only\n' }

const mocks = vi.hoisted(() => ({
  useReference: vi.fn(),
  loadReferenceFiles: vi.fn(),
  writeFiles: vi.fn(async () => true),
  requestCommand: vi.fn(),
}))

vi.mock('@kernelfall/game/hooks', () => ({ useLevelActions: () => ({ useReference: mocks.useReference }) }))
vi.mock('@kernelfall/machine/hooks', () => ({
  useMachineFiles: () => ({ writeFiles: mocks.writeFiles }),
  useTerminalCommand: () => ({ run: mocks.requestCommand }),
}))
vi.mock('@kernelfall/levels/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@kernelfall/levels/utils')>()),
  loadReferenceFiles: mocks.loadReferenceFiles,
}))
vi.mock('@features/content/hooks/content', () => ({ useContent: () => ({ starters: new Map([[LEVEL, STARTER]]) }) }))

describe('useReferenceRun', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockClear()
    }
    mocks.loadReferenceFiles.mockResolvedValue(REFERENCE)
    mocks.useReference.mockResolvedValue({ success: true, data: { changed: true } })
  })

  it("loads init's version over the starter, then builds and runs it like Run would", async () => {
    const { result } = renderHook(() => useReferenceRun(LEVEL))
    await result.current()

    expect(mocks.useReference).toHaveBeenCalledWith(REFERENCE)
    expect(mocks.writeFiles).toHaveBeenCalledWith({ ...STARTER, ...REFERENCE })
    expect(mocks.requestCommand).toHaveBeenCalledOnce()
    expect(mocks.requestCommand.mock.calls[0]?.[0]).toContain('hello.c')
  })

  it('still finishes the level when the files cannot be loaded, without running anything', async () => {
    mocks.loadReferenceFiles.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useReferenceRun(LEVEL))
    await result.current()

    expect(mocks.useReference).toHaveBeenCalledWith(undefined)
    expect(mocks.writeFiles).not.toHaveBeenCalled()
    expect(mocks.requestCommand).not.toHaveBeenCalled()
  })

  it('settles without running anything when the VM is gone', async () => {
    mocks.writeFiles.mockRejectedValueOnce(new Error('worker gone'))
    const { result } = renderHook(() => useReferenceRun(LEVEL))
    await expect(result.current()).resolves.toBeUndefined()

    expect(mocks.useReference).toHaveBeenCalledWith(REFERENCE)
    expect(mocks.requestCommand).not.toHaveBeenCalled()
  })

  it('runs nothing when the level loop did not move to the reference', async () => {
    mocks.useReference.mockResolvedValue({ success: true, data: { changed: false } })
    const { result } = renderHook(() => useReferenceRun(LEVEL))
    await result.current()

    expect(mocks.requestCommand).not.toHaveBeenCalled()
  })
})
