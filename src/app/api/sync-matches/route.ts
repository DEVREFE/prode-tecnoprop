import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// Llamar con: GET /api/sync-matches?secret=TU_SECRETO
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const secretParam = request.nextUrl.searchParams.get('secret')
  
  const isValidAuth = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
  const isValidSecret = secretParam === process.env.SUPABASE_SERVICE_ROLE_KEY || secretParam === process.env.API_FOOTBALL_KEY
  
  if (!isValidAuth && !isValidSecret) {
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
        group_name,
        is_locked:    ['live', 'finished'].includes(status),
      }

      const { data: existing } = await supabase
        .from('matches')
        .select('id')
        .eq('api_match_id', payload.api_match_id)
        .maybeSingle()

      if (existing) {
        await supabase.from('matches').update(payload).eq('id', existing.id)
        updated++
      } else {
        await supabase.from('matches').insert(payload)
        inserted++
      }
    }

    return NextResponse.json({
      success: true,
      total: events.length,
      inserted,
      updated,
    })

  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
