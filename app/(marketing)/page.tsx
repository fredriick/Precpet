"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { PreceptLogo } from "@/components/precept-logo"
import { useAuth } from "@/contexts/auth-context"
import { HeroScene } from "@/components/hero-scene"
import { ScrollReveal, StaggerContainer, StaggerItem, FloatIn } from "@/components/scroll-animations"

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Motion Analysis",
    description: "Real-time movement fluidity tracking using your device's sensors. Instant feedback on every motion.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "AI Recommendations",
    description: "Smart skill suggestions powered by Claude AI. Identifies weaknesses and recommends the perfect drill.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: "Progress Tracking",
    description: "Track streaks, unlock achievements, and watch your fluidity scores improve session by session.",
  },
]

const stats = [
  { value: 98, suffix: "%", label: "Accuracy Rate" },
  { value: 50, suffix: "k+", label: "Active Athletes" },
  { value: 49, suffix: "", label: "App Store Rating", display: "4.9" },
  { value: 12, suffix: "x", label: "Faster Improvement" },
]

function AnimatedStat({ value, suffix, label, display }: { value: number; suffix: string; label: string; display?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const startTime = Date.now()
    const tick = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])

  return (
    <ScrollReveal delay={0.1}>
      <div className="text-center group cursor-default">
        <div className="text-3xl font-bold bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300">
          {display ?? (count + suffix)}
        </div>
        <div className="text-xs text-white/60 mt-1 tracking-wide uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">{label}</div>
      </div>
    </ScrollReveal>
  )
}

export default function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const { scrollYProgress } = useScroll()
  // compress scene progress so full animation completes within hero viewport
  const sceneProgress = useTransform(scrollYProgress, [0, 0.25], [0, 1])

  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMouse({
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    })
  }, [])

  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const unsub = sceneProgress.on("change", setProgress)
    return () => unsub()
  }, [sceneProgress])

  useEffect(() => {
    if (user) router.replace("/dashboard")
  }, [user, router])

  if (user) return null

  return (
    <div className="relative bg-[#0a0a0f] text-white" onMouseMove={handleMouseMove}>
      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0 bg-[#0a0a0f]/60 backdrop-blur-xl border-b border-white/[0.04]" />
        <div className="relative flex items-center justify-between max-w-7xl mx-auto px-6 h-16">
          <motion.div
            className="flex items-center gap-3"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
              <PreceptLogo className="w-7 h-7 relative" />
            </div>
            <span className="font-bold text-lg tracking-tight">Precept</span>
          </motion.div>
          <motion.div
            className="flex items-center gap-4"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link href="/login" className="px-5 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl opacity-60 group-hover:opacity-100 blur transition duration-300" />
              <div className="relative px-5 py-2 bg-[#0a0a0f] rounded-xl text-sm font-semibold text-white group-hover:bg-transparent transition-colors">
                Get Started
              </div>
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Hero section — normal height, no long spacer */}
      <section className="relative min-h-screen flex items-center">
        {/* 3D scene background */}
        <motion.div
          className="absolute inset-0"
          style={{ opacity: heroOpacity }}
        >
          <HeroScene mouse={mouse} scrollProgress={progress} />
        </motion.div>

        {/* Content */}
        <motion.div
          className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-32"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          {/* Dark backdrop overlay on mobile to improve text readability over 3D scene */}
          <div className="md:hidden absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/20 via-[#0a0a0f]/60 to-[#0a0a0f]/90 pointer-events-none" />
          <div className="flex flex-col items-end md:items-start max-w-2xl">
            {/* Badge — vertical on the far right edge */}
            <motion.div
              className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-30"
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-col items-center gap-4 py-6 px-3 rounded-2xl bg-white/[0.03] border border-emerald-500/15">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <motion.span
                  className="text-[10px] font-semibold text-emerald-300 tracking-[0.2em] uppercase whitespace-nowrap"
                  style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                  animate={{ opacity: [0.6, 1, 0.6], y: [0, -2, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  Live Motion Tracking
                </motion.span>
                <motion.svg
                  className="w-4 h-4 text-emerald-400/60"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </motion.svg>
              </div>
            </motion.div>

            {/* Badge mobile */}
            <motion.div
              className="flex md:hidden mb-8 self-start"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-xs font-semibold text-emerald-300 tracking-wider uppercase">Live Tracking</span>
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-6"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            >
              <motion.span
                className="inline-block drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                animate={{
                  letterSpacing: ["-0.02em", "0.02em", "-0.02em"],
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                Your{" "}
              </motion.span>
              <motion.span
                className="inline-block bg-gradient-to-r from-emerald-300 via-emerald-200 to-white bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(16,185,129,0.5)]"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  scale: [1, 1.02, 1],
                  filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                style={{ backgroundSize: "200% auto" }}
              >
                AI Coach
              </motion.span>
            </motion.h1>

            <motion.span
              className="block text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] text-white/95 mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            >
              <motion.span
                className="inline-block"
                animate={{
                  opacity: [0.7, 1, 0.7],
                  y: [0, -3, 0],
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                in Your Pocket
              </motion.span>
            </motion.span>

            <motion.p
              className="text-base md:text-lg text-white/70 md:text-white/40 max-w-xl mb-10 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
            >
              <motion.span
                className="inline-block"
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              >
                Motion analysis, personalized training, and skill tracking — all powered by AI.
              </motion.span>{" "}
              <motion.span
                className="inline-block text-emerald-300/90 font-medium drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              >
                Train smarter, improve faster.
              </motion.span>
            </motion.p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mb-20">
              <Link href="/register" className="relative group w-full sm:w-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 rounded-xl opacity-70 group-hover:opacity-100 blur-lg transition duration-300" />
                <div className="relative px-10 py-4 bg-[#0a0a0f] rounded-xl text-base font-semibold group-hover:bg-transparent transition-colors">
                  Start Free Trial
                </div>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-10 py-4 text-base font-medium bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] rounded-xl transition-all"
              >
                Sign In
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 w-full">
              {stats.map((stat, i) => (
                <AnimatedStat key={i} {...stat} />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative px-6 pb-40">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-white/40 mb-6 tracking-wide uppercase">
                Everything You Need
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Level up your{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                  game
                </span>
              </h2>
              <p className="text-white/40 mt-4 max-w-lg mx-auto">
                From motion tracking to AI-generated tutorials, Precept gives you the tools of a professional coach.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
            {features.map((feature, i) => (
              <StaggerItem key={i}>
                <div className="relative group bg-[#0a0a0f] p-10 h-full">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-white/40 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA */}
      <FloatIn>
        <section className="relative px-6 pb-40">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] p-16 md:p-24">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                  Ready to{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                    transform
                  </span>{" "}
                  your game?
                </h2>
                <p className="text-white/40 max-w-lg mx-auto mb-10">
                  Join thousands of athletes already training smarter with Precept.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Link href="/register" className="relative group inline-block">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 rounded-xl opacity-70 group-hover:opacity-100 blur-lg transition duration-300" />
                    <div className="relative px-10 py-4 bg-[#0a0a0f] rounded-xl text-base font-semibold group-hover:bg-transparent transition-colors">
                      Get Started Free
                    </div>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </FloatIn>

      {/* Footer */}
      <motion.footer
        className="relative border-t border-white/[0.06] py-10 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div className="flex items-center gap-2" whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 200 }}>
            <PreceptLogo className="w-5 h-5" />
            <span className="font-semibold text-sm">Precept</span>
          </motion.div>
          <p className="text-sm text-white/20">&copy; {new Date().getFullYear()} Precept. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  )
}
