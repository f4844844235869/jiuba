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
| **颗粒度** | 积木块（如 UserCard） | 完整楼层（如 UsersManager） |
| **复用性** | 极高，抽象程度高 | 较低，专注特定业务逻辑 |
| **安装** | 通过 `shadcn add` 或直接引用 | 应用内部创建，按需配合 Hook |

---

## 5. 示例代码参考

请参考 [apps/web/app/demo/](file:///Users/yimo/Downloads/b_vmzfBKkXLXw-1773453068197/apps/web/app/demo/) 目录下的实现。
- `use-users-logic.ts` (大脑)
- `user-list-view.tsx` (身体)
- `page.tsx` (组装)
