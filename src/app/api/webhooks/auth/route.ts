import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail, emailBienvenida } from '@/lib/email/sender'

// Supabase Auth Webhook — configurar en:
// Supabase Dashboard > Authentication > Hooks > Send Email
// O: Database Webhooks > tabla auth.users > evento UPDATE

export async function POST(request: NextRequest) {
  // Verificar firma del webhook
  const webhookSecret = request.headers.get('x-webhook-secret')
  if (webhookSecret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { type, record, old_record } = body

  // Solo procesar cuando se confirma el email
  // (email_confirmed_at pasa de null a un timestamp)
  if (
    type !== 'UPDATE' ||
    !record?.email_confirmed_at ||
    old_record?.email_confirmed_at
  ) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const supabase = createAdminClient()
  const userId = record.id

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('users')
    .select('nombre, email, referral_code, referred_by')
    .eq('id', userId)
    .single()

  if (!profile?.email) {
    return NextResponse.json({ ok: true, skipped: 'no profile' })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prode.tecnoprop.ar'

  // Enviar email de bienvenida
  try {
    const template = emailBienvenida({
      nombre: profile.nombre,
      referral_code: profile.referral_code,
      siteUrl,
    })
    await sendEmail({ to: profile.email, ...template })
  } catch (e) {
    console.error('Welcome email error:', e)
    // No fallar el webhook si el email falla
  }

  // Procesar bonus de referido
  if (profile.referred_by) {
    const { data: referral } = await supabase
      .from('referrals')
      .select('id, points_awarded')
      .eq('referred_id', userId)
      .maybeSingle()

    if (referral && !referral.points_awarded) {
      // Dar punto al que refirió
      await supabase
        .from('users')
        .update({ total_points: supabase.rpc('total_points + 1' as any) })
        .eq('id', profile.referred_by)

      // Más limpio: usar UPDATE directo
      await supabase.rpc('apply_referral_bonus' as any, { p_referrer_id: profile.referred_by })

      // Marcar como pagado
      await supabase
        .from('referrals')
        .update({ points_awarded: true })
        .eq('id', referral.id)

      // Log
      await supabase.from('points_log').insert({
        user_id: profile.referred_by,
        reason: 'referral_bonus',
        points: 1,
        description: `Referido: ${profile.nombre}`,
      })
    }
  }

  return NextResponse.json({ ok: true, userId, email: profile.email })
}
