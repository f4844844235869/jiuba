"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getProductCenterReadCategoriesQueryKey,
  useProductCenterCreateCategoryRoute,
  useProductCenterDeleteCategoryRoute,
  useProductCenterReadCategories,
  useProductCenterUpdateCategoryRoute,
} from "@/api/generated/product-center/product-center"
import type {
  CategoryCreate,
  CategoryPublic,
  CategoryUpdate,
} from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type CategoryFormValues = {
  name: string
  parent_id: string
  sort_order: string
  is_active: string
}

const DEFAULT_FORM: CategoryFormValues = {
  name: "",
  parent_id: "",
  sort_order: "0",
  is_active: "true",
}

function toFormValues(category?: CategoryPublic | null): CategoryFormValues {
  if (!category) {
    return DEFAULT_FORM
  }

  return {
    name: category.name ?? "",
    parent_id: category.parent_id ?? "",
    sort_order: String(category.sort_order ?? 0),
    is_active: String(category.is_active ?? true),
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function useProductCategoriesLogic() {
  const queryClient = useQueryClient()
  const { profile, hasPermission } = usePermissionAccess()

  const canRead = hasPermission("product.category.read")
  const canCreate = hasPermission("product.category.create")
  const canUpdate = hasPermission("product.category.update")
  const canDelete = hasPermission("product.category.delete")

  const categoriesQuery = useProductCenterReadCategories({
    query: { enabled: canRead },
  })

  const createMutation = useProductCenterCreateCategoryRoute()
  const updateMutation = useProductCenterUpdateCategoryRoute()
  const deleteMutation = useProductCenterDeleteCategoryRoute()

  const categories = categoriesQuery.data?.data ?? []

  const storeId =
    (profile?.current_store_id ?? profile?.primary_store_id) || ""

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create")
  const [editingItem, setEditingItem] = React.useState<CategoryPublic | null>(null)
  const [form, setForm] = React.useState<CategoryFormValues>(DEFAULT_FORM)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = React.useState<CategoryPublic | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  const invalidateCategories = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: getProductCenterReadCategoriesQueryKey(),
    })
  }, [queryClient])

  const openCreateDialog = React.useCallback(() => {
    setDialogMode("create")
    setEditingItem(null)
    setForm(DEFAULT_FORM)
    setFormError(null)
    setDialogOpen(true)
  }, [])

  const openEditDialog = React.useCallback((category: CategoryPublic) => {
    setDialogMode("edit")
    setEditingItem(category)
    setForm(toFormValues(category))
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
    (field: keyof CategoryFormValues, value: string) => {
      setForm((current) => ({ ...current, [field]: value }))
      setFormError(null)
    },
    []
  )

  const submitForm = React.useCallback(async () => {
    if (!form.name.trim()) {
      setFormError("请填写分类名称。")
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
            parent_id: form.parent_id.trim() || null,
            sort_order: Number(form.sort_order) || 0,
            is_active: form.is_active === "true",
          } satisfies CategoryCreate,
        })
        toast.success("分类已创建")
      } else {
        if (!editingItem) return

        await updateMutation.mutateAsync({
          categoryId: editingItem.id,
          data: {
            name: form.name.trim(),
            parent_id: form.parent_id.trim() || null,
            sort_order: Number(form.sort_order) || 0,
            is_active: form.is_active === "true",
          } satisfies CategoryUpdate,
        })
        toast.success("分类已更新")
      }

      await invalidateCategories()
      closeDialog()
    } catch (error) {
      const fallback =
        dialogMode === "create" ? "创建分类失败，请稍后重试。" : "保存分类失败，请稍后重试。"
      setFormError(getErrorMessage(error, fallback))
    }
  }, [
    closeDialog,
    createMutation,
    dialogMode,
    editingItem,
    form.is_active,
    form.name,
    form.parent_id,
    form.sort_order,
    invalidateCategories,
    storeId,
    updateMutation,
  ])

  const requestDelete = React.useCallback((category: CategoryPublic) => {
    setDeleteTarget(category)
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
      await deleteMutation.mutateAsync({ categoryId: deleteTarget.id })
      toast.success("分类已删除")
      await invalidateCategories()
      closeDeleteDialog()
    } catch (error) {
      setDeleteError(getErrorMessage(error, "删除分类失败，请稍后重试。"))
    }
  }, [closeDeleteDialog, deleteMutation, deleteTarget, invalidateCategories])

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    categories,
    categoriesQuery,
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
