"use client"

import { apiClient } from "@/lib/api-client"

export type NotificationType =
  | "PROFILE_UPDATED"
  | "PASSWORD_UPDATED"
  | "PROFILE_CHANGED"
  | "PASSWORD_RESET"
  | "USER_ROLE_CHANGED"
  | "USER_SCOPE_CHANGED"
  | "ORG_BINDING_CREATED"
  | "ORG_BINDING_UPDATED"
  | (string & {})

export type NotificationRecord = {
  user_id: string
  notification_type: NotificationType
  title: string
  content: string
  is_read: boolean
  id: string
  read_at: string | null
  created_at: string
  updated_at: string
}

type NotificationListResponse = {
  code: string
  message: string
  data: {
    items: NotificationRecord[]
    unread_count: number
  }
  trace_id?: string
}

type NotificationMutationResponse = {
  code: string
  message: string
  data?: unknown
  trace_id?: string
}

export async function getMyNotifications() {
  return apiClient.get<NotificationListResponse, NotificationListResponse>(
    "/api/v1/notifications/me"
  )
}

export async function markNotificationRead(notificationId: string) {
  return apiClient.patch<NotificationMutationResponse, NotificationMutationResponse>(
    `/api/v1/notifications/${notificationId}/read`
  )
}
