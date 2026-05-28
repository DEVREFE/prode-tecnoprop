'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Trophy, Star, Target, TrendingUp, Users, Share2,
  Copy, CheckCircle, Clock, Zap, Award, ChevronRight
} from 'lucide-react'
import { cn, getInitials, getAvatarColor, formatMatchDate, formatNumber } from '@/lib/utils'
import { POINTS_CONFIG } from '@/types'
import toast from 'react-hot-toast'
import type { User, Prediction, PointsLog, Referral } from '@/types'

interface DashboardClientProps {
  profile: User
  predictions: (Prediction & { matches: any })[]
  rankPosition: number | null
  pointsLog: PointsLog[]
  myLeagues: any[]
  specialPred: any
  referrals: any[]
}

const TABS = [
  { id: 'overview',   label: 'Resumen',    icon: TrendingUp },
  { id: 'predicciones', label: 'Mis Pronósticos', icon: Target },
  { id: 'ligas',      label: 'Mis Ligas',  icon: Users },
  { id: 'historial',  label: 'Historial',  icon: Clock },
  { id: 'referidos',  label: 'Referidos',  icon: Share2 },
]

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  exact_result:        { label: '🎯 Resultado exacto',  color: 'text-green-400' },
  correct_winner:      { label: '✅ Ganador correcto',   color: 'text-celeste'   },
  correct_draw:        { label: '🤝 Empate correcto',    color: 'text-celeste'   },
  champion_bonus:      { label: '🏆 Campeón',            color: 'text-gold'      },
  runner_up_bonus:     { label: '🥈 Subcampeón',         color: 'text-gold'      },
  top_scorer_bonus:    { label: '⭐ Goleador',            color: 'text-gold'      },
  final_exact_bonus:   { label: '⚡ Final exacta',        color: 'text-gold'      },
  referral_bonus:      { label: '👥 Referido',            color: 'text-purple-400'},
}

export default function DashboardClient({
  profile, predictions, rankPosition, pointsLog, myLeagues, specialPred, referrals
}: DashboardClientProps) {
  const [tab, setTab] = useState('overview')
  const [copied, setCopied] = useState(false)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prode.tecnoprop.ar'
  const refLink = `${siteUrl}?ref=${profile.referral_code}`

  const copyRefLink = async () => {
    await navigator.clipboard.writeText(refLink)
    setCopied(true)
    toast.success('¡Link copiado!')
    setTimeout(() => setCopied(false), 3000)
  }

  // Stats calculados
  const finished   = predictions.filter(p => p.matches?.status === 'finished')
  const exact      = finished.filter(p => p.points_earned === 3).length
  const correct    = finished.filter(p => (p.points_earned ?? 0) > 0).length
  const wrong      = finished.filter(p => p.points_earned === 0).length
  const pending    = predictions.filter(p => p.matches?.status !== 'finished').length
  const accuracy   = finished.length > 0 ? Math.round((correct / finished.length) * 100) : 0

  return (
    <main className="min-h-screen">
      <div className="section pt-4 pb-16">

        {/* ── USER CARD ── */}
        <div className="glass-card p-5 mb-6 top-accent">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold flex-shrink-0',
              `bg-gradient-to-br ${getAvatarColor(profile.nombre)}`
            )}>
              {getInitials(profile.nombre, profile.apellido)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight truncate">
                {profile.nombre} {profile.apellido}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {profile.ciudad && (
                  <span className="text-xs text-white/40">📍 {profile.ciudad}</span>
                )}
                <span className="text-xs text-white/40">@{profile.instagram_handle}</span>
              </div>
              {rankPosition && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold/10 border border-gold/20 text-gold text-xs font-bold">
                  <Trophy size={11} />
                  Puesto #{rankPosition} del ranking general
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-3xl font-extrabold font-mono text-celeste tracking-tight">
                {profile.total_points}
              </div>
              <div className="text-[10px] font-bold tracking-widest text-white/25 uppercase">
                puntos
              </div>
            </div>
          </div>

          {/* Progress bar pronósticos */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span>Pronósticos completados</span>
              <span className="text-white font-semibold">{predictions.length}/48</span>
            </div>
            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.round((predictions.length / 48) * 100)}%`,
                  background: 'linear-gradient(90deg, #36A9E0, #1D70B7)'
                }}
              />
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0',
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

        {/* ══════════════════════ OVERVIEW ══════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Puntos',       value: profile.total_points, color: 'text-celeste',    icon: Zap    },
                { label: 'Exactos',      value: exact,                color: 'text-green-400',  icon: Target },
                { label: 'Correctos',    value: correct,              color: 'text-celeste',    icon: CheckCircle },
                { label: 'Precisión',    value: `${accuracy}%`,       color: 'text-gold',       icon: TrendingUp },
              ].map(s => (
                <div key={s.label} className="glass-card p-4 text-center">
                  <s.icon size={16} className={`mx-auto mb-2 ${s.color} opacity-60`} />
                  <div className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-white/25 uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Predicciones especiales */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold tracking-tight">Predicciones Especiales</h2>
                <span className="text-xs text-white/30">Bonuses del torneo</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Campeón del Mundial',       key: 'champion_team',    pts: '+10', value: specialPred?.champion_team },
                  { label: 'Subcampeón',                key: 'runner_up_team',   pts: '+5',  value: specialPred?.runner_up_team },
                  { label: 'Goleador del torneo',       key: 'top_scorer',       pts: '+5',  value: specialPred?.top_scorer },
                  { label: 'Marcador exacto de la Final', key: 'final_score',    pts: '+5',  value: specialPred?.final_score_home != null ? `${specialPred.final_score_home} - ${specialPred.final_score_away}` : null },
                ].map(item => (
                  <div key={item.key} className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border',
                    item.value
                      ? 'bg-celeste/[0.05] border-celeste/15'
                      : 'bg-white/[0.02] border-white/[0.05]'
                  )}>
                    <div className="flex-1">
                      <div className="text-xs text-white/40 mb-0.5">{item.label}</div>
                      <div className={cn('text-sm font-bold', item.value ? 'text-white' : 'text-white/20')}>
                        {item.value ?? 'Sin completar'}
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-gold">{item.pts}</span>
                  </div>
                ))}
              </div>
              {!specialPred && (
                <Link href="/partidos?tab=especiales" className="btn-brand w-full text-center text-sm py-2.5 mt-4 block">
                  Completar predicciones especiales →
                </Link>
              )}
            </div>

            {/* Últimos puntos */}
            {pointsLog.length > 0 && (
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold">Últimos puntos</h2>
                  <button onClick={() => setTab('historial')} className="text-xs text-celeste hover:opacity-75">
                    Ver todos →
                  </button>
                </div>
                <div className="space-y-2">
                  {pointsLog.slice(0, 5).map(log => {
                    const info = REASON_LABELS[log.reason] ?? { label: log.reason, color: 'text-white' }
                    return (
                      <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                        <div>
                          <span className={`text-sm font-medium ${info.color}`}>{info.label}</span>
                          {log.description && (
                            <div className="text-xs text-white/30 mt-0.5">{log.description}</div>
                          )}
                        </div>
                        <span className={`text-sm font-extrabold font-mono ${info.color}`}>
                          +{log.points}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CTA si hay pronósticos pendientes */}
            {pending > 0 && (
              <div className="glass-card p-5 border-celeste/20 bg-celeste/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-celeste/15 flex items-center justify-center flex-shrink-0">
                    <Target size={18} className="text-celeste" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">Tenés {pending} partido{pending > 1 ? 's' : ''} sin pronosticar</div>
                    <div className="text-xs text-white/40">Cargá tus pronósticos antes que empiece el partido</div>
                  </div>
                  <Link href="/partidos" className="btn-brand text-xs py-2 px-4 flex-shrink-0">
                    Pronosticar
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════ MIS PRONÓSTICOS ══════════════════════ */}
        {tab === 'predicciones' && (
          <div className="space-y-3">
            {predictions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">⚽</div>
                <p className="text-white/40 mb-4">Todavía no cargaste ningún pronóstico</p>
                <Link href="/partidos" className="btn-brand px-6 py-3 text-sm">
                  Ver partidos →
                </Link>
              </div>
            ) : (
              predictions.map(pred => {
                const match = pred.matches
                const isFinished = match?.status === 'finished'
                const pts = pred.points_earned

                return (
                  <div
                    key={pred.id}
                    className={cn(
                      'glass-card p-4 flex items-center gap-3',
                      pts === 3 && 'border-green-500/20 bg-green-500/[0.03]',
                      pts === 1 && 'border-celeste/15 bg-celeste/[0.02]',
                      pts === 0 && isFinished && 'border-red-500/15 bg-red-500/[0.02]'
                    )}
                  >
                    {/* Equipos */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/30 mb-1">
                        {match?.group_name ?? match?.phase} · {match?.stadium}
                      </div>
                      <div className="text-sm font-bold">
                        {match?.flag_home} {match?.team_home}
                        <span className="text-white/25 mx-2">vs</span>
                        {match?.team_away} {match?.flag_away}
                      </div>
                      <div className="text-xs text-white/30 mt-0.5">
                        {match?.match_date && formatMatchDate(match.match_date)}
                      </div>
                    </div>

                    {/* Resultado oficial (si terminó) */}
                    {isFinished && (
                      <div className="text-center">
                        <div className="text-[10px] text-white/25 uppercase tracking-wider mb-0.5">Real</div>
                        <div className="text-sm font-extrabold font-mono text-white/60">
                          {match.score_home} — {match.score_away}
                        </div>
                      </div>
                    )}

                    {/* Mi pronóstico */}
                    <div className="text-center ml-2">
                      <div className="text-[10px] text-white/25 uppercase tracking-wider mb-0.5">Pronóstico</div>
                      <div className="text-sm font-extrabold font-mono text-white">
                        {pred.pred_home} — {pred.pred_away}
                      </div>
                    </div>

                    {/* Puntos */}
                    <div className="text-right ml-2 flex-shrink-0">
                      {isFinished ? (
                        <>
                          <div className={cn(
                            'text-lg font-extrabold font-mono',
                            pts === 3 ? 'text-green-400' : pts === 1 ? 'text-celeste' : 'text-white/20'
                          )}>
                            {pts !== null ? `+${pts}` : '—'}
                          </div>
                          <div className="text-[9px] text-white/20 uppercase tracking-wide">pts</div>
                        </>
                      ) : (
                        <span className="text-xs text-white/20 font-medium">Pendiente</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ══════════════════════ MIS LIGAS ══════════════════════ */}
        {tab === 'ligas' && (
          <div className="space-y-4">
            <Link href="/ligas/nueva" className="btn-brand w-full py-3 text-sm text-center block">
              + Crear nueva liga
            </Link>

            {myLeagues.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🏆</div>
                <p className="text-white/40 mb-2">Todavía no sos parte de ninguna liga</p>
                <p className="text-xs text-white/25">Creá una o pedile el código a un amigo</p>
              </div>
            ) : (
              myLeagues.map((member: any) => {
                const league = member.leagues
                return (
                  <Link
                    key={member.id}
                    href={`/ligas/${league?.invite_code}`}
                    className="glass-card p-4 flex items-center gap-3 hover:border-celeste/25 hover:translate-x-1 transition-all block"
                  >
                    <div className="w-11 h-11 rounded-xl bg-celeste/10 flex items-center justify-center text-xl flex-shrink-0">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{league?.name}</div>
                      <div className="text-xs text-white/30">
                        Código: <span className="font-mono text-celeste">{league?.invite_code}</span>
                        {league?.description && ` · ${league.description}`}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-white/20 flex-shrink-0" />
                  </Link>
                )
              })
            )}

            {/* Unirse a liga */}
            <JoinLeagueInput />
          </div>
        )}

        {/* ══════════════════════ HISTORIAL ══════════════════════ */}
        {tab === 'historial' && (
          <div>
            {pointsLog.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-white/40">No hay puntos registrados todavía</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pointsLog.map(log => {
                  const info = REASON_LABELS[log.reason] ?? { label: log.reason, color: 'text-white' }
                  return (
                    <div key={log.id} className="glass-card p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${info.color}`}>{info.label}</div>
                        {log.description && (
                          <div className="text-xs text-white/30 mt-0.5 truncate">{log.description}</div>
                        )}
                        <div className="text-xs text-white/20 mt-0.5">
                          {new Date(log.created_at).toLocaleString('es-AR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </div>
                      </div>
                      <span className={`text-xl font-extrabold font-mono flex-shrink-0 ${info.color}`}>
                        +{log.points}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════ REFERIDOS ══════════════════════ */}
        {tab === 'referidos' && (
          <div className="space-y-4">
            {/* Stats referidos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-extrabold text-celeste font-mono">{referrals.length}</div>
                <div className="text-xs text-white/30 uppercase tracking-widest mt-1">Amigos invitados</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-extrabold text-gold font-mono">
                  {referrals.filter((r: any) => r.points_awarded).length}
                </div>
                <div className="text-xs text-white/30 uppercase tracking-widest mt-1">Puntos de referidos</div>
              </div>
            </div>

            {/* Link de referido */}
            <div className="glass-card p-5">
              <h2 className="text-sm font-bold mb-1">Tu link de invitación</h2>
              <p className="text-xs text-white/40 mb-4">
                Cada amigo que se registre con tu link te da +{POINTS_CONFIG.REFERRAL_BONUS} punto
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-mono text-celeste truncate">
                  {refLink}
                </div>
                <button
                  onClick={copyRefLink}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold flex-shrink-0 transition-all',
                    copied
                      ? 'bg-green-500/20 text-green-400 border border-green-500/25'
                      : 'btn-brand'
                  )}
                >
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              {/* WhatsApp share */}
              <a
                href={`https://wa.me/?text=Sumate al Prode del Mundial 2026 de Tecnoprop 🌎⚽ Registrate gratis acá: ${encodeURIComponent(refLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost w-full text-center text-sm py-2.5 mt-3 block"
              >
                📱 Compartir por WhatsApp
              </a>
            </div>

            {/* Lista de referidos */}
            {referrals.length > 0 && (
              <div className="glass-card p-5">
                <h2 className="text-sm font-bold mb-4">Amigos invitados</h2>
                <div className="space-y-3">
                  {referrals.map((ref: any) => (
                    <div key={ref.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br ${getAvatarColor(ref.users?.nombre ?? 'A')}`}>
                        {getInitials(ref.users?.nombre ?? 'A', ref.users?.apellido ?? 'B')}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">
                          {ref.users?.nombre} {ref.users?.apellido}
                        </div>
                        <div className="text-xs text-white/30">
                          {ref.users?.created_at && new Date(ref.users.created_at).toLocaleDateString('es-AR')}
                        </div>
                      </div>
                      {ref.points_awarded && (
                        <span className="text-xs font-bold text-gold">+1 pt ✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}

// Mini componente para unirse a liga
function JoinLeagueInput() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async () => {
    if (!code.trim()) return
    setLoading(true)
    // TODO: llamar API route /api/ligas/join
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    toast.success('¡Te uniste a la liga!')
    setCode('')
  }

  return (
    <div className="glass-card p-4 border-dashed">
      <div className="text-sm font-bold mb-3">¿Tenés un código de liga?</div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          className="input-dark flex-1 font-mono text-center tracking-widest uppercase text-sm"
        />
        <button
          onClick={handleJoin}
          disabled={loading || !code}
          className="btn-brand px-5 text-sm disabled:opacity-40"
        >
          {loading ? '...' : 'Unirse'}
        </button>
      </div>
    </div>
  )
}
