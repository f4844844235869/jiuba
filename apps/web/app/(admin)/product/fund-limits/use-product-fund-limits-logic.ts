"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getProductCenterReadFundLimitsQueryKey,
  useProductCenterCreateFundLimitRoute,
  useProductCenterDeleteFundLimitRoute,
  useProductCenterReadFundLimits,
  useProductCenterUpdateFundLimitRoute,
} from "@/api/generated/product-center/product-center"
import type {
  FundLimitCreate,
  FundLimitPublic,
  FundLimitUpdate,
} from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type FundLimitFormValues = {
  name: string
  limit_type: string
  amount: string
  is_active: string
  description: string
}

const DEFAULT_FORM: FundLimitFormValues = {
  name: "",
  limit_type: "",
  amount: "",
  is_active: "true",
  description: "",
}

function toFormValues(item?: FundLimitPublic | null): FundLimitFormValues {
  if (!item) {
    return DEFAULT_FORM
  }

  return {
    name: item.name ?? "",
    limit_type: item.limit_type ?? "",
    amount: item.amount ?? "",
    is_active: String(item.is_active ?? true),
    description: item.description ?? "",
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function useProductFundLimitsLogic() {
  const queryClient = useQueryClient()
  const { profile, hasPermission } = usePermissionAccess()

  const canRead = hasPermission("product.fund_limit.read")
  const canCreate = hasPermission("product.fund_limit.create")
  const canUpdate = hasPermission("product.fund_limit.update")
  const canDelete = hasPermission("product.fund_limit.delete")

  const fundLimitsQuery = useProductCenterReadFundLimits({
    query: { enabled: canRead },
  })

  const createMutation = useProductCenterCreateFundLimitRoute()
  const updateMutation = useProductCenterUpdateFundLimitRoute()
  const deleteMutation = useProductCenterDeleteFundLimitRoute()

  const fundLimits = fundLimitsQuery.data?.data ?? []

  const storeId =
    (profile?.current_store_id ?? profile?.primary_store_id) || ""

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create")
  const [editingItem, setEditingItem] = React.useState<FundLimitPublic | null>(null)
  const [form, setForm] = React.useState<FundLimitFormValues>(DEFAULT_FORM)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = React.useState<FundLimitPublic | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  const invalidateFundLimits = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: getProductCenterReadFundLimitsQueryKey(),
    })
  }, [queryClient])

  const openCreateDialog = React.useCallback(() => {
    setDialogMode("create")
    setEditingItem(null)
    setForm(DEFAULT_FORM)
    setFormError(null)
    setDialogOpen(true)
  }, [])

  const openEditDialog = React.useCallback((item: FundLimitPublic) => {
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
    (field: keyof FundLimitFormValues, value: string) => {
      setForm((current) => ({ ...current, [field]: value }))
      setFormError(null)
    },
    []
  )

  const submitForm = React.useCallback(async () => {
    if (!form.name.trim()) {
      setFormError("请填写限制名称。")
      return
    }

    if (!form.limit_type.trim()) {
      setFormError("请填写限制类型。")
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
            limit_type: form.limit_type.trim(),
            amount: form.amount.trim() || undefined,
            is_active: form.is_active === "true",
            description: form.description.trim() || null,
          } satisfies FundLimitCreate,
        })
        toast.success("资金限制已创建")
      } else {
        if (!editingItem) return

        await updateMutation.mutateAsync({
          fundLimitId: editingItem.id,
          data: {
            name: form.name.trim(),
            limit_type: form.limit_type.trim(),
            amount: form.amount.trim() || null,
            is_active: form.is_active === "true",
            description: form.description.trim() || null,
          } satisfies FundLimitUpdate,
        })
        toast.success("资金限制已更新")
      }

      await invalidateFundLimits()
      closeDialog()
    } catch (error) {
      const fallback =
        dialogMode === "create"
          ? "创建资金限制失败，请稍后重试。"
          : "保存资金限制失败，请稍后重试。"
      setFormError(getErrorMessage(error, fallback))
    }
  }, [
    closeDialog,
    createMutation,
    dialogMode,
    editingItem,
    form.amount,
    form.description,
    form.is_active,
    form.limit_type,
    form.name,
    invalidateFundLimits,
    storeId,
    updateMutation,
  ])

  const requestDelete = React.useCallback((item: FundLimitPublic) => {
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
      await deleteMutation.mutateAsync({ fundLimitId: deleteTarget.id })
      toast.success("资金限制已删除")
      await invalidateFundLimits()
      closeDeleteDialog()
    } catch (error) {
      setDeleteError(getErrorMessage(error, "删除资金限制失败，请稍后重试。"))
    }
  }, [closeDeleteDialog, deleteMutation, deleteTarget, invalidateFundLimits])

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    fundLimits,
    fundLimitsQuery,
    dialogOpen,
    dialogMode,
    editingItem,
    form,
    formError,
    deleteTarget,
    deleteError,
    isSubmitting,
    isDeleting,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    setField,
    submitForm,
    requestDelete,
    closeDeleteDialog,
    confirmDelete,
  }
}
