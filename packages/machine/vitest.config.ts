import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Hook tests opt into jsdom with `// @vitest-environment jsdom`.
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 60_000,
  },
})
