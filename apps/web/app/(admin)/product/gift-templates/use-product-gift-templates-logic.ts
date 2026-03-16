"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getProductCenterReadGiftTemplatesQueryKey,
  useProductCenterCreateGiftTemplateRoute,
  useProductCenterDeleteGiftTemplateRoute,
  useProductCenterReadGiftTemplates,
  useProductCenterUpdateGiftTemplateRoute,
} from "@/api/generated/product-center/product-center"
import type {
  GiftTemplateCreate,
  GiftTemplatePublic,
  GiftTemplateUpdate,
} from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type GiftTemplateFormValues = {
  name: string
  gift_type: string
  gift_amount: string
  is_active: string
  description: string
}

const DEFAULT_FORM: GiftTemplateFormValues = {
  name: "",
  gift_type: "AMOUNT",
  gift_amount: "",
  is_active: "true",
  description: "",
}

function toFormValues(template?: GiftTemplatePublic | null): GiftTemplateFormValues {
  if (!template) {
    return DEFAULT_FORM
  }

  return {
    name: template.name ?? "",
    gift_type: template.gift_type ?? "AMOUNT",
    gift_amount: template.gift_amount != null ? String(template.gift_amount) : "",
    is_active: String(template.is_active ?? true),
    description: template.description ?? "",
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function useProductGiftTemplatesLogic() {
  const queryClient = useQueryClient()
  const { profile, hasPermission } = usePermissionAccess()

  const canRead = hasPermission("product.gift_template.read")
  const canCreate = hasPermission("product.gift_template.create")
  const canUpdate = hasPermission("product.gift_template.update")
  const canDelete = hasPermission("product.gift_template.delete")

  const templatesQuery = useProductCenterReadGiftTemplates({
    query: { enabled: canRead },
  })

  const createMutation = useProductCenterCreateGiftTemplateRoute()
  const updateMutation = useProductCenterUpdateGiftTemplateRoute()
  const deleteMutation = useProductCenterDeleteGiftTemplateRoute()

  const templates = templatesQuery.data?.data ?? []

  const storeId =
    (profile?.current_store_id ?? profile?.primary_store_id) || ""

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create")
  const [editingItem, setEditingItem] = React.useState<GiftTemplatePublic | null>(null)
  const [form, setForm] = React.useState<GiftTemplateFormValues>(DEFAULT_FORM)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = React.useState<GiftTemplatePublic | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  const invalidateTemplates = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: getProductCenterReadGiftTemplatesQueryKey(),
    })
  }, [queryClient])

  const openCreateDialog = React.useCallback(() => {
    setDialogMode("create")
    setEditingItem(null)
    setForm(DEFAULT_FORM)
    setFormError(null)
    setDialogOpen(true)
  }, [])

  const openEditDialog = React.useCallback((template: GiftTemplatePublic) => {
    setDialogMode("edit")
    setEditingItem(template)
    setForm(toFormValues(template))
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
    (field: keyof GiftTemplateFormValues, value: string) => {
      setForm((current) => ({ ...current, [field]: value }))
      setFormError(null)
    },
    []
  )

  const submitForm = React.useCallback(async () => {
    if (!form.name.trim()) {
      setFormError("请填写模板名称。")
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
            gift_type: form.gift_type || undefined,
            gift_amount: form.gift_amount.trim() || undefined,
            is_active: form.is_active === "true",
            description: form.description.trim() || undefined,
          } satisfies GiftTemplateCreate,
        })
        toast.success("赠品模板已创建")
      } else {
        if (!editingItem) return

        await updateMutation.mutateAsync({
          giftTemplateId: editingItem.id,
          data: {
            name: form.name.trim(),
            gift_type: form.gift_type || undefined,
            gift_amount: form.gift_amount.trim() || undefined,
            is_active: form.is_active === "true",
            description: form.description.trim() || undefined,
          } satisfies GiftTemplateUpdate,
        })
        toast.success("赠品模板已更新")
      }

      await invalidateTemplates()
      closeDialog()
    } catch (error) {
      const fallback =
        dialogMode === "create" ? "创建赠品模板失败，请稍后重试。" : "保存赠品模板失败，请稍后重试。"
      setFormError(getErrorMessage(error, fallback))
    }
  }, [
    closeDialog,
    createMutation,
    dialogMode,
    editingItem,
    form.description,
    form.gift_amount,
    form.gift_type,
    form.is_active,
    form.name,
    invalidateTemplates,
    storeId,
    updateMutation,
  ])

  const requestDelete = React.useCallback((template: GiftTemplatePublic) => {
    setDeleteTarget(template)
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
      await deleteMutation.mutateAsync({ giftTemplateId: deleteTarget.id })
      toast.success("赠品模板已删除")
      await invalidateTemplates()
      closeDeleteDialog()
    } catch (error) {
      setDeleteError(getErrorMessage(error, "删除赠品模板失败，请稍后重试。"))
    }
  }, [closeDeleteDialog, deleteMutation, deleteTarget, invalidateTemplates])

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    templates,
    templatesQuery,
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
