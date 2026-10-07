import { describe, it, expect, beforeAll } from 'vitest'
import { installDemoApi } from '@/demo/mockApi'

const call = (path: string, init: RequestInit = {}, role = 'admin') =>
  fetch(path, { ...init, headers: { Authorization: `Bearer demo.${role}.x`, 'Content-Type': 'application/json' } })

describe('demo mock API', () => {
  beforeAll(() => installDemoApi(async () => new Response('real', { status: 599 })))

  it('rejects unauthenticated requests', async () => {
    expect((await fetch('/api/labs')).status).toBe(401)
  })
  it('logs in and returns role-scoped data', async () => {
    const login = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: 'student', password: 'x' }) })
    expect((await login.json()).user.role).toBe('student')
    const pcs = await (await call('/api/labs/cl1/pcs', {}, 'student')).json()
    expect(pcs.length).toBeGreaterThan(0)
    expect(pcs[0].password).toBe('')
  })
  it('enforces roles on writes and persists admin edits', async () => {
    expect((await call('/api/pcs/cl1-1', { method: 'PATCH', body: '{"status":"maintenance"}' }, 'student')).status).toBe(403)
    const ok = await call('/api/pcs/cl1-1', { method: 'PATCH', body: '{"status":"maintenance"}' })
    expect((await ok.json()).status).toBe('maintenance')
  })
  it('passes non-API requests to the real fetch', async () => {
    expect((await fetch('/assets/x.js')).status).toBe(599)
  })
})
