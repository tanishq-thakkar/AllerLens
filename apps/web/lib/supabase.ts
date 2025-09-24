import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are missing!')
  console.error('Please create a .env.local file with:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here')
}

// Create Supabase client with fallback
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Database types (we'll generate these later)
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      allergy_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          severity_levels: string[]
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          severity_levels?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          severity_levels?: string[]
          created_at?: string
        }
      }
      user_allergies: {
        Row: {
          id: string
          user_id: string
          allergy_category_id: string
          severity: 'mild' | 'moderate' | 'severe'
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          allergy_category_id: string
          severity?: 'mild' | 'moderate' | 'severe'
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          allergy_category_id?: string
          severity?: 'mild' | 'moderate' | 'severe'
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      custom_allergies: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          severity: 'mild' | 'moderate' | 'severe'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          severity?: 'mild' | 'moderate' | 'severe'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          severity?: 'mild' | 'moderate' | 'severe'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
