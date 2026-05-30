// ================================================================
// database.types.ts
// Tipos de la base de datos — formato compatible con @supabase/supabase-js v2
//
// Para regenerar después de cambios al schema:
// npx supabase gen types typescript --project-id TU_PROJECT_ID > src/lib/supabase/database.types.ts
// ================================================================

export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
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
        Insert: {
          id: string
          nombre: string
          apellido: string
          email: string
          whatsapp?: string | null
          instagram_handle: string
          instagram_confirmed?: boolean
          ciudad?: string | null
          status?: 'pending_verification' | 'active' | 'suspended'
          role?: 'user' | 'admin'
          email_verified_at?: string | null
          total_points?: number
          referral_code?: string
          referred_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
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
      }
      matches: {
        Row: {
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
        Insert: {
          id?: string
          created_at?: string
          match_number?: number | null
          phase?: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
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
        Update: {
          id?: string
          created_at?: string
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
      }
      predictions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          match_id: string
          pred_home: number
          pred_away: number
          points_earned: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          match_id: string
          pred_home: number
          pred_away: number
          points_earned?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          match_id?: string
          pred_home?: number
          pred_away?: number
          points_earned?: number | null
        }
      }
      special_predictions: {
        Row: {
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
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          champion_team?: string | null
          runner_up_team?: string | null
          top_scorer?: string | null
          final_score_home?: number | null
          final_score_away?: number | null
          points_earned?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          champion_team?: string | null
          runner_up_team?: string | null
          top_scorer?: string | null
          final_score_home?: number | null
          final_score_away?: number | null
          points_earned?: number
        }
      }
      leagues: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          owner_id: string
          invite_code: string
          is_public: boolean
          max_members: number
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          owner_id: string
          invite_code?: string
          is_public?: boolean
          max_members?: number
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          owner_id?: string
          invite_code?: string
          is_public?: boolean
          max_members?: number
        }
      }
      league_members: {
        Row: {
          id: string
          joined_at: string
          league_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          league_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          league_id?: string
          user_id?: string
        }
      }
      points_log: {
        Row: {
          id: string
          created_at: string
          user_id: string
          match_id: string | null
          prediction_id: string | null
          reason: string
          points: number
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          match_id?: string | null
          prediction_id?: string | null
          reason: string
          points: number
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          match_id?: string | null
          prediction_id?: string | null
          reason?: string
          points?: number
          description?: string | null
        }
      }
      referrals: {
        Row: {
          id: string
          created_at: string
          referrer_id: string
          referred_id: string
          points_awarded: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          referrer_id: string
          referred_id: string
          points_awarded?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          referrer_id?: string
          referred_id?: string
          points_awarded?: boolean
        }
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
    Enums: {
      user_status: 'pending_verification' | 'active' | 'suspended'
      user_role: 'user' | 'admin'
      match_status: 'scheduled' | 'live' | 'finished' | 'cancelled'
      match_phase: 'group' | 'round_of_32' | 'round_of_16' | 'quarter_final' | 'semi_final' | 'third_place' | 'final'
      point_reason: 'exact_result' | 'correct_winner' | 'correct_draw' | 'champion_bonus' | 'runner_up_bonus' | 'top_scorer_bonus' | 'final_exact_bonus' | 'referral_bonus'
    }
  }
}
