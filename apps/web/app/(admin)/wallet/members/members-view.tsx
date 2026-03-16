"use client"

import * as React from "react"
import { Pencil, Plus, RotateCw, Trash, CreditCard, Eye } from "lucide-react"

import {
  useWalletMembersLogic,
  type MemberFormValues,
  type RechargeFormValues,
} from "@/app/(admin)/wallet/members/use-wallet-members-logic"
import { PermissionDenied } from "@/components/permission-denied"
import type {
  MemberPublic,
  RechargePlanPublic,
  WalletAccountPublic,
  WalletTransactionPublic,
} from "@/api/generated/workspace.schemas"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Textarea } from "@workspace/ui/components/textarea"

function LoadingRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className="hover:bg-transparent">
          {Array.from({ length: cols }).map((__, col) => (
            <TableCell key={col}>
              <Skeleton className="h-5 w-full max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function MemberStatusBadge({ status }: { status?: string | null }) {
  if (status === "INACTIVE") {
    return <Badge variant="destructive">停用</Badge>
  }

  return <Badge variant="default">正常</Badge>
}

function MemberEditorDialog({
  open,
  mode,
  form,
  error,
  isSubmitting,
  onOpenChange,
  onFieldChange,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  form: MemberFormValues
  error: string | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof MemberFormValues, value: string) => void
  onSubmit: () => void
}) {
  const isCreate = mode === "create"
  const memberNoInvalid = Boolean(error) && !form.member_no.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isCreate ? "新建会员" : "编辑会员"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "填写新会员的基本信息。" : "修改会员信息后保存。"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>保存失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={memberNoInvalid || undefined}>
                <FieldLabel htmlFor="member-no">
                  会员编号
                  <span className="ml-1 text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="member-no"
                  value={form.member_no}
                  onChange={(e) => onFieldChange("member_no", e.target.value)}
                  placeholder="例如：M001"
                  aria-invalid={memberNoInvalid || undefined}
                  disabled={isSubmitting || !isCreate}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="member-name">姓名</FieldLabel>
                <Input
                  id="member-name"
                  value={form.name}
                  onChange={(e) => onFieldChange("name", e.target.value)}
                  placeholder="例如：张三"
                  disabled={isSubmitting}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="member-mobile">手机号</FieldLabel>
                <Input
                  id="member-mobile"
                  value={form.mobile}
                  onChange={(e) => onFieldChange("mobile", e.target.value)}
                  placeholder="例如：13800138000"
                  disabled={isSubmitting}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="member-level">等级</FieldLabel>
                <Input
                  id="member-level"
                  value={form.level}
                  onChange={(e) => onFieldChange("level", e.target.value)}
                  placeholder="例如：VIP1"
                  disabled={isSubmitting}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="member-status">状态</FieldLabel>
              <Select
                value={form.status || "ACTIVE"}
                onValueChange={(value) => onFieldChange("status", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="member-status">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">正常</SelectItem>
                  <SelectItem value="INACTIVE">停用</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "保存中…" : isCreate ? "创建" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RechargeDialog({
  open,
  form,
  error,
  isSubmitting,
  rechargePlans,
  onOpenChange,
  onFieldChange,
  onSubmit,
}: {
  open: boolean
  form: RechargeFormValues
  error: string | null
  isSubmitting: boolean
  rechargePlans: RechargePlanPublic[]
  onOpenChange: (open: boolean) => void
  onFieldChange: (field: keyof RechargeFormValues, value: string) => void
  onSubmit: () => void
}) {
  const planInvalid = Boolean(error) && !form.recharge_plan_id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>会员充值</DialogTitle>
          <DialogDescription>选择充值套餐为会员账户充值。</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>充值失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <Field data-invalid={planInvalid || undefined}>
              <FieldLabel htmlFor="recharge-plan">
                充值套餐
                <span className="ml-1 text-destructive">*</span>
              </FieldLabel>
              <Select
                value={form.recharge_plan_id || ""}
                onValueChange={(value) => onFieldChange("recharge_plan_id", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="recharge-plan" aria-invalid={planInvalid || undefined}>
                  <SelectValue placeholder="请选择套餐" />
                </SelectTrigger>
                <SelectContent>
                  {rechargePlans
                    .filter((plan) => plan.is_active)
                    .map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}（充 {plan.recharge_amount} 送 {plan.gift_amount}）
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="recharge-remark">备注</FieldLabel>
              <Textarea
                id="recharge-remark"
                value={form.remark}
                onChange={(e) => onFieldChange("remark", e.target.value)}
                placeholder="可选备注"
                rows={3}
                disabled={isSubmitting}
              />
            </Field>
          </FieldGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "充值中…" : "确认充值"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AccountBalanceCard({
  title,
  account,
  isLoading,
}: {
  title: string
  account: WalletAccountPublic | null
  isLoading: boolean
}) {
  return (
    <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : account ? (
          <p className="text-2xl font-bold">¥{account.balance}</p>
        ) : (
          <p className="text-2xl font-bold text-muted-foreground">—</p>
        )}
      </CardContent>
    </Card>
  )
}

function TransactionTypeLabel({ type }: { type: string }) {
  const map: Record<string, string> = {
    RECHARGE: "充值",
    CONSUME: "消费",
    REFUND: "退款",
    GIFT: "赠送",
    ADJUST: "调整",
  }

  return <span>{map[type] ?? type}</span>
}

export function MembersView() {
  const logic = useWalletMembersLogic()

  if (!logic.canReadMember) {
    return <PermissionDenied />
  }

  const { membersQuery } = logic

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">会员管理</h1>
          <p className="text-sm text-muted-foreground">管理会员信息及钱包账户</p>
        </div>
        {logic.canCreateMember && (
          <Button onClick={logic.openCreateMemberDialog}>
            <Plus className="mr-2 h-4 w-4" />
            新建会员
          </Button>
        )}
      </div>

      <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>会员编号</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>入会时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersQuery.isLoading ? (
                <LoadingRows cols={7} />
              ) : membersQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    加载失败，请刷新页面重试。
                  </TableCell>
                </TableRow>
              ) : logic.members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12">
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>暂无会员</EmptyTitle>
                        <EmptyDescription>
                          {logic.canCreateMember
                            ? "点击右上角"新建会员"添加第一个会员。"
                            : "当前没有会员数据。"}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                logic.members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    canUpdate={logic.canUpdateMember}
                    canDelete={logic.canDeleteMember}
                    onEdit={logic.openEditMemberDialog}
                    onDelete={logic.requestMemberDelete}
                    onViewDetail={logic.openMemberSheet}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Member detail sheet */}
      <Sheet
        open={Boolean(logic.selectedMemberId)}
        onOpenChange={(open) => {
          if (!open) logic.closeMemberSheet()
        }}
      >
        <SheetContent className="sm:max-w-lg flex flex-col gap-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{logic.selectedMember?.name || logic.selectedMember?.member_no || "会员详情"}</SheetTitle>
            <SheetDescription>
              会员编号：{logic.selectedMember?.member_no}
              {logic.selectedMember?.mobile ? `　手机：${logic.selectedMember.mobile}` : ""}
            </SheetDescription>
          </SheetHeader>

          {logic.canReadAccount && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <AccountBalanceCard
                  title="本金余额"
                  account={logic.principalAccount}
                  isLoading={logic.principalAccountQuery.isLoading}
                />
                <AccountBalanceCard
                  title="赠金余额"
                  account={logic.giftAccount}
                  isLoading={logic.giftAccountQuery.isLoading}
                />
              </div>

              {logic.canRecharge && (
                <div>
                  <Button onClick={logic.openRechargeDialog}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    充值
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">交易记录</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>类型</TableHead>
                        <TableHead>账户</TableHead>
                        <TableHead className="text-right">金额</TableHead>
                        <TableHead className="text-right">余额</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logic.walletTransactionsQuery.isLoading ? (
                        <LoadingRows cols={4} />
                      ) : logic.walletTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="py-6 text-center text-sm text-muted-foreground"
                          >
                            暂无交易记录
                          </TableCell>
                        </TableRow>
                      ) : (
                        logic.walletTransactions.map((tx) => (
                          <TransactionRow key={tx.id} transaction={tx} />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Member editor dialog */}
      <MemberEditorDialog
        open={logic.memberDialogOpen}
        mode={logic.memberDialogMode}
        form={logic.memberForm}
        error={logic.memberFormError}
        isSubmitting={logic.isMemberSubmitting}
        onOpenChange={(open) => {
          if (!open) logic.closeMemberDialog()
        }}
        onFieldChange={logic.setMemberField}
        onSubmit={logic.submitMemberForm}
      />

      {/* Recharge dialog */}
      <RechargeDialog
        open={logic.rechargeDialogOpen}
        form={logic.rechargeForm}
        error={logic.rechargeFormError}
        isSubmitting={logic.isRechargeSubmitting}
        rechargePlans={logic.rechargePlans}
        onOpenChange={(open) => {
          if (!open) logic.closeRechargeDialog()
        }}
        onFieldChange={logic.setRechargeField}
        onSubmit={logic.submitRechargeForm}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(logic.memberDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) logic.closeMemberDeleteDialog()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除会员？</AlertDialogTitle>
            <AlertDialogDescription>
              即将删除会员「{logic.memberDeleteTarget?.name || logic.memberDeleteTarget?.member_no}
              」，此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {logic.memberDeleteError ? (
            <Alert variant="destructive">
              <AlertTitle>删除失败</AlertTitle>
              <AlertDescription>{logic.memberDeleteError}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={logic.isMemberDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={logic.confirmMemberDelete}
              disabled={logic.isMemberDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {logic.isMemberDeleting ? "删除中…" : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MemberRow({
  member,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onViewDetail,
}: {
  member: MemberPublic
  canUpdate: boolean
  canDelete: boolean
  onEdit: (member: MemberPublic) => void
  onDelete: (member: MemberPublic) => void
  onViewDetail: (memberId: string) => void
}) {
  const joinedAt = member.joined_at
    ? new Date(member.joined_at).toLocaleDateString("zh-CN")
    : "—"

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{member.member_no}</TableCell>
      <TableCell>{member.name || "—"}</TableCell>
      <TableCell>{member.mobile || "—"}</TableCell>
      <TableCell>
        <MemberStatusBadge status={member.status} />
      </TableCell>
      <TableCell>{member.level || "—"}</TableCell>
      <TableCell>{joinedAt}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewDetail(member.id)}
            title="查看详情"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(member)}
              title="编辑"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(member)}
              title="删除"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function TransactionRow({ transaction }: { transaction: WalletTransactionPublic }) {
  const amount = parseFloat(transaction.amount)
  const isPositive = amount >= 0

  return (
    <TableRow>
      <TableCell>
        <TransactionTypeLabel type={transaction.transaction_type} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {transaction.account_type === "PRINCIPAL" ? "本金" : "赠金"}
      </TableCell>
      <TableCell
        className={`text-right font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
      >
        {isPositive ? "+" : ""}
        {transaction.amount}
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        {transaction.balance_after ?? "—"}
      </TableCell>
    </TableRow>
  )
}
