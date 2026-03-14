"use client"

import { useEffect } from "react"
import { useWorkspaceStore } from "./store"
import { WorkspaceHeader } from "./components/workspace-header"
import { UserManagement } from "./components/user-management"
import { ActivityLog } from "./components/activity-log"
import { Loader2 } from "lucide-react"

/**
 * Zustand 大型项目演示页面
 * 核心：整个页面由一个中心化的 Store 驱动，所有组件只订阅自己关心的部分
 */
export default function ZustandDemoPage() {
  const init = useWorkspaceStore((state) => state.initWorkspace)
  const isLoading = useWorkspaceStore((state) => state.isLoading)

  // 页面加载时初始化数据
  useEffect(() => {
    init()
  }, [init])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">正在获取工作区状态...</p>
      </div>
    )
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <header className="mb-10">
        <div className="flex items-center gap-2 text-primary font-bold mb-2 tracking-widest uppercase text-sm">
          <span className="w-8 h-[2px] bg-primary"></span>
          Zustand Dashboard
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4">企业级协同中心</h1>
        <p className="text-muted-foreground max-w-2xl">
          这是一个基于 <b>Zustand</b> 构建的高性能业务页面。它模拟了大型系统中常见的状态管理：
          全局动作分发、多模块实时同步、细粒度渲染控制以及异步业务流。
        </p>
      </header>

      {/* 顶部统计卡片 - 订阅用户数和在线状态 */}
      <WorkspaceHeader />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 左侧主要区域：用户管理 - 订阅搜索和用户列表 */}
        <div className="lg:col-span-8">
          <UserManagement />
        </div>

        {/* 右侧边栏：操作日志 - 订阅日志流 */}
        <div className="lg:col-span-4">
          <aside className="sticky top-8">
            <ActivityLog />
            <div className="mt-4 p-4 bg-muted/40 rounded-xl border text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">状态管理心智归纳：</p>
              <ul className="list-disc list-inside space-y-1">
                <li><b>Single Source of Truth</b>: 状态集中在外部 Store。</li>
                <li><b>High Cohesion</b>: 逻辑与组件彻底解耦，易于测试。</li>
                <li><b>Performance</b>: 局部更新，不触发整个应用重绘。</li>
                <li><b>Action Driven</b>: 组件只负责告诉 Store "我要做什么"。</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
