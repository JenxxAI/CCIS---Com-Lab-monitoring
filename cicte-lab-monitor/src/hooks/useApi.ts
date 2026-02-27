import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PC, Lab, RepairLog } from '@/types'
import { useAuthStore } from '@/store'
import type { AuthUser } from '@/store'
import { env } from '@/lib/env'

const BASE = env.apiUrl

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { headers, ...init })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const qk = {
  labs:    ['labs']            as const,
  labPCs:  (id: string) => ['labs', id, 'pcs'] as const,
  allPCs:  ['all-pcs']        as const,
  pc:      (id: string) => ['pcs', id]          as const,
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
