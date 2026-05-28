import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { invite_code } = await request.json()
  if (!invite_code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

  // Buscar la liga
  const { data: league, error: leagueErr } = await supabase
    .from('leagues')
    .select('id, name, max_members')
    .eq('invite_code', invite_code.toUpperCase())
    .single()

  if (leagueErr || !league) {
    return NextResponse.json({ error: 'Código de liga inválido' }, { status: 404 })
  }

  // Verificar cupo
  const { count } = await supabase
    .from('league_members')
    .select('id', { count: 'exact', head: true })
    .eq('league_id', league.id)

  if ((count ?? 0) >= league.max_members) {
    return NextResponse.json({ error: 'La liga está completa' }, { status: 400 })
  }

  // Unirse
  const { error: joinErr } = await supabase
    .from('league_members')
    .insert({ league_id: league.id, user_id: user.id })

  if (joinErr) {
    if (joinErr.code === '23505') {
      return NextResponse.json({ error: 'Ya sos miembro de esta liga' }, { status: 409 })
    }
    return NextResponse.json({ error: joinErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, league_name: league.name })
}
