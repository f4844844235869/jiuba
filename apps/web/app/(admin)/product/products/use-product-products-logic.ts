"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getProductCenterReadProductsQueryKey,
  getProductCenterReadSkusQueryKey,
  useProductCenterCreateProductRoute,
  useProductCenterCreateSkuRoute,
  useProductCenterDeleteProductRoute,
  useProductCenterDeleteSkuRoute,
  useProductCenterReadCategories,
  useProductCenterReadProducts,
  useProductCenterReadSkus,
  useProductCenterUpdateProductRoute,
  useProductCenterUpdateSkuRoute,
} from "@/api/generated/product-center/product-center"
import type {
  CategoryPublic,
  ProductCreate,
  ProductPublic,
  ProductUpdate,
  SKUCreate,
  SKUPublic,
  SKUUpdate,
} from "@/api/generated/workspace.schemas"
import { usePermissionAccess } from "@/lib/permissions"

export type ProductFormValues = {
  code: string
  name: string
  unit: string
  category_id: string
  status: string
  selling_price: string
  cost_price: string
  description: string
}

export type SkuFormValues = {
  sku_code: string
  spec_name: string
  barcode: string
  price: string
  cost_price: string
  is_active: string
}

const DEFAULT_PRODUCT_FORM: ProductFormValues = {
  code: "",
  name: "",
  unit: "",
  category_id: "",
  status: "ACTIVE",
  selling_price: "",
  cost_price: "",
  description: "",
}

const DEFAULT_SKU_FORM: SkuFormValues = {
  sku_code: "",
  spec_name: "",
  barcode: "",
  price: "",
  cost_price: "",
  is_active: "true",
}

function toProductFormValues(product?: ProductPublic | null): ProductFormValues {
  if (!product) {
    return DEFAULT_PRODUCT_FORM
  }

  return {
    code: product.code ?? "",
    name: product.name ?? "",
    unit: product.unit ?? "",
    category_id: product.category_id ?? "",
    status: product.status ?? "ACTIVE",
    selling_price: product.selling_price ?? "",
    cost_price: product.cost_price ?? "",
    description: product.description ?? "",
  }
}

function toSkuFormValues(sku?: SKUPublic | null): SkuFormValues {
  if (!sku) {
    return DEFAULT_SKU_FORM
  }

  return {
    sku_code: sku.sku_code ?? "",
    spec_name: sku.spec_name ?? "",
    barcode: sku.barcode ?? "",
    price: sku.price ?? "",
    cost_price: sku.cost_price ?? "",
    is_active: String(sku.is_active ?? true),
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function useProductProductsLogic() {
  const queryClient = useQueryClient()
  const { profile, hasPermission } = usePermissionAccess()

  const canReadProduct = hasPermission("product.product.read")
  const canCreateProduct = hasPermission("product.product.create")
  const canUpdateProduct = hasPermission("product.product.update")
  const canDeleteProduct = hasPermission("product.product.delete")
  const canReadSku = hasPermission("product.sku.read")
  const canCreateSku = hasPermission("product.sku.create")
  const canUpdateSku = hasPermission("product.sku.update")
  const canDeleteSku = hasPermission("product.sku.delete")

  const storeId = (profile?.current_store_id ?? profile?.primary_store_id) || ""

  // Filters
  const [filterCategoryId, setFilterCategoryId] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("")

  // SKU sheet state — selectedProductId drives sheet open/closed
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null)

  // Product dialog state
  const [productDialogOpen, setProductDialogOpen] = React.useState(false)
  const [productDialogMode, setProductDialogMode] = React.useState<"create" | "edit">("create")
  const [editingProduct, setEditingProduct] = React.useState<ProductPublic | null>(null)
  const [productForm, setProductForm] = React.useState<ProductFormValues>(DEFAULT_PRODUCT_FORM)
  const [productFormError, setProductFormError] = React.useState<string | null>(null)

  // Product delete state
  const [productDeleteTarget, setProductDeleteTarget] = React.useState<ProductPublic | null>(null)
  const [productDeleteError, setProductDeleteError] = React.useState<string | null>(null)

  // SKU dialog state
  const [skuDialogOpen, setSkuDialogOpen] = React.useState(false)
  const [skuDialogMode, setSkuDialogMode] = React.useState<"create" | "edit">("create")
  const [editingSku, setEditingSku] = React.useState<SKUPublic | null>(null)
  const [skuForm, setSkuForm] = React.useState<SkuFormValues>(DEFAULT_SKU_FORM)
  const [skuFormError, setSkuFormError] = React.useState<string | null>(null)

  // SKU delete state
  const [skuDeleteTarget, setSkuDeleteTarget] = React.useState<SKUPublic | null>(null)
  const [skuDeleteError, setSkuDeleteError] = React.useState<string | null>(null)

  // Queries
  const categoriesQuery = useProductCenterReadCategories({
    query: { enabled: canReadProduct },
  })
  const productsQuery = useProductCenterReadProducts({
    query: { enabled: canReadProduct },
  })
  const skusQuery = useProductCenterReadSkus(selectedProductId ?? "", {
    query: { enabled: canReadSku && Boolean(selectedProductId) },
  })

  // Mutations
  const createProductMutation = useProductCenterCreateProductRoute()
  const updateProductMutation = useProductCenterUpdateProductRoute()
  const deleteProductMutation = useProductCenterDeleteProductRoute()
  const createSkuMutation = useProductCenterCreateSkuRoute()
  const updateSkuMutation = useProductCenterUpdateSkuRoute()
  const deleteSkuMutation = useProductCenterDeleteSkuRoute()

  const categories: CategoryPublic[] = categoriesQuery.data?.data ?? []
  const allProducts: ProductPublic[] = productsQuery.data?.data ?? []
  const skus: SKUPublic[] = skusQuery.data?.data ?? []

  const products = allProducts.filter((product) => {
    if (filterCategoryId && product.category_id !== filterCategoryId) return false
    if (filterStatus && product.status !== filterStatus) return false
    return true
  })

  const selectedProduct = allProducts.find((p) => p.id === selectedProductId) ?? null

  const isProductSubmitting = createProductMutation.isPending || updateProductMutation.isPending
  const isProductDeleting = deleteProductMutation.isPending
  const isSkuSubmitting = createSkuMutation.isPending || updateSkuMutation.isPending
  const isSkuDeleting = deleteSkuMutation.isPending

  const invalidateProducts = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: getProductCenterReadProductsQueryKey(),
    })
  }, [queryClient])

  const invalidateSkus = React.useCallback(
    async (productId: string) => {
      await queryClient.invalidateQueries({
        queryKey: getProductCenterReadSkusQueryKey(productId),
      })
    },
    [queryClient]
  )

  // Product dialog actions
  const openCreateProductDialog = React.useCallback(() => {
    setProductDialogMode("create")
    setEditingProduct(null)
    setProductForm(DEFAULT_PRODUCT_FORM)
    setProductFormError(null)
    setProductDialogOpen(true)
  }, [])

  const openEditProductDialog = React.useCallback((product: ProductPublic) => {
    setProductDialogMode("edit")
    setEditingProduct(product)
    setProductForm(toProductFormValues(product))
    setProductFormError(null)
    setProductDialogOpen(true)
  }, [])

  const closeProductDialog = React.useCallback(() => {
    if (isProductSubmitting) return

    setProductDialogOpen(false)
    setEditingProduct(null)
    setProductForm(DEFAULT_PRODUCT_FORM)
    setProductFormError(null)
  }, [isProductSubmitting])

  const setProductField = React.useCallback(
    (field: keyof ProductFormValues, value: string) => {
      setProductForm((current) => ({ ...current, [field]: value }))
      setProductFormError(null)
    },
    []
  )

  const submitProductForm = React.useCallback(async () => {
    if (!productForm.code.trim() || !productForm.name.trim()) {
      setProductFormError("请填写商品编码和商品名称。")
      return
    }

    setProductFormError(null)

    try {
      if (productDialogMode === "create") {
        if (!storeId) {
          setProductFormError("无法获取门店信息，请刷新页面后重试。")
          return
        }

        await createProductMutation.mutateAsync({
          data: {
            store_id: storeId,
            code: productForm.code.trim(),
            name: productForm.name.trim(),
            unit: productForm.unit.trim() || undefined,
            category_id: productForm.category_id.trim() || null,
            status: productForm.status || "ACTIVE",
            selling_price: productForm.selling_price.trim() || undefined,
            cost_price: productForm.cost_price.trim() || undefined,
            description: productForm.description.trim() || null,
          } satisfies ProductCreate,
        })
        toast.success("商品已创建")
      } else {
        if (!editingProduct) return

        await updateProductMutation.mutateAsync({
          productId: editingProduct.id,
          data: {
            code: productForm.code.trim(),
            name: productForm.name.trim(),
            unit: productForm.unit.trim() || null,
            category_id: productForm.category_id.trim() || null,
            status: productForm.status || null,
            selling_price: productForm.selling_price.trim() || null,
            cost_price: productForm.cost_price.trim() || null,
            description: productForm.description.trim() || null,
          } satisfies ProductUpdate,
        })
        toast.success("商品已更新")
      }

      await invalidateProducts()
      closeProductDialog()
    } catch (error) {
      const fallback =
        productDialogMode === "create" ? "创建商品失败，请稍后重试。" : "保存商品失败，请稍后重试。"
      setProductFormError(getErrorMessage(error, fallback))
    }
  }, [
    closeProductDialog,
    createProductMutation,
    editingProduct,
    invalidateProducts,
    productDialogMode,
    productForm,
    storeId,
    updateProductMutation,
  ])

  // Product status toggle
  const toggleProductStatus = React.useCallback(
    async (product: ProductPublic) => {
      const newStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"

      try {
        await updateProductMutation.mutateAsync({
          productId: product.id,
          data: { status: newStatus } satisfies ProductUpdate,
        })
        toast.success(newStatus === "ACTIVE" ? "商品已启用" : "商品已停用")
        await invalidateProducts()
      } catch (error) {
        toast.error(getErrorMessage(error, "操作失败，请稍后重试。"))
      }
    },
    [invalidateProducts, updateProductMutation]
  )

  // Product delete actions
  const requestProductDelete = React.useCallback((product: ProductPublic) => {
    setProductDeleteTarget(product)
    setProductDeleteError(null)
  }, [])

  const closeProductDeleteDialog = React.useCallback(() => {
    if (isProductDeleting) return

    setProductDeleteTarget(null)
    setProductDeleteError(null)
  }, [isProductDeleting])

  const confirmProductDelete = React.useCallback(async () => {
    if (!productDeleteTarget) return

    setProductDeleteError(null)

    try {
      await deleteProductMutation.mutateAsync({ productId: productDeleteTarget.id })
      toast.success("商品已删除")
      await invalidateProducts()
      closeProductDeleteDialog()
    } catch (error) {
      setProductDeleteError(getErrorMessage(error, "删除商品失败，请稍后重试。"))
    }
  }, [closeProductDeleteDialog, deleteProductMutation, invalidateProducts, productDeleteTarget])

  // SKU sheet actions
  const openSkuSheet = React.useCallback((productId: string) => {
    setSelectedProductId(productId)
  }, [])

  const closeSkuSheet = React.useCallback(() => {
    setSelectedProductId(null)
    setSkuDialogOpen(false)
    setEditingSku(null)
    setSkuForm(DEFAULT_SKU_FORM)
    setSkuFormError(null)
    setSkuDeleteTarget(null)
    setSkuDeleteError(null)
  }, [])

  // SKU dialog actions
  const openCreateSkuDialog = React.useCallback(() => {
    setSkuDialogMode("create")
    setEditingSku(null)
    setSkuForm(DEFAULT_SKU_FORM)
    setSkuFormError(null)
    setSkuDialogOpen(true)
  }, [])

  const openEditSkuDialog = React.useCallback((sku: SKUPublic) => {
    setSkuDialogMode("edit")
    setEditingSku(sku)
    setSkuForm(toSkuFormValues(sku))
    setSkuFormError(null)
    setSkuDialogOpen(true)
  }, [])

  const closeSkuDialog = React.useCallback(() => {
    if (isSkuSubmitting) return

    setSkuDialogOpen(false)
    setEditingSku(null)
    setSkuForm(DEFAULT_SKU_FORM)
    setSkuFormError(null)
  }, [isSkuSubmitting])

  const setSkuField = React.useCallback((field: keyof SkuFormValues, value: string) => {
    setSkuForm((current) => ({ ...current, [field]: value }))
    setSkuFormError(null)
  }, [])

  const submitSkuForm = React.useCallback(async () => {
    if (!skuForm.sku_code.trim()) {
      setSkuFormError("请填写 SKU 编码。")
      return
    }

    if (!selectedProductId) return

    setSkuFormError(null)

    try {
      if (skuDialogMode === "create") {
        await createSkuMutation.mutateAsync({
          data: {
            product_id: selectedProductId,
            sku_code: skuForm.sku_code.trim(),
            spec_name: skuForm.spec_name.trim() || null,
            barcode: skuForm.barcode.trim() || null,
            price: skuForm.price.trim() || undefined,
            cost_price: skuForm.cost_price.trim() || undefined,
            is_active: skuForm.is_active === "true",
          } satisfies SKUCreate,
        })
        toast.success("SKU 已创建")
      } else {
        if (!editingSku) return

        await updateSkuMutation.mutateAsync({
          skuId: editingSku.id,
          data: {
            sku_code: skuForm.sku_code.trim(),
            spec_name: skuForm.spec_name.trim() || null,
            barcode: skuForm.barcode.trim() || null,
            price: skuForm.price.trim() || null,
            cost_price: skuForm.cost_price.trim() || null,
            is_active: skuForm.is_active === "true",
          } satisfies SKUUpdate,
        })
        toast.success("SKU 已更新")
      }

      await invalidateSkus(selectedProductId)
      closeSkuDialog()
    } catch (error) {
      const fallback =
        skuDialogMode === "create" ? "创建 SKU 失败，请稍后重试。" : "保存 SKU 失败，请稍后重试。"
      setSkuFormError(getErrorMessage(error, fallback))
    }
  }, [
    closeSkuDialog,
    createSkuMutation,
    editingSku,
    invalidateSkus,
    selectedProductId,
    skuDialogMode,
    skuForm,
    updateSkuMutation,
  ])

  // SKU delete actions
  const requestSkuDelete = React.useCallback((sku: SKUPublic) => {
    setSkuDeleteTarget(sku)
    setSkuDeleteError(null)
  }, [])

  const closeSkuDeleteDialog = React.useCallback(() => {
    if (isSkuDeleting) return

    setSkuDeleteTarget(null)
    setSkuDeleteError(null)
  }, [isSkuDeleting])

  const confirmSkuDelete = React.useCallback(async () => {
    if (!skuDeleteTarget || !selectedProductId) return

    setSkuDeleteError(null)

    try {
      await deleteSkuMutation.mutateAsync({ skuId: skuDeleteTarget.id })
      toast.success("SKU 已删除")
      await invalidateSkus(selectedProductId)
      closeSkuDeleteDialog()
    } catch (error) {
      setSkuDeleteError(getErrorMessage(error, "删除 SKU 失败，请稍后重试。"))
    }
  }, [closeSkuDeleteDialog, deleteSkuMutation, invalidateSkus, selectedProductId, skuDeleteTarget])

  return {
    // Permissions
    canReadProduct,
    canCreateProduct,
    canUpdateProduct,
    canDeleteProduct,
    canReadSku,
    canCreateSku,
    canUpdateSku,
    canDeleteSku,
    // Data
    categories,
    products,
    skus,
    selectedProduct,
    selectedProductId,
    // Queries
    categoriesQuery,
    productsQuery,
    skusQuery,
    // Filters
    filterCategoryId,
    filterStatus,
    setFilterCategoryId,
    setFilterStatus,
    // Product dialog
    productDialogOpen,
    productDialogMode,
    editingProduct,
    productForm,
    productFormError,
    isProductSubmitting,
    openCreateProductDialog,
    openEditProductDialog,
    closeProductDialog,
    setProductField,
    submitProductForm,
    toggleProductStatus,
    // Product delete
    productDeleteTarget,
    productDeleteError,
    isProductDeleting,
    requestProductDelete,
    closeProductDeleteDialog,
    confirmProductDelete,
    // SKU sheet
    openSkuSheet,
    closeSkuSheet,
    // SKU dialog
    skuDialogOpen,
    skuDialogMode,
    editingSku,
    skuForm,
    skuFormError,
    isSkuSubmitting,
    openCreateSkuDialog,
    openEditSkuDialog,
    closeSkuDialog,
    setSkuField,
    submitSkuForm,
    // SKU delete
    skuDeleteTarget,
    skuDeleteError,
    isSkuDeleting,
    requestSkuDelete,
    closeSkuDeleteDialog,
    confirmSkuDelete,
  }
}
