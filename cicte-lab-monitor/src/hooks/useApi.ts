import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PC, Lab, RepairLog } from '@/types'
import { useAuthStore } from '@/store'
import type { AuthUser, UserRole } from '@/store'
import { env } from '@/lib/env'

const BASE = env.apiUrl

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { headers, ...init })
  if (!res.ok) {
    let msg = `API ${res.status}: ${res.statusText}`
    try { const body = await res.json(); if (body?.error) msg = body.error } catch { /* ignore */ }
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppUser {
  id:         string
  username:   string
  role:       UserRole
  name:       string
  created_at: string
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const qk = {
  labs:    ['labs']            as const,
  labPCs:  (id: string) => ['labs', id, 'pcs'] as const,
  allPCs:  ['all-pcs']        as const,
  pc:      (id: string) => ['pcs', id]          as const,
  users:   ['users']          as const,
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Fetch all labs */
export function useLabs() {
  return useQuery({
    queryKey: qk.labs,
    queryFn:  () => apiFetch<Lab[]>('/api/labs'),
    staleTime: 5 * 60_000,
  })
}

/** Fetch all PCs for a given lab from the API */
export function useLabPCs(labId: string, enabled = true) {
  return useQuery({
    queryKey: qk.labPCs(labId),
    queryFn:  () => apiFetch<PC[]>(`/api/labs/${labId}/pcs`),
    enabled,
    staleTime: 30_000, // 30 s — socket keeps it fresh
  })
}

/** Update a PC's status or condition */
export function useUpdatePC() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pc: Partial<PC> & { id: string; labId: string }) =>
      apiFetch<PC>(`/api/pcs/${pc.id}`, {
        method: 'PATCH',
        body:   JSON.stringify(pc),
      }),
    onSuccess: (updated) => {
      qc.setQueryData<PC[]>(qk.labPCs(updated.labId), old =>
        old?.map(p => p.id === updated.id ? updated : p) ?? [updated]
      )
    },
  })
}

/** Add a new PC to a lab (admin/staff only) */
export function useAddPC() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { labId: string; num: number; [key: string]: unknown }) =>
      apiFetch<PC>('/api/pcs', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (newPC) => {
      qc.setQueryData<PC[]>(qk.labPCs(newPC.labId), old => [...(old ?? []), newPC])
      qc.invalidateQueries({ queryKey: qk.labPCs(newPC.labId) })
    },
  })
}

/** Delete a PC (admin/staff only) */
export function useDeletePC() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; labId: string }) =>
      apiFetch<{ ok: boolean }>(`/api/pcs/${id}`, { method: 'DELETE' }),
    onSuccess: (_, { id, labId }) => {
      qc.setQueryData<PC[]>(qk.labPCs(labId), old => old?.filter(p => p.id !== id) ?? [])
    },
  })
}

/** Log a repair for a PC */
export function useLogRepair() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pcId, labId: _labId, repair }: {
      pcId: string; labId: string; repair: Omit<RepairLog, 'id'>
    }) =>
      apiFetch<PC>(`/api/pcs/${pcId}/repairs`, {
        method: 'POST',
        body:   JSON.stringify(repair),
      }),
    onSuccess: (updated) => {
      qc.setQueryData<PC[]>(qk.labPCs(updated.labId), old =>
        old?.map(p => p.id === updated.id ? updated : p) ?? [updated]
      )
    },
  })
}

/** Login */
export function useLogin() {
  return useMutation({
    mutationFn: (creds: { username: string; password: string }) =>
      apiFetch<{ token: string; user: AuthUser }>(
        '/api/auth/login',
        { method: 'POST', body: JSON.stringify(creds) }
      ),
    onSuccess: ({ token, user }) => {
      useAuthStore.getState().login(token, user)
    },
  })
}

// ─── User Management Hooks (admin/staff only) ─────────────────────────────────

/** Fetch all users */
export function useUsers() {
  return useQuery({
    queryKey: qk.users,
    queryFn:  () => apiFetch<AppUser[]>('/api/users'),
    staleTime: 60_000,
  })
}

/** Create a new user */
export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { username: string; password: string; role: UserRole; name: string }) =>
      apiFetch<AppUser>('/api/users', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  })
}

/** Update an existing user */
export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<{ username: string; password: string; role: UserRole; name: string }> & { id: string }) =>
      apiFetch<AppUser>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  })
}

/** Delete a user */
export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  })
}
