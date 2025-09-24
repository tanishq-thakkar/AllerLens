'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from './LoginForm'
import SignUpForm from './SignUpForm'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth()
  const [showSignUp, setShowSignUp] = useState(false)
  
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url_here'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show setup instructions if Supabase is not configured
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">⚙️</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Supabase Setup Required</h2>
            <p className="text-gray-600">AllerLens needs to be configured with Supabase to enable user authentication and data storage.</p>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="font-bold text-blue-800 mb-2">📋 Quick Setup Steps:</h3>
              <ol className="text-blue-700 space-y-2 text-sm">
                <li>1. Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                <li>2. Run the database schema from <code className="bg-blue-100 px-1 rounded">SUPABASE_SETUP.md</code></li>
                <li>3. Create <code className="bg-blue-100 px-1 rounded">apps/web/.env.local</code> with your Supabase credentials</li>
                <li>4. Restart the development server</li>
              </ol>
            </div>
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h3 className="font-bold text-gray-800 mb-2">🔧 Environment Variables Needed:</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
              </pre>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Once configured, you'll have access to user authentication, 
                allergy tracking, and menu analysis history.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showSignUp ? (
            <SignUpForm 
              onSuccess={() => setShowSignUp(false)}
              onSwitchToLogin={() => setShowSignUp(false)}
            />
          ) : (
            <LoginForm 
              onSuccess={() => {}}
              onSwitchToSignUp={() => setShowSignUp(true)}
            />
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
