"use client"

import * as React from "react"
import { UserCard } from "@workspace/ui/components/business"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Users, Search } from "lucide-react"
import type { useUsersLogic } from "./use-users-logic"

interface UserListViewProps {
  // 接收从 Hook 吐出来的整个逻辑对象
  logic: ReturnType<typeof useUsersLogic>
}

/**
 * 这就是“身体”（View Layer）
 * 它只负责 UI 展示和排版，具体的交互逻辑都调用 logic 提供的方法
 */
export function UserListView({ logic }: UserListViewProps) {
  return (
    <div className="space-y-6">
      {/* 顶部标题栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-muted/30 p-4 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">用户管理</h2>
            <p className="text-sm text-muted-foreground">
              共 {logic.totalCount} 位用户，已过滤出 {logic.filteredCount} 位
            </p>
          </div>
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            className="pl-9 h-10 border-primary/20 focus-visible:ring-primary/30" 
            placeholder="搜索姓名或职位..." 
            value={logic.searchTerm}
            onChange={(e) => logic.setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 用户网格展示 */}
      {logic.filteredCount > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logic.filteredUsers.map((user) => (
            <UserCard 
              key={user.id}
              name={user.name}
              email={user.email}
              role={user.role}
              avatar={user.avatar}
              variant={logic.followedIds.includes(user.id) ? "elevated" : "default"}
              onFollow={() => logic.toggleFollow(user.id)}
              onMessage={() => logic.deleteUser(user.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed rounded-xl border-muted">
          <p className="text-muted-foreground">未找到匹配的用户</p>
          {logic.searchTerm && (
            <button 
              className="mt-2 text-primary font-medium text-sm hover:underline"
              onClick={() => logic.setSearchTerm("")}
            >
              重置所有搜索
            </button>
          )}
        </div>
      )}
    </div>
  )
}
