"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"

const AUTH_KEY = "precept_auth_user"

export interface AuthUser {
  email: string
  name: string
  createdAt: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setStoredUser(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

function removeStoredUser(): void {
  localStorage.removeItem(AUTH_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(getStoredUser())
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const stored = localStorage.getItem(`precept_cred_${email}`)
    if (!stored) return false
    try {
      const cred = JSON.parse(stored)
      if (cred.password === password) {
        const authUser: AuthUser = { email, name: cred.name, createdAt: cred.createdAt }
        setStoredUser(authUser)
        setUser(authUser)
        return true
      }
    } catch {
      return false
    }
    return false
  }, [])

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    if (localStorage.getItem(`precept_cred_${email}`)) return false

    const createdAt = new Date().toISOString()
    localStorage.setItem(`precept_cred_${email}`, JSON.stringify({ name, email, password, createdAt }))

    const authUser: AuthUser = { email, name, createdAt }
    setStoredUser(authUser)
    setUser(authUser)
    return true
  }, [])

  const logout = useCallback(() => {
    removeStoredUser()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
