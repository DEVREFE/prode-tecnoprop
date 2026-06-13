import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// Agendá un cron externo (ej. cron-job.org) cada 2-5 min apuntando a
// GET /api/sync-matches con el header:  Authorization: Bearer <CRON_SECRET>
// Vercel Cron envía ese header automáticamente si CRON_SECRET está seteado.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    // Obtener fixture del Mundial 2026 de ESPN (Gratis)
    const apiRes = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719',
      { next: { revalidate: 300 } }
    )

    if (!apiRes.ok) throw new Error(`ESPN API error: ${apiRes.status}`)

    const jsonRes = await apiRes.json()
    const events = jsonRes.events || []
    
    // Obtener standings para mapear equipos a grupos
    const standingsRes = await fetch('https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings', { next: { revalidate: 3600 } })
    const standingsData = await standingsRes.json()
    
    // Construir mapeo teamId -> groupName ("Grupo A", "Grupo B", etc.)
    const teamGroupMap: Record<string, string> = {}
    for (const group of standingsData.children || []) {
      for (const entry of group.standings?.entries || []) {
        if (entry.team?.id && group.name) {
          teamGroupMap[entry.team.id] = group.name.replace('Group ', 'Grupo ')
        }
      }
    }

    const supabase = createAdminClient()

    let updated = 0
    let inserted = 0
    let scored = 0

    for (const event of events) {
      const comp = event.competitions[0]
      if (!comp) continue

      const homeCompetitor = comp.competitors.find((c: any) => c.homeAway === 'home')
      const awayCompetitor = comp.competitors.find((c: any) => c.homeAway === 'away')
      
      if (!homeCompetitor || !awayCompetitor) continue

      // Mapear status
      const stateStr = event.status.type.state // 'pre', 'in', 'post'
      let status = 'scheduled'
      if (stateStr === 'in') status = 'live'
      if (stateStr === 'post') status = 'finished'
      
      // Manejar cancelados/pospuestos
      const statusName = event.status.type.name.toLowerCase()
      if (statusName.includes('canceled') || statusName.includes('postponed')) {
        status = 'cancelled'
      }

      // Fase basada en season.slug (mucho más confiable que el nombre)
      let phase = 'group'
      const slug = event.season?.slug || ''
      if (slug === 'round-of-32') phase = 'round_of_32'
      else if (slug === 'round-of-16') phase = 'round_of_16'
      else if (slug === 'quarterfinals') phase = 'quarter_final'
      else if (slug === 'semifinals') phase = 'semi_final'
      else if (slug === '3rd-place') phase = 'third_place'
      else if (slug === 'final') phase = 'final'
      
      // Grupo (solo si es fase de grupos, o si lo encontramos en el mapeo)
      const homeId = homeCompetitor.id || homeCompetitor.team?.id?.toString()
      const groupName = teamGroupMap[homeId] || null

      const payload = {
        api_match_id: String(event.id),
        match_date:   event.date,
        team_home:    homeCompetitor.team.name,
        team_away:    awayCompetitor.team.name,
        flag_home:    homeCompetitor.team.logo || null,
        flag_away:    awayCompetitor.team.logo || null,
        stadium:      comp.venue?.fullName || null,
        city_venue:   comp.venue?.address?.city || null,
        status:       status,
        score_home:   homeCompetitor.score !== undefined ? parseInt(homeCompetitor.score) : null,
        score_away:   awayCompetitor.score !== undefined ? parseInt(awayCompetitor.score) : null,
        phase,
        group_name:   groupName,
        is_locked:    ['live', 'finished'].includes(status),
      }

      const { data: existing } = await supabase
        .from('matches')
        .select('id, status')
        .eq('api_match_id', payload.api_match_id)
        .maybeSingle()

      if (existing) {
        await supabase.from('matches').update(payload).eq('id', existing.id)
        // Si el partido pasó a 'finished', calcular puntos inmediatamente
        if (status === 'finished' && payload.score_home !== null && payload.score_away !== null) {
          const { data: count, error: scoreErr } = await supabase.rpc('score_match', { p_match_id: existing.id })
          if (scoreErr) {
            console.error(`[sync-matches] Error scoring match ${existing.id}:`, scoreErr.message)
          } else if (count && count > 0) {
            console.log(`[sync-matches] Scored ${count} predictions for match ${existing.id}`)
            scored += count
          }
        }
        updated++
      } else {
        await supabase.from('matches').insert(payload)
        inserted++
      }
    }

    // ── Catch-all: puntuar TODOS los partidos finalizados con predicciones pendientes ──
    // Esto recupera puntos que no se calcularon por el bug anterior.
    // score_match() es idempotente: solo procesa predictions con points_earned IS NULL
    let catchAllScored = 0
    try {
      const { data: allFinished } = await supabase
        .from('matches')
        .select('id')
        .eq('status', 'finished')
        .not('score_home', 'is', null)
        .not('score_away', 'is', null)

      for (const match of allFinished ?? []) {
        const { data: count, error: scoreErr } = await supabase.rpc('score_match', { p_match_id: match.id })
        if (!scoreErr && count && count > 0) {
          catchAllScored += count
        }
      }
    } catch (e: any) {
      console.error('[sync-matches] Catch-all scoring error:', e.message)
    }

    return NextResponse.json({
      success: true,
      total: events.length,
      inserted,
      updated,
      scored,
      catchAllScored,
    })

  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
