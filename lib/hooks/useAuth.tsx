'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
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

  const refreshProfile = useCallback(async () => {
    if (!user) return
    
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error refreshing profile:', err)
    }
  }, [user])

  useEffect(() => {
    const supabase = getSupabaseClient()
    let isCancelled = false

    // Función para cargar perfil
    const fetchProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', userId)
          .single()
        return data
      } catch {
        return null
      }
    }

    // Timeout de seguridad - reducido a 2 segundos
    const timeout = setTimeout(() => {
      if (!isCancelled) {
        console.warn('Auth timeout - forcing isLoading to false')
        setIsLoading(false)
      }
    }, 2000)

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, currentSession: Session | null) => {
        if (isCancelled) return
        
        clearTimeout(timeout)
        
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          // Usar setTimeout para evitar deadlock con Supabase
          setTimeout(async () => {
            if (isCancelled) return
            const profileData = await fetchProfile(currentSession.user.id)
            if (!isCancelled) {
              setProfile(profileData)
              setIsLoading(false)
            }
          }, 0)
        } else {
          setProfile(null)
          setIsLoading(false)
        }
      }
    )

    // Obtener sesión inicial
    supabase.auth.getSession().then(async (response: any) => {
      const currentSession = response?.data?.session as Session | null
      if (isCancelled) return
      
      clearTimeout(timeout)
      
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        const profileData = await fetchProfile(currentSession.user.id)
        if (!isCancelled) {
          setProfile(profileData)
        }
      }
      
      if (!isCancelled) {
        setIsLoading(false)
      }
    }).catch(() => {
      if (!isCancelled) {
        setIsLoading(false)
      }
    })

    return () => {
      isCancelled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error as Error | null }
  }, [])

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string }
  ) => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
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
      }
    }

    return { error: error as Error | null }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
    window.location.href = '/'
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cuenta/reset-password`,
    })
    return { error: error as Error | null }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') }

    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('perfiles')
      .update(updates as any)
      .eq('id', user.id)

    if (!error) {
      // Refresh profile after update
      const { data } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setProfile(data)
      }
    }

    return { error: error as Error | null }
  }, [user])

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
