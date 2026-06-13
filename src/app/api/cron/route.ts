import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, emailRecordatorioPartido, emailRankingSemanal } from '@/lib/email/sender'

// Vercel Cron: ejecutar cada 5 minutos (en vercel.json)
// También puede llamarse manualmente con el secret
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results: Record<string, any> = {}

  // ── 1. Bloquear partidos que ya empezaron ──────────────────────
  const { error: lockErr } = await supabase.rpc('lock_started_matches')
  results.lock_matches = lockErr ? { error: lockErr.message } : { ok: true }

  // ── 2. Sincronizar resultados en vivo (si API-Football activa) ─
  try {
    const liveMatches = await supabase
      .from('matches')
      .select('id, api_match_id, status')
      .eq('status', 'live')

    if ((liveMatches.data ?? []).length > 0 && process.env.API_FOOTBALL_KEY) {
      const ids = (liveMatches.data ?? []).map((m: any) => m.api_match_id).filter(Boolean)
      if (ids.length > 0) {
        const apiRes = await fetch(
          `https://v3.football.api-sports.io/fixtures?ids=${ids.join('-')}`,
          {
            headers: {
              'x-apisports-key': process.env.API_FOOTBALL_KEY,
              'x-apisports-host': 'v3.football.api-sports.io',
            },
          }
        )
        const { response: fixtures } = await apiRes.json()
        let updated = 0

        for (const fix of fixtures ?? []) {
          const shortStatus = fix.fixture?.status?.short
          const isFinished = ['FT', 'AET', 'PEN'].includes(shortStatus)
          const isLive = ['1H', 'HT', '2H', 'ET', 'P', 'BT'].includes(shortStatus)

          if (isFinished || isLive) {
            const { data: match } = await supabase
              .from('matches')
              .update({
                score_home: fix.goals.home,
                score_away: fix.goals.away,
                status: isFinished ? 'finished' : 'live',
                is_locked: true,
              })
              .eq('api_match_id', String(fix.fixture.id))
              .select('id')
              .single()

            // Calcular puntos si el partido terminó
            if (isFinished && match) {
              await supabase.rpc('score_match', { p_match_id: match.id })

              // Enviar email de resumen a todos los participantes que pronosticaron
              const { data: preds } = await supabase
                .from('predictions')
                .select('*, users(email, nombre, total_points)')
                .eq('match_id', match.id)
                .not('points_earned', 'is', null)

              // Enviar emails en lote (máx 10 a la vez para no saturar)
              const batch = (preds ?? []).slice(0, 10)
              for (const pred of batch) {
                if (!pred.users?.email) continue
                try {
                  const { data: rankData } = await supabase
                    .from('ranking_general')
                    .select('position')
                    .eq('id', (pred as any).user_id)
                    .single()

                  const template = emailResumenPuntos({
                    nombre: pred.users.nombre,
                    teamHome: fix.teams.home.name,
                    teamAway: fix.teams.away.name,
                    scoreHome: fix.goals.home,
                    scoreAway: fix.goals.away,
                    predHome: pred.pred_home,
                    predAway: pred.pred_away,
                    pointsEarned: pred.points_earned ?? 0,
                    totalPoints: pred.users.total_points,
                    rankPosition: rankData?.position ?? 0,
                    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prode.tecnoprop.ar',
                  })
                  await sendEmail({ to: pred.users.email, ...template })
                } catch (e) {
                  console.error('Email error:', e)
                }
              }
            }
            updated++
          }
        }
        results.live_sync = { updated }
      }
    }
  } catch (e: any) {
    results.live_sync = { error: e.message }
  }

  // ── 3. Recordatorios — partidos que arrancan en 2 horas ────────
  try {
    const in2h = new Date(Date.now() + 2 * 3600 * 1000)
    const in1h = new Date(Date.now() + 1 * 3600 * 1000)

    const { data: upcoming } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'scheduled')
      .eq('is_locked', false)
      .gte('match_date', in1h.toISOString())
      .lte('match_date', in2h.toISOString())

    if ((upcoming ?? []).length > 0) {
      for (const match of upcoming ?? []) {
        // Usuarios activos que NO pronosticaron este partido
        const { data: usersWithoutPred } = await supabase
          .from('users')
          .select('id, email, nombre')
          .eq('status', 'active')
          .not('id', 'in',
            `(SELECT user_id FROM predictions WHERE match_id = '${match.id}')`
          )
          .limit(200) // máx 200 por cron

        let sent = 0
        for (const user of usersWithoutPred ?? []) {
          if (!user.email) continue
          try {
            const template = emailRecordatorioPartido({
              nombre: user.nombre,
              teamHome: match.team_home,
              teamAway: match.team_away,
              flagHome: match.flag_home ?? '🏳️',
              flagAway: match.flag_away ?? '🏳️',
              matchDate: new Date(match.match_date).toLocaleString('es-AR', {
                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
              }),
              stadium: match.stadium ?? '',
              siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prode.tecnoprop.ar',
              matchId: match.id,
            })
            await sendEmail({ to: user.email, ...template })
            sent++
            // Rate limit: 1 email cada 50ms
            await new Promise(r => setTimeout(r, 50))
          } catch (e) {
            console.error('Reminder email error:', e)
          }
        }
        results.reminders = { match: `${match.team_home} vs ${match.team_away}`, sent }
      }
    }
  } catch (e: any) {
    results.reminders = { error: e.message }
  }

  // ── 4. Catch-all: puntuar partidos finalizados sin procesar ────
  // Seguro de ejecutar múltiples veces — score_match solo procesa
  // predictions con points_earned IS NULL
  try {
    const { data: allFinished } = await supabase
      .from('matches')
      .select('id')
      .eq('status', 'finished')
      .not('score_home', 'is', null)
      .not('score_away', 'is', null)

    let catchAllScored = 0
    for (const match of allFinished ?? []) {
      const { data: count, error: scoreErr } = await supabase.rpc('score_match', { p_match_id: match.id })
      if (!scoreErr && count && count > 0) {
        catchAllScored += count
      }
    }
    results.catch_all_scoring = { checked: allFinished?.length ?? 0, scored: catchAllScored }
  } catch (e: any) {
    results.catch_all_scoring = { error: e.message }
  }

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), results })
}

// Re-importar para evitar circular
function emailResumenPuntos(opts: any) {
  const { emailResumenPuntos: fn } = require('@/lib/email/sender')
  return fn(opts)
}
