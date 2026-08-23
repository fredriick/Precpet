"use client"

import { useEffect, useState } from "react"
import { createClub, getMyClub, joinClub, type ClubSummary } from "@/lib/club"
import { submitAndFetchLeaderboard, type LeaderboardResult } from "@/lib/leaderboard"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function rankColor(rank: number): string {
  if (rank === 1) return "text-amber-400"
  if (rank === 2) return "text-slate-300"
  if (rank === 3) return "text-orange-400"
  return "text-muted-foreground"
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function ClubLeaderboardCard({
  userMinutes,
  userName,
  sport,
}: {
  userMinutes: number
  userName: string
  sport?: string
}) {
  const [club, setClub] = useState<ClubSummary | null | undefined>(undefined)
  const [data, setData] = useState<LeaderboardResult | null>(null)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { t } = useI18n()

  useEffect(() => {
    getMyClub()
      .then((result) => {
        if (!result.configured) {
          setClub(undefined)
          return
        }
        setClub(result.club)
      })
      .catch(() => setClub(null))
  }, [])

  useEffect(() => {
    if (!club) return
    const controller = new AbortController()
    setError(null)
    submitAndFetchLeaderboard(userMinutes, userName, sport, club.id, controller.signal)
      .then(setData)
      .catch((err) => {
        if (err?.name !== "AbortError") setError(t("club.loadError"))
      })
    return () => controller.abort()
  }, [club, userMinutes, userName, sport, t])

  const handleCreate = async () => {
    if (busy || name.trim().length < 2) return
    setBusy(true)
    setError(null)
    try {
      const created = await createClub(name.trim())
      setClub(created)
      setName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("club.createError"))
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    if (busy || code.trim().length < 4) return
    setBusy(true)
    setError(null)
    try {
      const joined = await joinClub(code.trim())
      setClub(joined)
      setCode("")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("club.joinError"))
    } finally {
      setBusy(false)
    }
  }

  const handleCopy = async () => {
    try {
      if (club) await navigator.clipboard.writeText(club.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  const header = (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("club.title")}</h3>
      </div>
      {club && (
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg bg-accent/30"
          title={t("club.copyTitle")}
        >
          <span className="font-mono font-semibold tracking-widest">{club.code}</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
          </svg>
          {copied && <span className="text-emerald-400">{t("club.copied")}</span>}
        </button>
      )}
    </div>
  )

  // Not configured or still loading club state.
  if (club === undefined) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5">
        {header}
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[52px] rounded-xl bg-accent/20 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5">
        {header}
        <p className="text-sm text-muted-foreground mb-4">{t("club.noClub")}</p>
        <div className="space-y-3">
          <div className="rounded-xl bg-accent/20 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("club.startClub")}</p>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder={t("club.teamName")}
                maxLength={40}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary/50"
              />
              <Button
                onClick={handleCreate}
                disabled={busy || name.trim().length < 2}
                className="h-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground px-3 text-sm"
              >
                {t("club.create")}
              </Button>
            </div>
          </div>
          <div className="rounded-xl bg-accent/20 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("club.joinClub")}</p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder={t("club.clubCode")}
                maxLength={12}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono uppercase tracking-widest outline-none focus:border-primary/50"
              />
              <Button
                onClick={handleJoin}
                disabled={busy || code.trim().length < 4}
                className="h-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground px-3 text-sm"
              >
                {t("club.join")}
              </Button>
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    )
  }

  const { top, user } = data ?? { top: [], user: null }

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      {header}
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold truncate">{club.name}</p>
        <span className="text-xs text-muted-foreground shrink-0">{t("club.members", { count: club.memberCount })}</span>
      </div>

      {!data ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[52px] rounded-xl bg-accent/20 animate-pulse" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t("club.empty")}</p>
      ) : (
        <div className="space-y-2">
          {user && (
            <div className="mb-2 rounded-xl bg-primary/10 border border-primary/25 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">{t("club.rank")}</p>
              <p className="text-lg font-bold text-primary">{ordinal(user.rank)}</p>
            </div>
          )}

          {top.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-xl transition-colors",
                entry.isUser ? "bg-primary/15 border border-primary/30" : "bg-accent/20",
              )}
            >
              <span className={cn("w-6 text-center font-bold font-mono text-sm", rankColor(entry.rank))}>
                {entry.rank}
              </span>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                {entry.name.charAt(0)}
              </div>
              <p className={cn("flex-1 min-w-0 truncate text-sm", entry.isUser ? "font-semibold" : "font-medium")}>
                {entry.name}
                {entry.isUser && <span className="text-primary text-xs ml-1">{t("club.you")}</span>}
              </p>
              <span className="text-sm font-mono text-muted-foreground">{formatMinutes(entry.minutes)}</span>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-3">{error}</p>}
    </div>
  )
}
