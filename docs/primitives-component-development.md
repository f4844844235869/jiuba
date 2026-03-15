# 原始增强组件与复合组件开发规范

本文档用于规范 `packages/ui/src/components/primitives/` 目录下的组件开发方式。该目录承接的是“原始增强组件”和“复合交互组件”，用于在基础原子组件与业务组件之间增加一层稳定的通用交互抽象。

## 1. primitives 层定位

`primitives` 层位于基础原子组件与业务组件之间：

- `packages/ui/src/components/*.tsx`：基础原子组件
- `packages/ui/src/components/primitives/*`：原始增强组件 / 复合控件
- `packages/ui/src/components/business/*`：业务组件

这一层的目标是：

- 对高频交互模式做标准化
- 复用基础原子组件，而不是重造另一套原子
- 提供带有明确交互语义但不绑定业务领域的组件

这一层不应承担：

- 业务对象建模
- 页面流程编排
- 某个业务域专用的输入输出协议

## 2. 什么样的组件应该进入 primitives

满足以下条件时，优先考虑进入 `primitives`：

- 同类交互已在 2 到 3 处以上重复出现
- 组件由多个基础原子组合而成，或在单个原子上增加了明确的通用交互语义
- props 仍是通用 UI 语义，不围绕业务对象设计

典型例子：

- `SearchInput`
- `AsyncSelect`
- `FilterInput`
- `TableToolbar`

不适合进入 `primitives` 的情况：

- props 已经围绕用户、角色、资源、权限等业务对象展开
- 组件只在单一页面成立，没有明确复用证据
- 组件已经是一整块业务骨架或领域交互容器

## 3. 目录和文件规范

每个 `primitives` 组件必须使用独立目录承载，而不是平铺在根目录：

```text
packages/ui/src/components/primitives/
└── search-input/
    ├── index.tsx
    ├── search-input.stories.tsx
    └── search-input.test.tsx
```

要求如下：

- 入口文件统一命名为 `index.tsx`
- 测试文件统一命名为 `[component-name].test.tsx`
- Story 文件统一命名为 `[component-name].stories.tsx`
- `packages/ui/src/components/primitives/index.ts` 负责统一导出

## 4. 引用与实现规范

- 内部引用统一使用 `@workspace/ui/components/...`
- 样式必须使用语义化 token，例如：
  - `bg-background`
  - `text-foreground`
  - `border-input`
  - `text-muted-foreground`
- 不写死业务色，不在这一层引入特定业务主题
- 优先复用现有基础原子组件，例如 `Input`、`Button`、`Popover`

## 5. Storybook 与测试要求

每个 `primitives` 组件必须同时提供 Story 与测试。

### Storybook

至少覆盖以下主要状态中的核心组合：

- 默认态
- 禁用态
- loading 态
- 有值态
- 错误态（如果组件支持）

### 测试

至少覆盖：

- 基础输入或点击交互
- 核心状态切换
- 清空或提交行为
- 禁用态行为约束

## 6. SearchInput 作为首个案例

`SearchInput` 是 `primitives` 层的首个正式组件，代表这层的典型职责：

- 基于基础 `Input` 提供搜索语义增强
- 标准化搜索图标、清空、回车触发和 loading 展示
- 不承担候选列表、下拉选择、远程搜索结果等更高层能力

后续若需要“输入搜索 + 下拉选择”，应继续在 `primitives` 层中演进出 `Combobox` 或 `AsyncCombobox`，而不是把这些能力继续塞进 `SearchInput`。
