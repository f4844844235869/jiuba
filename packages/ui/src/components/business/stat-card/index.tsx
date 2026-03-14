"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"
import {
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react"
import { Card } from "@workspace/ui/components/card"

const statCardVariants = cva(
  "relative flex flex-col transition-all",
  {
    variants: {
      variant: {
        default: "shadow-sm border border-border bg-card text-card-foreground",
        outlined: "border-2 bg-card text-card-foreground",
        filled: "bg-primary/5 border-primary/20 text-card-foreground",
      },
      size: {
        sm: "p-3 gap-1",
        default: "p-4 gap-2",
        lg: "p-6 gap-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type TrendDirection = "up" | "down" | "neutral"

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  /** 统计标题 */
  title: string
  /** 统计数值 */
  value: string | number
  /** 描述文字 */
  description?: string
  /** 趋势方向 */
  trend?: TrendDirection
  /** 趋势百分比 */
  trendValue?: string
  /** 自定义图标 */
  icon?: React.ReactNode
}

const trendColors: Record<TrendDirection, string> = {
  up: "text-green-600 dark:text-green-400",
  down: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
}

const TrendIcon: React.FC<{ direction: TrendDirection }> = ({ direction }) => {
  const iconClass = "size-4"
  switch (direction) {
    case "up":
      return <TrendingUp className={iconClass} />
    case "down":
      return <TrendingDown className={iconClass} />
    default:
      return <Minus className={iconClass} />
  }
}

/**
 * StatCard 业务组件
 * 用于展示统计数据的卡片组件
 */
function StatCard({
  className,
  variant,
  size,
  title,
  value,
  description,
  trend,
  trendValue,
  icon,
  ...props
}: StatCardProps) {
  return (
    <Card
      className={cn(statCardVariants({ variant, size, className }))}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        {icon && (
          <div className="text-muted-foreground">{icon}</div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {trend && trendValue && (
          <div className={cn("flex items-center gap-0.5 text-sm font-medium", trendColors[trend])}>
            <TrendIcon direction={trend} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </Card>
  )
}

export { StatCard, statCardVariants }
