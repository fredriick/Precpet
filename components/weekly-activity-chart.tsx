"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { PracticeSession } from "@/lib/types"
import { format, subDays, startOfDay, isSameDay } from "date-fns"

interface WeeklyActivityChartProps {
  sessions: PracticeSession[]
}

export function WeeklyActivityChart({ sessions }: WeeklyActivityChartProps) {
  const today = startOfDay(new Date())

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i)
    const daySessions = sessions.filter((s) => {
      if (!s.endTime) return false
      return isSameDay(startOfDay(new Date(s.endTime)), date)
    })
    const totalMinutes = daySessions.reduce((acc, s) => {
      const start = new Date(s.startTime).getTime()
      const end = s.endTime ? new Date(s.endTime).getTime() : start
      return acc + Math.round((end - start) / 60000)
    }, 0)

    return {
      day: format(date, "EEE"),
      minutes: totalMinutes,
      fullDate: format(date, "MMM d"),
    }
  })

  const maxMinutes = Math.max(...days.map((d) => d.minutes), 1)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-xl px-3 py-2 text-sm shadow-lg">
          <p className="font-medium text-foreground">{data.fullDate}</p>
          <p className="text-primary font-mono">{data.minutes}m practiced</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Weekly Activity</h3>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days} margin={{ top: 0, right: 0, bottom: 0, left: -12 }}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.6 0 0)", fontSize: 11 }} dy={6} />
            <YAxis hide domain={[0, maxMinutes]} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar
              dataKey="minutes"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              fill="oklch(0.7 0.17 162)"
              opacity={0.7}
              activeBar={{ opacity: 1, fill: "oklch(0.7 0.17 162)" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {days.every((d) => d.minutes === 0) && (
        <p className="text-center text-xs text-muted-foreground mt-2">No practice sessions this week</p>
      )}
    </div>
  )
}
