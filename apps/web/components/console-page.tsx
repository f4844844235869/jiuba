import type { ElementType } from "react"

import { ListChecks } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-3">
      <Badge variant="outline">{eyebrow}</Badge>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

export function StatusCard({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: ElementType
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
      <Icon className="mb-3 size-5 text-muted-foreground" weight="duotone" />
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </div>
    </div>
  )
}

export function SpecSection({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: string[]
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.map((item) => (
          <div key={item} className="rounded-2xl bg-muted/30 p-4 text-sm leading-6">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function SpecCard({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: string[]
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/70 p-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {index + 1}
            </div>
            <p className="text-sm leading-6 text-foreground">{item}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function PermissionPanel({ permissions }: { permissions: string[] }) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">权限点</CardTitle>
        <CardDescription>页面和按钮权限建议统一按权限编码判断。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {permissions.map((permission) => (
          <Badge key={permission} variant="secondary" className="px-3 py-1">
            {permission}
          </Badge>
        ))}
      </CardContent>
    </Card>
  )
}

export function EmptyDataCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full border border-border/70 bg-muted/30">
          <ListChecks className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">{title}</h2>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
