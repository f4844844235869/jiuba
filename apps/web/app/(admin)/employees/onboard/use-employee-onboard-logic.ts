"use client"

import * as React from "react"
import { useQueries, useQueryClient } from "@tanstack/react-query"

import { useEmployeesOnboardEmployee } from "@/api/generated/employees/employees"
import {
  getIAMReadUserAuthorizationSummaryQueryKey,
  getIAMReadUserAuthorizationSummaryQueryOptions,
  useIAMAssignUserRoles,
  useIAMReadUserAuthorizationSummary,
  useIAMReadRoles,
} from "@/api/generated/iam/iam"
import { useUsersUpdateUser } from "@/api/generated/users/users"
import {
  useOrganizationReadOrgNodeMembersRoute,
  useOrganizationReadUserOrgBindingsRoute,
} from "@/api/generated/organization/organization"
import type {
  CurrentUserProfile,
  EmployeeOnboardingRequest,
  OrgNodeMemberPublic,
  OrgNodePublic,
  RolePublic,
  UserAuthorizationSummary,
  UserRoleAssign,
  UserUpdate,
} from "@/api/generated/workspace.schemas"
import { apiClient } from "@/lib/api-client"
import { getStoredCurrentUser } from "@/lib/auth-storage"
import { useAuthStore } from "@/lib/auth-store"
import { usePermissionAccess } from "@/lib/permissions"

type EmployeeTreeNode = {
  node: OrgNodePublic
  members: OrgNodeMemberPublic[]
  children: EmployeeTreeNode[]
}

type CreateEmployeeForm = {
  username: string
  password: string
  fullName: string
  mobile: string
  employeeNo: string
  positionName: string
  primaryOrgNodeId: string
}

type EditEmployeeForm = {
  username: string
  fullName: string
  nickname: string
  mobile: string
  status: string
  isActive: boolean
}

type PositionChangeForm = {
  bindingId: string
  orgNodeId: string
  positionName: string
}

type ResetPasswordForm = {
  newPassword: string
  confirmPassword: string
}

type LeaveEmployeeForm = {
  leftAt: string
  leaveReason: string
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

function sortNodes(nodes: OrgNodePublic[]) {
  return [...nodes].sort((left, right) => {
    if (left.level !== right.level) {
      return left.level - right.level
    }

    if ((left.sort_order ?? 0) !== (right.sort_order ?? 0)) {
      return (left.sort_order ?? 0) - (right.sort_order ?? 0)
    }

    return left.name.localeCompare(right.name, "zh-CN")
  })
}

function sortMembers(members: OrgNodeMemberPublic[]) {
  return [...members].sort((left, right) => {
    const leftName = left.user.full_name || left.user.username
    const rightName = right.user.full_name || right.user.username

    if (left.org_node_name !== right.org_node_name) {
      return left.org_node_name.localeCompare(right.org_node_name, "zh-CN")
    }

    return leftName.localeCompare(rightName, "zh-CN")
  })
}

function buildEmployeeTree(nodes: OrgNodePublic[], members: OrgNodeMemberPublic[]) {
  const buckets = new Map<string, EmployeeTreeNode>()

  sortNodes(nodes).forEach((node) => {
    buckets.set(node.id, {
      node,
      members: [],
      children: [],
    })
  })

  sortMembers(members).forEach((member) => {
    const bucket = buckets.get(member.org_node_id)
    if (bucket) {
      bucket.members.push(member)
    }
  })

  const roots: EmployeeTreeNode[] = []

  buckets.forEach((treeNode) => {
    const parentId = treeNode.node.parent_id
    const parent = parentId ? buckets.get(parentId) : undefined

    if (parent) {
      parent.children.push(treeNode)
      return
    }

    roots.push(treeNode)
  })

  return roots
}

function toNullableValue(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((item, index) => item === right[index])
}

function defaultCreateEmployeeForm(primaryOrgNodeId: string): CreateEmployeeForm {
  return {
    username: "",
    password: "",
    fullName: "",
    mobile: "",
    employeeNo: "",
    positionName: "",
    primaryOrgNodeId,
  }
}

function defaultEditEmployeeForm(): EditEmployeeForm {
  return {
    username: "",
    fullName: "",
    nickname: "",
    mobile: "",
    status: "ACTIVE",
    isActive: true,
  }
}

function defaultPositionChangeForm(): PositionChangeForm {
  return {
    bindingId: "",
    orgNodeId: "",
    positionName: "",
  }
}

function defaultResetPasswordForm(): ResetPasswordForm {
  return {
    newPassword: "",
    confirmPassword: "",
  }
}

function defaultLeaveEmployeeForm(): LeaveEmployeeForm {
  return {
    leftAt: "",
    leaveReason: "",
  }
}

function memberToEditEmployeeForm(member: OrgNodeMemberPublic): EditEmployeeForm {
  return {
    username: member.user.username,
    fullName: member.user.full_name ?? "",
    nickname: member.user.nickname ?? "",
    mobile: member.user.mobile ?? "",
    status: member.user.status ?? "ACTIVE",
    isActive: member.user.is_active ?? true,
  }
}

function toUserUpdatePayload(form: EditEmployeeForm): UserUpdate {
  return {
    username: toNullableValue(form.username),
    full_name: toNullableValue(form.fullName),
    nickname: toNullableValue(form.nickname),
    mobile: toNullableValue(form.mobile),
    status: toNullableValue(form.status),
    is_active: form.isActive,
  }
}

export function useEmployeeOnboardLogic() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.currentUser)
  const storedUser = React.useMemo(
    () => getStoredCurrentUser<CurrentUserProfile>(),
    []
  )
  const activeUser = currentUser ?? storedUser
  const { hasAnyPermission, hasPermission } = usePermissionAccess()
  const isSuperuser = Boolean(activeUser?.is_superuser)
  const canReadEmployees = hasPermission("employee.read")
  const canCreateEmployees = hasPermission("employee.create")
  const canUpdateEmployees = hasPermission("iam.user.update")
  const canBindEmployees = hasPermission("employee.bind_org")
  const canAssignEmployeeRoles = hasPermission("employee.assign_role")
  const canResetPassword = hasPermission("iam.user.update")
  const canLeaveEmployees = hasPermission("employee.leave")
  const canManageRoles = canAssignEmployeeRoles
  const currentOrgNodeId = activeUser?.current_org_node_id ?? ""
  const currentOrgNodeName = activeUser?.current_org_node_name ?? currentOrgNodeId ?? ""
  const currentUserId = activeUser?.id ?? ""
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = React.useState<string | null>(null)
  const [createForm, setCreateForm] = React.useState<CreateEmployeeForm>(
    defaultCreateEmployeeForm(currentOrgNodeId)
  )
  const [editOpen, setEditOpen] = React.useState(false)
  const [editError, setEditError] = React.useState<string | null>(null)
  const [editForm, setEditForm] = React.useState<EditEmployeeForm>(defaultEditEmployeeForm())
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null)
  const [positionOpen, setPositionOpen] = React.useState(false)
  const [positionError, setPositionError] = React.useState<string | null>(null)
  const [isChangingPosition, setIsChangingPosition] = React.useState(false)
  const [positionForm, setPositionForm] = React.useState<PositionChangeForm>(
    defaultPositionChangeForm()
  )
  const [roleOpen, setRoleOpen] = React.useState(false)
  const [roleError, setRoleError] = React.useState<string | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<string[]>([])
  const [isRoleSelectionDirty, setIsRoleSelectionDirty] = React.useState(false)
  const [resetPasswordOpen, setResetPasswordOpen] = React.useState(false)
  const [resetPasswordError, setResetPasswordError] = React.useState<string | null>(null)
  const [isResettingPassword, setIsResettingPassword] = React.useState(false)
  const [resetPasswordForm, setResetPasswordForm] = React.useState<ResetPasswordForm>(
    defaultResetPasswordForm()
  )
  const [leaveOpen, setLeaveOpen] = React.useState(false)
  const [leaveError, setLeaveError] = React.useState<string | null>(null)
  const [isLeavingEmployee, setIsLeavingEmployee] = React.useState(false)
  const [leaveForm, setLeaveForm] = React.useState<LeaveEmployeeForm>(defaultLeaveEmployeeForm())

  const membersQuery = useOrganizationReadOrgNodeMembersRoute(
    currentOrgNodeId,
    { include_descendants: true },
    {
      query: {
        enabled: Boolean(currentOrgNodeId) && canReadEmployees,
      },
    }
  )

  const members = React.useMemo(
    () => sortMembers(membersQuery.data?.data?.members ?? []),
    [membersQuery.data?.data?.members]
  )
  const allowedOrgNodes = React.useMemo(
    () => sortNodes(membersQuery.data?.data?.org_nodes ?? []),
    [membersQuery.data?.data?.org_nodes]
  )
  const memberTree = React.useMemo(
    () =>
      buildEmployeeTree(
        membersQuery.data?.data?.org_nodes ?? [],
        membersQuery.data?.data?.members ?? []
      ),
    [membersQuery.data?.data?.members, membersQuery.data?.data?.org_nodes]
  )
  const selectedMember =
    members.find((member) => member.user.id === selectedMemberId) ?? null
  const bindingsQuery = useOrganizationReadUserOrgBindingsRoute(
    selectedMemberId ? { user_id: selectedMemberId } : undefined,
    {
      query: {
        enabled: Boolean(positionOpen && selectedMemberId && canBindEmployees),
      },
    }
  )
  const memberBindings = React.useMemo(
    () => bindingsQuery.data?.data ?? [],
    [bindingsQuery.data?.data]
  )
  const rolesQuery = useIAMReadRoles({
    query: {
      enabled: canManageRoles && isSuperuser,
    },
  })
  const currentUserAuthorizationQuery = useIAMReadUserAuthorizationSummary(currentUserId, {
    query: {
      enabled: canManageRoles && Boolean(currentUserId),
    },
  })
  const memberRoleQueries = useQueries({
    queries: members.map((member) => ({
      ...getIAMReadUserAuthorizationSummaryQueryOptions(member.user.id),
      enabled: Boolean(currentOrgNodeId && member.user.id),
    })),
  })
  const memberRoleMap = React.useMemo(() => {
    const map = new Map<string, RolePublic[]>()

    memberRoleQueries.forEach((query, index) => {
      const userId = members[index]?.user.id

      if (!userId) {
        return
      }

      const summary = query.data?.data as UserAuthorizationSummary | null | undefined
      map.set(userId, summary?.roles ?? [])
    })

    return map
  }, [memberRoleQueries, members])
  const selectedMemberRoleIds = React.useMemo(
    () => (selectedMemberId ? (memberRoleMap.get(selectedMemberId) ?? []).map((role) => role.id) : []),
    [memberRoleMap, selectedMemberId]
  )
  const grantableRoles = React.useMemo(() => {
    if (isSuperuser) {
      return rolesQuery.data?.data ?? []
    }

    const currentUserRoles = currentUserAuthorizationQuery.data?.data?.roles ?? []
    const roleMap = new Map<string, RolePublic>()

    currentUserRoles.forEach((role) => {
      role.grantable_roles?.forEach((grantableRole) => {
        roleMap.set(grantableRole.id, {
          id: grantableRole.id,
          code: grantableRole.code,
          name: grantableRole.name,
          created_at: "",
        })
      })
    })

    return Array.from(roleMap.values()).sort((left, right) =>
      left.name.localeCompare(right.name, "zh-CN")
    )
  }, [
    currentUserAuthorizationQuery.data?.data?.roles,
    isSuperuser,
    rolesQuery.data?.data,
  ])
  const createMutation = useEmployeesOnboardEmployee({
    mutation: {
      onSuccess: async () => {
        setCreateSuccess("员工已添加。")
        setCreateError(null)
        setCreateOpen(false)
        await membersQuery.refetch()
      },
      onError: (error) => {
        setCreateSuccess(null)
        setCreateError(getErrorMessage(error, "新增员工失败。"))
      },
    },
  })
  const updateMutation = useUsersUpdateUser({
    mutation: {
      onSuccess: async () => {
        setCreateSuccess("员工信息已更新。")
        setEditError(null)
        setEditOpen(false)
        await membersQuery.refetch()
      },
      onError: (error) => {
        setCreateSuccess(null)
        setEditError(getErrorMessage(error, "编辑员工失败。"))
      },
    },
  })
  const assignRolesMutation = useIAMAssignUserRoles({
    mutation: {
      onError: (error) => {
        setCreateSuccess(null)
        setRoleError(getErrorMessage(error, "角色设置失败。"))
      },
    },
  })

  React.useEffect(() => {
    if (!roleOpen || isRoleSelectionDirty) {
      return
    }

    setSelectedRoleIds((current) => {
      if (areStringArraysEqual(current, selectedMemberRoleIds)) {
        return current
      }

      return selectedMemberRoleIds
    })
  }, [isRoleSelectionDirty, roleOpen, selectedMemberRoleIds])

  React.useEffect(() => {
    setCreateForm((current) => {
      if (current.primaryOrgNodeId) {
        return current
      }

      return {
        ...current,
        primaryOrgNodeId: currentOrgNodeId,
      }
    })
  }, [currentOrgNodeId])

  const openCreate = React.useCallback(() => {
    setCreateError(null)
    setCreateSuccess(null)
    setCreateForm(defaultCreateEmployeeForm(currentOrgNodeId))
    setCreateOpen(true)
  }, [currentOrgNodeId])

  const closeCreate = React.useCallback(() => {
    setCreateOpen(false)
    setCreateError(null)
  }, [])

  const openEdit = React.useCallback((member: OrgNodeMemberPublic) => {
    setCreateSuccess(null)
    setEditError(null)
    setSelectedMemberId(member.user.id)
    setEditForm(memberToEditEmployeeForm(member))
    setEditOpen(true)
  }, [])

  const closeEdit = React.useCallback(() => {
    setEditOpen(false)
    setEditError(null)
    setSelectedMemberId(null)
    setEditForm(defaultEditEmployeeForm())
  }, [])

  const openPositionChange = React.useCallback((member: OrgNodeMemberPublic) => {
    setCreateSuccess(null)
    setPositionError(null)
    setSelectedMemberId(member.user.id)
    setPositionForm({
      bindingId: "",
      orgNodeId: member.org_node_id,
      positionName: member.position_name ?? "",
    })
    setPositionOpen(true)
  }, [])

  const openRoleSettings = React.useCallback((member: OrgNodeMemberPublic) => {
    setCreateSuccess(null)
    setRoleError(null)
    setSelectedMemberId(member.user.id)
    setSelectedRoleIds(memberRoleMap.get(member.user.id)?.map((role) => role.id) ?? [])
    setIsRoleSelectionDirty(false)
    setRoleOpen(true)
  }, [memberRoleMap])

  const openResetPassword = React.useCallback((member: OrgNodeMemberPublic) => {
    setCreateSuccess(null)
    setResetPasswordError(null)
    setSelectedMemberId(member.user.id)
    setResetPasswordForm(defaultResetPasswordForm())
    setResetPasswordOpen(true)
  }, [])

  const openLeaveEmployee = React.useCallback((member: OrgNodeMemberPublic) => {
    setCreateSuccess(null)
    setLeaveError(null)
    setSelectedMemberId(member.user.id)
    setLeaveForm(defaultLeaveEmployeeForm())
    setLeaveOpen(true)
  }, [])

  const closePositionChange = React.useCallback(() => {
    setPositionOpen(false)
    setPositionError(null)
    setPositionForm(defaultPositionChangeForm())
  }, [])

  const closeRoleSettings = React.useCallback(() => {
    if (assignRolesMutation.isPending) {
      return
    }

    setRoleOpen(false)
    setRoleError(null)
    setSelectedRoleIds([])
    setIsRoleSelectionDirty(false)
    setSelectedMemberId(null)
  }, [assignRolesMutation.isPending])

  const closeResetPassword = React.useCallback(() => {
    if (isResettingPassword) {
      return
    }

    setResetPasswordOpen(false)
    setResetPasswordError(null)
    setResetPasswordForm(defaultResetPasswordForm())
    setSelectedMemberId(null)
  }, [isResettingPassword])

  const closeLeaveEmployee = React.useCallback(() => {
    if (isLeavingEmployee) {
      return
    }

    setLeaveOpen(false)
    setLeaveError(null)
    setLeaveForm(defaultLeaveEmployeeForm())
    setSelectedMemberId(null)
  }, [isLeavingEmployee])

  const setCreateField = React.useCallback(
    <K extends keyof CreateEmployeeForm>(field: K, value: CreateEmployeeForm[K]) => {
      setCreateForm((current) => ({
        ...current,
        [field]: value,
      }))
    },
    []
  )

  const setEditField = React.useCallback(
    <K extends keyof EditEmployeeForm>(field: K, value: EditEmployeeForm[K]) => {
      setEditForm((current) => ({
        ...current,
        [field]: value,
      }))
    },
    []
  )

  const setPositionField = React.useCallback(
    <K extends keyof PositionChangeForm>(field: K, value: PositionChangeForm[K]) => {
      setPositionForm((current) => ({
        ...current,
        [field]: value,
      }))
    },
    []
  )

  const setResetPasswordField = React.useCallback(
    <K extends keyof ResetPasswordForm>(field: K, value: ResetPasswordForm[K]) => {
      setResetPasswordForm((current) => ({
        ...current,
        [field]: value,
      }))
    },
    []
  )

  const setLeaveField = React.useCallback(
    <K extends keyof LeaveEmployeeForm>(field: K, value: LeaveEmployeeForm[K]) => {
      setLeaveForm((current) => ({
        ...current,
        [field]: value,
      }))
    },
    []
  )

  const toggleRole = React.useCallback((roleId: string, checked: boolean) => {
    setIsRoleSelectionDirty(true)
    setRoleError(null)
    setSelectedRoleIds((current) => {
      if (checked) {
        return current.includes(roleId) ? current : [...current, roleId]
      }

      return current.filter((item) => item !== roleId)
    })
  }, [])

  const submitCreate = React.useCallback(async () => {
    setCreateError(null)
    setCreateSuccess(null)

    if (!createForm.username.trim()) {
      setCreateError("请填写登录账号。")
      return
    }

    if (!createForm.password.trim()) {
      setCreateError("请填写初始密码。")
      return
    }

    if (!createForm.primaryOrgNodeId.trim()) {
      setCreateError("请选择组织节点。")
      return
    }

    if (!allowedOrgNodes.some((node) => node.id === createForm.primaryOrgNodeId)) {
      setCreateError("只能添加到自己所属范围下的组织节点。")
      return
    }

    const payload: EmployeeOnboardingRequest = {
      user: {
        username: createForm.username.trim(),
        password: createForm.password.trim(),
        full_name: toNullableValue(createForm.fullName),
        mobile: toNullableValue(createForm.mobile),
      },
      primary_org_node_id: createForm.primaryOrgNodeId.trim(),
      position_name: toNullableValue(createForm.positionName),
    }

    await createMutation.mutateAsync({ data: payload })
  }, [allowedOrgNodes, createForm, createMutation])

  const submitEdit = React.useCallback(async () => {
    setEditError(null)
    setCreateSuccess(null)

    if (!selectedMember) {
      setEditError("未找到要编辑的员工。")
      return
    }

    if (!editForm.username.trim()) {
      setEditError("请填写登录账号。")
      return
    }

    await updateMutation.mutateAsync({
      userId: selectedMember.user.id,
      data: toUserUpdatePayload(editForm),
    })
  }, [editForm, selectedMember, updateMutation])

  React.useEffect(() => {
    if (!positionOpen || !memberBindings.length) {
      return
    }

    setPositionForm((current) => {
      if (current.bindingId && memberBindings.some((binding) => binding.id === current.bindingId)) {
        return current
      }

      const primaryBinding = memberBindings.find((binding) => binding.is_primary) ?? memberBindings[0]

      if (!primaryBinding) {
        return current
      }

      return {
        bindingId: primaryBinding.id,
        orgNodeId: primaryBinding.org_node_id,
        positionName: primaryBinding.position_name ?? "",
      }
    })
  }, [memberBindings, positionOpen])

  const submitPositionChange = React.useCallback(async () => {
    setPositionError(null)
    setCreateSuccess(null)

    if (!selectedMember) {
      setPositionError("未找到要变更岗位的员工。")
      return
    }

    if (!positionForm.bindingId) {
      setPositionError("请选择要变更的岗位绑定。")
      return
    }

    if (!positionForm.orgNodeId.trim()) {
      setPositionError("请选择组织节点。")
      return
    }

    if (!allowedOrgNodes.some((node) => node.id === positionForm.orgNodeId)) {
      setPositionError("只能变更到自己所属范围下的组织节点。")
      return
    }

    const currentBinding = memberBindings.find((binding) => binding.id === positionForm.bindingId)
    const payload: Record<string, string> = {}

    if (positionForm.orgNodeId.trim() !== (currentBinding?.org_node_id ?? "")) {
      payload.org_node_id = positionForm.orgNodeId.trim()
    }

    if (positionForm.positionName.trim() !== (currentBinding?.position_name ?? "")) {
      payload.position_name = positionForm.positionName.trim()
    }

    if (Object.keys(payload).length === 0) {
      setPositionError("请至少修改组织节点或岗位名称。")
      return
    }

    try {
      setIsChangingPosition(true)
      await apiClient.patch(`/api/v1/org/bindings/${positionForm.bindingId}`, payload)
      setCreateSuccess("岗位已变更。")
      setPositionError(null)
      setPositionOpen(false)
      await Promise.all([membersQuery.refetch(), bindingsQuery.refetch()])
    } catch (error) {
      setCreateSuccess(null)
      setPositionError(getErrorMessage(error, "岗位变更失败。"))
    } finally {
      setIsChangingPosition(false)
    }
  }, [
    allowedOrgNodes,
    bindingsQuery,
    memberBindings,
    membersQuery,
    positionForm,
    selectedMember,
  ])

  const submitRoleSettings = React.useCallback(async () => {
    setRoleError(null)
    setCreateSuccess(null)

    if (!canManageRoles) {
      setRoleError("当前账号没有角色设置权限。")
      return
    }

    if (!selectedMember) {
      setRoleError("未找到要设置角色的员工。")
      return
    }

    try {
      await assignRolesMutation.mutateAsync({
        userId: selectedMember.user.id,
        data: {
          role_ids: selectedRoleIds,
        } satisfies UserRoleAssign,
      })

      await queryClient.invalidateQueries({
        queryKey: getIAMReadUserAuthorizationSummaryQueryKey(selectedMember.user.id),
      })
      setCreateSuccess("员工角色已更新。")
      setRoleOpen(false)
      setIsRoleSelectionDirty(false)
    } catch {
      return
    }
  }, [assignRolesMutation, canManageRoles, queryClient, selectedMember, selectedRoleIds])

  const submitResetPassword = React.useCallback(async () => {
    setResetPasswordError(null)
    setCreateSuccess(null)

    if (!selectedMember) {
      setResetPasswordError("未找到要重置密码的员工。")
      return
    }

    if (!resetPasswordForm.newPassword.trim()) {
      setResetPasswordError("请填写新密码。")
      return
    }

    if (resetPasswordForm.newPassword.trim().length < 8) {
      setResetPasswordError("新密码至少需要 8 位。")
      return
    }

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      setResetPasswordError("两次输入的新密码不一致。")
      return
    }

    try {
      setIsResettingPassword(true)
      await apiClient.patch(`/api/v1/users/${selectedMember.user.id}/reset-password`, {
        new_password: resetPasswordForm.newPassword,
      })
      setCreateSuccess("密码已重置。")
      setResetPasswordOpen(false)
      setResetPasswordForm(defaultResetPasswordForm())
    } catch (error) {
      setResetPasswordError(getErrorMessage(error, "重置密码失败。"))
    } finally {
      setIsResettingPassword(false)
    }
  }, [resetPasswordForm, selectedMember])

  const submitLeaveEmployee = React.useCallback(async () => {
    setLeaveError(null)
    setCreateSuccess(null)

    if (!selectedMember) {
      setLeaveError("未找到要办理离职的员工。")
      return
    }

    try {
      setIsLeavingEmployee(true)
      await apiClient.post(`/api/v1/employees/${selectedMember.user.id}/leave`, {
        left_at: leaveForm.leftAt ? new Date(leaveForm.leftAt).toISOString() : null,
        leave_reason: toNullableValue(leaveForm.leaveReason),
      })
      setCreateSuccess("员工离职已办理。")
      setLeaveOpen(false)
      setLeaveForm(defaultLeaveEmployeeForm())
      await membersQuery.refetch()
    } catch (error) {
      setLeaveError(getErrorMessage(error, "办理离职失败。"))
    } finally {
      setIsLeavingEmployee(false)
    }
  }, [leaveForm, membersQuery, selectedMember])

  const getMemberRoles = React.useCallback(
    (userId: string) => memberRoleMap.get(userId) ?? [],
    [memberRoleMap]
  )

  const isMemberRolesLoading = React.useCallback(
    (userId: string) =>
      memberRoleQueries.some(
        (query, index) => members[index]?.user.id === userId && (query.isLoading || query.isFetching)
      ),
    [memberRoleQueries, members]
  )

  return {
    currentOrgNodeId,
    currentOrgNodeName,
    canViewPage: hasAnyPermission(["employee.read"]),
    canReadEmployees,
    canCreateEmployees,
    canUpdateEmployees,
    canBindEmployees,
    canManageRoles,
    canResetPassword,
    canLeaveEmployees,
    members,
    allowedOrgNodes,
    memberTree,
    refresh: membersQuery.refetch,
    createOpen,
    createForm,
    createError,
    createSuccess,
    editOpen,
    editForm,
    editError,
    positionOpen,
    positionForm,
    positionError,
    roleOpen,
    roleError,
    resetPasswordOpen,
    resetPasswordError,
    resetPasswordForm,
    leaveOpen,
    leaveError,
    leaveForm,
    selectedRoleIds,
    memberBindings,
    availableRoles: grantableRoles,
    openCreate,
    closeCreate,
    openEdit,
    closeEdit,
    openPositionChange,
    closePositionChange,
    openRoleSettings,
    closeRoleSettings,
    openResetPassword,
    closeResetPassword,
    openLeaveEmployee,
    closeLeaveEmployee,
    setCreateField,
    setEditField,
    setPositionField,
    setResetPasswordField,
    setLeaveField,
    toggleRole,
    submitCreate,
    submitEdit,
    submitPositionChange,
    submitRoleSettings,
    submitResetPassword,
    submitLeaveEmployee,
    getMemberRoles,
    isMemberRolesLoading,
    isCreating: createMutation.isPending,
    isEditing: updateMutation.isPending,
    isChangingPosition,
    isAssigningRoles: assignRolesMutation.isPending,
    isResettingPassword,
    isLeavingEmployee,
    isLoading: membersQuery.isLoading,
    isFetching: membersQuery.isFetching,
    isError: membersQuery.isError,
    errorMessage: getErrorMessage(membersQuery.error, "员工列表加载失败。"),
    hasContext: Boolean(currentOrgNodeId),
  }
}
