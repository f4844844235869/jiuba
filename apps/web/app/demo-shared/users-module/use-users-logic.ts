"use client"

import { User } from "../use-shared-state"

/**
 * 用户模块的大脑
 * 它不拥有数据，而是通过“注塑”方式操作外部传入的数据
 */
export function useUsersLogic(
  users: User[], 
  setUsers: React.Dispatch<React.SetStateAction<User[]>>
) {
  const deleteUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  const toggleStatus = (id: number) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u
    ))
  }

  return {
    users,
    deleteUser,
    toggleStatus
  }
}
