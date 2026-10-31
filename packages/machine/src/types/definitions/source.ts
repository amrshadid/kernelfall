/** A place in a source file, as compiler messages give it (`hello.c:3:5`). */
export interface SourceLocation {
  readonly file: string
  readonly line: number
  readonly column: number
}
