"use client"

import * as React from "react"

import {
  useInventoryReadInventoryBalances,
  useInventoryReadWarehouses,
} from "@/api/generated/inventory/inventory"
import { usePermissionAccess } from "@/lib/permissions"

export function useInventoryBalancesLogic() {
  const { hasPermission } = usePermissionAccess()

  const canReadWarehouse = hasPermission("inventory.warehouse.read")
  const canReadBalance = hasPermission("inventory.balance.read")

  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string>("")

  const warehousesQuery = useInventoryReadWarehouses({
    query: { enabled: canReadWarehouse },
  })

  const balancesQuery = useInventoryReadInventoryBalances(selectedWarehouseId, {
    query: { enabled: canReadBalance && Boolean(selectedWarehouseId) },
  })

  const warehouses = warehousesQuery.data?.data ?? []
  const balances = balancesQuery.data?.data ?? []

  return {
    canReadWarehouse,
    canReadBalance,
    selectedWarehouseId,
    setSelectedWarehouseId,
    warehousesQuery,
    balancesQuery,
    warehouses,
    balances,
  }
}
