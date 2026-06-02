'use client'

import { useState, useMemo } from 'react'
import MatchCard from '@/components/prode/MatchCard'
import { PHASE_LABELS } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

const STATUS_TABS = [
  { id: 'all',       label: 'Todos' },
  { id: 'scheduled', label: 'Próximos' },
  { id: 'live',      label: '🔴 En Vivo' },
  { id: 'finished',  label: 'Jugados' },
  { id: 'especiales', label: '⭐ Especiales' },
]

interface PartidosClientProps {
  matches: any[]
  userId?: string
  specialPred: any
}

export default function PartidosClient({ matches, userId, specialPred }: PartidosClientProps) {
  const [statusTab, setStatusTab] = useState('all')
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [localPreds, setLocalPreds] = useState<Record<string, { pred_home: number; pred_away: number }>>({})

  // Fases únicas en el fixture
  const phases = useMemo(() => {
    const set = new Set(matches.map((m: any) => m.phase))
    return Array.from(set)
  }, [matches])

  // Filtro activo
  const filtered = useMemo(() => {
    let list = matches.filter((m: any) => {
      const statusOk = statusTab === 'all' || m.status === statusTab
      const phaseOk  = phaseFilter === 'all' || m.phase === phaseFilter
      return statusOk && phaseOk
    })

    // Si estamos en "Próximos", mostrar solo los 16 partidos más cercanos para no saturar
    if (statusTab === 'scheduled') {
      list = list.sort((a: any, b: any) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()).slice(0, 16)
    }

    return list
  }, [matches, statusTab, phaseFilter])

  // Contar live
  const liveCount = matches.filter((m: any) => m.status === 'live').length

  const handlePredictionSaved = (matchId: string, home: number, away: number) => {
    setLocalPreds(prev => ({ ...prev, [matchId]: { pred_home: home, pred_away: away } }))
  }

  return (
    <main className="min-h-screen">
      <div className="section pt-4 pb-16">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">Partidos</h1>
          <p className="text-sm text-white/40">Cargá tus pronósticos antes que empiece cada partido</p>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
          {STATUS_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setStatusTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0',
                statusTab === t.id
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]',
              )}
              style={statusTab === t.id ? { background: 'linear-gradient(135deg, #36A9E0, #1D70B7)' } : {}}
            >
              {t.label}
              {t.id === 'live' && liveCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-green-500 text-[9px] font-extrabold flex items-center justify-center">
                  {liveCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Phase filter (solo si no es especiales) */}
        {statusTab !== 'especiales' && phases.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-6 scrollbar-none">
            <button
              onClick={() => setPhaseFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
                phaseFilter === 'all'
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/60'
              )}
            >
              Todos
            </button>
            {phases.map((phase: string) => (
              <button
                key={phase}
                onClick={() => setPhaseFilter(phase)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
                  phaseFilter === phase
                    ? 'bg-white/10 text-white'
                    : 'text-white/30 hover:text-white/60'
                )}
              >
                {PHASE_LABELS[phase as keyof typeof PHASE_LABELS] ?? phase}
              </button>
            ))}
          </div>
        )}

        {/* ESPECIALES TAB */}
        {statusTab === 'especiales' ? (
          <SpecialPredictions userId={userId} specialPred={specialPred} />
        ) : (
          <>
            {/* Counter */}
            <div className="text-xs text-white/25 mb-4">
              {filtered.length} partido{filtered.length !== 1 ? 's' : ''}
              {!userId && (
                <span> · <a href="/register" className="text-celeste hover:underline">Registrate</a> para pronosticar</span>
              )}
            </div>

            {/* Grid de partidos */}
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">⚽</div>
                <p className="text-white/40">No hay partidos en esta categoría</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filtered.map((match: any) => (
                  <MatchCard
                    key={match.id}
                    match={{
                      ...match,
                      prediction: localPreds[match.id]
                        ? { ...match.prediction, ...localPreds[match.id] }
                        : match.prediction
                    }}
                    userId={userId}
                    onPredictionSaved={handlePredictionSaved}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

// ─── Predicciones especiales ───────────────────────────────────────────

interface SpecialPredictionsProps {
  userId?: string
  specialPred: any
}

function SpecialPredictions({ userId, specialPred }: SpecialPredictionsProps) {
  const [champ, setChamp]         = useState(specialPred?.champion_team ?? '')
  const [runner, setRunner]       = useState(specialPred?.runner_up_team ?? '')
  const [thirdPlace, setThirdPlace] = useState(specialPred?.third_place_team ?? '')
  const [scorer, setScorer]       = useState(specialPred?.top_scorer ?? '')
  const [bestPlayer, setBestPlayer] = useState(specialPred?.best_player ?? '')
  const [bestGoalkeeper, setBestGoalkeeper] = useState(specialPred?.best_goalkeeper ?? '')
  const [finalHome, setFinalHome] = useState(specialPred?.final_score_home?.toString() ?? '')
  const [finalAway, setFinalAway] = useState(specialPred?.final_score_away?.toString() ?? '')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(!!specialPred)

  const handleSave = async () => {
    if (!userId) { toast.error('Ingresá para guardar'); return }
    if (!champ)  { toast.error('Ingresá el campeón del mundial'); return }
    setSaving(true)
    try {
      const supabase = createClient()

      const payload = {
        user_id: userId,
        champion_team: champ,
        runner_up_team: runner || null,
        third_place_team: thirdPlace || null,
        top_scorer: scorer || null,
        best_player: bestPlayer || null,
        best_goalkeeper: bestGoalkeeper || null,
        final_score_home: finalHome !== '' ? parseInt(finalHome) : null,
        final_score_away: finalAway !== '' ? parseInt(finalAway) : null,
      }

      // Verificar si ya existe (evita upsert + RLS separadas)
      const { data: existing } = await supabase.from('special_predictions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      let error
      if (existing) {
        const res = await supabase.from('special_predictions')
          .update({
            champion_team: payload.champion_team,
            runner_up_team: payload.runner_up_team,
            third_place_team: payload.third_place_team,
            top_scorer: payload.top_scorer,
            best_player: payload.best_player,
            best_goalkeeper: payload.best_goalkeeper,
            final_score_home: payload.final_score_home,
            final_score_away: payload.final_score_away,
          })
          .eq('id', existing.id)
        error = res.error
      } else {
        const res = await supabase.from('special_predictions')
          .insert(payload)
        error = res.error
      }

      if (error) {
        console.error('Error guardando predicciones especiales:', error)
        toast.error(`Error al guardar: ${error.message}`)
        return
      }
      setSaved(true)
      toast.success('¡Predicciones especiales guardadas! ⭐')
      
      const { useRouter } = require('next/navigation')
      // router.refresh no está disponible aquí directamente sin el hook
      // pero podemos forzar la recarga de la página si es necesario
      window.location.reload()
    } catch (err) {
      console.error('Excepción guardando predicciones especiales:', err)
      toast.error('Error inesperado. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div className="glass-card p-5">
        <h2 className="text-lg font-extrabold mb-1">Predicciones Especiales</h2>
        <p className="text-sm text-white/40 mb-6">
          Completalas antes del primer partido. Solo se pueden guardar una vez.
        </p>

        <div className="space-y-4">
          {/* Campeón */}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
              🏆 Campeón del Mundial <span className="text-gold">+10 pts</span>
            </label>
            <input
              value={champ}
              onChange={e => { setChamp(e.target.value); setSaved(false) }}
              placeholder="Ej: Argentina"
              disabled={!!specialPred}
              className="input-dark disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Subcampeón */}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
              🥈 Subcampeón <span className="text-gold">+5 pts</span>
            </label>
            <input
              value={runner}
              onChange={e => { setRunner(e.target.value); setSaved(false) }}
              placeholder="Ej: Francia"
              disabled={!!specialPred}
              className="input-dark disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Tercer puesto */}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
              🥉 Tercer puesto <span className="text-gold">+5 pts</span>
            </label>
            <input
              value={thirdPlace}
              onChange={e => { setThirdPlace(e.target.value); setSaved(false) }}
              placeholder="Ej: Croacia"
              disabled={!!specialPred}
              className="input-dark disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Goleador */}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
              ⭐ Goleador del torneo <span className="text-gold">+5 pts</span>
            </label>
            <input
              value={scorer}
              onChange={e => { setScorer(e.target.value); setSaved(false) }}
              placeholder="Ej: Mbappé"
              disabled={!!specialPred}
              className="input-dark disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Mejor jugador */}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
              🌟 Mejor jugador <span className="text-gold">+5 pts</span>
            </label>
            <input
              value={bestPlayer}
              onChange={e => { setBestPlayer(e.target.value); setSaved(false) }}
              placeholder="Ej: Messi"
              disabled={!!specialPred}
              className="input-dark disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Mejor arquero */}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
              🧤 Mejor arquero <span className="text-gold">+5 pts</span>
            </label>
            <input
              value={bestGoalkeeper}
              onChange={e => { setBestGoalkeeper(e.target.value); setSaved(false) }}
              placeholder="Ej: Dibu Martínez"
              disabled={!!specialPred}
              className="input-dark disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Marcador de la final */}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
              ⚡ Marcador exacto de la Final <span className="text-gold">+5 pts</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number" min={0} max={20}
                value={finalHome}
                onChange={e => { setFinalHome(e.target.value); setSaved(false) }}
                className="score-input"
                placeholder="0"
                disabled={!!specialPred}
              />
              <span className="text-white/30 font-bold">—</span>
              <input
                type="number" min={0} max={20}
                value={finalAway}
                onChange={e => { setFinalAway(e.target.value); setSaved(false) }}
                className="score-input"
                placeholder="0"
                disabled={!!specialPred}
              />
              <span className="text-xs text-white/30">Campeón — Subcampeón</span>
            </div>
          </div>
        </div>

        {!specialPred && userId && (
          <button
            onClick={handleSave}
            disabled={saving || !champ}
            className="btn-brand w-full py-3.5 mt-6 disabled:opacity-40"
          >
            {saving ? 'Guardando...' : 'Guardar predicciones especiales →'}
          </button>
        )}

        {saved && (
          <div className="mt-4 text-center text-sm text-green-400 font-semibold">
            ✓ Predicciones guardadas — ¡Buena suerte!
          </div>
        )}

        {!userId && (
          <a href="/register" className="btn-brand w-full text-center py-3.5 mt-6 block">
            Registrate para participar →
          </a>
        )}
      </div>
    </div>
  )
}
