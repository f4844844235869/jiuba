"use client"

import * as React from "react"
import { Tag, Pencil, Trash, Plus, RotateCw } from "lucide-react"

import {
  useProductCategoriesLogic,
  type CategoryFormValues,
} from "@/app/(admin)/product/categories/use-product-categories-logic"
import { PermissionDenied } from "@/components/permission-denied"
import type { CategoryPublic } from "@/api/generated/workspace.schemas"
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

function LoadingState() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[1.5fr_1fr_0.5fr_0.5fr_0.5fr] gap-3 rounded-xl border border-border/50 bg-muted/20 p-4"
        >
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

function getCategoryName(categories: CategoryPublic[], parentId?: string | null) {
  if (!parentId) return "-"

  const parent = categories.find((c) => c.id === parentId)

  return parent ? parent.name : "-"
}

function CategoryEditorDialog({
  open,
  mode,
  form,
  error,
  categories,
  editingItem,
  isSubmitting,
  canSubmit,
  onOpenChange,
  onFieldChange,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  form: CategoryFormValues
  error: string | null
  categories: CategoryPublic[]
  editingItem: CategoryPublic | null
  isSubmitting: boolean
  canSubmit: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof CategoryFormValues, value: string) => void
  onSubmit: () => void
}) {
  const nameInvalid = Boolean(error) && !form.name.trim()
  const isCreate = mode === "create"

  const parentOptions = categories.filter((c) => c.id !== editingItem?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? "新建分类" : "编辑分类"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "填写新分类的基本信息。" : "修改分类信息后保存。"}
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
            <FieldLabel htmlFor="category-name">
              分类名称
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="category-name"
              value={form.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="例如：饮品"
              aria-invalid={nameInvalid || undefined}
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="category-parent">父分类</FieldLabel>
            <Select
              value={form.parent_id || "__none__"}
              onValueChange={(value) =>
                onFieldChange("parent_id", value === "__none__" ? "" : value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="category-parent">
                <SelectValue placeholder="无（顶级分类）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">无（顶级分类）</SelectItem>
                {parentOptions.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="category-sort-order">排序</FieldLabel>
            <Input
              id="category-sort-order"
              type="number"
              value={form.sort_order}
              onChange={(event) => onFieldChange("sort_order", event.target.value)}
              placeholder="0"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="category-is-active">状态</FieldLabel>
            <Select
              value={form.is_active}
              onValueChange={(value) => onFieldChange("is_active", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="category-is-active">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">启用</SelectItem>
                <SelectItem value="false">停用</SelectItem>
              </SelectContent>
            </Select>
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
              {isSubmitting ? "保存中..." : isCreate ? "创建分类" : "保存修改"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CategoriesView() {
  const logic = useProductCategoriesLogic()

  if (!logic.canRead) {
    return (
      <PermissionDenied description="当前账号缺少 `product.category.read`，暂时无法查看商品分类页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">商品分类</h1>
          <p className="text-sm text-muted-foreground">管理商品分类层级结构。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.categoriesQuery.refetch()}
            disabled={logic.categoriesQuery.isFetching}
            className="h-9"
          >
            <RotateCw
              data-icon="inline-start"
              className={cn(logic.categoriesQuery.isFetching && "animate-spin")}
            />
            刷新
          </Button>
          {logic.canCreate ? (
            <Button onClick={logic.openCreateDialog} size="sm" className="h-9">
              <Plus data-icon="inline-start" />
              新建分类
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {logic.categoriesQuery.isLoading ? (
            <LoadingState />
          ) : logic.categoriesQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>
                  {logic.categoriesQuery.error instanceof Error
                    ? logic.categoriesQuery.error.message
                    : "暂时无法获取分类列表。"}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void logic.categoriesQuery.refetch()}
                  disabled={logic.categoriesQuery.isFetching}
                >
                  <RotateCw
                    data-icon="inline-start"
                    className={cn(logic.categoriesQuery.isFetching && "animate-spin")}
                  />
                  重试
                </Button>
              </div>
            </div>
          ) : logic.categories.length === 0 ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <EmptyTitle>还没有分类</EmptyTitle>
                <EmptyDescription>使用右上角"新建分类"按钮创建第一个商品分类。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4">分类名称</TableHead>
                    <TableHead className="h-10">父分类</TableHead>
                    <TableHead className="h-10">排序</TableHead>
                    <TableHead className="h-10">状态</TableHead>
                    <TableHead className="h-10 pr-4 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.categories.map((category) => (
                    <TableRow key={category.id} className="hover:bg-muted/30">
                      <TableCell className="pl-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Tag className="size-4 text-muted-foreground" />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getCategoryName(logic.categories, category.parent_id)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {category.sort_order ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={category.is_active ? "default" : "secondary"}
                          className="h-5 px-1.5 text-[10px] font-medium"
                        >
                          {category.is_active ? "启用" : "停用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          {logic.canUpdate ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => logic.openEditDialog(category)}
                              title="编辑分类"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {logic.canDelete ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => logic.requestDelete(category)}
                              title="删除分类"
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

      <CategoryEditorDialog
        open={logic.dialogOpen}
        mode={logic.dialogMode}
        form={logic.form}
        error={logic.formError}
        categories={logic.categories}
        editingItem={logic.editingItem}
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
            <AlertDialogTitle>删除分类</AlertDialogTitle>
            <AlertDialogDescription>确认删除这个分类吗？此操作不可撤销。</AlertDialogDescription>
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
