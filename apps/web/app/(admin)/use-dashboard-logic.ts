"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  getAuthReadCurrentUserQueryKey,
  useAuthReadCurrentUser,
  useAuthSwitchCurrentStore,
} from "@/api/generated/auth/auth"
import type {
  ApiResponseCurrentUserProfile,
  CurrentUserProfile,
  DataScopePublic,
} from "@/api/generated/workspace.schemas"
import { useAuthStore } from "@/lib/auth-store"
import { setStoredCurrentStoreId } from "@/lib/auth-storage"

const MAX_SUMMARY_ITEMS = 6

type InfoItem = {
  label: string
  value: string
  hint?: string
}

type NamedDataScope = DataScopePublic & {
  scope_label?: string | null
}

type StoreMembership = {
  store_id: string
  store_name?: string | null
  org_node_id?: string | null
  org_node_name?: string | null
  position_name?: string | null
  is_primary?: boolean
  is_current?: boolean
}

type AccessibleStore = {
  store_id: string
  store_name?: string | null
  is_current?: boolean
}

type AuthMeProfile = CurrentUserProfile & {
  primary_store_name?: string | null
  primary_department_name?: string | null
  current_store_name?: string | null
  current_org_node_name?: string | null
  role_names?: string[]
  permission_names?: string[]
  data_scope_labels?: string[]
  store_memberships?: StoreMembership[]
  accessible_stores?: AccessibleStore[]
}

type SummaryBlock = {
  title: string
  count: number
  items: string[]
  overflowCount: number
  emptyText: string
}

type ScopeGroup = {
  scopeType: string
  count: number
  labels: string[]
  storeCount: number
  orgCount: number
  sampleStores: string[]
  sampleOrgs: string[]
}

export type DashboardLogic = {
  profile: {
    displayName: string
    accountLabel: string
    secondaryLine: string
    status: string
    isSuperuser: boolean
    roleTags: string[]
    infoItems: InfoItem[]
    contextItems: InfoItem[]
    memberships: Array<{
      title: string
      description: string
      badges: string[]
    }>
  } | null
  summary: {
    statCards: Array<{
      title: string
      value: string
      description: string
    }>
    blocks: SummaryBlock[]
    scopeGroups: ScopeGroup[]
  }
  storeSwitcher: {
    value: string
    candidates: Array<{
      value: string
      label: string
      hint?: string
    }>
    currentStoreId: string | null
    currentStoreName: string | null
    isSubmitting: boolean
    error: string | null
    isDisabled: boolean
    helperText: string
    buttonLabel: string
    onValueChange: (value: string) => void
    onSubmit: () => Promise<void>
  }
  isLoading: boolean
  isEmpty: boolean
  error: string | null
  retry: () => Promise<unknown>
}

function fallbackText(value?: string | null, fallback = "未设置") {
  return value && value.trim().length > 0 ? value : fallback
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "暂无记录"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function formatStatus(profile: CurrentUserProfile) {
  if (profile.is_active === false) {
    return "已停用"
  }

  if (profile.status) {
    if (profile.status === "ACTIVE") {
      return "正常"
    }

    if (profile.status === "DISABLED") {
      return "已停用"
    }

    if (profile.status === "LEFT") {
      return "已离职"
    }

    return profile.status
  }

  return "正常"
}

function buildStoreCandidates(profile: AuthMeProfile | null) {
  if (!profile) {
    return []
  }

  if (profile.accessible_stores && profile.accessible_stores.length > 0) {
    return profile.accessible_stores.map((store) => ({
      value: store.store_id,
      label: store.store_name || store.store_id,
      hint: store.is_current ? "当前门店" : undefined,
    }))
  }

  const candidates = new Map<string, { value: string; label: string; hint?: string }>()

  if (profile.current_store_id) {
    candidates.set(profile.current_store_id, {
      value: profile.current_store_id,
      label: profile.current_store_name || profile.current_store_id,
      hint: "当前门店",
    })
  }

  if (profile.primary_store_id) {
    candidates.set(profile.primary_store_id, {
      value: profile.primary_store_id,
      label: profile.primary_store_name || profile.primary_store_id,
      hint: "主归属门店",
    })
  }

  profile.data_scopes?.forEach((scope) => {
    const namedScope = scope as NamedDataScope

    if (scope.store_id && !candidates.has(scope.store_id)) {
      candidates.set(scope.store_id, {
        value: scope.store_id,
        label: namedScope.scope_label || scope.store_id,
      })
    }
  })

  return Array.from(candidates.values())
}

function createSummaryBlock(
  title: string,
  items: string[] | undefined,
  emptyText: string
): SummaryBlock {
  const safeItems = items ?? []

  return {
    title,
    count: safeItems.length,
    items: safeItems.slice(0, MAX_SUMMARY_ITEMS),
    overflowCount: Math.max(safeItems.length - MAX_SUMMARY_ITEMS, 0),
    emptyText,
  }
}

function buildScopeGroups(dataScopes: DataScopePublic[] | undefined): ScopeGroup[] {
  const groups = new Map<
    string,
    {
      count: number
      labels: Set<string>
      stores: Set<string>
      orgs: Set<string>
    }
  >()

  dataScopes?.forEach((scope) => {
    const namedScope = scope as NamedDataScope
    const key = scope.scope_type || "unknown"
    const current = groups.get(key) ?? {
      count: 0,
      labels: new Set<string>(),
      stores: new Set<string>(),
      orgs: new Set<string>(),
    }

    current.count += 1

    if (namedScope.scope_label) {
      current.labels.add(namedScope.scope_label)
    }

    if (scope.store_id) {
      current.stores.add(scope.store_id)
    }

    if (scope.org_node_id) {
      current.orgs.add(scope.org_node_id)
    }

    groups.set(key, current)
  })

  return Array.from(groups.entries())
    .map(([scopeType, value]) => ({
      scopeType,
      count: value.count,
      labels: Array.from(value.labels).slice(0, 3),
      storeCount: value.stores.size,
      orgCount: value.orgs.size,
      sampleStores: Array.from(value.stores).slice(0, 3),
      sampleOrgs: Array.from(value.orgs).slice(0, 3),
    }))
    .sort((a, b) => b.count - a.count || a.scopeType.localeCompare(b.scopeType))
}

function buildProfileViewModel(profile: AuthMeProfile | null) {
  if (!profile) {
    return null
  }

  const displayName =
    profile.nickname || profile.full_name || profile.username || "未命名用户"
  const secondaryLine = [profile.full_name, profile.username]
    .filter((item, index, array) => item && array.indexOf(item) === index)
    .join(" · ")

  return {
    displayName,
    accountLabel: profile.username,
    secondaryLine: secondaryLine || profile.username,
    status: formatStatus(profile),
    isSuperuser: Boolean(profile.is_superuser),
    roleTags:
      profile.role_names && profile.role_names.length > 0
        ? profile.role_names
        : profile.roles ?? [],
    infoItems: [
      {
        label: "用户类型",
        value: fallbackText(profile.user_type),
      },
      {
        label: "手机号",
        value: fallbackText(profile.mobile),
      },
      {
        label: "最近登录",
        value: formatTimestamp(profile.last_login_at),
      },
      {
        label: "创建时间",
        value: formatTimestamp(profile.created_at),
      },
      {
        label: "更新时间",
        value: formatTimestamp(profile.updated_at),
      },
    ],
    contextItems: [
      {
        label: "当前门店",
        value: fallbackText(profile.current_store_name, "无上下文"),
        hint: profile.current_store_id
          ? `门店 ID：${profile.current_store_id}`
          : "尚未绑定当前门店上下文",
      },
      {
        label: "当前组织",
        value: fallbackText(profile.current_org_node_name, "无上下文"),
        hint: profile.current_org_node_id
          ? `组织 ID：${profile.current_org_node_id}`
          : "尚未绑定当前组织上下文",
      },
      {
        label: "主门店",
        value: fallbackText(profile.primary_store_name),
        hint: profile.primary_store_id
          ? `门店 ID：${profile.primary_store_id}`
          : undefined,
      },
      {
        label: "主部门",
        value: fallbackText(profile.primary_department_name),
        hint: profile.primary_department_id
          ? `组织 ID：${profile.primary_department_id}`
          : undefined,
      },
    ],
    memberships: (profile.store_memberships ?? []).map((membership) => ({
      title: membership.store_name || membership.store_id,
      description: [
        membership.org_node_name || membership.org_node_id,
        membership.position_name,
      ]
        .filter(Boolean)
        .join(" · ") || "暂无组织或岗位信息",
      badges: [
        membership.is_primary ? "主归属" : "",
        membership.is_current ? "当前门店" : "",
      ].filter(Boolean),
    })),
  }
}

function buildSummary(profile: AuthMeProfile | null) {
  const roles =
    profile?.role_names && profile.role_names.length > 0
      ? profile.role_names
      : profile?.roles ?? []
  const permissions =
    profile?.permission_names && profile.permission_names.length > 0
      ? profile.permission_names
      : profile?.permissions ?? []
  const dataScopeLabels =
    profile?.data_scope_labels && profile.data_scope_labels.length > 0
      ? profile.data_scope_labels
      : (profile?.data_scopes as NamedDataScope[] | undefined)?.map(
          (scope) => scope.scope_label || scope.scope_type
        ) ?? []
  const dataScopes = profile?.data_scopes ?? []

  return {
    statCards: [
      {
        title: "角色",
        value: String(roles.length),
        description: roles.length > 0 ? "当前角色编码摘要" : "当前没有角色编码",
      },
      {
        title: "权限",
        value: String(permissions.length),
        description:
          permissions.length > 0 ? "当前权限编码摘要" : "当前没有权限编码",
      },
      {
        title: "数据范围",
        value: String(dataScopes.length),
        description:
          dataScopes.length > 0 ? "优先展示中文范围说明" : "当前没有数据范围",
      },
    ],
    blocks: [
      createSummaryBlock("角色摘要", roles, "当前用户还没有角色编码。"),
      createSummaryBlock("权限摘要", permissions, "当前用户还没有权限摘要。"),
      createSummaryBlock(
        "数据范围摘要",
        dataScopeLabels,
        "当前用户还没有数据范围说明。"
      ),
    ],
    scopeGroups: buildScopeGroups(dataScopes),
  }
}

export function useDashboardLogic(): DashboardLogic {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const setSession = useAuthStore((state) => state.setSession)

  const [selectedStoreId, setSelectedStoreId] = React.useState("")
  const [switchError, setSwitchError] = React.useState<string | null>(null)

  const meQuery = useAuthReadCurrentUser()
  const switchStoreMutation = useAuthSwitchCurrentStore()

  const profile = (meQuery.data?.data as AuthMeProfile | null | undefined) ?? null
  const storeCandidates = React.useMemo(() => buildStoreCandidates(profile), [profile])

  React.useEffect(() => {
    setSelectedStoreId((current) => {
      if (current && storeCandidates.some((candidate) => candidate.value === current)) {
        return current
      }

      return profile?.current_store_id || storeCandidates[0]?.value || ""
    })
  }, [profile?.current_store_id, storeCandidates])

  const handleStoreValueChange = React.useCallback(
    (value: string) => {
      setSwitchError(null)
      setSelectedStoreId(value)
    },
    []
  )

  const handleSwitchStore = React.useCallback(async () => {
    const targetStoreId = selectedStoreId.trim()

    if (!targetStoreId) {
      setSwitchError("请先选择目标门店")
      return
    }

    if (targetStoreId === profile?.current_store_id) {
      setSwitchError("当前已在这个门店上下文，无需重复切换")
      return
    }

    setSwitchError(null)
    setStoredCurrentStoreId(targetStoreId)

    try {
      const response = await switchStoreMutation.mutateAsync({
        data: { store_id: targetStoreId },
      })
      const nextUser = response.data

      if (!nextUser) {
        throw new Error(response.message || "切换成功但未返回最新用户信息")
      }

      if (accessToken) {
        setSession(accessToken, nextUser)
      }

      queryClient.setQueryData<ApiResponseCurrentUserProfile>(
        getAuthReadCurrentUserQueryKey(),
        response
      )

      const refreshed = await meQuery.refetch()
      const refreshedUser = refreshed.data?.data

      if (!refreshedUser) {
        throw new Error("门店已切换，但重新获取当前用户信息失败")
      }

      if (accessToken) {
        setSession(accessToken, refreshedUser)
      }

      queryClient.setQueryData<ApiResponseCurrentUserProfile>(
        getAuthReadCurrentUserQueryKey(),
        refreshed.data
      )
    } catch (error) {
      setSwitchError(
        error instanceof Error ? error.message : "切换门店失败，请稍后再试"
      )
    }
  }, [
    accessToken,
    meQuery,
    profile?.current_store_id,
    queryClient,
    selectedStoreId,
    setSession,
    switchStoreMutation,
  ])

  const error =
    meQuery.error instanceof Error ? meQuery.error.message : meQuery.error ? "加载失败" : null

  return {
    profile: buildProfileViewModel(profile),
    summary: buildSummary(profile),
    storeSwitcher: {
      value: selectedStoreId,
      candidates: storeCandidates,
      currentStoreId: profile?.current_store_id ?? null,
      currentStoreName: profile?.current_store_name ?? null,
      isSubmitting: switchStoreMutation.isPending,
      error: switchError,
      isDisabled: !profile || meQuery.isFetching,
      helperText: profile?.accessible_stores && profile.accessible_stores.length > 0
        ? "候选门店来自接口返回的 accessible_stores，切换后会重新获取当前用户信息。"
        : "候选门店来自当前门店、主门店与数据范围中的 store_id，切换后会重新获取当前用户信息。",
      buttonLabel:
        meQuery.isFetching || switchStoreMutation.isPending ? "切换中..." : "切换当前门店",
      onValueChange: handleStoreValueChange,
      onSubmit: handleSwitchStore,
    },
    isLoading: meQuery.isPending,
    isEmpty: !meQuery.isPending && !error && !profile,
    error,
    retry: meQuery.refetch,
  }
}
