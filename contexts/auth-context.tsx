"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import type { Session, User } from "@supabase/supabase-js"

const AUTH_KEY = "precept_auth_user"

export interface AuthUser {
  id: string
  email: string
  name: string
  createdAt: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  register: (name: string, email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toAuthUser(user: User, profileName?: string): AuthUser {
  const metaName = (user.user_metadata?.name as string) || profileName || ""
  const email = user.email || ""
  return {
    id: user.id,
    email,
    name: metaName || email.split("@")[0] || "Athlete",
    createdAt: user.created_at || new Date().toISOString(),
  }
}

async function fetchProfileName(userId: string): Promise<string | undefined> {
  try {
    const supabase = getSupabaseBrowser()
    const { data } = await supabase.from("profiles").select("name").eq("id", userId).single()
    return data?.name
  } catch {
    return undefined
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    const hydrate = async (session: Session | null) => {
      if (!session?.user) {
        setUser(null)
        setIsLoading(false)
        return
      }
      const name = await fetchProfileName(session.user.id)
      setUser(toAuthUser(session.user, name))
      setIsLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => hydrate(data.session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrate(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const supabase = getSupabaseBrowser()
    const cleanEmail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { name: name.trim() } },
    })
    if (error) return { error: error.message }
    if (data.session) return { error: null }
    // Some Supabase configurations return the user without a `session` object
    // on signUp even when email confirmation is disabled. The account is
    // already active, so sign in directly to obtain a session.
    if (data.user) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })
      if (loginError) return { error: loginError.message }
      return { error: null }
    }
    return { error: "Check your email to confirm your account before signing in." }
  }, [])

  const logout = useCallback(async () => {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    setUser(null)
    try {
      localStorage.removeItem(AUTH_KEY)
    } catch {
      // ignore
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
