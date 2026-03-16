"use client"

import * as React from "react"
import {
  Package,
  Pencil,
  Plus,
  RotateCw,
  Trash,
  ToggleLeft,
  ToggleRight,
  ListFilter,
} from "lucide-react"

import {
  useProductProductsLogic,
  type ProductFormValues,
  type SkuFormValues,
} from "@/app/(admin)/product/products/use-product-products-logic"
import { PermissionDenied } from "@/components/permission-denied"
import type { CategoryPublic, ProductPublic, SKUPublic } from "@/api/generated/workspace.schemas"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
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

function LoadingRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
          {Array.from({ length: cols }).map((__, col) => (
            <TableCell key={col}>
              <Skeleton className="h-5 w-full max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function getCategoryName(categories: CategoryPublic[], categoryId?: string | null) {
  if (!categoryId) return "-"

  const category = categories.find((c) => c.id === categoryId)

  return category ? category.name : "-"
}

function ProductEditorDialog({
  open,
  mode,
  form,
  error,
  categories,
  isSubmitting,
  canSubmit,
  onOpenChange,
  onFieldChange,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  form: ProductFormValues
  error: string | null
  categories: CategoryPublic[]
  isSubmitting: boolean
  canSubmit: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof ProductFormValues, value: string) => void
  onSubmit: () => void
}) {
  const isCreate = mode === "create"
  const codeInvalid = Boolean(error) && !form.code.trim()
  const nameInvalid = Boolean(error) && !form.name.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isCreate ? "新建商品" : "编辑商品"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "填写新商品的基本信息。" : "修改商品信息后保存。"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>保存失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={codeInvalid || undefined}>
              <FieldLabel htmlFor="product-code">
                商品编码
                <span className="ml-1 text-destructive">*</span>
              </FieldLabel>
              <Input
                id="product-code"
                value={form.code}
                onChange={(e) => onFieldChange("code", e.target.value)}
                placeholder="例如：P001"
                aria-invalid={codeInvalid || undefined}
                disabled={isSubmitting}
              />
            </Field>

            <Field data-invalid={nameInvalid || undefined}>
              <FieldLabel htmlFor="product-name">
                商品名称
                <span className="ml-1 text-destructive">*</span>
              </FieldLabel>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => onFieldChange("name", e.target.value)}
                placeholder="例如：手工柠檬茶"
                aria-invalid={nameInvalid || undefined}
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="product-category">分类</FieldLabel>
              <Select
                value={form.category_id || "__none__"}
                onValueChange={(value) =>
                  onFieldChange("category_id", value === "__none__" ? "" : value)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="product-category">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">无分类</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="product-unit">计量单位</FieldLabel>
              <Input
                id="product-unit"
                value={form.unit}
                onChange={(e) => onFieldChange("unit", e.target.value)}
                placeholder="例如：杯、件、kg"
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field>
              <FieldLabel htmlFor="product-status">状态</FieldLabel>
              <Select
                value={form.status}
                onValueChange={(value) => onFieldChange("status", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="product-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">启用</SelectItem>
                  <SelectItem value="INACTIVE">停用</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="product-selling-price">销售价</FieldLabel>
              <Input
                id="product-selling-price"
                value={form.selling_price}
                onChange={(e) => onFieldChange("selling_price", e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="product-cost-price">成本价</FieldLabel>
              <Input
                id="product-cost-price"
                value={form.cost_price}
                onChange={(e) => onFieldChange("cost_price", e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="product-description">商品描述</FieldLabel>
            <Textarea
              id="product-description"
              value={form.description}
              onChange={(e) => onFieldChange("description", e.target.value)}
              placeholder="可选描述"
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
              {isSubmitting ? "保存中..." : isCreate ? "创建商品" : "保存修改"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SkuEditorDialog({
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
  form: SkuFormValues
  error: string | null
  isSubmitting: boolean
  canSubmit: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof SkuFormValues, value: string) => void
  onSubmit: () => void
}) {
  const isCreate = mode === "create"
  const skuCodeInvalid = Boolean(error) && !form.sku_code.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? "新建 SKU" : "编辑 SKU"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "填写新 SKU 的基本信息。" : "修改 SKU 信息后保存。"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>保存失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <Field data-invalid={skuCodeInvalid || undefined}>
              <FieldLabel htmlFor="sku-code">
                SKU 编码
                <span className="ml-1 text-destructive">*</span>
              </FieldLabel>
              <Input
                id="sku-code"
                value={form.sku_code}
                onChange={(e) => onFieldChange("sku_code", e.target.value)}
                placeholder="例如：P001-L"
                aria-invalid={skuCodeInvalid || undefined}
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="sku-spec-name">规格名称</FieldLabel>
              <Input
                id="sku-spec-name"
                value={form.spec_name}
                onChange={(e) => onFieldChange("spec_name", e.target.value)}
                placeholder="例如：大杯"
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="sku-barcode">条形码</FieldLabel>
            <Input
              id="sku-barcode"
              value={form.barcode}
              onChange={(e) => onFieldChange("barcode", e.target.value)}
              placeholder="扫描或手动输入"
              disabled={isSubmitting}
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field>
              <FieldLabel htmlFor="sku-price">销售价</FieldLabel>
              <Input
                id="sku-price"
                value={form.price}
                onChange={(e) => onFieldChange("price", e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="sku-cost-price">成本价</FieldLabel>
              <Input
                id="sku-cost-price"
                value={form.cost_price}
                onChange={(e) => onFieldChange("cost_price", e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="sku-is-active">状态</FieldLabel>
              <Select
                value={form.is_active}
                onValueChange={(value) => onFieldChange("is_active", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="sku-is-active">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">启用</SelectItem>
                  <SelectItem value="false">停用</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
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
              {isSubmitting ? "保存中..." : isCreate ? "创建 SKU" : "保存修改"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SkuManagementSheet({
  open,
  selectedProduct,
  skus,
  skusQuery,
  canCreateSku,
  canUpdateSku,
  canDeleteSku,
  onClose,
  onAddSku,
  onEditSku,
  onDeleteSku,
}: {
  open: boolean
  selectedProduct: ProductPublic | null
  skus: SKUPublic[]
  skusQuery: { isLoading: boolean; isError: boolean; error: unknown; isFetching: boolean; refetch: () => void }
  canCreateSku: boolean
  canUpdateSku: boolean
  canDeleteSku: boolean
  onClose: () => void
  onAddSku: () => void
  onEditSku: (sku: SKUPublic) => void
  onDeleteSku: (sku: SKUPublic) => void
}) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="flex flex-col gap-0 sm:max-w-lg" side="right">
        <SheetHeader className="border-b border-border/50 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            SKU 管理
          </SheetTitle>
          <SheetDescription>
            {selectedProduct ? (
              <span>
                商品：
                <span className="font-medium text-foreground">{selectedProduct.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">({selectedProduct.code})</span>
              </span>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void skusQuery.refetch()}
              disabled={skusQuery.isFetching}
            >
              <RotateCw
                data-icon="inline-start"
                className={cn(skusQuery.isFetching && "animate-spin")}
              />
              刷新
            </Button>
            {canCreateSku ? (
              <Button size="sm" onClick={onAddSku}>
                <Plus data-icon="inline-start" />
                添加 SKU
              </Button>
            ) : null}
          </div>

          {skusQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : skusQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>加载失败</AlertTitle>
              <AlertDescription>
                {skusQuery.error instanceof Error
                  ? skusQuery.error.message
                  : "暂时无法获取 SKU 列表。"}
              </AlertDescription>
            </Alert>
          ) : skus.length === 0 ? (
            <Empty className="border-none bg-transparent py-8">
              <EmptyHeader>
                <EmptyTitle>还没有 SKU</EmptyTitle>
                <EmptyDescription>点击"添加 SKU"按钮创建第一个规格。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/50">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 pl-3 text-xs">SKU 编码</TableHead>
                    <TableHead className="h-9 text-xs">规格名称</TableHead>
                    <TableHead className="h-9 text-xs">条形码</TableHead>
                    <TableHead className="h-9 text-xs">价格</TableHead>
                    <TableHead className="h-9 text-xs">状态</TableHead>
                    <TableHead className="h-9 pr-3 text-right text-xs">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skus.map((sku) => (
                    <TableRow key={sku.id} className="hover:bg-muted/30">
                      <TableCell className="pl-3 text-xs font-medium text-foreground">
                        {sku.sku_code}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sku.spec_name || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sku.barcode || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sku.price ? `¥${sku.price}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={sku.is_active ? "default" : "secondary"}
                          className="h-4 px-1 text-[10px] font-medium"
                        >
                          {sku.is_active ? "启用" : "停用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-3 text-right">
                        <div className="flex justify-end gap-1">
                          {canUpdateSku ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-foreground"
                              onClick={() => onEditSku(sku)}
                              title="编辑 SKU"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          ) : null}
                          {canDeleteSku ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              onClick={() => onDeleteSku(sku)}
                              title="删除 SKU"
                            >
                              <Trash className="size-3.5" />
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
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ProductsView() {
  const logic = useProductProductsLogic()

  if (!logic.canReadProduct) {
    return (
      <PermissionDenied description="当前账号缺少 `product.product.read`，暂时无法查看商品页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">商品管理</h1>
          <p className="text-sm text-muted-foreground">管理门店商品及 SKU 规格信息。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.productsQuery.refetch()}
            disabled={logic.productsQuery.isFetching}
            className="h-9"
          >
            <RotateCw
              data-icon="inline-start"
              className={cn(logic.productsQuery.isFetching && "animate-spin")}
            />
            刷新
          </Button>
          {logic.canCreateProduct ? (
            <Button onClick={logic.openCreateProductDialog} size="sm" className="h-9">
              <Plus data-icon="inline-start" />
              新建商品
            </Button>
          ) : null}
        </div>
      </div>

      {/* Filter bar */}
      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/40 px-4 py-3">
            <ListFilter className="size-4 text-muted-foreground" />
            <Select
              value={logic.filterCategoryId || "__all__"}
              onValueChange={(value) =>
                logic.setFilterCategoryId(value === "__all__" ? "" : value)
              }
            >
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue placeholder="全部分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部分类</SelectItem>
                {logic.categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={logic.filterStatus || "__all__"}
              onValueChange={(value) =>
                logic.setFilterStatus(value === "__all__" ? "" : value)
              }
            >
              <SelectTrigger className="h-8 w-28 text-sm">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部状态</SelectItem>
                <SelectItem value="ACTIVE">启用</SelectItem>
                <SelectItem value="INACTIVE">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {logic.productsQuery.isLoading ? (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4">商品编码</TableHead>
                    <TableHead className="h-10">商品名称</TableHead>
                    <TableHead className="h-10">分类</TableHead>
                    <TableHead className="h-10">单位</TableHead>
                    <TableHead className="h-10">状态</TableHead>
                    <TableHead className="h-10">销售价</TableHead>
                    <TableHead className="h-10 pr-4 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LoadingRows cols={7} />
                </TableBody>
              </Table>
            </div>
          ) : logic.productsQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>
                  {logic.productsQuery.error instanceof Error
                    ? logic.productsQuery.error.message
                    : "暂时无法获取商品列表。"}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void logic.productsQuery.refetch()}
                  disabled={logic.productsQuery.isFetching}
                >
                  <RotateCw
                    data-icon="inline-start"
                    className={cn(logic.productsQuery.isFetching && "animate-spin")}
                  />
                  重试
                </Button>
              </div>
            </div>
          ) : logic.products.length === 0 ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <EmptyTitle>暂无商品</EmptyTitle>
                <EmptyDescription>
                  {logic.filterCategoryId || logic.filterStatus
                    ? "没有符合筛选条件的商品。"
                    : "使用右上角"新建商品"按钮添加第一个商品。"}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4">商品编码</TableHead>
                    <TableHead className="h-10">商品名称</TableHead>
                    <TableHead className="h-10">分类</TableHead>
                    <TableHead className="h-10">单位</TableHead>
                    <TableHead className="h-10">状态</TableHead>
                    <TableHead className="h-10">销售价</TableHead>
                    <TableHead className="h-10 pr-4 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-muted/30">
                      <TableCell className="pl-4 font-mono text-sm text-muted-foreground">
                        {product.code}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getCategoryName(logic.categories, product.category_id)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.unit || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.status === "ACTIVE" ? "default" : "secondary"}
                          className="h-5 px-1.5 text-[10px] font-medium"
                        >
                          {product.status === "ACTIVE" ? "启用" : "停用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.selling_price ? `¥${product.selling_price}` : "-"}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          {logic.canUpdateProduct ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => logic.openEditProductDialog(product)}
                              title="编辑商品"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {logic.canUpdateProduct ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => void logic.toggleProductStatus(product)}
                              title={product.status === "ACTIVE" ? "停用" : "启用"}
                            >
                              {product.status === "ACTIVE" ? (
                                <ToggleRight className="size-4" />
                              ) : (
                                <ToggleLeft className="size-4" />
                              )}
                            </Button>
                          ) : null}
                          {logic.canReadSku ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              onClick={() => logic.openSkuSheet(product.id)}
                              title="SKU 管理"
                            >
                              <Package className="size-4" />
                            </Button>
                          ) : null}
                          {logic.canDeleteProduct ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => logic.requestProductDelete(product)}
                              title="删除商品"
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

      {/* Product editor dialog */}
      <ProductEditorDialog
        open={logic.productDialogOpen}
        mode={logic.productDialogMode}
        form={logic.productForm}
        error={logic.productFormError}
        categories={logic.categories}
        isSubmitting={logic.isProductSubmitting}
        canSubmit={
          logic.productDialogMode === "create" ? logic.canCreateProduct : logic.canUpdateProduct
        }
        onOpenChange={(open) => {
          if (!open) logic.closeProductDialog()
        }}
        onFieldChange={logic.setProductField}
        onSubmit={() => void logic.submitProductForm()}
      />

      {/* Product delete confirmation */}
      <AlertDialog
        open={Boolean(logic.productDeleteTarget)}
        onOpenChange={(open) => !open && logic.closeProductDeleteDialog()}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除商品</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除这个商品吗？此操作不可撤销，同时会删除关联的 SKU 数据。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3">
            {logic.productDeleteTarget ? (
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                <span className="font-medium">{logic.productDeleteTarget.name}</span>
                <span className="ml-2 text-muted-foreground">
                  ({logic.productDeleteTarget.code})
                </span>
              </div>
            ) : null}

            {logic.productDeleteError ? (
              <Alert variant="destructive">
                <AlertTitle>删除失败</AlertTitle>
                <AlertDescription>{logic.productDeleteError}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={logic.isProductDeleting}>取消</AlertDialogCancel>
            {logic.canDeleteProduct ? (
              <AlertDialogAction
                variant="destructive"
                onClick={(event) => {
                  event.preventDefault()
                  void logic.confirmProductDelete()
                }}
                disabled={logic.isProductDeleting}
              >
                {logic.isProductDeleting ? "删除中..." : "删除"}
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SKU management sheet */}
      <SkuManagementSheet
        open={Boolean(logic.selectedProductId)}
        selectedProduct={logic.selectedProduct}
        skus={logic.skus}
        skusQuery={logic.skusQuery}
        canCreateSku={logic.canCreateSku}
        canUpdateSku={logic.canUpdateSku}
        canDeleteSku={logic.canDeleteSku}
        onClose={logic.closeSkuSheet}
        onAddSku={logic.openCreateSkuDialog}
        onEditSku={logic.openEditSkuDialog}
        onDeleteSku={logic.requestSkuDelete}
      />

      {/* SKU editor dialog */}
      <SkuEditorDialog
        open={logic.skuDialogOpen}
        mode={logic.skuDialogMode}
        form={logic.skuForm}
        error={logic.skuFormError}
        isSubmitting={logic.isSkuSubmitting}
        canSubmit={logic.skuDialogMode === "create" ? logic.canCreateSku : logic.canUpdateSku}
        onOpenChange={(open) => {
          if (!open) logic.closeSkuDialog()
        }}
        onFieldChange={logic.setSkuField}
        onSubmit={() => void logic.submitSkuForm()}
      />

      {/* SKU delete confirmation */}
      <AlertDialog
        open={Boolean(logic.skuDeleteTarget)}
        onOpenChange={(open) => !open && logic.closeSkuDeleteDialog()}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除 SKU</AlertDialogTitle>
            <AlertDialogDescription>确认删除此 SKU 吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3">
            {logic.skuDeleteTarget ? (
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                <span className="font-medium">{logic.skuDeleteTarget.sku_code}</span>
                {logic.skuDeleteTarget.spec_name ? (
                  <span className="ml-2 text-muted-foreground">
                    {logic.skuDeleteTarget.spec_name}
                  </span>
                ) : null}
              </div>
            ) : null}

            {logic.skuDeleteError ? (
              <Alert variant="destructive">
                <AlertTitle>删除失败</AlertTitle>
                <AlertDescription>{logic.skuDeleteError}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={logic.isSkuDeleting}>取消</AlertDialogCancel>
            {logic.canDeleteSku ? (
              <AlertDialogAction
                variant="destructive"
                onClick={(event) => {
                  event.preventDefault()
                  void logic.confirmSkuDelete()
                }}
                disabled={logic.isSkuDeleting}
              >
                {logic.isSkuDeleting ? "删除中..." : "删除"}
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
