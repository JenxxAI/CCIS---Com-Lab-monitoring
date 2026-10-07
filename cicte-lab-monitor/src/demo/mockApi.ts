// ─── Demo-only API (in-memory) ────────────────────────────────────────────────
// Installed only when the app is BUILT with VITE_DEMO_MODE=true (see main.tsx).
// No backend, no database, no real authentication: any login succeeds and all
// data is generated mock data that resets on page reload. Never enable this for
// a real deployment.

import { generateAllLabData, LABS } from '@/lib/data'
import type { PC, RepairLog } from '@/types'
import type { UserRole } from '@/store'

interface DemoUser { id: string; username: string; role: UserRole; name: string; created_at: string }

const ROLES: UserRole[] = ['admin', 'staff', 'student_volunteer', 'student']
const uid = () => Math.random().toString(36).slice(2, 10)
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export function installDemoApi(realFetch: typeof fetch = globalThis.fetch.bind(globalThis)): void {
  const pcs = generateAllLabData()
  const now = new Date().toISOString()
  const users: DemoUser[] = [
    { id: 'u-admin', username: 'admin', role: 'admin', name: 'Demo Admin', created_at: now },
    { id: 'u-staff', username: 'staff', role: 'staff', name: 'Demo Staff', created_at: now },
  ]
  const allPCs = () => Object.values(pcs).flat()
  const findPC = (id: string) => allPCs().find(p => p.id === id)

  const roleOf = (init?: RequestInit): UserRole | null => {
    const h = new Headers(init?.headers).get('Authorization') ?? ''
    const role = h.startsWith('Bearer demo.') ? h.slice(12).split('.')[0] : ''
    return (ROLES as string[]).includes(role) ? (role as UserRole) : null
  }
  const view = (pc: PC, role: UserRole): PC =>
    role === 'admin' || role === 'staff' ? pc : { ...pc, password: '', routerPassword: '', routerSSID: '' }

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, 'http://demo.local')
    if (!url.pathname.startsWith('/api/')) return realFetch(input, init)

    const path = url.pathname
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : {}

    if (path === '/api/health') return reply(200, { status: 'ok', demo: true })
    if (path === '/api/auth/login' && method === 'POST') {
      const username = String(body.username ?? '').trim().toLowerCase() || 'demo'
      const role: UserRole = username === 'staff' ? 'staff'
        : username.startsWith('vol') ? 'student_volunteer'
        : username === 'student' ? 'student' : 'admin'
      return reply(200, { token: `demo.${role}.${username}`, user: { id: `u-${username}`, username, role, name: `Demo ${username}` } })
    }

    const role = roleOf(init)
    if (!role) return reply(401, { error: 'Not authenticated' })
    const canManage = role !== 'student'
    const fullAccess = role === 'admin' || role === 'staff'

    if (path === '/api/labs') return reply(200, LABS)
    let m = path.match(/^\/api\/labs\/([^/]+)\/pcs$/)
    if (m) return pcs[m[1]] ? reply(200, pcs[m[1]].map(p => view(p, role))) : reply(404, { error: 'Lab not found' })

    if (path === '/api/pcs' && method === 'POST') {
      if (!fullAccess) return reply(403, { error: 'Forbidden' })
      if (!pcs[body.labId] || typeof body.num !== 'number') return reply(400, { error: 'labId and num are required' })
      if (pcs[body.labId].some(p => p.num === body.num)) return reply(409, { error: 'PC already exists in that lab' })
      const pc = { ...pcs[body.labId][0], ...body, id: `${body.labId}-${body.num}`, repairs: [], installedApps: [] } as PC
      pcs[body.labId] = [...pcs[body.labId], pc].sort((a, b) => a.num - b.num)
      return reply(201, pc)
    }

    m = path.match(/^\/api\/pcs\/([^/]+)(\/repairs)?$/)
    if (m) {
      const pc = findPC(m[1])
      if (!pc) return reply(404, { error: 'PC not found' })
      if (m[2] && method === 'POST') {
        if (!canManage) return reply(403, { error: 'Forbidden' })
        const repair: RepairLog = { id: `r-${uid()}`, date: String(body.date ?? now.slice(0, 10)), type: String(body.type ?? ''), by: String(body.by ?? ''), notes: String(body.notes ?? '') }
        pc.repairs = [...(pc.repairs ?? []), repair]
        return reply(200, view(pc, role))
      }
      if (method === 'GET') return reply(200, view(pc, role))
      if (method === 'PATCH') {
        if (!canManage) return reply(403, { error: 'Forbidden' })
        const locked = fullAccess ? [] : ['password', 'routerSSID', 'routerPassword', 'specs']
        for (const [k, v] of Object.entries(body)) if (k !== 'id' && k !== 'labId' && !locked.includes(k)) (pc as unknown as Record<string, unknown>)[k] = v
        return reply(200, view(pc, role))
      }
      if (method === 'DELETE') {
        if (!fullAccess) return reply(403, { error: 'Forbidden' })
        pcs[pc.labId] = pcs[pc.labId].filter(p => p.id !== pc.id)
        return reply(200, { ok: true })
      }
    }

    if (path.startsWith('/api/users')) {
      if (!fullAccess) return reply(403, { error: 'Forbidden' })
      if (path === '/api/users' && method === 'GET') return reply(200, users)
      if (path === '/api/users' && method === 'POST') {
        if (!body.username || !(ROLES as string[]).includes(body.role)) return reply(400, { error: 'username and valid role required' })
        if (users.some(u => u.username === body.username)) return reply(409, { error: 'Username already taken' })
        const u: DemoUser = { id: `u-${uid()}`, username: body.username, role: body.role, name: String(body.name ?? ''), created_at: new Date().toISOString() }
        users.push(u)
        return reply(201, u)
      }
      const um = path.match(/^\/api\/users\/([^/]+)$/)
      const u = um && users.find(x => x.id === um[1])
      if (um && !u) return reply(404, { error: 'User not found' })
      if (u && method === 'PATCH') {
        if (body.role && (ROLES as string[]).includes(body.role)) u.role = body.role
        if (body.name !== undefined) u.name = String(body.name)
        if (body.username) u.username = String(body.username)
        return reply(200, u)
      }
      if (u && method === 'DELETE') { users.splice(users.indexOf(u), 1); return reply(200, { ok: true }) }
    }
    return reply(404, { error: 'Not found (demo)' })
  }
}
