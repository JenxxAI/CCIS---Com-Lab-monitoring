import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PC, RepairLog } from '@/types'

const BASE = import.meta.env.VITE_API_URL ?? ''

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const qk = {
  labs:    ['labs']            as const,
  labPCs:  (id: string) => ['labs', id, 'pcs'] as const,
  pc:      (id: string) => ['pcs', id]          as const,
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

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
