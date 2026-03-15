import {
  ArrowSquareOut,
  CheckCircle,
  Copy,
  Layout,
  Sparkle,
  Swatches,
} from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const workflowSteps = [
  "通过 shadcn 命令复制原始 layout 组件到 packages/ui。",
  "在 UI 包里只做少量业务化调整，保留 upstream 结构和可升级性。",
  "在 apps/web 中只保留一个使用场景，避免演示代码继续扩散。",
]

const customizationNotes = [
  "导航被压缩为单一路径，方便专注验证 layout 本身。",
  "首页内容改成真实落地页，而不是继续堆叠组件展示区块。",
  "颜色、标题和描述都放在业务页面层定制，不改 layout 的基础骨架。",
]

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <Card className="border-border/70 shadow-none">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Single Layout</Badge>
              <Badge variant="secondary">Low Customization</Badge>
            </div>
            <div className="flex flex-col gap-3">
              <CardTitle className="text-3xl leading-tight">
                保留 `AdminLayout`，在应用层只做少量自定义
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6">
                这个页面现在只负责展示一个 layout 的落地用法。组件复制、升级和后续维护都围绕同一套骨架进行，避免示例页面和业务组件继续分叉。
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                <Layout className="mb-3 size-5 text-muted-foreground" weight="duotone" />
                <div className="text-sm font-medium">原始骨架</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  layout 结构仍由 UI 包统一维护。
                </div>
              </div>
              <div
                id="customization"
                className="rounded-xl border border-border/70 bg-muted/30 p-4"
              >
                <Sparkle className="mb-3 size-5 text-muted-foreground" weight="duotone" />
                <div className="text-sm font-medium">应用层定制</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  只在页面文案、区块组合和导航配置上做轻量修改。
                </div>
              </div>
              <div id="tokens" className="rounded-xl border border-border/70 bg-muted/30 p-4">
                <Swatches className="mb-3 size-5 text-muted-foreground" weight="duotone" />
                <div className="text-sm font-medium">主题延续</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  继续使用共享 token，不再为单页演示创建额外视觉体系。
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button>
                <Copy data-icon="inline-start" weight="bold" />
                继续沿用命令复制流程
              </Button>
              <Button variant="outline">
                <ArrowSquareOut data-icon="inline-start" weight="bold" />
                这里就是 layout 使用示例
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">当前策略</CardTitle>
            <CardDescription>只保留一个组件入口，减少维护面。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {workflowSteps.map((step, index) => (
              <div key={step} className="flex items-start gap-3 rounded-xl border border-border/70 p-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-foreground">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">页面层少量自定义</CardTitle>
            <CardDescription>
              layout 保持通用，真正变化的内容放在 children 区域里承载。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {customizationNotes.map((note) => (
              <div key={note} className="flex items-start gap-3 rounded-xl bg-muted/30 p-4">
                <CheckCircle className="mt-0.5 size-5 shrink-0 text-primary" weight="fill" />
                <p className="text-sm leading-6 text-foreground">{note}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">下一步建议</CardTitle>
            <CardDescription>
              如果后面还要加模块，优先先在业务页组合，再决定是否值得回推到 UI 包。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="rounded-xl border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
              新需求先验证页面结构，再决定是否沉淀成新的共享组件，避免重新堆回一批维护成本高的示例组件。
            </div>
            <div className="rounded-xl border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
              如果需要重新复制 upstream 组件，继续用 shadcn CLI 走 `add` / `--diff`，不要手动散拷文件。
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
