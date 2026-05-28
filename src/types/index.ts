// ================================================================
// TIPOS — Prode Digital Tecnoprop 2026
// ================================================================

export type UserStatus = 'pending_verification' | 'active' | 'suspended'
export type UserRole = 'user' | 'admin'
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'cancelled'
export type MatchPhase = 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
export type PointReason =
  | 'exact_result'
  | 'correct_winner'
  | 'correct_draw'
  | 'champion_bonus'
  | 'runner_up_bonus'
  | 'top_scorer_bonus'
  | 'final_exact_bonus'
  | 'referral_bonus'

// ----------------------------------------------------------------
// Entidades principales
// ----------------------------------------------------------------

export interface User {
  id: string
  created_at: string
  updated_at: string
  nombre: string
  apellido: string
  email: string
  whatsapp: string | null
  instagram_handle: string
  instagram_confirmed: boolean
  ciudad: string | null
  status: UserStatus
  role: UserRole
  email_verified_at: string | null
  total_points: number
  referral_code: string
  referred_by: string | null
}

export interface Match {
  id: string
  created_at: string
  match_number: number | null
  phase: MatchPhase
  group_name: string | null
  team_home: string
  team_away: string
  flag_home: string | null
  flag_away: string | null
  country_code_home: string | null
  country_code_away: string | null
  stadium: string | null
  city_venue: string | null
  country_venue: string | null
  match_date: string
  status: MatchStatus
  is_locked: boolean
  score_home: number | null
  score_away: number | null
  api_match_id: string | null
}

export interface Prediction {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  match_id: string
  pred_home: number
  pred_away: number
  points_earned: number | null
}

export interface SpecialPrediction {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  champion_team: string | null
  runner_up_team: string | null
  top_scorer: string | null
  final_score_home: number | null
  final_score_away: number | null
  points_earned: number
}

export interface League {
  id: string
  created_at: string
  name: string
  description: string | null
  owner_id: string
  invite_code: string
  is_public: boolean
  max_members: number
}

export interface LeagueMember {
  id: string
  joined_at: string
  league_id: string
  user_id: string
}

export interface PointsLog {
  id: string
  created_at: string
  user_id: string
  match_id: string | null
  prediction_id: string | null
  reason: PointReason
  points: number
  description: string | null
}

export interface Referral {
  id: string
  created_at: string
  referrer_id: string
  referred_id: string
  points_awarded: boolean
}

// ----------------------------------------------------------------
// Vistas y tipos compuestos
// ----------------------------------------------------------------

export interface RankingEntry {
  id: string
  nombre: string
  apellido: string
  ciudad: string | null
  instagram_handle: string
  total_points: number
  referral_code: string
  position: number
  exact_results: number
  correct_results: number
  total_predicted: number
}

// Match con predicción del usuario actual
export interface MatchWithPrediction extends Match {
  prediction?: Prediction | null
}

// Liga con conteo de miembros y posición del usuario actual
export interface LeagueWithStats extends League {
  member_count: number
  user_position?: number
  owner?: Pick<User, 'nombre' | 'apellido' | 'instagram_handle'>
}

// ----------------------------------------------------------------
// Formularios
// ----------------------------------------------------------------

export interface RegisterFormData {
  nombre: string
  apellido: string
  email: string
  whatsapp: string
  instagram_handle: string
  ciudad: string
  password: string
  instagram_confirmed: boolean
  referral_code?: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface PredictionFormData {
  pred_home: number
  pred_away: number
}

// ----------------------------------------------------------------
// Utilidades
// ----------------------------------------------------------------

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// Puntos por tipo de resultado
export const POINTS_CONFIG = {
  EXACT_RESULT: 3,
  CORRECT_WINNER: 1,
  CORRECT_DRAW: 1,
  CHAMPION_BONUS: 10,
  RUNNER_UP_BONUS: 5,
  TOP_SCORER_BONUS: 5,
  FINAL_EXACT_BONUS: 5,
  REFERRAL_BONUS: 1,
} as const

export const PHASE_LABELS: Record<MatchPhase, string> = {
  group: 'Fase de grupos',
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos de final',
  quarter_final: 'Cuartos de final',
  semi_final: 'Semifinal',
  third_place: 'Tercer puesto',
  final: 'Final',
}

export const MUNDIAL_START_DATE = new Date('2026-06-11T20:00:00-05:00')
