import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios"

import { dispatchFeedback } from "@/lib/feedback"
import {
  getStoredAccessToken,
  getStoredCurrentStoreId,
} from "@/lib/auth-storage"

export const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken()
  const currentStoreId = getStoredCurrentStoreId()

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`)
  }

  if (currentStoreId) {
    config.headers.set("X-Current-Store-Id", currentStoreId)
  }

  return config
})

type ApiEnvelope<T = unknown> = {
  code?: string
  message?: string
  data?: T
}

function isMutationMethod(method?: string) {
  const normalizedMethod = method?.toUpperCase()
  return normalizedMethod === "POST" || normalizedMethod === "PUT" || normalizedMethod === "DELETE"
}

function getSuccessTitle(method?: string) {
  const normalizedMethod = method?.toUpperCase()

  if (normalizedMethod === "POST") {
    return "操作成功"
  }

  if (normalizedMethod === "PUT") {
    return "更新成功"
  }

  if (normalizedMethod === "DELETE") {
    return "删除成功"
  }

  return "请求成功"
}

function getErrorMessage(errorLike: unknown) {
  if (errorLike instanceof Error && errorLike.message.trim()) {
    return errorLike.message
  }

  return "请求失败"
}

function resolveErrorMessage(payload?: ApiEnvelope<{ errors?: Array<{ field?: string; reason?: string }> }>) {
  const baseMessage = payload?.message?.trim() || "请求失败"
  const details = payload?.data?.errors
    ?.map((item) => [item.field, item.reason].filter(Boolean).join(": "))
    .filter(Boolean)

  if (details && details.length > 0) {
    return `${baseMessage}：${details.join("；")}`
  }

  return baseMessage
}

function notifyMutation(level: "success" | "error", method: string | undefined, message: string) {
  if (!isMutationMethod(method)) {
    return
  }

  dispatchFeedback({
    level,
    title: level === "success" ? getSuccessTitle(method) : "操作失败",
    description: message,
  })
}

// 响应拦截器：统一数据处理
;(apiClient.interceptors.response.use as (...args: unknown[]) => unknown)(
  (response: AxiosResponse) => {
    const payload = response.data as ApiEnvelope<
      { errors?: Array<{ field?: string; reason?: string }> }
    >

    if (payload && typeof payload === "object" && "code" in payload && payload.code !== "SUCCESS") {
      const error = new Error(resolveErrorMessage(payload))
      notifyMutation("error", response.config.method, error.message)
      return Promise.reject(error)
    }

    if (isMutationMethod(response.config.method)) {
      notifyMutation("success", response.config.method, payload?.message?.trim() || "请求已完成")
    }

    return payload
  },
  (error: AxiosError) => {
    const responsePayload = error.response?.data as ApiEnvelope<
      { errors?: Array<{ field?: string; reason?: string }> }
    > | undefined
    const responseData = error.response?.data as { detail?: string } | undefined
    const message =
      resolveErrorMessage(responsePayload) ||
      responseData?.detail ||
      error.message ||
      "请求失败"
    const wrappedError = new Error(message)

    notifyMutation("error", error.config?.method, message)

    return Promise.reject(wrappedError)
  }
)

// Orval 专用的 Mutator
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return apiClient(config)
}
