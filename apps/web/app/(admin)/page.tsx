"use client"

import { DashboardView } from "@/app/(admin)/dashboard-view"
import { useDashboardLogic } from "@/app/(admin)/use-dashboard-logic"

export default function DashboardPage() {
  const logic = useDashboardLogic()

  return <DashboardView logic={logic} />
}
