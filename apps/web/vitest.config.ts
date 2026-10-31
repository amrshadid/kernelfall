import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// The app's tests are pure functions and stores, so they run in Node with the app's aliases.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      // A cached transform keeps the levels package's import.meta.glob file list stale after levels are added.
      fsModuleCache: false,
    },
  })
)
