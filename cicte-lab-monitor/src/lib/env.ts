// ─── Environment variable validation ─────────────────────────────────────────
// Centralises access to `import.meta.env` with runtime validation so that
// typos or misconfigurations surface early.

function optionalUrl(key: keyof ImportMetaEnv): string | undefined {
  const raw = import.meta.env[key]
  if (!raw) return undefined
  try {
    new URL(raw)
    return raw
  } catch {
    console.warn(`[env] ${key} is not a valid URL ("${raw}") — ignoring.`)
    return undefined
  }
}

/** Validated env config — import this instead of reading import.meta.env directly. */
export const env = {
  /** API base URL. Empty string means same-origin (Vite proxy). */
  apiUrl: import.meta.env.VITE_API_URL ?? '',

  /** Socket.io URL — undefined when not set (disables real-time). */
  socketUrl: optionalUrl('VITE_SOCKET_URL'),
} as const
