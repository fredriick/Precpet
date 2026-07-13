"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { exportUserData } from "@/lib/storage"

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

function hashPassword(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return "h_" + btoa(hash.toString(36))
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
    const stored = getStoredUser()
    if (stored) {
      setUser(stored)
    } else {
      const guest: AuthUser = {
        email: `guest_${Date.now()}@local.precept`,
        name: "Guest",
        createdAt: new Date().toISOString(),
      }
      setStoredUser(guest)
      setUser(guest)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase()
    const stored = localStorage.getItem(`precept_cred_${normalizedEmail}`)
    if (!stored) return false
    try {
      const cred = JSON.parse(stored)
      if (cred.password === hashPassword(password)) {
        const authUser: AuthUser = { email: normalizedEmail, name: cred.name, createdAt: cred.createdAt }
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
    const normalizedEmail = email.trim().toLowerCase()
    if (localStorage.getItem(`precept_cred_${normalizedEmail}`)) return false

    const createdAt = new Date().toISOString()
    localStorage.setItem(`precept_cred_${normalizedEmail}`, JSON.stringify({ name, email: normalizedEmail, password: hashPassword(password), createdAt }))

    const authUser: AuthUser = { email: normalizedEmail, name: name.trim(), createdAt }
    setStoredUser(authUser)
    setUser(authUser)
    return true
  }, [])

  const logout = useCallback(() => {
    try {
      const data = exportUserData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `precept-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Silently fail backup
    }
    removeStoredUser()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function isGuestUser(user: AuthUser | null): boolean {
  return !!user && user.email.endsWith("@local.precept")
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
