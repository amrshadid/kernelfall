import { KERNEL_CLANG_FORMAT_STYLE } from './kernel-style.constants'

type Format = (source: string, filename: string, style: string) => string

let loading: Promise<Format> | null = null

// clang-format's wasm is fetched on the first Format, never at page load; the
// browser's cache serves it offline afterwards.
function loadFormatter(): Promise<Format> {
  loading ??= import('@wasm-fmt/clang-format/vite')
    .then(async (module) => {
      await module.default()
      return module.format
    })
    .catch((error: unknown) => {
      // A failed download (offline before the first use) can be retried.
      loading = null
      throw error
    })
  return loading
}

/** On a syntax error clang-format still formats what it can parse; rejects only if it can't run. */
export async function formatC(source: string, path: string): Promise<string> {
  const format = await loadFormatter()
  // The name only picks the language; a header is C here, not C++.
  return format(source, path.endsWith('.h') ? 'main.c' : path, KERNEL_CLANG_FORMAT_STYLE)
}
