"use client"

export type FeedbackLevel = "success" | "error"

export type FeedbackMessage = {
  id: string
  level: FeedbackLevel
  title: string
  description?: string
  duration?: number
}

const FEEDBACK_EVENT = "workspace-feedback"

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function dispatchFeedback(
  input: Omit<FeedbackMessage, "id"> & { id?: string }
) {
  if (typeof window === "undefined") {
    return
  }

  const message: FeedbackMessage = {
    id: input.id ?? createId(),
    duration: input.duration ?? 3000,
    ...input,
  }

  window.dispatchEvent(new CustomEvent<FeedbackMessage>(FEEDBACK_EVENT, { detail: message }))
}

export function getFeedbackEventName() {
  return FEEDBACK_EVENT
}
