"use client"

import { StatCard } from "@workspace/ui/components/business"
import { useStatsLogic } from "./use-stats-logic"

export function StatsView({ logic }: { logic: ReturnType<typeof useStatsLogic> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {logic.stats.map((stat, idx) => (
        <StatCard 
          key={idx}
          title={stat.title}
          value={stat.value}
          trend={stat?.trend}
          trendValue={stat.title === "总人数" ? undefined : "实时"}
        />
      ))}
    </div>
  )
}
