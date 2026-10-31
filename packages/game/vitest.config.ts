import { defineConfig } from 'vitest/config'

// Hook tests opt into jsdom with `// @vitest-environment jsdom`; the rules' tests stay on node.
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],
  },
})
