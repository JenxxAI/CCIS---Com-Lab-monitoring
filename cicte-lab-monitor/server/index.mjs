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
//   POST   /api/agent/heartbeat     → PC agent heartbeat
//   GET    /api/agent/status        → all agent statuses

import http from 'node:http'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const DB_PATH    = join(__dirname, 'db.json')
const DIST_DIR   = join(__dirname, '..', 'dist')  // Vite build output

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readDB() {
  return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
}

function writeDB(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

// Allowed origin — set CORS_ORIGIN env var in production (e.g. https://your-app.com).
// Falls back to localhost for development only.
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
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

// ─── Auth helpers ─────────────────────────────────────────────────────────────
// NOTE: This uses HMAC-SHA256-signed tokens. Set TOKEN_SECRET in your env.
// Do NOT use the default secret in production.

import { createHmac } from 'node:crypto'

const TOKEN_SECRET = process.env.TOKEN_SECRET
if (!TOKEN_SECRET) {
  console.warn('[SECURITY] TOKEN_SECRET env var is not set. Using an insecure default — set it before deploying!')
}
const _SECRET = TOKEN_SECRET || 'cicte-dev-secret-change-me'

// Credentials — set via env vars; fallback values are for local dev only.
const USERS = [
  {
    id: 'admin-1',
    username: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASS || 'admin123',
    role: 'admin',
    name: 'Admin Ramos',
  },
  {
    id: 'viewer-1',
    username: process.env.VIEWER_USER || 'viewer',
    password: process.env.VIEWER_PASS || 'viewer123',
    role: 'viewer',
    name: 'Vol. Dela Rosa',
  },
]

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig  = createHmac('sha256', _SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

function makeToken(user) {
  const payload = { id: user.id, username: user.username, role: user.role, name: user.name }
  return sign(payload)
}

function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null
  const data = token.slice(0, dot)
  const sig  = token.slice(dot + 1)
  const expected = createHmac('sha256', _SECRET).update(data).digest('base64url')
  // Constant-time comparison to prevent timing attacks
  if (sig.length !== expected.length) return null
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  if (diff !== 0) return null
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString())
  } catch {
    return null
  }
}

/** Require a valid token; returns user or sends 401 and returns null. */
function requireAuth(req, res) {
  const user = verifyToken(req.headers.authorization)
  if (!user) { json(res, 401, { error: 'Not authenticated' }); return null }
  return user
}

/** Require admin role; returns user or sends 403 and returns null. */
function requireAdmin(req, res) {
  const user = requireAuth(req, res)
  if (!user) return null
  if (user.role !== 'admin') { json(res, 403, { error: 'Forbidden' }); return null }
  return user
}

/** Strip sensitive PC fields for viewer role. */
function sanitizePC(pc, role) {
  if (role === 'admin') return pc
  const { password, routerPassword, routerSSID, ...safe } = pc
  return safe
}

// ─── Agent tracking (in-memory, keyed by labId-pcNum) ────────────────────────

const AGENT_KEY = process.env.AGENT_KEY
if (!AGENT_KEY) {
  console.warn('[SECURITY] AGENT_KEY env var is not set. Using insecure default — set it before deploying!')
}
const _AGENT_KEY = AGENT_KEY || 'cicte-agent-2026'
const OFFLINE_TIMEOUT = 90_000  // 90 seconds without heartbeat → offline

/**
 * agentMap: Map<string, {
 *   labId, pcNum, hostname, ipAddress, macAddress,
 *   os, osBuild, cpu, ram, storage, loggedInUser,
 *   lastSeen: Date, online: boolean, agentVersion, pcId
 * }>
 */
const agentMap = new Map()

/** Find or create a PC in db.json matching this agent heartbeat */
function matchOrCreatePC(db, hb) {
  // Try to find existing PC by labId + num
  let pc = db.pcs.find(p => p.labId === hb.labId && p.num === hb.pcNum)

  if (!pc) {
    // Auto-create a new PC entry
    pc = {
      id:  `${hb.labId}-${hb.pcNum}`,
      num: hb.pcNum,
      labId: hb.labId,
      status: 'available',
      condition: 'good',
      password: `Lab@${1000 + Math.floor(Math.random() * 9000)}`,
      lastPasswordChange: new Date().toISOString().slice(0, 10),
      lastPasswordChangedBy: 'System',
      lastStudent: hb.loggedInUser || 'Unknown',
      lastUsed: new Date().toISOString().replace('T', ' ').slice(0, 16),
      routerSSID: `CICTE-${hb.labId.toUpperCase()}`,
      routerPassword: `Net@${10000 + Math.floor(Math.random() * 90000)}`,
      specs: {
        ram: hb.ram || 'Unknown',
        storage: hb.storage || 'Unknown',
        os: hb.os || 'Unknown',
        osBuild: hb.osBuild || '',
        cpu: hb.cpu || 'Unknown',
        gpu: 'Unknown',
        motherboard: '',
        monitor: '',
        ipAddress: hb.ipAddress || '',
        macAddress: hb.macAddress || '',
        software: [],
        pcType: 'Desktop',
      },
      repairs: [],
      installedApps: [],
    }
    db.pcs.push(pc)
    writeDB(db)
    console.log(`[Agent] Auto-registered new PC: ${pc.id} (${hb.hostname})`)
  }

  return pc
}

/** Process a heartbeat from a PC agent */
function processHeartbeat(hb) {
  const db = readDB()
  const pc = matchOrCreatePC(db, hb)
  const key = `${hb.labId}-${hb.pcNum}`

  // Update specs from agent data
  let changed = false
  if (hb.ipAddress && pc.specs.ipAddress !== hb.ipAddress) { pc.specs.ipAddress = hb.ipAddress; changed = true }
  if (hb.macAddress && pc.specs.macAddress !== hb.macAddress) { pc.specs.macAddress = hb.macAddress; changed = true }
  if (hb.cpu && pc.specs.cpu !== hb.cpu) { pc.specs.cpu = hb.cpu; changed = true }
  if (hb.ram && pc.specs.ram !== hb.ram) { pc.specs.ram = hb.ram; changed = true }
  if (hb.storage && pc.specs.storage !== hb.storage) { pc.specs.storage = hb.storage; changed = true }
  if (hb.os && pc.specs.os !== hb.os) { pc.specs.os = hb.os; changed = true }
  if (hb.osBuild && pc.specs.osBuild !== hb.osBuild) { pc.specs.osBuild = hb.osBuild; changed = true }

  // Track logged-in user → occupied / available
  if (hb.loggedInUser && hb.loggedInUser !== 'Unknown' && hb.loggedInUser !== 'SYSTEM') {
    if (pc.lastStudent !== hb.loggedInUser) {
      pc.lastStudent = hb.loggedInUser
      pc.lastUsed = new Date().toISOString().replace('T', ' ').slice(0, 16)
      changed = true
    }
    if (pc.status !== 'maintenance' && pc.status !== 'occupied') {
      pc.status = 'occupied'
      changed = true
    }
  } else {
    // No user logged in → available (unless maintenance)
    if (pc.status === 'occupied') {
      pc.status = 'available'
      changed = true
    }
  }

  if (changed) writeDB(db)

  // Update agent map
  agentMap.set(key, {
    ...hb,
    lastSeen: new Date(),
    online: true,
    pcId: pc.id,
  })

  return { pcId: pc.id, status: pc.status, condition: pc.condition }
}

/** Periodically check for offline PCs (no heartbeat in OFFLINE_TIMEOUT) */
function checkOfflinePCs() {
  const now = Date.now()
  const db = readDB()
  let changed = false

  for (const [key, agent] of agentMap.entries()) {
    const elapsed = now - agent.lastSeen.getTime()
    if (elapsed > OFFLINE_TIMEOUT && agent.online) {
      agent.online = false
      agentMap.set(key, agent)

      // Mark PC as maintenance (offline)
      const pc = db.pcs.find(p => p.id === agent.pcId)
      if (pc && pc.status !== 'maintenance') {
        pc.status = 'maintenance'
        pc.condition = pc.condition === 'good' ? 'good' : pc.condition  // don't degrade condition
        changed = true
        console.log(`[Agent] PC ${pc.id} went offline (no heartbeat for ${Math.round(elapsed/1000)}s)`)
      }
    }
  }

  if (changed) writeDB(db)
}

// Check for offline PCs every 30 seconds
setInterval(checkOfflinePCs, 30_000)

// ─── Route handler ───────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname
  const method = req.method

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
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
    const user = requireAuth(req, res)
    if (!user) return
    return json(res, 200, { user })
  }

  // ── Lab / PC routes ──

  const db = readDB()

  // Allowed fields for PATCH updates (prevents overwriting id, labId, etc.)
  const PC_PATCH_ALLOW = new Set([
    'status', 'condition', 'password', 'lastPasswordChange', 'lastPasswordChangedBy',
    'lastStudent', 'lastUsed', 'routerSSID', 'routerPassword', 'specs', 'installedApps',
  ])

  if (path === '/api/labs' && method === 'GET') {
    const caller = requireAuth(req, res)
    if (!caller) return
    return json(res, 200, db.labs)
  }

  const labPcsMatch = path.match(/^\/api\/labs\/([^/]+)\/pcs$/)
  if (labPcsMatch && method === 'GET') {
    const caller = requireAuth(req, res)
    if (!caller) return
    const labId = labPcsMatch[1]
    const pcs = db.pcs.filter(p => p.labId === labId).map(p => sanitizePC(p, caller.role))
    return json(res, 200, pcs)
  }

  const pcMatch = path.match(/^\/api\/pcs\/([^/]+)$/)
  if (pcMatch && method === 'GET') {
    const caller = requireAuth(req, res)
    if (!caller) return
    const pc = db.pcs.find(p => p.id === pcMatch[1])
    return pc ? json(res, 200, sanitizePC(pc, caller.role)) : json(res, 404, { error: 'PC not found' })
  }

  if (pcMatch && method === 'PATCH') {
    const caller = requireAdmin(req, res)
    if (!caller) return
    const body = await parseBody(req)
    const idx = db.pcs.findIndex(p => p.id === pcMatch[1])
    if (idx === -1) return json(res, 404, { error: 'PC not found' })
    // Only allow whitelisted fields to be updated
    const safeBody = Object.fromEntries(
      Object.entries(body).filter(([k]) => PC_PATCH_ALLOW.has(k))
    )
    db.pcs[idx] = { ...db.pcs[idx], ...safeBody }
    writeDB(db)
    return json(res, 200, sanitizePC(db.pcs[idx], caller.role))
  }

  const repairMatch = path.match(/^\/api\/pcs\/([^/]+)\/repairs$/)
  if (repairMatch && method === 'POST') {
    const caller = requireAdmin(req, res)
    if (!caller) return
    const body = await parseBody(req)
    const idx = db.pcs.findIndex(p => p.id === repairMatch[1])
    if (idx === -1) return json(res, 404, { error: 'PC not found' })
    const repair = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date:  body.date  || new Date().toISOString().slice(0, 10),
      type:  String(body.type  || '').slice(0, 100),
      by:    String(body.by    || '').slice(0, 80),
      notes: String(body.notes || '').slice(0, 500),
    }
    db.pcs[idx].repairs.push(repair)
    writeDB(db)
    return json(res, 200, sanitizePC(db.pcs[idx], caller.role))
  }

  // ── Agent routes ──

  if (path === '/api/agent/heartbeat' && method === 'POST') {
    const key = req.headers['x-agent-key']
    if (key !== _AGENT_KEY) return json(res, 403, { error: 'Invalid agent key' })
    const body = await parseBody(req)
    if (!body.labId || !body.pcNum) return json(res, 400, { error: 'Missing labId or pcNum' })
    const result = processHeartbeat(body)
    return json(res, 200, result)
  }

  if (path === '/api/agent/status' && method === 'GET') {
    const caller = requireAdmin(req, res)
    if (!caller) return
    const agents = Object.fromEntries(
      [...agentMap.entries()].map(([k, v]) => [k, {
        ...v,
        lastSeen: v.lastSeen.toISOString(),
        msSinceLastSeen: Date.now() - v.lastSeen.getTime(),
      }])
    )
    return json(res, 200, { agents, count: agentMap.size })
  }

  // ── Static file serving (production mode) ──

  if (existsSync(DIST_DIR) && !path.startsWith('/api/')) {
    const MIME = {
      '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
      '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
    }
    // Try exact file, then fallback to index.html (SPA routing)
    let filePath = join(DIST_DIR, path === '/' ? 'index.html' : path)
    if (!existsSync(filePath)) filePath = join(DIST_DIR, 'index.html')

    try {
      const data = readFileSync(filePath)
      const ext = extname(filePath)
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
      })
      return res.end(data)
    } catch {
      // Fall through to 404
    }
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
