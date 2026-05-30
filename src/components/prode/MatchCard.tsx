'use client'

import { useState } from 'react'
import { MapPin, Lock } from 'lucide-react'
import { cn, formatMatchDate, getMatchStatusLabel, calcPoints } from '@/lib/utils'
import { PHASE_LABELS } from '@/types'
import type { MatchWithPrediction } from '@/types'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface MatchCardProps {
  match: MatchWithPrediction
  userId?: string
  onPredictionSaved?: (matchId: string, home: number, away: number) => void
}

export default function MatchCard({ match, userId, onPredictionSaved }: MatchCardProps) {
  const [predHome, setPredHome] = useState<string>(
    match.prediction?.pred_home?.toString() ?? ''
  )
  const [predAway, setPredAway] = useState<string>(
    match.prediction?.pred_away?.toString() ?? ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!match.prediction)

  const status = getMatchStatusLabel(match)
  const isLocked = match.is_locked || match.status !== 'scheduled'
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  const predPoints = isFinished && match.prediction
    ? calcPoints(match.prediction, { score_home: match.score_home, score_away: match.score_away })
    : null

  const handleSave = async () => {
    if (!userId) {
      toast.error('Ingresá para guardar tu pronóstico')
      return
    }
    if (predHome === '' || predAway === '') {
      toast.error('Ingresá el resultado para los dos equipos')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      const payload = {
        user_id: userId,
        match_id: match.id,
        pred_home: parseInt(predHome),
        pred_away: parseInt(predAway),
      }

      // Verificar si ya existe una predicción para este partido
      // (evita upsert que falla silenciosamente con RLS separadas para INSERT/UPDATE)
      const { data: existing } = await supabase
        .from('predictions')
        .select('id')
        .eq('user_id', userId)
        .eq('match_id', match.id)
        .maybeSingle()

      let error
      if (existing) {
        // Actualizar predicción existente
        const res = await supabase
          .from('predictions')
          .update({ pred_home: payload.pred_home, pred_away: payload.pred_away })
          .eq('id', existing.id)
        error = res.error
      } else {
        // Insertar nueva predicción
        const res = await supabase
          .from('predictions')
          .insert(payload)
        error = res.error
      }

      if (error) {
        console.error('Error guardando pronóstico:', error)
        toast.error(`Error al guardar: ${error.message}`)
        return
      }

      setSaved(true)
      toast.success('¡Pronóstico guardado! 🎯')
      onPredictionSaved?.(match.id, parseInt(predHome), parseInt(predAway))
    } catch (err) {
      console.error('Excepción guardando pronóstico:', err)
      toast.error('Error inesperado. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={cn(
        'glass-card p-4 transition-all duration-200 hover:-translate-y-0.5',
        isLive && 'border-green-500/25 bg-green-500/[0.03]',
        saved && !isLocked && 'border-celeste/20'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md bg-celeste/10 text-celeste">
          {match.group_name ?? PHASE_LABELS[match.phase]}
        </span>

        {isLive ? (
          <span className="live-badge">
            <span className="live-dot" />
            En vivo
          </span>
        ) : isFinished ? (
          <span className="text-xs text-white/30 font-medium">Finalizado</span>
        ) : isLocked ? (
          <span className="flex items-center gap-1 text-xs text-red-400/70 font-medium">
            <Lock size={11} />
            Cerrado
          </span>
        ) : (
          <span className="text-xs text-white/40 font-medium" suppressHydrationWarning>
            {formatMatchDate(match.match_date)}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center gap-3 mb-4">
        {/* Team Home */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-3xl">
            {match.flag_home ?? '🏳️'}
          </div>
          <span className="text-xs font-bold text-center leading-tight line-clamp-1">
            {match.team_home}
          </span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-1 min-w-[64px]">
          {(isLive || isFinished) ? (
            <>
              <div className="flex items-center gap-2 text-2xl font-extrabold font-mono">
                <span className={cn(
                  match.score_home! > match.score_away! && 'text-white',
                  match.score_home! < match.score_away! && 'text-white/40',
                  match.score_home === match.score_away && 'text-white/70'
                )}>
                  {match.score_home}
                </span>
                <span className="text-white/20 text-xl">—</span>
                <span className={cn(
                  match.score_away! > match.score_home! && 'text-white',
                  match.score_away! < match.score_home! && 'text-white/40',
                  match.score_home === match.score_away && 'text-white/70'
                )}>
                  {match.score_away}
                </span>
              </div>
              <span className="text-[10px] text-white/25 font-medium">
                {isLive ? "En curso" : "FT"}
              </span>
            </>
          ) : (
            <>
              <span className="text-white/25 font-bold text-lg">VS</span>
              <span className="text-[10px] text-white/25" suppressHydrationWarning>
                {match.match_date ? new Date(match.match_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </>
          )}
        </div>

        {/* Team Away */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-3xl">
            {match.flag_away ?? '🏳️'}
          </div>
          <span className="text-xs font-bold text-center leading-tight line-clamp-1">
            {match.team_away}
          </span>
        </div>
      </div>

      {/* Prediction area */}
      {!isLocked && userId && (
        <div className={cn(
          'rounded-xl p-3 flex items-center justify-between gap-3 transition-colors',
          saved
            ? 'bg-celeste/[0.06] border border-celeste/15'
            : 'bg-white/[0.03] border border-white/[0.06]'
        )}>
          <span className="text-[10px] font-semibold tracking-widest text-white/30 uppercase whitespace-nowrap">
            Tu pronóstico
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0} max={30}
              value={predHome}
              onChange={e => { setPredHome(e.target.value); setSaved(false) }}
              className="score-input"
              placeholder="0"
            />
            <span className="text-white/30 font-bold text-sm">—</span>
            <input
              type="number"
              min={0} max={30}
              value={predAway}
              onChange={e => { setPredAway(e.target.value); setSaved(false) }}
              className="score-input"
              placeholder="0"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'text-xs font-bold px-3 py-2 rounded-lg transition-all whitespace-nowrap',
              saved
                ? 'bg-celeste/20 text-celeste'
                : 'bg-gradient-brand text-white hover:shadow-lg hover:shadow-celeste/20'
            )}
          >
            {saving ? '...' : saved ? 'Guardado ✓' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Resultado del pronóstico (partido finalizado) */}
      {isFinished && match.prediction && (
        <div className={cn(
          'rounded-xl p-3 flex items-center justify-between',
          predPoints === 3 && 'bg-green-500/[0.08] border border-green-500/20',
          predPoints === 1 && 'bg-celeste/[0.06] border border-celeste/15',
          predPoints === 0 && 'bg-white/[0.03] border border-white/[0.05]'
        )}>
          <span className="text-[10px] font-semibold tracking-widest text-white/30 uppercase">
            Tu pronóstico
          </span>
          <span className="text-sm font-bold font-mono text-white/60">
            {match.prediction.pred_home} — {match.prediction.pred_away}
          </span>
          <span className={cn(
            'text-sm font-extrabold font-mono',
            predPoints === 3 && 'text-green-400',
            predPoints === 1 && 'text-celeste',
            predPoints === 0 && 'text-white/25'
          )}>
            {predPoints !== null ? `+${predPoints} pts` : '—'}
          </span>
        </div>
      )}

      {/* Sin login */}
      {!userId && !isLocked && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
          <a href="/register" className="text-xs text-celeste font-semibold hover:underline">
            Registrate gratis para pronosticar →
          </a>
        </div>
      )}

      {/* Estadio */}
      {match.stadium && (
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-white/20">
          <MapPin size={10} />
          {match.stadium}{match.city_venue ? ` · ${match.city_venue}` : ''}
        </div>
      )}
    </div>
  )
}
