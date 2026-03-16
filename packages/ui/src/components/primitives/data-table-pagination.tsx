"use client"

import * as React from "react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"

export function DataTablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/10">
      <div className="text-xs text-muted-foreground">
        共 {totalItems} 条，当前第 {page} / {totalPages} 页
      </div>
      <Pagination className="w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                if (page > 1) onPageChange(page - 1)
              }}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              text="上一页"
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                if (page < totalPages) onPageChange(page + 1)
              }}
              className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              text="下一页"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
