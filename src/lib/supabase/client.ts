import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          subscription_tier: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          subscription_tier?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          subscription_tier?: string
        }
      }
      transcriptions: {
        Row: {
          id: string
          user_id: string
          title: string
          source_type: string
          audio_url: string | null
          original_file: string | null
          processed_score: any
          kinko_notation: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          source_type: string
          audio_url?: string | null
          original_file?: string | null
          processed_score?: any
          kinko_notation?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          source_type?: string
          audio_url?: string | null
          original_file?: string | null
          processed_score?: any
          kinko_notation?: any
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          transcription_id: string
          status: string
          progress: number
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transcription_id: string
          status: string
          progress?: number
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transcription_id?: string
          status?: string
          progress?: number
          error_message?: string | null
          created_at?: string
        }
      }
    }
  }
}