"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import type { PracticeSession } from "@/lib/types"
import { format } from "date-fns"
import { allSkills } from "@/lib/skills-database"

interface FluidityTrendChartProps {
  sessions: PracticeSession[]
}

export function FluidityTrendChart({ sessions }: FluidityTrendChartProps) {
  const completed = sessions
    .filter((s) => s.completed && s.fluidityScores.length > 0)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(-20)

  const data = completed.map((s) => {
    const avg = Math.round(s.fluidityScores.reduce((a, b) => a + b, 0) / s.fluidityScores.length)
    const skill = allSkills.find((sk) => sk.id === s.skillId)
    return {
      label: format(new Date(s.startTime), "MM/dd"),
      score: avg,
      name: skill?.name || "Practice",
    }
  })

  if (data.length < 2) {
    return null
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-xl px-3 py-2 text-sm shadow-lg">
          <p className="font-medium text-foreground">{d.name}</p>
          <p className="text-xs text-muted-foreground">{d.label}</p>
          <p className="text-primary font-mono mt-1">{d.score} avg fluidity</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Fluidity Trend</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 260)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.6 0 0)", fontSize: 11 }} dy={6} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "oklch(0.6 0 0)", fontSize: 11 }} dx={-4} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="oklch(0.7 0.17 162)"
              strokeWidth={2}
              dot={{ fill: "oklch(0.7 0.17 162)", strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: "oklch(0.7 0.17 162)", stroke: "oklch(0.12 0.01 260)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
