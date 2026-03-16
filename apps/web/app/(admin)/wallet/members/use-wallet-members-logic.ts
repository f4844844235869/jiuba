"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getMemberWalletReadGiftAccountQueryKey,
  getMemberWalletReadMembersQueryKey,
  getMemberWalletReadPrincipalAccountQueryKey,
  useMemberWalletCreateMemberRoute,
  useMemberWalletDeleteMemberRoute,
  useMemberWalletReadGiftAccount,
  useMemberWalletReadMembers,
  useMemberWalletReadPrincipalAccount,
  useMemberWalletReadRechargePlans,
  useMemberWalletReadWalletTransactions,
  useMemberWalletRechargeRoute,
  useMemberWalletUpdateMemberRoute,
} from "@/api/generated/member-wallet/member-wallet"
import type {
  MemberCreate,
  MemberPublic,
  MemberUpdate,
} from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type MemberFormValues = {
  member_no: string
  name: string
  mobile: string
  status: string
  level: string
}

export type RechargeFormValues = {
  recharge_plan_id: string
  remark: string
}

const DEFAULT_MEMBER_FORM: MemberFormValues = {
  member_no: "",
  name: "",
  mobile: "",
  status: "ACTIVE",
  level: "",
}

const DEFAULT_RECHARGE_FORM: RechargeFormValues = {
  recharge_plan_id: "",
  remark: "",
}

function toMemberFormValues(member?: MemberPublic | null): MemberFormValues {
  if (!member) return DEFAULT_MEMBER_FORM

  return {
    member_no: member.member_no ?? "",
    name: member.name ?? "",
    mobile: member.mobile ?? "",
    status: member.status ?? "ACTIVE",
    level: member.level ?? "",
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function useWalletMembersLogic() {
  const queryClient = useQueryClient()
  const { profile, hasPermission } = usePermissionAccess()

  const canReadMember = hasPermission("wallet.member.read")
  const canCreateMember = hasPermission("wallet.member.create")
  const canUpdateMember = hasPermission("wallet.member.update")
  const canDeleteMember = hasPermission("wallet.member.delete")
  const canReadAccount = hasPermission("wallet.account.read")
  const canRecharge = hasPermission("wallet.recharge.create")

  const storeId = (profile?.current_store_id ?? profile?.primary_store_id) || ""

  // Selected member for detail sheet
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null)

  // Member dialog state
  const [memberDialogOpen, setMemberDialogOpen] = React.useState(false)
  const [memberDialogMode, setMemberDialogMode] = React.useState<"create" | "edit">("create")
  const [editingMember, setEditingMember] = React.useState<MemberPublic | null>(null)
  const [memberForm, setMemberForm] = React.useState<MemberFormValues>(DEFAULT_MEMBER_FORM)
  const [memberFormError, setMemberFormError] = React.useState<string | null>(null)

  // Member delete state
  const [memberDeleteTarget, setMemberDeleteTarget] = React.useState<MemberPublic | null>(null)
  const [memberDeleteError, setMemberDeleteError] = React.useState<string | null>(null)

  // Recharge dialog state
  const [rechargeDialogOpen, setRechargeDialogOpen] = React.useState(false)
  const [rechargeForm, setRechargeForm] = React.useState<RechargeFormValues>(DEFAULT_RECHARGE_FORM)
  const [rechargeFormError, setRechargeFormError] = React.useState<string | null>(null)

  // Queries
  const membersQuery = useMemberWalletReadMembers({
    query: { enabled: canReadMember },
  })

  const principalAccountQuery = useMemberWalletReadPrincipalAccount(selectedMemberId ?? "", {
    query: { enabled: canReadAccount && Boolean(selectedMemberId) },
  })

  const giftAccountQuery = useMemberWalletReadGiftAccount(selectedMemberId ?? "", {
    query: { enabled: canReadAccount && Boolean(selectedMemberId) },
  })

  const walletTransactionsQuery = useMemberWalletReadWalletTransactions(selectedMemberId ?? "", {
    query: { enabled: canReadAccount && Boolean(selectedMemberId) },
  })

  const rechargePlansQuery = useMemberWalletReadRechargePlans({
    query: { enabled: rechargeDialogOpen },
  })

  // Mutations
  const createMemberMutation = useMemberWalletCreateMemberRoute()
  const updateMemberMutation = useMemberWalletUpdateMemberRoute()
  const deleteMemberMutation = useMemberWalletDeleteMemberRoute()
  const rechargeMutation = useMemberWalletRechargeRoute()

  const members: MemberPublic[] = membersQuery.data?.data ?? []
  const principalAccount = principalAccountQuery.data?.data ?? null
  const giftAccount = giftAccountQuery.data?.data ?? null
  const walletTransactions = walletTransactionsQuery.data?.data ?? []
  const rechargePlans = rechargePlansQuery.data?.data ?? []

  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null

  const isMemberSubmitting = createMemberMutation.isPending || updateMemberMutation.isPending
  const isMemberDeleting = deleteMemberMutation.isPending
  const isRechargeSubmitting = rechargeMutation.isPending

  const invalidateMembers = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: getMemberWalletReadMembersQueryKey(),
    })
  }, [queryClient])

  const invalidateAccounts = React.useCallback(
    async (memberId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getMemberWalletReadPrincipalAccountQueryKey(memberId),
        }),
        queryClient.invalidateQueries({
          queryKey: getMemberWalletReadGiftAccountQueryKey(memberId),
        }),
      ])
    },
    [queryClient]
  )

  // Sheet actions
  const openMemberSheet = React.useCallback((memberId: string) => {
    setSelectedMemberId(memberId)
  }, [])

  const closeMemberSheet = React.useCallback(() => {
    setSelectedMemberId(null)
    setRechargeDialogOpen(false)
    setRechargeForm(DEFAULT_RECHARGE_FORM)
    setRechargeFormError(null)
  }, [])

  // Member dialog actions
  const openCreateMemberDialog = React.useCallback(() => {
    setMemberDialogMode("create")
    setEditingMember(null)
    setMemberForm(DEFAULT_MEMBER_FORM)
    setMemberFormError(null)
    setMemberDialogOpen(true)
  }, [])

  const openEditMemberDialog = React.useCallback((member: MemberPublic) => {
    setMemberDialogMode("edit")
    setEditingMember(member)
    setMemberForm(toMemberFormValues(member))
    setMemberFormError(null)
    setMemberDialogOpen(true)
  }, [])

  const closeMemberDialog = React.useCallback(() => {
    if (isMemberSubmitting) return

    setMemberDialogOpen(false)
    setEditingMember(null)
    setMemberForm(DEFAULT_MEMBER_FORM)
    setMemberFormError(null)
  }, [isMemberSubmitting])

  const setMemberField = React.useCallback((field: keyof MemberFormValues, value: string) => {
    setMemberForm((current) => ({ ...current, [field]: value }))
    setMemberFormError(null)
  }, [])

  const submitMemberForm = React.useCallback(async () => {
    if (!memberForm.member_no.trim()) {
      setMemberFormError("请填写会员编号。")
      return
    }

    setMemberFormError(null)

    try {
      if (memberDialogMode === "create") {
        if (!storeId) {
          setMemberFormError("无法获取门店信息，请刷新页面后重试。")
          return
        }

        await createMemberMutation.mutateAsync({
          data: {
            store_id: storeId,
            member_no: memberForm.member_no.trim(),
            name: memberForm.name.trim() || undefined,
            mobile: memberForm.mobile.trim() || undefined,
            status: memberForm.status || "ACTIVE",
            level: memberForm.level.trim() || undefined,
          } satisfies MemberCreate,
        })
        toast.success("会员已创建")
      } else {
        if (!editingMember) return

        await updateMemberMutation.mutateAsync({
          memberId: editingMember.id,
          data: {
            name: memberForm.name.trim() || null,
            mobile: memberForm.mobile.trim() || null,
            status: memberForm.status || null,
            level: memberForm.level.trim() || null,
          } satisfies MemberUpdate,
        })
        toast.success("会员已更新")
      }

      await invalidateMembers()
      closeMemberDialog()
    } catch (error) {
      const fallback =
        memberDialogMode === "create" ? "创建会员失败，请稍后重试。" : "保存会员失败，请稍后重试。"
      setMemberFormError(getErrorMessage(error, fallback))
    }
  }, [
    closeMemberDialog,
    createMemberMutation,
    editingMember,
    invalidateMembers,
    memberDialogMode,
    memberForm,
    storeId,
    updateMemberMutation,
  ])

  // Member delete actions
  const requestMemberDelete = React.useCallback((member: MemberPublic) => {
    setMemberDeleteTarget(member)
    setMemberDeleteError(null)
  }, [])

  const closeMemberDeleteDialog = React.useCallback(() => {
    if (isMemberDeleting) return

    setMemberDeleteTarget(null)
    setMemberDeleteError(null)
  }, [isMemberDeleting])

  const confirmMemberDelete = React.useCallback(async () => {
    if (!memberDeleteTarget) return

    setMemberDeleteError(null)

    try {
      await deleteMemberMutation.mutateAsync({ memberId: memberDeleteTarget.id })
      toast.success("会员已删除")
      await invalidateMembers()
      closeMemberDeleteDialog()
    } catch (error) {
      setMemberDeleteError(getErrorMessage(error, "删除会员失败，请稍后重试。"))
    }
  }, [closeMemberDeleteDialog, deleteMemberMutation, invalidateMembers, memberDeleteTarget])

  // Recharge dialog actions
  const openRechargeDialog = React.useCallback(() => {
    setRechargeForm(DEFAULT_RECHARGE_FORM)
    setRechargeFormError(null)
    setRechargeDialogOpen(true)
  }, [])

  const closeRechargeDialog = React.useCallback(() => {
    if (isRechargeSubmitting) return

    setRechargeDialogOpen(false)
    setRechargeForm(DEFAULT_RECHARGE_FORM)
    setRechargeFormError(null)
  }, [isRechargeSubmitting])

  const setRechargeField = React.useCallback(
    (field: keyof RechargeFormValues, value: string) => {
      setRechargeForm((current) => ({ ...current, [field]: value }))
      setRechargeFormError(null)
    },
    []
  )

  const submitRechargeForm = React.useCallback(async () => {
    if (!rechargeForm.recharge_plan_id) {
      setRechargeFormError("请选择充值套餐。")
      return
    }

    if (!selectedMemberId) return

    setRechargeFormError(null)

    try {
      await rechargeMutation.mutateAsync({
        memberId: selectedMemberId,
        data: {
          recharge_plan_id: rechargeForm.recharge_plan_id,
          remark: rechargeForm.remark.trim() || undefined,
        },
      })
      toast.success("充值成功")
      await invalidateAccounts(selectedMemberId)
      closeRechargeDialog()
    } catch (error) {
      setRechargeFormError(getErrorMessage(error, "充值失败，请稍后重试。"))
    }
  }, [
    closeRechargeDialog,
    invalidateAccounts,
    rechargeMutation,
    rechargeForm,
    selectedMemberId,
  ])

  return {
    // Permissions
    canReadMember,
    canCreateMember,
    canUpdateMember,
    canDeleteMember,
    canReadAccount,
    canRecharge,
    // Data
    members,
    selectedMember,
    selectedMemberId,
    principalAccount,
    giftAccount,
    walletTransactions,
    rechargePlans,
    // Queries
    membersQuery,
    principalAccountQuery,
    giftAccountQuery,
    walletTransactionsQuery,
    rechargePlansQuery,
    // Sheet
    openMemberSheet,
    closeMemberSheet,
    // Member dialog
    memberDialogOpen,
    memberDialogMode,
    editingMember,
    memberForm,
    memberFormError,
    isMemberSubmitting,
    openCreateMemberDialog,
    openEditMemberDialog,
    closeMemberDialog,
    setMemberField,
    submitMemberForm,
    // Member delete
    memberDeleteTarget,
    memberDeleteError,
    isMemberDeleting,
    requestMemberDelete,
    closeMemberDeleteDialog,
    confirmMemberDelete,
    // Recharge dialog
    rechargeDialogOpen,
    rechargeForm,
    rechargeFormError,
    isRechargeSubmitting,
    openRechargeDialog,
    closeRechargeDialog,
    setRechargeField,
    submitRechargeForm,
  }
}
