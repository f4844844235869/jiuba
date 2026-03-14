"use client"

import { useWorkspaceStore } from "../store"
import { Users, Activity as ActivityIcon, CheckCircle } from "lucide-react"

export function WorkspaceHeader() {
  // 核心优化：只选择需要的细粒度状态，避免不必要的渲染
  const userCount = useWorkspaceStore((state) => state.users.length)
  const onlineCount = useWorkspaceStore((state) => 
    state.users.filter(u => u.status === 'online').length
  )
  const logCount = useWorkspaceStore((state) => state.logs.length)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg text-primary">
          <Users className="size-6" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">团队总数</p>
          <p className="text-2xl font-bold">{userCount} 人</p>
        </div>
      </div>

      <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10 flex items-center gap-4">
        <div className="p-3 bg-green-500/10 rounded-lg text-green-600">
          <CheckCircle className="size-6" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">当前在线</p>
          <p className="text-2xl font-bold">{onlineCount} 人</p>
        </div>
      </div>

      <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10 flex items-center gap-4">
        <div className="p-3 bg-orange-500/10 rounded-lg text-orange-600">
          <ActivityIcon className="size-6" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">最近操作</p>
          <p className="text-2xl font-bold">{logCount} 条</p>
        </div>
      </div>
    </div>
  )
}
