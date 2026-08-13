"use client"

import { useCallback, useEffect, useState } from "react"
import { PreceptLogo } from "@/components/precept-logo"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { getOrCreateSessionToken } from "@/lib/auth"
import {
  acceptChallenge,
  createChallenge,
  declineChallenge,
  getChallenges,
  getMyPlayerCode,
  resolveChallenge,
  type Challenge,
} from "@/lib/challenges"
import type { Sport } from "@/lib/types"
import { cn } from "@/lib/utils"

const sportLabels: Record<Sport, string> = {
  soccer: "Soccer",
  basketball: "Basketball",
  tennis: "Tennis",
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function opponentOf(challenge: Challenge): { name: string; token: string; minutes: number } {
  return challenge.mine === "challenger"
    ? { name: challenge.opponentName, token: challenge.opponentToken, minutes: challenge.opponentMinutes }
    : { name: challenge.challengerName, token: challenge.challengerToken, minutes: challenge.challengerMinutes }
}

function myMinutes(challenge: Challenge): number {
  return challenge.mine === "challenger" ? challenge.challengerMinutes : challenge.opponentMinutes
}

function ChallengeRow({
  challenge,
  currentToken,
  busyId,
  onAccept,
  onDecline,
  onResolve,
}: {
  challenge: Challenge
  currentToken: string
  busyId: string | null
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  onResolve: (id: string) => void
}) {
  const opp = opponentOf(challenge)
  const mine = myMinutes(challenge)
  const sportLabel = challenge.sport ? sportLabels[challenge.sport as Sport] ?? challenge.sport : null
  const isBusy = busyId === challenge.id

  const statusLabel =
    challenge.status === "pending"
      ? challenge.mine === "challenger"
        ? "Waiting for response"
        : "Challenge"
      : challenge.status === "accepted"
        ? "Active — practice to win"
        : challenge.status === "declined"
          ? "Declined"
          : challenge.winnerToken === currentToken
            ? "You won"
            : challenge.winnerToken === null
              ? "Draw"
              : "You lost"

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold truncate">You vs {opp.name}</p>
        <span
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            challenge.status === "completed" && challenge.winnerToken === currentToken
              ? "bg-emerald-500/15 text-emerald-400"
              : challenge.status === "completed"
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary",
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-xs font-semibold">
            Y
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">You</p>
            <p className="text-muted-foreground font-mono">{formatMinutes(mine)}</p>
          </div>
        </div>
        <span className="text-muted-foreground text-xs">
          {sportLabel ?? "All sports"} · this week
        </span>
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-xs font-semibold">
            {opp.name.charAt(0)}
          </div>
          <div className="min-w-0 text-right">
            <p className="font-medium truncate">{opp.name}</p>
            <p className="text-muted-foreground font-mono">{formatMinutes(opp.minutes)}</p>
          </div>
        </div>
      </div>

      {challenge.status === "pending" && challenge.mine === "opponent" && (
        <div className="flex gap-2">
          <Button
            onClick={() => onAccept(challenge.id)}
            disabled={isBusy}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Accept
          </Button>
          <Button
            onClick={() => onDecline(challenge.id)}
            disabled={isBusy}
            variant="outline"
            className="flex-1"
          >
            Decline
          </Button>
        </div>
      )}

      {challenge.status === "accepted" && (
        <Button
          onClick={() => onResolve(challenge.id)}
          disabled={isBusy}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Resolve Challenge
        </Button>
      )}

      {challenge.status === "completed" && (
        <p className="text-xs text-muted-foreground text-center">
          {challenge.winnerToken === currentToken
            ? "Great work — you out-practiced them!"
            : challenge.winnerToken === null
              ? "Tied at {formatMinutes(mine)} this week."
              : "They logged more practice time this week."}
        </p>
      )}
    </div>
  )
}

export default function ChallengesPage() {
  const [configured, setConfigured] = useState(true)
  const [playerCode, setPlayerCode] = useState<string | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [opponentCode, setOpponentCode] = useState("")
  const [sport, setSport] = useState<Sport>("soccer")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const currentToken = getOrCreateSessionToken()

  const refresh = useCallback(async () => {
    const [code, list] = await Promise.all([getMyPlayerCode(), getChallenges()])
    setConfigured(code.configured && list.configured)
    setPlayerCode(code.code)
    setChallenges(list.challenges)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh().catch(() => {
      setConfigured(false)
      setLoading(false)
    })
  }, [refresh])

  const runAction = async (
    id: string,
    fn: (id: string) => Promise<unknown>,
    message: string,
    extra?: (result: { tied: boolean }) => string,
  ) => {
    setBusyId(id)
    setError(null)
    setNotice(null)
    try {
      const result = await fn(id)
      if (extra && result && typeof result === "object" && "tied" in result) {
        setNotice(extra(result as { tied: boolean }))
      } else {
        setNotice(message)
      }
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusyId(null)
    }
  }

  const handleCreate = async () => {
    if (creating || opponentCode.trim().length < 4) return
    setCreating(true)
    setError(null)
    try {
      await createChallenge({ opponentCode: opponentCode.trim(), sport })
      setOpponentCode("")
      setNotice("Challenge sent!")
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the challenge.")
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    try {
      if (playerCode) await navigator.clipboard.writeText(playerCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  const pending = challenges.filter((c) => c.status === "pending")
  const active = challenges.filter((c) => c.status === "accepted")
  const history = challenges.filter((c) => c.status === "completed" || c.status === "declined")

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-16 max-w-lg md:max-w-5xl mx-auto">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Challenges</h1>
            <p className="text-xs text-muted-foreground">Head-to-head with friends</p>
          </div>
          <PreceptLogo className="w-8 h-8" />
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg md:max-w-5xl mx-auto space-y-6">
        {!configured && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
            <p className="text-amber-500 text-sm text-center">
              Challenges are unavailable until cloud sync is configured.
            </p>
          </div>
        )}

        {configured && (
          <div className="rounded-2xl bg-card border border-border p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Your Player Code
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Share this code so friends can challenge you.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-accent/30 font-mono text-lg font-bold tracking-[0.25em] text-center">
                {playerCode ?? "······"}
              </div>
              <Button onClick={handleCopy} variant="outline" className="shrink-0">
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        {configured && (
          <div className="rounded-2xl bg-card border border-border p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              New Challenge
            </p>
            <div className="space-y-3">
              <input
                value={opponentCode}
                onChange={(e) => setOpponentCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Opponent's player code"
                maxLength={12}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm font-mono uppercase tracking-widest outline-none focus:border-primary/50"
              />
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value as Sport)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary/50"
              >
                <option value="soccer">Soccer</option>
                <option value="basketball">Basketball</option>
                <option value="tennis">Tennis</option>
              </select>
              <Button
                onClick={handleCreate}
                disabled={creating || opponentCode.trim().length < 4}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {creating ? "Sending..." : "Send Challenge"}
              </Button>
            </div>
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

        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-accent/20 animate-pulse" />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-10">
            <svg className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
            </svg>
            <p className="text-muted-foreground text-sm">No challenges yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Share your code and send one to a friend.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <section>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Pending ({pending.length})
                </h3>
                <div className="space-y-3">
                  {pending.map((c) => (
                    <ChallengeRow
                      key={c.id}
                      challenge={c}
                      currentToken={currentToken}
                      busyId={busyId}
                      onAccept={(id) => runAction(id, acceptChallenge, "Challenge accepted — go practice!")}
                      onDecline={(id) => runAction(id, declineChallenge, "Challenge declined.")}
                      onResolve={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}

            {active.length > 0 && (
              <section>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Active ({active.length})
                </h3>
                <div className="space-y-3">
                  {active.map((c) => (
                    <ChallengeRow
                      key={c.id}
                      challenge={c}
                      currentToken={currentToken}
                      busyId={busyId}
                      onAccept={() => {}}
                      onDecline={() => {}}
                      onResolve={(id) =>
                        runAction(id, resolveChallenge, "Challenge resolved.", (result) =>
                          result.tied ? "It's a tie this week." : "Winner decided by practice minutes!",
                        )
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {history.length > 0 && (
              <section>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  History ({history.length})
                </h3>
                <div className="space-y-3">
                  {history.map((c) => (
                    <ChallengeRow
                      key={c.id}
                      challenge={c}
                      currentToken={currentToken}
                      busyId={busyId}
                      onAccept={() => {}}
                      onDecline={() => {}}
                      onResolve={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
