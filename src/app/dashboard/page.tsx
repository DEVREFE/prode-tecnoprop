import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login?next=/dashboard')

  // Perfil del usuario
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!profile) redirect('/login')


  // Mis predicciones con datos del partido
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*, matches(*)')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })

  // Mi posición en el ranking
  const { data: rankData } = await supabase
    .from('ranking_general')
    .select('position')
    .eq('id', authUser.id)
    .single()

  // Historial de puntos
  const { data: pointsLog } = await supabase
    .from('points_log')
    .select('*')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Mis ligas
  const { data: myLeagues } = await supabase
    .from('league_members')
    .select('*, leagues(*, users!leagues_owner_id_fkey(nombre, apellido))')
    .eq('user_id', authUser.id)

  // Predicciones especiales
  const { data: specialPred } = await supabase
    .from('special_predictions')
    .select('*')
    .eq('user_id', authUser.id)
    .maybeSingle()

  // Referidos
  const { data: referrals } = await supabase
    .from('referrals')
    .select('*, users!referrals_referred_id_fkey(nombre, apellido, created_at)')
    .eq('referrer_id', authUser.id)

  return (
    <>
      <Navbar initialUser={profile} />
      <DashboardClient
        profile={profile}
        predictions={predictions ?? []}
        rankPosition={rankData?.position ?? null}
        pointsLog={pointsLog ?? []}
        myLeagues={myLeagues ?? []}
        specialPred={specialPred}
        referrals={referrals ?? []}
      />
    </>
  )
}
