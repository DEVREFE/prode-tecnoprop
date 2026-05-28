'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatMatchDate, formatNumber, getInitials, getAvatarColor } from '@/lib/utils'
import { Users, Zap, Target, Download, Search, CheckCircle, Lock, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'matches',  label: 'Partidos',       icon: Zap },
  { id: 'users',    label: 'Usuarios',        icon: Users },
  { id: 'scoring',  label: 'Cargar Puntos',   icon: Target },
]

interface AdminClientProps {
  matches: any[]
  users: any[]
  stats: { totalActive: number; totalPending: number; totalPredictions: number }
}

export default function AdminClient({ matches, users, stats }: AdminClientProps) {
  const [tab, setTab] = useState('matches')
  const [search, setSearch] = useState('')

  const filteredUsers = users.filter(u =>
    !search || `${u.nombre} ${u.apellido} ${u.ciudad}`.toLowerCase().includes(search.toLowerCase())
  )

  const exportCSV = () => {
    const header = 'Posición,Nombre,Apellido,Ciudad,Instagram,Puntos,Exactos,Correctos'
    const rows = users.map(u =>
      `${u.position},"${u.nombre}","${u.apellido}","${u.ciudad ?? ''}","@${u.instagram_handle}",${u.total_points},${u.exact_results},${u.correct_results}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `ranking-prode-tecnoprop-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    toast.success('CSV exportado')
  }

  return (
    <main className="min-h-screen">
      <div className="section pt-4 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Panel Admin</h1>
            <p className="text-sm text-white/40">Gestión del Prode Digital Tecnoprop 2026</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
            🔐 Admin
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Usuarios activos',    value: formatNumber(stats.totalActive),      color: 'text-green-400' },
            { label: 'Sin verificar',        value: formatNumber(stats.totalPending),     color: 'text-yellow-400' },
            { label: 'Pronósticos totales',  value: formatNumber(stats.totalPredictions), color: 'text-celeste' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-white/25 uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                tab === t.id ? 'text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              )}
              style={tab === t.id ? { background: 'linear-gradient(135deg, #36A9E0, #1D70B7)' } : {}}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* ══ MATCHES TAB ══ */}
        {tab === 'matches' && (
          <div className="space-y-2">
            {matches.map(m => (
              <MatchAdminRow key={m.id} match={m} />
            ))}
          </div>
        )}

        {/* ══ USERS TAB ══ */}
        {tab === 'users' && (
          <div>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o ciudad..."
                  className="input-dark pl-8 text-sm"
                />
              </div>
              <button onClick={exportCSV} className="btn-ghost flex items-center gap-2 text-sm px-4">
                <Download size={14} />
                CSV
              </button>
            </div>
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <UserAdminRow key={u.id} user={u} />
              ))}
            </div>
            {filteredUsers.length === 0 && (
              <p className="text-center text-white/30 py-8">Sin resultados</p>
            )}
          </div>
        )}

        {/* ══ SCORING TAB ══ */}
        {tab === 'scoring' && (
          <ScoringPanel matches={matches.filter(m => m.status === 'finished' || m.status === 'live')} />
        )}

      </div>
    </main>
  )
}

// ─── Match admin row ──────────────────────────────────────────────────

function MatchAdminRow({ match }: { match: any }) {
  const [scoreHome, setScoreHome] = useState(match.score_home?.toString() ?? '')
  const [scoreAway, setScoreAway] = useState(match.score_away?.toString() ?? '')
  const [status, setStatus]       = useState(match.status)
  const [saving, setSaving]       = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const updates: any = { status }
    if (scoreHome !== '') updates.score_home = parseInt(scoreHome)
    if (scoreAway !== '') updates.score_away = parseInt(scoreAway)
    if (status === 'live' || status === 'finished') updates.is_locked = true

    const { error } = await (supabase.from('matches') as any)
      .update(updates)
      .eq('id', match.id)

    if (!error && status === 'finished' && scoreHome !== '' && scoreAway !== '') {
      // Disparar cálculo de puntos
      const { error: rpcErr } = await (supabase as any).rpc('score_match', { p_match_id: match.id })
      if (!rpcErr) toast.success(`Puntos calculados: ${match.team_home} ${scoreHome} - ${scoreAway} ${match.team_away}`)
      else toast.error('Error calculando puntos: ' + rpcErr.message)
    } else if (!error) {
      toast.success('Partido actualizado')
    } else {
      toast.error(error.message)
    }

    setSaving(false)
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Info partido */}
        <div className="flex-1 min-w-[160px]">
          <div className="text-xs text-white/30 mb-0.5">{match.group_name} · {formatMatchDate(match.match_date)}</div>
          <div className="text-sm font-bold">
            {match.flag_home} {match.team_home} vs {match.team_away} {match.flag_away}
          </div>
        </div>

        {/* Status selector */}
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="input-dark text-sm w-36 py-2"
        >
          <option value="scheduled">Programado</option>
          <option value="live">En vivo</option>
          <option value="finished">Finalizado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        {/* Score inputs */}
        <div className="flex items-center gap-2">
          <input type="number" min={0} max={30} value={scoreHome}
            onChange={e => setScoreHome(e.target.value)}
            className="score-input" placeholder="0" />
          <span className="text-white/30 font-bold">—</span>
          <input type="number" min={0} max={30} value={scoreAway}
            onChange={e => setScoreAway(e.target.value)}
            className="score-input" placeholder="0" />
        </div>

        {/* Guardar */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all',
            status === 'finished'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
              : 'btn-brand'
          )}
        >
          {saving ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />}
          {saving ? '...' : status === 'finished' ? 'Guardar y puntuar' : 'Guardar'}
        </button>

        {/* Lock indicator */}
        {match.is_locked && (
          <Lock size={13} className="text-red-400/60" />
        )}
      </div>
    </div>
  )
}

// ─── User admin row ───────────────────────────────────────────────────

function UserAdminRow({ user }: { user: any }) {
  const [suspended, setSuspended] = useState(false)

  const handleSuspend = async () => {
    const supabase = createClient()
    await (supabase.from('users') as any).update({ status: 'suspended' }).eq('id', user.id)
    setSuspended(true)
    toast.success('Usuario suspendido')
  }

  return (
    <div className={cn('glass-card p-3 flex items-center gap-3', suspended && 'opacity-40')}>
      <span className="text-xs font-extrabold font-mono text-white/25 min-w-[28px] text-center">
        #{user.position}
      </span>
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gradient-to-br',
        getAvatarColor(user.nombre)
      )}>
        {getInitials(user.nombre, user.apellido)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{user.nombre} {user.apellido}</div>
        <div className="flex items-center gap-2 text-[11px] text-white/25">
          <span>@{user.instagram_handle}</span>
          {user.ciudad && <span>· {user.ciudad}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-base font-extrabold font-mono text-celeste">{user.total_points}</div>
        <div className="text-[9px] text-white/20">
          {user.exact_results}🎯 {user.correct_results}✅
        </div>
      </div>
      {!suspended && (
        <button
          onClick={handleSuspend}
          className="text-xs text-red-400/50 hover:text-red-400 transition-colors px-2 py-1 rounded flex-shrink-0"
        >
          Suspender
        </button>
      )}
    </div>
  )
}

// ─── Scoring panel ────────────────────────────────────────────────────

function ScoringPanel({ matches }: { matches: any[] }) {
  const [scoring, setScoring] = useState<string | null>(null)

  const handleScore = async (matchId: string, matchLabel: string) => {
    setScoring(matchId)
    const supabase = createClient()
    const { data, error } = await (supabase as any).rpc('score_match', { p_match_id: matchId })
    setScoring(null)
    if (error) { toast.error('Error: ' + error.message); return }
    toast.success(`${matchLabel} — ${data} pronósticos puntuados`)
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-white/40">No hay partidos finalizados para puntuar</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="glass-card p-4 bg-yellow-500/[0.04] border-yellow-500/15 mb-2">
        <p className="text-sm text-yellow-400/80">
          ⚠️ El botón "Calcular puntos" solo funciona en partidos con resultado cargado y estado "Finalizado".
          Se puede ejecutar múltiples veces sin problema — solo puntúa predicciones que tengan <code>points_earned = NULL</code>.
        </p>
      </div>
      {matches.map(m => (
        <div key={m.id} className="glass-card p-4 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-white/30">{m.group_name} · {formatMatchDate(m.match_date)}</div>
            <div className="text-sm font-bold mt-0.5">
              {m.flag_home} {m.team_home} {m.score_home ?? '?'} — {m.score_away ?? '?'} {m.team_away} {m.flag_away}
            </div>
          </div>
          <div className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-lg',
            m.status === 'finished' ? 'bg-green-500/15 text-green-400' :
            m.status === 'live'     ? 'bg-yellow-500/15 text-yellow-400' :
            'bg-white/5 text-white/30'
          )}>
            {m.status === 'finished' ? 'Finalizado' : m.status === 'live' ? 'En vivo' : 'Programado'}
          </div>
          {m.status === 'finished' && m.score_home !== null && (
            <button
              onClick={() => handleScore(m.id, `${m.team_home} vs ${m.team_away}`)}
              disabled={scoring === m.id}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25 transition-all disabled:opacity-40"
            >
              {scoring === m.id
                ? <RefreshCw size={12} className="animate-spin" />
                : <Zap size={12} />}
              {scoring === m.id ? 'Calculando...' : 'Calcular puntos'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
