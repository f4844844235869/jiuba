"use client"

import { ChevronDown, ChevronRight, RotateCw } from "lucide-react"

import { usePOSOrdersLogic } from "@/app/(admin)/pos/orders/use-pos-orders-logic"
import { PermissionDenied } from "@/components/permission-denied"
import type { OrderItemPublic, OrderPublic, PaymentPublic } from "@/api/generated/workspace.schemas"
import { cn } from "@workspace/ui/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

type StatusConfig = {
  label: string
  variant: "default" | "outline" | "destructive" | "secondary"
}

const STATUS_MAP: Record<string, StatusConfig> = {
  PENDING: { label: "待支付", variant: "outline" },
  PAID: { label: "已支付", variant: "default" },
  CANCELLED: { label: "已取消", variant: "destructive" },
  REFUNDED: { label: "已退款", variant: "secondary" },
}

const PAYMENT_METHOD_MAP: Record<string, string> = {
  CASH: "现金",
  CARD: "刷卡",
  WALLET_PRINCIPAL: "本金",
  WALLET_GIFT: "赠金",
  WECHAT: "微信",
  ALIPAY: "支付宝",
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusBadge({ status }: { status?: string }) {
  const config = status ? (STATUS_MAP[status] ?? null) : null
  if (!config) {
    return <span className="text-sm text-muted-foreground">{status ?? "-"}</span>
  }
  return (
    <Badge variant={config.variant} className="h-5 px-1.5 text-[10px] font-medium">
      {config.label}
    </Badge>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_0.5fr] gap-3 rounded-xl border border-border/50 bg-muted/20 p-4"
        >
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </div>
  )
}

function OrderItemsTable({ items }: { items: OrderItemPublic[] }) {
  if (items.length === 0) {
    return <p className="py-3 text-center text-sm text-muted-foreground">暂无明细</p>
  }
  return (
    <Table>
      <TableHeader className="bg-muted/20">
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-8 pl-4 text-xs">商品名称</TableHead>
          <TableHead className="h-8 text-xs">SKU编码</TableHead>
          <TableHead className="h-8 text-xs">单价</TableHead>
          <TableHead className="h-8 text-xs">数量</TableHead>
          <TableHead className="h-8 pr-4 text-xs">小计</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className="hover:bg-muted/20">
            <TableCell className="py-2 pl-4 text-sm">{item.product_name}</TableCell>
            <TableCell className="py-2 text-sm text-muted-foreground">
              {item.sku_code ?? "-"}
            </TableCell>
            <TableCell className="py-2 text-sm text-muted-foreground">
              {item.unit_price ?? "-"}
            </TableCell>
            <TableCell className="py-2 text-sm text-muted-foreground">
              {item.quantity ?? "-"}
            </TableCell>
            <TableCell className="py-2 pr-4 text-sm text-muted-foreground">
              {item.subtotal ?? "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function PaymentsTable({ payments }: { payments: PaymentPublic[] }) {
  if (payments.length === 0) {
    return <p className="py-3 text-center text-sm text-muted-foreground">暂无支付记录</p>
  }
  return (
    <Table>
      <TableHeader className="bg-muted/20">
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-8 pl-4 text-xs">支付方式</TableHead>
          <TableHead className="h-8 text-xs">金额</TableHead>
          <TableHead className="h-8 pr-4 text-xs">状态</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id} className="hover:bg-muted/20">
            <TableCell className="py-2 pl-4 text-sm">
              {PAYMENT_METHOD_MAP[payment.payment_method] ?? payment.payment_method}
            </TableCell>
            <TableCell className="py-2 text-sm text-muted-foreground">{payment.amount}</TableCell>
            <TableCell className="py-2 pr-4 text-sm text-muted-foreground">
              {payment.status ?? "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ExpandedOrderDetails({
  orderId,
  logic,
}: {
  orderId: string
  logic: ReturnType<typeof usePOSOrdersLogic>
}) {
  const { orderItemsQuery, paymentsQuery, canReadPayments } = logic
  const isLoading = orderItemsQuery.isLoading || (canReadPayments && paymentsQuery.isLoading)
  const items = orderItemsQuery.data?.data ?? []
  const payments = paymentsQuery.data?.data ?? []

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={8} className="bg-muted/10 p-0">
        <div className="flex flex-col gap-4 px-6 py-4">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-foreground">订单明细</h3>
                <div className="overflow-hidden rounded-lg border border-border/50">
                  <OrderItemsTable items={items} />
                </div>
              </div>
              {canReadPayments ? (
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-foreground">支付记录</h3>
                  <div className="overflow-hidden rounded-lg border border-border/50">
                    <PaymentsTable payments={payments} />
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function OrderRow({
  order,
  isExpanded,
  logic,
}: {
  order: OrderPublic
  isExpanded: boolean
  logic: ReturnType<typeof usePOSOrdersLogic>
}) {
  return (
    <>
      <TableRow className="hover:bg-muted/30">
        <TableCell className="pl-4 font-mono text-sm text-foreground">{order.order_no}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{order.member_id ?? "-"}</TableCell>
        <TableCell>
          <StatusBadge status={order.status} />
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{order.total_amount ?? "-"}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{order.paid_amount ?? "-"}</TableCell>
        <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">
          {order.remark ?? "-"}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatDateTime(order.created_at)}
        </TableCell>
        <TableCell className="pr-4 text-right">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => logic.toggleExpandedOrder(order.id)}
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
            展开
          </Button>
        </TableCell>
      </TableRow>
      {isExpanded ? <ExpandedOrderDetails orderId={order.id} logic={logic} /> : null}
    </>
  )
}

export function POSOrdersView() {
  const logic = usePOSOrdersLogic()

  if (!logic.canReadOrders) {
    return (
      <PermissionDenied description="当前账号缺少 `pos.order.read`，暂时无法查看订单列表页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">订单列表</h1>
          <p className="text-sm text-muted-foreground">查看门店 POS 订单及支付明细。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.ordersQuery.refetch()}
            disabled={logic.ordersQuery.isFetching}
            className="h-9"
          >
            <RotateCw
              data-icon="inline-start"
              className={cn(logic.ordersQuery.isFetching && "animate-spin")}
            />
            刷新
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {logic.ordersQuery.isLoading ? (
            <LoadingState />
          ) : logic.ordersQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>
                  {logic.ordersQuery.error instanceof Error
                    ? logic.ordersQuery.error.message
                    : "暂时无法获取订单列表。"}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void logic.ordersQuery.refetch()}
                  disabled={logic.ordersQuery.isFetching}
                >
                  <RotateCw
                    data-icon="inline-start"
                    className={cn(logic.ordersQuery.isFetching && "animate-spin")}
                  />
                  重试
                </Button>
              </div>
            </div>
          ) : logic.orders.length === 0 ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <EmptyTitle>还没有订单</EmptyTitle>
                <EmptyDescription>门店暂无 POS 订单记录。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4">订单号</TableHead>
                    <TableHead className="h-10">会员ID</TableHead>
                    <TableHead className="h-10">状态</TableHead>
                    <TableHead className="h-10">总金额</TableHead>
                    <TableHead className="h-10">实付金额</TableHead>
                    <TableHead className="h-10">备注</TableHead>
                    <TableHead className="h-10">创建时间</TableHead>
                    <TableHead className="h-10 pr-4 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.orders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      isExpanded={logic.expandedOrderId === order.id}
                      logic={logic}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
