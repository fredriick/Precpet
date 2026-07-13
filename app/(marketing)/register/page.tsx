"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PreceptLogo } from "@/components/precept-logo"
import { useAuth, isGuestUser } from "@/contexts/auth-context"

export default function RegisterPage() {
  const router = useRouter()
  const { user, register } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (user && !isGuestUser(user)) router.replace("/dashboard")
  }, [user, router])

  const isGuest = isGuestUser(user)

  const validate = () => {
    const errs: typeof errors = {}
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) errs.name = "Name is required"
    else if (trimmedName.length < 2) errs.name = "Name must be at least 2 characters"
    if (!trimmedEmail) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) errs.email = "Invalid email format"
    if (!password) errs.password = "Password is required"
    else if (password.length < 8) errs.password = "Password must be at least 8 characters"
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) errs.password = "Password must include uppercase, lowercase, and a number"
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password"
    else if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match"
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      const success = await register(name, email, password)
      if (success) {
        router.replace("/dashboard")
      } else {
        setErrors({ general: "An account with this email already exists" })
      }
    } catch {
      setErrors({ general: "Something went wrong. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: keyof typeof errors) =>
    `w-full h-12 px-4 rounded-xl bg-white/[0.04] border text-white placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all ${
      errors[field] ? "border-red-500/50 focus:ring-red-500/40" : "border-white/[0.08] focus:ring-emerald-500/40 focus:border-emerald-500/40"
    }`

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
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Create your account</h1>
          <p className="text-white/70 mt-2">Start your journey to becoming a better athlete</p>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {isGuest && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center">
                <p className="text-emerald-400 text-sm font-medium">Your practice data will be preserved when you create an account.</p>
              </div>
            )}

            {errors.general && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <p className="text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-white/80">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: undefined })) }}
                required
                className={inputClass("name")}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

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
                className={inputClass("email")}
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
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })) }}
                  required
                  minLength={8}
                  className={`${inputClass("password")} pr-12`}
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
              {!errors.password && password && (
                <div className="flex gap-1 mt-1">
                  {["uppercase", "lowercase", "number", "8+ chars"].map((req, i) => {
                    const met = i === 0 ? /[A-Z]/.test(password) : i === 1 ? /[a-z]/.test(password) : i === 2 ? /\d/.test(password) : password.length >= 8
                    return (
                      <span key={req} className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${met ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.04] text-white/30"}`}>
                        {met ? (
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="9" />
                          </svg>
                        )}
                        {req}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirmPassword: undefined })) }}
                  required
                  className={`${inputClass("confirmPassword")} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}
                >
                  {showConfirm ? (
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
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative group w-full"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl opacity-60 group-hover:opacity-100 blur transition duration-300" />
              <div className="relative w-full h-12 rounded-xl bg-[#0a0a0f] text-base font-semibold text-white group-hover:bg-transparent transition-colors disabled:opacity-50">
                {loading ? "Creating account..." : "Create Account"}
              </div>
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/60 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
