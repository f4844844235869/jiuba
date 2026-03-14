"use client"

import { useState, useMemo } from "react"

export interface User {
  id: number
  name: string
  email: string
  role: string
  avatar?: string
}

/**
 * 这就是“大脑”（Headless Logic）
 * 它包含纯 JS 逻辑，没有任何 UI
 * 可以在不看浏览器的情况下单独开发并确保运行正确
 */
export function useUsersLogic(initialUsers: User[]) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")

  // 1. 核心业务逻辑：根据搜索词过滤用户
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  // 2. 模拟业务操作：删除用户
  const deleteUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  // 3. 模拟业务操作：关注/取消关注用户
  const [followedIds, setFollowedIds] = useState<number[]>([])
  
  const toggleFollow = (id: number) => {
    setFollowedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // 吐出给视图层使用的“数据”和“动作”
  return {
    searchTerm,
    setSearchTerm,
    filteredUsers,
    deleteUser,
    toggleFollow,
    followedIds,
    totalCount: users.length,
    filteredCount: filteredUsers.length,
  }
}
