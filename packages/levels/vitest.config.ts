import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // A cached transform keeps import.meta.glob's old file list after levels are added.
    fsModuleCache: false,
    // S.4's golden run holds two `find /` walks (≈94k events): judging it takes seconds on CI.
    testTimeout: 30_000,
  },
})
