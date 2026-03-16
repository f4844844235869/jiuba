"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"

import {
  getOrganizationReadOrgNodesRouteQueryKey,
  useOrganizationCreateOrgNodeRoute,
  useOrganizationDeleteOrgNodeRoute,
  useOrganizationReadOrgNodesRoute,
  useOrganizationUpdateOrgNodeRoute,
} from "@/api/generated/organization/organization"
import {
  getStoresReadStoresQueryKey,
  useStoresCreateStoreRoute,
  useStoresDeleteStoreRoute,
  useStoresReadStores,
  useStoresUpdateStoreRoute,
} from "@/api/generated/stores/stores"
import type {
  OrgNodeCreate,
  OrgNodePublic,
  OrgNodeUpdate,
  StoreCreate,
  StorePublic,
  StoreUpdate,
} from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type StoreFormValues = {
  code: string
  name: string
  status: string
}

export type NodeFormValues = {
  store_id: string
  parent_id: string
  name: string
  node_type: string
  sort_order: string
  is_active: string
}

type DialogMode = "create" | "edit"

export const DEFAULT_STORE_FORM: StoreFormValues = {
  code: "",
  name: "",
  status: "active",
}

export const DEFAULT_NODE_FORM: NodeFormValues = {
  store_id: "",
  parent_id: "",
  name: "",
  node_type: "department",
  sort_order: "0",
  is_active: "true",
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

function toStoreFormValues(store?: StorePublic | null): StoreFormValues {
  if (!store) {
    return DEFAULT_STORE_FORM
  }

  return {
    code: store.code,
    name: store.name,
    status: store.status?.trim() || "active",
  }
}

function toNodeFormValues(node?: OrgNodePublic | null): NodeFormValues {
  if (!node) {
    return DEFAULT_NODE_FORM
  }

  return {
    store_id: node.store_id,
    parent_id: node.parent_id ?? "",
    name: node.name,
    node_type: node.node_type,
    sort_order: String(node.sort_order ?? 0),
    is_active: node.is_active === false ? "false" : "true",
  }
}

export function getStoreFormValues(store?: StorePublic | null) {
  return toStoreFormValues(store)
}

export function getNodeFormValues(node?: OrgNodePublic | null) {
  return toNodeFormValues(node)
}

function toOptionalNumber(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return undefined
  }

  const nextValue = Number(trimmed)
  return Number.isNaN(nextValue) ? undefined : nextValue
}

export function useStoresPageLogic() {
  const queryClient = useQueryClient()
  const { hasPermission } = usePermissionAccess()
  const canReadStores = hasPermission("org.store.read")
  const canReadNodes = hasPermission("org.node.read")

  const storesQuery = useStoresReadStores({
    query: {
      enabled: canReadStores,
    },
  })
  const orgNodesQuery = useOrganizationReadOrgNodesRoute(undefined, {
    query: {
      enabled: canReadNodes,
    },
  })

  const createStoreMutation = useStoresCreateStoreRoute()
  const updateStoreMutation = useStoresUpdateStoreRoute()
  const deleteStoreMutation = useStoresDeleteStoreRoute()
  const createNodeMutation = useOrganizationCreateOrgNodeRoute()
  const updateNodeMutation = useOrganizationUpdateOrgNodeRoute()
  const deleteNodeMutation = useOrganizationDeleteOrgNodeRoute()

  const stores = React.useMemo(() => storesQuery.data?.data ?? [], [storesQuery.data?.data])
  const allNodes = React.useMemo(
    () => orgNodesQuery.data?.data ?? [],
    [orgNodesQuery.data?.data]
  )

  const [selectedStoreId, setSelectedStoreId] = React.useState<string | null>(null)
  const [storeDialogMode, setStoreDialogMode] = React.useState<DialogMode | null>(null)
  const [editingStore, setEditingStore] = React.useState<StorePublic | null>(null)
  const [storeSubmitError, setStoreSubmitError] = React.useState<string | null>(null)
  const [deleteStoreTarget, setDeleteStoreTarget] = React.useState<StorePublic | null>(null)
  const [deleteStoreError, setDeleteStoreError] = React.useState<string | null>(null)

  const [nodeDialogMode, setNodeDialogMode] = React.useState<DialogMode | null>(null)
  const [editingNode, setEditingNode] = React.useState<OrgNodePublic | null>(null)
  const [pendingNodeStoreId, setPendingNodeStoreId] = React.useState<string>("")
  const [nodeSubmitError, setNodeSubmitError] = React.useState<string | null>(null)
  const [deleteNodeTarget, setDeleteNodeTarget] = React.useState<OrgNodePublic | null>(null)
  const [deleteNodeError, setDeleteNodeError] = React.useState<string | null>(null)

  const selectedStore =
    stores.find((store) => store.id === selectedStoreId) ?? null

  const selectedStoreNodes = React.useMemo(
    () =>
      allNodes
        .filter((node) => node.store_id === selectedStoreId)
        .sort((left, right) => {
          if (left.level !== right.level) {
            return left.level - right.level
          }

          if ((left.sort_order ?? 0) !== (right.sort_order ?? 0)) {
            return (left.sort_order ?? 0) - (right.sort_order ?? 0)
          }

          return left.name.localeCompare(right.name, "zh-CN")
        }),
    [allNodes, selectedStoreId]
  )

  React.useEffect(() => {
    if (stores.length === 0) {
      setSelectedStoreId(null)
      return
    }

    if (!selectedStoreId || !stores.some((store) => store.id === selectedStoreId)) {
      setSelectedStoreId(stores[0]?.id ?? null)
    }
  }, [selectedStoreId, stores])

  const refreshStores = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: getStoresReadStoresQueryKey() })
  }, [queryClient])

  const refreshOrgNodes = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: getOrganizationReadOrgNodesRouteQueryKey(),
    })
  }, [queryClient])

  const openCreateStoreDialog = React.useCallback(() => {
    setStoreDialogMode("create")
    setEditingStore(null)
    setStoreSubmitError(null)
  }, [])

  const openEditStoreDialog = React.useCallback((store: StorePublic) => {
    setStoreDialogMode("edit")
    setEditingStore(store)
    setStoreSubmitError(null)
  }, [])

  const closeStoreDialog = React.useCallback(() => {
    if (createStoreMutation.isPending || updateStoreMutation.isPending) {
      return
    }

    setStoreDialogMode(null)
    setEditingStore(null)
    setStoreSubmitError(null)
  }, [createStoreMutation.isPending, updateStoreMutation.isPending])

  const submitStore = React.useCallback(async (values: StoreFormValues) => {
    const payload: StoreCreate | StoreUpdate = {
      code: values.code.trim(),
      name: values.name.trim(),
      status: values.status.trim() || "active",
    }

    setStoreSubmitError(null)

    try {
      if (storeDialogMode === "edit" && editingStore) {
        await updateStoreMutation.mutateAsync({
          storeId: editingStore.id,
          data: payload,
        })
      } else {
        await createStoreMutation.mutateAsync({
          data: payload as StoreCreate,
        })
      }

      await refreshStores()
      closeStoreDialog()
    } catch (error) {
      setStoreSubmitError(getErrorMessage(error, "保存门店失败，请稍后重试"))
    }
  }, [
    closeStoreDialog,
    createStoreMutation,
    editingStore,
    refreshStores,
    storeDialogMode,
    updateStoreMutation,
  ])

  const requestDeleteStore = React.useCallback((store: StorePublic) => {
    setDeleteStoreTarget(store)
    setDeleteStoreError(null)
  }, [])

  const closeDeleteStoreDialog = React.useCallback(() => {
    if (deleteStoreMutation.isPending) {
      return
    }

    setDeleteStoreTarget(null)
    setDeleteStoreError(null)
  }, [deleteStoreMutation.isPending])

  const confirmDeleteStore = React.useCallback(async () => {
    if (!deleteStoreTarget) {
      return
    }

    setDeleteStoreError(null)

    try {
      await deleteStoreMutation.mutateAsync({ storeId: deleteStoreTarget.id })
      await refreshStores()
      await refreshOrgNodes()

      if (selectedStoreId === deleteStoreTarget.id) {
        setSelectedStoreId(null)
      }

      closeDeleteStoreDialog()
    } catch (error) {
      const message = getErrorMessage(error, "删除门店失败，请稍后重试")
      const maybeInUse = /STORE_IN_USE|门店正在使用|已关联/i.test(message)

      setDeleteStoreError(
        maybeInUse
          ? "门店仍被组织、员工或当前上下文引用，无法物理删除。这里保留了 409 STORE_IN_USE 的业务提示位，建议先将门店状态改为停用。"
          : message
      )
    }
  }, [
    closeDeleteStoreDialog,
    deleteStoreMutation,
    deleteStoreTarget,
    refreshOrgNodes,
    refreshStores,
    selectedStoreId,
  ])

  const openCreateNodeDialog = React.useCallback(() => {
    const nextStoreId = selectedStoreId ?? stores[0]?.id ?? ""

    setNodeDialogMode("create")
    setEditingNode(null)
    setPendingNodeStoreId(nextStoreId)
    setNodeSubmitError(null)
  }, [selectedStoreId, stores])

  const openCreateNodeDialogForStore = React.useCallback((storeId: string) => {
    setSelectedStoreId(storeId)
    setNodeDialogMode("create")
    setEditingNode(null)
    setPendingNodeStoreId(storeId)
    setNodeSubmitError(null)
  }, [])

  const openEditNodeDialog = React.useCallback((node: OrgNodePublic) => {
    setNodeDialogMode("edit")
    setEditingNode(node)
    setPendingNodeStoreId(node.store_id)
    setNodeSubmitError(null)
  }, [])

  const closeNodeDialog = React.useCallback(() => {
    if (createNodeMutation.isPending || updateNodeMutation.isPending) {
      return
    }

    setNodeDialogMode(null)
    setEditingNode(null)
    setPendingNodeStoreId("")
    setNodeSubmitError(null)
  }, [createNodeMutation.isPending, updateNodeMutation.isPending])

  const submitNode = React.useCallback(async (values: NodeFormValues) => {
    setNodeSubmitError(null)

    try {
      if (nodeDialogMode === "edit" && editingNode) {
        const payload: OrgNodeUpdate = {
          name: values.name.trim(),
          sort_order: toOptionalNumber(values.sort_order) ?? null,
          is_active: values.is_active === "true",
        }

        await updateNodeMutation.mutateAsync({
          nodeId: editingNode.id,
          data: payload,
        })
      } else {
        const payload: OrgNodeCreate = {
          store_id: values.store_id.trim(),
          parent_id: values.parent_id.trim() || null,
          name: values.name.trim(),
          node_type: values.node_type.trim(),
          sort_order: toOptionalNumber(values.sort_order),
          is_active: values.is_active === "true",
        }

        await createNodeMutation.mutateAsync({
          data: payload,
        })
      }

      await refreshOrgNodes()
      if (values.store_id.trim()) {
        setSelectedStoreId(values.store_id.trim())
      }
      closeNodeDialog()
    } catch (error) {
      setNodeSubmitError(
        getErrorMessage(
          error,
          nodeDialogMode === "edit" ? "更新组织节点失败" : "创建组织节点失败"
        )
      )
    }
  }, [
    closeNodeDialog,
    createNodeMutation,
    editingNode,
    nodeDialogMode,
    refreshOrgNodes,
    updateNodeMutation,
  ])

  const requestDeleteNode = React.useCallback((node: OrgNodePublic) => {
    setDeleteNodeTarget(node)
    setDeleteNodeError(null)
  }, [])

  const closeDeleteNodeDialog = React.useCallback(() => {
    if (deleteNodeMutation.isPending) {
      return
    }

    setDeleteNodeTarget(null)
    setDeleteNodeError(null)
  }, [deleteNodeMutation.isPending])

  const confirmDeleteNode = React.useCallback(async () => {
    if (!deleteNodeTarget) {
      return
    }

    setDeleteNodeError(null)

    try {
      await deleteNodeMutation.mutateAsync({ nodeId: deleteNodeTarget.id })
      await refreshOrgNodes()
      closeDeleteNodeDialog()
    } catch (error) {
      const message = getErrorMessage(error, "删除组织节点失败，请稍后重试")
      const maybeInUse = /ORG_NODE_IN_USE|组织节点正在使用|已关联/i.test(message)

      setDeleteNodeError(
        maybeInUse
          ? "该组织节点仍有绑定关系或下级节点，暂时不能删除。请先清理依赖后再重试。"
          : message
      )
    }
  }, [closeDeleteNodeDialog, deleteNodeMutation, deleteNodeTarget, refreshOrgNodes])

  return {
    canViewPage: canReadStores && canReadNodes,
    canReadStores,
    canReadNodes,
    canCreateStore: hasPermission("org.store.create"),
    canUpdateStore: hasPermission("org.store.update"),
    canDeleteStore: hasPermission("org.store.delete"),
    canCreateNode: hasPermission("org.node.create"),
    canUpdateNode: hasPermission("org.node.update"),
    canDeleteNode: hasPermission("org.node.delete"),
    stores,
    allNodes,
    selectedStore,
    selectedStoreId,
    selectedStoreNodes,
    storesQuery,
    orgNodesQuery,
    storeDialogMode,
    editingStore,
    storeSubmitError,
    deleteStoreTarget,
    deleteStoreError,
    nodeDialogMode,
    editingNode,
    pendingNodeStoreId,
    nodeSubmitError,
    deleteNodeTarget,
    deleteNodeError,
    isStoreSubmitting:
      createStoreMutation.isPending || updateStoreMutation.isPending,
    isStoreDeleting: deleteStoreMutation.isPending,
    isNodeSubmitting: createNodeMutation.isPending || updateNodeMutation.isPending,
    isNodeDeleting: deleteNodeMutation.isPending,
    setSelectedStoreId,
    openCreateStoreDialog,
    openEditStoreDialog,
    closeStoreDialog,
    submitStore,
    requestDeleteStore,
    closeDeleteStoreDialog,
    confirmDeleteStore,
    openCreateNodeDialog,
    openCreateNodeDialogForStore,
    openEditNodeDialog,
    closeNodeDialog,
    submitNode,
    requestDeleteNode,
    closeDeleteNodeDialog,
    confirmDeleteNode,
  }
}
