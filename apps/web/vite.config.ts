import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const src = (path: string): string => fileURLToPath(new URL(`./src/${path}`, import.meta.url))

export default defineConfig({
  // GitHub Pages serves a project site under /<repo>/; the deploy workflow passes it.
  base: process.env.KF_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': src(''),
      '@assets': src('assets'),
      '@shared': src('shared'),
      '@features': src('features'),
      '@app': src('app'),
      '@pages': src('pages'),
    },
  },
  worker: {
    format: 'es',
  },
})
