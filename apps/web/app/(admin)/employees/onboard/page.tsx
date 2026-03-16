"use client"

import * as React from "react"
import {
  BriefcaseBusiness,
  KeyRound,
  PencilLine,
  Plus,
  RefreshCw,
  Shield,
  UserMinus,
  Users,
} from "lucide-react"

import { useEmployeeOnboardLogic } from "./use-employee-onboard-logic"

import type { RolePublic } from "@/api/generated/workspace.schemas"
import { PermissionDenied } from "@/components/permission-denied"
import { cn } from "@workspace/ui/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Checkbox,
} from "@workspace/ui/components/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
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
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import { DataTablePagination } from "@workspace/ui/components/primitives"

function getRoleBadgeVariant(role: RolePublic): "default" | "secondary" | "outline" | "destructive" {
  const text = `${role.code ?? ""} ${role.name}`.toLowerCase()

  if (text.includes("admin") || text.includes("管理员")) {
    return "default"
  }

  if (text.includes("manager") || text.includes("经理")) {
    return "secondary"
  }

  return "outline"
}

function RoleBadges({
  roles,
  isLoading,
}: {
  roles: RolePublic[]
  isLoading: boolean
}) {
  if (isLoading) {
    return <span className="text-xs text-muted-foreground">角色加载中...</span>
  }

  if (!roles.length) {
    return <span className="text-xs text-muted-foreground">未分配</span>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <Badge key={role.id} variant={getRoleBadgeVariant(role)}>
          {role.name}
        </Badge>
      ))}
    </div>
  )
}

function getAccountStatusLabel(status?: string | null) {
  if (status === "ACTIVE") {
    return "可登录"
  }

  if (status === "DISABLED") {
    return "已禁用"
  }

  return status || "-"
}

function getEmploymentStatusLabel(status?: string | null) {
  if (status === "ACTIVE") {
    return "在职"
  }

  if (status === "LEFT") {
    return "已离职"
  }

  return status || "-"
}

function EmployeeTree({
  nodes,
  onEdit,
  onPositionChange,
  onRoleSettings,
  onResetPassword,
  onLeaveEmployee,
  getMemberRoles,
  isMemberRolesLoading,
  canManageRoles,
  canEditEmployees,
  canBindEmployees,
  canResetPassword,
  canLeaveEmployees,
}: {
  nodes: ReturnType<typeof useEmployeeOnboardLogic>["memberTree"]
  onEdit: (member: ReturnType<typeof useEmployeeOnboardLogic>["members"][number]) => void
  onPositionChange: (member: ReturnType<typeof useEmployeeOnboardLogic>["members"][number]) => void
  onRoleSettings: (member: ReturnType<typeof useEmployeeOnboardLogic>["members"][number]) => void
  onResetPassword: (member: ReturnType<typeof useEmployeeOnboardLogic>["members"][number]) => void
  onLeaveEmployee: (member: ReturnType<typeof useEmployeeOnboardLogic>["members"][number]) => void
  getMemberRoles: ReturnType<typeof useEmployeeOnboardLogic>["getMemberRoles"]
  isMemberRolesLoading: ReturnType<typeof useEmployeeOnboardLogic>["isMemberRolesLoading"]
  canManageRoles: boolean
  canEditEmployees: boolean
  canBindEmployees: boolean
  canResetPassword: boolean
  canLeaveEmployees: boolean
}) {
  if (!nodes.length) {
    return null
  }

  return (
    <div className="grid gap-4">
      {nodes.map((item) => (
        <div key={item.node.id} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-semibold text-foreground">{item.node.name}</div>
            <Badge variant="outline" className="text-muted-foreground">{item.node.node_type}</Badge>
            <span className="text-xs text-muted-foreground font-mono">{item.node.store_id}</span>
          </div>

          {item.members.length ? (
            <div className="mt-4 grid gap-3">
              {item.members.map((member) => (
                <div
                  key={member.user.id}
                  className="rounded-lg border border-border/50 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">
                        {member.user.full_name || member.user.username}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {member.position_name || "未设岗位"} · <span className="font-mono">{member.employee_no || "无工号"}</span> ·{" "}
                        {getEmploymentStatusLabel(member.employment_status)}
                      </div>
                      <div className="mt-2">
                        <RoleBadges
                          roles={getMemberRoles(member.user.id)}
                          isLoading={isMemberRolesLoading(member.user.id)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canEditEmployees ? (
                        <Button variant="outline" size="sm" onClick={() => onEdit(member)}>
                          <PencilLine />
                          编辑
                        </Button>
                      ) : null}
                      {canBindEmployees ? (
                        <Button variant="outline" size="sm" onClick={() => onPositionChange(member)}>
                          <BriefcaseBusiness />
                          岗位变更
                        </Button>
                      ) : null}
                      {canManageRoles ? (
                        <Button variant="outline" size="sm" onClick={() => onRoleSettings(member)}>
                          <Shield />
                          角色设置
                        </Button>
                      ) : null}
                      {canResetPassword ? (
                        <Button variant="outline" size="sm" onClick={() => onResetPassword(member)}>
                          <KeyRound />
                          重置密码
                        </Button>
                      ) : null}
                      {canLeaveEmployees && member.employment_status !== "LEFT" ? (
                        <Button variant="outline" size="sm" onClick={() => onLeaveEmployee(member)}>
                          <UserMinus />
                          办理离职
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {item.children.length ? (
            <div className="mt-4 border-l border-border/70 pl-4">
              <EmployeeTree
                nodes={item.children}
                onEdit={onEdit}
                onPositionChange={onPositionChange}
                onRoleSettings={onRoleSettings}
                onResetPassword={onResetPassword}
                onLeaveEmployee={onLeaveEmployee}
                getMemberRoles={getMemberRoles}
                isMemberRolesLoading={isMemberRolesLoading}
                canManageRoles={canManageRoles}
                canEditEmployees={canEditEmployees}
                canBindEmployees={canBindEmployees}
                canResetPassword={canResetPassword}
                canLeaveEmployees={canLeaveEmployees}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export default function EmployeeOnboardPage() {
  const logic = useEmployeeOnboardLogic()
  const [viewMode, setViewMode] = React.useState<"list" | "tree">("list")
  const [page, setPage] = React.useState(1)
  const pageSize = 10

  const currentMembers = React.useMemo(() => {
    return logic.members.slice((page - 1) * pageSize, page * pageSize)
  }, [logic.members, page, pageSize])

  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(logic.members.length / pageSize))
    if (page > maxPage) {
      setPage(maxPage)
    }
  }, [logic.members.length, page, pageSize])

  if (!logic.canViewPage) {
    return (
      <PermissionDenied description="当前账号缺少 `employee.read`，暂时无法查看员工页面。" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">员工列表</h1>
          <p className="text-sm text-muted-foreground">
            {logic.currentOrgNodeName
              ? `当前组织：${logic.currentOrgNodeName}`
              : "展示当前组织上下文下的员工列表。"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void logic.refresh()}
            disabled={logic.isFetching || !logic.hasContext}
            className="h-9"
          >
            <RefreshCw className={cn("mr-2 size-3.5", logic.isFetching && "animate-spin")} />
            刷新
          </Button>
          {logic.canCreateEmployees ? (
            <Button onClick={logic.openCreate} disabled={!logic.hasContext} size="sm" className="h-9">
              <Plus className="mr-2 size-3.5" />
              新增员工
            </Button>
          ) : null}
        </div>
      </div>

      {logic.createSuccess ? (
        <Alert>
          <AlertTitle>操作成功</AlertTitle>
          <AlertDescription>{logic.createSuccess}</AlertDescription>
        </Alert>
      ) : null}

      {!logic.hasContext ? (
        <Empty className="border-border/50 bg-muted/10 transition-colors hover:bg-muted/20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>缺少当前组织</EmptyTitle>
            <EmptyDescription>当前用户没有 `current_org_node_id`，暂时无法展示员工列表。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : logic.isLoading ? (
        <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="grid gap-3 pt-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-4/5" />
          </CardContent>
        </Card>
      ) : logic.isError ? (
        <Alert variant="destructive">
          <AlertTitle>员工列表加载失败</AlertTitle>
          <AlertDescription>{logic.errorMessage}</AlertDescription>
        </Alert>
      ) : logic.members.length === 0 ? (
        <Empty className="border-border/50 bg-muted/10 transition-colors hover:bg-muted/20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>暂无员工</EmptyTitle>
            <EmptyDescription>当前组织下还没有可展示的员工。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/10 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-medium">员工列表</CardTitle>
                  <CardDescription className="text-xs">支持列表展示和树状展示。</CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="h-6">{logic.members.length} 人</Badge>
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "tree")}>
                  <TabsList className="h-8">
                    <TabsTrigger value="list" className="h-7 text-xs">列表</TabsTrigger>
                    <TabsTrigger value="tree" className="h-7 text-xs">树状</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent className={cn("p-6", viewMode === "list" && "p-0")}>
            {viewMode === "list" ? (
              <div className="border-t border-border/50 first:border-t-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-10 pl-6">员工</TableHead>
                      <TableHead className="h-10">手机号</TableHead>
                      <TableHead className="h-10">员工编号</TableHead>
                      <TableHead className="h-10">岗位</TableHead>
                      <TableHead className="h-10">角色</TableHead>
                      <TableHead className="h-10">组织</TableHead>
                      <TableHead className="h-10">门店</TableHead>
                      <TableHead className="h-10">任职状态</TableHead>
                      <TableHead className="h-10">账号状态</TableHead>
                      <TableHead className="h-10 pr-6 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentMembers.map((member) => (
                      <TableRow key={member.user.id} className="hover:bg-muted/30">
                        <TableCell className="pl-6">
                          <div className="grid gap-1">
                            <div className="font-medium text-foreground">
                              {member.user.full_name || member.user.username}
                            </div>
                            <div className="text-xs text-muted-foreground">{member.user.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>{member.user.mobile || "-"}</TableCell>
                        <TableCell>{member.employee_no || "-"}</TableCell>
                        <TableCell>{member.position_name || "-"}</TableCell>
                        <TableCell>
                          <RoleBadges
                            roles={logic.getMemberRoles(member.user.id)}
                            isLoading={logic.isMemberRolesLoading(member.user.id)}
                          />
                        </TableCell>
                        <TableCell>{member.org_node_name}</TableCell>
                        <TableCell>{member.store_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {getEmploymentStatusLabel(member.employment_status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.user.status === "ACTIVE" ? "secondary" : "outline"} className="font-normal">
                            {getAccountStatusLabel(member.user.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex justify-end">
                            <div className="flex flex-wrap gap-1">
                              {logic.canUpdateEmployees ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => logic.openEdit(member)}
                                  title="编辑"
                                >
                                  <PencilLine className="size-4" />
                                </Button>
                              ) : null}
                              {logic.canBindEmployees ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => logic.openPositionChange(member)}
                                  title="岗位变更"
                                >
                                  <BriefcaseBusiness className="size-4" />
                                </Button>
                              ) : null}
                              {logic.canManageRoles ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => logic.openRoleSettings(member)}
                                  title="角色设置"
                                >
                                  <Shield className="size-4" />
                                </Button>
                              ) : null}
                              {logic.canResetPassword ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => logic.openResetPassword(member)}
                                  title="重置密码"
                                >
                                  <KeyRound className="size-4" />
                                </Button>
                              ) : null}
                              {logic.canLeaveEmployees && member.employment_status !== "LEFT" ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => logic.openLeaveEmployee(member)}
                                  title="办理离职"
                                >
                                  <UserMinus className="size-4" />
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <DataTablePagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={logic.members.length}
                  onPageChange={setPage}
                />
              </div>
            ) : (
              <EmployeeTree
                nodes={logic.memberTree}
                onEdit={logic.openEdit}
                onPositionChange={logic.openPositionChange}
                onRoleSettings={logic.openRoleSettings}
                onResetPassword={logic.openResetPassword}
                onLeaveEmployee={logic.openLeaveEmployee}
                getMemberRoles={logic.getMemberRoles}
                isMemberRolesLoading={logic.isMemberRolesLoading}
                canManageRoles={logic.canManageRoles}
                canEditEmployees={logic.canUpdateEmployees}
                canBindEmployees={logic.canBindEmployees}
                canResetPassword={logic.canResetPassword}
                canLeaveEmployees={logic.canLeaveEmployees}
              />
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={logic.createOpen} onOpenChange={(open) => !open && logic.closeCreate()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>新增员工</DialogTitle>
            <DialogDescription>只能添加到当前组织范围内的组织节点。</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>登录账号</FieldLabel>
              <Input
                value={logic.createForm.username}
                onChange={(event) => logic.setCreateField("username", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>初始密码</FieldLabel>
              <Input
                type="password"
                value={logic.createForm.password}
                onChange={(event) => logic.setCreateField("password", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>姓名</FieldLabel>
              <Input
                value={logic.createForm.fullName}
                onChange={(event) => logic.setCreateField("fullName", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>手机号</FieldLabel>
              <Input
                value={logic.createForm.mobile}
                onChange={(event) => logic.setCreateField("mobile", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>岗位名称</FieldLabel>
              <Input
                value={logic.createForm.positionName}
                onChange={(event) => logic.setCreateField("positionName", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>组织节点</FieldLabel>
              <Select
                value={logic.createForm.primaryOrgNodeId}
                onValueChange={(value) => logic.setCreateField("primaryOrgNodeId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择组织节点" />
                </SelectTrigger>
                <SelectContent>
                  {logic.allowedOrgNodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {logic.createError ? (
            <Alert variant="destructive">
              <AlertTitle>新增失败</AlertTitle>
              <AlertDescription>{logic.createError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={logic.closeCreate}>
              取消
            </Button>
            {logic.canCreateEmployees ? (
              <Button onClick={() => void logic.submitCreate()} disabled={logic.isCreating}>
                {logic.isCreating ? "提交中..." : "确认新增"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logic.editOpen} onOpenChange={(open) => !open && logic.closeEdit()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>编辑员工</DialogTitle>
            <DialogDescription>修改当前员工的基础信息。</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>登录账号</FieldLabel>
              <Input
                value={logic.editForm.username}
                onChange={(event) => logic.setEditField("username", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>姓名</FieldLabel>
              <Input
                value={logic.editForm.fullName}
                onChange={(event) => logic.setEditField("fullName", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>昵称</FieldLabel>
              <Input
                value={logic.editForm.nickname}
                onChange={(event) => logic.setEditField("nickname", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>手机号</FieldLabel>
              <Input
                value={logic.editForm.mobile}
                onChange={(event) => logic.setEditField("mobile", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>账号状态</FieldLabel>
              <Select
                value={logic.editForm.status}
                onValueChange={(value) => logic.setEditField("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择账号状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">可登录</SelectItem>
                  <SelectItem value="DISABLED">已禁用</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>账号启用</FieldLabel>
              <Select
                value={logic.editForm.isActive ? "true" : "false"}
                onValueChange={(value) => logic.setEditField("isActive", value === "true")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择账号启用状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">启用</SelectItem>
                  <SelectItem value="false">停用</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {logic.editError ? (
            <Alert variant="destructive">
              <AlertTitle>编辑失败</AlertTitle>
              <AlertDescription>{logic.editError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={logic.closeEdit}>
              取消
            </Button>
            {logic.canUpdateEmployees ? (
              <Button onClick={() => void logic.submitEdit()} disabled={logic.isEditing}>
                {logic.isEditing ? "保存中..." : "保存"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={logic.positionOpen}
        onOpenChange={(open) => !open && logic.closePositionChange()}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>岗位变更</DialogTitle>
            <DialogDescription>统一使用岗位绑定更新接口，只提交实际改动的字段。</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>岗位绑定</FieldLabel>
              <Select
                value={logic.positionForm.bindingId}
                onValueChange={(value) => {
                  const binding = logic.memberBindings.find((item) => item.id === value)
                  if (!binding) {
                    return
                  }

                  logic.setPositionField("bindingId", binding.id)
                  logic.setPositionField("orgNodeId", binding.org_node_id)
                  logic.setPositionField("positionName", binding.position_name ?? "")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择岗位绑定" />
                </SelectTrigger>
                <SelectContent>
                  {logic.memberBindings.map((binding) => (
                    <SelectItem key={binding.id} value={binding.id}>
                      {(binding.position_name || "未命名岗位") + (binding.is_primary ? " · 主归属" : "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>组织节点</FieldLabel>
              <Select
                value={logic.positionForm.orgNodeId}
                onValueChange={(value) => logic.setPositionField("orgNodeId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择组织节点" />
                </SelectTrigger>
                <SelectContent>
                  {logic.allowedOrgNodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>岗位名称</FieldLabel>
              <Input
                value={logic.positionForm.positionName}
                onChange={(event) => logic.setPositionField("positionName", event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>说明</FieldLabel>
              <div className="rounded-xl border border-border/70 px-3 py-2 text-sm text-muted-foreground">
                岗位变更统一走绑定更新接口，只提交你改动过的字段。
              </div>
            </Field>
          </FieldGroup>

          {logic.positionError ? (
            <Alert variant="destructive">
              <AlertTitle>岗位变更失败</AlertTitle>
              <AlertDescription>{logic.positionError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={logic.closePositionChange}>
              取消
            </Button>
            {logic.canBindEmployees ? (
              <Button
                onClick={() => void logic.submitPositionChange()}
                disabled={logic.isChangingPosition}
              >
                {logic.isChangingPosition ? "保存中..." : "确认变更"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logic.roleOpen} onOpenChange={(open) => !open && logic.closeRoleSettings()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>角色设置</DialogTitle>
            <DialogDescription>按权限展示入口，并使用用户角色分配接口保存。</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            {logic.availableRoles.length === 0 ? (
              <Field>
                <div className="rounded-xl border border-border/70 px-3 py-2 text-sm text-muted-foreground">
                  当前没有可分配角色。
                </div>
              </Field>
            ) : (
              logic.availableRoles.map((role) => {
                const checked = logic.selectedRoleIds.includes(role.id)

                return (
                  <Field key={role.id}>
                    <label className="flex items-start gap-3 rounded-xl border border-border/70 px-3 py-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => logic.toggleRole(role.id, value === true)}
                      />
                      <div className="grid gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{role.name}</span>
                          <Badge variant={getRoleBadgeVariant(role)}>
                            {role.code}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {role.status || "ACTIVE"}
                        </div>
                      </div>
                    </label>
                  </Field>
                )
              })
            )}
          </FieldGroup>

          {logic.roleError ? (
            <Alert variant="destructive">
              <AlertTitle>角色设置失败</AlertTitle>
              <AlertDescription>{logic.roleError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={logic.closeRoleSettings}>
              取消
            </Button>
            <Button
              onClick={() => void logic.submitRoleSettings()}
              disabled={logic.isAssigningRoles}
            >
              {logic.isAssigningRoles ? "保存中..." : "保存角色"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={logic.resetPasswordOpen}
        onOpenChange={(open) => !open && logic.closeResetPassword()}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>为当前员工设置新的登录密码。</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>新密码</FieldLabel>
              <Input
                type="password"
                value={logic.resetPasswordForm.newPassword}
                onChange={(event) => logic.setResetPasswordField("newPassword", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>确认新密码</FieldLabel>
              <Input
                type="password"
                value={logic.resetPasswordForm.confirmPassword}
                onChange={(event) =>
                  logic.setResetPasswordField("confirmPassword", event.target.value)
                }
              />
            </Field>
          </FieldGroup>

          {logic.resetPasswordError ? (
            <Alert variant="destructive">
              <AlertTitle>重置密码失败</AlertTitle>
              <AlertDescription>{logic.resetPasswordError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={logic.closeResetPassword}>
              取消
            </Button>
            {logic.canResetPassword ? (
              <Button
                onClick={() => void logic.submitResetPassword()}
                disabled={logic.isResettingPassword}
              >
                {logic.isResettingPassword ? "提交中..." : "确认重置"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logic.leaveOpen} onOpenChange={(open) => !open && logic.closeLeaveEmployee()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>办理离职</DialogTitle>
            <DialogDescription>提交后员工任职状态将从在职变为已离职。</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>离职时间</FieldLabel>
              <Input
                type="datetime-local"
                value={logic.leaveForm.leftAt}
                onChange={(event) => logic.setLeaveField("leftAt", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>离职原因</FieldLabel>
              <Textarea
                rows={4}
                value={logic.leaveForm.leaveReason}
                onChange={(event) => logic.setLeaveField("leaveReason", event.target.value)}
              />
            </Field>
          </FieldGroup>

          {logic.leaveError ? (
            <Alert variant="destructive">
              <AlertTitle>办理离职失败</AlertTitle>
              <AlertDescription>{logic.leaveError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={logic.closeLeaveEmployee}>
              取消
            </Button>
            {logic.canLeaveEmployees ? (
              <Button
                variant="destructive"
                onClick={() => void logic.submitLeaveEmployee()}
                disabled={logic.isLeavingEmployee}
              >
                {logic.isLeavingEmployee ? "提交中..." : "确认离职"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
