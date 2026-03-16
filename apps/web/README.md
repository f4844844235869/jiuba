# Web App Local Notes

这份说明只保留 `apps/web` 对共享 UI 的本地补充。通用的 shadcn 安装、更新、diff、覆盖策略，以对应 skill 为准。

## 当前进度

- 已完成后台基础路由骨架：
  - 登录页：`/login`
  - 工作台：`/`
  - 用户与员工：`/users`
  - 员工入职与调岗：`/employees/onboard`
  - 门店管理：`/stores`
  - 组织管理：`/org`
  - 角色权限：`/iam`
  - 小程序关联：`/miniapp`
- 已完成账号密码登录全链路：
  - 登录接口：`POST /api/v1/auth/backend/password-login`
  - 当前用户接口：`GET /api/v1/auth/me`
  - token 已接入本地持久化和自动恢复
  - `/(admin)` 已接入基础登录守卫
- 已完成最新后台 OpenAPI 生成：
  - 生成分组：`auth`、`employees`、`iam`、`organization`、`stores`、`users`
  - 生成入口仍为 `pnpm --dir apps/web gen:api`

## 当前使用方式

- `apps/web` 继续复用 `@workspace/ui/components/business` 中的 `AdminLayout`
- `components/admin-shell.tsx` 负责把共享 layout 包装成当前应用导航壳
- 登录页已拆成页面模块结构：
  - `app/login/page.tsx`
  - `app/login/use-login-logic.ts`
  - `app/login/login-view.tsx`

## 本地约定

- 如果只是使用共享 layout，直接从 workspace 引入，不在 `apps/web` 再复制一份
- 只有当页面层确实需要脱离共享实现做深度改造时，才考虑用 shadcn 命令把源码拉到应用内
- 当前仓库已经移除了旧的 demo 页面和旧业务组件示例，新增展示请直接围绕首页场景扩展，不要重新建一组平行 demo
- API 请求优先放在页面模块的 `logic` 层，不直接写进共享 UI 组件

## 并行开发建议

- 现在这个阶段，最快的方式通常是：
  - 保持一个主 `Next.js` 开发服务
  - 同时开多个浏览器窗口或标签页，分别盯登录页、工作台和某个业务页
  - 再配一个终端专门看 typecheck / lint / 接口日志
- 只有在你需要隔离实验、避免热更新互相影响时，才建议开多个端口的 dev server
- 常用做法：

```bash
pnpm --dir apps/web dev -- --port 3000
pnpm --dir apps/web dev -- --port 3001
pnpm --dir apps/web dev -- --port 3002
```

- 推荐分工：
  - `3000`：主开发入口，保持稳定
  - `3001`：登录与认证链路调试
  - `3002`：某个业务页的临时试验场
- 如果多个端口共用同一个后端和同一份 `localStorage`，登录态会互相影响；需要完全隔离时，建议使用不同浏览器 profile 或无痕窗口

## 常用命令

```bash
pnpm --dir apps/web dev
pnpm --dir apps/web typecheck
pnpm --dir apps/web lint
```
