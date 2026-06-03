import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import PartidosClient from './PartidosClient'

export default async function PartidosPage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Perfil del usuario para el Navbar
  let userProfile = null
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()
    userProfile = data
  }

  // Todos los partidos
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  // Mis predicciones (si está logueado)
  let myPredictions: any[] = []
  if (authUser) {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', authUser.id)
    myPredictions = data ?? []
  }

  // Mis predicciones especiales
  let specialPred = null
  if (authUser) {
    const { data } = await supabase
      .from('special_predictions')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle()
    specialPred = data
  }

  // Mapear predicciones por match_id para lookup rápido
  const predMap = myPredictions.reduce((acc: any, p: any) => {
    acc[p.match_id] = p
    return acc
  }, {})

  // Agregar prediction a cada match
  const matchesWithPreds = (matches ?? []).map((m: any) => ({
    ...m,
    prediction: predMap[m.id] ?? null,
  }))

  return (
    <>
      <Navbar initialUser={userProfile} />
      <PartidosClient
        matches={matchesWithPreds}
        userId={authUser?.id}
        specialPred={specialPred}
      />
    </>
  )
}
