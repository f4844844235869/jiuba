"use client"

import { PackageSearch, RotateCw } from "lucide-react"

import { useInventoryBalancesLogic } from "@/app/(admin)/inventory/balances/use-inventory-balances-logic"
import { PermissionDenied } from "@/components/permission-denied"
import { cn } from "@workspace/ui/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Button } from "@workspace/ui/components/button"
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
    <div className="flex flex-col gap-0 divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-36" />
        </div>
      ))}
    </div>
  )
}

export function BalancesView() {
  const logic = useInventoryBalancesLogic()

  if (!logic.canReadBalance) {
    return (
      <PermissionDenied description="当前账号缺少 `inventory.balance.read`，暂时无法查看库存余额页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">库存余额</h1>
          <p className="text-sm text-muted-foreground">查看各仓库的当前库存数量。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.balancesQuery.refetch()}
            disabled={!logic.selectedWarehouseId || logic.balancesQuery.isFetching}
            className="h-9"
          >
            <RotateCw
              data-icon="inline-start"
              className={cn(logic.balancesQuery.isFetching && "animate-spin")}
            />
            刷新
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="shrink-0 text-sm font-medium text-foreground">选择仓库</span>
        {logic.warehousesQuery.isLoading ? (
          <Skeleton className="h-9 w-52" />
        ) : (
          <Select
            value={logic.selectedWarehouseId || "__none__"}
            onValueChange={(value) =>
              logic.setSelectedWarehouseId(value === "__none__" ? "" : value)
            }
            disabled={!logic.canReadWarehouse}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="请选择仓库" />
            </SelectTrigger>
            <SelectContent>
              {logic.warehouses.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  暂无仓库
                </SelectItem>
              ) : (
                logic.warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                    {warehouse.code ? (
                      <span className="ml-1 text-muted-foreground">({warehouse.code})</span>
                    ) : null}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {!logic.selectedWarehouseId ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <EmptyTitle>请先选择仓库</EmptyTitle>
                <EmptyDescription>选择一个仓库以查看其库存余额。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : logic.balancesQuery.isLoading ? (
            <LoadingState />
          ) : logic.balancesQuery.isError ? (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTitle>加载失败</AlertTitle>
                <AlertDescription>
                  {logic.balancesQuery.error instanceof Error
                    ? logic.balancesQuery.error.message
                    : "暂时无法获取库存余额列表。"}
                </AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void logic.balancesQuery.refetch()}
                  disabled={logic.balancesQuery.isFetching}
                >
                  <RotateCw
                    data-icon="inline-start"
                    className={cn(logic.balancesQuery.isFetching && "animate-spin")}
                  />
                  重试
                </Button>
              </div>
            </div>
          ) : logic.balances.length === 0 ? (
            <Empty className="border-none bg-transparent py-12">
              <EmptyHeader>
                <PackageSearch className="size-10 text-muted-foreground/50" />
                <EmptyTitle>暂无库存数据</EmptyTitle>
                <EmptyDescription>该仓库当前没有库存余额记录。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-4">SKU ID</TableHead>
                    <TableHead className="h-10">当前库存</TableHead>
                    <TableHead className="h-10">计量单位</TableHead>
                    <TableHead className="h-10">最低预警值</TableHead>
                    <TableHead className="h-10">最后更新时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logic.balances.map((balance) => (
                    <TableRow key={balance.id} className="hover:bg-muted/30">
                      <TableCell className="pl-4 font-mono text-sm text-foreground">
                        {balance.sku_id}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {balance.quantity ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {balance.unit ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {balance.min_quantity ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {balance.updated_at
                          ? new Date(balance.updated_at).toLocaleString("zh-CN")
                          : "—"}
                      </TableCell>
                    </TableRow>
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
