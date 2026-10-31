/** A folder's play-order prefix: `0-prologue`, `2-process-district`, `11-mainline`. */
const ORDER_PREFIX = /^(\d+)-(.+)$/

/** `0-prologue/1-boot-path/level.yaml` → `0-prologue/1-boot-path`. */
export const folderOf = (path: string): string => path.slice(0, path.lastIndexOf('/'))

/** `0-prologue/1-boot-path` → `1-boot-path`. */
export const leafOf = (folder: string): string => folder.slice(folder.lastIndexOf('/') + 1)

/** A folder's place in play order and the name after it, or null when it has no number prefix. */
export function orderOf(folder: string): { readonly order: number; readonly name: string } | null {
  const match = ORDER_PREFIX.exec(leafOf(folder))
  return match?.[1] && match[2] ? { order: Number(match[1]), name: match[2] } : null
}

/** Folders sorted by their number prefix, so `10-x` comes after `9-y`; unnumbered ones last. */
export function byPlayOrder(folders: readonly string[]): string[] {
  const rank = (folder: string) => orderOf(folder)?.order ?? Number.POSITIVE_INFINITY
  return [...folders].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

/** The files right inside `folder/sub/`, by file name, in name order. */
export function filesIn<T>(files: Readonly<Record<string, T>>, folder: string, sub: string): Record<string, T> {
  const prefix = `${folder}/${sub}/`
  return Object.fromEntries(
    Object.entries(files)
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([path, value]): [string, T] => [path.slice(prefix.length), value])
      .sort(([a], [b]) => a.localeCompare(b))
  )
}
