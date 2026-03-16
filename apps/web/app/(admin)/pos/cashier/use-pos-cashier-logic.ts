"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getPOSReadOrderItemsQueryKey,
  usePOSCreateOrderItemRoute,
  usePOSCreateOrderRoute,
  usePOSCreatePaymentRoute,
  usePOSDeleteOrderItemRoute,
  usePOSReadOrderItems,
  usePOSUpdateOrderRoute,
} from "@/api/generated/pos/pos"
import {
  useProductCenterReadCategories,
  useProductCenterReadProducts,
} from "@/api/generated/product-center/product-center"
import type {
  OrderItemCreate,
  PaymentCreate,
  ProductPublic,
} from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type PaymentFormValues = {
  payment_method: string
  amount: string
  remark: string
}

const DEFAULT_PAYMENT_FORM: PaymentFormValues = {
  payment_method: "CASH",
  amount: "",
  remark: "",
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

export function usePosCashierLogic() {
  const queryClient = useQueryClient()
  const { profile, hasPermission } = usePermissionAccess()

  const canCreateOrder = hasPermission("pos.order.create")
  const canCreatePayment = hasPermission("pos.payment.create")
  const canDeleteOrder = hasPermission("pos.order.delete")

  const storeId =
    (profile?.current_store_id ?? profile?.primary_store_id) || ""
  const operatorId = profile?.id ?? ""

  // Product catalog
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("")
  const [productSearch, setProductSearch] = React.useState<string>("")

  const categoriesQuery = useProductCenterReadCategories()
  const productsQuery = useProductCenterReadProducts()

  const categories = categoriesQuery.data?.data ?? []
  const allProducts: ProductPublic[] = (productsQuery.data?.data ?? []) as ProductPublic[]

  const filteredProducts = allProducts.filter((p) => {
    const matchCategory = !selectedCategoryId || p.category_id === selectedCategoryId
    const matchSearch =
      !productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.trim().toLowerCase())
    return matchCategory && matchSearch
  })

  // Active order
  const [activeOrderId, setActiveOrderId] = React.useState<string | null>(null)

  const orderItemsQuery = usePOSReadOrderItems(activeOrderId ?? "", {
    query: { enabled: Boolean(activeOrderId) },
  })

  const cartItems = orderItemsQuery.data?.data ?? []
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.subtotal ?? 0),
    0
  )
  const itemCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0
  )

  // Mutations
  const createOrderMutation = usePOSCreateOrderRoute()
  const createOrderItemMutation = usePOSCreateOrderItemRoute()
  const deleteOrderItemMutation = usePOSDeleteOrderItemRoute()
  const createPaymentMutation = usePOSCreatePaymentRoute()
  const updateOrderMutation = usePOSUpdateOrderRoute()

  const invalidateOrderItems = React.useCallback(async () => {
    if (!activeOrderId) return
    await queryClient.invalidateQueries({
      queryKey: getPOSReadOrderItemsQueryKey(activeOrderId),
    })
  }, [queryClient, activeOrderId])

  const ensureOrder = React.useCallback(async (): Promise<string> => {
    if (activeOrderId) return activeOrderId

    const orderNo = Date.now().toString()
    const result = await createOrderMutation.mutateAsync({
      data: {
        store_id: storeId,
        order_no: orderNo,
        operator_id: operatorId,
        status: "PENDING",
        total_amount: 0,
        discount_amount: 0,
        payable_amount: 0,
        paid_amount: 0,
      },
    })
    const newOrderId = result.data?.id ?? ""
    setActiveOrderId(newOrderId)
    return newOrderId
  }, [activeOrderId, createOrderMutation, operatorId, storeId])

  const addItem = React.useCallback(
    async (product: ProductPublic) => {
      if (!canCreateOrder) {
        toast.error("权限不足，无法添加商品")
        return
      }
      try {
        const orderId = await ensureOrder()
        const price = (product as ProductPublic & { price?: number }).price ?? 0
        await createOrderItemMutation.mutateAsync({
          data: {
            order_id: orderId,
            product_id: product.id,
            product_name: product.name,
            unit_price: price,
            quantity: 1,
            subtotal: price,
            discount_amount: 0,
          } satisfies OrderItemCreate,
        })
        await invalidateOrderItems()
      } catch (error) {
        toast.error(getErrorMessage(error, "添加商品失败，请稍后重试。"))
      }
    },
    [canCreateOrder, createOrderItemMutation, ensureOrder, invalidateOrderItems]
  )

  const removeItem = React.useCallback(
    async (itemId: string) => {
      if (!activeOrderId) return
      try {
        await deleteOrderItemMutation.mutateAsync({
          orderId: activeOrderId,
          itemId,
        })
        await invalidateOrderItems()
      } catch (error) {
        toast.error(getErrorMessage(error, "移除商品失败，请稍后重试。"))
      }
    },
    [activeOrderId, deleteOrderItemMutation, invalidateOrderItems]
  )

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false)
  const [paymentForm, setPaymentForm] =
    React.useState<PaymentFormValues>(DEFAULT_PAYMENT_FORM)
  const [paymentError, setPaymentError] = React.useState<string | null>(null)

  const openPaymentDialog = React.useCallback(() => {
    setPaymentForm({
      payment_method: "CASH",
      amount: cartTotal.toFixed(2),
      remark: "",
    })
    setPaymentError(null)
    setPaymentDialogOpen(true)
  }, [cartTotal])

  const closePaymentDialog = React.useCallback(() => {
    if (createPaymentMutation.isPending) return
    setPaymentDialogOpen(false)
    setPaymentError(null)
  }, [createPaymentMutation.isPending])

  const setPaymentField = React.useCallback(
    (field: keyof PaymentFormValues, value: string) => {
      setPaymentForm((current) => ({ ...current, [field]: value }))
      setPaymentError(null)
    },
    []
  )

  const submitPayment = React.useCallback(async () => {
    if (!activeOrderId) return
    const amount = parseFloat(paymentForm.amount)
    if (!paymentForm.payment_method) {
      setPaymentError("请选择支付方式。")
      return
    }
    if (isNaN(amount) || amount <= 0) {
      setPaymentError("请输入有效的支付金额。")
      return
    }

    setPaymentError(null)

    try {
      await createPaymentMutation.mutateAsync({
        data: {
          order_id: activeOrderId,
          payment_method: paymentForm.payment_method as PaymentCreate["payment_method"],
          amount,
          status: "SUCCESS",
          remark: paymentForm.remark.trim() || undefined,
          operator_id: operatorId,
        } satisfies PaymentCreate,
      })

      await updateOrderMutation.mutateAsync({
        orderId: activeOrderId,
        data: { status: "PAID", paid_amount: amount },
      })

      toast.success("支付成功")
      setActiveOrderId(null)
      closePaymentDialog()
    } catch (error) {
      setPaymentError(getErrorMessage(error, "支付失败，请稍后重试。"))
    }
  }, [
    activeOrderId,
    closePaymentDialog,
    createPaymentMutation,
    operatorId,
    paymentForm,
    updateOrderMutation,
  ])

  // Cancel/clear order
  const [clearDialogOpen, setClearDialogOpen] = React.useState(false)

  const requestClearOrder = React.useCallback(() => {
    setClearDialogOpen(true)
  }, [])

  const closeClearDialog = React.useCallback(() => {
    setClearDialogOpen(false)
  }, [])

  const confirmClearOrder = React.useCallback(async () => {
    if (!activeOrderId) {
      setClearDialogOpen(false)
      return
    }
    try {
      await updateOrderMutation.mutateAsync({
        orderId: activeOrderId,
        data: { status: "CANCELLED" },
      })
      setActiveOrderId(null)
      toast.success("订单已取消")
    } catch (error) {
      toast.error(getErrorMessage(error, "取消订单失败，请稍后重试。"))
    } finally {
      setClearDialogOpen(false)
    }
  }, [activeOrderId, updateOrderMutation])

  return {
    canCreateOrder,
    canCreatePayment,
    canDeleteOrder,

    categories,
    categoriesQuery,
    filteredProducts,
    productsQuery,
    selectedCategoryId,
    setSelectedCategoryId,
    productSearch,
    setProductSearch,

    activeOrderId,
    cartItems,
    cartTotal,
    itemCount,
    orderItemsQuery,

    addItem,
    removeItem,

    paymentDialogOpen,
    paymentForm,
    paymentError,
    openPaymentDialog,
    closePaymentDialog,
    setPaymentField,
    submitPayment,
    isSubmittingPayment: createPaymentMutation.isPending || updateOrderMutation.isPending,

    clearDialogOpen,
    requestClearOrder,
    closeClearDialog,
    confirmClearOrder,
  }
}
