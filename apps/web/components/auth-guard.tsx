"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuthStore } from "@/lib/auth-store"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  React.useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`)
    }
  }, [isAuthenticated, isHydrated, pathname, router])

  if (!isHydrated || !isAuthenticated) {
    return <FullscreenMessage message="正在检查登录状态..." />
  }

  return <>{children}</>
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  React.useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (isAuthenticated) {
      router.replace("/")
    }
  }, [isAuthenticated, isHydrated, router])

  if (!isHydrated) {
    return <FullscreenMessage message="正在恢复登录会话..." />
  }

  if (isAuthenticated) {
    return <FullscreenMessage message="正在进入后台..." />
  }

  return <>{children}</>
}

function FullscreenMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

