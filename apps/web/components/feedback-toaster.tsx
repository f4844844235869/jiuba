"use client"

import * as React from "react"
import { CheckCircle2, CircleAlert, X } from "lucide-react"

import { getFeedbackEventName, type FeedbackMessage } from "@/lib/feedback"
import { cn } from "@workspace/ui/lib/utils"

type ToastItem = FeedbackMessage

const ICONS = {
  success: CheckCircle2,
  error: CircleAlert,
} as const

export function FeedbackToaster() {
  const [messages, setMessages] = React.useState<ToastItem[]>([])

  React.useEffect(() => {
    const dismiss = (id: string) => {
      setMessages((current) => current.filter((item) => item.id !== id))
    }

    const handleFeedback = (event: Event) => {
      const customEvent = event as CustomEvent<FeedbackMessage>
      const nextMessage = customEvent.detail

      setMessages((current) => {
        const filtered = current.filter((item) => item.id !== nextMessage.id)
        return [...filtered, nextMessage]
      })

      window.setTimeout(() => dismiss(nextMessage.id), nextMessage.duration ?? 3000)
    }

    window.addEventListener(getFeedbackEventName(), handleFeedback as EventListener)

    return () => {
      window.removeEventListener(getFeedbackEventName(), handleFeedback as EventListener)
    }
  }, [])

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,24rem)] flex-col gap-3">
      {messages.map((message) => {
        const Icon = ICONS[message.level]

        return (
          <div
            key={message.id}
            className={cn(
              "pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm",
              message.level === "success"
                ? "border-emerald-500/20 bg-emerald-50/95 text-emerald-950 dark:bg-emerald-950/90 dark:text-emerald-50"
                : "border-destructive/20 bg-destructive/10 text-foreground"
            )}
          >
            <div className="flex items-start gap-3">
              <Icon
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  message.level === "success" ? "text-emerald-600 dark:text-emerald-300" : "text-destructive"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{message.title}</div>
                {message.description ? (
                  <div className="mt-1 text-sm text-muted-foreground">{message.description}</div>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="关闭提示"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                onClick={() =>
                  setMessages((current) => current.filter((item) => item.id !== message.id))
                }
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
