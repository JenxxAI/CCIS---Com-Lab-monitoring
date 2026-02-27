import { create } from 'zustand'

export interface Toast {
  id:       string
  level:    'success' | 'warning' | 'info' | 'error'
  message:  string
  duration?: number  // ms, default 3000
}

interface ToastStore {
  toasts:  Toast[]
  add:     (level: Toast['level'], message: string, duration?: number) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],

  add: (level, message, duration = 3000) => set(s => ({
    toasts: [
      ...s.toasts,
      { id: Math.random().toString(36).slice(2), level, message, duration },
    ].slice(-5), // max 5 visible
  })),

  dismiss: (id) => set(s => ({
    toasts: s.toasts.filter(t => t.id !== id),
  })),
}))

/** Convenience helpers */
export const toast = {
  success: (msg: string, dur?: number) => useToastStore.getState().add('success', msg, dur),
  warning: (msg: string, dur?: number) => useToastStore.getState().add('warning', msg, dur),
  info:    (msg: string, dur?: number) => useToastStore.getState().add('info', msg, dur),
  error:   (msg: string, dur?: number) => useToastStore.getState().add('error', msg, dur),
}
