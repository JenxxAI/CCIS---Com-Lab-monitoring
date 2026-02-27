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
  ram:          string
  storage:      string
  os:           string
  osBuild?:     string
  cpu:          string
  gpu?:         string
  motherboard?: string
  monitor?:     string
  ipAddress?:   string
  macAddress?:  string
  software:     string[]
  pcType:       'Desktop' | 'Laptop' | 'All-in-One'
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
  installedApps:         string[]    // ids from APP_CATALOG
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

// ─── Repair Ticket System ────────────────────────────────────────────────────

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'
export type TicketStatus   = 'open' | 'in-progress' | 'resolved' | 'closed'

export interface RepairTicket {
  id:              string
  pcId:            string
  labId:           string
  title:           string
  description:     string
  priority:        TicketPriority
  status:          TicketStatus
  assignedTo:      string
  createdBy:       string
  createdAt:       string     // ISO timestamp
  updatedAt:       string     // ISO timestamp
  estimatedMinutes: number
  resolvedAt?:     string     // ISO timestamp
  resolution?:     string
  partsUsed:       string[]   // SparePart ids
}

// ─── Maintenance Scheduling ──────────────────────────────────────────────────

export type MaintenanceType   = 'preventive' | 'cleanup' | 'os-update' | 'hardware-check' | 'network'
export type MaintenanceStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled'

export interface MaintenanceEvent {
  id:             string
  labId:          string
  title:          string
  description:    string
  scheduledDate:  string      // YYYY-MM-DD
  scheduledTime?: string      // HH:mm
  durationMinutes: number
  type:           MaintenanceType
  status:         MaintenanceStatus
  assignedTo:     string
  createdBy:      string
  createdAt:      string      // ISO timestamp
  notes:          string
  pcIds:          string[]    // optional: specific PCs targeted
}

// ─── Spare Parts Inventory ───────────────────────────────────────────────────

export type PartCategory = 'RAM' | 'Storage' | 'Cable' | 'Peripheral' | 'Display' | 'Network' | 'Power' | 'Other'

export interface PartUsageLog {
  id:        string
  partId:    string
  pcId:      string
  labId:     string
  quantity:  number
  date:      string
  usedBy:    string
  ticketId?: string
}

export interface SparePart {
  id:            string
  name:          string
  category:      PartCategory
  quantity:       number
  location:      string
  minStock:      number
  unitCost?:     number
  lastRestocked?: string
  usageLog:      PartUsageLog[]
}

// ─── Activity Timeline ───────────────────────────────────────────────────────

export type ActivityType =
  | 'status-change'
  | 'condition-change'
  | 'repair-logged'
  | 'password-change'
  | 'ticket-created'
  | 'ticket-resolved'
  | 'maintenance-scheduled'
  | 'maintenance-completed'
  | 'part-used'
  | 'app-installed'
  | 'app-removed'

export interface ActivityEvent {
  id:          string
  pcId?:       string
  labId:       string
  type:        ActivityType
  title:       string
  description: string
  timestamp:   string   // ISO timestamp
  performedBy: string
  metadata?:   Record<string, string>
}
