"use client"

import { useMemo } from "react"
import { User } from "../use-shared-state"

/**
 * 统计模块的大脑
 * 它只负责根据用户列表通过“计算”生成统计指标
 */
export function useStatsLogic(users: User[]) {
  const stats = useMemo(() => {
    const active = users.filter(u => u.status === "active").length
    const inactive = users.length - active
    
    return [
      { title: "总人数", value: users.length },
      { title: "活跃中", value: active, trend: "up" as const },
      { title: "已离线", value: inactive, trend: "down" as const },
    ]
  }, [users])

  return {
    stats
  }
}
