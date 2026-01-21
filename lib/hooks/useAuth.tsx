'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types/database.types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string }) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const initialized = useRef(false)
  const profileCache = useRef<Map<string, Profile>>(new Map())
  const supabaseRef = useRef(getSupabaseClient())

  // Función helper para cargar perfil - NO es un hook
  const loadProfile = async (userId: string): Promise<Profile | null> => {
    if (profileCache.current.has(userId)) {
      return profileCache.current.get(userId)!
    }

    try {
      const { data, error } = await supabaseRef.current
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !data) {
        return null
      }

      profileCache.current.set(userId, data)
      return data
    } catch {
      return null
    }
  }

  const refreshProfile = useCallback(async () => {
    if (user) {
      profileCache.current.delete(user.id)
      const profileData = await loadProfile(user.id)
      setProfile(profileData)
    }
  }, [user])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const supabase = supabaseRef.current

    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (initialSession?.user) {
          setSession(initialSession)
          setUser(initialSession.user)
          const profileData = await loadProfile(initialSession.user.id)
          setProfile(profileData)
        }
      } catch (error) {
        // Error silencioso
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, newSession: any) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)

        if (newSession?.user) {
          const profileData = await loadProfile(newSession.user.id)
          setProfile(profileData)
        } else {
          setProfile(null)
          profileCache.current.clear()
        }

        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseRef.current.auth.signInWithPassword({
      email,
      password,
    })

    return { error: error as Error | null }
  }

  const signUp = async (
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string }
  ) => {
    const { data, error } = await supabaseRef.current.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    // Si el registro fue exitoso, crear el perfil usando la API
    if (!error && data.user) {
      try {
        const response = await fetch('/api/auth/create-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.user.id,
            email: data.user.email,
            firstName: metadata?.first_name || '',
            lastName: metadata?.last_name || '',
          }),
        })

        if (!response.ok) {
          console.error('Error creating profile via API')
        }
      } catch (profileError) {
        console.error('Error calling create-profile API:', profileError)
        // No devolvemos error aquí porque el usuario ya fue creado
      }
    }

    return { error: error as Error | null }
  }

  const signOut = async () => {
    await supabaseRef.current.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
    window.location.href = '/'
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabaseRef.current.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cuenta/reset-password`,
    })

    return { error: error as Error | null }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }

    const { error } = await supabaseRef.current
      .from('perfiles')
      .update(updates as any)
      .eq('id', user.id)

    if (!error) {
      await refreshProfile()
    }

    return { error: error as Error | null }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAdmin: profile?.rol === 'admin',
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
