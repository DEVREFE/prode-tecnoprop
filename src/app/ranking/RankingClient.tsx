'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn, getInitials, getAvatarColor, formatNumber } from '@/lib/utils'
import { Trophy, TrendingUp, Users, MapPin } from 'lucide-react'
import type { RankingEntry } from '@/types'

const TABS = [
  { id: 'general',  label: 'General',       icon: Trophy },
  { id: 'tucuman',  label: 'Tucumán',        icon: MapPin },
  { id: 'weekly',   label: 'Esta semana',    icon: TrendingUp },
]

interface RankingClientProps {
  initialRanking: RankingEntry[]
  myEntry: RankingEntry | null
  totalUsers: number
  userId?: string
}

export default function RankingClient({ initialRanking, myEntry, totalUsers, userId }: RankingClientProps) {
  const [ranking, setRanking] = useState<RankingEntry[]>(initialRanking)
  const [tab, setTab] = useState('general')
  const [liveIndicator, setLiveIndicator] = useState(false)

  // Supabase Realtime — escuchar cambios en users.total_points
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('ranking-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: 'status=eq.active' },
        async () => {
          // Re-fetch ranking cuando cambian puntos
          const { data } = await supabase
            .from('ranking_general')
            .select('*')
            .limit(100)
          if (data) {
            setRanking(data as RankingEntry[])
            setLiveIndicator(true)
            setTimeout(() => setLiveIndicator(false), 2000)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Filtro por tab
  const filtered = ranking.filter(entry => {
    if (tab === 'tucuman') {
      return entry.ciudad?.toLowerCase().includes('tucum') ||
             entry.ciudad?.toLowerCase().includes('yerba')
    }
    return true
  })

  return (
    <main className="min-h-screen">
      <div className="section pt-4 pb-16">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">Ranking</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/40">{formatNumber(totalUsers)} participantes</span>
              {liveIndicator && (
                <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Actualizado
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/25 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Tiempo real
          </div>
        </div>

        {/* Mi posición (sticky si está logueado) */}
        {myEntry && (
          <div className="glass-card p-4 mb-6 top-accent border-celeste/20">
            <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">
              Tu posición
            </div>
            <RankingRow entry={myEntry} isMe />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0',
                tab === t.id
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              )}
              style={tab === t.id ? { background: 'linear-gradient(135deg, #36A9E0, #1D70B7)' } : {}}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Podio top 3 */}
        {filtered.length >= 3 && (
          <Podium top3={filtered.slice(0, 3)} />
        )}

        {/* Lista completa */}
        <div className="space-y-2 mt-4">
          {filtered.map((entry, i) => (
            <RankingRow
              key={entry.id}
              entry={entry}
              isMe={entry.id === userId}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-white/40">No hay participantes en esta categoría todavía</p>
          </div>
        )}

      </div>
    </main>
  )
}

// ─── Podio visual ─────────────────────────────────────────────────────

function Podium({ top3 }: { top3: RankingEntry[] }) {
  const [second, first, third] = [top3[1], top3[0], top3[2]]
  const order = [second, first, third]
  const heights = ['h-24', 'h-32', 'h-20']
  const crowns  = ['🥈', '🥇', '🥉']
  const colors  = [
    'from-zinc-500/20 to-zinc-600/10 border-zinc-500/25',
    'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    'from-amber-700/20 to-amber-800/10 border-amber-700/25',
  ]

  return (
    <div className="flex items-end justify-center gap-3 mb-6 px-4">
      {order.map((entry, i) => entry && (
        <div key={entry.id} className="flex flex-col items-center gap-2 flex-1 max-w-[130px]">
          <div className="text-xl">{crowns[i]}</div>
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-extrabold bg-gradient-to-br flex-shrink-0',
            getAvatarColor(entry.nombre)
          )}>
            {getInitials(entry.nombre, entry.apellido)}
          </div>
          <div className="text-xs font-bold text-center leading-tight truncate w-full text-center">
            {entry.nombre}
          </div>
          <div className={cn(
            'w-full rounded-t-xl border flex flex-col items-center justify-end pb-3 bg-gradient-to-t',
            heights[i], colors[i]
          )}>
            <span className="text-lg font-extrabold font-mono text-celeste">{entry.total_points}</span>
            <span className="text-[9px] text-white/30 uppercase tracking-wide">pts</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Fila del ranking ─────────────────────────────────────────────────

function RankingRow({ entry, isMe = false }: { entry: RankingEntry; isMe?: boolean }) {
  const pos = entry.position
  const posColor =
    pos === 1 ? 'text-gold' :
    pos === 2 ? 'text-zinc-400' :
    pos === 3 ? 'text-amber-700' :
    'text-white/20'

  const rowBg =
    pos === 1 ? 'border-yellow-500/15 bg-yellow-500/[0.03]' :
    isMe ? 'border-celeste/25 bg-celeste/[0.04]' :
    ''

  return (
    <div className={cn(
      'glass-card p-3 flex items-center gap-3 transition-all hover:translate-x-0.5',
      rowBg
    )}>
      {/* Posición */}
      <span className={cn('text-sm font-extrabold font-mono min-w-[28px] text-center', posColor)}>
        #{pos}
      </span>

      {/* Avatar */}
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gradient-to-br',
        getAvatarColor(entry.nombre)
      )}>
        {getInitials(entry.nombre, entry.apellido)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">
            {entry.nombre} {entry.apellido}
          </span>
          {isMe && (
            <span className="text-[10px] bg-celeste/15 text-celeste px-1.5 py-0.5 rounded font-bold flex-shrink-0">
              Vos
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {entry.ciudad && (
            <span className="text-[11px] text-white/25">📍 {entry.ciudad}</span>
          )}
          <span className="text-[11px] text-white/20">
            {entry.exact_results}🎯 {entry.correct_results}✅ {entry.total_predicted} pronósticos
          </span>
        </div>
      </div>

      {/* Puntos */}
      <div className="text-right flex-shrink-0">
        <div className={cn(
          'text-lg font-extrabold font-mono',
          pos <= 3 ? posColor : 'text-celeste'
        )}>
          {entry.total_points}
        </div>
        <div className="text-[9px] text-white/20 uppercase tracking-wide">pts</div>
      </div>
    </div>
  )
}
