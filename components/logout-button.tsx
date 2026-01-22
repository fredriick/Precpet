"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export function LogoutButton() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.replace("/")
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Account</h3>
      <p className="text-foreground font-medium mb-4">{user?.email}</p>
      <button
        onClick={handleLogout}
        className="w-full px-4 py-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive font-medium text-sm transition-colors"
      >
        Sign Out
      </button>
    </div>
  )
}
