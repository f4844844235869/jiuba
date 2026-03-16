"use client"

import * as React from "react"
import { ArrowDownToLine, ArrowUpFromLine, ClipboardList, Plus, RotateCw } from "lucide-react"

import {
  useInventoryTransactionsLogic,
  type TransactionFormValues,
} from "@/app/(admin)/inventory/transactions/use-inventory-transactions-logic"
import { PermissionDenied } from "@/components/permission-denied"
import type { InventoryTransactionPublic } from "@/api/generated/workspace.schemas"
import { cn } from "@workspace/ui/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
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

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  IN: "入库",
  OUT: "出库",
  ADJUST: "盘点",
  TRANSFER_IN: "调拨入库",
  TRANSFER_OUT: "调拨出库",
}

const TRANSACTION_TYPE_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  IN: "default",
  OUT: "destructive",
  ADJUST: "secondary",
  TRANSFER_IN: "default",
  TRANSFER_OUT: "destructive",
}

function TransactionTypeBadge({ type }: { type: string }) {
  return (
    <Badge
      variant={TRANSACTION_TYPE_VARIANTS[type] ?? "outline"}
      className="h-5 px-1.5 text-[10px] font-medium"
    >
      {TRANSACTION_TYPE_LABELS[type] ?? type}
    </Badge>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[1.5fr_0.8fr_0.6fr_0.6fr_0.6fr_1fr_1fr_1fr] gap-3 rounded-xl border border-border/50 bg-muted/20 p-4"
        >
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
      ))}
    </div>
  )
}

function TransactionCreateDialog({
  open,
  form,
  error,
  isSubmitting,
  canSubmit,
  onOpenChange,
  onFieldChange,
  onSubmit,
}: {
  open: boolean
  form: TransactionFormValues
  error: string | null
  isSubmitting: boolean
  canSubmit: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof TransactionFormValues, value: string) => void
  onSubmit: () => void
}) {
  const skuInvalid = Boolean(error) && !form.sku_id.trim()
  const quantityInvalid =
    Boolean(error) && (!form.quantity.trim() || isNaN(Number(form.quantity)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>录入库存变动</DialogTitle>
          <DialogDescription>手动录入一条库存流水记录。</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>录入失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Field data-invalid={skuInvalid || undefined}>
            <FieldLabel htmlFor="txn-sku-id">
              SKU ID
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="txn-sku-id"
              value={form.sku_id}
              onChange={(event) => onFieldChange("sku_id", event.target.value)}
              placeholder="请输入 SKU ID"
              aria-invalid={skuInvalid || undefined}
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="txn-type">
              流水类型
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Select
              value={form.transaction_type}
              onValueChange={(value) => onFieldChange("transaction_type", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="txn-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">入库</SelectItem>
                <SelectItem value="OUT">出库</SelectItem>
                <SelectItem value="ADJUST">盘点</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field data-invalid={quantityInvalid || undefined}>
            <FieldLabel htmlFor="txn-quantity">
              变动数量
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="txn-quantity"
              type="number"
              value={form.quantity}
              onChange={(event) => onFieldChange("quantity", event.target.value)}
              placeholder="正数为增加，负数为减少"
              aria-invalid={quantityInvalid || undefined}
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="txn-remark">备注</FieldLabel>
            <Textarea
              id="txn-remark"
              value={form.remark}
              onChange={(event) => onFieldChange("remark", event.target.value)}
              placeholder="可选备注"
              rows={3}
              disabled={isSubmitting}
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
              {isSubmitting ? "录入中..." : "确认录入"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return value
  }
}

export function TransactionsView() {
  const logic = useInventoryTransactionsLogic()

  if (!logic.canRead) {
    return (
      <PermissionDenied description="当前账号缺少 `inventory.transaction.read`，暂时无法查看库存流水页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">库存流水</h1>
          <p className="text-sm text-muted-foreground">查看并录入仓库库存变动记录。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.transactionsQuery.refetch()}
            disabled={!logic.selectedWarehouseId || logic.transactionsQuery.isFetching}
            className="h-9"
          >
            <RotateCw
              data-icon="inline-start"
              className={cn(logic.transactionsQuery.isFetching && "animate-spin")}
            />
            刷新
          </Button>
          {logic.canCreate ? (
            <Button
              onClick={logic.openCreateDialog}
              size="sm"
              className="h-9"
              disabled={!logic.selectedWarehouseId}
            >
              <Plus data-icon="inline-start" />
              录入变动
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="shrink-0 text-sm font-medium text-muted-foreground">选择仓库</span>
        {logic.canReadWarehouse ? (
          <Select
            value={logic.selectedWarehouseId || "__none__"}
            onValueChange={(value) =>
              logic.setSelectedWarehouseId(value === "__none__" ? "" : value)
            }
            disabled={logic.warehousesQuery.isLoading}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="请选择仓库..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" disabled>
                请选择仓库...
              </SelectItem>
              {logic.warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                  {warehouse.code ? (
                    <span className="ml-1 text-muted-foreground">({warehouse.code})</span>
                  ) : null}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground">无仓库查看权限</span>
        )}
      </div>

      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {!logic.selectedWarehouseId ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <EmptyTitle>请先选择仓库</EmptyTitle>
                <EmptyDescription>选择一个仓库以查看其库存流水记录。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : logic.transactionsQuery.isLoading ? (
            <LoadingState />
          ) : logic.transactionsQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>
                  {logic.transactionsQuery.error instanceof Error
                    ? logic.transactionsQuery.error.message
                    : "暂时无法获取库存流水列表。"}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void logic.transactionsQuery.refetch()}
                  disabled={logic.transactionsQuery.isFetching}
                >
                  <RotateCw
                    data-icon="inline-start"
                    className={cn(logic.transactionsQuery.isFetching && "animate-spin")}
                  />
                  重试
                </Button>
              </div>
            </div>
          ) : logic.transactions.length === 0 ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <EmptyTitle>暂无流水记录</EmptyTitle>
                <EmptyDescription>
                  该仓库还没有库存流水记录。使用右上角"录入变动"按钮手动新增。
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4">SKU ID</TableHead>
                    <TableHead className="h-10">流水类型</TableHead>
                    <TableHead className="h-10 text-right">变动数量</TableHead>
                    <TableHead className="h-10 text-right">变动前</TableHead>
                    <TableHead className="h-10 text-right">变动后</TableHead>
                    <TableHead className="h-10">备注</TableHead>
                    <TableHead className="h-10">操作人</TableHead>
                    <TableHead className="h-10 pr-4">时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.transactions.map((txn: InventoryTransactionPublic) => (
                    <TableRow key={txn.id} className="hover:bg-muted/30">
                      <TableCell className="pl-4 font-mono text-sm font-medium text-foreground">
                        {txn.sku_id}
                      </TableCell>
                      <TableCell>
                        <TransactionTypeBadge type={txn.transaction_type} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span
                          className={cn(
                            txn.transaction_type === "OUT" || txn.transaction_type === "TRANSFER_OUT"
                              ? "text-destructive"
                              : txn.transaction_type === "IN" ||
                                  txn.transaction_type === "TRANSFER_IN"
                                ? "text-green-600 dark:text-green-400"
                                : "text-foreground"
                          )}
                        >
                          {txn.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {txn.quantity_before ?? "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {txn.quantity_after ?? "-"}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                        {txn.remark ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {txn.operator_id ?? "-"}
                      </TableCell>
                      <TableCell className="pr-4 text-sm text-muted-foreground">
                        {formatDateTime(txn.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionCreateDialog
        open={logic.dialogOpen}
        form={logic.form}
        error={logic.formError}
        isSubmitting={logic.isSubmitting}
        canSubmit={logic.canCreate}
        onOpenChange={(open) => {
          if (!open) logic.closeDialog()
        }}
        onFieldChange={logic.setField}
        onSubmit={() => void logic.submitForm()}
      />
    </div>
  )
}
