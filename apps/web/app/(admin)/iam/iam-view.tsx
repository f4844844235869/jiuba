"use client"

import * as React from "react"
import {
  ArrowClockwise,
  PencilSimple,
  Plus,
  Trash,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr"

import { useIamPageLogic } from "@/app/(admin)/iam/use-iam-page-logic"
import { PermissionDenied } from "@/components/permission-denied"
import type { PermissionPublic, RolePublic } from "@/api/generated/workspace.schemas"
import { cn } from "@workspace/ui/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { DataTablePagination } from "@workspace/ui/components/primitives"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLegend,
  FieldSet,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/toggle-group"

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "启用" },
  { value: "INACTIVE", label: "停用" },
]

function normalizeStatus(status?: string | null) {
  return status?.trim().toUpperCase() || "UNKNOWN"
}

function getStatusMeta(status?: string | null) {
  const normalized = normalizeStatus(status)

  if (["ACTIVE", "ENABLED"].includes(normalized)) {
    return { label: "启用", variant: "default" as const }
  }

  if (["INACTIVE", "DISABLED", "ARCHIVED"].includes(normalized)) {
    return { label: "停用", variant: "secondary" as const }
  }

  return { label: status?.trim() || "未知", variant: "outline" as const }
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function RolesLoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 md:grid-cols-[1.2fr_0.8fr_1fr]"
        >
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-36" />
        </div>
      ))}
    </div>
  )
}

function PermissionsLoadingState() {
  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="h-5 w-24" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, itemIndex) => (
              <div key={itemIndex} className="rounded-2xl border border-border/70 p-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-2 h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function QueryErrorAlert({
  title,
  description,
  onRetry,
  isRetrying,
}: {
  title: string
  description: string
  onRetry: () => void
  isRetrying: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      <Alert variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
      <div>
        <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
          <ArrowClockwise
            data-icon="inline-start"
            className={cn(isRetrying && "animate-spin")}
          />
          重试
        </Button>
      </div>
    </div>
  )
}

function PermissionChecklist({
  permissionGroups,
  selectedPermissionIds,
  onToggle,
}: {
  permissionGroups: Array<{ module: string; items: PermissionPublic[] }>
  selectedPermissionIds: string[]
  onToggle: (permissionId: string, checked: boolean) => void
}) {
  const [activeTab, setActiveTab] = React.useState(permissionGroups[0]?.module ?? "")

  React.useEffect(() => {
    if (!permissionGroups.length) {
      return
    }

    if (!permissionGroups.some((group) => group.module === activeTab)) {
      const firstGroup = permissionGroups[0]

      if (firstGroup) {
        setActiveTab(firstGroup.module)
      }
    }
  }, [activeTab, permissionGroups])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-3">
      <ScrollArea className="w-full whitespace-nowrap pb-1">
        <TabsList className="h-auto justify-start gap-1.5 rounded-xl bg-muted/30 p-1">
          {permissionGroups.map((group) => {
            const selectedCount = group.items.filter((permission) =>
              selectedPermissionIds.includes(permission.id)
            ).length

            return (
              <TabsTrigger
                key={group.module}
                value={group.module}
                className="min-w-fit gap-2 rounded-lg px-2.5 py-1.5"
              >
                <span>{group.module}</span>
                <Badge variant={selectedCount > 0 ? "default" : "secondary"}>
                  {selectedCount}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </ScrollArea>

      {permissionGroups.map((group) => {
        const selectedCount = group.items.filter((permission) =>
          selectedPermissionIds.includes(permission.id)
        ).length

        return (
          <TabsContent key={group.module} value={group.module} className="mt-0 outline-none">
            <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-foreground">{group.module}</div>
                  <div className="text-xs text-muted-foreground">
                    共 {group.items.length} 项，已选 {selectedCount} 项
                  </div>
                </div>
                <Badge variant="outline" className="bg-background">{group.items.length} 项权限</Badge>
              </div>

              <ScrollArea className="h-[220px] pr-2">
                <FieldSet>
                  <FieldLegend className="sr-only">{group.module}</FieldLegend>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2">
                    {group.items.map((permission) => (
                      <Field
                        key={permission.id}
                        orientation="horizontal"
                        className="rounded-lg border border-border/50 bg-background px-3 py-2.5 transition-colors hover:border-primary/30"
                      >
                        <Checkbox
                          id={`permission-${group.module}-${permission.id}`}
                          checked={selectedPermissionIds.includes(permission.id)}
                          onCheckedChange={(value) => onToggle(permission.id, value === true)}
                        />
                        <FieldContent>
                          <FieldLabel htmlFor={`permission-${group.module}-${permission.id}`}>
                            {permission.name}
                          </FieldLabel>
                          <FieldDescription className="truncate">{permission.code}</FieldDescription>
                        </FieldContent>
                      </Field>
                    ))}
                  </div>
                </FieldSet>
              </ScrollArea>
            </div>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}

function RoleEditorDialog({
  open,
  title,
  description,
  form,
  selectedPermissionIds,
  error,
  permissionGroups,
  permissionsQuery,
  isSubmitting,
  submitLabel,
  permissionsHint,
  onOpenChange,
  onFieldChange,
  onTogglePermission,
  onSubmit,
  canEdit,
  canManagePermissions,
}: {
  open: boolean
  title: string
  description: string
  form: { name: string; code: string; status: string }
  selectedPermissionIds: string[]
  error: string | null
  permissionGroups: Array<{ module: string; items: PermissionPublic[] }>
  permissionsQuery: {
    isLoading: boolean
    isError: boolean
    isFetching: boolean
    error: unknown
    refetch: () => Promise<unknown>
  }
  isSubmitting: boolean
  submitLabel: string
  permissionsHint?: string
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: "name" | "code" | "status", value: string) => void
  onTogglePermission: (permissionId: string, checked: boolean) => void
  onSubmit: () => void
  canEdit: boolean
  canManagePermissions: boolean
}) {
  const nameInvalid = Boolean(error) && !form.name.trim()
  const codeInvalid = Boolean(error) && !form.code.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[calc(100vw-2rem)] !max-w-[1600px] overflow-hidden p-6 xl:!w-[calc(100vw-4rem)]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>保存失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(220px,0.8fr)]">
            <Field data-invalid={nameInvalid || undefined} className="min-w-0">
              <FieldLabel htmlFor={`${title}-role-name`}>角色名称</FieldLabel>
              <Input
                id={`${title}-role-name`}
                value={form.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                placeholder="例如：店长"
                aria-invalid={nameInvalid || undefined}
                disabled={!canEdit}
              />
            </Field>

            <Field data-invalid={codeInvalid || undefined} className="min-w-0">
              <FieldLabel htmlFor={`${title}-role-code`}>角色编码</FieldLabel>
              <Input
                id={`${title}-role-code`}
                value={form.code}
                onChange={(event) => onFieldChange("code", event.target.value)}
                placeholder="例如：store_manager"
                aria-invalid={codeInvalid || undefined}
                disabled={!canEdit}
              />
            </Field>

            <Field className="min-w-0 lg:min-w-52">
              <FieldLabel>角色状态</FieldLabel>
              <ToggleGroup
                type="single"
                value={form.status}
                onValueChange={(value) => {
                  if (value) {
                    onFieldChange("status", value)
                  }
                }}
                disabled={!canEdit}
              >
                {STATUS_OPTIONS.map((option) => (
                  <ToggleGroupItem key={option.value} value={option.value} className="min-w-20">
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </div>

          <div className="min-w-0 flex flex-col gap-3 rounded-xl border border-border/50 bg-background p-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-foreground">角色权限</h2>
                <p className="text-xs text-muted-foreground">
                  按模块切换并勾选。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedPermissionIds.length} 项已选</Badge>
                {permissionsHint ? (
                  <Badge variant="secondary" className="px-2.5 py-1 text-left text-xs leading-5">
                    {permissionsHint}
                  </Badge>
                ) : null}
              </div>
            </div>

            {permissionsQuery.isLoading ? (
              <PermissionsLoadingState />
            ) : permissionsQuery.isError ? (
              <QueryErrorAlert
                title="权限加载失败"
                description={
                  permissionsQuery.error instanceof Error
                    ? permissionsQuery.error.message
                    : "暂时无法获取权限列表。"
                }
                onRetry={() => {
                  void permissionsQuery.refetch()
                }}
                isRetrying={permissionsQuery.isFetching}
              />
            ) : permissionGroups.length === 0 ? (
              <Empty className="border border-dashed border-border/70 bg-muted/15 p-6">
                <EmptyHeader>
                  <EmptyTitle>暂无权限</EmptyTitle>
                  <EmptyDescription>当前没有可授权的权限项。</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <PermissionChecklist
                permissionGroups={permissionGroups}
                selectedPermissionIds={selectedPermissionIds}
                onToggle={(permissionId, checked) => {
                  if (!canEdit || !canManagePermissions) {
                    return
                  }

                  onTogglePermission(permissionId, checked)
                }}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            取消
          </Button>
          {canEdit ? (
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : submitLabel}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RolesTable({
  roles,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  roles: RolePublic[]
  onEdit: (role: RolePublic) => void
  onDelete: (role: RolePublic) => void
  canEdit: (role: RolePublic) => boolean
  canDelete: boolean
}) {
  const [page, setPage] = React.useState(1)
  const pageSize = 10
  const totalItems = roles.length
  const currentRoles = roles.slice((page - 1) * pageSize, page * pageSize)

  React.useEffect(() => {
    // Reset page if roles list shrinks and page is out of bounds
    const maxPage = Math.max(1, Math.ceil(roles.length / pageSize))
    if (page > maxPage) {
      setPage(maxPage)
    }
  }, [roles.length, page, pageSize])

  return (
    <div className="flex flex-col">
      <div className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 pl-4">角色名称</TableHead>
              <TableHead className="h-10">角色编码</TableHead>
              <TableHead className="h-10">状态</TableHead>
              <TableHead className="h-10">创建时间</TableHead>
              <TableHead className="h-10 pr-4 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRoles.map((role) => {
              const statusMeta = getStatusMeta(role.status)
              const canEditCurrentRole = canEdit(role)

              return (
                <TableRow key={role.id} className="hover:bg-muted/30">
                  <TableCell className="pl-4 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-muted-foreground" />
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                      {role.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusMeta.variant}
                      className="h-5 px-1.5 text-[10px] font-medium"
                    >
                      {statusMeta.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(role.created_at)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <div className="flex justify-end gap-1">
                      {canEditCurrentRole ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => onEdit(role)}
                          title="编辑角色"
                        >
                          <PencilSimple className="size-4" />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onDelete(role)}
                          title="删除角色"
                        >
                          <Trash className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination 
        page={page} 
        pageSize={pageSize} 
        totalItems={totalItems} 
        onPageChange={setPage} 
      />
    </div>
  )
}

export function IamView() {
  const logic = useIamPageLogic()

  if (!logic.canViewPage) {
    return (
      <PermissionDenied description="当前账号缺少 `iam.role.read` 或 `iam.permission.read`，暂时无法查看角色权限页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">角色管理</h1>
          <p className="text-sm text-muted-foreground">
            管理系统角色及其权限配置。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.rolesQuery.refetch()}
            disabled={logic.rolesQuery.isFetching}
            className="h-9"
          >
            <ArrowClockwise
              className={cn("mr-2 size-3.5", logic.rolesQuery.isFetching && "animate-spin")}
            />
            刷新
          </Button>
          {logic.canCreateRole ? (
            <Button onClick={logic.openCreateDialog} size="sm" className="h-9">
              <Plus className="mr-2 size-3.5" weight="bold" />
              新建角色
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {logic.rolesQuery.isLoading ? (
            <div className="p-6">
              <RolesLoadingState />
            </div>
          ) : logic.rolesQuery.isError ? (
            <div className="p-6">
              <QueryErrorAlert
                title="角色加载失败"
                description={
                  logic.rolesQuery.error instanceof Error
                    ? logic.rolesQuery.error.message
                    : "暂时无法获取角色列表。"
                }
                onRetry={() => void logic.rolesQuery.refetch()}
                isRetrying={logic.rolesQuery.isFetching}
              />
            </div>
          ) : logic.roles.length === 0 ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <EmptyTitle>还没有角色</EmptyTitle>
                <EmptyDescription>点击右上角新建第一个角色。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <RolesTable
              roles={logic.roles}
              onEdit={logic.openEditDialog}
              onDelete={logic.requestDelete}
              canEdit={logic.canEditRole}
              canDelete={logic.canDeleteRole}
            />
          )}
        </CardContent>
      </Card>

      <RoleEditorDialog
        open={logic.createOpen}
        title="新建角色"
        description="先填写角色信息，再勾选这个角色可以使用的权限。"
        form={logic.createForm}
        selectedPermissionIds={logic.createPermissionIds}
        error={logic.createError}
        permissionGroups={logic.permissionGroups}
        permissionsQuery={logic.permissionsQuery}
        isSubmitting={logic.isCreating}
        submitLabel="创建角色"
        permissionsHint={
          logic.canManagePermissions
            ? "创建后会一并保存这一角色的权限集合。"
            : "当前账号没有角色授权权限，只能创建基础角色信息。"
        }
        onOpenChange={(open) => {
          if (!open) {
            logic.closeCreateDialog()
          }
        }}
        onFieldChange={logic.setCreateField}
        onTogglePermission={logic.toggleCreatePermission}
        onSubmit={() => void logic.submitCreateRole()}
        canEdit={logic.canCreateRole}
        canManagePermissions={logic.canManagePermissions}
      />

      <RoleEditorDialog
        open={Boolean(logic.editingRole)}
        title="编辑角色"
        description="修改角色基础信息，并重新提交这一角色的完整权限集合。"
        form={logic.editForm}
        selectedPermissionIds={logic.editPermissionIds}
        error={logic.editError}
        permissionGroups={logic.permissionGroups}
        permissionsQuery={logic.permissionsQuery}
        isSubmitting={logic.isUpdating}
        submitLabel="保存修改"
        permissionsHint="已根据当前角色回显权限勾选，修改后会和基础信息一起整体提交。"
        onOpenChange={(open) => {
          if (!open) {
            logic.closeEditDialog()
          }
        }}
        onFieldChange={logic.setEditField}
        onTogglePermission={logic.toggleEditPermission}
        onSubmit={() => void logic.submitEditRole()}
        canEdit={logic.canUpdateRole}
        canManagePermissions={logic.canManagePermissions}
      />

      <AlertDialog
        open={Boolean(logic.deleteTarget)}
        onOpenChange={(open) => !open && logic.closeDeleteDialog()}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除角色</AlertDialogTitle>
            <AlertDialogDescription>确认删除这个角色吗？</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3">
            {logic.deleteTarget ? (
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                {logic.deleteTarget.name} / {logic.deleteTarget.code}
              </div>
            ) : null}

            {logic.deleteError ? (
              <Alert variant="destructive">
                <AlertTitle>删除失败</AlertTitle>
                <AlertDescription>{logic.deleteError}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={logic.isDeleting}>取消</AlertDialogCancel>
            {logic.canDeleteRole ? (
              <AlertDialogAction
                variant="destructive"
                onClick={(event) => {
                  event.preventDefault()
                  void logic.confirmDelete()
                }}
                disabled={logic.isDeleting}
              >
                {logic.isDeleting ? "删除中..." : "删除"}
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
