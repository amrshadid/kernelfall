import type { EditorFile } from './editor'

/** Read at call time, so the component can swap callbacks without rebuilding the editor. */
export interface EditorHandlers {
  onChange(path: string, content: string): void
  onRun(): void
  onSave(): void
  /** After Format (button or its key): null when it worked, else a short reason. */
  onFormatted(problem: string | null): void
}

/** A mounted editor. Each file keeps its own state, so undo history survives tab switches. */
export interface EditorHandle {
  showFile(file: EditorFile): void
  /** Reports through `onFormatted`. */
  format(): void
  /** 1-based. */
  reveal(line: number, column: number): void
  destroy(): void
}
