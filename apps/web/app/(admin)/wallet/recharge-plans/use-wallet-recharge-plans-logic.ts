"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getMemberWalletReadRechargePlansQueryKey,
  useMemberWalletCreateRechargePlanRoute,
  useMemberWalletDeleteRechargePlanRoute,
  useMemberWalletReadRechargePlans,
  useMemberWalletUpdateRechargePlanRoute,
} from "@/api/generated/member-wallet/member-wallet"
import type {
  RechargePlanCreate,
  RechargePlanPublic,
  RechargePlanUpdate,
} from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type RechargePlanFormValues = {
  name: string
  recharge_amount: string
  gift_amount: string
  is_active: string
  description: string
}

const DEFAULT_FORM: RechargePlanFormValues = {
  name: "",
  recharge_amount: "",
  gift_amount: "",
  is_active: "true",
  description: "",
}

function toFormValues(item?: RechargePlanPublic | null): RechargePlanFormValues {
  if (!item) return DEFAULT_FORM
  return {
    name: item.name ?? "",
    recharge_amount: item.recharge_amount != null ? String(item.recharge_amount) : "",
    gift_amount: item.gift_amount != null ? String(item.gift_amount) : "",
    is_active: String(item.is_active ?? true),
    description: item.description ?? "",
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

export function useWalletRechargePlansLogic() {
  const queryClient = useQueryClient()
  const { profile, hasPermission } = usePermissionAccess()

  const canRead = hasPermission("wallet.recharge_plan.read")
  const canCreate = hasPermission("wallet.recharge_plan.create")
  const canUpdate = hasPermission("wallet.recharge_plan.update")
  const canDelete = hasPermission("wallet.recharge_plan.delete")

  const rechargePlansQuery = useMemberWalletReadRechargePlans({
    query: { enabled: canRead },
  })

  const createMutation = useMemberWalletCreateRechargePlanRoute()
  const updateMutation = useMemberWalletUpdateRechargePlanRoute()
  const deleteMutation = useMemberWalletDeleteRechargePlanRoute()

  const rechargePlans = rechargePlansQuery.data?.data ?? []
  const storeId = (profile?.current_store_id ?? profile?.primary_store_id) || ""

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create")
  const [editingItem, setEditingItem] = React.useState<RechargePlanPublic | null>(null)
  const [form, setForm] = React.useState<RechargePlanFormValues>(DEFAULT_FORM)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = React.useState<RechargePlanPublic | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  const invalidateRechargePlans = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: getMemberWalletReadRechargePlansQueryKey(),
    })
  }, [queryClient])

  const openCreateDialog = React.useCallback(() => {
    setDialogMode("create")
    setEditingItem(null)
    setForm(DEFAULT_FORM)
    setFormError(null)
    setDialogOpen(true)
  }, [])

  const openEditDialog = React.useCallback((item: RechargePlanPublic) => {
    setDialogMode("edit")
    setEditingItem(item)
    setForm(toFormValues(item))
    setFormError(null)
    setDialogOpen(true)
  }, [])

  const closeDialog = React.useCallback(() => {
    if (isSubmitting) return
    setDialogOpen(false)
    setEditingItem(null)
    setForm(DEFAULT_FORM)
    setFormError(null)
  }, [isSubmitting])

  const setField = React.useCallback(
    (field: keyof RechargePlanFormValues, value: string) => {
      setForm((current) => ({ ...current, [field]: value }))
      setFormError(null)
    },
    []
  )

  const submitForm = React.useCallback(async () => {
    if (!form.name.trim()) {
      setFormError("请填写方案名称。")
      return
    }

    setFormError(null)

    try {
      if (dialogMode === "create") {
        if (!storeId) {
          setFormError("无法获取门店信息，请刷新页面后重试。")
          return
        }

        await createMutation.mutateAsync({
          data: {
            store_id: storeId,
            name: form.name.trim(),
            recharge_amount: form.recharge_amount ? form.recharge_amount.trim() : undefined,
            gift_amount: form.gift_amount ? form.gift_amount.trim() : undefined,
            is_active: form.is_active === "true",
            description: form.description.trim() || null,
          } satisfies RechargePlanCreate,
        })
        toast.success("充值方案已创建")
      } else {
        if (!editingItem) return

        await updateMutation.mutateAsync({
          planId: editingItem.id,
          data: {
            name: form.name.trim(),
            recharge_amount: form.recharge_amount ? form.recharge_amount.trim() : null,
            gift_amount: form.gift_amount ? form.gift_amount.trim() : null,
            is_active: form.is_active === "true",
            description: form.description.trim() || null,
          } satisfies RechargePlanUpdate,
        })
        toast.success("充值方案已更新")
      }

      await invalidateRechargePlans()
      closeDialog()
    } catch (error) {
      const fallback =
        dialogMode === "create"
          ? "创建充值方案失败，请稍后重试。"
          : "保存充值方案失败，请稍后重试。"
      setFormError(getErrorMessage(error, fallback))
    }
  }, [
    closeDialog,
    createMutation,
    dialogMode,
    editingItem,
    form.description,
    form.gift_amount,
    form.is_active,
    form.name,
    form.recharge_amount,
    invalidateRechargePlans,
    storeId,
    updateMutation,
  ])

  const openDeleteDialog = React.useCallback((item: RechargePlanPublic) => {
    setDeleteTarget(item)
    setDeleteError(null)
  }, [])

  const closeDeleteDialog = React.useCallback(() => {
    if (isDeleting) return
    setDeleteTarget(null)
    setDeleteError(null)
  }, [isDeleting])

  const confirmDelete = React.useCallback(async () => {
    if (!deleteTarget) return
    setDeleteError(null)

    try {
      await deleteMutation.mutateAsync({ planId: deleteTarget.id })
      toast.success("充值方案已删除")
      await invalidateRechargePlans()
      setDeleteTarget(null)
    } catch (error) {
      setDeleteError(getErrorMessage(error, "删除充值方案失败，请稍后重试。"))
    }
  }, [deleteTarget, deleteMutation, invalidateRechargePlans])

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    rechargePlansQuery,
    rechargePlans,
    dialogOpen,
    dialogMode,
    editingItem,
    form,
    formError,
    isSubmitting,
    deleteTarget,
    deleteError,
    isDeleting,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    setField,
    submitForm,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  }
}
