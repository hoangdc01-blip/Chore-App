/**
 * Read an environment variable from runtime config (Docker) or build-time config (Vite).
 * Docker injects values into window.__ENV__ at container startup.
 * In dev mode, window.__ENV__ is empty so we fall back to import.meta.env.
 */
export function getEnv(key: string, fallback = ''): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runtimeVal = (window as any).__ENV__?.[key]
  if (typeof runtimeVal === 'string' && runtimeVal !== '') return runtimeVal
  return (import.meta.env[key] as string) ?? fallback
}
