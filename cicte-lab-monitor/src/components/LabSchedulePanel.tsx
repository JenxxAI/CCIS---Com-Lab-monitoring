import { useState, useEffect } from 'react'
import {
  X, CalendarDays, Clock, User, BookOpen,
  CheckCircle2, AlertCircle, XCircle, Minus, Printer, MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore, useAuthStore } from '@/store'
import { useClassScheduleStore, getLabDaySchedule, toDateStr, todayDayIndex, fmt12, toMins } from '@/store/classSchedule'
import { getLabDaySchedule as _glds } from '@/store/classSchedule'
import { DAY_LABELS } from '@/types'
import type { DayIndex, AttendanceStatus, ClassScheduleEntry, FacultyAttendance } from '@/types'
import { LABS } from '@/lib/data'

// ─── Attendance meta ──────────────────────────────────────────────────────────
const ATTENDANCE_META: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  present: { label: 'Present', color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  icon: CheckCircle2 },
  late:    { label: 'Late',    color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', icon: AlertCircle  },
  absent:  { label: 'Absent',  color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',  icon: XCircle      },
}

const STATUS_CYCLE: AttendanceStatus[] = ['present', 'late', 'absent']

// ─── Single class row ─────────────────────────────────────────────────────────
function ClassRow({
  entry, date, isNow, dark, canManage,
}: {
  entry:      ClassScheduleEntry
  date:       string
  isNow:      boolean
  dark:       boolean
  canManage:  boolean
}) {
  const [open, setOpen] = useState(false)
  const { getAttendance, markAttendance, clearAttendance } = useClassScheduleStore()
  const markedBy = useAuthStore(s => s.user?.name ?? 'Staff')

  const att    = getAttendance(entry.id, date)
  const meta   = att ? ATTENDANCE_META[att.status] : null
  const Icon   = meta?.icon ?? Minus
  const hasNotes = att && (att.notes || att.timeArrived)

  function cycleStatus() {
    if (!canManage) return
    if (!att) {
      markAttendance(entry.id, date, 'present', markedBy)
    } else {
      const idx  = STATUS_CYCLE.indexOf(att.status)
      const next = STATUS_CYCLE[idx + 1]
      if (next) markAttendance(entry.id, date, next, markedBy)
      else      clearAttendance(entry.id, date)
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-150',
        isNow
          ? (dark ? 'border-blue-500/40 bg-blue-950/30' : 'border-blue-400/50 bg-blue-50')
          : (dark ? 'border-dark-border bg-dark-surfaceAlt' : 'border-slate-200 bg-white'),
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Time block */}
        <div className={cn(
          'flex-shrink-0 w-24 rounded-lg px-2 py-1.5 text-center',
          isNow
            ? (dark ? 'bg-blue-500/20' : 'bg-blue-100')
            : (dark ? 'bg-dark-bg' : 'bg-slate-50'),
        )}>
          <p className={cn('text-[10px] font-semibold leading-tight',
            isNow ? (dark ? 'text-blue-300' : 'text-blue-600')
                  : (dark ? 'text-slate-400' : 'text-slate-500')
          )}>
            {fmt12(entry.startTime)}
          </p>
          <div className={cn('my-0.5 h-px', dark ? 'bg-dark-border' : 'bg-slate-200')} />
          <p className={cn('text-[10px] font-semibold leading-tight',
            isNow ? (dark ? 'text-blue-300' : 'text-blue-600')
                  : (dark ? 'text-slate-400' : 'text-slate-500')
          )}>
            {fmt12(entry.endTime)}
          </p>
        </div>

        {/* Info — always shows instructor name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded',
              dark ? 'bg-dark-bg text-slate-400' : 'bg-slate-100 text-slate-500',
            )}>
              {entry.courseCode}
            </span>
            {isNow && (
              <span className="text-[10px] font-semibold text-blue-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
                LIVE
              </span>
            )}
          </div>
          <p className={cn(
            'text-[13px] font-semibold mt-0.5 truncate',
            dark ? 'text-slate-100' : 'text-slate-800',
          )}>
            {entry.subject}
          </p>
          {/* Instructor + section — always visible */}
          <div className={cn('flex items-center gap-1.5 mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
            <User className="w-3 h-3 flex-shrink-0" />
            <span className={cn('text-[11px] font-medium', dark ? 'text-slate-400' : 'text-slate-600')}>
              {entry.instructorName}
            </span>
            <span className="text-[10px]">·</span>
            <span className="text-[11px]">{entry.section}</span>
          </div>
        </div>

        {/* Attendance badge + notes toggle */}
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={cycleStatus}
            title={canManage ? 'Click to cycle attendance status' : 'View only'}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-150',
              canManage ? 'cursor-pointer hover:brightness-110 active:scale-95' : 'cursor-default',
              !att && (dark ? 'border-dark-border text-slate-600 bg-transparent' : 'border-slate-200 text-slate-400 bg-slate-50'),
            )}
            style={att ? {
              color:       meta!.color,
              background:  meta!.bg,
              borderColor: meta!.color + '55',
            } : undefined}
          >
            <Icon className="w-3 h-3" />
            {att ? meta!.label : 'Unmark'}
          </button>

          {/* Notes toggle — only shown when there are notes or canManage */}
          {(canManage || hasNotes) && (
            <button
              onClick={() => setOpen(o => !o)}
              title="Notes / arrival time"
              className={cn(
                'flex items-center gap-1 text-[10px] transition-colors',
                open
                  ? (dark ? 'text-blue-400' : 'text-blue-500')
                  : (dark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'),
              )}
            >
              <MessageSquare className="w-3 h-3" />
              {hasNotes ? 'Notes' : '+ Note'}
            </button>
          )}
        </div>
      </div>

      {/* Notes / arrival time section (expandable) */}
      {open && (
        <div className={cn(
          'px-4 pb-3 pt-1 border-t flex flex-col gap-1',
          dark ? 'border-dark-border' : 'border-slate-100',
        )}>
          {att && (
            <div className="flex flex-col gap-0.5">
              {att.timeArrived && (
                <p className={cn('text-[11px]', dark ? 'text-slate-400' : 'text-slate-600')}>
                  <span className={cn('font-medium', dark ? 'text-slate-500' : 'text-slate-500')}>Arrived:</span> {fmt12(att.timeArrived)}
                </p>
              )}
              {att.notes && (
                <p className={cn('text-[11px] italic', dark ? 'text-slate-500' : 'text-slate-500')}>
                  "{att.notes}"
                </p>
              )}
              <p className={cn('text-[10px]', dark ? 'text-slate-600' : 'text-slate-400')}>
                Marked by {att.markedBy} · {new Date(att.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {canManage && att && (
            <NoteEditor
              dark={dark}
              initial={att.notes ?? ''}
              initialArrived={att.timeArrived ?? ''}
              onSave={(notes, timeArrived) =>
                markAttendance(entry.id, date, att.status, att.markedBy, notes, timeArrived || undefined)
              }
            />
          )}
          {canManage && !att && (
            <p className={cn('text-[10px]', dark ? 'text-slate-600' : 'text-slate-400')}>
              Mark attendance first to add notes.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Inline note editor ────────────────────────────────────────────────────────
function NoteEditor({ dark, initial, initialArrived, onSave }: {
  dark:           boolean
  initial:        string
  initialArrived: string
  onSave:         (notes: string, timeArrived: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [notes,   setNotes]   = useState(initial)
  const [arrived, setArrived] = useState(initialArrived)

  if (!editing) return (
    <button
      onClick={() => setEditing(true)}
      className={cn('text-[10px] underline mt-0.5', dark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600')}
    >
      + Add notes / arrival time
    </button>
  )

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <input
        type="time"
        value={arrived}
        onChange={e => setArrived(e.target.value)}
        className={cn(
          'rounded px-2 py-1 text-[11px] border w-32',
          dark ? 'bg-dark-bg border-dark-border text-slate-300' : 'bg-white border-slate-200 text-slate-700',
        )}
        placeholder="Arrival time"
      />
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
        placeholder="Optional notes…"
        className={cn(
          'rounded px-2 py-1 text-[11px] border resize-none',
          dark ? 'bg-dark-bg border-dark-border text-slate-300 placeholder:text-slate-600'
               : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400',
        )}
      />
      <div className="flex gap-2">
        <button
          onClick={() => { onSave(notes, arrived); setEditing(false) }}
          className="text-[11px] px-2.5 py-0.5 rounded bg-blue-500 text-white font-medium"
        >
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className={cn('text-[11px] px-2 py-0.5 rounded', dark ? 'text-slate-500' : 'text-slate-400')}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Summary bar ──────────────────────────────────────────────────────────────
function AttendanceSummary({ labId, date, dark }: { labId: string; date: string; dark: boolean }) {
  const { getLabAttendance } = useClassScheduleStore()
  const records = getLabAttendance(labId, date)
  const counts: Record<AttendanceStatus, number> = { present: 0, late: 0, absent: 0 }
  records.forEach(r => { counts[r.status]++ })
  const total = records.length
  if (total === 0) return null

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-2 rounded-lg border text-[11px] mb-3',
      dark ? 'bg-dark-surfaceAlt border-dark-border' : 'bg-slate-50 border-slate-200',
    )}>
      <span className={cn('font-semibold', dark ? 'text-slate-400' : 'text-slate-500')}>
        Today's tally:
      </span>
      {(Object.entries(counts) as [AttendanceStatus, number][]).map(([s, n]) => {
        const m = ATTENDANCE_META[s]
        return (
          <span key={s} className="flex items-center gap-1 font-semibold" style={{ color: m.color }}>
            <m.icon className="w-3 h-3" /> {n} {m.label}
          </span>
        )
      })}
    </div>
  )
}

// ─── Weekly Report Printer ────────────────────────────────────────────────────
function buildWeekDates(todayIdx: number): { date: string; dayIdx: number }[] {
  const today  = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - todayIdx)
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return { date: toDateStr(d), dayIdx: i }
  })
}

function printWeeklyReport(
  labId:      string,
  labName:    string,
  todayIdx:   number,
  attendance: FacultyAttendance[],
  markedBy:   string,
) {
  const weekDays  = buildWeekDates(todayIdx)
  const monday    = weekDays[0].date
  const saturday  = weekDays[5].date
  const generated = new Date().toLocaleString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const attMap = new Map<string, FacultyAttendance>()
  attendance.forEach(a => attMap.set(`${a.classId}|${a.date}`, a))

  const STATUS_COLOR: Record<string, string> = {
    present: '#15803d', late: '#b45309', absent: '#be123c',
  }
  const STATUS_BG: Record<string, string> = {
    present: '#dcfce7', late: '#fef3c7', absent: '#ffe4e6',
  }

  let bodyHtml = ''
  let grandPresent = 0, grandLate = 0, grandAbsent = 0, grandUnmarked = 0

  weekDays.forEach(({ date, dayIdx }) => {
    const sched = _glds(labId, dayIdx)
    if (sched.length === 0) return

    const dayLabel = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayIdx]
    const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
    })

    let p = 0, l = 0, a = 0, u = 0
    let rowsHtml = ''

    sched.forEach((entry, i) => {
      const rec   = attMap.get(`${entry.id}|${date}`)
      const st    = rec?.status
      const color = st ? STATUS_COLOR[st] : '#64748b'
      const bg    = st ? STATUS_BG[st]    : '#f8fafc'
      const label = st
        ? (st === 'present' ? 'Present' : st === 'late' ? 'Late' : 'Absent')
        : '—'
      if (st === 'present') p++
      else if (st === 'late') l++
      else if (st === 'absent') a++
      else u++

      const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc'
      rowsHtml += `
        <tr style="background:${rowBg}">
          <td style="padding:7px 10px;font-size:11px;color:#374151;white-space:nowrap">${fmt12(entry.startTime)} – ${fmt12(entry.endTime)}</td>
          <td style="padding:7px 10px;font-size:11px;font-weight:600;color:#1e293b">${entry.subject}</td>
          <td style="padding:7px 10px;font-size:11px;color:#64748b">${entry.courseCode}</td>
          <td style="padding:7px 10px;font-size:11px;color:#374151">${entry.section}</td>
          <td style="padding:7px 10px;font-size:11px;color:#374151;font-style:italic">${entry.instructorName}</td>
          <td style="padding:7px 10px;text-align:center">
            <span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:10px;font-weight:700;color:${color};background:${bg};border:1px solid ${color}40">${label}</span>
          </td>
          <td style="padding:7px 10px;font-size:11px;color:#64748b">${rec?.timeArrived ? fmt12(rec.timeArrived) : ''}</td>
          <td style="padding:7px 10px;font-size:11px;color:#64748b;max-width:160px">${rec?.notes ?? ''}</td>
          <td style="padding:7px 10px;font-size:10px;color:#94a3b8">${rec?.markedBy ?? ''}</td>
        </tr>`
    })

    grandPresent  += p
    grandLate     += l
    grandAbsent   += a
    grandUnmarked += u

    bodyHtml += `
      <div style="margin-bottom:24px;page-break-inside:avoid">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <h2 style="margin:0;font-size:13px;font-weight:700;color:#1e293b">${dayLabel} <span style="font-weight:400;color:#64748b">· ${dateLabel}</span></h2>
          <div style="display:flex;gap:12px;font-size:11px">
            <span style="color:#15803d">✓ Present: ${p}</span>
            <span style="color:#b45309">⚠ Late: ${l}</span>
            <span style="color:#be123c">✗ Absent: ${a}</span>
            ${u > 0 ? `<span style="color:#64748b">— Unmarked: ${u}</span>` : ''}
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-family:inherit">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap">Time</th>
              <th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Subject</th>
              <th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Code</th>
              <th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Section</th>
              <th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Instructor</th>
              <th style="padding:7px 10px;text-align:center;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Status</th>
              <th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Arrived</th>
              <th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Notes</th>
              <th style="padding:7px 10px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Marked By</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>`
  })

  const totalClasses = grandPresent + grandLate + grandAbsent + grandUnmarked
  const attendancePct = totalClasses > 0
    ? Math.round(((grandPresent + grandLate) / totalClasses) * 100)
    : 0

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Faculty Monitoring Report — ${labName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      color: #1e293b;
      background: #fff;
      padding: 28px 32px;
      font-size: 12px;
    }
    @media print {
      body { padding: 16px 20px; }
      @page { size: A4 landscape; margin: 12mm; }
    }
    table { border-collapse: collapse; }
    td, th { border-bottom: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <!-- Report Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #5b7fff">
    <div>
      <p style="font-size:10px;font-weight:700;color:#5b7fff;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">CCIS Computer Lab Monitoring System</p>
      <h1 style="font-size:20px;font-weight:800;color:#1e293b;margin-bottom:2px">Faculty Monitoring Weekly Report</h1>
      <p style="font-size:12px;color:#64748b">${labName} &nbsp;·&nbsp; Week of ${monday} – ${saturday}</p>
    </div>
    <div style="text-align:right;font-size:11px;color:#64748b">
      <p>Generated: ${generated}</p>
      <p>Prepared by: ${markedBy}</p>
    </div>
  </div>

  <!-- Weekly Summary -->  
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:24px">
    ${[
      { label: 'Total Classes', value: totalClasses,   color: '#5b7fff', bg: '#eef2ff' },
      { label: 'Present',       value: grandPresent,   color: '#15803d', bg: '#dcfce7' },
      { label: 'Late',          value: grandLate,      color: '#b45309', bg: '#fef3c7' },
      { label: 'Absent',        value: grandAbsent,    color: '#be123c', bg: '#ffe4e6' },
      { label: 'Attendance %',  value: attendancePct + '%', color: '#0369a1', bg: '#e0f2fe' },
    ].map(s => `
      <div style="background:${s.bg};border-radius:10px;padding:12px;border:1px solid ${s.color}30">
        <p style="font-size:10px;font-weight:600;color:${s.color};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${s.label}</p>
        <p style="font-size:22px;font-weight:800;color:${s.color}">${s.value}</p>
      </div>`).join('')}
  </div>

  <!-- Day-by-day tables -->
  ${bodyHtml || '<p style="color:#94a3b8;text-align:center;padding:32px">No classes recorded for this week.</p>'}

  <!-- Footer -->
  <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8">
    <span>CCIS Lab Monitor · Confidential</span>
    <span>Printed ${generated}</span>
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=1100,height=750')
  if (!win) return
  win.document.write(html)
  win.document.close()
  // Slight delay so styles render before print dialog
  setTimeout(() => { win.focus(); win.print() }, 400)
}

// ─── Main Panel ──────────────────────────────────────────────────────────────
interface LabSchedulePanelProps {
  labId:   string
  onClose: () => void
}

export function LabSchedulePanel({ labId, onClose }: LabSchedulePanelProps) {
  const { dark }     = useThemeStore()
  const canManage    = useAuthStore(s => s.canManage)
  const markedBy     = useAuthStore(s => s.user?.name ?? 'Staff')
  const { attendance } = useClassScheduleStore()

  const todayIdx     = todayDayIndex()
  const [day, setDay] = useState<number>(Math.min(todayIdx, 5)) // clamp to Sat
  const today        = toDateStr()
  const isToday      = day === todayIdx

  // Live "now" tracking
  const [nowMins, setNowMins] = useState(() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date()
      setNowMins(d.getHours() * 60 + d.getMinutes())
    }, 30_000)
    return () => clearInterval(t)
  }, [])

  const lab      = LABS.find(l => l.id === labId)
  const schedule = getLabDaySchedule(labId, day)
  const displayDate = isToday ? today : (() => {
    // Calculate the date for the selected day in the *current* week (Mon-based)
    const todayDate = new Date()
    const diff = day - todayIdx
    const d    = new Date(todayDate)
    d.setDate(d.getDate() + diff)
    return toDateStr(d)
  })()

  const DAYS = [0,1,2,3,4,5] as DayIndex[]

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={cn(
          'w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden',
          dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200',
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-5 py-4 border-b flex-shrink-0',
          dark ? 'border-dark-border' : 'border-slate-200',
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center',
              dark ? 'bg-blue-500/15' : 'bg-blue-50',
            )}>
              <CalendarDays className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className={cn('text-[15px] font-bold', dark ? 'text-slate-100' : 'text-slate-900')}>
                {lab?.name} — Class Schedule
              </h2>
              <p className={cn('text-[11px]', dark ? 'text-slate-500' : 'text-slate-400')}>
                Mon – Sat · 7:45 AM – 8:30 PM
                {!canManage && ' · View-only'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Print weekly report */}
            <button
              onClick={() => printWeeklyReport(labId, lab?.name ?? labId, todayIdx, attendance, markedBy)}
              title="Print weekly faculty attendance report"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 border',
                dark
                  ? 'bg-dark-surfaceAlt border-dark-border text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100',
              )}
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </button>

            <button
              onClick={onClose}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                dark ? 'text-slate-500 hover:text-slate-300 hover:bg-dark-surfaceAlt'
                     : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div className={cn(
          'flex gap-1 px-4 pt-3 pb-2 flex-shrink-0 border-b overflow-x-auto',
          dark ? 'border-dark-border' : 'border-slate-100',
        )}>
          {DAYS.map(d => {
            const isActive  = day === d
            const isToday_d = d === todayIdx
            return (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150',
                  isActive
                    ? 'text-white'
                    : (dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'),
                )}
                style={isActive ? { background: isToday_d ? '#5b7fff' : (dark ? '#334155' : '#64748b') } : undefined}
              >
                {DAY_LABELS[d].slice(0, 3)}
                {isToday_d && (
                  <span className={cn(
                    'w-1 h-1 rounded-full mt-0.5',
                    isActive ? 'bg-white' : 'bg-blue-500',
                  )} />
                )}
              </button>
            )
          })}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-5 space-y-2">
          {/* Attendance summary for today */}
          {isToday && canManage && (
            <AttendanceSummary labId={labId} date={today} dark={dark} />
          )}

          {/* Legend */}
          {canManage && schedule.length > 0 && (
            <div className={cn(
              'flex items-center gap-2 text-[10px] mb-1',
              dark ? 'text-slate-600' : 'text-slate-400',
            )}>
              <Minus className="w-3 h-3" />
              Click badge to mark:
              {Object.entries(ATTENDANCE_META).map(([s, m]) => (
                <span key={s} className="flex items-center gap-0.5" style={{ color: m.color }}>
                  <m.icon className="w-3 h-3" /> {m.label}
                </span>
              ))}
              <span className="ml-1">→ click again to cycle → clear</span>
            </div>
          )}

          {schedule.length === 0 ? (
            <div className={cn(
              'flex flex-col items-center justify-center py-14 gap-3',
              dark ? 'text-slate-600' : 'text-slate-400',
            )}>
              <BookOpen className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No classes scheduled</p>
              <p className="text-[11px]">
                {DAY_LABELS[day as DayIndex]} is a free day for {lab?.name}
              </p>
            </div>
          ) : (
            schedule.map(entry => {
              const startM = toMins(entry.startTime)
              const endM   = toMins(entry.endTime)
              const isNow  = isToday && nowMins >= startM && nowMins < endM
              return (
                <ClassRow
                  key={entry.id}
                  entry={entry}
                  date={displayDate}
                  isNow={isNow}
                  dark={dark}
                  canManage={canManage}
                />
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          'flex items-center justify-between px-5 py-3 border-t text-[10px] flex-shrink-0',
          dark ? 'border-dark-border text-slate-600' : 'border-slate-100 text-slate-400',
        )}>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>All times in 12-hr format · 1h30m blocks</span>
          </div>
          {isToday ? (
            <span className="text-blue-500 font-semibold">Today – {new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          ) : (
            <span>{DAY_LABELS[day as DayIndex]} · {displayDate}</span>
          )}
        </div>
      </div>
    </div>
  )
}
