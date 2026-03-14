"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { 
  useGetWorkspaceApiWorkspaceGet, 
  getGetWorkspaceApiWorkspaceGetQueryKey 
} from "../../../api/generated/workspace/workspace"
import { 
  useCreateUserApiUsersPost, 
  useUpdateUserApiUsersUserIdPut, 
  useDeleteUserApiUsersUserIdDelete 
} from "../../../api/generated/users/users"
import { UserStatus } from "../../../api/generated/workspace.schemas"
import { UserCard } from "@workspace/ui/components/business"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Search, Loader2, Plus, RefreshCw, UserPlus } from "lucide-react"
import { useWorkspaceStore } from "../../demo-zustand/store"

export function QueryCrudManagement() {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState("")
  const addLog = useWorkspaceStore(s => s.addLog)

  // 1. READ: 获取数据
  const { data, isLoading, isFetching, refetch } = useGetWorkspaceApiWorkspaceGet()

  // 2. CREATE: 创建用户
  const createMutation = useCreateUserApiUsersPost({
    mutation: {
      onSuccess: (newUser) => {
        addLog(`[CRUD] 成功创建用户: ${newUser.name}`, 'success')
        queryClient.invalidateQueries({ queryKey: getGetWorkspaceApiWorkspaceGetQueryKey() })
      }
    }
  })

  // 3. UPDATE: 更新状态
  const updateMutation = useUpdateUserApiUsersUserIdPut({
    mutation: {
      onSuccess: (updatedUser) => {
        addLog(`[CRUD] 更新用户状态: ${updatedUser.name} -> ${updatedUser.status}`, 'info')
        queryClient.invalidateQueries({ queryKey: getGetWorkspaceApiWorkspaceGetQueryKey() })
      }
    }
  })

  // 4. DELETE: 删除用户
  const deleteMutation = useDeleteUserApiUsersUserIdDelete({
    mutation: {
      onSuccess: (_, variables) => {
        addLog(`[CRUD] 成功删除用户 ID: ${variables.userId}`, 'warning')
        queryClient.invalidateQueries({ queryKey: getGetWorkspaceApiWorkspaceGetQueryKey() })
      }
    }
  })

  const handleCreateRandom = () => {
    const randomId = `user-${Math.floor(Math.random() * 1000)}`
    createMutation.mutate({
      data: {
        id: randomId,
        name: `新成员 ${randomId}`,
        role: "Frontend Developer",
        status: UserStatus.online
      }
    })
  }

  const handleToggleStatus = (user: any) => {
    const statusCycle: UserStatus[] = [UserStatus.online, UserStatus.busy, UserStatus.offline]
    const currentIndex = statusCycle.indexOf(user.status)
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length]
    
    updateMutation.mutate({
      userId: user.id,
      data: { status: nextStatus }
    })
  }

  const filteredUsers = React.useMemo(() => {
    if (!data?.users) return []
    return data.users.filter((u: any) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">正在同步服务器状态...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* 搜素框 (Read 辅助) */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="全文检索 (React Query 缓存驱动)..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* 创建按钮 (Create) */}
        <Button 
          onClick={handleCreateRandom}
          disabled={createMutation.isPending}
          className="gap-2"
        >
          {createMutation.isPending ? <Loader2 className="animate-spin size-4" /> : <UserPlus className="size-4" />}
          快速新增
        </Button>

        {/* 刷新按钮 (Read 强制更新) */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          className={isFetching ? "animate-spin" : ""}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUsers.map((user: any) => (
          <UserCard
            key={user.id}
            name={user.name}
            role={user.role}
            email={user.status}
            // 状态变更按钮 (Update)
            onFollow={() => handleToggleStatus(user)}
            // 删除按钮 (Delete)
            onMessage={() => deleteMutation.mutate({ userId: user.id })}
            // 动作加载反馈
            variant={
              (deleteMutation.isPending && deleteMutation.variables?.userId === user.id) ||
              (updateMutation.isPending && updateMutation.variables?.userId === user.id)
                ? "elevated" 
                : "default"
            }
          />
        ))}
        
        {filteredUsers.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl">
            <p className="text-muted-foreground">没有找到匹配的用户</p>
          </div>
        )}
      </div>
    </div>
  )
}
