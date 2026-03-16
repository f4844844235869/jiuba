# 业务模块（Business Modules）开发规范指南

本规范定义了在 `apps/web` 中如何组织复杂的页面逻辑。区别于原子级的 UI 组件，**业务模块** 专注于特定业务流程的实现。

## 1. 核心思想：无头逻辑先行 (Headless First)

遵循 **“大脑（逻辑）与身体（视图）分离”** 的原则，实现“先写 JS 逻辑不报错，再合入页面”的开发流程。

### 目录结构建议
```text
app/[page-name]/
├── page.tsx              # 入口：负责组合逻辑与视图
├── use-[name]-logic.ts    # “大脑”：纯逻辑 Hook (Headless)
└── [name]-view.tsx        # “身体”：纯代码视图 (View)
```

---

## 2. 模块分层职责

### 大脑：Logic Hook (`use-*-logic.ts`)
*   **职责**：状态管理、API 调用、复杂计算（过滤、排序）、事件 handler 定义。
*   **规范**：
    *   **禁止包含任何 JSX**。
    *   接收初始化参数（如 `initialData`）。
    *   吐出给 UI 消费的所有变量和函数。
    *   应具备良好的类型定义（TypeScript）。

### 身体：View Component (`*-view.tsx`)
*   **职责**：UI 排版、布局、视觉反馈。
*   **规范**：
    *   通过 `logic` 属性接收从 Hook 中返回的所有内容。
    *   使用 `@workspace/ui/components` 中的基础组件和业务组件。
    *   **禁止直接管理后端数据加载**。
    *   保持样式单纯，不直接编写复杂的判断逻辑（由 Logic 预处理好）。

---

## 3. 开发流程建议（Step-by-Step）

1.  **定义数据模型**：在 `logic.ts` 中定义接口。
2.  **编写 Brain (Hook)**：编写逻辑脚本，通过 `console.log` 或测试用例确认数据流转正确。此时**无需打开浏览器**观察 UI。
3.  **编写 Body (View)**：根据 Logic 暴露的 API 编写静态 UI 结构。可以使用 Mock 数据隔离开发。
4.  **组装 (Page)**：在 `page.tsx` 中将两者实例化并关联。

---

## 4. 与“业务组件”的区别

| 类型 | 业务组件 (Business Components) | 业务模块 (Business Modules) |
| :--- | :--- | :--- |
| **位置** | `packages/ui` (分发层) | `apps/web` (应用层) |
| **颗粒度** | 共享页面骨架（如 AdminLayout） | 完整楼层（如 UsersManager） |
| **复用性** | 极高，抽象程度高 | 较低，专注特定业务逻辑 |
| **安装** | 通过 `shadcn add` 或直接引用 | 应用内部创建，按需配合 Hook |

---

## 5. 当前补充说明

当前 `apps/web` 已移除历史 demo 目录，不再维护单独的模块示例页。

- 页面级模块如果只是一次性验证，直接在目标页面目录内组织 `logic` 和 `view`
- 如果某块实现开始跨页面复用，优先判断它应回收到 `packages/ui`，还是继续保持页面模块
- 共享组件的创建、更新、registry 流程由对应 skill 负责，本文件只保留应用层模块组织建议

---

## 6. 视图层 (View) 质感与样式规范

为了保持整个后台系统的视觉“质感”和空间层级，摆脱扁平化（“太素”）的观感，编写 `*-view.tsx` 时请遵循以下样式约定：

- **全局背景适配**：系统底层框架 (`AdminLayout`) 已统一采用带微光晕的浅色呼吸背景（`bg-muted/10` 结合顶部渐变 `from-primary/5`）。在编写页面级容器时，请避免强行写死纯色背景，让卡片组件自然融入系统环境。
- **卡片悬浮与立体感**：作为页面主要内容载体的 `<Card>`，应统一加入阴影和交互过渡效果，使其与全局背景形成前后景的景深关系。
  ```tsx
  // 推荐的 Card 样式标准
  <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
    <CardHeader>...</CardHeader>
    <CardContent>...</CardContent>
  </Card>
  ```
- **区域分割与对比度**：利用微妙的背景色差来区分信息区块。例如数据表格的表头 (`TableHeader`) 或某些卡片的头部 (`CardHeader`) 区域，可适当结合 `bg-muted/10` 或 `bg-muted/30` 形成视觉分割，增加界面的层次感。
