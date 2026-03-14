import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">项目已就绪</h1>
          <p>你现在可以添加组件并开始构建了。</p>
          <p>我们已经为你添加了基础组件和业务组件。</p>
          <div className="mt-4 flex gap-2">
            <Button asChild>
              <Link href="/components">查看业务组件</Link>
            </Button>
          </div>
        </div>
        <div className="text-muted-foreground font-mono text-xs">
          (按 <kbd>d</kbd> 键切换深色模式)
        </div>
      </div>
    </div>
  )
}
