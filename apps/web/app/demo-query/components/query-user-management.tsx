"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useGetWorkspaceApiWorkspaceGet, getGetWorkspaceApiWorkspaceGetQueryKey } from "../../../api/generated/workspace/workspace"
import { useDeleteUserApiUsersUserIdDelete } from "../../../api/generated/users/users"
import { UserCard } from "@workspace/ui/components/business"
import { Input } from "@workspace/ui/components/input"
import { Search, Loader2, RefreshCw } from "lucide-react"
import { useWorkspaceStore } from "../../demo-zustand/store"

export function QueryUserManagement() {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState("")
  const addLog = useWorkspaceStore(s => s.addLog)

  // 1. 使用 Orval 自动生成的 Hook 获取数据
  const { data, isLoading, isFetching, refetch } = useGetWorkspaceApiWorkspaceGet()

  // 2. 使用 Orval 自动生成的 Hook 执行动作
  const deleteMutation = useDeleteUserApiUsersUserIdDelete({
    mutation: {
      onSuccess: (data, variables) => {
        addLog(`[Orval] 成功删除用户: ${variables.userId}`, 'warning')
        // 使用生成的 Query Key 让缓存失效
        queryClient.invalidateQueries({ queryKey: getGetWorkspaceApiWorkspaceGetQueryKey() })
      },
      onError: (err: any) => {
        addLog(`[Error] ${err.message}`, 'warning')
      }
    }
  })

  const filteredUsers = React.useMemo(() => {
    if (!data?.users) return []
    return data.users.filter((u: any) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])

  if (isLoading) return (
    <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Orval + React Query 驱动的检索..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => refetch()}
          className="h-10 px-3 border rounded-lg hover:bg-muted flex items-center gap-2"
          disabled={isFetching}
        >
          <RefreshCw className={isFetching ? "animate-spin size-4" : "size-4"} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUsers.map((user: any) => (
          <UserCard
            key={user.id}
            name={user.name}
            role={user.role}
            email={user.status}
            // 展现 Mutation 的 Loading 状态
            variant={deleteMutation.isPending && deleteMutation.variables?.userId === user.id ? "elevated" : "default"}
            onMessage={() => deleteMutation.mutate({ userId: user.id })}
          />
        ))}
      </div>
    </div>
  )
}
