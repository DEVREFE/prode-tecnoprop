import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login?next=/admin')

  // Verificar que sea admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  // Todos los partidos
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  // Todos los usuarios con stats
  const { data: users } = await supabase
    .from('ranking_general')
    .select('*')
    .limit(200)

  // Conteos
  const { count: totalActive } = await supabase
    .from('users').select('id', { count: 'exact', head: true }).eq('status', 'active')
  const { count: totalPending } = await supabase
    .from('users').select('id', { count: 'exact', head: true }).eq('status', 'pending_verification')
  const { count: totalPreds } = await supabase
    .from('predictions').select('id', { count: 'exact', head: true })

  return (
    <>
      <Navbar />
      <AdminClient
        matches={matches ?? []}
        users={users ?? []}
        stats={{
          totalActive: totalActive ?? 0,
          totalPending: totalPending ?? 0,
          totalPredictions: totalPreds ?? 0,
        }}
      />
    </>
  )
}
