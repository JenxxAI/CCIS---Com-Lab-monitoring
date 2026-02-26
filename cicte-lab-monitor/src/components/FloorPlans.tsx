import { PCTile } from './PCTile'
import { useThemeStore } from '@/store'
import type { PC, PCStatus } from '@/types'
import { cn } from '@/lib/utils'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function AirconBadge({ t, rotate = false }: { t: any; rotate?: boolean }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px]',
        t.dark ? 'bg-dark-serverBg border border-dark-border text-slate-500'
               : 'bg-slate-100 border border-slate-200 text-slate-400'
      )}
      style={{ transform: rotate ? 'rotate(-8deg)' : undefined }}
    >
      <span>❄</span>
      <span className="tracking-wide">Aircon</span>
    </div>
  )
}

function ServerUnit({ t }: { t: any }) {
  return (
    <div className={cn(
      'w-[50px] rounded-md p-1 flex flex-col gap-1',
      t.dark ? 'bg-dark-serverBg border border-dark-border'
             : 'bg-slate-100 border border-slate-200'
    )}>
      {[0, 1].map(i => (
        <div key={i} className={cn(
          'h-3 rounded-sm flex items-center px-1 gap-1',
          t.dark ? 'bg-dark-border' : 'bg-slate-200'
        )}>
          <div className="w-[3px] h-[3px] rounded-full opacity-60"
            style={{ background: t.dark ? '#5b7fff' : '#3a5cf5' }} />
          <div className={cn('flex-1 h-px', t.dark ? 'bg-dark-borderSub' : 'bg-slate-300')} />
          <div className={cn('w-[3px] h-[7px] rounded-sm opacity-35',
            t.dark ? 'bg-slate-500' : 'bg-slate-400')} />
        </div>
      ))}
    </div>
  )
}

function TowerUnit({ t }: { t: any }) {
  return (
    <div className={cn(
      'w-[50px] rounded-md p-1.5 flex flex-col gap-1.5',
      t.dark ? 'bg-dark-serverBg border border-dark-border'
             : 'bg-slate-100 border border-slate-200'
    )}>
      <div className={cn(
        'h-5 rounded-sm flex items-center justify-center',
        t.dark ? 'bg-dark-border' : 'bg-slate-200'
      )}>
        <div className={cn('w-2 h-2 rounded-sm opacity-40',
          t.dark ? 'bg-slate-400' : 'bg-slate-500')} />
      </div>
      <div className="flex gap-1 justify-center">
        <div className="w-[3px] h-[3px] rounded-full opacity-50"
          style={{ background: t.dark ? '#5b7fff' : '#3a5cf5' }} />
        <div className={cn('w-[3px] h-[3px] rounded-full opacity-30',
          t.dark ? 'bg-slate-500' : 'bg-slate-400')} />
      </div>
    </div>
  )
}

function ClusterBox({ children, t, horizontal = false, gap = 7 }: {
  children: React.ReactNode; t: any; horizontal?: boolean; gap?: number
}) {
  return (
    <div
      className={cn(
        'inline-flex rounded-xl p-2.5',
        t.dark ? 'bg-dark-rowBg border border-dark-rowBorder'
               : 'bg-white border border-slate-200',
        horizontal ? 'flex-row' : 'flex-col'
      )}
      style={{ gap }}
    >
      {children}
    </div>
  )
}

// ─── Props shared by both floor plans ────────────────────────────────────────

interface FloorProps {
  labName:      string
  pcs:          PC[]
  selectedPC:   PC | null
  statusFilter: PCStatus | 'all'
  onSelect:     (pc: PC) => void
}

// ─── CL1 / CL2 / CL3 Floor Plan ──────────────────────────────────────────────

export function FloorPlanCL123({ labName, pcs, selectedPC, statusFilter, onSelect }: FloorProps) {
  const { dark } = useThemeStore()
  const t = { dark }
  const accent = dark ? '#5b7fff' : '#3a5cf5'

  let i = 0
  const take = (n: number) => { const s = pcs.slice(i, i + n); i += n; return s }

  const topL  = take(3); const topR  = take(3)
  const mA_r1 = take(4); const mA_r2 = take(4); const mA_ins = take(1)
  const mB_r1 = take(4); const mB_r2 = take(4); const mB_ins = take(1)
  const botL  = take(3); const botR  = take(3)

  const dim = (pc: PC) => statusFilter !== 'all' && pc.status !== statusFilter

  const T = ({ pc }: { pc: PC }) => (
    <PCTile pc={pc} isSelected={selectedPC?.id === pc.id}
      dimmed={dim(pc)} onSelect={onSelect} accent={accent} />
  )

  const Row = ({ arr }: { arr: PC[] }) => (
    <div className="flex gap-1.5">{arr.map((pc, i) => <T key={i} pc={pc} />)}</div>
  )

  const DblCluster = ({ r1, r2, ins }: { r1: PC[]; r2: PC[]; ins: PC[] }) => (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center gap-1">
        <span className={cn('text-[7px] tracking-wider', dark ? 'text-slate-600' : 'text-slate-400')}>Instr.</span>
        <T pc={ins[0]} />
      </div>
      <ClusterBox t={t}>
        <Row arr={r1} />
        <Row arr={r2} />
      </ClusterBox>
    </div>
  )

  return (
    <div className={cn(
      'rounded-2xl border p-5 inline-block relative',
      dark ? 'bg-dark-mapBg border-dark-border' : 'bg-slate-100 border-slate-200'
    )} style={{ minWidth: 560 }}>
      {/* Aircon top-right */}
      <div className="absolute top-3 right-4"><AirconBadge t={t} rotate /></div>
      {/* Label */}
      <div className={cn('text-[10px] font-semibold tracking-widest uppercase text-center mb-4',
        dark ? 'text-slate-600' : 'text-slate-400')}>{labName}</div>

      <div className="flex gap-3.5 items-start">
        {/* Left wall servers */}
        <div className="flex flex-col gap-2">
          {[0, 1].map(g => (
            <div key={g} className={cn('flex flex-col gap-1.5 rounded-xl p-2',
              dark ? 'bg-dark-serverBg border border-dark-border' : 'bg-slate-200 border border-slate-300')}>
              {[0,1,2,3].map(i => <ServerUnit key={i} t={t} />)}
            </div>
          ))}
        </div>

        {/* Center */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2.5">
            <ClusterBox t={t} horizontal gap={6}>{topL.map((pc,i)=><T key={i} pc={pc}/>)}</ClusterBox>
            <ClusterBox t={t} horizontal gap={6}>{topR.map((pc,i)=><T key={i} pc={pc}/>)}</ClusterBox>
          </div>
          <DblCluster r1={mA_r1} r2={mA_r2} ins={mA_ins} />
          <DblCluster r1={mB_r1} r2={mB_r2} ins={mB_ins} />
          <div className="flex gap-2.5">
            <ClusterBox t={t} horizontal gap={6}>{botL.map((pc,i)=><T key={i} pc={pc}/>)}</ClusterBox>
            <ClusterBox t={t} horizontal gap={6}>{botR.map((pc,i)=><T key={i} pc={pc}/>)}</ClusterBox>
          </div>
        </div>

        {/* Right: table + door */}
        <div className="flex flex-col items-center justify-center gap-4 pl-2 flex-1" style={{ minHeight: 300 }}>
          <div className={cn(
            'w-14 h-14 rounded-lg flex flex-col items-center justify-center text-[9px] gap-0.5',
            dark ? 'bg-dark-serverBg border border-dark-border text-slate-500'
                 : 'bg-slate-200 border border-slate-300 text-slate-400'
          )}>
            <span>📋</span><span>Table</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className={cn('w-[7px] h-12 rounded-sm opacity-35',
              dark ? 'bg-slate-400' : 'bg-slate-400')} />
            <span className={cn('text-[8px] tracking-wide',
              dark ? 'text-slate-600' : 'text-slate-400')}>Door</span>
          </div>
        </div>
      </div>

      {/* Bottom exit marks */}
      <div className="flex justify-between mt-2.5" style={{ paddingLeft: 76, paddingRight: 56 }}>
        {[0,1].map(i => (
          <div key={i} className={cn('h-1 w-7 rounded-sm opacity-25',
            dark ? 'bg-slate-400' : 'bg-slate-400')} />
        ))}
      </div>
    </div>
  )
}

// ─── CL4 / CL5 Floor Plan ────────────────────────────────────────────────────

export function FloorPlanCL45({ labName, pcs, selectedPC, statusFilter, onSelect }: FloorProps) {
  const { dark } = useThemeStore()
  const t = { dark }
  const accent = dark ? '#5b7fff' : '#3a5cf5'

  let i = 0
  const take = (n: number) => { const s = pcs.slice(i, i + n); i += n; return s }

  const topL   = take(3); const topR = take(4)
  const midR1  = take(4); const midR2 = take(4); const midIns = take(1)
  const botL   = take(3); const botR  = take(3)

  const dim = (pc: PC) => statusFilter !== 'all' && pc.status !== statusFilter
  const T = ({ pc }: { pc: PC }) => (
    <PCTile pc={pc} isSelected={selectedPC?.id === pc.id}
      dimmed={dim(pc)} onSelect={onSelect} accent={accent} />
  )
  const Row = ({ arr }: { arr: PC[] }) => (
    <div className="flex gap-1.5">{arr.map((pc,i) => <T key={i} pc={pc} />)}</div>
  )

  return (
    <div className={cn(
      'rounded-2xl border p-5 inline-block relative',
      dark ? 'bg-dark-mapBg border-dark-border' : 'bg-slate-100 border-slate-200'
    )} style={{ minWidth: 580 }}>
      {/* Top two aircons */}
      <div className="absolute top-3 flex gap-14" style={{ left: 90 }}>
        <AirconBadge t={t} /><AirconBadge t={t} />
      </div>
      {/* Top-right aircon */}
      <div className="absolute top-3 right-4"><AirconBadge t={t} rotate /></div>
      {/* Label */}
      <div className={cn('text-[10px] font-semibold tracking-widest uppercase text-center mb-8',
        dark ? 'text-slate-600' : 'text-slate-400')}>{labName}</div>

      <div className="flex gap-3.5 items-start">
        {/* Left wall servers */}
        <div className="flex flex-col gap-2">
          {[0, 1].map(g => (
            <div key={g} className={cn('flex flex-col gap-1.5 rounded-xl p-2',
              dark ? 'bg-dark-serverBg border border-dark-border' : 'bg-slate-200 border border-slate-300')}>
              {[0,1,2,3].map(i => <ServerUnit key={i} t={t} />)}
            </div>
          ))}
        </div>

        {/* Center */}
        <div className="flex flex-col gap-4">
          {/* Top row */}
          <div className="flex gap-2.5">
            <ClusterBox t={t} horizontal gap={6}>{topL.map((pc,i)=><T key={i} pc={pc}/>)}</ClusterBox>
            <ClusterBox t={t} horizontal gap={6}>{topR.map((pc,i)=><T key={i} pc={pc}/>)}</ClusterBox>
          </div>
          {/* Middle: tower column + student rows */}
          <div className="flex items-center gap-2.5">
            <div className={cn('flex flex-col gap-2 items-center rounded-xl p-2.5',
              dark ? 'bg-dark-serverBg border border-dark-border' : 'bg-slate-200 border border-slate-300')}>
              {[0,1,2].map(i => <TowerUnit key={i} t={t} />)}
              <div className="flex flex-col items-center gap-1 mt-1">
                <T pc={midIns[0]} />
                <span className={cn('text-[7px] tracking-wide',
                  dark ? 'text-slate-600' : 'text-slate-400')}>Instr.</span>
              </div>
            </div>
            <ClusterBox t={t}>
              <Row arr={midR1} />
              <Row arr={midR2} />
            </ClusterBox>
          </div>
          {/* Bottom row */}
          <div className="flex gap-2.5">
            <ClusterBox t={t} horizontal gap={6}>{botL.map((pc,i)=><T key={i} pc={pc}/>)}</ClusterBox>
            <ClusterBox t={t} horizontal gap={6}>{botR.map((pc,i)=><T key={i} pc={pc}/>)}</ClusterBox>
          </div>
        </div>

        {/* Right: table + door */}
        <div className="flex flex-col items-center justify-center gap-4 pl-2 flex-1" style={{ minHeight: 320 }}>
          <div className={cn(
            'w-14 h-14 rounded-lg flex flex-col items-center justify-center text-[9px] gap-0.5',
            dark ? 'bg-dark-serverBg border border-dark-border text-slate-500'
                 : 'bg-slate-200 border border-slate-300 text-slate-400'
          )}>
            <span>📋</span><span>Table</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className={cn('w-[7px] h-12 rounded-sm opacity-35',
              dark ? 'bg-slate-400' : 'bg-slate-400')} />
            <span className={cn('text-[8px] tracking-wide',
              dark ? 'text-slate-600' : 'text-slate-400')}>Door</span>
          </div>
        </div>
      </div>

      {/* Bottom exits */}
      <div className="flex justify-between mt-2.5" style={{ paddingLeft: 76, paddingRight: 56 }}>
        {[0,1].map(i => (
          <div key={i} className={cn('h-1 w-7 rounded-sm opacity-25',
            dark ? 'bg-slate-400' : 'bg-slate-400')} />
        ))}
      </div>
    </div>
  )
}

// ─── Generic grid floor plan ──────────────────────────────────────────────────

export function FloorPlanGeneric({ labName: _labName, pcs, selectedPC, statusFilter, onSelect, rows, cols }: FloorProps & { rows: number; cols: number }) {
  const { dark } = useThemeStore()
  const accent = dark ? '#5b7fff' : '#3a5cf5'
  const dim = (pc: PC) => statusFilter !== 'all' && pc.status !== statusFilter

  return (
    <div className={cn(
      'rounded-2xl border p-6 inline-block',
      dark ? 'bg-dark-mapBg border-dark-border' : 'bg-slate-100 border-slate-200'
    )}>
      {/* Instructor desk */}
      <div className="flex justify-center mb-5">
        <div className={cn(
          'px-7 py-1.5 rounded-lg text-[11px] border-dashed border-2',
          dark ? 'bg-dark-surfaceAlt border-dark-border text-slate-500'
               : 'bg-white border-slate-300 text-slate-400'
        )}>
          ▲  Instructor's Station
        </div>
      </div>

      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex gap-1.5 justify-center mb-2 items-center">
          <span className={cn('text-[9px] w-5 text-right flex-shrink-0 font-mono',
            dark ? 'text-slate-600' : 'text-slate-400')} style={{ lineHeight: '38px' }}>
            R{row + 1}
          </span>
          {Array.from({ length: cols }, (_, col) => {
            const pc = pcs[row * cols + col]
            if (!pc) return <div key={col} style={{ width: 44, height: 38 }} />
            return (
              <PCTile key={col} pc={pc}
                isSelected={selectedPC?.id === pc.id}
                dimmed={dim(pc)} onSelect={onSelect} accent={accent} />
            )
          })}
        </div>
      ))}

      <div className="flex justify-end mt-3">
        <div className={cn(
          'px-5 py-1.5 rounded-lg text-[11px] border-dashed border-2',
          dark ? 'bg-dark-surfaceAlt border-dark-border text-slate-500'
               : 'bg-white border-slate-300 text-slate-400'
        )}>
          Exit →
        </div>
      </div>
    </div>
  )
}
