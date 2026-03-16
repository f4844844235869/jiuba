"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { useAuthStore } from "@/lib/auth-store"
import { FeedbackToaster } from "@/components/feedback-toaster"
import { ThemeProvider } from "@/components/theme-provider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthBootstrap>
          {children}
          <FeedbackToaster />
        </AuthBootstrap>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((state) => state.restoreSession)
  const hasStarted = React.useRef(false)

  React.useEffect(() => {
    if (hasStarted.current) {
      return
    }

    hasStarted.current = true
    void restoreSession()
  }, [restoreSession])

  return children
}
