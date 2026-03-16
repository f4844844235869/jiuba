"use client"

import * as React from "react"
import { Plus, RotateCw } from "lucide-react"

import {
  usePOSShiftsLogic,
  type CreateShiftFormValues,
  type UpdateShiftFormValues,
} from "@/app/(admin)/pos/shifts/use-pos-shifts-logic"
import { PermissionDenied } from "@/components/permission-denied"
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

const SHIFT_TYPE_MAP: Record<string, string> = {
  MORNING: "早班",
  AFTERNOON: "下午班",
  NIGHT: "晚班",
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_0.5fr] gap-3 rounded-xl border border-border/50 bg-muted/20 p-4"
        >
          {Array.from({ length: 9 }).map((__, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

function CreateShiftDialog({
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
  form: CreateShiftFormValues
  error: string | null
  isSubmitting: boolean
  canSubmit: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof CreateShiftFormValues, value: string) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>开班</DialogTitle>
          <DialogDescription>填写本班次基本信息。</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>开班失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Field>
            <FieldLabel htmlFor="shift-date">
              班次日期
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="shift-date"
              type="datetime-local"
              value={form.shift_date}
              onChange={(e) => onFieldChange("shift_date", e.target.value)}
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="shift-type">班次类型</FieldLabel>
            <Select
              value={form.shift_type}
              onValueChange={(value) => onFieldChange("shift_type", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="shift-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MORNING">早班</SelectItem>
                <SelectItem value="AFTERNOON">下午班</SelectItem>
                <SelectItem value="NIGHT">晚班</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="create-cash-amount">现金金额</FieldLabel>
            <Input
              id="create-cash-amount"
              type="number"
              value={form.cash_amount}
              onChange={(e) => onFieldChange("cash_amount", e.target.value)}
              placeholder="0"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="create-remark">备注</FieldLabel>
            <Input
              id="create-remark"
              value={form.remark}
              onChange={(e) => onFieldChange("remark", e.target.value)}
              placeholder="可选备注"
              disabled={isSubmitting}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            取消
          </Button>
          {canSubmit ? (
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? "开班中..." : "确认开班"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UpdateShiftDialog({
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
  form: UpdateShiftFormValues
  error: string | null
  isSubmitting: boolean
  canSubmit: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof UpdateShiftFormValues, value: string) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>结班</DialogTitle>
          <DialogDescription>填写本班次结算信息，提交后状态将变为已结班。</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>结班失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Field>
            <FieldLabel htmlFor="update-cash-amount">现金金额</FieldLabel>
            <Input
              id="update-cash-amount"
              type="number"
              value={form.cash_amount}
              onChange={(e) => onFieldChange("cash_amount", e.target.value)}
              placeholder="0"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="update-total-sales">总销售额</FieldLabel>
            <Input
              id="update-total-sales"
              type="number"
              value={form.total_sales}
              onChange={(e) => onFieldChange("total_sales", e.target.value)}
              placeholder="0"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="update-order-count">订单数</FieldLabel>
            <Input
              id="update-order-count"
              type="number"
              value={form.order_count}
              onChange={(e) => onFieldChange("order_count", e.target.value)}
              placeholder="0"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="update-remark">备注</FieldLabel>
            <Input
              id="update-remark"
              value={form.remark}
              onChange={(e) => onFieldChange("remark", e.target.value)}
              placeholder="可选备注"
              disabled={isSubmitting}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            取消
          </Button>
          {canSubmit ? (
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? "结班中..." : "确认结班"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ShiftsView() {
  const logic = usePOSShiftsLogic()

  if (!logic.canRead) {
    return (
      <PermissionDenied description="当前账号缺少 `pos.shift.read`，暂时无法查看交接班管理页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">交接班管理</h1>
          <p className="text-sm text-muted-foreground">管理 POS 班次开班与结班记录。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.shiftsQuery.refetch()}
            disabled={logic.shiftsQuery.isFetching}
            className="h-9"
          >
            <RotateCw
              data-icon="inline-start"
              className={cn(logic.shiftsQuery.isFetching && "animate-spin")}
            />
            刷新
          </Button>
          {logic.canCreate ? (
            <Button onClick={logic.openCreateDialog} size="sm" className="h-9">
              <Plus data-icon="inline-start" />
              开班
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {logic.shiftsQuery.isLoading ? (
            <LoadingState />
          ) : logic.shiftsQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>
                  {logic.shiftsQuery.error instanceof Error
                    ? logic.shiftsQuery.error.message
                    : "暂时无法获取班次列表。"}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void logic.shiftsQuery.refetch()}
                  disabled={logic.shiftsQuery.isFetching}
                >
                  <RotateCw
                    data-icon="inline-start"
                    className={cn(logic.shiftsQuery.isFetching && "animate-spin")}
                  />
                  重试
                </Button>
              </div>
            </div>
          ) : logic.shifts.length === 0 ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <EmptyTitle>还没有班次记录</EmptyTitle>
                <EmptyDescription>使用右上角"开班"按钮创建第一条班次记录。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4">班次日期</TableHead>
                    <TableHead className="h-10">班次类型</TableHead>
                    <TableHead className="h-10">当班人员ID</TableHead>
                    <TableHead className="h-10">现金金额</TableHead>
                    <TableHead className="h-10">总销售额</TableHead>
                    <TableHead className="h-10">订单数</TableHead>
                    <TableHead className="h-10">状态</TableHead>
                    <TableHead className="h-10">备注</TableHead>
                    <TableHead className="h-10 pr-4 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.shifts.map((shift) => (
                    <TableRow key={shift.id} className="hover:bg-muted/30">
                      <TableCell className="pl-4 font-medium text-foreground">
                        {shift.shift_date
                          ? new Date(shift.shift_date).toLocaleString("zh-CN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {shift.shift_type ? (SHIFT_TYPE_MAP[shift.shift_type] ?? shift.shift_type) : "-"}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm text-muted-foreground" title={shift.operator_id}>
                        {shift.operator_id}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {shift.cash_amount ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {shift.total_sales ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {shift.order_count ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={shift.status === "CLOSED" ? "secondary" : "default"}
                          className="h-5 px-1.5 text-[10px] font-medium"
                        >
                          {shift.status === "CLOSED" ? "已结班" : "营业中"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm text-muted-foreground">
                        {shift.remark ?? "-"}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        {logic.canUpdate && shift.status !== "CLOSED" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => logic.openUpdateDialog(shift)}
                          >
                            结班
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateShiftDialog
        open={logic.createDialogOpen}
        form={logic.createForm}
        error={logic.createError}
        isSubmitting={logic.isCreating}
        canSubmit={logic.canCreate}
        onOpenChange={(open) => { if (!open) logic.closeCreateDialog() }}
        onFieldChange={logic.setCreateField}
        onSubmit={() => void logic.submitCreate()}
      />

      <UpdateShiftDialog
        open={Boolean(logic.editingShift)}
        form={logic.updateForm}
        error={logic.updateError}
        isSubmitting={logic.isUpdating}
        canSubmit={logic.canUpdate}
        onOpenChange={(open) => { if (!open) logic.closeUpdateDialog() }}
        onFieldChange={logic.setUpdateField}
        onSubmit={() => void logic.submitUpdate()}
      />
    </div>
  )
}
