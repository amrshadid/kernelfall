import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // A cached transform keeps import.meta.glob's old file list after levels are added.
    fsModuleCache: false,
  },
})
