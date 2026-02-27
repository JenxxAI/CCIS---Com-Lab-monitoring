import { useState } from 'react'
import { useAuthStore } from '@/store'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const login = useAuthStore(s => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Login failed')
      }

      const { token, user } = await res.json()
      login(token, user)
    } catch (err: unknown) {
      // If the API is not available, allow offline demo login
      if (username === 'admin' && password === 'admin123') {
        login(
          btoa(JSON.stringify({ id: 'admin-1', username: 'admin', role: 'admin', name: 'Admin Ramos' })),
          { id: 'admin-1', username: 'admin', role: 'admin', name: 'Admin Ramos' },
        )
      } else if (username === 'viewer' && password === 'viewer123') {
        login(
          btoa(JSON.stringify({ id: 'viewer-1', username: 'viewer', role: 'viewer', name: 'Vol. Dela Rosa' })),
          { id: 'viewer-1', username: 'viewer', role: 'viewer', name: 'Vol. Dela Rosa' },
        )
      } else {
        setError(err instanceof Error ? err.message : 'Invalid credentials')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c1017] px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img
              src="/logos/sunn-logo.png"
              alt="SUNN University"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-slate-100">CCIS Lab Monitor</h1>
          <p className="text-[12px] text-slate-500 mt-1">
            College of Computing &amp; Information Sciences
          </p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className={cn(
            'rounded-2xl border p-6',
            'bg-[#141824] border-[#232b3e]'
          )}
        >
          <h2 className="text-[14px] font-semibold text-slate-200 mb-4">Sign in</h2>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[12px]">
              {error}
            </div>
          )}

          <div className="mb-3">
            <label className="block text-[11px] text-slate-500 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              className={cn(
                'w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-colors',
                'bg-[#0c1017] border border-[#232b3e] text-slate-200',
                'focus:border-[#5b7fff] focus:ring-1 focus:ring-[#5b7fff]/30',
                'placeholder:text-slate-600'
              )}
              placeholder="admin"
            />
          </div>

          <div className="mb-5">
            <label className="block text-[11px] text-slate-500 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-colors',
                'bg-[#0c1017] border border-[#232b3e] text-slate-200',
                'focus:border-[#5b7fff] focus:ring-1 focus:ring-[#5b7fff]/30',
                'placeholder:text-slate-600'
              )}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className={cn(
              'w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all',
              'bg-[#5b7fff] text-white hover:bg-[#4a6ef0]',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-600">
              Demo accounts: <span className="text-slate-500">admin / admin123</span> or <span className="text-slate-500">viewer / viewer123</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
