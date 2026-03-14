# Web 应用组件使用指南

本项目（`apps/web`）通过 `shadcn/ui` 的自定义注册表机制从 `@workspace/ui`（`packages/ui`）中获取并使用业务组件。

## 常用命令说明

### 1. 安装/更新业务组件

```bash
npx shadcn@latest add @local/[组件名] --overwrite
```

#### 为什么要用此命令？（用途解析）

*   **代码同步**：当 UI 库（`packages/ui`）中的业务组件源码发生更新，并重新执行了 `pnpm registry:build` 后，主应用需要通过此命令将最新的代码“拉取”到本地。
*   **版本覆盖 (`--overwrite`)**：由于 `shadcn` 默认保护本地代码，如果本地已存在同名组件，安装会跳过。加上 `--overwrite` 参数可以强制用 Registry 中的最新版本覆盖本地副本，确保逻辑一致。
*   **自动化依赖补全**：
    *   如果该业务组件依赖了新的基础 UI 组件（如 `dialog`, `sheet` 等），此命令会自动识别并安装这些基础组件。
    *   它会自动更新项目的全局样式（`globals.css`）和配置。

---

## 开发建议

### 场景 A：直接引用 (推荐快速开发)
如果你不需要对组件进行任何定制，只是简单展示，可以直接通过 Workspace 引用，无需安装：
```tsx
import { UserCard } from "@workspace/ui/components/business"
```

### 场景 B：二次开发 (推荐深度定制)
如果你需要修改 `UserCard` 的内部结构（例如在 `apps/web` 中改变它的 HTML 布局），请先执行 `add` 把源码拉过来：
1.  执行 `npx shadcn@latest add @local/user-card`。
2.  在 `apps/web/components/business/user-card/user-card.tsx` 中直接修改代码。
3.  **注意**：一旦进行了本地定制，请**谨慎**运行带有 `--overwrite` 的更新命令，否则你的本地定制工作会被重置。

---

## 故障排除

*   **找不到组件？** 检查 `packages/ui` 里的 Registry 服务是否启动（`pnpm registry:dev`）。
*   **组件没更新？** 确认在 UI 包中执行过 `pnpm registry:build` 来刷新构建产物。
