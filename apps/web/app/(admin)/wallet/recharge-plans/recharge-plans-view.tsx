"use client"

import * as React from "react"
import { CreditCard, Pencil, Plus, RotateCw, Trash } from "lucide-react"

import {
  useWalletRechargePlansLogic,
  type RechargePlanFormValues,
} from "@/app/(admin)/wallet/recharge-plans/use-wallet-recharge-plans-logic"
import { PermissionDenied } from "@/components/permission-denied"
import type { RechargePlanPublic } from "@/api/generated/workspace.schemas"
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
    <div className="flex flex-col gap-2 p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

type RechargePlanDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  form: RechargePlanFormValues
  formError: string | null
  isSubmitting: boolean
  canSubmit: boolean
  onFieldChange: (field: keyof RechargePlanFormValues, value: string) => void
  onSubmit: () => void
}

function RechargePlanDialog({
  open,
  onOpenChange,
  mode,
  form,
  formError,
  isSubmitting,
  canSubmit,
  onFieldChange,
  onSubmit,
}: RechargePlanDialogProps) {
  const isCreate = mode === "create"
  const nameInvalid = formError?.includes("名称")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? "新建充值方案" : "编辑充值方案"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "填写以下信息创建新的充值方案。" : "修改充值方案信息后点击保存。"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <Field data-invalid={nameInvalid || undefined}>
            <FieldLabel htmlFor="recharge-plan-name">
              方案名称
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="recharge-plan-name"
              value={form.name}
              onChange={(e) => onFieldChange("name", e.target.value)}
              placeholder="例如：100元充值方案"
              aria-invalid={nameInvalid || undefined}
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="recharge-plan-recharge-amount">充值金额</FieldLabel>
            <Input
              id="recharge-plan-recharge-amount"
              type="number"
              value={form.recharge_amount}
              onChange={(e) => onFieldChange("recharge_amount", e.target.value)}
              placeholder="例如：100"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="recharge-plan-gift-amount">赠送金额</FieldLabel>
            <Input
              id="recharge-plan-gift-amount"
              type="number"
              value={form.gift_amount}
              onChange={(e) => onFieldChange("gift_amount", e.target.value)}
              placeholder="例如：10"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="recharge-plan-is-active">状态</FieldLabel>
            <Select
              value={form.is_active}
              onValueChange={(value) => onFieldChange("is_active", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="recharge-plan-is-active">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">启用</SelectItem>
                <SelectItem value="false">停用</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="recharge-plan-description">说明</FieldLabel>
            <Textarea
              id="recharge-plan-description"
              value={form.description}
              onChange={(e) => onFieldChange("description", e.target.value)}
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
              {isSubmitting ? "保存中..." : isCreate ? "创建充值方案" : "保存修改"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RechargePlansView() {
  const logic = useWalletRechargePlansLogic()

  if (!logic.canRead) {
    return (
      <PermissionDenied description="当前账号缺少 `wallet.recharge_plan.read`，暂时无法查看充值方案页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">充值方案管理</h1>
          <p className="text-sm text-muted-foreground">管理门店会员充值方案及赠送规则。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.rechargePlansQuery.refetch()}
            disabled={logic.rechargePlansQuery.isFetching}
            className="h-9"
          >
            <RotateCw
              data-icon="inline-start"
              className={cn(logic.rechargePlansQuery.isFetching && "animate-spin")}
            />
            刷新
          </Button>
          {logic.canCreate ? (
            <Button onClick={logic.openCreateDialog} size="sm" className="h-9">
              <Plus data-icon="inline-start" />
              新建充值方案
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {logic.rechargePlansQuery.isLoading ? (
            <LoadingState />
          ) : logic.rechargePlansQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>
                  {logic.rechargePlansQuery.error instanceof Error
                    ? logic.rechargePlansQuery.error.message
                    : "暂时无法获取充值方案列表。"}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void logic.rechargePlansQuery.refetch()}
                  disabled={logic.rechargePlansQuery.isFetching}
                >
                  <RotateCw data-icon="inline-start" />
                  重试
                </Button>
              </div>
            </div>
          ) : logic.rechargePlans.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <CreditCard className="size-8 text-muted-foreground" />
                <EmptyTitle>暂无充值方案</EmptyTitle>
                <EmptyDescription>
                  {logic.canCreate
                    ? "点击右上角"新建充值方案"按钮开始添加。"
                    : "当前没有可用的充值方案。"}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>方案名称</TableHead>
                  <TableHead>充值金额</TableHead>
                  <TableHead>赠送金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>说明</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logic.rechargePlans.map((plan: RechargePlanPublic) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.recharge_amount ?? "—"}</TableCell>
                    <TableCell>{plan.gift_amount ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "启用" : "停用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">
                      {plan.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {logic.canUpdate ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => logic.openEditDialog(plan)}
                          >
                            <Pencil className="size-4" />
                            编辑
                          </Button>
                        ) : null}
                        {logic.canDelete ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => logic.openDeleteDialog(plan)}
                          >
                            <Trash className="size-4" />
                            删除
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <RechargePlanDialog
        open={logic.dialogOpen}
        onOpenChange={(open) => {
          if (!open) logic.closeDialog()
        }}
        mode={logic.dialogMode}
        form={logic.form}
        formError={logic.formError}
        isSubmitting={logic.isSubmitting}
        canSubmit={logic.dialogMode === "create" ? logic.canCreate : logic.canUpdate}
        onFieldChange={logic.setField}
        onSubmit={() => void logic.submitForm()}
      />

      <AlertDialog
        open={!!logic.deleteTarget}
        onOpenChange={(open) => {
          if (!open) logic.closeDeleteDialog()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除充值方案</AlertDialogTitle>
            <AlertDialogDescription>
              即将删除充值方案「{logic.deleteTarget?.name}」，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {logic.deleteError ? (
            <Alert variant="destructive">
              <AlertDescription>{logic.deleteError}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={logic.isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void logic.confirmDelete()}
              disabled={logic.isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {logic.isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
