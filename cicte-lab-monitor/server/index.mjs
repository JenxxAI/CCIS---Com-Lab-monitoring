// ─── CICTE Lab Monitor — API Server ─────────────────────────────────────────
// Run with: node server/index.mjs
//
// Roles: admin | staff | student_volunteer | student
//   admin / staff         → total access (user management, PC CRUD, all data)
//   student_volunteer     → manage PC status/condition/repairs, view all
//   student               → view only
//
// Endpoints:
//   GET    /api/labs                → all labs
//   GET    /api/labs/:labId/pcs     → PCs for a lab
//   GET    /api/pcs/:id             → single PC
//   POST   /api/pcs                 → add a PC              [admin/staff]
//   PATCH  /api/pcs/:id             → update PC fields       [admin/staff/volunteer]
//   DELETE /api/pcs/:id             → delete a PC            [admin/staff]
//   POST   /api/pcs/:id/repairs     → add repair log         [admin/staff/volunteer]
//   GET    /api/users               → list all users         [admin/staff]
//   POST   /api/users               → create user            [admin/staff]
//   PATCH  /api/users/:id           → update user            [admin/staff]
//   DELETE /api/users/:id           → delete user            [admin/staff]
//   POST   /api/auth/login          → authenticate user
//   GET    /api/auth/me             → current user (from token)
//   POST   /api/agent/heartbeat     → PC agent heartbeat
//   GET    /api/agent/status        → all agent statuses     [admin/staff]
//   GET    /api/health              → health check

import http from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const DIST_DIR   = join(__dirname, '..', 'dist')  // Vite build output

// ─── Supabase client (service role — server-only, bypasses RLS) ──────────────

const SUPABASE_URL         = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[FATAL] SUPABASE_URL and SUPABASE_SERVICE_KEY env vars must be set. Exiting.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

// ─── Row ↔ camelCase mapping ─────────────────────────────────────────────────

function rowToPC(row) {
  return {
    id:                    row.id,
    num:                   row.num,
    labId:                 row.lab_id,
    status:                row.status,
    condition:             row.condition,
    password:              row.password,
    lastPasswordChange:    row.last_password_change,
    lastPasswordChangedBy: row.last_password_changed_by,
    lastStudent:           row.last_student,
    lastUsed:              row.last_used,
    routerSSID:            row.router_ssid,
    routerPassword:        row.router_password,
    specs:                 row.specs,
    repairs:               row.repairs        ?? [],
    installedApps:         row.installed_apps ?? [],
  }
}

function pcToRow(pc) {
  return {
    id:                       pc.id,
    num:                      pc.num,
    lab_id:                   pc.labId,
    status:                   pc.status,
    condition:                pc.condition,
    password:                 pc.password,
    last_password_change:     pc.lastPasswordChange,
    last_password_changed_by: pc.lastPasswordChangedBy,
    last_student:             pc.lastStudent,
    last_used:                pc.lastUsed,
    router_ssid:              pc.routerSSID,
    router_password:          pc.routerPassword,
    specs:                    pc.specs,
    repairs:                  pc.repairs,
    installed_apps:           pc.installedApps,
  }
}

// Allowed origin — set CORS_ORIGIN env var in production (e.g. https://your-app.com).
// Falls back to localhost for development only.
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
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

import { createHmac, pbkdf2Sync, timingSafeEqual, randomBytes } from 'node:crypto'

const TOKEN_SECRET = process.env.TOKEN_SECRET
if (!TOKEN_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] TOKEN_SECRET env var must be set in production. Exiting.')
    process.exit(1)
  }
  console.warn('[SECURITY] TOKEN_SECRET not set — using insecure default. DO NOT deploy without setting this.')
}
const _SECRET = TOKEN_SECRET || 'cicte-dev-secret-change-me'

/**
 * Hash a password for storage using PBKDF2 with a random per-user salt.
 * Returns "salt_hex:hash_hex".
 */
function hashPassword(plaintext) {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(String(plaintext), salt, 100_000, 32, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Constant-time password check against a stored "salt:hash" value.
 * Prevents timing-based enumeration attacks.
 */
function checkPassword(input, storedHash) {
  const sep = storedHash.indexOf(':')
  if (sep === -1) return false
  const salt = storedHash.slice(0, sep)
  const hash = storedHash.slice(sep + 1)
  const derived  = pbkdf2Sync(String(input), salt, 100_000, 32, 'sha256')
  const expected = Buffer.from(hash, 'hex')
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}

/** Look up a user record from Supabase by username. */
async function findUserByUsername(username) {
  const { data: row } = await supabase
    .from('users').select('*').eq('username', username).maybeSingle()
  if (!row) return null
  return {
    id:           row.id,
    username:     row.username,
    passwordHash: row.password_hash,
    role:         row.role,
    name:         row.name,
  }
}

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig  = createHmac('sha256', _SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

function makeToken(user) {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    id: user.id, username: user.username, role: user.role, name: user.name,
    iat: now,
    exp: now + 8 * 3600, // 8-hour sessions
  }
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
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (parsed.exp && Math.floor(Date.now() / 1000) > parsed.exp) return null // token expired
    return parsed
  } catch {
    return null
  }
}

/** Require a valid token; returns decoded payload or sends 401 and returns null. */
function requireAuth(req, res) {
  const user = verifyToken(req.headers.authorization)
  if (!user) { json(res, 401, { error: 'Not authenticated' }); return null }
  return user
}

/** Require admin OR staff role (total access including user management). */
function requireAdminOrStaff(req, res) {
  const user = requireAuth(req, res)
  if (!user) return null
  if (user.role !== 'admin' && user.role !== 'staff') {
    json(res, 403, { error: 'Forbidden — admin or staff required' })
    return null
  }
  return user
}

/** Require a role that can manage PCs (admin, staff, or student_volunteer). */
function requireCanManagePC(req, res) {
  const user = requireAuth(req, res)
  if (!user) return null
  if (!['admin', 'staff', 'student_volunteer'].includes(user.role)) {
    json(res, 403, { error: 'Forbidden' })
    return null
  }
  return user
}

/**
 * Strip sensitive fields based on role:
 *   admin / staff         → full PC (all fields)
 *   student_volunteer     → hide password + router credentials
 *   student               → hide password, router, password change metadata
 */
function sanitizePC(pc, role) {
  if (role === 'admin' || role === 'staff') return pc
  if (role === 'student_volunteer') {
    const { password, routerPassword, routerSSID, lastPasswordChangedBy, ...safe } = pc
    return safe
  }
  // student: view-only — hide all sensitive/credential fields
  const { password, routerPassword, routerSSID, lastPasswordChange, lastPasswordChangedBy, ...safe } = pc
  return safe
}

// ─── Rate limiter (login brute-force protection) ─────────────────────────────

const _loginAttempts = new Map() // ip → { count, resetAt }
const LOGIN_RATE_LIMIT  = 10
const LOGIN_RATE_WINDOW = 60_000 // 1 minute

function checkLoginRateLimit(ip) {
  const now   = Date.now()
  const entry = _loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    _loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_RATE_WINDOW })
    return true
  }
  if (entry.count >= LOGIN_RATE_LIMIT) return false
  entry.count++
  return true
}

// ─── Agent heartbeat validation ───────────────────────────────────────────────

const KNOWN_LABS    = new Set(['cl1','cl2','cl3','cl4','cl5','nl1','sl1','sl2','emc'])
const HB_STR_MAX    = 120
const HB_STR_FIELDS = ['hostname','ipAddress','macAddress','os','osBuild','cpu','ram','storage','loggedInUser']

function validateHeartbeat(hb) {
  if (typeof hb.labId !== 'string' || !KNOWN_LABS.has(hb.labId)) return 'Unknown labId'
  if (typeof hb.pcNum !== 'number' || hb.pcNum < 1 || hb.pcNum > 60) return 'Invalid pcNum'
  for (const f of HB_STR_FIELDS) {
    if (hb[f] !== undefined && (typeof hb[f] !== 'string' || hb[f].length > HB_STR_MAX))
      return `Invalid field: ${f}`
  }
  return null
}

// ─── Agent tracking (in-memory, keyed by labId-pcNum) ────────────────────────

const AGENT_KEY = process.env.AGENT_KEY
if (!AGENT_KEY) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] AGENT_KEY env var must be set in production. Exiting.')
    process.exit(1)
  }
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

/** Find or create a PC in Supabase matching this agent heartbeat */
async function matchOrCreatePC(hb) {
  const { data: existing } = await supabase
    .from('pcs').select('*').eq('lab_id', hb.labId).eq('num', hb.pcNum).maybeSingle()
  if (existing) return rowToPC(existing)

  // Auto-create a new PC entry
  const newPC = {
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
  const { data } = await supabase.from('pcs').insert(pcToRow(newPC)).select().single()
  console.log(`[Agent] Auto-registered new PC: ${newPC.id} (${hb.hostname})`)
  return data ? rowToPC(data) : newPC
}

/** Process a heartbeat from a PC agent */
async function processHeartbeat(hb) {
  const pc = await matchOrCreatePC(hb)
  const key = `${hb.labId}-${hb.pcNum}`

  const specs = { ...pc.specs }
  const rowUpdates = {}
  let specChanged = false

  if (hb.ipAddress && specs.ipAddress !== hb.ipAddress) { specs.ipAddress = hb.ipAddress; specChanged = true }
  if (hb.macAddress && specs.macAddress !== hb.macAddress) { specs.macAddress = hb.macAddress; specChanged = true }
  if (hb.cpu && specs.cpu !== hb.cpu) { specs.cpu = hb.cpu; specChanged = true }
  if (hb.ram && specs.ram !== hb.ram) { specs.ram = hb.ram; specChanged = true }
  if (hb.storage && specs.storage !== hb.storage) { specs.storage = hb.storage; specChanged = true }
  if (hb.os && specs.os !== hb.os) { specs.os = hb.os; specChanged = true }
  if (hb.osBuild && specs.osBuild !== hb.osBuild) { specs.osBuild = hb.osBuild; specChanged = true }
  if (specChanged) rowUpdates.specs = specs

  if (hb.loggedInUser && hb.loggedInUser !== 'Unknown' && hb.loggedInUser !== 'SYSTEM') {
    if (pc.lastStudent !== hb.loggedInUser) {
      rowUpdates.last_student = hb.loggedInUser
      rowUpdates.last_used = new Date().toISOString().replace('T', ' ').slice(0, 16)
      pc.lastStudent = hb.loggedInUser
    }
    if (pc.status !== 'maintenance' && pc.status !== 'occupied') {
      rowUpdates.status = 'occupied'
      pc.status = 'occupied'
    }
  } else {
    if (pc.status === 'occupied') {
      rowUpdates.status = 'available'
      pc.status = 'available'
    }
  }

  if (Object.keys(rowUpdates).length > 0) {
    await supabase.from('pcs').update(rowUpdates).eq('id', pc.id)
  }

  agentMap.set(key, { ...hb, lastSeen: new Date(), online: true, pcId: pc.id })
  return { pcId: pc.id, status: pc.status, condition: pc.condition }
}

/** Periodically check for offline PCs (no heartbeat in OFFLINE_TIMEOUT) */
async function checkOfflinePCs() {
  const now = Date.now()
  const offlineIds = []

  for (const [key, agent] of agentMap.entries()) {
    const elapsed = now - agent.lastSeen.getTime()
    if (elapsed > OFFLINE_TIMEOUT && agent.online) {
      agent.online = false
      agentMap.set(key, agent)
      offlineIds.push(agent.pcId)
      console.log(`[Agent] PC ${agent.pcId} went offline (no heartbeat for ${Math.round(elapsed/1000)}s)`)
    }
  }

  if (offlineIds.length > 0) {
    await supabase.from('pcs')
      .update({ status: 'maintenance' })
      .in('id', offlineIds)
      .neq('status', 'maintenance')
  }
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
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    })
    return res.end()
  }

  // ── Health check ──

  if (path === '/api/health' && method === 'GET') {
    return json(res, 200, { status: 'ok', ts: Date.now() })
  }

  // ── Auth routes ──

  if (path === '/api/auth/login' && method === 'POST') {
    const ip = req.socket.remoteAddress ?? 'unknown'
    if (!checkLoginRateLimit(ip)) return json(res, 429, { error: 'Too many requests. Try again later.' })
    const body = await parseBody(req)
    const user = await findUserByUsername(body.username)
    if (!user || !checkPassword(body.password ?? '', user.passwordHash))
      return json(res, 401, { error: 'Invalid credentials' })
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

  // camelCase → snake_case map for PATCH updates
  const PC_PATCH_COL = {
    status: 'status', condition: 'condition', password: 'password',
    lastPasswordChange: 'last_password_change', lastPasswordChangedBy: 'last_password_changed_by',
    lastStudent: 'last_student', lastUsed: 'last_used',
    routerSSID: 'router_ssid', routerPassword: 'router_password',
    specs: 'specs', installedApps: 'installed_apps',
  }

  if (path === '/api/labs' && method === 'GET') {
    const caller = requireAuth(req, res)
    if (!caller) return
    const { data: labs, error } = await supabase.from('labs').select('*').order('id')
    if (error) return json(res, 500, { error: 'Database error' })
    return json(res, 200, labs.map(l => ({
      id: l.id, name: l.name, short: l.short, hasFloorPlan: l.has_floor_plan,
    })))
  }

  const labPcsMatch = path.match(/^\/api\/labs\/([^/]+)\/pcs$/)
  if (labPcsMatch && method === 'GET') {
    const caller = requireAuth(req, res)
    if (!caller) return
    const labId = labPcsMatch[1]
    const { data: rows, error } = await supabase
      .from('pcs').select('*').eq('lab_id', labId).order('num')
    if (error) return json(res, 500, { error: 'Database error' })
    return json(res, 200, rows.map(r => sanitizePC(rowToPC(r), caller.role)))
  }

  const pcMatch = path.match(/^\/api\/pcs\/([^/]+)$/)
  if (pcMatch && method === 'GET') {
    const caller = requireAuth(req, res)
    if (!caller) return
    const { data: row, error } = await supabase
      .from('pcs').select('*').eq('id', pcMatch[1]).maybeSingle()
    if (error || !row) return json(res, 404, { error: 'PC not found' })
    return json(res, 200, sanitizePC(rowToPC(row), caller.role))
  }

  if (pcMatch && method === 'PATCH') {
    const caller = requireCanManagePC(req, res)
    if (!caller) return
    const body = await parseBody(req)
    const isFullAccess = caller.role === 'admin' || caller.role === 'staff'
    // student_volunteer cannot change credential or hardware-spec fields
    const VOLUNTEER_BLOCKED = new Set(['password','lastPasswordChange','lastPasswordChangedBy','routerSSID','routerPassword','specs'])
    const dbUpdates = {}
    for (const [k, v] of Object.entries(body)) {
      if (!PC_PATCH_COL[k]) continue
      if (!isFullAccess && VOLUNTEER_BLOCKED.has(k)) continue
      dbUpdates[PC_PATCH_COL[k]] = v
    }
    const { data: updated, error } = await supabase
      .from('pcs').update(dbUpdates).eq('id', pcMatch[1]).select().maybeSingle()
    if (error || !updated) return json(res, 404, { error: 'PC not found' })
    return json(res, 200, sanitizePC(rowToPC(updated), caller.role))
  }

  if (pcMatch && method === 'DELETE') {
    const caller = requireAdminOrStaff(req, res)
    if (!caller) return
    const { error } = await supabase.from('pcs').delete().eq('id', pcMatch[1])
    if (error) return json(res, 500, { error: 'Database error' })
    return json(res, 200, { ok: true })
  }

  // ── Add PC (admin/staff only) ──

  if (path === '/api/pcs' && method === 'POST') {
    const caller = requireAdminOrStaff(req, res)
    if (!caller) return
    const body = await parseBody(req)
    if (!body.labId || typeof body.num !== 'number')
      return json(res, 400, { error: 'labId and num are required' })
    const { data: lab } = await supabase.from('labs').select('id').eq('id', body.labId).maybeSingle()
    if (!lab) return json(res, 400, { error: 'Unknown lab' })
    const { data: dup } = await supabase.from('pcs').select('id').eq('lab_id', body.labId).eq('num', body.num).maybeSingle()
    if (dup) return json(res, 409, { error: `PC-${String(body.num).padStart(2,'0')} already exists in that lab` })
    const newPC = {
      id:                    `${body.labId}-${body.num}`,
      num:                   body.num,
      labId:                 body.labId,
      status:                body.status    ?? 'available',
      condition:             body.condition ?? 'good',
      password:              body.password  ?? `Lab@${1000 + Math.floor(Math.random() * 9000)}`,
      lastPasswordChange:    new Date().toISOString().slice(0, 10),
      lastPasswordChangedBy: caller.name,
      lastStudent:           '',
      lastUsed:              '',
      routerSSID:            body.routerSSID     ?? `CICTE-${body.labId.toUpperCase()}`,
      routerPassword:        body.routerPassword ?? `Net@${10000 + Math.floor(Math.random() * 90000)}`,
      specs: body.specs ?? { ram:'', storage:'', os:'', cpu:'', gpu:'', motherboard:'', monitor:'', ipAddress:'', macAddress:'', software:[], pcType:'Desktop' },
      repairs:               [],
      installedApps:         [],
    }
    const { data: inserted, error } = await supabase.from('pcs').insert(pcToRow(newPC)).select().single()
    if (error) return json(res, 500, { error: 'Database error' })
    return json(res, 201, rowToPC(inserted))
  }

  const repairMatch = path.match(/^\/api\/pcs\/([^/]+)\/repairs$/)
  if (repairMatch && method === 'POST') {
    const caller = requireCanManagePC(req, res)
    if (!caller) return
    const body = await parseBody(req)
    const { data: row } = await supabase
      .from('pcs').select('repairs, lab_id').eq('id', repairMatch[1]).maybeSingle()
    if (!row) return json(res, 404, { error: 'PC not found' })
    const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
    const repair = {
      id:    `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date:  (typeof body.date === 'string' && ISO_DATE_RE.test(body.date)) ? body.date : new Date().toISOString().slice(0, 10),
      type:  String(body.type  || '').slice(0, 100),
      by:    String(body.by    || '').slice(0, 80),
      notes: String(body.notes || '').slice(0, 500),
    }
    const repairs = [...(row.repairs ?? []), repair]
    const { data: updated, error } = await supabase
      .from('pcs').update({ repairs }).eq('id', repairMatch[1]).select().maybeSingle()
    if (error || !updated) return json(res, 500, { error: 'Update failed' })
    return json(res, 200, sanitizePC(rowToPC(updated), caller.role))
  }

  // ── Agent routes ──

  if (path === '/api/agent/heartbeat' && method === 'POST') {
    const key = req.headers['x-agent-key']
    if (key !== _AGENT_KEY) return json(res, 403, { error: 'Invalid agent key' })
    const body = await parseBody(req)
    const hbError = validateHeartbeat(body)
    if (hbError) return json(res, 400, { error: hbError })
    const result = await processHeartbeat(body)
    return json(res, 200, result)
  }

  // ── User CRUD (admin/staff only) ──

  if (path === '/api/users' && method === 'GET') {
    const caller = requireAdminOrStaff(req, res)
    if (!caller) return
    const { data: rows, error } = await supabase
      .from('users').select('id,username,role,name,created_at').order('created_at')
    if (error) return json(res, 500, { error: 'Database error' })
    return json(res, 200, rows)
  }

  if (path === '/api/users' && method === 'POST') {
    const caller = requireAdminOrStaff(req, res)
    if (!caller) return
    const body = await parseBody(req)
    if (!body.username || !body.password || !body.role)
      return json(res, 400, { error: 'username, password, and role are required' })
    const VALID_ROLES = ['admin', 'staff', 'student_volunteer', 'student']
    if (!VALID_ROLES.includes(body.role))
      return json(res, 400, { error: 'Invalid role' })
    if (typeof body.username !== 'string' || body.username.length < 3 || body.username.length > 50)
      return json(res, 400, { error: 'Username must be 3–50 characters' })
    if (typeof body.password !== 'string' || body.password.length < 8)
      return json(res, 400, { error: 'Password must be at least 8 characters' })
    const { data: dup } = await supabase.from('users').select('id').eq('username', body.username.trim()).maybeSingle()
    if (dup) return json(res, 409, { error: 'Username already taken' })
    const { data: inserted, error } = await supabase.from('users').insert({
      username:      body.username.trim(),
      password_hash: hashPassword(body.password),
      role:          body.role,
      name:          String(body.name ?? '').slice(0, 100),
    }).select('id,username,role,name,created_at').single()
    if (error) return json(res, 500, { error: 'Database error' })
    return json(res, 201, inserted)
  }

  const userIdMatch = path.match(/^\/api\/users\/([^/]+)$/)

  if (userIdMatch && method === 'PATCH') {
    const caller = requireAdminOrStaff(req, res)
    if (!caller) return
    const body = await parseBody(req)
    const updates = {}
    if (body.name     !== undefined) updates.name = String(body.name).slice(0, 100)
    if (body.role     !== undefined) {
      const VALID_ROLES = ['admin','staff','student_volunteer','student']
      if (!VALID_ROLES.includes(body.role)) return json(res, 400, { error: 'Invalid role' })
      updates.role = body.role
    }
    if (body.password !== undefined) {
      if (typeof body.password !== 'string' || body.password.length < 8)
        return json(res, 400, { error: 'Password must be at least 8 characters' })
      updates.password_hash = hashPassword(body.password)
    }
    if (body.username !== undefined) {
      if (typeof body.username !== 'string' || body.username.length < 3 || body.username.length > 50)
        return json(res, 400, { error: 'Username must be 3–50 characters' })
      const { data: dup } = await supabase.from('users').select('id')
        .eq('username', body.username.trim()).neq('id', userIdMatch[1]).maybeSingle()
      if (dup) return json(res, 409, { error: 'Username already taken' })
      updates.username = body.username.trim()
    }
    if (Object.keys(updates).length === 0) return json(res, 400, { error: 'No valid fields to update' })
    const { data: updated, error } = await supabase.from('users')
      .update(updates).eq('id', userIdMatch[1]).select('id,username,role,name,created_at').maybeSingle()
    if (error || !updated) return json(res, 404, { error: 'User not found' })
    return json(res, 200, updated)
  }

  if (userIdMatch && method === 'DELETE') {
    const caller = requireAdminOrStaff(req, res)
    if (!caller) return
    if (userIdMatch[1] === caller.id)
      return json(res, 400, { error: 'You cannot delete your own account' })
    const { error } = await supabase.from('users').delete().eq('id', userIdMatch[1])
    if (error) return json(res, 500, { error: 'Database error' })
    return json(res, 200, { ok: true })
  }

  if (path === '/api/agent/status' && method === 'GET') {
    const caller = requireAdminOrStaff(req, res)
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
        'X-Content-Type-Options':  'nosniff',
        'X-Frame-Options':         'DENY',
        'Referrer-Policy':         'strict-origin-when-cross-origin',
        'Permissions-Policy':      'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss:",
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
})
