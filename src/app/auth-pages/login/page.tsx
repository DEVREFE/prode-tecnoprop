'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Trophy, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
})
type FormData = z.infer<typeof schema>

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    setLoading(false)

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        toast.error('Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada.')
      } else if (error.message.includes('Invalid login')) {
        toast.error('Email o contraseña incorrectos')
      } else {
        toast.error(error.message)
      }
      return
    }

    toast.success('¡Bienvenido! 🎉')
    router.refresh()
    router.push(next)
  }

  const handleForgotPassword = async () => {
    const email = (document.getElementById('email') as HTMLInputElement)?.value
    if (!email) {
      toast.error('Ingresá tu email primero')
      return
    }
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
    })
    if (!error) toast.success('Te enviamos el link para resetear la contraseña')
    else toast.error(error.message)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8 animate-fade-up">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Trophy size={18} className="text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Bienvenido</h1>
          <p className="text-white/50 text-sm">Ingresá a tu cuenta del Prode 2026</p>
        </div>

        <div className="glass-card p-6 top-accent animate-fade-up-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="vos@email.com"
                  autoComplete="email"
                  className={cn('input-dark pl-8', errors.email && 'border-red-500/50')}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-celeste hover:underline"
                >
                  ¿Olvidaste la contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={loading}
              className="btn-brand w-full py-3.5 text-base disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Ingresar →'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/40 mt-6 animate-fade-up-2">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="text-celeste font-semibold hover:underline">
            Registrate gratis
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-white/50 text-sm">Cargando...</div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  )
}
