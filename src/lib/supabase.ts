import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}


export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      albums: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          album_id: string
          user_id: string
          filename: string
          original_name: string
          file_size: number
          mime_type: string
          storage_path: string
          public_url: string
          alt_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          album_id: string
          user_id: string
          filename: string
          original_name: string
          file_size: number
          mime_type: string
          storage_path: string
          public_url: string
          alt_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          album_id?: string
          user_id?: string
          filename?: string
          original_name?: string
          file_size?: number
          mime_type?: string
          storage_path?: string
          public_url?: string
          alt_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
