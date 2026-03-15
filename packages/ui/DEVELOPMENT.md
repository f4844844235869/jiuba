# UI Package Local Notes

这份文档只保留 `packages/ui` 在本仓库里的补充约定。通用的 shadcn 组件创建、registry 使用、更新流程，以 `.agents/skills/shadcn` 中的规则为准，这里不再重复。

## 当前范围

- `packages/ui/src/components/business` 用于共享业务组件，目前只保留 `admin-layout`
- `packages/ui/src/components/primitives` 用于基于 shadcn 二次开发的基础类组件，目前已有 `search-input`
- `packages/ui/registry.json` 和 `packages/ui/public/r/registry.json` 当前只发布 `admin-layout`
- 新增共享业务组件前，先确认是否真的需要进入 UI 包；页面级实现优先留在应用层验证

## 组件分层

### 1. 基础类组件

目录：

- `packages/ui/src/components/primitives`

定位：

- 基于 shadcn 原子组件做二次开发
- 仍然属于“基础能力层”，不直接绑定某个业务领域
- 主要解决交互增强、输入体验、通用组合封装

适合放进来的组件：

- 类似 `search-input` 这样的增强输入
- 对 shadcn 原子组件的轻量包装与组合
- 多个页面都可能复用、但还没上升到业务语义的组件

不适合放进来的内容：

- 明显依赖业务对象命名的组件
- 页面级骨架、领域流程组件
- 仅单页使用的一次性拼装

约定：

- 入口统一放在 `src/components/primitives/[name]/index.tsx`
- 汇总导出放在 `src/components/primitives/index.ts`
- 可以保留配套的 `*.stories.tsx` 和 `*.test.tsx`
- 设计上优先“沿用 shadcn 原组件行为，再补充少量能力”，不要把 primitives 做成另一套独立设计系统

### 2. 业务组件

目录：

- `packages/ui/src/components/business`

定位：

- 面向具体业务场景的共享组件
- 通常承载页面骨架、领域结构、业务化 props

适合放进来的组件：

- `admin-layout` 这类可跨应用复用的共享页面骨架
- 已经形成稳定业务语义、并且值得通过 registry 分发的组件

约定：

- 入口统一放在 `src/components/business/[name]/index.tsx`
- `src/components/business/index.ts` 只导出当前允许对外消费的业务组件
- 只有需要通过 registry 分发的业务组件，才维护到 `registry.json`

## 本仓库补充约定

- 调整 registry 后，需要同步维护这两个文件：
  - `packages/ui/registry.json`
  - `packages/ui/public/r/registry.json`
- `primitives` 是“基于 shadcn 的二次开发基础组件”，`business` 是“共享业务组件”，新增时先判断归属，再决定目录
- 如果一个组件只是给某个页面做快速验证，先留在应用层；只有确认会复用，才回收进 `primitives` 或 `business`

## 当前命令

```bash
pnpm --dir packages/ui storybook
pnpm --dir packages/ui registry:build
pnpm --dir packages/ui registry:dev
pnpm --dir packages/ui typecheck
pnpm --dir packages/ui lint
```

## 何时补充本地文档

只有下面这类“仓库特有信息”才写进这里：

- 当前实际保留了哪些 `primitives` / `business` 组件
- registry 产物在本仓库里的维护方式
- 和 workspace 结构、脚本、发布习惯直接相关的约定

如果某条说明已经被 `shadcn` skill 覆盖，就不要再在本地文档里重复一遍。
