"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getPOSReadShiftsQueryKey,
  usePOSCreateShiftRoute,
  usePOSReadShifts,
  usePOSUpdateShiftRoute,
} from "@/api/generated/pos/pos"
import type {
  ShiftHandoverPublic,
} from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type CreateShiftFormValues = {
  shift_date: string
  shift_type: string
  cash_amount: string
  remark: string
}

export type UpdateShiftFormValues = {
  cash_amount: string
  total_sales: string
  order_count: string
  remark: string
}

const DEFAULT_CREATE_FORM: CreateShiftFormValues = {
  shift_date: "",
  shift_type: "MORNING",
  cash_amount: "0",
  remark: "",
}

const DEFAULT_UPDATE_FORM: UpdateShiftFormValues = {
  cash_amount: "0",
  total_sales: "0",
  order_count: "0",
  remark: "",
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

export function usePOSShiftsLogic() {
  const queryClient = useQueryClient()
  const { profile, hasPermission } = usePermissionAccess()

  const canRead = hasPermission("pos.shift.read")
  const canCreate = hasPermission("pos.shift.create")
  const canUpdate = hasPermission("pos.shift.update")

  const storeId = (profile?.current_store_id ?? profile?.primary_store_id) || ""
  const operatorId = profile?.id ?? ""

  const shiftsQuery = usePOSReadShifts({ query: { enabled: canRead } })
  const createMutation = usePOSCreateShiftRoute()
  const updateMutation = usePOSUpdateShiftRoute()

  const shifts = shiftsQuery.data?.data ?? []

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [createForm, setCreateForm] = React.useState<CreateShiftFormValues>(DEFAULT_CREATE_FORM)
  const [createError, setCreateError] = React.useState<string | null>(null)

  // Update dialog state
  const [editingShift, setEditingShift] = React.useState<ShiftHandoverPublic | null>(null)
  const [updateForm, setUpdateForm] = React.useState<UpdateShiftFormValues>(DEFAULT_UPDATE_FORM)
  const [updateError, setUpdateError] = React.useState<string | null>(null)

  function openCreateDialog() {
    setCreateForm(DEFAULT_CREATE_FORM)
    setCreateError(null)
    setCreateDialogOpen(true)
  }

  function closeCreateDialog() {
    setCreateDialogOpen(false)
    setCreateError(null)
  }

  function openUpdateDialog(shift: ShiftHandoverPublic) {
    setEditingShift(shift)
    setUpdateForm({
      cash_amount: shift.cash_amount ?? "0",
      total_sales: shift.total_sales ?? "0",
      order_count: String(shift.order_count ?? 0),
      remark: shift.remark ?? "",
    })
    setUpdateError(null)
  }

  function closeUpdateDialog() {
    setEditingShift(null)
    setUpdateError(null)
  }

  function setCreateField(field: keyof CreateShiftFormValues, value: string) {
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  function setUpdateField(field: keyof UpdateShiftFormValues, value: string) {
    setUpdateForm((prev) => ({ ...prev, [field]: value }))
  }

  async function submitCreate() {
    if (!storeId || !operatorId) {
      setCreateError("缺少门店或操作人员信息")
      return
    }
    setCreateError(null)
    try {
      await createMutation.mutateAsync({
        data: {
          store_id: storeId,
          shift_date: createForm.shift_date,
          shift_type: createForm.shift_type || undefined,
          operator_id: operatorId,
          cash_amount: createForm.cash_amount || undefined,
          remark: createForm.remark || undefined,
          status: "OPEN",
        },
      })
      await queryClient.invalidateQueries({ queryKey: getPOSReadShiftsQueryKey() })
      toast.success("开班成功")
      closeCreateDialog()
    } catch (error) {
      setCreateError(getErrorMessage(error, "开班失败，请重试"))
    }
  }

  async function submitUpdate() {
    if (!editingShift) return
    setUpdateError(null)
    try {
      await updateMutation.mutateAsync({
        shiftId: editingShift.id,
        data: {
          cash_amount: updateForm.cash_amount || undefined,
          total_sales: updateForm.total_sales || undefined,
          order_count: updateForm.order_count ? Number(updateForm.order_count) : undefined,
          remark: updateForm.remark || undefined,
          status: "CLOSED",
        },
      })
      await queryClient.invalidateQueries({ queryKey: getPOSReadShiftsQueryKey() })
      toast.success("结班成功")
      closeUpdateDialog()
    } catch (error) {
      setUpdateError(getErrorMessage(error, "结班失败，请重试"))
    }
  }

  return {
    canRead,
    canCreate,
    canUpdate,
    shiftsQuery,
    shifts,
    // Create dialog
    createDialogOpen,
    createForm,
    createError,
    isCreating: createMutation.isPending,
    openCreateDialog,
    closeCreateDialog,
    setCreateField,
    submitCreate,
    // Update dialog
    editingShift,
    updateForm,
    updateError,
    isUpdating: updateMutation.isPending,
    openUpdateDialog,
    closeUpdateDialog,
    setUpdateField,
    submitUpdate,
  }
}
