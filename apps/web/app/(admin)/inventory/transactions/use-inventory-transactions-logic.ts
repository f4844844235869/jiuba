"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getInventoryReadInventoryTransactionsQueryKey,
  useInventoryCreateInventoryTransactionRoute,
  useInventoryReadInventoryTransactions,
  useInventoryReadWarehouses,
} from "@/api/generated/inventory/inventory"
import type { InventoryTransactionCreate } from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type TransactionFormValues = {
  sku_id: string
  transaction_type: string
  quantity: string
  remark: string
}

const DEFAULT_FORM: TransactionFormValues = {
  sku_id: "",
  transaction_type: "IN",
  quantity: "",
  remark: "",
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function useInventoryTransactionsLogic() {
  const queryClient = useQueryClient()
  const { hasPermission } = usePermissionAccess()

  const canReadWarehouse = hasPermission("inventory.warehouse.read")
  const canRead = hasPermission("inventory.transaction.read")
  const canCreate = hasPermission("inventory.transaction.create")

  const warehousesQuery = useInventoryReadWarehouses({
    query: { enabled: canReadWarehouse },
  })

  const warehouses = warehousesQuery.data?.data ?? []

  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string>("")

  const transactionsQuery = useInventoryReadInventoryTransactions(
    selectedWarehouseId,
    { query: { enabled: canRead && Boolean(selectedWarehouseId) } }
  )

  const transactions = transactionsQuery.data?.data ?? []

  const createMutation = useInventoryCreateInventoryTransactionRoute()

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [form, setForm] = React.useState<TransactionFormValues>(DEFAULT_FORM)
  const [formError, setFormError] = React.useState<string | null>(null)

  const isSubmitting = createMutation.isPending

  const invalidateTransactions = React.useCallback(async () => {
    if (!selectedWarehouseId) return

    await queryClient.invalidateQueries({
      queryKey: getInventoryReadInventoryTransactionsQueryKey(selectedWarehouseId),
    })
  }, [queryClient, selectedWarehouseId])

  const openCreateDialog = React.useCallback(() => {
    setForm(DEFAULT_FORM)
    setFormError(null)
    setDialogOpen(true)
  }, [])

  const closeDialog = React.useCallback(() => {
    if (isSubmitting) return

    setDialogOpen(false)
    setForm(DEFAULT_FORM)
    setFormError(null)
  }, [isSubmitting])

  const setField = React.useCallback(
    (field: keyof TransactionFormValues, value: string) => {
      setForm((current) => ({ ...current, [field]: value }))
      setFormError(null)
    },
    []
  )

  const submitForm = React.useCallback(async () => {
    if (!form.sku_id.trim()) {
      setFormError("请填写 SKU ID。")
      return
    }

    if (!form.quantity.trim() || isNaN(Number(form.quantity))) {
      setFormError("请填写有效的变动数量。")
      return
    }

    if (!selectedWarehouseId) {
      setFormError("请先选择仓库。")
      return
    }

    setFormError(null)

    try {
      await createMutation.mutateAsync({
        data: {
          warehouse_id: selectedWarehouseId,
          sku_id: form.sku_id.trim(),
          transaction_type: form.transaction_type,
          quantity: Number(form.quantity),
          remark: form.remark.trim() || null,
        } satisfies InventoryTransactionCreate,
      })
      toast.success("库存流水已录入")
      await invalidateTransactions()
      closeDialog()
    } catch (error) {
      setFormError(getErrorMessage(error, "录入库存流水失败，请稍后重试。"))
    }
  }, [
    closeDialog,
    createMutation,
    form.quantity,
    form.remark,
    form.sku_id,
    form.transaction_type,
    invalidateTransactions,
    selectedWarehouseId,
  ])

  return {
    canReadWarehouse,
    canRead,
    canCreate,
    warehouses,
    warehousesQuery,
    selectedWarehouseId,
    setSelectedWarehouseId,
    transactions,
    transactionsQuery,
    dialogOpen,
    form,
    formError,
    isSubmitting,
    openCreateDialog,
    closeDialog,
    setField,
    submitForm,
  }
}
