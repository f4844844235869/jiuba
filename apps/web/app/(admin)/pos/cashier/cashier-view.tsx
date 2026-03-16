"use client"

import * as React from "react"
import { ShoppingCart, Trash2, CreditCard, X, Search } from "lucide-react"

import {
  usePosCashierLogic,
  type PaymentFormValues,
} from "@/app/(admin)/pos/cashier/use-pos-cashier-logic"
import { PermissionDenied } from "@/components/permission-denied"
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
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
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
import { Separator } from "@workspace/ui/components/separator"

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "现金",
  CARD: "刷卡",
  WECHAT: "微信",
  ALIPAY: "支付宝",
  WALLET_PRINCIPAL: "本金",
  WALLET_GIFT: "赠金",
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/20 p-4"
        >
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function PaymentDialog({
  open,
  form,
  error,
  cartTotal,
  isSubmitting,
  onOpenChange,
  onFieldChange,
  onSubmit,
}: {
  open: boolean
  form: PaymentFormValues
  error: string | null
  cartTotal: number
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof PaymentFormValues, value: string) => void
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>收款</DialogTitle>
          <DialogDescription>
            订单合计 ¥{cartTotal.toFixed(2)}，请选择支付方式并确认金额。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>支付失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Field>
            <FieldLabel htmlFor="payment-method">
              支付方式
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Select
              value={form.payment_method}
              onValueChange={(value) => onFieldChange("payment_method", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="请选择支付方式" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="payment-amount">
              支付金额
              <span className="ml-1 text-destructive">*</span>
            </FieldLabel>
            <Input
              id="payment-amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => onFieldChange("amount", e.target.value)}
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="payment-remark">备注</FieldLabel>
            <Input
              id="payment-remark"
              value={form.remark}
              onChange={(e) => onFieldChange("remark", e.target.value)}
              placeholder="可选备注"
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
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "处理中…" : "确认收款"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CashierView() {
  const logic = usePosCashierLogic()

  if (!logic.canCreateOrder && !logic.canCreatePayment) {
    return <PermissionDenied />
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-0">
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — product catalog */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">商品目录</h2>

            {/* Search + category filter */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="搜索商品…"
                  value={logic.productSearch}
                  onChange={(e) => logic.setProductSearch(e.target.value)}
                />
              </div>

              <Select
                value={logic.selectedCategoryId || "__all__"}
                onValueChange={(v) =>
                  logic.setSelectedCategoryId(v === "__all__" ? "" : v)
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="所有分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">所有分类</SelectItem>
                  {logic.categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {logic.productsQuery.isLoading ? (
            <ProductGridSkeleton />
          ) : logic.filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 opacity-40" />
              <p className="text-sm">暂无商品</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {logic.filteredProducts.map((product) => {
                const price =
                  (product as typeof product & { price?: number }).price ?? 0
                return (
                  <Card
                    key={product.id}
                    className="cursor-pointer border-border/50 shadow-sm transition-shadow hover:shadow-md"
                    onClick={() => logic.addItem(product)}
                  >
                    <CardContent className="flex flex-col gap-1 p-4">
                      <span className="line-clamp-2 text-sm font-medium">
                        {product.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ¥{price.toFixed(2)}
                      </span>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <Separator orientation="vertical" />

        {/* Right panel — order cart */}
        <div className="flex w-80 flex-col gap-0 lg:w-96">
          <Card className="flex flex-1 flex-col rounded-none border-0 shadow-none">
            <CardHeader className="border-b pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" />
                购物车
                {logic.itemCount > 0 ? (
                  <Badge variant="secondary">{logic.itemCount}</Badge>
                ) : null}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-0 overflow-hidden p-0">
              {/* Cart items */}
              <div className="flex-1 overflow-y-auto">
                {!logic.activeOrderId ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 opacity-40" />
                    <p className="text-sm">点击左侧商品加入购物车</p>
                  </div>
                ) : logic.orderItemsQuery.isLoading ? (
                  <div className="flex flex-col gap-2 p-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : logic.cartItems.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 opacity-40" />
                    <p className="text-sm">购物车为空</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y">
                    {logic.cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="flex flex-1 flex-col gap-0.5">
                          <span className="line-clamp-1 text-sm font-medium">
                            {item.product_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ¥{(item.unit_price ?? 0).toFixed(2)} × {item.quantity}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          ¥{(item.subtotal ?? 0).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => logic.removeItem(item.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">合计</span>
                  <span className="text-lg font-bold">
                    ¥{logic.cartTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-col gap-2 px-4 pb-4">
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={
                      !logic.canCreatePayment || logic.cartItems.length === 0
                    }
                    onClick={logic.openPaymentDialog}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    收款
                  </Button>

                  {logic.activeOrderId && logic.canDeleteOrder ? (
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={logic.requestClearOrder}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      取消订单
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment dialog */}
      <PaymentDialog
        open={logic.paymentDialogOpen}
        form={logic.paymentForm}
        error={logic.paymentError}
        cartTotal={logic.cartTotal}
        isSubmitting={logic.isSubmittingPayment}
        onOpenChange={(open) => {
          if (!open) logic.closePaymentDialog()
        }}
        onFieldChange={logic.setPaymentField}
        onSubmit={logic.submitPayment}
      />

      {/* Clear/cancel order confirmation */}
      <AlertDialog
        open={logic.clearDialogOpen}
        onOpenChange={(open) => {
          if (!open) logic.closeClearDialog()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>取消订单</AlertDialogTitle>
            <AlertDialogDescription>
              确认取消当前订单？购物车内的商品将被清空，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={logic.closeClearDialog}>
              返回
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={logic.confirmClearOrder}
            >
              确认取消
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
