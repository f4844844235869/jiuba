"use client"

import { useState } from "react"
import { UserCard, StatCard } from "@workspace/ui/components/business"
import { Button } from "@workspace/ui/components/button"
import { useTheme } from "next-themes"
import { 
  Users, 
  ShoppingCart, 
  CurrencyDollar, 
  Pulse,
  Sun,
  Moon
} from "@phosphor-icons/react"

// 模拟用户数据
const mockUsers = [
  {
    id: 1,
    name: "张三",
    email: "zhangsan@example.com",
    role: "产品经理",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan",
  },
  {
    id: 2,
    name: "李四",
    email: "lisi@example.com",
    role: "前端工程师",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisi",
  },
  {
    id: 3,
    name: "王五",
    email: "wangwu@example.com",
    role: "UI 设计师",
  },
]

// 模拟统计数据
const mockStats = [
  {
    title: "总用户数",
    value: "12,345",
    trend: "up" as const,
    trendValue: "+12.5%",
    icon: <Users className="size-5" weight="duotone" />,
  },
  {
    title: "订单数量",
    value: "1,234",
    trend: "up" as const,
    trendValue: "+8.2%",
    icon: <ShoppingCart className="size-5" weight="duotone" />,
  },
  {
    title: "总收入",
    value: "¥89,012",
    trend: "up" as const,
    trendValue: "+23.1%",
    icon: <CurrencyDollar className="size-5" weight="duotone" />,
  },
  {
    title: "活跃度",
    value: "78.5%",
    trend: "down" as const,
    trendValue: "-2.3%",
    icon: <Pulse className="size-5" weight="duotone" />,
  },
]

export default function ComponentsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [followedUsers, setFollowedUsers] = useState<number[]>([])

  const handleFollow = (userId: number) => {
    setFollowedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const handleMessage = (userName: string) => {
    alert(`向 ${userName} 发送消息`)
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <div className="min-h-svh bg-background">
      {/* 页面头部 */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">
            业务组件演示
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label="切换主题"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-6 py-8">
        {/* StatCard 演示区域 */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              StatCard 统计卡片
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              用于展示统计数据、趋势等信息
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mockStats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                trend={stat.trend}
                trendValue={stat.trendValue}
                icon={stat.icon}
              />
            ))}
          </div>

          {/* 不同变体展示 */}
          <div className="mt-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              不同变体
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                title="Default"
                value="1,234"
                variant="default"
                trend="up"
                trendValue="+5%"
              />
              <StatCard
                title="Outlined"
                value="1,234"
                variant="outlined"
                trend="neutral"
                trendValue="0%"
              />
              <StatCard
                title="Filled"
                value="1,234"
                variant="filled"
                trend="down"
                trendValue="-3%"
              />
            </div>
          </div>
        </section>

        {/* UserCard 演示区域 */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              UserCard 用户卡片
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              用于展示用户信息、头像、角色等
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockUsers.map((user) => (
              <UserCard
                key={user.id}
                name={user.name}
                email={user.email}
                role={user.role}
                avatar={user.avatar}
                onFollow={() => handleFollow(user.id)}
                onMessage={() => handleMessage(user.name)}
              />
            ))}
          </div>

          {/* 不同变体展示 */}
          <div className="mt-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              不同变体
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <UserCard
                name="Default"
                role="默认样式"
                variant="default"
              />
              <UserCard
                name="Outlined"
                role="边框样式"
                variant="outlined"
              />
              <UserCard
                name="Elevated"
                role="浮起样式"
                variant="elevated"
              />
            </div>
          </div>

          {/* 不同尺寸展示 */}
          <div className="mt-6">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">
              不同尺寸
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <UserCard
                name="小尺寸"
                role="Small"
                size="sm"
                showActions={false}
              />
              <UserCard
                name="默认尺寸"
                role="Default"
                size="default"
                showActions={false}
              />
              <UserCard
                name="大尺寸"
                role="Large"
                size="lg"
                showActions={false}
              />
            </div>
          </div>
        </section>

        {/* 交互状态展示 */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              交互状态
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              已关注的用户: {followedUsers.length > 0 ? followedUsers.join(", ") : "无"}
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
