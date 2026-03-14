"use client"

import { useUsersLogic } from "./use-users-logic"
import { UserListView } from "./user-list-view"

/**
 * 模拟原始数据
 */
const MOCK_USERS = [
  {
    id: 1,
    name: "Antigravity",
    email: "ai@google.com",
    role: "AI Coding Assistant",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=antigravity",
  },
  {
    id: 2,
    name: "李小明",
    email: "xiaoming@example.com",
    role: "高级后端工程师",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming",
  },
  {
    id: 3,
    name: "陈薇薇",
    email: "weiwei@example.com",
    role: "UI/UX 设计师",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=weiwei",
  },
  {
    id: 4,
    name: "王建国",
    email: "jianguo@example.com",
    role: "产品负责人",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jianguo",
  },
  {
    id: 5,
    name: "赵露思",
    email: "lusi@example.com",
    role: "前端开发",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lusi",
  }
]

/**
 * Demo 主页面：展示“逻辑与视图分离”的开发模式
 */
export default function DemoPage() {
  // 1. 初始化“大脑”（Logic Hook）
  // 在这一行，所有的变量处理、搜索、删除、状态切换都已经在内存中准备好了
  const usersLogic = useUsersLogic(MOCK_USERS)

  // 2. 将“大脑”插入“身体”（View Component）
  // 页面只负责提供一个容器和初始化，不关心具体的渲染细节
  return (
    <main className="container mx-auto py-10 px-4 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl mb-2">
            逻辑与视图分离演示
          </h1>
          <p className="text-muted-foreground italic">
            "Brain (useUsersLogic) {'->'} Body (UserListView) {'->'} Component (UserCard)"
          </p>
        </div>

        <UserListView logic={usersLogic} />
      </div>
    </main>
  )
}
