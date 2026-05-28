// ================================================================
// database.types.ts
// Generado con: npx supabase gen types typescript --project-id TU_PROJECT_ID
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
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at' | 'referral_code'> & { referral_code?: string }
        Update: Partial<Database['public']['Tables']['users']['Row']>
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
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['matches']['Row']>
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
        Insert: Omit<Database['public']['Tables']['predictions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['predictions']['Row']>
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
        Insert: Omit<Database['public']['Tables']['special_predictions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['special_predictions']['Row']>
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
        Insert: Omit<Database['public']['Tables']['leagues']['Row'], 'id' | 'created_at' | 'invite_code'> & { invite_code?: string }
        Update: Partial<Database['public']['Tables']['leagues']['Row']>
      }
      league_members: {
        Row: {
          id: string
          joined_at: string
          league_id: string
          user_id: string
        }
        Insert: Omit<Database['public']['Tables']['league_members']['Row'], 'id' | 'joined_at'>
        Update: Partial<Database['public']['Tables']['league_members']['Row']>
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
        Insert: Omit<Database['public']['Tables']['points_log']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['points_log']['Row']>
      }
      referrals: {
        Row: {
          id: string
          created_at: string
          referrer_id: string
          referred_id: string
          points_awarded: boolean
        }
        Insert: Omit<Database['public']['Tables']['referrals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['referrals']['Row']>
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
