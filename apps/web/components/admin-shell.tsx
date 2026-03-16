"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"
import { AdminLayout, type AdminLayoutProps } from "@workspace/ui/components/business"
import {
  LayoutDashboard,
  Shield,
  Store,
  Workflow,
} from "lucide-react"

import { useAuthStore } from "@/lib/auth-store"
import type { CurrentUserProfile } from "@/api/generated/workspace.schemas"
import {
  getMyNotifications,
  markNotificationRead,
  type NotificationRecord,
  type NotificationType,
} from "@/lib/notifications"
import { hasAnyPermission } from "@/lib/permissions"

type NavGroup = NonNullable<AdminLayoutProps["navGroups"]>[number]
type NavItem = NavGroup["items"][number]
type UiNotification = NonNullable<AdminLayoutProps["notifications"]>[number]
type AuthShellUser = CurrentUserProfile & {
  current_store_name?: string | null
  primary_store_name?: string | null
}

const NOTIFICATIONS_QUERY_KEY = ["my-notifications"]

const notificationTypeMeta: Record<
  string,
  { fallbackTitle: string; level: NonNullable<UiNotification["type"]> }
> = {
  PROFILE_UPDATED: { fallbackTitle: "个人信息已更新", level: "success" },
  PASSWORD_UPDATED: { fallbackTitle: "密码已修改", level: "success" },
  PROFILE_CHANGED: { fallbackTitle: "账号信息已被更新", level: "info" },
  PASSWORD_RESET: { fallbackTitle: "密码已被重置", level: "warning" },
  USER_ROLE_CHANGED: { fallbackTitle: "角色已更新", level: "info" },
  USER_SCOPE_CHANGED: { fallbackTitle: "数据范围已更新", level: "info" },
  ORG_BINDING_CREATED: { fallbackTitle: "组织归属已新增", level: "success" },
  ORG_BINDING_UPDATED: { fallbackTitle: "组织归属已更新", level: "info" },
}

function formatNotificationTime(value?: string | null) {
  if (!value) {
    return "刚刚"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function mapNotificationType(type: NotificationType) {
  return (
    notificationTypeMeta[type] ?? {
      fallbackTitle: "系统通知",
      level: "info" as const,
    }
  )
}

function mapNotificationToUi(notification: NotificationRecord): UiNotification {
  const meta = mapNotificationType(notification.notification_type)

  return {
    id: notification.id,
    title: notification.title || meta.fallbackTitle,
    description: notification.content,
    time: formatNotificationTime(notification.created_at),
    read: notification.is_read,
    type: meta.level,
  }
}

function findActiveTrail(
  items: NavItem[],
  trail: Array<{ title: string; href?: string }> = []
): Array<{ title: string; href?: string }> | null {
  for (const item of items) {
    const current = { title: item.title, href: item.href }

    if (item.isActive && !item.items?.length) {
      return [...trail, current]
    }

    if (item.items) {
      const found = findActiveTrail(item.items, [...trail, current])

      if (found) {
        return found
      }
    }
  }

  return null
}

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
  const queryClient = useQueryClient()
  const pathname = usePathname() || "/"
  const currentUser = useAuthStore((state) => state.currentUser as AuthShellUser | null)
  const clearSession = useAuthStore((state) => state.clearSession)

  const user: NonNullable<AdminLayoutProps["user"]> = React.useMemo(
    () => ({
      name:
        currentUser?.full_name ||
        currentUser?.nickname ||
        currentUser?.username ||
        "Admin",
      email: currentUser?.email || currentUser?.username || "admin@example.com",
      roles:
        currentUser?.roles && currentUser.roles.length > 0
          ? currentUser.roles
          : currentUser?.is_superuser
            ? ["superuser"]
            : [],
    }),
    [currentUser]
  )

  const navGroups = React.useMemo<NavGroup[]>(() => {
    const canViewEmployees = hasAnyPermission(currentUser, ["employee.read"])
    const canViewStores =
      hasAnyPermission(currentUser, ["org.store.read"]) &&
      hasAnyPermission(currentUser, ["org.node.read"])
    const canViewIam = hasAnyPermission(currentUser, ["iam.role.read", "iam.permission.read"])
    const groups: NavGroup[] = [
      {
        label: "后台总览",
        items: [{ title: "工作台", href: "/", icon: LayoutDashboard }],
      },
      {
        label: "人员与组织",
        items: [
          ...(canViewEmployees
            ? [{ title: "员工入职与调岗", href: "/employees/onboard", icon: Workflow }]
            : []),
          ...(canViewStores
            ? [{ title: "门店和组织管理", href: "/stores", icon: Store }]
            : []),
        ],
      },
      {
        label: "权限与关联",
        items: canViewIam ? [{ title: "角色权限", href: "/iam", icon: Shield }] : [],
      },
    ]

    return groups
      .filter((group) => group.items.length > 0)
      .map((g) => ({ ...g, items: withActive(g.items, pathname) }))
  }, [currentUser, pathname])

  const breadcrumbs = React.useMemo<NonNullable<AdminLayoutProps["breadcrumbs"]>>(() => {
    const activeTrail =
      findActiveTrail(navGroups.flatMap((group) => group.items)) ?? [
        { title: "工作台" },
      ]

    const currentStoreTitle =
      currentUser?.current_store_name || currentUser?.primary_store_name || "未选择门店"

    return [{ title: currentStoreTitle }, ...activeTrail]
  }, [currentUser?.current_store_name, currentUser?.primary_store_name, navGroups])

  const appTitle =
    currentUser?.current_store_name || currentUser?.primary_store_name || "未选择门店"

  const notificationsQuery = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: getMyNotifications,
    staleTime: 30_000,
  })

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
    },
  })

  const notifications = React.useMemo<UiNotification[]>(() => {
    return (notificationsQuery.data?.data.items ?? []).map(mapNotificationToUi)
  }, [notificationsQuery.data?.data.items])

  const handleNotificationRead = React.useCallback(
    async (notification: UiNotification) => {
      await markReadMutation.mutateAsync(notification.id)
    },
    [markReadMutation]
  )

  const handleNotificationsReadAll = React.useCallback(
    async (items: UiNotification[]) => {
      const unreadItems = items.filter((item) => !item.read)

      await Promise.all(
        unreadItems.map((item) => markReadMutation.mutateAsync(item.id))
      )
    },
    [markReadMutation]
  )

  return (
    <AdminLayout
      appTitle={appTitle}
      appSubtitle="当前门店"
      user={user}
      navGroups={navGroups}
      breadcrumbs={breadcrumbs}
      notifications={notifications}
      onNotificationRead={handleNotificationRead}
      onNotificationsReadAll={handleNotificationsReadAll}
      onNavigate={(href) => router.push(href)}
      onLogout={() => {
        clearSession()
        router.replace("/login")
      }}
    >
      {children}
    </AdminLayout>
  )
}
