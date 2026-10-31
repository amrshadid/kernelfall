import type { FileContents } from '@features/editor/types'

const SOURCE_SUFFIXES = ['.c', '.h']

/** What the VM doesn't have yet; everything when it has nothing; null when it is up to date. */
export function changedFiles(synced: FileContents | null, current: FileContents): FileContents | null {
  if (synced === null) {
    return current
  }
  const changed = Object.entries(current).filter(([path, content]) => synced[path] !== content)
  return changed.length > 0 ? Object.fromEntries(changed) : null
}

/** The editor's tabs use `a.c`, not `./a.c`. */
export const withoutDotSlash = (path: string): string => path.replace(/^(\.\/)+/, '')

/** C sources and headers: highlighted as C and formatted with clang-format. */
export const isSourceFile = (path: string): boolean => SOURCE_SUFFIXES.some((suffix) => path.endsWith(suffix))
