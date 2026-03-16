"use client"

import * as React from "react"
import {
  Building2,
  GitBranch,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"

export type StoreOrganizationNode = {
  id: string
  parentId?: string | null
  name: string
  typeLabel: string
  isActive?: boolean | null
  sortOrder?: number | null
  prefix?: string | null
  level?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

type TreeNode = StoreOrganizationNode & {
  children: TreeNode[]
}

export interface StoreOrganizationTreeProps {
  storeName: string
  storeStatusLabel: string
  storeStatusVariant?: "default" | "secondary" | "outline" | "destructive"
  nodes: StoreOrganizationNode[]
  onEditStore?: () => void
  onDeleteStore?: () => void
  onCreateNode?: () => void
  onEditNode?: (node: StoreOrganizationNode) => void
  onDeleteNode?: (node: StoreOrganizationNode) => void
}

function compareNodeOrder(left: StoreOrganizationNode, right: StoreOrganizationNode) {
  if ((left.sortOrder ?? 0) !== (right.sortOrder ?? 0)) {
    return (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
  }

  return left.name.localeCompare(right.name, "zh-CN")
}

function sortTreeNode(node: TreeNode): TreeNode {
  return {
    ...node,
    children: [...node.children]
      .map((child) => sortTreeNode(child))
      .sort((left, right) => compareNodeOrder(left, right)),
  }
}

function buildNodeTree(nodes: StoreOrganizationNode[]) {
  const map = new Map<string, TreeNode>()

  for (const node of nodes) {
    map.set(node.id, { ...node, children: [] })
  }

  const roots: TreeNode[] = []

  for (const node of nodes) {
    const current = map.get(node.id)

    if (!current) {
      continue
    }

    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)?.children.push(current)
      continue
    }

    roots.push(current)
  }

  return roots
    .map((node) => sortTreeNode(node))
    .sort((left, right) => compareNodeOrder(left, right))
}

function TreeBranch({
  node,
  depth,
  onEditNode,
  onDeleteNode,
}: {
  node: TreeNode
  depth: number
  onEditNode?: (node: StoreOrganizationNode) => void
  onDeleteNode?: (node: StoreOrganizationNode) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        {depth > 0 ? (
          <>
            <div
              aria-hidden="true"
              className="absolute top-0 bottom-1/2 w-px bg-border"
              style={{ left: `${depth * 24 - 12}px` }}
            />
            <div
              aria-hidden="true"
              className="absolute top-1/2 h-px bg-border"
              style={{ left: `${depth * 24 - 12}px`, width: "12px" }}
            />
          </>
        ) : null}

        <div
          className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-muted/50">
              <GitBranch className="size-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="font-medium text-foreground">{node.name}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{node.typeLabel}</span>
                {node.prefix ? (
                  <>
                    <span className="text-border/50">|</span>
                    <span className="font-mono">前缀: {node.prefix}</span>
                  </>
                ) : null}
                {node.level !== undefined && node.level !== null ? (
                  <>
                    <span className="text-border/50">|</span>
                    <span>层级: {node.level}</span>
                  </>
                ) : null}
                {node.sortOrder !== undefined && node.sortOrder !== null ? (
                  <>
                    <span className="text-border/50">|</span>
                    <span>排序: {node.sortOrder}</span>
                  </>
                ) : null}
                {node.createdAt ? (
                  <>
                    <span className="text-border/50">|</span>
                    <span>创建于: {new Date(node.createdAt).toLocaleDateString("zh-CN")}</span>
                  </>
                ) : null}
                <Badge variant={node.isActive === false ? "secondary" : "outline"} className="ml-1 h-5 px-1.5 text-[10px]">
                  {node.isActive === false ? "停用" : "启用"}
                </Badge>
              </div>
            </div>
          </div>

          {onEditNode || onDeleteNode ? (
            <div className="flex items-center gap-2">
              {onEditNode ? (
                <Button variant="outline" size="icon-sm" onClick={() => onEditNode(node)}>
                  <Pencil />
                </Button>
              ) : null}
              {onDeleteNode ? (
                <Button variant="destructive" size="icon-sm" onClick={() => onDeleteNode(node)}>
                  <Trash2 />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {node.children.length > 0 ? (
        <div className="flex flex-col gap-3">
          {node.children.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              onEditNode={onEditNode}
              onDeleteNode={onDeleteNode}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function StoreOrganizationTree({
  storeName,
  storeStatusLabel,
  storeStatusVariant = "outline",
  nodes,
  onEditStore,
  onDeleteStore,
  onCreateNode,
  onEditNode,
  onDeleteNode,
}: StoreOrganizationTreeProps) {
  const tree = React.useMemo(() => buildNodeTree(nodes), [nodes])

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-muted/40">
            <Building2 className="size-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">{storeName}</CardTitle>
              <Badge variant={storeStatusVariant}>{storeStatusLabel}</Badge>
            </div>
            <CardDescription>{nodes.length} 个组织挂载在当前门店下</CardDescription>
          </div>
        </div>

        {onEditStore || onCreateNode || onDeleteStore ? (
          <div className="flex flex-wrap items-center gap-2">
            {onEditStore ? (
              <Button variant="outline" onClick={onEditStore}>
                <Pencil data-icon="inline-start" />
                编辑门店
              </Button>
            ) : null}
            {onCreateNode ? (
              <Button onClick={onCreateNode}>
                <Plus data-icon="inline-start" />
                新增组织
              </Button>
            ) : null}
            {onDeleteStore ? (
              <Button variant="destructive" onClick={onDeleteStore}>
                <Trash2 data-icon="inline-start" />
                删除门店
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <Separator />

        {tree.length === 0 ? (
          <div className="flex min-h-28 items-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
            当前门店还没有挂组织，先新增一个根组织开始搭结构。
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tree.map((node) => (
              <TreeBranch
                key={node.id}
                node={node}
                depth={0}
                onEditNode={onEditNode}
                onDeleteNode={onDeleteNode}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
