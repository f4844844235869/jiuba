"use client"

import * as React from "react"
import { Gift, Pencil, Plus, RotateCw, Trash } from "lucide-react"

import {
  useProductGiftTemplatesLogic,
  type GiftTemplateFormValues,
} from "@/app/(admin)/product/gift-templates/use-product-gift-templates-logic"
import { PermissionDenied } from "@/components/permission-denied"
import type { GiftTemplatePublic } from "@/api/generated/workspace.schemas"
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

const GIFT_TYPE_LABELS: Record<string, string> = {
  AMOUNT: "金额赠送",
  PRODUCT: "商品赠送",
}

function getGiftTypeLabel(giftType?: string | null) {
  return (giftType && GIFT_TYPE_LABELS[giftType]) ?? giftType ?? "-"
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[1.5fr_1fr_1fr_0.5fr_1.5fr_0.5fr] gap-3 rounded-xl border border-border/50 bg-muted/20 p-4"
        >
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

function GiftTemplateEditorDialog({
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
  form: GiftTemplateFormValues
  error: string | null
  isSubmitting: boolean
  canSubmit: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof GiftTemplateFormValues, value: string) => void
  onSubmit: () => void
}) {
  const nameInvalid = Boolean(error) && !form.name.trim()
  const isCreate = mode === "create"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? "新建赠品模板" : "编辑赠品模板"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "填写新赠品模板的基本信息。" : "修改赠品模板信息后保存。"}
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
            <FieldLabel htmlFor="gift-template-name">
              模板名称
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="gift-template-name"
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="例如：满百赠礼"
              aria-invalid={nameInvalid || undefined}
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="gift-template-gift-type">赠送类型</FieldLabel>
            <Select
              value={form.gift_type}
              onValueChange={(value) => onFieldChange("gift_type", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="gift-template-gift-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AMOUNT">金额赠送</SelectItem>
                <SelectItem value="PRODUCT">商品赠送</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="gift-template-gift-amount">赠送金额</FieldLabel>
            <Input
              id="gift-template-gift-amount"
              type="number"
              value={form.gift_amount}
              onChange={(event) => onFieldChange("gift_amount", event.target.value)}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="gift-template-is-active">状态</FieldLabel>
            <Select
              value={form.is_active}
              onValueChange={(value) => onFieldChange("is_active", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="gift-template-is-active">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">启用</SelectItem>
                <SelectItem value="false">停用</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="gift-template-description">说明</FieldLabel>
            <Textarea
              id="gift-template-description"
              value={form.description}
              onChange={(event) => onFieldChange("description", event.target.value)}
              placeholder="可选，填写模板的使用说明"
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
              {isSubmitting ? "保存中..." : isCreate ? "创建模板" : "保存修改"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function GiftTemplatesView() {
  const logic = useProductGiftTemplatesLogic()

  if (!logic.canRead) {
    return (
      <PermissionDenied description="当前账号缺少 `product.gift_template.read`，暂时无法查看赠品模板页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">赠品模板</h1>
          <p className="text-sm text-muted-foreground">管理赠品模板配置。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.templatesQuery.refetch()}
            disabled={logic.templatesQuery.isFetching}
            className="h-9"
          >
            <RotateCw
              data-icon="inline-start"
              className={cn(logic.templatesQuery.isFetching && "animate-spin")}
            />
            刷新
          </Button>
          {logic.canCreate ? (
            <Button onClick={logic.openCreateDialog} size="sm" className="h-9">
              <Plus data-icon="inline-start" />
              新建模板
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {logic.templatesQuery.isLoading ? (
            <LoadingState />
          ) : logic.templatesQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>
                  {logic.templatesQuery.error instanceof Error
                    ? logic.templatesQuery.error.message
                    : "暂时无法获取赠品模板列表。"}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void logic.templatesQuery.refetch()}
                  disabled={logic.templatesQuery.isFetching}
                >
                  <RotateCw
                    data-icon="inline-start"
                    className={cn(logic.templatesQuery.isFetching && "animate-spin")}
                  />
                  重试
                </Button>
              </div>
            </div>
          ) : logic.templates.length === 0 ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <EmptyTitle>还没有赠品模板</EmptyTitle>
                <EmptyDescription>使用右上角"新建模板"按钮创建第一个赠品模板。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4">模板名称</TableHead>
                    <TableHead className="h-10">赠送类型</TableHead>
                    <TableHead className="h-10">赠送金额</TableHead>
                    <TableHead className="h-10">状态</TableHead>
                    <TableHead className="h-10">说明</TableHead>
                    <TableHead className="h-10 pr-4 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.templates.map((template) => (
                    <TemplateRow
                      key={template.id}
                      template={template}
                      canUpdate={logic.canUpdate}
                      canDelete={logic.canDelete}
                      onEdit={logic.openEditDialog}
                      onDelete={logic.requestDelete}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <GiftTemplateEditorDialog
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
            <AlertDialogTitle>删除赠品模板</AlertDialogTitle>
            <AlertDialogDescription>确认删除这个赠品模板吗？此操作不可撤销。</AlertDialogDescription>
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

function TemplateRow({
  template,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: {
  template: GiftTemplatePublic
  canUpdate: boolean
  canDelete: boolean
  onEdit: (template: GiftTemplatePublic) => void
  onDelete: (template: GiftTemplatePublic) => void
}) {
  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell className="pl-4 font-medium text-foreground">
        <div className="flex items-center gap-2">
          <Gift className="size-4 text-muted-foreground" />
          {template.name}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {getGiftTypeLabel(template.gift_type)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {template.gift_amount != null ? template.gift_amount : "-"}
      </TableCell>
      <TableCell>
        <Badge
          variant={template.is_active ? "default" : "secondary"}
          className="h-5 px-1.5 text-[10px] font-medium"
        >
          {template.is_active ? "启用" : "停用"}
        </Badge>
      </TableCell>
      <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
        {template.description || "-"}
      </TableCell>
      <TableCell className="pr-4 text-right">
        <div className="flex justify-end gap-1">
          {canUpdate ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(template)}
              title="编辑模板"
            >
              <Pencil className="size-4" />
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(template)}
              title="删除模板"
            >
              <Trash className="size-4" />
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}
