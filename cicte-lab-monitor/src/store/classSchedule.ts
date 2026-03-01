import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FacultyAttendance, AttendanceStatus } from '@/types'
import { CLASS_SCHEDULE } from '@/lib/classScheduleData'

// ─── Store ────────────────────────────────────────────────────────────────────

interface ClassScheduleStore {
  attendance: FacultyAttendance[]

  /** Mark or update attendance for a class on a specific date */
  markAttendance: (
    classId:      string,
    date:         string,
    status:       AttendanceStatus,
    markedBy:     string,
    notes?:       string,
    timeArrived?: string,
  ) => void

  /** Get attendance record for a class on a date (undefined = not yet marked) */
  getAttendance: (classId: string, date: string) => FacultyAttendance | undefined

  /** Get all attendance records for a specific lab on a date */
  getLabAttendance: (labId: string, date: string) => FacultyAttendance[]

  /** Remove an attendance record (reset to unmarked) */
  clearAttendance: (classId: string, date: string) => void
}

const uid = () => Math.random().toString(36).slice(2, 9)

export const useClassScheduleStore = create<ClassScheduleStore>()(
  persist(
    (set, get) => ({
      attendance: [],

      markAttendance: (classId, date, status, markedBy, notes, timeArrived) => {
        set(s => {
          const existing = s.attendance.findIndex(
            a => a.classId === classId && a.date === date
          )
          const record: FacultyAttendance = {
            id:          existing >= 0 ? s.attendance[existing].id : `att-${uid()}`,
            classId,
            date,
            status,
            markedAt:    new Date().toISOString(),
            markedBy,
            notes,
            timeArrived,
          }
          if (existing >= 0) {
            const updated = [...s.attendance]
            updated[existing] = record
            return { attendance: updated }
          }
          return { attendance: [record, ...s.attendance] }
        })
      },

      getAttendance: (classId, date) =>
        get().attendance.find(a => a.classId === classId && a.date === date),

      getLabAttendance: (labId, date) => {
        const labClassIds = new Set(
          CLASS_SCHEDULE.filter(c => c.labId === labId).map(c => c.id)
        )
        return get().attendance.filter(a => labClassIds.has(a.classId) && a.date === date)
      },

      clearAttendance: (classId, date) =>
        set(s => ({
          attendance: s.attendance.filter(
            a => !(a.classId === classId && a.date === date)
          ),
        })),
    }),
    { name: 'cicte-class-attendance' }
  )
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns "YYYY-MM-DD" for today (or any Date) */
export const toDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** 0=Mon … 6=Sun.  Returns today's day index. */
export const todayDayIndex = (): number => {
  const n = new Date().getDay() // 0=Sun, 1=Mon … 6=Sat
  return n === 0 ? 6 : n - 1   // shift to 0=Mon … 6=Sun
}

/** Parse "HH:mm" → minutes since midnight */
export const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Get schedules for a lab + day, sorted by start time */
export const getLabDaySchedule = (labId: string, day: number) =>
  CLASS_SCHEDULE
    .filter(c => c.labId === labId && c.day === day)
    .sort((a, b) => toMins(a.startTime) - toMins(b.startTime))

/** Format "HH:mm" → "7:45 AM" */
export const fmt12 = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const hh   = h % 12 || 12
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`
}
