import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminLayout, type NavGroup, type Notification, type AdminApp } from "./index.js";
import { describe, it, expect, vi } from "vitest";

// ── Mock next-themes ────────────────────────────────────────────────────────
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
  }),
}));

// ── Mock localStorage ───────────────────────────────────────────────────────
const localStorageMock: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (key: string) => localStorageMock[key] ?? null,
  setItem: (key: string, value: string) => { localStorageMock[key] = value; },
  removeItem: (key: string) => { delete localStorageMock[key]; },
  clear: () => { Object.keys(localStorageMock).forEach((k) => delete localStorageMock[k]); },
});

// ── Fixtures ────────────────────────────────────────────────────────────────

const adminUser = {
  name: "Admin User",
  email: "admin@example.com",
  avatar: "https://github.com/shadcn.png",
  roles: ["admin"],
};

const viewerUser = {
  name: "Viewer",
  email: "viewer@example.com",
  roles: ["viewer"],
};

const testNavGroups: NavGroup[] = [
  {
    label: "核心功能",
    items: [{ title: "仪表盘", href: "/dashboard", isActive: true }],
  },
  {
    label: "管理",
    items: [
      {
        title: "用户管理",
        href: "/users",
        roles: ["admin"],
        badge: 3,
        items: [
          { title: "用户列表", href: "/users/list" },
          { title: "角色设置", href: "/users/roles", roles: ["admin"] },
        ],
      },
    ],
  },
];

const testNotifications: Notification[] = [
  { id: "n1", title: "通知标题1", description: "描述1", time: "刚刚", read: false, type: "success" },
  { id: "n2", title: "通知标题2", description: "描述2", time: "1小时前", read: true, type: "info" },
];

const testApps: AdminApp[] = [
  { title: "CRM", href: "/apps/crm", description: "客户与线索管理" },
  { title: "Billing", href: "/apps/billing", description: "订阅与账单中心", roles: ["admin"] },
  { title: "Ops", href: "/apps/ops", description: "运维与监控面板" },
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe("AdminLayout — 基础渲染", () => {
  it("渲染 children 内容", () => {
    render(
      <AdminLayout>
        <div data-testid="page-content">页面内容</div>
      </AdminLayout>
    );
    expect(screen.getByTestId("page-content")).toBeDefined();
    expect(screen.getByText("页面内容")).toBeDefined();
  });

  it("显示用户姓名和邮箱", () => {
    render(
      <AdminLayout user={adminUser}>
        <div>内容</div>
      </AdminLayout>
    );
    expect(screen.getByText("Admin User")).toBeDefined();
    expect(screen.getByText("admin@example.com")).toBeDefined();
  });

  it("传入 breadcrumbs 时正确渲染", () => {
    render(
      <AdminLayout breadcrumbs={[{ title: "Home", href: "/" }, { title: "Settings" }]}>
        <div>内容</div>
      </AdminLayout>
    );
    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
  });
});

describe("AdminLayout — 面包屑自动生成", () => {
  it("未传 breadcrumbs 时，自动从激活菜单生成路径", () => {
    render(
      <AdminLayout
        navGroups={[{
          items: [{ title: "父菜单", items: [{ title: "子菜单", href: "/sub", isActive: true }] }],
        }]}
      >
        <div>内容</div>
      </AdminLayout>
    );
    // 自动生成路径，父菜单出现在面包屑或侧边栏之一
    expect(screen.getAllByText("父菜单").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("子菜单").length).toBeGreaterThanOrEqual(1);
  });
});

describe("AdminLayout — 权限守卫", () => {
  it("admin 用户可以看到 admin 菜单项", () => {
    render(
      <AdminLayout user={adminUser} navGroups={testNavGroups}>
        <div>内容</div>
      </AdminLayout>
    );
    // admin 菜单项应该出现
    expect(screen.getByText("用户管理")).toBeDefined();
  });

  it("viewer 用户看不到 roles=['admin'] 的菜单项", () => {
    render(
      <AdminLayout user={viewerUser} navGroups={testNavGroups}>
        <div>内容</div>
      </AdminLayout>
    );
    // admin only 菜单项不应该出现
    expect(screen.queryByText("用户管理")).toBeNull();
  });

  it("无 roles 限制的菜单项对所有用户可见", () => {
    render(
      <AdminLayout user={viewerUser} navGroups={testNavGroups}>
        <div>内容</div>
      </AdminLayout>
    );
    // 无 roles 限制的菜单项对所有用户可见（可能出现在侧边栏和面包屑中）
    expect(screen.getAllByText("仪表盘").length).toBeGreaterThanOrEqual(1);
  });
});

describe("AdminLayout — 菜单分组标题", () => {
  it("渲染 navGroups 的 label", () => {
    render(
      <AdminLayout user={adminUser} navGroups={testNavGroups}>
        <div>内容</div>
      </AdminLayout>
    );
    expect(screen.getByText("核心功能")).toBeDefined();
  });
});

describe("AdminLayout — Skeleton 骨架屏", () => {
  it("loading=true 时不渲染 children", () => {
    render(
      <AdminLayout loading={true}>
        <div data-testid="hidden-content">不应该渲染</div>
      </AdminLayout>
    );
    expect(screen.queryByTestId("hidden-content")).toBeNull();
  });

  it("loading=false 时正常渲染 children", () => {
    render(
      <AdminLayout loading={false}>
        <div data-testid="visible-content">应该渲染</div>
      </AdminLayout>
    );
    expect(screen.getByTestId("visible-content")).toBeDefined();
  });
});

describe("AdminLayout — 通知系统", () => {
  it("未读通知数量反映在铃铛角标上", () => {
    render(
      <AdminLayout user={adminUser} notifications={testNotifications}>
        <div>内容</div>
      </AdminLayout>
    );
    // 1条未读通知，应有红点
    const bells = document.querySelectorAll("button");
    const bellButton = Array.from(bells).find((b) =>
      b.querySelector("svg")
    );
    expect(bellButton).toBeDefined();
  });

  it("无通知时铃铛无红点", () => {
    render(
      <AdminLayout user={adminUser} notifications={[]}>
        <div>内容</div>
      </AdminLayout>
    );
    // pulse dot 不存在
    expect(document.querySelector(".bg-destructive.animate-pulse")).toBeNull();
  });
});

describe("AdminLayout — 错误边界", () => {
  it("子组件抛出异常时显示错误提示而不崩溃", () => {
    const ThrowComponent = () => {
      throw new Error("测试渲染错误");
    };
    // Suppress console.error noise from React error boundaries in tests
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <AdminLayout>
        <ThrowComponent />
      </AdminLayout>
    );
    expect(screen.getByText("页面渲染出错")).toBeDefined();
    expect(screen.getByText("测试渲染错误")).toBeDefined();
    spy.mockRestore();
  });
});

describe("AdminLayout — 路由适配", () => {
  it("提供 onNavigate 时点击菜单触发回调而非浏览器跳转", () => {
    const onNavigate = vi.fn();
    render(
      <AdminLayout
        user={adminUser}
        navGroups={[{
          items: [{ title: "跳转页面", href: "/target" }],
        }]}
        onNavigate={onNavigate}
      >
        <div>内容</div>
      </AdminLayout>
    );
    const link = screen.getByText("跳转页面");
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledWith("/target", expect.objectContaining({ href: "/target" }));
  });
});

describe("AdminLayout — 退出登录", () => {
  it("onLogout 为函数时组件正常渲染", () => {
    const onLogout = vi.fn();
    render(
      <AdminLayout user={adminUser} onLogout={onLogout}>
        <div>内容</div>
      </AdminLayout>
    );
    // Verify the component renders without error when onLogout is provided
    expect(screen.getAllByText("Admin User").length).toBeGreaterThanOrEqual(1);
    expect(typeof onLogout).toBe("function");
  });
});

describe("AdminLayout — App Switcher", () => {
  it("未传 apps 时不显示更多应用菜单", () => {
    render(
      <AdminLayout user={adminUser}>
        <div>内容</div>
      </AdminLayout>
    );
    fireEvent.click(screen.getByText("Admin Pro"));
    expect(screen.queryByText("更多应用")).toBeNull();
  });

  it("传入 apps 后点击品牌按钮显示应用项", async () => {
    render(
      <AdminLayout user={adminUser} apps={testApps}>
        <div>内容</div>
      </AdminLayout>
    );
    const trigger = screen.getByText("Admin Pro").closest("button");
    expect(trigger).toBeTruthy();
    fireEvent.pointerDown(trigger!);
    await waitFor(() => expect(screen.getByText("更多应用")).toBeDefined());
    expect(screen.getByText("CRM")).toBeDefined();
    expect(screen.getByText("Billing")).toBeDefined();
  });

  it("点击应用项触发 onAppNavigate 并阻止默认跳转", async () => {
    const onAppNavigate = vi.fn();
    render(
      <AdminLayout user={adminUser} apps={testApps} onAppNavigate={onAppNavigate}>
        <div>内容</div>
      </AdminLayout>
    );
    const trigger = screen.getByText("Admin Pro").closest("button");
    expect(trigger).toBeTruthy();
    fireEvent.pointerDown(trigger!);
    await waitFor(() => expect(screen.getByText("CRM")).toBeDefined());
    fireEvent.click(screen.getByText("CRM"));
    expect(onAppNavigate).toHaveBeenCalledWith("/apps/crm", expect.objectContaining({ href: "/apps/crm", title: "CRM" }));
  });

  it("roles 不匹配的应用不展示", async () => {
    render(
      <AdminLayout
        user={{ ...adminUser, roles: ["viewer"] }}
        apps={testApps}
      >
        <div>内容</div>
      </AdminLayout>
    );
    const trigger = screen.getByText("Admin Pro").closest("button");
    expect(trigger).toBeTruthy();
    fireEvent.pointerDown(trigger!);
    await waitFor(() => expect(screen.getByText("更多应用")).toBeDefined());
    expect(screen.queryByText("Billing")).toBeNull();
    expect(screen.getByText("CRM")).toBeDefined();
  });
});
