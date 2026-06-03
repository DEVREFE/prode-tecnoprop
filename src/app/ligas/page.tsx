import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import LigasClient from './LigasClient'

export default async function LigasPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login?next=/ligas')

  // Perfil del usuario para el Navbar
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  // Mis ligas (creadas + unido)
  const { data: myLeagues } = await supabase
    .from('league_members')
    .select(`
      joined_at,
      leagues (
        id, name, description, invite_code, is_public, max_members, owner_id,
        league_members ( count )
      )
    `)
    .eq('user_id', authUser.id)

  return (
    <>
      <Navbar initialUser={userProfile} />
      <LigasClient
        myLeagues={myLeagues ?? []}
        userId={authUser.id}
      />
    </>
  )
}
