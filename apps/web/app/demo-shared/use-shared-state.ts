"use client"

import { useState } from "react"

export interface User {
  id: number
  name: string
  role: string
  status: "active" | "inactive"
}

/**
 * 顶级共享逻辑（Page Level Logic）
 * 负责管理跨模块的“源数据”
 */
export function useSharedState(initialData: User[]) {
  const [users, setUsers] = useState<User[]>(initialData)

  return {
    users,
    setUsers
  }
}
