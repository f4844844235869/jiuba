"use client"

import { create } from "zustand"

import { authReadCurrentUser } from "@/api/generated/auth/auth"
import type { CurrentUserProfile } from "@/api/generated/workspace.schemas"
import {
  clearStoredAccessToken,
  clearStoredCurrentStoreId,
  clearStoredCurrentUser,
  getStoredAccessToken,
  getStoredCurrentUser,
  setStoredAccessToken,
  setStoredCurrentStoreId,
  setStoredCurrentUser,
} from "@/lib/auth-storage"

type AuthState = {
  accessToken: string | null
  currentUser: CurrentUserProfile | null
  isHydrated: boolean
  isRestoring: boolean
  isAuthenticated: boolean
  setSession: (token: string, user: CurrentUserProfile) => void
  clearSession: () => void
  restoreSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  currentUser: null,
  isHydrated: false,
  isRestoring: false,
  isAuthenticated: false,
  setSession: (token, user) => {
    setStoredAccessToken(token)
    setStoredCurrentStoreId(user.current_store_id)
    setStoredCurrentUser(user)

    set({
      accessToken: token,
      currentUser: user,
      isAuthenticated: true,
      isHydrated: true,
      isRestoring: false,
    })
  },
  clearSession: () => {
    clearStoredAccessToken()
    clearStoredCurrentStoreId()
    clearStoredCurrentUser()

    set({
      accessToken: null,
      currentUser: null,
      isAuthenticated: false,
      isHydrated: true,
      isRestoring: false,
    })
  },
  restoreSession: async () => {
    const storedToken = getStoredAccessToken()
    const storedUser = getStoredCurrentUser<CurrentUserProfile>()

    if (!storedToken) {
      set({
        accessToken: null,
        currentUser: null,
        isAuthenticated: false,
        isHydrated: true,
        isRestoring: false,
      })
      return
    }

    if (get().isRestoring) {
      return
    }

    set({
      accessToken: storedToken,
      currentUser: storedUser,
      isAuthenticated: Boolean(storedUser),
      isRestoring: true,
    })

    try {
      const response = await authReadCurrentUser()
      const user = response.data

      if (!user) {
        throw new Error(response.message || "未获取到当前用户信息")
      }

      setStoredCurrentStoreId(user.current_store_id)
      setStoredCurrentUser(user)

      set({
        accessToken: storedToken,
        currentUser: user,
        isAuthenticated: true,
        isHydrated: true,
        isRestoring: false,
      })
    } catch {
      clearStoredAccessToken()
      clearStoredCurrentStoreId()
      clearStoredCurrentUser()

      set({
        accessToken: null,
        currentUser: null,
        isAuthenticated: false,
        isHydrated: true,
        isRestoring: false,
      })
    }
  },
}))
