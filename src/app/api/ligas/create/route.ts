import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Verificar que el usuario está activo
  const { data: profile } = await supabase
    .from('users')
    .select('status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'active') {
    return NextResponse.json({ error: 'Tu cuenta debe estar activa para crear ligas' }, { status: 403 })
  }

  const { name, description } = await request.json()
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'El nombre de la liga es requerido' }, { status: 400 })
  }

  // Crear la liga
  const { data: league, error: leagueErr } = await supabase
    .from('leagues')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      owner_id: user.id,
    })
    .select('id, name, invite_code')
    .single()

  if (leagueErr) {
    console.error('Error creando liga:', leagueErr)
    return NextResponse.json({ error: leagueErr.message }, { status: 500 })
  }

  // Agregar al creador como miembro
  const { error: memberErr } = await supabase
    .from('league_members')
    .insert({ league_id: league.id, user_id: user.id })

  if (memberErr) {
    console.error('Error agregando miembro:', memberErr)
    // La liga se creó pero no se pudo agregar como miembro, intentar limpiar
    await supabase.from('leagues').delete().eq('id', league.id)
    return NextResponse.json({ error: 'Error al configurar la liga' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    league_name: league.name,
    league_id: league.id,
    invite_code: league.invite_code,
  })
}
