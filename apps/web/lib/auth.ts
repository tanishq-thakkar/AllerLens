import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
}

export interface UserProfile {
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

// Authentication functions
export const auth = {
  // Sign up with email and password
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { data, error }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// User profile functions
export const userProfile = {
  // Create user profile
  async createProfile(userId: string, profileData: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        ...profileData,
      })
      .select()
      .single()
    return { data, error }
  },

  // Get user profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    return { data, error }
  },

  // Delete user profile
  async deleteProfile(userId: string) {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)
    return { error }
  },
}

// Allergy management functions
export const allergies = {
  // Get all allergy categories
  async getCategories() {
    const { data, error } = await supabase
      .from('allergy_categories')
      .select('*')
      .order('name')
    return { data, error }
  },

  // Get user allergies
  async getUserAllergies(userId: string) {
    const { data, error } = await supabase
      .from('user_allergies')
      .select(`
        *,
        allergy_categories (
          id,
          name,
          description,
          icon
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
    return { data, error }
  },

  // Add user allergy
  async addUserAllergy(userId: string, allergyCategoryId: string, severity: 'mild' | 'moderate' | 'severe' = 'moderate', notes?: string) {
    const { data, error } = await supabase
      .from('user_allergies')
      .insert({
        user_id: userId,
        allergy_category_id: allergyCategoryId,
        severity,
        notes,
      })
      .select()
      .single()
    return { data, error }
  },

  // Update user allergy
  async updateUserAllergy(allergyId: string, updates: { severity?: string; notes?: string; is_active?: boolean }) {
    const { data, error } = await supabase
      .from('user_allergies')
      .update(updates)
      .eq('id', allergyId)
      .select()
      .single()
    return { data, error }
  },

  // Remove user allergy
  async removeUserAllergy(allergyId: string) {
    const { error } = await supabase
      .from('user_allergies')
      .delete()
      .eq('id', allergyId)
    return { error }
  },

  // Add custom allergy
  async addCustomAllergy(userId: string, name: string, description?: string, severity: 'mild' | 'moderate' | 'severe' = 'moderate') {
    const { data, error } = await supabase
      .from('custom_allergies')
      .insert({
        user_id: userId,
        name,
        description,
        severity,
      })
      .select()
      .single()
    return { data, error }
  },

  // Get custom allergies
  async getCustomAllergies(userId: string) {
    const { data, error } = await supabase
      .from('custom_allergies')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
    return { data, error }
  },

  // Update custom allergy
  async updateCustomAllergy(allergyId: string, updates: { name?: string; description?: string; severity?: string; is_active?: boolean }) {
    const { data, error } = await supabase
      .from('custom_allergies')
      .update(updates)
      .eq('id', allergyId)
      .select()
      .single()
    return { data, error }
  },

  // Remove custom allergy
  async removeCustomAllergy(allergyId: string) {
    const { error } = await supabase
      .from('custom_allergies')
      .delete()
      .eq('id', allergyId)
    return { error }
  },
}

