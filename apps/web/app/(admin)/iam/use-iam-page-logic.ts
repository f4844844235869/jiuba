"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  getIAMReadRolesQueryKey,
  useIAMCreateRole,
  useIAMDeleteRole,
  useIAMReadPermissions,
  useIAMReadRoles,
  useIAMUpdateRole,
} from "@/api/generated/iam/iam"
import type {
  PermissionPublic,
  RoleBase,
  RoleManageUpdate,
  RolePublic,
} from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type RoleFormValues = {
  code: string
  name: string
  status: string
}

const DEFAULT_FORM: RoleFormValues = {
  code: "",
  name: "",
  status: "ACTIVE",
}

function toFormValues(role?: RolePublic | null): RoleFormValues {
  if (!role) {
    return DEFAULT_FORM
  }

  return {
    code: role.code ?? "",
    name: role.name ?? "",
    status: role.status?.trim() || "ACTIVE",
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

function getRolePermissionIds(role?: RolePublic | null) {
  if (!role) {
    return []
  }

  const idsFromField = role.permission_ids?.filter(Boolean) ?? []

  if (idsFromField.length > 0) {
    return idsFromField
  }

  return role.permissions?.map((permission) => permission.id).filter(Boolean) ?? []
}

function groupPermissionsByModule(permissions: PermissionPublic[]) {
  const permissionMap = new Map<string, PermissionPublic[]>()

  permissions.forEach((permission) => {
    const moduleName = permission.module?.trim() || "未分组"
    const currentGroup = permissionMap.get(moduleName) ?? []

    currentGroup.push(permission)
    permissionMap.set(moduleName, currentGroup)
  })

  return Array.from(permissionMap.entries())
    .map(([module, items]) => ({
      module,
      items: items.sort((left, right) => left.name.localeCompare(right.name, "zh-CN")),
    }))
    .sort((left, right) => left.module.localeCompare(right.module, "zh-CN"))
}

export function useIamPageLogic() {
  const queryClient = useQueryClient()
  const { profile, hasAnyPermission, hasPermission } = usePermissionAccess()
  const canReadRoles = hasPermission("iam.role.read")
  const canReadPermissions = hasPermission("iam.permission.read")

  const rolesQuery = useIAMReadRoles({
    query: {
      enabled: canReadRoles,
    },
  })
  const permissionsQuery = useIAMReadPermissions({
    query: {
      enabled: canReadPermissions,
    },
  })
  const createMutation = useIAMCreateRole()
  const updateMutation = useIAMUpdateRole()
  const deleteMutation = useIAMDeleteRole()

  const roles = rolesQuery.data?.data ?? []
  const permissions = permissionsQuery.data?.data ?? []
  const permissionGroups = groupPermissionsByModule(permissions)
  const currentUserId = profile?.id ?? null

  const [createOpen, setCreateOpen] = React.useState(false)
  const [createForm, setCreateForm] = React.useState<RoleFormValues>(DEFAULT_FORM)
  const [createPermissionIds, setCreatePermissionIds] = React.useState<string[]>([])
  const [createError, setCreateError] = React.useState<string | null>(null)

  const [editingRole, setEditingRole] = React.useState<RolePublic | null>(null)
  const [editForm, setEditForm] = React.useState<RoleFormValues>(DEFAULT_FORM)
  const [editPermissionIds, setEditPermissionIds] = React.useState<string[]>([])
  const [editError, setEditError] = React.useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = React.useState<RolePublic | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const isCreating = createMutation.isPending || updateMutation.isPending
  const isUpdating = updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  const invalidateRoles = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: getIAMReadRolesQueryKey() })
  }, [queryClient])

  const openCreateDialog = React.useCallback(() => {
    setCreateOpen(true)
    setCreateForm(DEFAULT_FORM)
    setCreatePermissionIds([])
    setCreateError(null)
  }, [])

  const closeCreateDialog = React.useCallback(() => {
    if (isCreating) {
      return
    }

    setCreateOpen(false)
    setCreateForm(DEFAULT_FORM)
    setCreatePermissionIds([])
    setCreateError(null)
  }, [isCreating])

  const setCreateField = React.useCallback((field: keyof RoleFormValues, value: string) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }))
    setCreateError(null)
  }, [])

  const toggleCreatePermission = React.useCallback((permissionId: string, checked: boolean) => {
    setCreatePermissionIds((current) => {
      if (checked) {
        return current.includes(permissionId) ? current : [...current, permissionId]
      }

      return current.filter((item) => item !== permissionId)
    })
    setCreateError(null)
  }, [])

  const submitCreateRole = React.useCallback(async () => {
    if (!createForm.code.trim() || !createForm.name.trim()) {
      setCreateError("请填写角色名称和角色编码。")
      return
    }

    setCreateError(null)

    try {
      const createResponse = await createMutation.mutateAsync({
        data: {
          code: createForm.code.trim(),
          name: createForm.name.trim(),
          status: createForm.status.trim() || "ACTIVE",
        } satisfies RoleBase,
      })

      const createdRole = createResponse.data

      if (!createdRole?.id) {
        throw new Error(createResponse.message || "角色已创建，但未返回角色标识。")
      }

      await updateMutation.mutateAsync({
        roleId: createdRole.id,
        data: {
          permission_ids: createPermissionIds,
        } satisfies RoleManageUpdate,
      })

      await invalidateRoles()
      closeCreateDialog()
    } catch (error) {
      setCreateError(getErrorMessage(error, "创建角色失败，请稍后重试。"))
    }
  }, [
    closeCreateDialog,
    createForm.code,
    createForm.name,
    createForm.status,
    createMutation,
    createPermissionIds,
    invalidateRoles,
    updateMutation,
  ])

  const canEditRole = React.useCallback(
    (role: RolePublic) => {
      if (!hasPermission("iam.role.update")) {
        return false
      }

      if (!currentUserId) {
        return false
      }

      return role.created_by_user_id === currentUserId
    },
    [currentUserId, hasPermission]
  )

  const openEditDialog = React.useCallback((role: RolePublic) => {
    if (!canEditRole(role)) {
      return
    }

    setEditingRole(role)
    setEditForm(toFormValues(role))
    setEditPermissionIds(getRolePermissionIds(role))
    setEditError(null)
  }, [canEditRole])

  const closeEditDialog = React.useCallback(() => {
    if (isUpdating) {
      return
    }

    setEditingRole(null)
    setEditForm(DEFAULT_FORM)
    setEditPermissionIds([])
    setEditError(null)
  }, [isUpdating])

  const setEditField = React.useCallback((field: keyof RoleFormValues, value: string) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }))
    setEditError(null)
  }, [])

  const toggleEditPermission = React.useCallback((permissionId: string, checked: boolean) => {
    setEditPermissionIds((current) => {
      if (checked) {
        return current.includes(permissionId) ? current : [...current, permissionId]
      }

      return current.filter((item) => item !== permissionId)
    })
    setEditError(null)
  }, [])

  const submitEditRole = React.useCallback(async () => {
    if (!editingRole) {
      return
    }

    if (!editForm.code.trim() || !editForm.name.trim()) {
      setEditError("请填写角色名称和角色编码。")
      return
    }

    setEditError(null)

    try {
      await updateMutation.mutateAsync({
        roleId: editingRole.id,
        data: {
          code: editForm.code.trim(),
          name: editForm.name.trim(),
          status: editForm.status.trim() || "ACTIVE",
          permission_ids: editPermissionIds,
        } satisfies RoleManageUpdate,
      })

      await invalidateRoles()
      closeEditDialog()
    } catch (error) {
      setEditError(getErrorMessage(error, "保存角色失败，请稍后重试。"))
    }
  }, [
    closeEditDialog,
    editForm.code,
    editForm.name,
    editForm.status,
    editPermissionIds,
    editingRole,
    invalidateRoles,
    updateMutation,
  ])

  const requestDelete = React.useCallback((role: RolePublic) => {
    setDeleteTarget(role)
    setDeleteError(null)
  }, [])

  const closeDeleteDialog = React.useCallback(() => {
    if (isDeleting) {
      return
    }

    setDeleteTarget(null)
    setDeleteError(null)
  }, [isDeleting])

  const confirmDelete = React.useCallback(async () => {
    if (!deleteTarget) {
      return
    }

    setDeleteError(null)

    try {
      await deleteMutation.mutateAsync({
        roleId: deleteTarget.id,
      })
      await invalidateRoles()
      closeDeleteDialog()
    } catch (error) {
      setDeleteError(getErrorMessage(error, "删除角色失败，请稍后重试。"))
    }
  }, [closeDeleteDialog, deleteMutation, deleteTarget, invalidateRoles])

  return {
    canViewPage: hasAnyPermission(["iam.role.read", "iam.permission.read"]),
    canReadRoles,
    canReadPermissions,
    canCreateRole: hasPermission("iam.role.create"),
    canUpdateRole: hasPermission("iam.role.update"),
    canEditRole,
    canManagePermissions: hasPermission("iam.role.assign_permission"),
    canDeleteRole: hasPermission("iam.role.delete"),
    roles,
    rolesQuery,
    permissionsQuery,
    permissionGroups,
    createOpen,
    createForm,
    createPermissionIds,
    createError,
    editingRole,
    editForm,
    editPermissionIds,
    editError,
    deleteTarget,
    deleteError,
    isCreating,
    isUpdating,
    isDeleting,
    openCreateDialog,
    closeCreateDialog,
    setCreateField,
    toggleCreatePermission,
    submitCreateRole,
    openEditDialog,
    closeEditDialog,
    setEditField,
    toggleEditPermission,
    submitEditRole,
    requestDelete,
    closeDeleteDialog,
    confirmDelete,
  }
}
