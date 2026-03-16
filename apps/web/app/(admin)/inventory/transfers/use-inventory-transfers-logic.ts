"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getInventoryReadTransferOrdersQueryKey,
  useInventoryCreateTransferOrderRoute,
  useInventoryReadTransferOrders,
  useInventoryReadWarehouses,
  useInventoryUpdateTransferOrderRoute,
} from "@/api/generated/inventory/inventory"
import type {
  TransferOrderCreate,
  TransferOrderPublic,
  TransferOrderUpdate,
} from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type TransferFormValues = {
  transfer_no: string
  from_warehouse_id: string
  to_warehouse_id: string
  remark: string
}

const DEFAULT_FORM: TransferFormValues = {
  transfer_no: "",
  from_warehouse_id: "",
  to_warehouse_id: "",
  remark: "",
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function useInventoryTransfersLogic() {
  const queryClient = useQueryClient()
  const { profile, hasPermission } = usePermissionAccess()

  const canRead = hasPermission("inventory.transfer.read")
  const canCreate = hasPermission("inventory.transfer.create")
  const canUpdate = hasPermission("inventory.transfer.update")

  const transfersQuery = useInventoryReadTransferOrders({
    query: { enabled: canRead },
  })

  const warehousesQuery = useInventoryReadWarehouses({
    query: { enabled: canRead },
  })

  const createMutation = useInventoryCreateTransferOrderRoute()
  const updateMutation = useInventoryUpdateTransferOrderRoute()

  const transfers = transfersQuery.data?.data ?? []
  const warehouses = warehousesQuery.data?.data ?? []

  const storeId =
    (profile?.current_store_id ?? profile?.primary_store_id) || ""

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState<TransferFormValues>(DEFAULT_FORM)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Status update confirmation state
  const [statusUpdateTarget, setStatusUpdateTarget] = React.useState<{
    transfer: TransferOrderPublic
    newStatus: string
  } | null>(null)
  const [statusUpdateError, setStatusUpdateError] = React.useState<string | null>(null)

  const isSubmitting = createMutation.isPending
  const isUpdatingStatus = updateMutation.isPending

  const getWarehouseName = React.useCallback(
    (id?: string | null): string => {
      if (!id) return "-"
      const warehouse = warehouses.find((w) => w.id === id)
      return warehouse ? warehouse.name : "-"
    },
    [warehouses]
  )

  const invalidateTransfers = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: getInventoryReadTransferOrdersQueryKey(),
    })
  }, [queryClient])

  const openCreateDialog = React.useCallback(() => {
    setForm(DEFAULT_FORM)
    setFormError(null)
    setCreateDialogOpen(true)
  }, [])

  const closeCreateDialog = React.useCallback(() => {
    if (isSubmitting) return

    setCreateDialogOpen(false)
    setForm(DEFAULT_FORM)
    setFormError(null)
  }, [isSubmitting])

  const setField = React.useCallback(
    (field: keyof TransferFormValues, value: string) => {
      setForm((current) => ({ ...current, [field]: value }))
      setFormError(null)
    },
    []
  )

  const submitForm = React.useCallback(async () => {
    if (!form.transfer_no.trim()) {
      setFormError("请填写调拨单号。")
      return
    }

    if (!form.from_warehouse_id) {
      setFormError("请选择调出仓库。")
      return
    }

    if (!form.to_warehouse_id) {
      setFormError("请选择调入仓库。")
      return
    }

    if (form.from_warehouse_id === form.to_warehouse_id) {
      setFormError("调出仓库和调入仓库不能相同。")
      return
    }

    setFormError(null)

    try {
      if (!storeId) {
        setFormError("无法获取门店信息，请刷新页面后重试。")
        return
      }

      await createMutation.mutateAsync({
        data: {
          transfer_no: form.transfer_no.trim(),
          from_warehouse_id: form.from_warehouse_id,
          to_warehouse_id: form.to_warehouse_id,
          remark: form.remark.trim() || null,
        } satisfies TransferOrderCreate,
      })
      toast.success("调拨单已创建")
      await invalidateTransfers()
      closeCreateDialog()
    } catch (error) {
      setFormError(getErrorMessage(error, "创建调拨单失败，请稍后重试。"))
    }
  }, [
    closeCreateDialog,
    createMutation,
    form.from_warehouse_id,
    form.remark,
    form.to_warehouse_id,
    form.transfer_no,
    invalidateTransfers,
    storeId,
  ])

  const requestStatusUpdate = React.useCallback(
    (transfer: TransferOrderPublic, newStatus: string) => {
      setStatusUpdateTarget({ transfer, newStatus })
      setStatusUpdateError(null)
    },
    []
  )

  const closeStatusUpdateDialog = React.useCallback(() => {
    if (isUpdatingStatus) return

    setStatusUpdateTarget(null)
    setStatusUpdateError(null)
  }, [isUpdatingStatus])

  const confirmStatusUpdate = React.useCallback(async () => {
    if (!statusUpdateTarget) return

    setStatusUpdateError(null)

    try {
      await updateMutation.mutateAsync({
        transferId: statusUpdateTarget.transfer.id,
        data: {
          status: statusUpdateTarget.newStatus,
        } satisfies TransferOrderUpdate,
      })
      toast.success("调拨单状态已更新")
      await invalidateTransfers()
      closeStatusUpdateDialog()
    } catch (error) {
      setStatusUpdateError(getErrorMessage(error, "更新状态失败，请稍后重试。"))
    }
  }, [closeStatusUpdateDialog, invalidateTransfers, statusUpdateTarget, updateMutation])

  return {
    canRead,
    canCreate,
    canUpdate,
    transfers,
    warehouses,
    transfersQuery,
    warehousesQuery,
    createDialogOpen,
    form,
    formError,
    statusUpdateTarget,
    statusUpdateError,
    isSubmitting,
    isUpdatingStatus,
    getWarehouseName,
    openCreateDialog,
    closeCreateDialog,
    setField,
    submitForm,
    requestStatusUpdate,
    closeStatusUpdateDialog,
    confirmStatusUpdate,
  }
}
