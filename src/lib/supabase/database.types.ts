// ================================================================
// database.types.ts
// Decoupled clean typescript definitions to break circular references
// ================================================================

export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[]

// ----------------------------------------------------------------
// Table types (flat and non-recursive)
// ----------------------------------------------------------------

// Users
export interface UserRow {
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
  status: 'pending_verification' | 'active' | 'suspended'
  role: 'user' | 'admin'
  email_verified_at: string | null
  total_points: number
  referral_code: string
  referred_by: string | null
}

export interface UserInsert {
  id: string
  nombre: string
  apellido: string
  email: string
  whatsapp?: string | null
  instagram_handle: string
  instagram_confirmed: boolean
  ciudad?: string | null
  status?: 'pending_verification' | 'active' | 'suspended'
  role?: 'user' | 'admin'
  email_verified_at?: string | null
  total_points?: number
  referral_code?: string
  referred_by?: string | null
}

export interface UserUpdate {
  id?: string
  nombre?: string
  apellido?: string
  email?: string
  whatsapp?: string | null
  instagram_handle?: string
  instagram_confirmed?: boolean
  ciudad?: string | null
  status?: 'pending_verification' | 'active' | 'suspended'
  role?: 'user' | 'admin'
  email_verified_at?: string | null
  total_points?: number
  referral_code?: string
  referred_by?: string | null
}

// Matches
export interface MatchRow {
  id: string
  created_at: string
  match_number: number | null
  phase: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
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
  status: 'scheduled' | 'live' | 'finished' | 'cancelled'
  is_locked: boolean
  score_home: number | null
  score_away: number | null
  api_match_id: string | null
}

export interface MatchInsert {
  id?: string
  match_number?: number | null
  phase: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
  group_name?: string | null
  team_home: string
  team_away: string
  flag_home?: string | null
  flag_away?: string | null
  country_code_home?: string | null
  country_code_away?: string | null
  stadium?: string | null
  city_venue?: string | null
  country_venue?: string | null
  match_date: string
  status?: 'scheduled' | 'live' | 'finished' | 'cancelled'
  is_locked?: boolean
  score_home?: number | null
  score_away?: number | null
  api_match_id?: string | null
}

export interface MatchUpdate {
  id?: string
  match_number?: number | null
  phase?: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
  group_name?: string | null
  team_home?: string
  team_away?: string
  flag_home?: string | null
  flag_away?: string | null
  country_code_home?: string | null
  country_code_away?: string | null
  stadium?: string | null
  city_venue?: string | null
  country_venue?: string | null
  match_date?: string
  status?: 'scheduled' | 'live' | 'finished' | 'cancelled'
  is_locked?: boolean
  score_home?: number | null
  score_away?: number | null
  api_match_id?: string | null
}

// Predictions
export interface PredictionRow {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  match_id: string
  pred_home: number
  pred_away: number
  points_earned: number | null
}

export interface PredictionInsert {
  id?: string
  user_id: string
  match_id: string
  pred_home: number
  pred_away: number
  points_earned?: number | null
}

export interface PredictionUpdate {
  id?: string
  user_id?: string
  match_id?: string
  pred_home?: number
  pred_away?: number
  points_earned?: number | null
}

// Special Predictions
export interface SpecialPredictionRow {
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

export interface SpecialPredictionInsert {
  id?: string
  user_id: string
  champion_team?: string | null
  runner_up_team?: string | null
  top_scorer?: string | null
  final_score_home?: number | null
  final_score_away?: number | null
  points_earned?: number
}

export interface SpecialPredictionUpdate {
  id?: string
  user_id?: string
  champion_team?: string | null
  runner_up_team?: string | null
  top_scorer?: string | null
  final_score_home?: number | null
  final_score_away?: number | null
  points_earned?: number
}

// Leagues
export interface LeagueRow {
  id: string
  created_at: string
  name: string
  description: string | null
  owner_id: string
  invite_code: string
  is_public: boolean
  max_members: number
}

export interface LeagueInsert {
  id?: string
  name: string
  description?: string | null
  owner_id: string
  invite_code?: string
  is_public?: boolean
  max_members?: number
}

export interface LeagueUpdate {
  id?: string
  name?: string
  description?: string | null
  owner_id?: string
  invite_code?: string
  is_public?: boolean
  max_members?: number
}

// League Members
export interface LeagueMemberRow {
  id: string
  joined_at: string
  league_id: string
  user_id: string
}

export interface LeagueMemberInsert {
  id?: string
  league_id: string
  user_id: string
}

export interface LeagueMemberUpdate {
  id?: string
  league_id?: string
  user_id?: string
}

// Points Log
export interface PointsLogRow {
  id: string
  created_at: string
  user_id: string
  match_id: string | null
  prediction_id: string | null
  reason: string
  points: number
  description: string | null
}

export interface PointsLogInsert {
  id?: string
  user_id: string
  match_id?: string | null
  prediction_id?: string | null
  reason: string
  points: number
  description?: string | null
}

export interface PointsLogUpdate {
  id?: string
  user_id?: string
  match_id?: string | null
  prediction_id?: string | null
  reason?: string
  points?: number
  description?: string | null
}

// Referrals
export interface ReferralRow {
  id: string
  created_at: string
  referrer_id: string
  referred_id: string
  points_awarded: boolean
}

export interface ReferralInsert {
  id?: string
  referrer_id: string
  referred_id: string
  points_awarded?: boolean
}

export interface ReferralUpdate {
  id?: string
  referrer_id?: string
  referred_id?: string
  points_awarded?: boolean
}

// ----------------------------------------------------------------
// Database Interface
// ----------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow
        Insert: UserInsert
        Update: UserUpdate
      }
      matches: {
        Row: MatchRow
        Insert: MatchInsert
        Update: MatchUpdate
      }
      predictions: {
        Row: PredictionRow
        Insert: PredictionInsert
        Update: PredictionUpdate
      }
      special_predictions: {
        Row: SpecialPredictionRow
        Insert: SpecialPredictionInsert
        Update: SpecialPredictionUpdate
      }
      leagues: {
        Row: LeagueRow
        Insert: LeagueInsert
        Update: LeagueUpdate
      }
      league_members: {
        Row: LeagueMemberRow
        Insert: LeagueMemberInsert
        Update: LeagueMemberUpdate
      }
      points_log: {
        Row: PointsLogRow
        Insert: PointsLogInsert
        Update: PointsLogUpdate
      }
      referrals: {
        Row: ReferralRow
        Insert: ReferralInsert
        Update: ReferralUpdate
      }
    }
    Views: {
      ranking_general: {
        Row: {
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
      }
    }
    Functions: {
      score_match: {
        Args: { p_match_id: string }
        Returns: number
      }
      lock_started_matches: {
        Args: Record<string, never>
        Returns: void
      }
    }
  }
}
