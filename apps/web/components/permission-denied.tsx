"use client"

import { LockKeyhole } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"

export function PermissionDenied({
  title = "暂无访问权限",
  description = "当前账号没有访问这个页面所需的权限。",
}: {
  title?: string
  description?: string
}) {
  return (
    <Alert className="border-border/70 bg-muted/20">
      <LockKeyhole className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}
