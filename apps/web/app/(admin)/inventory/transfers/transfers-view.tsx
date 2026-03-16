"use client"

import * as React from "react"
import { ArrowLeftRight, Plus, RotateCw } from "lucide-react"

import {
  useInventoryTransfersLogic,
  type TransferFormValues,
} from "@/app/(admin)/inventory/transfers/use-inventory-transfers-logic"
import { PermissionDenied } from "@/components/permission-denied"
import type { TransferOrderPublic, WarehousePublic } from "@/api/generated/workspace.schemas"
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

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "outline" | "default" | "secondary" | "destructive" }
> = {
  DRAFT: { label: "草稿", variant: "outline" },
  CONFIRMED: { label: "已确认", variant: "default" },
  COMPLETED: { label: "已完成", variant: "secondary" },
  CANCELLED: { label: "已取消", variant: "destructive" },
}

const STATUS_UPDATE_LABELS: Record<string, string> = {
  CONFIRMED: "确认",
  COMPLETED: "完成",
  CANCELLED: "取消",
}

function getStatusConfig(status?: string | null) {
  if (!status) return { label: "-", variant: "outline" as const }
  return STATUS_CONFIG[status] ?? { label: status, variant: "outline" as const }
}

function getAvailableStatusTransitions(status?: string | null): string[] {
  switch (status) {
    case "DRAFT":
      return ["CONFIRMED", "CANCELLED"]
    case "CONFIRMED":
      return ["COMPLETED", "CANCELLED"]
    default:
      return []
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[1.5fr_1fr_1fr_0.5fr_1fr_1fr_0.8fr] gap-3 rounded-xl border border-border/50 bg-muted/20 p-4"
        >
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  )
}

function TransferCreateDialog({
  open,
  form,
  error,
  warehouses,
  isSubmitting,
  canSubmit,
  onOpenChange,
  onFieldChange,
  onSubmit,
}: {
  open: boolean
  form: TransferFormValues
  error: string | null
  warehouses: WarehousePublic[]
  isSubmitting: boolean
  canSubmit: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof TransferFormValues, value: string) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建调拨单</DialogTitle>
          <DialogDescription>填写调拨单基本信息。</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>创建失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Field>
            <FieldLabel htmlFor="transfer-no">
              调拨单号
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="transfer-no"
              value={form.transfer_no}
              onChange={(event) => onFieldChange("transfer_no", event.target.value)}
              placeholder="例如：TF20240001"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="transfer-from-warehouse">
              调出仓库
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Select
              value={form.from_warehouse_id || "__none__"}
              onValueChange={(value) =>
                onFieldChange("from_warehouse_id", value === "__none__" ? "" : value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="transfer-from-warehouse">
                <SelectValue placeholder="请选择调出仓库" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" disabled>
                  请选择调出仓库
                </SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="transfer-to-warehouse">
              调入仓库
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Select
              value={form.to_warehouse_id || "__none__"}
              onValueChange={(value) =>
                onFieldChange("to_warehouse_id", value === "__none__" ? "" : value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="transfer-to-warehouse">
                <SelectValue placeholder="请选择调入仓库" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" disabled>
                  请选择调入仓库
                </SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="transfer-remark">备注</FieldLabel>
            <Textarea
              id="transfer-remark"
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
              {isSubmitting ? "创建中..." : "创建调拨单"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TransfersView() {
  const logic = useInventoryTransfersLogic()

  if (!logic.canRead) {
    return (
      <PermissionDenied description="当前账号缺少 `inventory.transfer.read`，暂时无法查看调拨单页面。" />
    )
  }

  const { statusUpdateTarget } = logic

  const statusUpdateLabel = statusUpdateTarget
    ? STATUS_UPDATE_LABELS[statusUpdateTarget.newStatus] ?? statusUpdateTarget.newStatus
    : ""

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">库存调拨</h1>
          <p className="text-sm text-muted-foreground">管理仓库间的库存调拨单。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.transfersQuery.refetch()}
            disabled={logic.transfersQuery.isFetching}
            className="h-9"
          >
            <RotateCw
              data-icon="inline-start"
              className={cn(logic.transfersQuery.isFetching && "animate-spin")}
            />
            刷新
          </Button>
          {logic.canCreate ? (
            <Button onClick={logic.openCreateDialog} size="sm" className="h-9">
              <Plus data-icon="inline-start" />
              创建调拨单
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {logic.transfersQuery.isLoading ? (
            <LoadingState />
          ) : logic.transfersQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>
                  {logic.transfersQuery.error instanceof Error
                    ? logic.transfersQuery.error.message
                    : "暂时无法获取调拨单列表。"}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void logic.transfersQuery.refetch()}
                  disabled={logic.transfersQuery.isFetching}
                >
                  <RotateCw
                    data-icon="inline-start"
                    className={cn(logic.transfersQuery.isFetching && "animate-spin")}
                  />
                  重试
                </Button>
              </div>
            </div>
          ) : logic.transfers.length === 0 ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <EmptyTitle>还没有调拨单</EmptyTitle>
                <EmptyDescription>
                  使用右上角"创建调拨单"按钮发起第一笔库存调拨。
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4">调拨单号</TableHead>
                    <TableHead className="h-10">调出仓库</TableHead>
                    <TableHead className="h-10">调入仓库</TableHead>
                    <TableHead className="h-10">状态</TableHead>
                    <TableHead className="h-10">备注</TableHead>
                    <TableHead className="h-10">创建时间</TableHead>
                    <TableHead className="h-10 pr-4 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.transfers.map((transfer: TransferOrderPublic) => {
                    const statusCfg = getStatusConfig(transfer.status)
                    const transitions = getAvailableStatusTransitions(transfer.status)

                    return (
                      <TableRow key={transfer.id} className="hover:bg-muted/30">
                        <TableCell className="pl-4 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <ArrowLeftRight className="size-4 text-muted-foreground" />
                            {transfer.transfer_no}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {logic.getWarehouseName(transfer.from_warehouse_id)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {logic.getWarehouseName(transfer.to_warehouse_id)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusCfg.variant}
                            className="h-5 px-1.5 text-[10px] font-medium"
                          >
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
                          {transfer.remark ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(transfer.created_at)}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          {logic.canUpdate && transitions.length > 0 ? (
                            <div className="flex justify-end gap-1">
                              {transitions.map((newStatus) => (
                                <Button
                                  key={newStatus}
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-7 px-2 text-xs",
                                    newStatus === "CANCELLED"
                                      ? "text-muted-foreground hover:text-destructive"
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                  onClick={() =>
                                    logic.requestStatusUpdate(transfer, newStatus)
                                  }
                                >
                                  {STATUS_UPDATE_LABELS[newStatus] ?? newStatus}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TransferCreateDialog
        open={logic.createDialogOpen}
        form={logic.form}
        error={logic.formError}
        warehouses={logic.warehouses}
        isSubmitting={logic.isSubmitting}
        canSubmit={logic.canCreate}
        onOpenChange={(open) => {
          if (!open) logic.closeCreateDialog()
        }}
        onFieldChange={logic.setField}
        onSubmit={() => void logic.submitForm()}
      />

      <AlertDialog
        open={Boolean(logic.statusUpdateTarget)}
        onOpenChange={(open) => !open && logic.closeStatusUpdateDialog()}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>更新调拨单状态</AlertDialogTitle>
            <AlertDialogDescription>
              确认将调拨单状态更新为「{statusUpdateLabel}」吗？
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3">
            {statusUpdateTarget ? (
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                <span className="font-medium">{statusUpdateTarget.transfer.transfer_no}</span>
              </div>
            ) : null}

            {logic.statusUpdateError ? (
              <Alert variant="destructive">
                <AlertTitle>更新失败</AlertTitle>
                <AlertDescription>{logic.statusUpdateError}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={logic.isUpdatingStatus}>取消</AlertDialogCancel>
            {logic.canUpdate ? (
              <AlertDialogAction
                variant={
                  statusUpdateTarget?.newStatus === "CANCELLED" ? "destructive" : "default"
                }
                onClick={(event) => {
                  event.preventDefault()
                  void logic.confirmStatusUpdate()
                }}
                disabled={logic.isUpdatingStatus}
              >
                {logic.isUpdatingStatus ? "更新中..." : `确认${statusUpdateLabel}`}
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
