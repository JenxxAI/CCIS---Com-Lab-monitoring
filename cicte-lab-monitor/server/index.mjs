// ─── JSON Server Backend ─────────────────────────────────────────────────────
// A lightweight REST + Socket.io backend seeded from the existing mock data.
// Run with: node server/index.mjs
// Endpoints:
//   GET    /api/labs                → all labs
//   GET    /api/labs/:labId/pcs     → PCs for a lab
//   GET    /api/pcs/:id             → single PC
//   PATCH  /api/pcs/:id             → update PC fields
//   POST   /api/pcs/:id/repairs     → add repair log
//   POST   /api/auth/login          → authenticate user
//   GET    /api/auth/me             → current user (from token)

import http from 'node:http'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const DB_PATH    = join(__dirname, 'db.json')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readDB() {
  return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
}

function writeDB(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })
  res.end(JSON.stringify(body))
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', c => data += c)
    req.on('end', () => {
      try { resolve(JSON.parse(data)) }
      catch { resolve({}) }
    })
  })
}

// ─── Simple JWT-like token (base64 for demo, NOT production-grade) ───────────

const USERS = [
  { id: 'admin-1', username: 'admin',  password: 'admin123',  role: 'admin',  name: 'Admin Ramos'    },
  { id: 'viewer-1', username: 'viewer', password: 'viewer123', role: 'viewer', name: 'Vol. Dela Rosa' },
]

function makeToken(user) {
  const payload = { id: user.id, username: user.username, role: user.role, name: user.name }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    return JSON.parse(Buffer.from(authHeader.slice(7), 'base64').toString())
  } catch {
    return null
  }
}

// ─── Route handler ───────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname
  const method = req.method

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    return res.end()
  }

  // ── Auth routes ──

  if (path === '/api/auth/login' && method === 'POST') {
    const body = await parseBody(req)
    const user = USERS.find(u => u.username === body.username && u.password === body.password)
    if (!user) return json(res, 401, { error: 'Invalid credentials' })
    return json(res, 200, {
      token: makeToken(user),
      user: { id: user.id, username: user.username, role: user.role, name: user.name },
    })
  }

  if (path === '/api/auth/me' && method === 'GET') {
    const user = verifyToken(req.headers.authorization)
    if (!user) return json(res, 401, { error: 'Not authenticated' })
    return json(res, 200, { user })
  }

  // ── Lab / PC routes ──

  const db = readDB()

  if (path === '/api/labs' && method === 'GET') {
    return json(res, 200, db.labs)
  }

  const labPcsMatch = path.match(/^\/api\/labs\/([^/]+)\/pcs$/)
  if (labPcsMatch && method === 'GET') {
    const labId = labPcsMatch[1]
    const pcs = db.pcs.filter(p => p.labId === labId)
    return json(res, 200, pcs)
  }

  const pcMatch = path.match(/^\/api\/pcs\/([^/]+)$/)
  if (pcMatch && method === 'GET') {
    const pc = db.pcs.find(p => p.id === pcMatch[1])
    return pc ? json(res, 200, pc) : json(res, 404, { error: 'PC not found' })
  }

  if (pcMatch && method === 'PATCH') {
    const body = await parseBody(req)
    const idx = db.pcs.findIndex(p => p.id === pcMatch[1])
    if (idx === -1) return json(res, 404, { error: 'PC not found' })
    db.pcs[idx] = { ...db.pcs[idx], ...body, id: db.pcs[idx].id, labId: db.pcs[idx].labId }
    writeDB(db)
    return json(res, 200, db.pcs[idx])
  }

  const repairMatch = path.match(/^\/api\/pcs\/([^/]+)\/repairs$/)
  if (repairMatch && method === 'POST') {
    const body = await parseBody(req)
    const idx = db.pcs.findIndex(p => p.id === repairMatch[1])
    if (idx === -1) return json(res, 404, { error: 'PC not found' })
    const repair = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...body,
    }
    db.pcs[idx].repairs.push(repair)
    writeDB(db)
    return json(res, 200, db.pcs[idx])
  }

  return json(res, 404, { error: 'Not found' })
}

// ─── Start server ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001
const server = http.createServer(handleRequest)

server.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`)

  // Seed database if it doesn't exist
  if (!existsSync(DB_PATH)) {
    console.log('[API] Seeding database...')
    // Dynamic import so seed uses the same data generators
    import('./seed.mjs').then(m => m.seed())
  }
})
