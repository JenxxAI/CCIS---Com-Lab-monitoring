// ─── PC & Lab Types ──────────────────────────────────────────────────────────

export type PCStatus    = 'available' | 'occupied' | 'maintenance'
export type PCCondition = 'good' | 'lagging' | 'needs_repair' | 'damaged'

export interface RepairLog {
  id:     string
  date:   string
  type:   string
  by:     string
  notes?: string
}

export interface PCSpecs {
  ram:     string
  storage: string
  os:      string
  cpu?:    string
}

export interface PC {
  id:                    string
  num:                   number
  labId:                 string
  status:                PCStatus
  condition:             PCCondition
  password:              string
  lastPasswordChange:    string
  lastPasswordChangedBy: string
  lastStudent:           string
  lastUsed:              string
  routerSSID:            string
  routerPassword:        string
  specs:                 PCSpecs
  repairs:               RepairLog[]
}

export interface Lab {
  id:          string
  name:        string
  short:       string
  hasFloorPlan: boolean
}

export interface LabStats {
  total:       number
  available:   number
  occupied:    number
  maintenance: number
}

// ─── Filter / UI Types ───────────────────────────────────────────────────────

export type ViewTab        = 'map' | 'list' | 'analytics'
export type StatusFilter   = 'all' | PCStatus
export type ConditionFilter = 'all' | PCCondition

export interface Filters {
  status:    StatusFilter
  condition: ConditionFilter
  search:    string
}

// ─── Notification ────────────────────────────────────────────────────────────

export type NotifLevel = 'info' | 'warning' | 'error'

export interface Notification {
  id:        string
  level:     NotifLevel
  message:   string
  labId?:    string
  pcId?:     string
  timestamp: string
  read:      boolean
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface LabAnalytics {
  labId:          string
  labName:        string
  total:          number
  available:      number
  occupied:       number
  maintenance:    number
  availablePct:   number
  topRepairType?: string
  totalRepairs:   number
}

// ─── Layout Types ────────────────────────────────────────────────────────────

export interface Position {
  x: number
  y: number
}

export type FurnitureType = 'table' | 'door' | 'aircon' | 'server' | 'router' | 'wifi' | 'smarttv'

export interface FurnitureItem {
  id:     string
  type:   FurnitureType
  x:      number
  y:      number
  label:  string
  width:  number
  height: number
}
