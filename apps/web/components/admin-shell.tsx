"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { AdminLayout, type AdminLayoutProps } from "@workspace/ui/components/business"
import { LayoutDashboard, Sparkles, SwatchBook } from "lucide-react"

type NavGroup = NonNullable<AdminLayoutProps["navGroups"]>[number]
type NavItem = NavGroup["items"][number]

function withActive(items: NavItem[], pathname: string): NavItem[] {
  return items.map((item) => {
    const childItems = item.items ? withActive(item.items, pathname) : undefined
    const isLeafActive = !!item.href && pathname === item.href
    const isSectionActive =
      !!item.href && item.href !== "/" && pathname.startsWith(item.href)
    const isChildActive = childItems ? childItems.some((c) => c.isActive) : false

    return {
      ...item,
      isActive: isLeafActive || isSectionActive || isChildActive,
      items: childItems,
    }
  })
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() || "/"

  const user: NonNullable<AdminLayoutProps["user"]> = {
    name: "Admin",
    email: "admin@workspace.local",
    roles: ["admin"],
  }

  const navGroups = React.useMemo<NavGroup[]>(() => {
    const groups: NavGroup[] = [
      {
        label: "Layout Demo",
        items: [
          { title: "布局预览", href: "/", icon: LayoutDashboard },
          { title: "少量自定义", href: "/#customization", icon: Sparkles },
          { title: "主题令牌", href: "/#tokens", icon: SwatchBook },
        ],
      },
    ]

    return groups.map((g) => ({ ...g, items: withActive(g.items, pathname) }))
  }, [pathname])

  return (
    <AdminLayout
      user={user}
      navGroups={navGroups}
      onNavigate={(href) => router.push(href)}
      onLogout={() => router.push("/")}
    >
      {children}
    </AdminLayout>
  )
}
