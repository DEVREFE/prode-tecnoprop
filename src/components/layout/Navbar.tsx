'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Trophy, Menu, X, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User as UserType } from '@/types'

const NAV_LINKS = [
  { href: '/partidos', label: 'Partidos' },
  { href: '/ranking',  label: 'Ranking' },
  { href: '/ligas',    label: 'Mis Ligas' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Obtener usuario actual
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()
          
        if (data) {
          setUser(data)
        } else {
          // El usuario está en auth pero su fila en 'users' fue borrada
          setUser({
            id: authUser.id,
            nombre: 'Error de Perfil',
            apellido: '',
            email: authUser.email || '',
            total_points: 0,
            status: 'active',
            role: 'user',
            created_at: new Date().toISOString()
          } as UserType)
        }
      }
    }
    getUser()

    // Suscribirse a cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
            
          if (data) {
            setUser(data)
          } else {
            setUser({
              id: session.user.id,
              nombre: 'Error de Perfil',
              apellido: '',
              email: session.user.email || '',
              total_points: 0,
              status: 'active',
              role: 'user',
              created_at: new Date().toISOString()
            } as UserType)
          }
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-bg-1/90 backdrop-blur-xl border-b border-white/[0.06]'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-celeste/20">
              <Trophy size={16} className="text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-white group-hover:text-celeste transition-colors">
                Tecnoprop
              </div>
              <div className="text-[10px] font-semibold tracking-widest text-celeste/80 uppercase">
                Prode 2026
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  pathname === link.href
                    ? 'bg-celeste/10 text-celeste'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA / User */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    pathname === '/dashboard'
                      ? 'bg-celeste/10 text-celeste'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.05]'
                  )}
                >
                  <User size={15} />
                  {user.nombre}
                  <span className="text-celeste font-bold font-mono">
                    {user.total_points} pts
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-white/40 hover:text-white/70 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white px-3 py-2 transition-colors">
                  Ingresar
                </Link>
                <Link href="/register" className="btn-brand text-sm py-2 px-5">
                  Participar gratis
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-white/70"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 pt-16 bg-bg-0/98 backdrop-blur-xl md:hidden">
          <div className="flex flex-col p-6 gap-2">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-4 py-3 rounded-xl text-base font-medium transition-all',
                  pathname === link.href
                    ? 'bg-celeste/10 text-celeste'
                    : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="btn-ghost text-center">
                    Mi cuenta · {user.total_points} pts
                  </Link>
                  <button onClick={handleLogout} className="text-white/40 text-sm text-center py-2">
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-brand text-center">
                    Participar gratis
                  </Link>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-ghost text-center text-sm">
                    Ya tengo cuenta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spacer para el fixed navbar */}
      <div className="h-16" />
    </>
  )
}
