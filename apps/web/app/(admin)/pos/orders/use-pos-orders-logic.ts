"use client"

import * as React from "react"

import {
  getPOSReadOrdersQueryKey,
  usePOSReadOrderItems,
  usePOSReadOrders,
  usePOSReadPayments,
} from "@/api/generated/pos/pos"
import { usePermissionAccess } from "@/lib/permissions"

export function usePOSOrdersLogic() {
  const { hasPermission } = usePermissionAccess()

  const canReadOrders = hasPermission("pos.order.read")
  const canReadPayments = hasPermission("pos.payment.read")

  const ordersQuery = usePOSReadOrders({
    query: { enabled: canReadOrders },
  })

  const orders = ordersQuery.data?.data ?? []

  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null)

  const orderItemsQuery = usePOSReadOrderItems(expandedOrderId ?? "", {
    query: { enabled: Boolean(expandedOrderId) && canReadOrders },
  })

  const paymentsQuery = usePOSReadPayments(expandedOrderId ?? "", {
    query: { enabled: Boolean(expandedOrderId) && canReadPayments },
  })

  const toggleExpandedOrder = React.useCallback((orderId: string) => {
    setExpandedOrderId((current) => (current === orderId ? null : orderId))
  }, [])

  return {
    canReadOrders,
    canReadPayments,
    ordersQuery,
    orders,
    expandedOrderId,
    orderItemsQuery,
    paymentsQuery,
    toggleExpandedOrder,
    ordersQueryKey: getPOSReadOrdersQueryKey(),
  }
}

export type POSOrdersLogic = ReturnType<typeof usePOSOrdersLogic>
