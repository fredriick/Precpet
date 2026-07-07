"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PreceptLogo } from "@/components/precept-logo"
import { useAuth } from "@/contexts/auth-context"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const success = await register(name, email, password)
      if (success) {
        router.replace("/dashboard")
      } else {
        setError("An account with this email already exists")
      }
    } catch {
      setError("Something went wrong")
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Create your account</h1>
          <p className="text-white/40 mt-2">Start your journey to becoming a better athlete</p>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-white/60">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white/60">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white/60">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full h-12 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              />
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

        <p className="text-center text-sm text-white/30 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
