// Shared runtime globals for the @kernelfall/* packages that compile without DOM
// types (the lab, so kernel code can't reach for browser APIs). They declare only
// what @kernelfall/core uses: its event bus logs, and devLog reads import.meta.env.
// Packages built with the DOM library already have these and don't include this file.

declare const console: {
  log(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
  groupCollapsed(...args: unknown[]): void
  groupEnd(): void
}

declare function structuredClone<T>(value: T): T

interface ImportMeta {
  readonly env: {
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
  }
}
