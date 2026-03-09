import { useState } from 'react'
import { Users, Plus, Pencil, Trash2, X, Check, Eye, EyeOff, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore, useAuthStore } from '@/store'
import type { UserRole } from '@/store'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useApi'
import type { AppUser } from '@/hooks/useApi'
import { Badge } from '@/components/Badge'
import { toast } from '@/store/toast'

// ─── Role metadata ────────────────────────────────────────────────────────────

const ROLE_META: Record<UserRole, { label: string; color: string; description: string }> = {
  admin:             { label: 'Admin',             color: '#f43f5e', description: 'Dean / Program Head — total access including user management' },
  staff:             { label: 'Staff',             color: '#8b5cf6', description: 'Faculty / Technician — total access including user management' },
  student_volunteer: { label: 'Student Volunteer', color: '#3b82f6', description: 'Manage PCs and monitor labs — cannot manage users' },
  student:           { label: 'Student',           color: '#22c55e', description: 'View-only access to lab status' },
}

// ─── User Form Dialog ─────────────────────────────────────────────────────────

interface UserFormData {
  username: string
  password: string
  role:     UserRole
  name:     string
}

function UserFormDialog({
  open, title, initial, onClose, onSubmit, loading, isEdit,
}: {
  open:     boolean
  title:    string
  initial?: Partial<UserFormData>
  onClose:  () => void
  onSubmit: (data: UserFormData) => void
  loading:  boolean
  isEdit?:  boolean
}) {
  const { dark } = useThemeStore()
  const [form, setForm] = useState<UserFormData>({
    username: initial?.username ?? '',
    password: '',
    role:     initial?.role     ?? 'student',
    name:     initial?.name     ?? '',
  })
  const [showPass, setShowPass] = useState(false)

  if (!open) return null

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <div>
      <label className={cn('block text-[11px] font-medium mb-1', dark ? 'text-slate-400' : 'text-slate-600')}>
        {label}
      </label>
      {node}
      {hint && <p className={cn('text-[10px] mt-1', dark ? 'text-slate-600' : 'text-slate-400')}>{hint}</p>}
    </div>
  )

  const inputClass = cn(
    'w-full px-3 py-2 rounded-lg border text-[12px] outline-none',
    dark
      ? 'bg-dark-surfaceAlt border-dark-border text-slate-200 placeholder:text-slate-600'
      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username.trim()) { toast.error('Username is required'); return }
    if (!isEdit && !form.password) { toast.error('Password is required'); return }
    if (form.password && form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative z-10 w-full max-w-md mx-4 rounded-2xl border shadow-2xl p-6',
        dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
      )}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Shield size={16} className={dark ? 'text-accent' : 'text-blue-600'} />
            <h2 className={cn('text-[15px] font-semibold', dark ? 'text-slate-100' : 'text-slate-900')}>{title}</h2>
          </div>
          <button onClick={onClose} className={cn('w-7 h-7 rounded-lg flex items-center justify-center', dark ? 'hover:bg-dark-surfaceAlt text-slate-500' : 'hover:bg-slate-100 text-slate-400')}>
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('Full Name',
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Dr. Maria Santos" className={inputClass} />
          )}

          {field('Username *',
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="e.g. m.santos" className={cn(inputClass, 'font-mono')} />
          )}

          {field(
            isEdit ? 'Password (blank = keep current)' : 'Password *',
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters"
                className={cn(inputClass, 'font-mono pr-9')}
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className={cn('absolute right-2.5 top-1/2 -translate-y-1/2', dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}>
                {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          )}

          {field('Role *',
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))} className={inputClass}>
              {(Object.keys(ROLE_META) as UserRole[]).map(r => (
                <option key={r} value={r}>{ROLE_META[r].label}</option>
              ))}
            </select>,
            ROLE_META[form.role].description
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className={cn('flex-1 px-4 py-2 rounded-lg border text-[12px] transition-colors',
                dark ? 'border-dark-border text-slate-400 hover:bg-dark-surfaceAlt' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-medium transition-colors disabled:opacity-50">
              <Check size={13} />
              {loading ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function UserManagementPage() {
  const { dark } = useThemeStore()
  const currentUser = useAuthStore(s => s.user)
  const { data: users = [], isLoading } = useUsers()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const [showAdd, setShowAdd]             = useState(false)
  const [editUser, setEditUser]           = useState<AppUser | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<AppUser | null>(null)

  const accent = dark ? '#5b7fff' : '#3a5cf5'

  const handleCreate = async (data: UserFormData) => {
    try {
      await createUser.mutateAsync(data as Parameters<typeof createUser.mutateAsync>[0])
      toast.success(`User '@${data.username}' created`)
      setShowAdd(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user')
    }
  }

  const handleUpdate = async (data: UserFormData) => {
    if (!editUser) return
    const payload: Record<string, string> = { username: data.username, name: data.name, role: data.role }
    if (data.password) payload.password = data.password
    try {
      await updateUser.mutateAsync({ id: editUser.id, ...payload } as Parameters<typeof updateUser.mutateAsync>[0])
      toast.success(`User '@${data.username}' updated`)
      setEditUser(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteUser.mutateAsync(deleteConfirm.id)
      toast.success(`User '@${deleteConfirm.username}' deleted`)
      setDeleteConfirm(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: dark ? 'rgba(91,127,255,0.15)' : 'rgba(58,92,245,0.1)' }}>
            <Users size={17} style={{ color: accent }} />
          </div>
          <div>
            <h1 className={cn('text-[18px] font-bold', dark ? 'text-slate-100' : 'text-slate-900')}>
              User Management
            </h1>
            <p className={cn('text-[11px]', dark ? 'text-slate-500' : 'text-slate-400')}>
              Manage system accounts and access roles
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-medium transition-colors"
        >
          <Plus size={13} />
          Add User
        </button>
      </div>

      {/* Role legend */}
      <div className={cn('flex flex-wrap gap-3 mb-5 p-3 rounded-xl border', dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200')}>
        {(Object.keys(ROLE_META) as UserRole[]).map(r => (
          <div key={r} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ROLE_META[r].color }} />
            <span className={cn('text-[11px]', dark ? 'text-slate-400' : 'text-slate-600')}>{ROLE_META[r].label}</span>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className={cn('rounded-xl border overflow-hidden', dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200')}>
        {isLoading ? (
          <div className="p-10 text-center">
            <div className={cn('text-[12px]', dark ? 'text-slate-500' : 'text-slate-400')}>Loading users…</div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <Users size={28} className={cn('mx-auto mb-2', dark ? 'text-slate-700' : 'text-slate-300')} />
            <p className={cn('text-[12px]', dark ? 'text-slate-500' : 'text-slate-400')}>No users yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn('border-b text-left', dark ? 'bg-dark-surfaceAlt border-dark-border' : 'bg-slate-50 border-slate-200')}>
                  {['Name / Username', 'Role', 'Created', 'Actions'].map((h, i) => (
                    <th key={h} className={cn(
                      'px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase',
                      dark ? 'text-slate-500' : 'text-slate-400',
                      i === 2 && 'hidden sm:table-cell',
                      i === 3 && 'text-right',
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const meta = ROLE_META[u.role] ?? ROLE_META.student
                  const isMe = u.id === currentUser?.id
                  return (
                    <tr key={u.id} className={cn(
                      'border-b transition-colors',
                      dark ? 'border-dark-border hover:bg-dark-surfaceAlt/50' : 'border-slate-100 hover:bg-slate-50',
                      idx === users.length - 1 && 'border-b-0',
                    )}>
                      <td className="px-4 py-3">
                        <div className={cn('text-[12px] font-medium flex items-center gap-1.5', dark ? 'text-slate-200' : 'text-slate-800')}>
                          {u.name || '—'}
                          {isMe && (
                            <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium', dark ? 'bg-accent/20 text-accent' : 'bg-blue-50 text-blue-600')}>
                              You
                            </span>
                          )}
                        </div>
                        <div className={cn('text-[11px] font-mono mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
                          @{u.username}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={meta.color} bg={meta.color + '20'}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={cn('text-[11px]', dark ? 'text-slate-500' : 'text-slate-400')}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditUser(u)}
                            className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                              dark ? 'hover:bg-dark-border text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700')}
                            title="Edit user">
                            <Pencil size={13} />
                          </button>
                          {!isMe && (
                            <button onClick={() => setDeleteConfirm(u)}
                              className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                                dark ? 'hover:bg-rose-500/20 text-slate-500 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500')}
                              title="Delete user">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add dialog */}
      <UserFormDialog
        open={showAdd} title="Add User"
        onClose={() => setShowAdd(false)}
        onSubmit={handleCreate as (data: UserFormData) => void}
        loading={createUser.isPending}
      />

      {/* Edit dialog */}
      {editUser && (
        <UserFormDialog
          open title="Edit User" isEdit
          initial={{ username: editUser.username, role: editUser.role, name: editUser.name }}
          onClose={() => setEditUser(null)}
          onSubmit={handleUpdate as (data: UserFormData) => void}
          loading={updateUser.isPending}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className={cn(
            'relative z-10 w-full max-w-sm mx-4 rounded-2xl border shadow-2xl p-6',
            dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
          )}>
            <h3 className={cn('text-[15px] font-semibold mb-2', dark ? 'text-slate-100' : 'text-slate-900')}>
              Delete User
            </h3>
            <p className={cn('text-[12px] mb-5', dark ? 'text-slate-400' : 'text-slate-600')}>
              Delete <strong>@{deleteConfirm.username}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className={cn('flex-1 px-4 py-2 rounded-lg border text-[12px] transition-colors',
                  dark ? 'border-dark-border text-slate-400 hover:bg-dark-surfaceAlt' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteUser.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[12px] font-medium transition-colors disabled:opacity-50">
                {deleteUser.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
