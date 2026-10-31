import type { XrayContentFiles } from '#types/index'

// Inlined at build time like the rest of content/ (see utils/loader/content-files.util).
// import.meta.glob takes literal paths relative to this file, not the package's `#` imports.
const files = import.meta.glob<string>('../../../content/xray/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** The text of content/xray/<name>; empty when it is missing, so the loader reports it. */
const fileNamed = (name: string): string =>
  Object.entries(files).find(([path]) => path.endsWith(`/xray/${name}`))?.[1] ?? ''

/** X-ray's content files in the repository. */
export const XRAY_FILES: XrayContentFiles = {
  syscalls: fileNamed('syscalls.yaml'),
  narration: fileNamed('narration.yaml'),
}
