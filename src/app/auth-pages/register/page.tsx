'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Trophy, Instagram, Phone, MapPin, Mail, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { normalizeInstagram, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { RegisterFormData } from '@/types'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  apellido: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  email: z.string().email('Email inválido'),
  whatsapp: z.string().min(8, 'Número inválido').max(20),
  instagram_handle: z
    .string()
    .min(2, 'Ingresá tu usuario de Instagram')
    .max(30)
    .regex(/^@?[a-zA-Z0-9._]+$/, 'Usuario de Instagram inválido'),
  ciudad: z.string().min(2, 'Ingresá tu ciudad').max(100),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Necesita al menos una mayúscula')
    .regex(/[0-9]/, 'Necesita al menos un número'),
  instagram_confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Debés seguir a @tecnoprop.ok para participar' }),
  }),
})

type FormData = z.infer<typeof schema>

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { instagram_confirmed: undefined },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)

    const supabase = createClient()
    const igHandle = normalizeInstagram(data.instagram_handle)

    // Verificar si el instagram ya está registrado
    const { data: existingIg } = await supabase
      .from('users')
      .select('id')
      .eq('instagram_handle', igHandle)
      .maybeSingle()

    if (existingIg) {
      toast.error('Este Instagram ya está registrado en el prode')
      setLoading(false)
      return
    }

    // Registrar con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
        },
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        toast.error('Este email ya tiene una cuenta. ¿Querés iniciar sesión?')
      } else {
        toast.error(authError.message)
      }
      setLoading(false)
      return
    }

    if (!authData.user) {
      toast.error('Error inesperado. Intentá de nuevo.')
      setLoading(false)
      return
    }

    // Crear perfil en tabla users
    const profilePayload: Partial<RegisterFormData> & { id: string; email: string } = {
      id: authData.user.id,
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      whatsapp: data.whatsapp,
      instagram_handle: igHandle,
      instagram_confirmed: data.instagram_confirmed,
      ciudad: data.ciudad,
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert(profilePayload as any)

    if (profileError) {
      console.error('Profile error:', profileError)
      toast.error('Error al crear el perfil. Contactanos por WhatsApp.')
      setLoading(false)
      return
    }

    // Procesar referido si existe
    if (refCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', refCode)
        .maybeSingle()

      if (referrer) {
        await supabase.from('referrals').insert({
          referrer_id: (referrer as any).id,
          referred_id: authData.user.id,
        } as any)
      }
    }

    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md w-full text-center top-accent">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-extrabold mb-3">¡Revisá tu email!</h1>
          <p className="text-white/60 mb-6 leading-relaxed">
            Te enviamos un link de confirmación. Hacé click en el link para activar
            tu cuenta y empezar a pronosticar.
          </p>
          <div className="bg-celeste/[0.06] border border-celeste/15 rounded-xl p-4 text-sm text-white/60 mb-6">
            El link expira en <span className="text-white font-semibold">24 horas</span>.
            Si no lo encontrás, revisá la carpeta de spam.
          </div>
          <Link href="/" className="btn-ghost block text-center text-sm">
            Volver al inicio
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8 animate-fade-up">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Trophy size={18} className="text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Sumate al Prode
          </h1>
          <p className="text-white/50">Registrate gratis y empezá a pronosticar el Mundial 2026</p>
        </div>

        {/* Form card */}
        <div className="glass-card p-6 top-accent animate-fade-up-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
                  Nombre
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    {...register('nombre')}
                    placeholder="Juan"
                    className={cn('input-dark pl-8', errors.nombre && 'border-red-500/50')}
                  />
                </div>
                {errors.nombre && (
                  <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
                  Apellido
                </label>
                <input
                  {...register('apellido')}
                  placeholder="García"
                  className={cn('input-dark', errors.apellido && 'border-red-500/50')}
                />
                {errors.apellido && (
                  <p className="text-red-400 text-xs mt-1">{errors.apellido.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="vos@email.com"
                  className={cn('input-dark pl-8', errors.email && 'border-red-500/50')}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
                WhatsApp
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  {...register('whatsapp')}
                  type="tel"
                  placeholder="+54 381 000-0000"
                  className={cn('input-dark pl-8', errors.whatsapp && 'border-red-500/50')}
                />
              </div>
              {errors.whatsapp && (
                <p className="text-red-400 text-xs mt-1">{errors.whatsapp.message}</p>
              )}
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
                Instagram
              </label>
              <div className="relative">
                <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  {...register('instagram_handle')}
                  placeholder="@tu_usuario"
                  className={cn('input-dark pl-8', errors.instagram_handle && 'border-red-500/50')}
                />
              </div>
              {errors.instagram_handle && (
                <p className="text-red-400 text-xs mt-1">{errors.instagram_handle.message}</p>
              )}
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
                Ciudad
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  {...register('ciudad')}
                  placeholder="Tucumán"
                  className={cn('input-dark pl-8', errors.ciudad && 'border-red-500/50')}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className={cn('input-dark pr-10', errors.password && 'border-red-500/50')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Instagram confirmation checkbox */}
            <div className={cn(
              'rounded-xl p-4 border transition-colors',
              errors.instagram_confirmed
                ? 'bg-red-500/[0.06] border-red-500/30'
                : watch('instagram_confirmed')
                  ? 'bg-celeste/[0.06] border-celeste/20'
                  : 'bg-white/[0.02] border-white/[0.08]'
            )}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  {...register('instagram_confirmed')}
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded accent-celeste cursor-pointer"
                />
                <span className="text-sm text-white/70 leading-snug">
                  Sigo a{' '}
                  <a
                    href="https://instagram.com/tecnoprop.ok"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-celeste font-semibold hover:underline"
                  >
                    @tecnoprop.ok
                  </a>{' '}
                  en Instagram. (Requisito para participar y recibir premios)
                </span>
              </label>
              {errors.instagram_confirmed && (
                <p className="text-red-400 text-xs mt-2">{errors.instagram_confirmed.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-brand w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Participar Gratis →'}
            </button>

            <p className="text-center text-xs text-white/30">
              Al registrarte aceptás los{' '}
              <Link href="/terminos" className="underline hover:text-white/60">
                términos y condiciones
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-white/40 mt-6 animate-fade-up-2">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-celeste font-semibold hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-white/50 text-sm">Cargando...</div>
      </main>
    }>
      <RegisterContent />
    </Suspense>
  )
}
