import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import RankingClient from './RankingClient'

export default async function RankingPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Ranking general top 100
  const { data: ranking } = await supabase
    .from('ranking_general')
    .select('*')
    .limit(100)

  // Mi posición (si está logueado)
  let myEntry = null
  if (authUser) {
    const { data } = await supabase
      .from('ranking_general')
      .select('*')
      .eq('id', authUser.id)
      .single()
    myEntry = data
  }

  // Total de participantes activos
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  return (
    <>
      <Navbar />
      <RankingClient
        initialRanking={ranking ?? []}
        myEntry={myEntry}
        totalUsers={count ?? 0}
        userId={authUser?.id}
      />
    </>
  )
}
