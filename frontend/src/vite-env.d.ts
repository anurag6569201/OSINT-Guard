/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** When "true", load static JSON from /public/dummy_data (no Apify). */
  readonly VITE_USE_DUMMY_DATA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
