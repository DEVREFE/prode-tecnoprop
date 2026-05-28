import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Match, Prediction, MatchStatus } from '@/types'

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatear fecha de partido
export function formatMatchDate(dateStr: string): string {
  return format(new Date(dateStr), "d 'de' MMM · HH:mm", { locale: es })
}

// Tiempo relativo
export function timeFromNow(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es })
}

// Calcular puntos de una predicción (lado cliente para preview)
export function calcPoints(
  pred: Pick<Prediction, 'pred_home' | 'pred_away'>,
  match: Pick<Match, 'score_home' | 'score_away'>
): number {
  if (match.score_home === null || match.score_away === null) return 0

  // Resultado exacto
  if (pred.pred_home === match.score_home && pred.pred_away === match.score_away) {
    return 3
  }

  const predSign = Math.sign(pred.pred_home - pred.pred_away)
  const realSign = Math.sign(match.score_home - match.score_away)

  // Ganador o empate correcto
  if (predSign === realSign) return 1

  return 0
}

// Obtener status visual de un partido
export function getMatchStatusLabel(match: Match): {
  label: string
  color: 'green' | 'yellow' | 'gray' | 'red'
} {
  if (match.status === 'live') return { label: 'En vivo', color: 'green' }
  if (match.status === 'finished') return { label: 'Finalizado', color: 'gray' }
  if (match.status === 'cancelled') return { label: 'Cancelado', color: 'red' }
  if (match.is_locked) return { label: 'Cerrado', color: 'red' }
  if (isPast(new Date(match.match_date))) return { label: 'Por iniciar', color: 'yellow' }
  return { label: formatMatchDate(match.match_date), color: 'gray' }
}

// Validar Instagram handle
export function normalizeInstagram(handle: string): string {
  return handle.replace(/^@/, '').toLowerCase().trim()
}

// Formatear número con separadores de miles
export function formatNumber(n: number): string {
  return n.toLocaleString('es-AR')
}

// Obtener iniciales para avatar
export function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

// Color de avatar basado en nombre (determinístico)
const AVATAR_COLORS = [
  'from-celeste to-azul',
  'from-purple-500 to-purple-700',
  'from-emerald-500 to-emerald-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-indigo-500 to-indigo-700',
]

export function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

// Countdown al Mundial
export function getCountdown(target: Date): {
  days: number
  hours: number
  minutes: number
  seconds: number
  started: boolean
} {
  const now = new Date()
  const diff = target.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, started: true }
  }

  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    started: false,
  }
}
