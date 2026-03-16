"use client"

import * as React from "react"
import { AlertCircle, CircleDot, LocateFixed, RefreshCw, Store, UserRound } from "lucide-react"

import type { DashboardLogic } from "@/app/(admin)/use-dashboard-logic"
import { EmptyDataCard } from "@/components/console-page"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { DataTablePagination } from "@workspace/ui/components/primitives"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
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

export function DashboardView({ logic }: { logic: DashboardLogic }) {
  if (logic.isLoading) {
    return <DashboardLoadingState />
  }

  if (logic.error) {
    return <DashboardErrorState error={logic.error} onRetry={logic.retry} />
  }

  if (logic.isEmpty || !logic.profile) {
    return (
      <div className="flex flex-col gap-5">
        <DashboardHeader
          title="工作台"
          subtitle="当前还没有可展示的门店和岗位信息。"
        />
        <EmptyDataCard
          title="暂无工作台数据"
          description="请确认当前账号已经绑定门店、部门和岗位。"
        />
      </div>
    )
  }

  const profile = logic.profile
  const memberships = profile.memberships
  const roleBlock = logic.summary.blocks.find((block) => block.title === "角色摘要")

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title={`早安，${profile.displayName}`}
        subtitle={`${roleBlock?.items[0] ?? "门店员工"} · 祝你今天工作愉快`}
      />

      <StatsCards logic={logic} />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <MembershipsCard memberships={memberships} />
          
          {/* 预留区域：未来添加的业务模块 */}
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/5 text-sm text-muted-foreground">
            更多业务模块开发中...
          </div>
        </div>

        <div className="space-y-6">
          <QuickActionsCard logic={logic} />
        </div>
      </div>
    </div>
  )
}

function DashboardHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  const today = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date())

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="text-sm font-medium text-muted-foreground">
        {today}
      </div>
    </div>
  )
}

function StatsCards({ logic }: { logic: DashboardLogic }) {
  const profile = logic.profile

  if (!profile) {
    return null
  }

  const [currentStore, currentOrg, primaryStore, primaryDepartment] = profile.contextItems
  const lastLogin = profile.infoItems.find((item) => item.label === "最近登录")

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsItem
        icon={<Store className="size-4" />}
        label="当前门店"
        value={currentStore?.value ?? "未设置"}
      />
      <StatsItem
        icon={<UserRound className="size-4" />}
        label="所属部门"
        value={currentOrg?.value ?? "未设置"}
      />
      <StatsItem
        icon={<LocateFixed className="size-4" />}
        label="常驻门店"
        value={primaryStore?.value ?? "未设置"}
        subValue={primaryDepartment?.value}
      />
      <StatsItem
        icon={<RefreshCw className="size-4" />}
        label="最近登录"
        value={lastLogin?.value ?? "暂无"}
      />
    </div>
  )
}

function StatsItem({
  label,
  value,
  subValue,
  icon,
}: {
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
}) {
  return (
    <Card className="border-border/50 shadow-sm transition-all hover:border-border/80 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="mt-3 truncate text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </div>
        {subValue ? (
          <div className="mt-1 truncate text-xs text-muted-foreground">{subValue}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function MembershipsCard({
  memberships,
}: {
  memberships: Array<{
    title: string
    description: string
    badges: string[]
  }>
}) {
  const [page, setPage] = React.useState(1)
  const pageSize = 5
  const currentMemberships = React.useMemo(() => {
    return memberships.slice((page - 1) * pageSize, page * pageSize)
  }, [memberships, page, pageSize])

  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(memberships.length / pageSize))
    if (page > maxPage) {
      setPage(maxPage)
    }
  }, [memberships.length, page, pageSize])

  return (
    <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-2">
          <UserRound className="size-5 text-muted-foreground" />
          <CardTitle className="text-base font-medium">我的任职信息</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {memberships.length > 0 ? (
          <div className="flex flex-col">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 pl-6">门店</TableHead>
                  <TableHead className="h-10">部门</TableHead>
                  <TableHead className="h-10">岗位</TableHead>
                  <TableHead className="h-10 pr-6 text-right">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentMemberships.map((membership) => {
                  const [department, position] = membership.description.split(" · ")

                  return (
                    <TableRow key={`${membership.title}-${membership.description}`} className="hover:bg-muted/30">
                      <TableCell className="pl-6 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{membership.title}</span>
                          {membership.badges.includes("主归属") ? (
                            <Badge
                              variant="secondary"
                              className="h-5 bg-primary/10 px-1.5 text-[10px] text-primary hover:bg-primary/20 dark:bg-primary/20"
                            >
                              主岗
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{department || "-"}</TableCell>
                      <TableCell>{position || "-"}</TableCell>
                      <TableCell className="pr-6 text-right">
                        {membership.badges.includes("当前门店") ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            值班中
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">已关联</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              totalItems={memberships.length}
              onPageChange={setPage}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
            <UserRound className="mb-2 size-8 opacity-20" />
            <p>暂无任职信息</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuickActionsCard({
  logic,
}: {
  logic: DashboardLogic
}) {
  const storeSwitcher = logic.storeSwitcher

  return (
    <Card className="sticky top-6 border-border/50 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <LocateFixed className="size-5 text-muted-foreground" />
          <CardTitle className="text-base font-medium">快捷操作</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">切换当前门店</div>
          <Select
            disabled={
              storeSwitcher.isDisabled ||
              storeSwitcher.isSubmitting ||
              storeSwitcher.candidates.length === 0
            }
            value={storeSwitcher.value}
            onValueChange={storeSwitcher.onValueChange}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="选择门店" />
            </SelectTrigger>
            <SelectContent>
              {storeSwitcher.candidates.map((candidate) => (
                <SelectItem key={candidate.value} value={candidate.value}>
                  {candidate.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {storeSwitcher.error ? (
            <div className="text-xs text-destructive">
              {storeSwitcher.error}
            </div>
          ) : null}
        </div>

        <Button
          className="h-9 w-full"
          disabled={
            storeSwitcher.isDisabled ||
            storeSwitcher.isSubmitting ||
            storeSwitcher.candidates.length === 0
          }
          onClick={() => void storeSwitcher.onSubmit()}
        >
          {storeSwitcher.isSubmitting ? (
            <RefreshCw className="mr-2 size-3.5 animate-spin" />
          ) : (
            <Store className="mr-2 size-3.5" />
          )}
          {storeSwitcher.buttonLabel}
        </Button>
      </CardContent>
    </Card>
  )
}

function DashboardLoadingState() {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-6 w-[32rem]" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="space-y-5">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-[28rem] rounded-3xl" />
        </div>
      </div>
    </div>
  )
}

function DashboardErrorState({
  error,
  onRetry,
}: {
  error: string
  onRetry: () => Promise<unknown>
}) {
  return (
    <div className="flex flex-col gap-5">
      <DashboardHeader title="工作台" subtitle="当前工作信息加载失败。" />
      <Card className="border-destructive/30 bg-card shadow-sm">
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/5 text-destructive">
            <AlertCircle className="size-5" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">暂时无法打开工作台</h2>
            <p className="max-w-lg text-sm leading-6 text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => void onRetry()}>
            <RefreshCw className="size-4" />
            重新获取
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
