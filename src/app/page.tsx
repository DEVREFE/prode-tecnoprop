import { Suspense } from 'react'
import Link from 'next/link'
import { Trophy, Users, Star, Zap } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Countdown from '@/components/prode/Countdown'
import MatchCard from '@/components/prode/MatchCard'
import { createClient } from '@/lib/supabase/server'
import type { Match, RankingEntry } from '@/types'
import { getInitials, getAvatarColor, formatNumber } from '@/lib/utils'

// Datos que se cargan en el servidor
async function getHomeData() {
  const supabase = await createClient()

  const [matchesRes, rankingRes, usersCountRes] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .in('status', ['scheduled', 'live'])
      .gte('match_date', new Date().toISOString())
      .order('match_date', { ascending: true })
      .limit(4),
    supabase
      .from('ranking_general')
      .select('*')
      .limit(5),
    supabase
      .from('ranking_general')
      .select('id', { count: 'exact', head: true }),
  ])

  return {
    matches: (matchesRes.data ?? []) as Match[],
    ranking: (rankingRes.data ?? []) as RankingEntry[],
    usersCount: usersCountRes.count ?? 0,
  }
}

const PRIZES = [
  { place: '1° Lugar', icon: '🥇', value: '+ de $300.000', desc: 'en premios + descuento para vender su propiedad', featured: true },
  { place: '2° Lugar', icon: '🥈', value: '+ de $250.000',  desc: 'en premios + descuento para vender su propiedad', featured: false },
  { place: '3° Lugar', icon: '🥉', value: 'Más de $150.000',  desc: 'en premios + descuento para vender su propiedad', featured: false },
  { place: 'Sorpresa', icon: '🎁', value: '???',       desc: 'Muchos premios semanales y sorpresas',        featured: false },
]

const POINTS = [
  { icon: '🎯', desc: 'Resultado exacto',    pts: '+3',  color: 'text-green-400' },
  { icon: '✅', desc: 'Ganador correcto',     pts: '+1',  color: 'text-celeste' },
  { icon: '🤝', desc: 'Empate correcto',      pts: '+1',  color: 'text-celeste' },
  { icon: '🏆', desc: 'Campeón correcto',     pts: '+10', color: 'text-gold' },
  { icon: '⭐', desc: 'Goleador correcto',    pts: '+5',  color: 'text-gold' },
  { icon: '⚡', desc: 'Final exacta',          pts: '+5',  color: 'text-gold' },
]

export default async function HomePage() {
  const { matches, ranking, usersCount } = await getHomeData()

  // Obtener usuario para el Navbar
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  let userProfile = null
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()
    userProfile = data
  }

  return (
    <>
      <Navbar initialUser={userProfile} />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="section pt-8 pb-16 text-center">

          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-celeste/25 bg-celeste/8 text-celeste text-xs font-bold tracking-widest uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-celeste animate-pulse" />
              Mundial 2026 · USA, Canadá &amp; México
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.02] mb-5 animate-fade-up-1">
            El Prode Digital
            <br />
            del{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #36A9E0, #7dd3fc)' }}>
              Mundial 2026
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-white/50 font-light mb-10 animate-fade-up-2">
            No mires el Mundial. Jugalo.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap animate-fade-up-3">
            <Link href="/register" className="btn-brand px-8 py-4 text-base">
              Participar Gratis →
            </Link>
            <Link href="/partidos" className="btn-ghost px-8 py-4 text-base">
              Ver Partidos
            </Link>
          </div>
        </div>
      </section>

      {/* ── COUNTDOWN ── */}
      <section className="section -mt-4 pb-12">
        <div className="text-center mb-4">
          <span className="text-xs font-bold tracking-[3px] text-white/25 uppercase">
            Comienza en
          </span>
        </div>
        <Suspense fallback={<div className="h-20 animate-pulse" />}>
          <Countdown />
        </Suspense>
      </section>

      {/* ── STATS ── */}
      <section className="section pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users,  value: formatNumber(usersCount || 1247), label: 'Participantes', color: 'text-celeste' },
            { icon: Trophy, value: '104',   label: 'Partidos',    color: 'text-gold' },
            { icon: Star,   value: '+10',    label: 'Premios',     color: 'text-green-400' },
            { icon: Zap,    value: '100%', label: 'Gratis',      color: 'text-celeste' },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-4 text-center group">
              <stat.icon size={18} className={`mx-auto mb-2 ${stat.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
              <div className={`text-2xl font-extrabold tracking-tight ${stat.color}`}>{stat.value}</div>
              <div className="text-[11px] font-semibold tracking-widest text-white/30 uppercase mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── NEXT MATCHES ── */}
      {matches.length > 0 && (
        <section className="section border-t border-white/[0.05]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Próximos Partidos</h2>
              <p className="text-sm text-white/40 mt-0.5">Cargá tus pronósticos antes del inicio</p>
            </div>
            <Link href="/partidos" className="text-sm font-semibold text-celeste hover:opacity-75 transition-opacity">
              Ver todos →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* ── RANKING ── */}
      {ranking.length > 0 && (
        <section className="section border-t border-white/[0.05]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Top Ranking</h2>
              <p className="text-sm text-white/40 mt-0.5">Actualización en tiempo real</p>
            </div>
            <Link href="/ranking" className="text-sm font-semibold text-celeste hover:opacity-75 transition-opacity">
              Ranking completo →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {ranking.map((entry, i) => (
              <div
                key={entry.id}
                className={`glass-card p-3 flex items-center gap-3 hover:translate-x-1 transition-transform cursor-default ${
                  i === 0 ? 'border-yellow-500/20 bg-yellow-500/[0.03]' : ''
                }`}
              >
                <span className={`text-sm font-extrabold font-mono min-w-[28px] text-center ${
                  i === 0 ? 'text-gold' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-amber-700' : 'text-white/25'
                }`}>
                  #{entry.position}
                </span>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gradient-to-br ${getAvatarColor(entry.nombre)}`}>
                  {getInitials(entry.nombre, entry.apellido)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{entry.nombre} {entry.apellido}</div>
                  {entry.ciudad && <div className="text-xs text-white/30 truncate">📍 {entry.ciudad}</div>}
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold font-mono text-celeste">{entry.total_points}</div>
                  <div className="text-[10px] text-white/25 uppercase tracking-wide">pts</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PRIZES ── */}
      <section className="section border-t border-white/[0.05]">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight">Premios</h2>
          <p className="text-sm text-white/40 mt-0.5">Para los mejores jugadores del Mundial</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRIZES.map(prize => (
            <div
              key={prize.place}
              className={`glass-card p-5 text-center ${prize.featured ? 'border-yellow-500/25 bg-yellow-500/[0.04]' : ''}`}
            >
              <div className="text-4xl mb-3">{prize.icon}</div>
              <div className="text-xs font-bold tracking-widest text-white/30 uppercase mb-1">{prize.place}</div>
              <div className={`text-xl font-extrabold ${prize.featured ? 'text-gold' : 'text-white'}`}>
                {prize.value}
              </div>
              <div className="text-xs text-white/40 mt-1">{prize.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PUNTOS ── */}
      <section className="section border-t border-white/[0.05]">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight">Sistema de Puntos</h2>
          <p className="text-sm text-white/40 mt-0.5">Acumulá puntos por cada pronóstico correcto</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {POINTS.map(p => (
            <div key={p.desc} className="glass-card p-3 flex items-center gap-3">
              <span className="text-xl w-8 text-center flex-shrink-0">{p.icon}</span>
              <span className="text-sm text-white/60 flex-1">{p.desc}</span>
              <span className={`text-sm font-extrabold font-mono ${p.color}`}>{p.pts}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── REGISTER CTA ── */}
      <section className="section border-t border-white/[0.05]">
        <div className="glass-card p-8 sm:p-12 text-center top-accent">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Sumate al Prode 🌎
          </h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Registrate gratis y empezá a pronosticar el Mundial 2026 antes de que arranque
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register" className="btn-brand px-8 py-4 text-base">
              Participar Gratis →
            </Link>
          </div>
          <p className="text-xs text-white/25 mt-4">
            Requiere seguir a @tecnoprop.ok en Instagram
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.05] mt-8">
        <div className="section py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm font-semibold text-white/40">
            <span className="text-white">Tecnoprop</span> Prode 2026
          </div>
          <div className="flex gap-6 text-xs text-white/25">
            <Link href="/terminos" className="hover:text-white/50 transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-white/50 transition-colors">Privacidad</Link>
            <a href="https://tecnoprop.ar" className="hover:text-white/50 transition-colors" target="_blank" rel="noopener">tecnoprop.ar</a>
          </div>
          <div className="text-xs text-white/20">
            Pringles 1680 Of.13/14 · Yerba Buena
          </div>
        </div>
      </footer>
    </>
  )
}
