import type { ReactNode } from "react"

import { RequireAuth } from "@/components/auth-guard"
import { AdminShell } from "@/components/admin-shell"

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <RequireAuth>
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  )
}
