"use client"

import * as React from "react"
import { CreditCard, Pencil, Plus, RotateCw, Trash } from "lucide-react"

import {
  useProductFundLimitsLogic,
  type FundLimitFormValues,
} from "@/app/(admin)/product/fund-limits/use-product-fund-limits-logic"
import { PermissionDenied } from "@/components/permission-denied"
import type { FundLimitPublic } from "@/api/generated/workspace.schemas"
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

function LoadingState() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[1.5fr_1fr_1fr_0.5fr_1fr_0.5fr] gap-3 rounded-xl border border-border/50 bg-muted/20 p-4"
        >
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

function FundLimitEditorDialog({
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
  form: FundLimitFormValues
  error: string | null
  isSubmitting: boolean
  canSubmit: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof FundLimitFormValues, value: string) => void
  onSubmit: () => void
}) {
  const nameInvalid = Boolean(error) && !form.name.trim()
  const limitTypeInvalid = Boolean(error) && !form.limit_type.trim()
  const isCreate = mode === "create"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? "新建资金限制" : "编辑资金限制"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "填写新资金限制的基本信息。" : "修改资金限制信息后保存。"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>保存失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Field data-invalid={nameInvalid || undefined}>
            <FieldLabel htmlFor="fund-limit-name">
              名称
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="fund-limit-name"
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="例如：每日充值上限"
              aria-invalid={nameInvalid || undefined}
              disabled={isSubmitting}
            />
          </Field>

          <Field data-invalid={limitTypeInvalid || undefined}>
            <FieldLabel htmlFor="fund-limit-type">
              限制类型
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="fund-limit-type"
              value={form.limit_type}
              onChange={(event) => onFieldChange("limit_type", event.target.value)}
              placeholder="例如：DAILY / SINGLE"
              aria-invalid={limitTypeInvalid || undefined}
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="fund-limit-amount">限制金额</FieldLabel>
            <Input
              id="fund-limit-amount"
              type="number"
              value={form.amount}
              onChange={(event) => onFieldChange("amount", event.target.value)}
              placeholder="例如：1000"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="fund-limit-is-active">状态</FieldLabel>
            <Select
              value={form.is_active}
              onValueChange={(value) => onFieldChange("is_active", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="fund-limit-is-active">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">启用</SelectItem>
                <SelectItem value="false">停用</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="fund-limit-description">说明</FieldLabel>
            <Textarea
              id="fund-limit-description"
              value={form.description}
              onChange={(event) => onFieldChange("description", event.target.value)}
              placeholder="可选说明信息"
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
              {isSubmitting ? "保存中..." : isCreate ? "创建资金限制" : "保存修改"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function FundLimitsView() {
  const logic = useProductFundLimitsLogic()

  if (!logic.canRead) {
    return (
      <PermissionDenied description="当前账号缺少 `product.fund_limit.read`，暂时无法查看资金限制页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">资金限制</h1>
          <p className="text-sm text-muted-foreground">管理门店资金充值及消费的限制规则。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.fundLimitsQuery.refetch()}
            disabled={logic.fundLimitsQuery.isFetching}
            className="h-9"
          >
            <RotateCw
              data-icon="inline-start"
              className={cn(logic.fundLimitsQuery.isFetching && "animate-spin")}
            />
            刷新
          </Button>
          {logic.canCreate ? (
            <Button onClick={logic.openCreateDialog} size="sm" className="h-9">
              <Plus data-icon="inline-start" />
              新建资金限制
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {logic.fundLimitsQuery.isLoading ? (
            <LoadingState />
          ) : logic.fundLimitsQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>
                  {logic.fundLimitsQuery.error instanceof Error
                    ? logic.fundLimitsQuery.error.message
                    : "暂时无法获取资金限制列表。"}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void logic.fundLimitsQuery.refetch()}
                  disabled={logic.fundLimitsQuery.isFetching}
                >
                  <RotateCw
                    data-icon="inline-start"
                    className={cn(logic.fundLimitsQuery.isFetching && "animate-spin")}
                  />
                  重试
                </Button>
              </div>
            </div>
          ) : logic.fundLimits.length === 0 ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <EmptyTitle>还没有资金限制</EmptyTitle>
                <EmptyDescription>
                  使用右上角"新建资金限制"按钮创建第一条资金限制规则。
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4">名称</TableHead>
                    <TableHead className="h-10">限制类型</TableHead>
                    <TableHead className="h-10">限制金额</TableHead>
                    <TableHead className="h-10">状态</TableHead>
                    <TableHead className="h-10">说明</TableHead>
                    <TableHead className="h-10 pr-4 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.fundLimits.map((item: FundLimitPublic) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="pl-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4 text-muted-foreground" />
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.limit_type}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.amount ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.is_active ? "default" : "secondary"}
                          className="h-5 px-1.5 text-[10px] font-medium"
                        >
                          {item.is_active ? "启用" : "停用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {item.description ?? "-"}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          {logic.canUpdate ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => logic.openEditDialog(item)}
                              title="编辑资金限制"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {logic.canDelete ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => logic.requestDelete(item)}
                              title="删除资金限制"
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

      <FundLimitEditorDialog
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
            <AlertDialogTitle>删除资金限制</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除这条资金限制吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3">
            {logic.deleteTarget ? (
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                {logic.deleteTarget.name}
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
