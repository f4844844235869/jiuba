"use client"

import { useSharedState } from "./use-shared-state"
import { useUsersLogic } from "./users-module/use-users-logic"
import { UsersView } from "./users-module/users-view"
import { useStatsLogic } from "./stats-module/use-stats-logic"
import { StatsView } from "./stats-module/stats-view"

const MOCK_USERS = [
  { id: 1, name: "开发工程师 A", role: "Frontend", status: "active" as const },
  { id: 2, name: "产品经理 B", role: "Product", status: "inactive" as const },
  { id: 3, name: "视觉设计 C", role: "Designer", status: "active" as const },
]

export default function SharedDemoPage() {
  // 1. 定义源数据（跨模块共享的“水源”）
  const { users, setUsers } = useSharedState(MOCK_USERS)

  // 2. 实例化各个模块的大脑（注塑数据）
  const usersLogic = useUsersLogic(users, setUsers) // 传人 setter，拥有写权限
  const statsLogic = useStatsLogic(users)          // 仅传入 data，拥有读/计算权限

  return (
    <div className="container mx-auto py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">多模块数据交互演示</h1>
        <p className="text-muted-foreground">
          删除左侧用户，右侧统计仪表盘会<b>实时同步</b>更新。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 模块 A：统计视图 */}
        <div className="lg:col-span-4">
          <StatsView logic={statsLogic} />
        </div>

        {/* 模块 B：列表视图 */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">成员管理</h3>
          <UsersView logic={usersLogic} />
        </div>

        <div className="lg:col-span-2 bg-muted/20 p-6 rounded-xl border border-dashed text-sm flex items-center justify-center">
          <div className="text-center space-y-2">
             <p className="font-medium text-primary">架构心智：</p>
             <ul className="text-left list-disc list-inside space-y-1 text-muted-foreground">
                <li>数据源定义在 Page 层</li>
                <li>Logic 层通过 Props 获取数据或 Setter</li>
                <li>模块之间不直接对话，通过“共享水源”通信</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
