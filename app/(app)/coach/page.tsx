"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PreceptLogo } from "@/components/precept-logo"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { useApp } from "@/contexts/app-context"
import { useI18n } from "@/hooks/use-i18n"
import {
  claimAssignment,
  completeAssignment,
  createAssignment,
  getAssignments,
  type ClaimedAssignment,
  type CreatedAssignment,
} from "@/lib/assignments"
import { allSkills } from "@/lib/skills-database"
import type { Sport } from "@/lib/types"
import { cn } from "@/lib/utils"

function CreatedRow({
  assignment,
  copied,
  onCopy,
  onShare,
}: {
  assignment: CreatedAssignment
  copied: boolean
  onCopy: (code: string) => void
  onShare: (assignment: CreatedAssignment) => void
}) {
  const { t } = useI18n()
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{assignment.skillName}</p>
          {assignment.note && <p className="text-xs text-muted-foreground mt-0.5 truncate">{assignment.note}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => onShare(assignment)}>
            {t("coach.share")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onCopy(assignment.code)}>
            {copied ? t("coach.copied") : t("coach.copyCode")}
          </Button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono tracking-widest">{assignment.code}</span>
        <span>
          {t("coach.completedCount", {
            completed: assignment.completedClaims,
            claims: assignment.claims,
          })}
        </span>
      </div>
    </div>
  )
}

function ClaimedRow({ assignment }: { assignment: ClaimedAssignment }) {
  const { t } = useI18n()
  return (
    <Link href={`/practice?skill=${assignment.skillId}`} className="block">
      <div className="rounded-2xl bg-card border border-border p-4 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold truncate">{assignment.skillName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("coach.assignedBy", { name: assignment.coachName })}</p>
          </div>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
              assignment.completed ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/10 text-primary",
            )}
          >
            {assignment.completed ? t("coach.completed") : t("coach.todo")}
          </span>
        </div>
        {assignment.note && <p className="text-xs text-muted-foreground mt-2">{assignment.note}</p>}
        {!assignment.completed && (
          <p className="text-xs text-primary mt-2">{t("coach.tapToPractice")}</p>
        )}
      </div>
    </Link>
  )
}

export default function CoachPage() {
  const { userStats } = useApp()
  const { t } = useI18n()
  const [configured, setConfigured] = useState(true)
  const [created, setCreated] = useState<CreatedAssignment[]>([])
  const [claimed, setClaimed] = useState<ClaimedAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const [sport, setSport] = useState<Sport>("soccer")
  const [skillId, setSkillId] = useState("")
  const [note, setNote] = useState("")
  const [creating, setCreating] = useState(false)
  const [claimCode, setClaimCode] = useState("")
  const [claiming, setClaiming] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const refresh = useCallback(async () => {
    const result = await getAssignments()
    setConfigured(result.configured)
    setCreated(result.created)
    setClaimed(result.claimed)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh().catch(() => {
      setConfigured(false)
      setLoading(false)
    })
  }, [refresh])

  // Deep link: /coach?code=XXXXXX auto-claims the assignment.
  useEffect(() => {
    const code = searchParams.get("code")
    if (!code || code.trim().length < 4) return
    setClaimCode(code.toUpperCase())
    claimAssignment(code.trim())
      .then(() => {
        setNotice(t("coach.claimedNotice"))
        return refresh()
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("coach.claimError")))
  }, [searchParams, refresh])

  // Auto-complete claimed assignments once the skill is learned.
  useEffect(() => {
    const learned = new Set(userStats.skillsLearned)
    const pending = claimed.filter((c) => !c.completed && learned.has(c.skillId))
    if (pending.length === 0) return
    let cancelled = false
    ;(async () => {
      for (const a of pending) {
        if (cancelled) return
        await completeAssignment(a.assignmentId).catch(() => {})
      }
      if (!cancelled) await refresh()
    })()
    return () => {
      cancelled = true
    }
  }, [claimed, userStats.skillsLearned, refresh])

  const sportSkills = useMemo(() => allSkills.filter((s) => s.sport === sport), [sport])

  const handleCreate = async () => {
    if (creating || !skillId) return
    setCreating(true)
    setError(null)
    setNotice(null)
    try {
      const skill = allSkills.find((s) => s.id === skillId)
      const result = await createAssignment({
        skillId,
        skillName: skill?.name ?? t("coach.drill"),
        sport,
        note: note.trim() || undefined,
      })
      setNotice(t("coach.createdNotice", { code: result.code }))
      setSkillId("")
      setNote("")
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("coach.createError"))
    } finally {
      setCreating(false)
    }
  }

  const handleClaim = async () => {
    if (claiming || claimCode.trim().length < 4) return
    setClaiming(true)
    setError(null)
    setNotice(null)
    try {
      await claimAssignment(claimCode.trim())
      setClaimCode("")
      setNotice(t("coach.claimedNotice"))
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("coach.claimError"))
    } finally {
      setClaiming(false)
    }
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  const handleShare = async (assignment: CreatedAssignment) => {
    const url = `${window.location.origin}/coach?code=${assignment.code}`
    try {
      await navigator.clipboard.writeText(url)
      setNotice(t("coach.linkCopied"))
    } catch {
      setNotice(t("coach.shareCode", { code: assignment.code }))
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-16 max-w-lg md:max-w-5xl mx-auto">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{t("coach.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("coach.subtitle")}</p>
          </div>
          <PreceptLogo className="w-8 h-8" />
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg md:max-w-5xl mx-auto space-y-6">
        {!configured && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
            <p className="text-amber-500 text-sm text-center">
              {t("coach.unavailable")}
            </p>
          </div>
        )}

        {configured && (
          <>
            <section className="rounded-2xl bg-card border border-border p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {t("coach.assignDrill")}
              </p>
              <div className="space-y-3">
                <select
                  value={sport}
                  onChange={(e) => {
                    setSport(e.target.value as Sport)
                    setSkillId("")
                  }}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary/50"
                >
                  <option value="soccer">{t("sport.soccer")}</option>
                  <option value="basketball">{t("sport.basketball")}</option>
                  <option value="tennis">{t("sport.tennis")}</option>
                </select>
                <select
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary/50"
                >
                  <option value="">{t("coach.selectDrill")}</option>
                  {sportSkills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("coach.notePlaceholder")}
                  maxLength={280}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary/50"
                />
                <Button
                  onClick={handleCreate}
                  disabled={creating || !skillId}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {creating ? t("coach.creating") : t("coach.create")}
                </Button>
              </div>
            </section>

            <section className="rounded-2xl bg-card border border-border p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {t("coach.haveCode")}
              </p>
              <div className="flex gap-2">
                <input
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                  placeholder={t("coach.coachCode")}
                  maxLength={12}
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-background border border-border text-sm font-mono uppercase tracking-widest outline-none focus:border-primary/50"
                />
                <Button
                  onClick={handleClaim}
                  disabled={claiming || claimCode.trim().length < 4}
                  className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {claiming ? t("coach.adding") : t("coach.add")}
                </Button>
              </div>
            </section>

            {created.length > 0 && (
              <section>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {t("coach.myAssignments", { count: created.length })}
                </h3>
                <div className="space-y-3">
                  {created.map((a) => (
                    <CreatedRow
                      key={a.id}
                      assignment={a}
                      copied={copiedCode === a.code}
                      onCopy={handleCopy}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              </section>
            )}

            {claimed.length > 0 && (
              <section>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {t("coach.myDrills", { count: claimed.length })}
                </h3>
                <div className="space-y-3">
                  {claimed.map((a) => (
                    <ClaimedRow key={a.id} assignment={a} />
                  ))}
                </div>
              </section>
            )}

            {!loading && created.length === 0 && claimed.length === 0 && (
              <div className="text-center py-10">
                <svg className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.502-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM7.5 6.75h9a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-9a.75.75 0 01-.75-.75V7.5a.75.75 0 01.75-.75z" />
                </svg>
                <p className="text-muted-foreground text-sm">{t("coach.empty")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("coach.emptyHint")}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3">
                <p className="text-destructive text-xs text-center">{error}</p>
              </div>
            )}
            {notice && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">
                <p className="text-emerald-500 text-xs text-center">{notice}</p>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
