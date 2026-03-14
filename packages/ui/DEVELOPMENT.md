# 业务组件开发与自定义注册表（Registry）指南

本手册指导如何在 `packages/ui` 中开发业务组件，并通过私有注册表（Registry）将其分发到 Monorepo 内的其他应用（如 `apps/web`）。

## 1. 核心目录结构

- **`src/components/business/`**: 业务组件的生产源码。
- **`registry.json`**: 注册表配置文件（源码管理）。
- **`public/r/`**: 构建产物目录，包含供分发的 JSON 文件。
- **`public/r/registry.json`**: 软/硬链接到根目录的 `registry.json`，用于索引查询。

---

## 2. 业务组件开发流程

### 第一步：编写源码
在 `src/components/business/` 下创建组件文件夹。
- **开发原则**: **优先使用 shadcn/ui 官方基础组件**。在编写业务组件前，先通过 `shadcn add` 将所需的基础原子组件（如 Button, Card, Dialog 等）拉取到本地，基于这些原子组件进行逻辑拼装。
- **规范**: 
  - 入口文件统一命名为 `index.tsx`（方便内部引用导出）。
  - 组件内部引用库内其他组件请使用 `@workspace/ui/components/...`。
  - **主题适配**: 必须支持深色模式。使用语义化类名（如 `text-foreground`, `bg-card`, `border-border`），严禁在业务组件中写死特定颜色。
  - **图标规范**: **统一使用 `lucide-react`**。为保持与 shadcn 官方组件视觉一致性并避免第三方库导出冲突，新组件请优先使用 Lucide 图标库。

### 第二步：注册配置
在根目录的 **`registry.json`** 中添加组件信息。这是 `shadcn` 识别并打包组件的关键依据。

```json
{
  "name": "my-new-card",
  "type": "registry:block",
  "title": "My New Card",
  "description": "组件的描述信息。",
  "dependencies": ["lucide-react"],            // 该组件依赖的 npm 包
  "registryDependencies": ["card", "button"],   // 该组件依赖的基础 UI 组件 (如 shadcn 官方组件)
  "files": [
    {
      "path": "src/components/business/my-new-card/index.tsx",      // 源码来源
      "target": "components/business/my-new-card/my-new-card.tsx", // 安装后的目标路径与文件名
      "type": "registry:component"
    }
  ]
}
```

### 第三步：生成分发 JSON
在 `packages/ui` 目录下执行构建：
```bash
pnpm registry:build
```
**原理**: 该命令会读取 `registry.json`，将 `src` 下的 TSX 源码转换为 `public/r/my-new-card.json`。这个 JSON 包含了组件的源码字符串。

### 第四步：启动 Registry 服务
确保本地 Registry 静态服务正在运行：
```bash
pnpm registry:dev
```
服务地址默认运行在：`http://localhost:4443`

---

## 3. 消费端（apps/web）安装与更新

### 首次安装
在 `apps/web` 目录下执行：
```bash
npx shadcn@latest add @local/my-new-card
```

### 更新代码
如果原有的组件源码 `packages/ui/src/...` 发生了修改，需要同步到主应用：
1. 在 `packages/ui` 执行 `pnpm registry:build`。
2. 在 `apps/web` 再次执行 `npx shadcn@latest add @local/my-new-card --overwrite`。

---

## 4. 质量保证（QA）要求

每个新增的业务组件**必须**包含以下支柱文件：

### Storybook 展示
- **文件**: `[component-name].stories.tsx`
- **目的**: 在隔离环境中驱动开发，并作为组件的视觉文档。
- **要求**: 包含多种 `Variant`（变体）和 `Size`（尺寸）的展示。

### 单元测试
- **文件**: `[component-name].test.tsx`
- **目的**: 确保组件逻辑（如点击回调、条件渲染）的稳定性。
- **执行**: 在 `packages/ui` 运行 `pnpm test`。

### 主题与响应式
- **深色模式**: 必须在 Storybook 中通过主题切换插件验证组件在 Dark 模式下的可读性和对比度。
- **响应式**: 业务组件应考虑在不同断点（sm/md/lg）下的排版表现。

---

## 5. 技术原理解析

### 为什么源码是 `index.tsx` 而安装后不是？
通过 `target` 属性，我们实现了 **“开发时模块化入口”** 与 **“安装时语义化重命名”** 的平衡。

### 硬链接 (Hard Link) 优化
我们让 `public/r/registry.json` 硬链接到根目录的 `registry.json`。
- **好处**: 您只需维护一份文件。修改根目录下的 `registry.json` 后，分发服务会瞬间同步，无需重新运行 `build` 来刷新索引。
- **脚本支持**: `package.json` 中的 `registry:build` 已集成自动修复硬链接的逻辑。

---

## 5. 常用开发命令对照表

| 目的 | 命令 (在 packages/ui 执行) |
| :--- | :--- |
| **同步源码到 JSON** | `pnpm registry:build` |
| **启动分发服务** | `pnpm registry:dev` |
| **查看可用组件名** | `pnpm dlx shadcn@latest list @local` |
| **自建 Storybook** | `pnpm storybook` |
