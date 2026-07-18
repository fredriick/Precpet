"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PreceptLogo } from "@/components/precept-logo"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { user, login } = useAuth()

  useEffect(() => {
    if (user) router.replace("/dashboard")
  }, [user, router])

  if (user) return null
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validate = () => {
    const errs: typeof errors = {}
    const trimmedEmail = email.trim()
    if (!trimmedEmail) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) errs.email = "Invalid email format"
    if (!password) errs.password = "Password is required"
    else if (password.length < 6) errs.password = "Password must be at least 6 characters"
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      const { error } = await login(email, password)
      if (error) {
        setErrors({ general: error })
      } else {
        router.replace("/dashboard")
      }
    } catch {
      setErrors({ general: "Something went wrong. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.03] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <button onClick={() => router.push("/")} className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_8px_24px_-4px_rgba(16,185,129,0.4)] hover:scale-110 hover:shadow-[0_12px_32px_-4px_rgba(16,185,129,0.5)] active:scale-95 transition-all duration-200" aria-label="Go back to home">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-8 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
              <PreceptLogo className="w-10 h-10 relative" />
            </div>
            <span className="font-bold text-xl text-white">Precept</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Welcome back</h1>
          <p className="text-white/70 mt-2">Sign in to continue your training</p>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {errors.general && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <p className="text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white/80">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })) }}
                required
                className={`w-full h-12 px-4 rounded-xl bg-white/[0.04] border text-white placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all ${
                  errors.email ? "border-red-500/50 focus:ring-red-500/40" : "border-white/[0.08] focus:ring-emerald-500/40 focus:border-emerald-500/40"
                }`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white/80">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })) }}
                  required
                  minLength={6}
                  className={`w-full h-12 px-4 rounded-xl bg-white/[0.04] border text-white placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all pr-12 ${
                    errors.password ? "border-red-500/50 focus:ring-red-500/40" : "border-white/[0.08] focus:ring-emerald-500/40 focus:border-emerald-500/40"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative group w-full"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl opacity-60 group-hover:opacity-100 blur transition duration-300" />
              <div className="relative w-full h-12 rounded-xl bg-[#0a0a0f] text-base font-semibold text-white group-hover:bg-transparent transition-colors disabled:opacity-50">
                {loading ? "Signing in..." : "Sign In"}
              </div>
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/60 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
