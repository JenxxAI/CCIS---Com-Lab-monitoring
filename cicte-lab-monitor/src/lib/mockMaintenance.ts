import type { RepairTicket, MaintenanceEvent, SparePart, ActivityEvent } from '@/types'
import { LABS, LAB_PC_COUNTS } from '@/lib/data'

// ─── Shared helpers ──────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)
const rand   = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
const rInt   = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a
const pad2   = (n: number) => String(n).padStart(2, '0')

const STAFF = ['Admin Ramos', 'Vol. Dela Rosa', 'Vol. Aquino', 'Tech. Magsino']

const randPastDate = (daysBack = 60) => {
  const d = new Date()
  d.setDate(d.getDate() - rInt(0, daysBack))
  return d.toISOString()
}

const randFutureDate = (daysAhead = 30) => {
  const d = new Date()
  d.setDate(d.getDate() + rInt(1, daysAhead))
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

// ─── Lab / PC references (shared from data.ts) ──────────────────────────────

const LAB_IDS = LABS.map(l => l.id)

function randPC(labId: string) {
  const count = LAB_PC_COUNTS[labId] ?? 20
  const n = rInt(1, count)
  return { pcId: `${labId}-${n}`, num: n }
}

// ─── Mock Repair Tickets ─────────────────────────────────────────────────────

const TICKET_TITLES = [
  'Blue screen on startup',
  'RAM not detected after restart',
  'Keyboard keys unresponsive',
  'Monitor flickering intermittently',
  'USB ports not working',
  'Slow boot time (>3 min)',
  'Network adapter missing',
  'Hard drive clicking sound',
  'GPU fan making noise',
  'OS login loop',
  'Touchpad not responding',
  'Speaker audio distorted',
  'BIOS not detecting SSD',
  'Power button not responding',
  'Overheating during use',
]

const TICKET_DESCRIPTIONS = [
  'Student reported this during morning class. PC was restarted twice with no improvement.',
  'Noticed during routine check. Unit needs physical inspection.',
  'Confirmed by two different users. Issue is reproducible.',
  'Intermittent — happens mostly under heavy load. Logs attached.',
  'Started after the last OS update was applied. Rolling back may fix it.',
]

const RESOLUTIONS = [
  'Replaced faulty component. All tests passed.',
  'Cleaned and reseated connections. Working normally now.',
  'Reinstalled driver. Issue resolved.',
  'Applied firmware update. Monitoring for recurrence.',
  'Replaced unit entirely. Old one tagged for disposal.',
]

export function generateMockTickets(count = 18): RepairTicket[] {
  const tickets: RepairTicket[] = []
  const priorities = ['low', 'medium', 'high', 'critical'] as const
  const statuses = ['open', 'in-progress', 'resolved', 'closed'] as const

  for (let i = 0; i < count; i++) {
    const labId = rand(LAB_IDS)
    const { pcId } = randPC(labId)
    const status: RepairTicket['status'] = rand(statuses)
    const created = randPastDate(45)
    const resolved = (status === 'resolved' || status === 'closed') ? randPastDate(10) : undefined

    tickets.push({
      id:               `TKT-${uid()}`,
      pcId,
      labId,
      title:            rand(TICKET_TITLES),
      description:      rand(TICKET_DESCRIPTIONS),
      priority:         rand(priorities),
      status,
      assignedTo:       rand(STAFF),
      createdBy:        rand(STAFF),
      createdAt:        created,
      updatedAt:        resolved ?? created,
      estimatedMinutes: rand([15, 30, 45, 60, 90, 120]),
      resolvedAt:       resolved,
      resolution:       resolved ? rand(RESOLUTIONS) : undefined,
      partsUsed:        [],
    })
  }

  return tickets.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// ─── Mock Maintenance Events ─────────────────────────────────────────────────

const MAINT_TITLES = [
  'Full Lab Cleanup',
  'OS Security Updates',
  'Hardware Diagnostic Sweep',
  'Network Infrastructure Check',
  'Preventive Dust Cleaning',
  'Backup & Recovery Test',
  'Antivirus Definition Update',
  'Monitor Calibration',
  'Cable Management Reorganization',
  'AC & Ventilation Check',
]

export function generateMockMaintenanceEvents(count = 10): MaintenanceEvent[] {
  const types = ['preventive', 'cleanup', 'os-update', 'hardware-check', 'network'] as const
  const statuses = ['scheduled', 'in-progress', 'completed', 'cancelled'] as const
  const events: MaintenanceEvent[] = []

  for (let i = 0; i < count; i++) {
    const status: MaintenanceEvent['status'] = rand(statuses)
    const labId = rand(LAB_IDS)

    events.push({
      id:              `ME-${uid()}`,
      labId,
      title:           rand(MAINT_TITLES),
      description:     `Scheduled maintenance for ${labId.toUpperCase()}`,
      scheduledDate:   status === 'completed' || status === 'cancelled'
        ? new Date(Date.now() - rInt(1, 30) * 86400000).toISOString().slice(0, 10)
        : randFutureDate(21),
      scheduledTime:   `${pad2(rInt(8, 16))}:${rand(['00', '30'])}`,
      durationMinutes: rand([30, 60, 90, 120, 180, 240]),
      type:            rand([...types]),
      status,
      assignedTo:      rand(STAFF),
      createdBy:       rand(STAFF),
      createdAt:       randPastDate(30),
      notes:           status === 'completed' ? 'All tasks completed successfully.' : '',
      pcIds:           Array.from({ length: rInt(0, 6) }, () => randPC(labId).pcId),
    })
  }

  return events.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
}

// ─── Mock Spare Parts ────────────────────────────────────────────────────────

const PARTS_DATA: Array<{ name: string; category: SparePart['category'] }> = [
  { name: 'DDR4 8GB Stick',         category: 'RAM' },
  { name: 'DDR4 4GB Stick',         category: 'RAM' },
  { name: 'DDR5 16GB Stick',        category: 'RAM' },
  { name: '256GB SATA SSD',         category: 'Storage' },
  { name: '500GB HDD 7200RPM',      category: 'Storage' },
  { name: '512GB NVMe M.2 SSD',     category: 'Storage' },
  { name: 'HDMI Cable 1.5m',        category: 'Cable' },
  { name: 'VGA Cable 1.8m',         category: 'Cable' },
  { name: 'Cat6 Ethernet Cable 3m', category: 'Cable' },
  { name: 'USB-A to USB-B Cable',   category: 'Cable' },
  { name: 'USB Keyboard',           category: 'Peripheral' },
  { name: 'USB Optical Mouse',      category: 'Peripheral' },
  { name: 'Webcam 720p',            category: 'Peripheral' },
  { name: '22" LCD Monitor',        category: 'Display' },
  { name: '24" LED Monitor',        category: 'Display' },
  { name: 'RJ45 Connector Pack',    category: 'Network' },
  { name: 'USB WiFi Adapter',       category: 'Network' },
  { name: 'Ethernet Switch 8-Port', category: 'Network' },
  { name: '500W ATX PSU',           category: 'Power' },
  { name: 'Power Strip 6-Outlet',   category: 'Power' },
  { name: 'CMOS Battery CR2032',    category: 'Other' },
  { name: 'Thermal Paste Tube',     category: 'Other' },
  { name: 'Compressed Air Can',     category: 'Other' },
]

export function generateMockParts(): SparePart[] {
  return PARTS_DATA.map(p => {
    const qty = rInt(0, 25)
    const minStock = rand([2, 3, 5])
    const usageCount = rInt(0, 4)

    const usageLog = Array.from({ length: usageCount }, () => {
      const labId = rand(LAB_IDS)
      return {
        id:       `PU-${uid()}`,
        partId:   '',  // will be filled below
        pcId:     randPC(labId).pcId,
        labId,
        quantity: rInt(1, 2),
        date:     randPastDate(60).slice(0, 10),
        usedBy:   rand(STAFF),
      }
    })

    const part: SparePart = {
      id:            `SP-${uid()}`,
      name:          p.name,
      category:      p.category,
      quantity:       qty,
      location:      rand(['Repair Room Cabinet A', 'Repair Room Cabinet B', 'Storage Room', 'Server Room']),
      minStock,
      unitCost:      rInt(100, 5000),
      lastRestocked: randPastDate(30).slice(0, 10),
      usageLog:      usageLog.map(u => ({ ...u, partId: '' })),  // partId set below
    }

    part.usageLog = part.usageLog.map(u => ({ ...u, partId: part.id }))
    return part
  })
}

// ─── Mock Activity Events ────────────────────────────────────────────────────

export function generateMockActivity(count = 40): ActivityEvent[] {
  const types = [
    'status-change', 'condition-change', 'repair-logged', 'password-change',
    'ticket-created', 'ticket-resolved', 'maintenance-scheduled', 'app-installed',
  ] as const

  const events: ActivityEvent[] = []
  for (let i = 0; i < count; i++) {
    const labId = rand(LAB_IDS)
    const { pcId } = randPC(labId)
    const type = rand([...types])

    let title = ''
    let description = ''

    switch (type) {
      case 'status-change':
        title = `Status → ${rand(['Available', 'Occupied', 'Maintenance'])}`
        description = `PC status updated during routine check`
        break
      case 'condition-change':
        title = `Condition → ${rand(['Good', 'Lagging', 'Needs Repair', 'Damaged'])}`
        description = `Condition assessment updated`
        break
      case 'repair-logged':
        title = rand(['RAM Replacement', 'HDD Formatting', 'OS Reinstall', 'Keyboard Repair'])
        description = `Repair completed and logged`
        break
      case 'password-change':
        title = 'Password updated'
        description = `New password set for this unit`
        break
      case 'ticket-created':
        title = `Ticket: ${rand(['Blue screen issue', 'USB not working', 'Slow performance'])}`
        description = `New repair ticket opened`
        break
      case 'ticket-resolved':
        title = 'Ticket resolved'
        description = `Repair ticket marked as resolved`
        break
      case 'maintenance-scheduled':
        title = `Maintenance: ${rand(['Cleanup', 'OS Update', 'Hardware Check'])}`
        description = `Scheduled for ${randFutureDate(14)}`
        break
      case 'app-installed':
        title = `Installed ${rand(['VS Code', 'Chrome', 'XAMPP', 'Postman'])}`
        description = `Application added to this PC`
        break
    }

    events.push({
      id:          `ACT-${uid()}`,
      pcId,
      labId,
      type,
      title,
      description,
      timestamp:   randPastDate(30),
      performedBy: rand(STAFF),
    })
  }

  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}
