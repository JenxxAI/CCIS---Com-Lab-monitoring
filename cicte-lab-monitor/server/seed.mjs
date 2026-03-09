// ─── Database seeder ─────────────────────────────────────────────────────────
// Seeds the Supabase database with initial lab, PC, and user data.
// Run once: node server/seed.mjs   (env vars must be set in .env or shell)

import { createClient } from '@supabase/supabase-js'
import { pbkdf2Sync, randomBytes } from 'node:crypto'

const SUPABASE_URL         = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[Seed] SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

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
    repairs:                  pc.repairs  ?? [],
    installed_apps:           pc.installedApps ?? [],
  }
}

// ─── Password hashing (must match server/index.mjs) ─────────────────────────

function hashPassword(plaintext) {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(String(plaintext), salt, 100_000, 32, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

// ─── Data generators (mirror of src/lib/data.ts) ────────────────────────────

const LABS = [
  { id:'cl1', name:'Computer Lab 1', short:'CL 1',  has_floor_plan:true  },
  { id:'cl2', name:'Computer Lab 2', short:'CL 2',  has_floor_plan:true  },
  { id:'cl3', name:'Computer Lab 3', short:'CL 3',  has_floor_plan:true  },
  { id:'cl4', name:'Computer Lab 4', short:'CL 4',  has_floor_plan:true  },
  { id:'cl5', name:'Computer Lab 5', short:'CL 5',  has_floor_plan:true  },
  { id:'nl1', name:'NitLab 1',       short:'NIT 1', has_floor_plan:false },
  { id:'sl1', name:'Smart Lab 1',    short:'SML 1', has_floor_plan:false },
  { id:'sl2', name:'Smart Lab 2',    short:'SML 2', has_floor_plan:false },
  { id:'emc', name:'EMC Lab',        short:'EMC',   has_floor_plan:false },
]

const LAB_PC_COUNTS = {
  cl1:31, cl2:31, cl3:31,
  cl4:22, cl5:22,
  nl1:24, sl1:30, sl2:30, emc:24,
}

const NAMES  = ['M. Santos','J. dela Cruz','A. Reyes','C. Mendoza','L. Cruz','B. Torres','R. Lim','J. Ocampo']
const STAFF  = ['Admin Ramos','Vol. Dela Rosa','Vol. Aquino','Tech. Magsino']
const REPAIR_TYPES = [
  'RAM Replacement','HDD Formatting','OS Reinstall','Keyboard Repair',
  'Monitor Fix','GPU Replaced','Virus Removal','PSU Replaced',
]
const RAM_OPTS     = ['4 GB DDR4','8 GB DDR4','16 GB DDR4','8 GB DDR5']
const STORAGE_OPTS = ['256 GB SSD','500 GB HDD','512 GB NVMe SSD','1 TB HDD']
const OS_OPTS      = ['Windows 10 Pro','Windows 10 Home','Windows 11 Pro','Windows 11 Home']
const OS_BUILDS = {
  'Windows 10 Pro':  ['19045.3803','19045.4046'],
  'Windows 10 Home': ['19045.3803','19045.3930'],
  'Windows 11 Pro':  ['22631.3007','22631.3155','22631.3296'],
  'Windows 11 Home': ['22631.3007','22631.3155'],
}
const CPU_OPTS     = ['Intel Core i3-10100','Intel Core i5-10400','Intel Core i5-12400','Intel Core i7-12700','AMD Ryzen 5 5600','AMD Ryzen 5 3600']
const GPU_OPTS     = ['Intel UHD 630','Intel UHD 730','AMD Radeon Vega 8','NVIDIA GT 1030','NVIDIA GTX 1650','Integrated']
const MOBO_OPTS    = ['ASUS PRIME H510M-E','Gigabyte B560M DS3H','MSI PRO B660M-A','ASRock B450M Pro4']
const MONITOR_OPTS = ['Dell E2222H 22"','Samsung S24R350 24"','Acer V226HQL 22"','LG 24MK430H 24"','AOC 24B2XH 24"']
const PC_TYPE_OPTS = ['Desktop','Desktop','Desktop','All-in-One']

const SOFTWARE_POOL = [
  'Microsoft Office 365','Google Chrome','Mozilla Firefox','Visual Studio Code',
  'Python 3.12','Java JDK 21','Node.js 20 LTS','Git 2.43',
  'MySQL Workbench','XAMPP 8.2','FileZilla','WinRAR',
  'Adobe Acrobat Reader','VLC Media Player','Notepad++','7-Zip',
  'NetBeans IDE 20','Eclipse IDE','IntelliJ IDEA Community','Android Studio',
  'Cisco Packet Tracer','Wireshark','VMware Workstation Player',
  'MS Teams','Zoom','OBS Studio','Blender 4.0',
  'AutoCAD 2024','Adobe Photoshop 2024','Figma Desktop','Dev-C++',
  'MATLAB R2024a','Turbo C++','MinGW GCC','Arduino IDE 2.3',
]

const rand   = (arr) => arr[Math.floor(Math.random() * arr.length)]
const rInt   = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pad2   = (n) => String(n).padStart(2, '0')
const randDate = () => `2025-${pad2(rInt(1,12))}-${pad2(rInt(1,28))}`

function makeRepairs() {
  return Array.from({ length: rInt(0,5) }, (_, i) => ({
    id:   `r-${i}-${Math.random().toString(36).slice(2,7)}`,
    date: randDate(),
    type: rand(REPAIR_TYPES),
    by:   rand(STAFF),
  }))
}

function makePC(labId, num) {
  const status =
    Math.random() < 0.55 ? 'available' :
    Math.random() < 0.70 ? 'occupied'  : 'maintenance'

  const condition =
    status === 'maintenance'
      ? (Math.random() < 0.5 ? 'needs_repair' : 'damaged')
      : Math.random() < 0.70 ? 'good'
      : Math.random() < 0.50 ? 'lagging' : 'needs_repair'

  const os = rand(OS_OPTS)
  const softwareCount = rInt(8, 16)
  const shuffled = [...SOFTWARE_POOL].sort(() => Math.random() - 0.5)
  const software = shuffled.slice(0, softwareCount)
  const labNum = labId.replace(/\D/g, '') || '1'
  const pcOctet = rInt(10, 250)
  const macParts = Array.from({ length: 6 }, () =>
    rInt(0, 255).toString(16).padStart(2, '0').toUpperCase()
  )

  return {
    id:  `${labId}-${num}`,
    num,
    labId,
    status,
    condition,
    password:              `Lab@${rInt(1000,9999)}`,
    lastPasswordChange:    randDate(),
    lastPasswordChangedBy: rand(STAFF),
    lastStudent:           rand(NAMES),
    lastUsed:              `2026-02-${pad2(rInt(1,26))} ${pad2(rInt(7,17))}:${pad2(rInt(0,59))}`,
    routerSSID:            `CICTE-${labId.toUpperCase()}`,
    routerPassword:        `Net@${rInt(10000,99999)}`,
    specs: {
      ram:         rand(RAM_OPTS),
      storage:     rand(STORAGE_OPTS),
      os,
      osBuild:     rand(OS_BUILDS[os] ?? ['Unknown']),
      cpu:         rand(CPU_OPTS),
      gpu:         rand(GPU_OPTS),
      motherboard: rand(MOBO_OPTS),
      monitor:     rand(MONITOR_OPTS),
      ipAddress:   `192.168.${labNum}.${pcOctet}`,
      macAddress:  macParts.join(':'),
      software,
      pcType:      rand(PC_TYPE_OPTS),
    },
    repairs: makeRepairs(),
  }
}

// ─── Seed function ───────────────────────────────────────────────────────────

export async function seed() {
  // Upsert labs
  const { error: labErr } = await supabase
    .from('labs').upsert(LABS, { onConflict: 'id' })
  if (labErr) { console.error('[Seed] Labs error:', labErr.message); process.exit(1) }
  console.log(`[Seed] Upserted ${LABS.length} labs`)

  // Generate PCs
  const rows = []
  for (const [labId, count] of Object.entries(LAB_PC_COUNTS)) {
    for (let i = 1; i <= count; i++) {
      rows.push(pcToRow(makePC(labId, i)))
    }
  }

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const { error } = await supabase
      .from('pcs').upsert(rows.slice(i, i + 50), { onConflict: 'id' })
    if (error) { console.error('[Seed] PCs error:', error.message); process.exit(1) }
  }

  console.log(`[Seed] Upserted ${rows.length} PCs across ${LABS.length} labs`)

  // ── Seed initial users ──────────────────────────────────────────────────────
  // Only inserts if the username does not already exist. Safe to re-run.
  const SEED_USERS = [
    {
      username: process.env.ADMIN_USER || 'admin',
      password: process.env.ADMIN_PASS || 'Admin@CICTE2026!',
      role:     'admin',
      name:     'Admin Ramos',
    },
    {
      username: process.env.VIEWER_USER || 'viewer',
      password: process.env.VIEWER_PASS || 'Viewer@CICTE2026!',
      role:     'staff',
      name:     'Staff Dela Rosa',
    },
  ]

  for (const u of SEED_USERS) {
    const { data: existing } = await supabase
      .from('users').select('id').eq('username', u.username).maybeSingle()
    if (existing) {
      console.log(`[Seed] User '${u.username}' already exists — skipping`)
      continue
    }
    const { error: uErr } = await supabase.from('users').insert({
      username:      u.username,
      password_hash: hashPassword(u.password),
      role:          u.role,
      name:          u.name,
    })
    if (uErr) console.error(`[Seed] Error creating user '${u.username}':`, uErr.message)
    else console.log(`[Seed] Created user '${u.username}' (${u.role})`)
  }
}

seed()
