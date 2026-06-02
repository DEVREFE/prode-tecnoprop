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
    // Obtener fixture del Mundial 2026 de API-Football
    const apiRes = await fetch(
      'https://v3.football.api-sports.io/fixtures?league=1&season=2026',
      {
        headers: {
          'x-apisports-key': process.env.API_FOOTBALL_KEY!,
          'x-apisports-host': 'v3.football.api-sports.io',
        },
        next: { revalidate: 300 }, // cache 5 minutos
      }
    )

    if (!apiRes.ok) {
      throw new Error(`API-Football error: ${apiRes.status}`)
    }

    const { response: fixtures } = await apiRes.json()
    const supabase = createAdminClient()

    let updated = 0
    let inserted = 0

    for (const fixture of fixtures) {
      const f = fixture.fixture
      const teams = fixture.teams
      const goals = fixture.goals
      const league = fixture.league

      // Mapear status
      const statusMap: Record<string, string> = {
        'TBD': 'scheduled', 'NS': 'scheduled',
        '1H': 'live', 'HT': 'live', '2H': 'live', 'ET': 'live', 'P': 'live', 'BT': 'live',
        'FT': 'finished', 'AET': 'finished', 'PEN': 'finished',
        'SUSP': 'cancelled', 'INT': 'cancelled', 'PST': 'scheduled',
      }

      // Mapear phase
      const roundStr = (league.round ?? '').toLowerCase()
      let phase = 'group'
      if (roundStr.includes('final') && !roundStr.includes('round') && !roundStr.includes('semi') && !roundStr.includes('quarter')) {
        phase = 'final'
      } else if (roundStr.includes('semi')) {
        phase = 'semi_final'
      } else if (roundStr.includes('quarter')) {
        phase = 'quarter_final'
      } else if (roundStr.includes('round of 16')) {
        phase = 'round_of_16'
      } else if (roundStr.includes('round of 32')) {
        phase = 'round_of_32'
      } else if (roundStr.includes('3rd')) {
        phase = 'third_place'
      }

      const payload = {
        api_match_id: String(f.id),
        match_date:   f.date,
        team_home:    teams.home.name,
        team_away:    teams.away.name,
        stadium:      f.venue?.name,
        city_venue:   f.venue?.city,
        status:       statusMap[f.status?.short ?? 'NS'] ?? 'scheduled',
        score_home:   goals.home,
        score_away:   goals.away,
        phase,
        is_locked:    ['live', 'finished'].includes(statusMap[f.status?.short ?? 'NS'] ?? ''),
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
      total: fixtures.length,
      inserted,
      updated,
    })

  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
