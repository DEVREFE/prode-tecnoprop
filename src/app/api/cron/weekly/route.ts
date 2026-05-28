import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, emailRankingSemanal } from '@/lib/email/sender'

// Ejecutar cada lunes a las 9am AR (Vercel Cron: "0 12 * * 1")
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prode.tecnoprop.ar'

  // Top 5 general
  const { data: top5 } = await supabase
    .from('ranking_general')
    .select('nombre, apellido, total_points, position')
    .limit(5)

  // Todos los usuarios activos con su posición
  const { data: allUsers } = await supabase
    .from('ranking_general')
    .select('id, nombre, total_points, position')
    .limit(500)

  // Email a cada usuario
  const { data: users } = await supabase
    .from('users')
    .select('id, email, nombre')
    .eq('status', 'active')
    .limit(500)

  let sent = 0
  let errors = 0

  for (const user of users ?? []) {
    if (!user.email) continue
    const myRank = (allUsers ?? []).find((u: any) => u.id === user.id)
    if (!myRank) continue

    try {
      const template = emailRankingSemanal({
        nombre: user.nombre,
        rankPosition: myRank.position,
        totalPoints: myRank.total_points,
        topUsers: top5 ?? [],
        siteUrl,
      })
      await sendEmail({ to: user.email, ...template })
      sent++
      await new Promise(r => setTimeout(r, 50))
    } catch {
      errors++
    }
  }

  return NextResponse.json({ ok: true, sent, errors })
}
