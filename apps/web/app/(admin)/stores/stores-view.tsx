"use client"

import * as React from "react"
import { ArrowClockwise, Plus } from "@phosphor-icons/react/dist/ssr"
import { Controller, useForm, useWatch } from "react-hook-form"

import {
  DEFAULT_NODE_FORM,
  DEFAULT_STORE_FORM,
  getNodeFormValues,
  getStoreFormValues,
  type NodeFormValues,
  type StoreFormValues,
  useStoresPageLogic,
} from "@/app/(admin)/stores/use-stores-page-logic"
import type { OrgNodePublic } from "@/api/generated/workspace.schemas"
import { PermissionDenied } from "@/components/permission-denied"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  StoreOrganizationTree,
  type StoreOrganizationNode,
} from "@workspace/ui/components/business"

const STORE_STATUS_OPTIONS = [
  { value: "active", label: "营业中" },
  { value: "inactive", label: "停用" },
]

const NODE_ACTIVE_OPTIONS = [
  { value: "true", label: "启用" },
  { value: "false", label: "停用" },
]

const NODE_TYPE_OPTIONS = [
  { value: "region", label: "大区" },
  { value: "department", label: "部门" },
  { value: "team", label: "小组" },
  { value: "ops", label: "运营单元" },
  { value: "warehouse", label: "仓储" },
  { value: "bar", label: "吧台" },
]

const ROOT_ORGANIZATION_VALUE = "__root__"

type NodeDialogFormValues = NodeFormValues & {
  prefix: string
}

function getNodeTypeLabel(type?: string | null) {
  return (
    NODE_TYPE_OPTIONS.find((option) => option.value === type)?.label ||
    type?.trim() ||
    "未命名类型"
  )
}

function getNodePathDepth(path?: string | null) {
  if (!path?.trim()) {
    return 0
  }

  return path.split("/").filter(Boolean).length
}

function buildParentNodeOptions(
  nodes: OrgNodePublic[],
  storeId: string,
  editingNodeId: string | null
) {
  return nodes
    .filter((node) => node.store_id === storeId && node.id !== editingNodeId)
    .sort((left, right) => {
      if ((left.sort_order ?? 0) !== (right.sort_order ?? 0)) {
        return (left.sort_order ?? 0) - (right.sort_order ?? 0)
      }

      return left.name.localeCompare(right.name, "zh-CN")
    })
    .map((node) => ({
      value: node.id,
      label: `${"　".repeat(Math.max(getNodePathDepth(node.path) - 1, 0))}${node.name}`,
      rawLabel: node.name,
    }))
}

function normalizeStoreStatus(status?: string | null) {
  return status?.trim().toLowerCase() || "unknown"
}

function getStoreStatusBadge(status?: string | null) {
  const normalized = normalizeStoreStatus(status)

  if (["active", "enabled", "open"].includes(normalized)) {
    return { label: "营业中", variant: "default" as const }
  }

  if (["inactive", "disabled", "paused", "closed", "archived"].includes(normalized)) {
    return { label: "停用", variant: "secondary" as const }
  }

  return { label: status?.trim() || "未知", variant: "outline" as const }
}

function EmptyPanel({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-border/50 bg-muted/10 p-8 text-center transition-colors hover:bg-muted/20">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

function StoreTreeSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-56 rounded-[24px]" />
      ))}
    </div>
  )
}

export function StoresView() {
  const logic = useStoresPageLogic()
  const storeForm = useForm<StoreFormValues>({
    defaultValues: DEFAULT_STORE_FORM,
  })
  const nodeForm = useForm<NodeDialogFormValues>({
    defaultValues: {
      ...DEFAULT_NODE_FORM,
      prefix: "",
    },
  })
  const watchedStoreId = useWatch({
    control: nodeForm.control,
    name: "store_id",
  })
  React.useEffect(() => {
    if (logic.storeDialogMode === null) {
      storeForm.reset(DEFAULT_STORE_FORM)
      return
    }

    storeForm.reset(getStoreFormValues(logic.editingStore))
  }, [logic.editingStore, logic.storeDialogMode, storeForm])

  React.useEffect(() => {
    if (logic.nodeDialogMode === null) {
      nodeForm.reset({
        ...DEFAULT_NODE_FORM,
        prefix: "",
      })
      return
    }

    if (logic.editingNode) {
      nodeForm.reset({
        ...getNodeFormValues(logic.editingNode),
        prefix: "",
      })
      return
    }

    nodeForm.reset({
      ...DEFAULT_NODE_FORM,
      store_id: logic.pendingNodeStoreId || DEFAULT_NODE_FORM.store_id,
      prefix: "",
    })
  }, [logic.editingNode, logic.nodeDialogMode, logic.pendingNodeStoreId, nodeForm])

  const parentNodeOptions = buildParentNodeOptions(
    logic.allNodes,
    watchedStoreId,
    logic.editingNode?.id ?? null
  )

  if (!logic.canViewPage) {
    return (
      <PermissionDenied description="当前账号缺少 `org.store.read` 或 `org.node.read`，暂时无法查看门店和组织管理页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            门店与组织管理
          </h1>
          <p className="text-sm text-muted-foreground">
            统一管理系统内各门店的基础信息及内部组织架构。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void logic.storesQuery.refetch()
              void logic.orgNodesQuery.refetch()
            }}
            disabled={logic.storesQuery.isFetching || logic.orgNodesQuery.isFetching}
            className="h-9"
          >
            <ArrowClockwise
              className={cn(
                "mr-2 size-3.5",
                (logic.storesQuery.isFetching || logic.orgNodesQuery.isFetching) &&
                  "animate-spin"
              )}
            />
            刷新数据
          </Button>
          {logic.canCreateStore ? (
            <Button onClick={logic.openCreateStoreDialog} size="sm" className="h-9">
              <Plus className="mr-2 size-3.5" weight="bold" />
              新建门店
            </Button>
          ) : null}
        </div>
      </div>

      {logic.storesQuery.isLoading || logic.orgNodesQuery.isLoading ? (
        <StoreTreeSkeleton />
      ) : logic.storesQuery.isError ? (
        <EmptyPanel
          title="门店列表加载失败"
          description={
            logic.storesQuery.error instanceof Error
              ? logic.storesQuery.error.message
              : "暂时无法读取门店数据。"
          }
          action={
            <Button variant="outline" onClick={() => void logic.storesQuery.refetch()}>
              重试
            </Button>
          }
        />
      ) : logic.orgNodesQuery.isError ? (
        <EmptyPanel
          title="组织加载失败"
          description={
            logic.orgNodesQuery.error instanceof Error
              ? logic.orgNodesQuery.error.message
              : "暂时无法读取组织数据。"
          }
          action={
            <Button variant="outline" onClick={() => void logic.orgNodesQuery.refetch()}>
              重试
            </Button>
          }
        />
      ) : logic.stores.length === 0 ? (
        <EmptyPanel
          title="还没有门店"
          description="先创建门店，再给门店挂组织。"
          action={logic.canCreateStore ? <Button onClick={logic.openCreateStoreDialog}>创建首个门店</Button> : undefined}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {logic.stores.map((store) => {
            const statusMeta = getStoreStatusBadge(store.status)
            const nodes: StoreOrganizationNode[] = logic.allNodes
              .filter((node) => node.store_id === store.id)
              .map((node) => ({
                id: node.id,
                parentId: node.parent_id,
                name: node.name,
                typeLabel: getNodeTypeLabel(node.node_type),
                isActive: node.is_active,
                sortOrder: node.sort_order,
                prefix: node.prefix,
                level: node.level,
                createdAt: node.created_at,
                updatedAt: node.updated_at,
              }))

            return (
              <Card key={store.id} className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-0">
                  <StoreOrganizationTree
                    storeName={store.name}
                    storeStatusLabel={statusMeta.label}
                    storeStatusVariant={statusMeta.variant}
                    nodes={nodes}
                    onEditStore={
                      logic.canUpdateStore ? () => logic.openEditStoreDialog(store) : undefined
                    }
                    onDeleteStore={
                      logic.canDeleteStore ? () => logic.requestDeleteStore(store) : undefined
                    }
                    onCreateNode={
                      logic.canCreateNode
                        ? () => logic.openCreateNodeDialogForStore(store.id)
                        : undefined
                    }
                    onEditNode={(node) => {
                      if (!logic.canUpdateNode) {
                        return
                      }

                      const matched = logic.allNodes.find((item) => item.id === node.id)

                      if (matched) {
                        logic.openEditNodeDialog(matched)
                      }
                    }}
                    onDeleteNode={(node) => {
                      if (!logic.canDeleteNode) {
                        return
                      }

                      const matched = logic.allNodes.find((item) => item.id === node.id)

                      if (matched) {
                        logic.requestDeleteNode(matched)
                      }
                    }}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog
        open={logic.storeDialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            logic.closeStoreDialog()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {logic.storeDialogMode === "edit" ? "编辑门店" : "新建门店"}
            </DialogTitle>
            <DialogDescription>
              使用真实门店接口维护门店基础信息和业务状态。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="store-name" className="text-sm font-medium text-foreground">
                门店名称
              </label>
              <Input
                id="store-name"
                {...storeForm.register("name", {
                  required: "请输入门店名称",
                })}
                aria-invalid={storeForm.formState.errors.name ? true : undefined}
                placeholder="例如：静安门店"
                disabled={
                  logic.storeDialogMode === "edit"
                    ? !logic.canUpdateStore
                    : !logic.canCreateStore
                }
              />
              {storeForm.formState.errors.name ? (
                <div className="text-sm text-destructive">
                  {storeForm.formState.errors.name.message}
                </div>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor="store-code" className="text-sm font-medium text-foreground">
                门店编码
              </label>
              <Input
                id="store-code"
                {...storeForm.register("code", {
                  required: "请输入门店编码",
                })}
                aria-invalid={storeForm.formState.errors.code ? true : undefined}
                placeholder="例如：store-jingan"
                disabled={
                  logic.storeDialogMode === "edit"
                    ? !logic.canUpdateStore
                    : !logic.canCreateStore
                }
              />
              {storeForm.formState.errors.code ? (
                <div className="text-sm text-destructive">
                  {storeForm.formState.errors.code.message}
                </div>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">门店状态</label>
              <Controller
                control={storeForm.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      disabled={
                        logic.storeDialogMode === "edit"
                          ? !logic.canUpdateStore
                          : !logic.canCreateStore
                      }
                    >
                      <SelectValue placeholder="请选择门店状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {STORE_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {logic.storeSubmitError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {logic.storeSubmitError}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={logic.closeStoreDialog}
              disabled={logic.isStoreSubmitting}
            >
              取消
            </Button>
            {((logic.storeDialogMode === "edit" && logic.canUpdateStore) ||
              (logic.storeDialogMode !== "edit" && logic.canCreateStore)) ? (
              <Button
                onClick={storeForm.handleSubmit(async (values) => {
                  await logic.submitStore(values)
                })}
                disabled={logic.isStoreSubmitting}
              >
                {logic.isStoreSubmitting ? "保存中..." : "保存门店"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={logic.nodeDialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            logic.closeNodeDialog()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {logic.nodeDialogMode === "edit" ? "编辑组织节点" : "新增组织节点"}
            </DialogTitle>
            <DialogDescription>
              组织节点和当前门店强关联，创建时会落到所选门店名下。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">归属门店</label>
              <Controller
                control={nodeForm.control}
                name="store_id"
                rules={{ required: "请选择归属门店" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={
                      logic.nodeDialogMode === "edit"
                        ? true
                        : !logic.canCreateNode
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择门店" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {logic.stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {nodeForm.formState.errors.store_id ? (
                <div className="text-sm text-destructive">
                  {nodeForm.formState.errors.store_id.message}
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">
                上级组织
              </label>
              <Controller
                control={nodeForm.control}
                name="parent_id"
                render={({ field }) => (
                  <Select
                    value={field.value || ROOT_ORGANIZATION_VALUE}
                    onValueChange={(value) =>
                      field.onChange(value === ROOT_ORGANIZATION_VALUE ? "" : value)
                    }
                    disabled={
                      logic.nodeDialogMode === "edit"
                        ? true
                        : !logic.canCreateNode
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择上级组织，根组织可不选" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={ROOT_ORGANIZATION_VALUE}>根组织</SelectItem>
                        {parentNodeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                {logic.nodeDialogMode === "edit"
                  ? "当前接口暂不支持直接调整上级组织。"
                  : "不选择时会作为当前门店下的根组织创建。"}
              </p>
            </div>

            <div className="grid gap-2">
              <label htmlFor="node-name" className="text-sm font-medium text-foreground">
                组织名称
              </label>
              <Input
                id="node-name"
                {...nodeForm.register("name", {
                  required: "请输入组织名称",
                })}
                aria-invalid={nodeForm.formState.errors.name ? true : undefined}
                placeholder="例如：前厅营运组"
                disabled={
                  logic.nodeDialogMode === "edit"
                    ? !logic.canUpdateNode
                    : !logic.canCreateNode
                }
              />
              {nodeForm.formState.errors.name ? (
                <div className="text-sm text-destructive">
                  {nodeForm.formState.errors.name.message}
                </div>
              ) : null}
            </div>

            {logic.nodeDialogMode === "create" ? (
              <div className="grid gap-2">
                <div className="grid gap-2">
                  <label htmlFor="node-prefix" className="text-sm font-medium text-foreground">
                    编号前缀
                  </label>
                  <Input
                    id="node-prefix"
                    {...nodeForm.register("prefix", {
                      required: "请输入编号前缀",
                    })}
                    aria-invalid={nodeForm.formState.errors.prefix ? true : undefined}
                    placeholder="例如：QT"
                    disabled={!logic.canCreateNode}
                  />
                  {nodeForm.formState.errors.prefix ? (
                    <div className="text-sm text-destructive">
                      {nodeForm.formState.errors.prefix.message}
                    </div>
                  ) : null}
                  <p className="text-xs leading-5 text-muted-foreground">
                    创建后员工编号会按前缀自动生成，不允许手工编辑。
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <label htmlFor="node-type" className="text-sm font-medium text-foreground">
                节点类型
              </label>
              <Controller
                control={nodeForm.control}
                name="node_type"
                rules={{ required: "请选择节点类型" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={
                      logic.nodeDialogMode === "edit"
                        ? true
                        : !logic.canCreateNode
                    }
                  >
                    <SelectTrigger id="node-type">
                      <SelectValue placeholder="请选择节点类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {NODE_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {nodeForm.formState.errors.node_type ? (
                <div className="text-sm text-destructive">
                  {nodeForm.formState.errors.node_type.message}
                </div>
              ) : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="node-sort" className="text-sm font-medium text-foreground">
                  排序值
                </label>
                <Input
                  id="node-sort"
                  {...nodeForm.register("sort_order")}
                  placeholder="0"
                  disabled={
                    logic.nodeDialogMode === "edit"
                      ? !logic.canUpdateNode
                      : !logic.canCreateNode
                  }
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">节点状态</label>
                <Controller
                  control={nodeForm.control}
                  name="is_active"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        disabled={
                          logic.nodeDialogMode === "edit"
                            ? !logic.canUpdateNode
                            : !logic.canCreateNode
                        }
                      >
                        <SelectValue placeholder="请选择节点状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {NODE_ACTIVE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {logic.nodeSubmitError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {logic.nodeSubmitError}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={logic.closeNodeDialog}
              disabled={logic.isNodeSubmitting}
            >
              取消
            </Button>
            {((logic.nodeDialogMode === "edit" && logic.canUpdateNode) ||
              (logic.nodeDialogMode !== "edit" && logic.canCreateNode)) ? (
              <Button
                onClick={nodeForm.handleSubmit(async (values) => {
                  const payload: NodeFormValues = {
                    store_id: values.store_id,
                    parent_id: values.parent_id,
                    name: values.name,
                    node_type: values.node_type,
                    sort_order: values.sort_order,
                    is_active: values.is_active,
                  }
                  await logic.submitNode(payload)
                })}
                disabled={logic.isNodeSubmitting}
              >
                {logic.isNodeSubmitting ? "保存中..." : "保存节点"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={logic.deleteStoreTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            logic.closeDeleteStoreDialog()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>删除门店</DialogTitle>
            <DialogDescription>
              这是物理删除操作，不等于停用。若后端返回 409 `STORE_IN_USE`，错误会显示在下方。
            </DialogDescription>
          </DialogHeader>

          {logic.deleteStoreTarget ? (
            <div className="grid gap-4">
              <div className="rounded-[24px] border border-border/70 bg-muted/20 p-4">
                <div className="font-medium text-foreground">{logic.deleteStoreTarget.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">删除后不可恢复</div>
              </div>

              {logic.deleteStoreError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {logic.deleteStoreError}
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={logic.closeDeleteStoreDialog}
              disabled={logic.isStoreDeleting}
            >
              取消
            </Button>
            {logic.canDeleteStore ? (
              <Button
                variant="destructive"
                onClick={() => void logic.confirmDeleteStore()}
                disabled={logic.isStoreDeleting}
              >
                {logic.isStoreDeleting ? "删除中..." : "确认删除"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={logic.deleteNodeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            logic.closeDeleteNodeDialog()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>删除组织节点</DialogTitle>
            <DialogDescription>
              删除前请确认没有子节点和绑定关系，避免组织架构断裂。
            </DialogDescription>
          </DialogHeader>

          {logic.deleteNodeTarget ? (
            <div className="grid gap-4">
              <div className="rounded-[24px] border border-border/70 bg-muted/20 p-4">
                <div className="font-medium text-foreground">{logic.deleteNodeTarget.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{logic.deleteNodeTarget.node_type}</div>
              </div>

              {logic.deleteNodeError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {logic.deleteNodeError}
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={logic.closeDeleteNodeDialog}
              disabled={logic.isNodeDeleting}
            >
              取消
            </Button>
            {logic.canDeleteNode ? (
              <Button
                variant="destructive"
                onClick={() => void logic.confirmDeleteNode()}
                disabled={logic.isNodeDeleting}
              >
                {logic.isNodeDeleting ? "删除中..." : "确认删除"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
