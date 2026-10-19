import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('API URL configuration', () => {
  it('uses the same origin when the backend URL is empty', async () => {
    vi.stubEnv('VITE_API_URL', '')
    const { apiUrl } = await import('@/lib/env')
    expect(apiUrl('/api/health')).toBe('/api/health')
  })

  it('preserves a configured backend path and normalizes joining slashes', async () => {
    vi.stubEnv('VITE_API_URL', 'https://backend.example/monitor/')
    const { apiUrl } = await import('@/lib/env')
    expect(apiUrl('/api/auth/login')).toBe('https://backend.example/monitor/api/auth/login')
    expect(apiUrl('api/labs/cl1/pcs')).toBe('https://backend.example/monitor/api/labs/cl1/pcs')
  })
})
