"use client"

import * as React from "react"
import { useWorkspaceStore } from "../store"
import { User } from "../../../api/generated/workspace.schemas"
import { UserCard } from "@workspace/ui/components/business"
import { Input } from "@workspace/ui/components/input"
import { Search, UserPlus } from "lucide-react"

export function UserManagement() {
  // 1. 订阅原始数据（这些是稳定引用）
  const users = useWorkspaceStore((state) => state.users)
  const searchQuery = useWorkspaceStore((state) => state.searchQuery)
  
  // 2. 只有当用户列表或搜索词变化时，才重新计算过滤结果（确保引用稳定）
  const filteredUsers = React.useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [users, searchQuery])

  // 3. 提取动作
  const setSearchQuery = useWorkspaceStore((state) => state.setSearchQuery)
  const addUser = useWorkspaceStore((state) => state.addUser)
  const deleteUser = useWorkspaceStore((state) => state.deleteUser)
  const updateStatus = useWorkspaceStore((state) => state.updateUserStatus)

  const handleAddRandom = () => {
    const names = ['赵云', '马超', '黄忠', '魏延']
    const roles = ['Team Leader', 'QA Engineer', 'DevOps']
    addUser({
      name: names[Math.floor(Math.random() * names.length)]!,
      role: roles[Math.floor(Math.random() * roles.length)]!,
      status: 'online'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="全文检索成员..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={handleAddRandom}
          className="bg-primary text-primary-foreground h-10 px-4 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <UserPlus className="size-4" />
          添加成员
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUsers.map(user => (
          <UserCard 
            key={user.id}
            name={user.name ?? ""}
            role={user.role ?? ""}
            email={user.status}
            onFollow={() => {
              const next: User['status'] = user.status === 'online' ? 'busy' : (user.status === 'busy' ? 'offline' : 'online')
              updateStatus(user.id, next)
            }}
            onMessage={() => deleteUser(user.id)}
          />
        ))}
      </div>
    </div>
  )
}
