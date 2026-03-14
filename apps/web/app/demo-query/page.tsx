"use client"

import { QueryCrudManagement } from "./components/query-crud-management"
import { ActivityLog } from "../demo-zustand/components/activity-log"
import { Database, Zap, ShieldCheck } from "lucide-react"

/**
 * TanStack Query + Zustand 最佳实践演示
 */
export default function QueryDemoPage() {
  return (
    <main className="container mx-auto py-10 px-4">
      <header className="mb-10 text-center">
        <div className="flex justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
            <Database className="size-4" /> TanStack Query (数据层)
          </div>
          <div className="flex items-center gap-2 bg-purple-500/10 text-purple-600 px-3 py-1 rounded-full text-sm font-bold">
            <Zap className="size-4" /> Zustand (交互层)
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4">React Query x Python FastAPI</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          这是大型项目的<b>终极形态</b>。服务器状态完全托管，
          自带自动重试、缓存同步和乐观更新支持。
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <QueryCrudManagement />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <ActivityLog />
          
          <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl border flex flex-col gap-4">
            <div className="bg-primary/20 p-2 rounded-lg w-fit text-primary">
              <ShieldCheck className="size-8" />
            </div>
            <div>
              <h4 className="font-bold text-lg">为什么这是维护之王？</h4>
              <ul className="mt-2 space-y-3 text-sm text-muted-foreground">
                <li><b>1. 零样板代码</b>：不再需要手动维护 <code>isLoading</code> 或 <code>try-catch</code>。</li>
                <li><b>2. 自动失效 (Invalidation)</b>：删除用户后，自动通过 <code>queryKey</code> 刷新整个页面的数据。</li>
                <li><b>3. 极速缓存</b>：切换页面再回来，数据是秒开的。</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
