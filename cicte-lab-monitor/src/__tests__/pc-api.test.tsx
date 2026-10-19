import React from 'react'
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAddPC, useDeletePC, useUpdatePC, useLogRepair } from '@/hooks/useApi'
import { useAuthStore, useLabStore } from '@/store'
import { generateAllLabData } from '@/lib/data'
import { useHeartbeatPolling } from '@/hooks/useHeartbeat'

let client: QueryClient
const pc = generateAllLabData().cl1[0]
function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  useLabStore.setState({ labData: { cl1: [pc] }, activeLab: 'cl1', selectedPC: pc })
  useAuthStore.getState().login('test-token', { id: 'admin', name: 'Admin', username: 'admin', role: 'admin' })
})
afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('PC server mutations', () => {
  it('saves only edited fields and updates the registry and open panel from the server response', async () => {
    const updated = { ...pc, status: 'maintenance' }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(updated)))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(useUpdatePC, { wrapper: Wrapper })
    await act(async () => { await result.current.mutateAsync({ id: pc.id, labId: pc.labId, status: 'maintenance' }) })
    const options = fetchMock.mock.calls[0][1]
    expect(options.headers.Authorization).toBe('Bearer test-token')
    expect(JSON.parse(options.body)).toEqual({ id: pc.id, labId: pc.labId, status: 'maintenance' })
    expect(useLabStore.getState().labData.cl1[0].status).toBe('maintenance')
    expect(useLabStore.getState().selectedPC?.status).toBe('maintenance')
  })

  it('leaves PC data unchanged when saving fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 })))
    const { result } = renderHook(useUpdatePC, { wrapper: Wrapper })
    await act(async () => {
      await expect(result.current.mutateAsync({ id: pc.id, labId: pc.labId, status: 'maintenance' })).rejects.toThrow('Database unavailable')
    })
    expect(useLabStore.getState().selectedPC).toEqual(pc)
    expect(useLabStore.getState().labData.cl1).toEqual([pc])
  })

  it('adds and deletes PCs in the displayed registry immediately after server confirmation', async () => {
    const added = { ...pc, id: 'new-pc', num: 60 }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(added)))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }))))
    const add = renderHook(useAddPC, { wrapper: Wrapper })
    await act(async () => { await add.result.current.mutateAsync({ labId: 'cl1', num: 60 }) })
    expect(useLabStore.getState().labData.cl1).toHaveLength(2)
    useLabStore.setState({ selectedPC: added })
    const remove = renderHook(useDeletePC, { wrapper: Wrapper })
    await act(async () => { await remove.result.current.mutateAsync({ id: added.id, labId: 'cl1' }) })
    expect(useLabStore.getState().labData.cl1).toEqual([pc])
    expect(useLabStore.getState().selectedPC).toBeNull()
  })

  it('syncs repair responses into the selected PC', async () => {
    const repair = { id: 'repair-1', type: 'Replaced fan', date: '2026-10-19', by: 'Technician' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...pc, repairs: [repair] }))))
    const { result } = renderHook(useLogRepair, { wrapper: Wrapper })
    await act(async () => { await result.current.mutateAsync({ pcId: pc.id, labId: pc.labId, repair }) })
    expect(useLabStore.getState().selectedPC?.repairs).toEqual([repair])
  })
})

describe('live heartbeat polling', () => {
  it('does not contact the server or invent online state while signed out', () => {
    vi.useFakeTimers()
    useAuthStore.getState().logout()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { unmount } = renderHook(useHeartbeatPolling)
    act(() => vi.advanceTimersByTime(30_000))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(useLabStore.getState().labData.cl1[0]).toEqual(pc)
    unmount()
  })

  it('loads immediately after login and refreshes the selected PC with actual offline status', async () => {
    const offline = { ...pc, isOnline: false, lastSeen: '2026-10-19T00:00:00Z' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([offline]))))
    const { unmount } = renderHook(useHeartbeatPolling)
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })
    expect(useLabStore.getState().selectedPC?.isOnline).toBe(false)
    expect(useLabStore.getState().selectedPC?.lastSeen).toBe(offline.lastSeen)
    unmount()
  })
})
