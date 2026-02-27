/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for API requests (e.g. "http://localhost:3001"). Defaults to "" (same-origin / proxy). */
  readonly VITE_API_URL?: string
  /** Socket.io server URL (e.g. "http://localhost:3001"). Omit to disable real-time updates. */
  readonly VITE_SOCKET_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
