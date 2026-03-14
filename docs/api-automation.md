# API 自动化与端到端类型安全指南

本项目集成了 **Orval**，实现了从 FastAPI 后端到 Next.js 前端的全自动 API 同步和类型安全。

## 🚀 核心仓库

| 文件/目录 | 说明 |
| :--- | :--- |
| `apps/web/orval.config.cjs` | Orval 的主配置文件，定义了如何同步 API |
| `apps/web/lib/api-client.ts` | 自定义的 Axios 实例，包含全局拦截器和错误处理 |
| `apps/web/api/generated/` | **[自动生成]** 包含所有的 API Hooks 和类型定义，**请勿手动修改** |
| `server/main.py` | 后端真理之源，通过 FastAPI 自动导出 OpenAPI 规范 |

## ⚙️ 配置解析 (`orval.config.cjs`)

```javascript
module.exports = {
  workspace: {
    input: 'http://localhost:8000/openapi.json', // 1. 指向后端的 OpenAPI 文档
    output: {
      target: './api/generated/workspace.ts',   // 2. 生成代码的存放位置
      mode: 'tags-split',                      // 3. 按 FastAPI 标签(Tags)拆分文件
      client: 'react-query',                   // 4. 生成 React Query Hooks
      httpClient: 'axios',                     // 5. 强制参数风格为 Axios
      override: {
        mutator: {                             // 6. [关键] 接入自定义 Axios 实例
          path: './lib/api-client.ts',
          name: 'customInstance',
        },
      },
    },
  },
};
```

## 🛠 开发流程

### 1. 同步 API
当你修改了后端 Python 代码（例如修改了 Pydantic 模型或新增了接口）后，确保后端服务正在运行，然后在 `apps/web` 目录下执行：

```bash
pnpm gen:api
```

### 2. 在组件中使用
Orval 会自动生成语义化的 Hooks，例如：

| 后端接口 (Tags) | 生成的 Hook 示例 |
| :--- | :--- |
| `GET /api/workspace` (Workspace) | `useGetWorkspaceApiWorkspaceGet()` |
| `DELETE /api/users/{id}` (Users) | `useDeleteUserApiUsersUserIdDelete()` |

**代码示例：**

```tsx
import { useGetWorkspaceApiWorkspaceGet } from '@/api/generated/workspace/workspace'

export function MyComponent() {
  const { data, isLoading } = useGetWorkspaceApiWorkspaceGet();
  
  if (isLoading) return <div>Loading...</div>;
  return <div>{data.message}</div>;
}
```

## 💡 最佳实践

1. **后端必须写 Tags**：在 FastAPI 的 `router` 或 `app.get` 中使用 `tags=["Users"]`，这决定了生成的代码如何分类。
2. **后端写 Literal 类型**：对于状态（Status）等固定字段，后端使用 `Literal['a', 'b']`，Orval 会将其同步为 TypeScript 的联合类型，实现最严格的类型校验。
3. **保持后端运行**：由于 Orval 是实时抓取 `openapi.json` 的，同步前请确保 Python 服务已启动。
4. **利用 Interceptor**：所有的请求都会经过 `lib/api-client.ts`，如果需要全局添加 Token 或处理 401 错误，统一在那里修改。
