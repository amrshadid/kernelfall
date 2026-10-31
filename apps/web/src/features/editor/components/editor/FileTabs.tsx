import type { EditorFile } from '@features/editor/types'

export interface FileTabsProps {
  files: readonly EditorFile[]
  activePath: string
  /** Paths whose content differs from the starter. */
  modified: ReadonlySet<string>
  onSelect: (path: string) => void
}

export function FileTabs({ files, activePath, modified, onSelect }: FileTabsProps) {
  return (
    <div role="tablist" aria-label="Files" className="flex min-w-0 items-stretch overflow-x-auto">
      {files.map((file) => {
        const selected = file.path === activePath
        return (
          <button
            key={file.path}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(file.path)}
            className={`flex shrink-0 items-center gap-2 border-r-2 border-[var(--ink,#141414)] px-4 font-[family-name:var(--mono,monospace)] text-sm ${
              selected
                ? 'bg-[var(--sheet,#fafaf7)] font-semibold shadow-[inset_0_-4px_0_var(--red,#c8201a)]'
                : 'bg-[var(--soft,#e5e5df)]'
            }`}
          >
            {file.path}
            {file.readOnly && (
              <svg
                role="img"
                aria-label="read-only"
                viewBox="0 0 24 24"
                className="size-4 fill-none stroke-current stroke-2"
              >
                <path d="M7 11V7h10v4M5 11h14v10H5z" />
              </svg>
            )}
            {modified.has(file.path) && (
              <span role="img" aria-label="modified" className="size-2 bg-[var(--ink,#141414)]" />
            )}
          </button>
        )
      })}
    </div>
  )
}
