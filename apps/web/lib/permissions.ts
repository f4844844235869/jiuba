"use client"

import * as React from "react"

import type { CurrentUserProfile } from "@/api/generated/workspace.schemas"
import { getStoredCurrentUser } from "@/lib/auth-storage"
import { useAuthStore } from "@/lib/auth-store"

export function isSuperuser(profile?: CurrentUserProfile | null) {
  return Boolean(profile?.is_superuser)
}

export function getPermissionCodes(profile?: CurrentUserProfile | null) {
  return profile?.permissions ?? []
}

export function hasPermission(
  profile: CurrentUserProfile | null | undefined,
  permission: string
) {
  if (isSuperuser(profile)) {
    return true
  }

  return getPermissionCodes(profile).includes(permission)
}

export function hasAnyPermission(
  profile: CurrentUserProfile | null | undefined,
  permissions: string[]
) {
  if (isSuperuser(profile)) {
    return true
  }

  return permissions.some((permission) => hasPermission(profile, permission))
}

export function hasAllPermissions(
  profile: CurrentUserProfile | null | undefined,
  permissions: string[]
) {
  if (isSuperuser(profile)) {
    return true
  }

  return permissions.every((permission) => hasPermission(profile, permission))
}

export function useCurrentUserProfile() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const storedUser = React.useMemo(
    () => getStoredCurrentUser<CurrentUserProfile>(),
    []
  )

  return currentUser ?? storedUser
}

export function usePermissionAccess() {
  const profile = useCurrentUserProfile()

  return React.useMemo(
    () => ({
      profile,
      permissions: getPermissionCodes(profile),
      hasPermission: (permission: string) => hasPermission(profile, permission),
      hasAnyPermission: (permissions: string[]) =>
        hasAnyPermission(profile, permissions),
      hasAllPermissions: (permissions: string[]) =>
        hasAllPermissions(profile, permissions),
    }),
    [profile]
  )
}
