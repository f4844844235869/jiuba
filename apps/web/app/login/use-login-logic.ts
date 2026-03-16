"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  authReadCurrentUser,
  useAuthBackendPasswordLogin,
} from "@/api/generated/auth/auth"
import type { BackendPasswordLoginRequest } from "@/api/generated/workspace.schemas"
import {
  clearStoredAccessToken,
  clearStoredCurrentStoreId,
  clearStoredCurrentUser,
  setStoredAccessToken,
} from "@/lib/auth-storage"
import { useAuthStore } from "@/lib/auth-store"

const DEFAULT_FORM: BackendPasswordLoginRequest = {
  account: "admin@example.com",
  password: "",
}

export function useLoginLogic() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setSession = useAuthStore((state) => state.setSession)
  const [form, setForm] = React.useState<BackendPasswordLoginRequest>(DEFAULT_FORM)
  const [error, setError] = React.useState<string | null>(null)

  const loginMutation = useAuthBackendPasswordLogin()

  const setField = React.useCallback(
    (field: keyof BackendPasswordLoginRequest, value: string) => {
      if (error) {
        setError(null)
      }

      setForm((current) => ({
        ...current,
        [field]: value,
      }))
    },
    [error]
  )

  const handleSubmit = React.useCallback(async () => {
    if (!form.account.trim() || !form.password.trim()) {
      setError("请输入账号和密码")
      return
    }

    setError(null)

    try {
      const loginResponse = await loginMutation.mutateAsync({ data: form })
      const token = loginResponse.data?.access_token

      if (!token) {
        throw new Error(loginResponse.message || "登录成功但未返回访问令牌")
      }

      setStoredAccessToken(token)

      const meResponse = await authReadCurrentUser()
      const currentUser = meResponse.data

      if (!currentUser) {
        throw new Error(meResponse.message || "未获取到当前用户信息")
      }

      setSession(token, currentUser)
      router.replace(searchParams.get("next") || "/")
    } catch (submitError) {
      clearStoredAccessToken()
      clearStoredCurrentStoreId()
      clearStoredCurrentUser()
      setError(
        submitError instanceof Error ? submitError.message : "登录失败，请稍后重试"
      )
    }
  }, [form, loginMutation, router, searchParams, setSession])

  return {
    form,
    error,
    isSubmitting: loginMutation.isPending,
    canSubmit: Boolean(form.account.trim() && form.password.trim()),
    nextPath: searchParams.get("next") || "/",
    setField,
    handleSubmit,
  }
}
