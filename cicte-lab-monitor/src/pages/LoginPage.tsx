import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, Wifi, WifiOff } from 'lucide-react'
import { useAuthStore, useThemeStore } from '@/store'
import type { UserRole } from '@/store'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toast'

const MAX_ATTEMPTS   = 3
const LOCKOUT_SECS   = 30
const LS_REMEMBER    = 'cicte-remember-username'
const SS_LOCKOUT_KEY = 'cicte-lockout-until'   // epoch ms stored in sessionStorage
const SS_ATTEMPTS    = 'cicte-login-attempts'
const APP_VERSION    = '1.0.0'

// ─── Animated grid background ─────────────────────────────────────────────────
function GridBg({ dark }: { dark: boolean }) {
  const color = dark ? 'rgba(91,127,255,0.07)' : 'rgba(58,92,245,0.06)'
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(${color} 1px, transparent 1px),
          linear-gradient(90deg, ${color} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)',
      }}
    />
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStoredLockout(): { attempts: number; secsLeft: number } {
  try {
    const until    = parseInt(sessionStorage.getItem(SS_LOCKOUT_KEY) ?? '0', 10)
    const attempts = parseInt(sessionStorage.getItem(SS_ATTEMPTS)    ?? '0', 10)
    const secsLeft = Math.max(0, Math.ceil((until - Date.now()) / 1000))
    return { attempts, secsLeft }
  } catch {
    return { attempts: 0, secsLeft: 0 }
  }
}

export function LoginPage() {
  const { dark } = useThemeStore()
  const login    = useAuthStore(s => s.login)

  // Restore persisted lockout on mount
  const stored = getStoredLockout()

  const [username,  setUsername]  = useState(() => localStorage.getItem(LS_REMEMBER) ?? '')
  const [password,  setPassword]  = useState('')
  const [remember,  setRemember]  = useState(() => !!localStorage.getItem(LS_REMEMBER))
  const [error,     setError]     = useState(() => stored.secsLeft > 0 ? `Too many failed attempts. Try again in ${stored.secsLeft}s.` : '')
  const [loading,   setLoading]   = useState(false)
  const [showPass,  setShowPass]  = useState(false)
  const [capsOn,    setCapsOn]    = useState(false)
  const [attempts,  setAttempts]  = useState(stored.attempts)
  const [lockout,   setLockout]   = useState(stored.secsLeft)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown tick
  useEffect(() => {
    if (lockout <= 0) return
    timerRef.current = setInterval(() => {
      setLockout(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!)
          setAttempts(0)
          setError('')
          sessionStorage.removeItem(SS_LOCKOUT_KEY)
          sessionStorage.removeItem(SS_ATTEMPTS)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [lockout])

  // Ping server status
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) })
        setApiStatus(res.ok ? 'online' : 'offline')
      } catch {
        setApiStatus('offline')
      }
    }
    check()
  }, [])

  const handleCapsKey = (e: React.KeyboardEvent) => {
    if (e.getModifierState) setCapsOn(e.getModifierState('CapsLock'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (lockout > 0) return
    setError('')
    setLoading(true)

    const fail = (msg: string) => {
      const next = attempts + 1
      sessionStorage.setItem(SS_ATTEMPTS, String(next))
      setAttempts(next)
      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_SECS * 1000
        sessionStorage.setItem(SS_LOCKOUT_KEY, String(until))
        setLockout(LOCKOUT_SECS)
        setError(`Too many failed attempts. Try again in ${LOCKOUT_SECS}s.`)
      } else {
        setError(`${msg} (${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? '' : 's'} left)`)
      }
    }

    const doLogin = (token: string, user: { id: string; username: string; role: UserRole; name: string }) => {
      if (remember) localStorage.setItem(LS_REMEMBER, username)
      else          localStorage.removeItem(LS_REMEMBER)
      login(token, user)
      toast.success(`Welcome back, ${user.name}!`)
    }

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
      doLogin(token, user)
    } catch (err: unknown) {
      fail(err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const locked = lockout > 0

  return (
    <div className={cn(
      'relative min-h-screen flex flex-col items-center justify-center px-4 transition-colors duration-200',
      dark ? 'bg-[#0c1017]' : 'bg-slate-100'
    )}>
      <GridBg dark={dark} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img
              src="/logos/sunn-logo.png"
              alt="SUNN University"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className={cn('text-xl font-bold', dark ? 'text-slate-100' : 'text-slate-800')}>
            CCIS Lab Monitor
          </h1>
          <p className={cn('text-[12px] mt-1', dark ? 'text-slate-500' : 'text-slate-400')}>
            College of Computing &amp; Information Sciences
          </p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className={cn(
            'rounded-2xl border p-6 transition-colors duration-200',
            dark ? 'bg-[#141824] border-[#232b3e]' : 'bg-white border-slate-200 shadow-sm'
          )}
        >
          {/* Title row + system status */}
          <div className="flex items-center justify-between mb-4">
            <h2 className={cn('text-[14px] font-semibold', dark ? 'text-slate-200' : 'text-slate-800')}>
              Sign in
            </h2>
            <div className="flex items-center gap-1.5">
              {apiStatus === 'checking' ? (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              ) : apiStatus === 'online' ? (
                <Wifi size={11} className="text-emerald-400" />
              ) : (
                <WifiOff size={11} className="text-rose-400" />
              )}
              <span className={cn(
                'text-[10px]',
                apiStatus === 'online'  ? 'text-emerald-400' :
                apiStatus === 'offline' ? 'text-rose-400'    :
                (dark ? 'text-slate-600' : 'text-slate-400')
              )}>
                {apiStatus === 'checking' ? 'Checking…' : apiStatus === 'online' ? 'System Online' : 'System Offline'}
              </span>
            </div>
          </div>

          {/* Error / lockout banner */}
          {error && (
            <div className={cn(
              'mb-4 px-3 py-2 rounded-lg border text-[12px]',
              locked
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            )}>
              {locked ? `🔒 Too many failed attempts. Try again in ${lockout}s.` : error}
            </div>
          )}

          {/* Username */}
          <div className="mb-3">
            <label className={cn('block text-[11px] mb-1.5', dark ? 'text-slate-500' : 'text-slate-500')}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              disabled={locked}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-colors',
                'focus:ring-1 focus:ring-[#5b7fff]/30 focus:border-[#5b7fff]',
                dark
                  ? 'bg-[#0c1017] border border-[#232b3e] text-slate-200 placeholder:text-slate-600'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400',
                locked && 'opacity-40 cursor-not-allowed'
              )}
              placeholder="username"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className={cn('block text-[11px] mb-1.5', dark ? 'text-slate-500' : 'text-slate-500')}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyUp={handleCapsKey}
                onKeyDown={handleCapsKey}
                disabled={locked}
                className={cn(
                  'w-full px-3 py-2 pr-9 rounded-lg text-[13px] outline-none transition-colors',
                  'focus:ring-1 focus:ring-[#5b7fff]/30 focus:border-[#5b7fff]',
                  dark
                    ? 'bg-[#0c1017] border border-[#232b3e] text-slate-200 placeholder:text-slate-600'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400',
                  locked && 'opacity-40 cursor-not-allowed'
                )}
                placeholder="••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPass(v => !v)}
                className={cn(
                  'absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors',
                  dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {capsOn && password.length > 0 && (
              <p className="mt-1 text-[10px] text-amber-400 flex items-center gap-1">
                <span>⇪</span> Caps Lock is on
              </p>
            )}
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2 mb-5 cursor-pointer select-none">
            <div
              onClick={() => setRemember(v => !v)}
              className={cn(
                'w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors flex-shrink-0',
                remember
                  ? 'bg-[#5b7fff] border-[#5b7fff]'
                  : dark ? 'border-[#232b3e] bg-[#0c1017]' : 'border-slate-300 bg-white'
              )}
            >
              {remember && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span
              onClick={() => setRemember(v => !v)}
              className={cn('text-[11px]', dark ? 'text-slate-500' : 'text-slate-500')}
            >
              Remember username
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username || !password || locked}
            className={cn(
              'w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all',
              locked
                ? 'bg-amber-500/20 text-amber-400 cursor-not-allowed'
                : 'bg-[#5b7fff] text-white hover:bg-[#4a6ef0]',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {locked ? `Try again in ${lockout}s` : loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="mt-4 text-center">
            <p className={cn('text-[10px]', dark ? 'text-slate-600' : 'text-slate-400')}>
              Contact your lab administrator for credentials.
            </p>
          </div>
        </form>

        {/* Version */}
        <p className={cn('text-center text-[10px] mt-4', dark ? 'text-slate-700' : 'text-slate-400')}>
          v{APP_VERSION} · CCIS Lab Monitor
        </p>
      </div>
    </div>
  )
}
