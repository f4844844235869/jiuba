"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getInventoryReadWarehousesQueryKey,
  useInventoryCreateWarehouseRoute,
  useInventoryDeleteWarehouseRoute,
  useInventoryReadWarehouses,
  useInventoryUpdateWarehouseRoute,
} from "@/api/generated/inventory/inventory"
import type {
  WarehouseCreate,
  WarehousePublic,
  WarehouseUpdate,
} from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type WarehouseFormValues = {
  code: string
  name: string
  warehouse_type: string
  is_active: string
  address: string
  remark: string
}

export type WarehouseFormError =
  | { type: "field"; field: "code" | "name"; message: string }
  | { type: "code_exists" }
  | { type: "generic"; message: string }

const DEFAULT_FORM: WarehouseFormValues = {
  code: "",
  name: "",
  warehouse_type: "MAIN",
  is_active: "true",
  address: "",
  remark: "",
}

function toFormValues(warehouse?: WarehousePublic | null): WarehouseFormValues {
  if (!warehouse) {
    return DEFAULT_FORM
  }

  return {
    code: warehouse.code ?? "",
    name: warehouse.name ?? "",
    warehouse_type: warehouse.warehouse_type ?? "MAIN",
    is_active: String(warehouse.is_active ?? true),
    address: warehouse.address ?? "",
    remark: warehouse.remark ?? "",
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function useInventoryWarehousesLogic() {
  const queryClient = useQueryClient()
  const { profile, hasPermission } = usePermissionAccess()

  const canRead = hasPermission("inventory.warehouse.read")
  const canCreate = hasPermission("inventory.warehouse.create")
  const canUpdate = hasPermission("inventory.warehouse.update")
  const canDelete = hasPermission("inventory.warehouse.delete")

  const warehousesQuery = useInventoryReadWarehouses({
    query: { enabled: canRead },
  })

  const createMutation = useInventoryCreateWarehouseRoute()
  const updateMutation = useInventoryUpdateWarehouseRoute()
  const deleteMutation = useInventoryDeleteWarehouseRoute()

  const warehouses = warehousesQuery.data?.data ?? []

  const storeId =
    (profile?.current_store_id ?? profile?.primary_store_id) || ""

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">("create")
  const [editingItem, setEditingItem] = React.useState<WarehousePublic | null>(null)
  const [form, setForm] = React.useState<WarehouseFormValues>(DEFAULT_FORM)
  const [formError, setFormError] = React.useState<WarehouseFormError | null>(null)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = React.useState<WarehousePublic | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  const invalidateWarehouses = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: getInventoryReadWarehousesQueryKey(),
    })
  }, [queryClient])

  const openCreateDialog = React.useCallback(() => {
    setDialogMode("create")
    setEditingItem(null)
    setForm(DEFAULT_FORM)
    setFormError(null)
    setDialogOpen(true)
  }, [])

  const openEditDialog = React.useCallback((warehouse: WarehousePublic) => {
    setDialogMode("edit")
    setEditingItem(warehouse)
    setForm(toFormValues(warehouse))
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
    (field: keyof WarehouseFormValues, value: string) => {
      setForm((current) => ({ ...current, [field]: value }))
      setFormError(null)
    },
    []
  )

  const submitForm = React.useCallback(async () => {
    if (!form.code.trim()) {
      setFormError({ type: "field", field: "code", message: "请填写仓库编码。" })
      return
    }

    if (!form.name.trim()) {
      setFormError({ type: "field", field: "name", message: "请填写仓库名称。" })
      return
    }

    setFormError(null)

    try {
      if (dialogMode === "create") {
        if (!storeId) {
          setFormError({ type: "generic", message: "无法获取门店信息，请刷新页面后重试。" })
          return
        }

        await createMutation.mutateAsync({
          data: {
            store_id: storeId,
            code: form.code.trim(),
            name: form.name.trim(),
            warehouse_type: form.warehouse_type,
            is_active: form.is_active === "true",
            address: form.address.trim() || null,
            remark: form.remark.trim() || null,
          } satisfies WarehouseCreate,
        })
        toast.success("仓库已创建")
      } else {
        if (!editingItem) return

        await updateMutation.mutateAsync({
          warehouseId: editingItem.id,
          data: {
            code: form.code.trim(),
            name: form.name.trim(),
            warehouse_type: form.warehouse_type,
            is_active: form.is_active === "true",
            address: form.address.trim() || null,
            remark: form.remark.trim() || null,
          } satisfies WarehouseUpdate,
        })
        toast.success("仓库已更新")
      }

      await invalidateWarehouses()
      closeDialog()
    } catch (error) {
      const message = getErrorMessage(error, "")
      if (message === "WAREHOUSE_CODE_EXISTS") {
        setFormError({ type: "code_exists" })
        return
      }

      const fallback =
        dialogMode === "create" ? "创建仓库失败，请稍后重试。" : "保存仓库失败，请稍后重试。"
      setFormError({ type: "generic", message: message || fallback })
    }
  }, [
    closeDialog,
    createMutation,
    dialogMode,
    editingItem,
    form.address,
    form.code,
    form.is_active,
    form.name,
    form.remark,
    form.warehouse_type,
    invalidateWarehouses,
    storeId,
    updateMutation,
  ])

  const requestDelete = React.useCallback((warehouse: WarehousePublic) => {
    setDeleteTarget(warehouse)
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
      await deleteMutation.mutateAsync({ warehouseId: deleteTarget.id })
      toast.success("仓库已删除")
      await invalidateWarehouses()
      closeDeleteDialog()
    } catch (error) {
      setDeleteError(getErrorMessage(error, "删除仓库失败，请稍后重试。"))
    }
  }, [closeDeleteDialog, deleteMutation, deleteTarget, invalidateWarehouses])

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    warehouses,
    warehousesQuery,
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
