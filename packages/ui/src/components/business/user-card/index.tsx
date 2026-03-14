"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

const userCardVariants = cva(
  "relative flex flex-col overflow-hidden transition-all",
  {
    variants: {
      variant: {
        default: "shadow-sm hover:shadow-md border border-border bg-card",
        outlined: "border-2 hover:border-primary/50 bg-card",
        elevated: "shadow-lg hover:shadow-xl border border-border bg-card",
      },
      size: {
        sm: "p-3 gap-2",
        default: "p-4 gap-3",
        lg: "p-6 gap-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface UserCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof userCardVariants> {
  /** 用户名称 */
  name: string
  /** 用户头像 URL */
  avatar?: string
  /** 用户邮箱 */
  email?: string
  /** 用户角色/职位 */
  role?: string
  /** 是否显示操作按钮 */
  showActions?: boolean
  /** 关注按钮点击回调 */
  onFollow?: () => void
  /** 消息按钮点击回调 */
  onMessage?: () => void
}

/**
 * UserCard 业务组件
 * 用于展示用户信息的卡片组件
 */
function UserCard({
  className,
  variant,
  size,
  name,
  avatar,
  email,
  role,
  showActions = true,
  onFollow,
  onMessage,
  ...props
}: UserCardProps) {
  return (
    <Card
      className={cn(userCardVariants({ variant, size, className }))}
      {...props}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-foreground">{name}</h3>
            {role && (
              <Badge variant="secondary" className="px-1 text-[10px] h-4">
                {role}
              </Badge>
            )}
          </div>
          {email && (
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={onFollow}
          >
            关注
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onMessage}
          >
            消息
          </Button>
        </div>
      )}
    </Card>
  )
}

export { UserCard, userCardVariants }
