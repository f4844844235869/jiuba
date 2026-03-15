# Web App Local Notes

这份说明只保留 `apps/web` 对共享 UI 的本地补充。通用的 shadcn 安装、更新、diff、覆盖策略，以对应 skill 为准。

## 当前使用方式

- `apps/web` 现在只演示 `@workspace/ui/components/business` 中的 `AdminLayout`
- 首页 [`app/page.tsx`](/Users/yimo/Downloads/b_vmzfBKkXLXw-1773453068197/apps/web/app/page.tsx) 是当前唯一展示入口
- `components/admin-shell.tsx` 负责把 `AdminLayout` 包装成当前应用的轻量导航壳

## 本地约定

- 如果只是使用共享 layout，直接从 workspace 引入，不在 `apps/web` 再复制一份
- 只有当页面层确实需要脱离共享实现做深度改造时，才考虑用 shadcn 命令把源码拉到应用内
- 当前仓库已经移除了旧的 demo 页面和旧业务组件示例，新增展示请直接围绕首页场景扩展，不要重新建一组平行 demo

## 常用命令

```bash
pnpm --dir apps/web dev
pnpm --dir apps/web typecheck
pnpm --dir apps/web lint
```
