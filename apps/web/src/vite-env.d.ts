/// <reference types="vite/client" />

/** apps/web/package.json's version, set by vite.config.ts. */
declare const __APP_VERSION__: string
/** The commit a hosted build was made from; empty for a local build. */
declare const __APP_COMMIT__: string

interface ImportMetaEnv {
  /** Microsoft Clarity's project id, set for production builds only. */
  readonly VITE_CLARITY_ID?: string
}
