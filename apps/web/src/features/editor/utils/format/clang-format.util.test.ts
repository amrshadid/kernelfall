import { beforeEach, describe, expect, it, vi } from 'vitest'

const wasm = vi.hoisted(() => ({
  init: vi.fn(async () => {}),
  format: vi.fn((source: string, filename: string, style: string) => `${filename}|${style.length > 0}|${source}`),
}))

vi.mock('@wasm-fmt/clang-format/vite', () => ({ default: wasm.init, format: wasm.format }))

// The formatter is cached per module, so each test starts with a fresh one.
async function freshFormatC() {
  vi.resetModules()
  return (await import('./clang-format.util')).formatC
}

beforeEach(() => {
  wasm.init.mockReset()
  wasm.format.mockClear()
})

describe('formatC', () => {
  it('formats in the kernel style, loading clang-format once', async () => {
    const formatC = await freshFormatC()
    expect(await formatC('int x;', 'a.c')).toBe('a.c|true|int x;')
    await formatC('int y;', 'a.c')
    expect(wasm.init).toHaveBeenCalledTimes(1)
  })

  it('formats a header as C, not C++', async () => {
    const formatC = await freshFormatC()
    await formatC('int x;', 'util.h')
    expect(wasm.format).toHaveBeenCalledWith('int x;', 'main.c', expect.any(String))
  })

  it('tries the download again after one failed', async () => {
    const formatC = await freshFormatC()
    wasm.init.mockRejectedValueOnce(new Error('offline'))
    await expect(formatC('int x;', 'a.c')).rejects.toThrow('offline')
    expect(await formatC('int x;', 'a.c')).toBe('a.c|true|int x;')
    expect(wasm.init).toHaveBeenCalledTimes(2)
  })
})
