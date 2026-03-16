"use client"

import * as React from "react"
import { Warehouse, Pencil, Trash, Plus, RotateCw } from "lucide-react"

import {
  useInventoryWarehousesLogic,
  type WarehouseFormValues,
  type WarehouseFormError,
} from "@/app/(admin)/inventory/warehouses/use-inventory-warehouses-logic"
import { PermissionDenied } from "@/components/permission-denied"
import type { WarehousePublic } from "@/api/generated/workspace.schemas"
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
import { Card, CardContent } from "@workspace/ui/components/card"
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
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Textarea } from "@workspace/ui/components/textarea"

const WAREHOUSE_TYPE_LABELS: Record<string, string> = {
  MAIN: "主仓",
  TRANSIT: "中转仓",
  RETURNED: "退货仓",
}

function getWarehouseTypeLabel(warehouseType?: string | null): string {
  if (!warehouseType) return "-"

  return WAREHOUSE_TYPE_LABELS[warehouseType] ?? warehouseType
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_1fr_0.5fr_0.5fr_1fr_1fr_0.5fr] gap-3 rounded-xl border border-border/50 bg-muted/20 p-4"
        >
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

function WarehouseEditorDialog({
  open,
  mode,
  form,
  error,
  isSubmitting,
  canSubmit,
  onOpenChange,
  onFieldChange,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  form: WarehouseFormValues
  error: WarehouseFormError | null
  isSubmitting: boolean
  canSubmit: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof WarehouseFormValues, value: string) => void
  onSubmit: () => void
}) {
  const codeInvalid = error?.type === "field" && error.field === "code"
  const nameInvalid = error?.type === "field" && error.field === "name"
  const codeExistsError = error?.type === "code_exists"
  const genericError = error?.type === "generic" ? error.message : null
  const isCreate = mode === "create"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? "新建仓库" : "编辑仓库"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "填写新仓库的基本信息。" : "修改仓库信息后保存。"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {genericError ? (
            <Alert variant="destructive">
              <AlertTitle>保存失败</AlertTitle>
              <AlertDescription>{genericError}</AlertDescription>
            </Alert>
          ) : null}

          <Field data-invalid={codeInvalid || codeExistsError || undefined}>
            <FieldLabel htmlFor="warehouse-code">
              仓库编码
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="warehouse-code"
              value={form.code}
              onChange={(event) => onFieldChange("code", event.target.value)}
              placeholder="例如：WH001"
              aria-invalid={codeInvalid || codeExistsError || undefined}
              disabled={isSubmitting}
            />
            {codeInvalid ? (
              <p className="text-sm text-destructive">{error?.type === "field" ? error.message : ""}</p>
            ) : codeExistsError ? (
              <p className="text-sm text-destructive">仓库编码已存在，请使用其他编码。</p>
            ) : null}
          </Field>

          <Field data-invalid={nameInvalid || undefined}>
            <FieldLabel htmlFor="warehouse-name">
              仓库名称
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="warehouse-name"
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="例如：主仓库"
              aria-invalid={nameInvalid || undefined}
              disabled={isSubmitting}
            />
            {nameInvalid ? (
              <p className="text-sm text-destructive">{error?.type === "field" ? error.message : ""}</p>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="warehouse-type">仓库类型</FieldLabel>
            <Select
              value={form.warehouse_type}
              onValueChange={(value) => onFieldChange("warehouse_type", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="warehouse-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAIN">主仓</SelectItem>
                <SelectItem value="TRANSIT">中转仓</SelectItem>
                <SelectItem value="RETURNED">退货仓</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="warehouse-is-active">状态</FieldLabel>
            <Select
              value={form.is_active}
              onValueChange={(value) => onFieldChange("is_active", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="warehouse-is-active">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">启用</SelectItem>
                <SelectItem value="false">停用</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="warehouse-address">地址</FieldLabel>
            <Input
              id="warehouse-address"
              value={form.address}
              onChange={(event) => onFieldChange("address", event.target.value)}
              placeholder="仓库地址（可选）"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="warehouse-remark">备注</FieldLabel>
            <Textarea
              id="warehouse-remark"
              value={form.remark}
              onChange={(event) => onFieldChange("remark", event.target.value)}
              placeholder="备注信息（可选）"
              disabled={isSubmitting}
              rows={3}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          {canSubmit ? (
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : isCreate ? "创建仓库" : "保存修改"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function WarehousesView() {
  const logic = useInventoryWarehousesLogic()

  if (!logic.canRead) {
    return (
      <PermissionDenied description="当前账号缺少 `inventory.warehouse.read`，暂时无法查看仓库页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">仓库管理</h1>
          <p className="text-sm text-muted-foreground">管理门店仓库信息。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.warehousesQuery.refetch()}
            disabled={logic.warehousesQuery.isFetching}
            className="h-9"
          >
            <RotateCw
              data-icon="inline-start"
              className={cn(logic.warehousesQuery.isFetching && "animate-spin")}
            />
            刷新
          </Button>
          {logic.canCreate ? (
            <Button onClick={logic.openCreateDialog} size="sm" className="h-9">
              <Plus data-icon="inline-start" />
              新建仓库
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {logic.warehousesQuery.isLoading ? (
            <LoadingState />
          ) : logic.warehousesQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>
                  {logic.warehousesQuery.error instanceof Error
                    ? logic.warehousesQuery.error.message
                    : "暂时无法获取仓库列表。"}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void logic.warehousesQuery.refetch()}
                  disabled={logic.warehousesQuery.isFetching}
                >
                  <RotateCw
                    data-icon="inline-start"
                    className={cn(logic.warehousesQuery.isFetching && "animate-spin")}
                  />
                  重试
                </Button>
              </div>
            </div>
          ) : logic.warehouses.length === 0 ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <EmptyTitle>还没有仓库</EmptyTitle>
                <EmptyDescription>使用右上角"新建仓库"按钮创建第一个仓库。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4">仓库编码</TableHead>
                    <TableHead className="h-10">仓库名称</TableHead>
                    <TableHead className="h-10">仓库类型</TableHead>
                    <TableHead className="h-10">状态</TableHead>
                    <TableHead className="h-10">地址</TableHead>
                    <TableHead className="h-10">备注</TableHead>
                    <TableHead className="h-10 pr-4 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.warehouses.map((warehouse: WarehousePublic) => (
                    <TableRow key={warehouse.id} className="hover:bg-muted/30">
                      <TableCell className="pl-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Warehouse className="size-4 text-muted-foreground" />
                          {warehouse.code}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {warehouse.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getWarehouseTypeLabel(warehouse.warehouse_type)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={warehouse.is_active ? "default" : "secondary"}
                          className="h-5 px-1.5 text-[10px] font-medium"
                        >
                          {warehouse.is_active ? "启用" : "停用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                        {warehouse.address ?? "-"}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                        {warehouse.remark ?? "-"}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          {logic.canUpdate ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => logic.openEditDialog(warehouse)}
                              title="编辑仓库"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {logic.canDelete ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => logic.requestDelete(warehouse)}
                              title="删除仓库"
                            >
                              <Trash className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <WarehouseEditorDialog
        open={logic.dialogOpen}
        mode={logic.dialogMode}
        form={logic.form}
        error={logic.formError}
        isSubmitting={logic.isSubmitting}
        canSubmit={logic.dialogMode === "create" ? logic.canCreate : logic.canUpdate}
        onOpenChange={(open) => {
          if (!open) logic.closeDialog()
        }}
        onFieldChange={logic.setField}
        onSubmit={() => void logic.submitForm()}
      />

      <AlertDialog
        open={Boolean(logic.deleteTarget)}
        onOpenChange={(open) => !open && logic.closeDeleteDialog()}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除仓库</AlertDialogTitle>
            <AlertDialogDescription>确认删除这个仓库吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3">
            {logic.deleteTarget ? (
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                <span className="font-medium">{logic.deleteTarget.code}</span>
                <span className="ml-2 text-muted-foreground">{logic.deleteTarget.name}</span>
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
            {logic.canDelete ? (
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
