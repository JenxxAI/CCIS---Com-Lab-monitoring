import type { Lab, PC, PCStatus, PCCondition, RepairLog } from '@/types'

// ─── Lab Definitions ─────────────────────────────────────────────────────────

export const LABS: Lab[] = [
  { id:'cl1', name:'Computer Lab 1', short:'CL 1',  hasFloorPlan:true  },
  { id:'cl2', name:'Computer Lab 2', short:'CL 2',  hasFloorPlan:true  },
  { id:'cl3', name:'Computer Lab 3', short:'CL 3',  hasFloorPlan:true  },
  { id:'cl4', name:'Computer Lab 4', short:'CL 4',  hasFloorPlan:true  },
  { id:'cl5', name:'Computer Lab 5', short:'CL 5',  hasFloorPlan:true  },
  { id:'nl1', name:'NitLab 1',       short:'NIT 1', hasFloorPlan:false },
  { id:'sl1', name:'Smart Lab 1',    short:'SML 1', hasFloorPlan:false },
  { id:'sl2', name:'Smart Lab 2',    short:'SML 2', hasFloorPlan:false },
  { id:'emc', name:'EMC Lab',        short:'EMC',   hasFloorPlan:false },
]

// PC counts per lab (matching actual floor plan totals)
export const LAB_PC_COUNTS: Record<string, number> = {
  cl1:31, cl2:31, cl3:31,
  cl4:22, cl5:22,
  nl1:24, sl1:30, sl2:30, emc:24,
}

// Generic grid layouts for non-mapped labs
export const GENERIC_GRIDS: Record<string, { rows:number; cols:number }> = {
  nl1:{ rows:4, cols:6 },
  sl1:{ rows:5, cols:6 },
  sl2:{ rows:5, cols:6 },
  emc:{ rows:4, cols:6 },
}

// ─── Mock Data Helpers ───────────────────────────────────────────────────────

const NAMES  = ['M. Santos','J. dela Cruz','A. Reyes','C. Mendoza','L. Cruz','B. Torres','R. Lim','J. Ocampo']
const STAFF  = ['Admin Ramos','Vol. Dela Rosa','Vol. Aquino','Tech. Magsino']
const REPAIR_TYPES = [
  'RAM Replacement','HDD Formatting','OS Reinstall','Keyboard Repair',
  'Monitor Fix','GPU Replaced','Virus Removal','PSU Replaced',
]
const RAM_OPTS     = ['4 GB','8 GB','16 GB']
const STORAGE_OPTS = ['256 GB SSD','500 GB HDD','1 TB HDD']
const OS_OPTS      = ['Windows 10','Windows 11']

const rand   = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const rInt   = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a
const pad2   = (n: number) => String(n).padStart(2, '0')
const randDate = () =>
  `2025-${pad2(rInt(1,12))}-${pad2(rInt(1,28))}`

function makeRepairs(): RepairLog[] {
  return Array.from({ length: rInt(0,5) }, (_, i) => ({
    id:   `r-${i}-${Math.random().toString(36).slice(2,7)}`,
    date: randDate(),
    type: rand(REPAIR_TYPES),
    by:   rand(STAFF),
  }))
}

export function makePC(labId: string, num: number): PC {
  const status: PCStatus =
    Math.random() < 0.55 ? 'available' :
    Math.random() < 0.70 ? 'occupied'  : 'maintenance'

  const condition: PCCondition =
    status === 'maintenance'
      ? (Math.random() < 0.5 ? 'needs_repair' : 'damaged')
      : Math.random() < 0.70 ? 'good'
      : Math.random() < 0.50 ? 'lagging' : 'needs_repair'

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
    lastUsed:
      `2026-02-${pad2(rInt(1,26))} ${pad2(rInt(7,17))}:${pad2(rInt(0,59))}`,
    routerSSID:     `CICTE-${labId.toUpperCase()}`,
    routerPassword: `Net@${rInt(10000,99999)}`,
    specs: {
      ram:     rand(RAM_OPTS),
      storage: rand(STORAGE_OPTS),
      os:      rand(OS_OPTS),
    },
    repairs: makeRepairs(),
  }
}

// Generate all lab data
export function generateAllLabData(): Record<string, PC[]> {
  const data: Record<string, PC[]> = {}
  Object.entries(LAB_PC_COUNTS).forEach(([id, count]) => {
    data[id] = Array.from({ length: count }, (_, i) => makePC(id, i + 1))
  })
  return data
}
