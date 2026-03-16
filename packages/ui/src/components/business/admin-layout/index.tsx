"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  SidebarGroupLabel,
  SidebarGroup,
  SidebarGroupContent,
} from "@workspace/ui/components/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@workspace/ui/components/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@workspace/ui/components/command";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@workspace/ui/components/sheet";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { Separator } from "@workspace/ui/components/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  ChevronRight, 
  LogOut, 
  User, 
  Bell,
  Search,
  Command as CommandIcon,
  Layout,
  Monitor,
  Settings2,
  Moon,
  Sun,
  Palette,
  Laptop,
  Check,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Boxes,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavItem {
  title: string;
  href?: string;
  icon?: React.ElementType;
  isActive?: boolean;
  badge?: number | string;
  /** Comma-separated or array of role names allowed to see this item */
  roles?: string[];
  items?: NavItem[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export type SidebarVariant = "sidebar" | "floating" | "inset";

export interface AdminApp {
  title: string;
  href: string;
  description?: string;
  icon?: React.ElementType;
  roles?: string[];
}

export interface Notification {
  id: string;
  title: string;
  description?: string;
  time: string;
  read?: boolean;
  type?: "info" | "success" | "warning" | "error";
}

export interface AdminLayoutProps {
  children: React.ReactNode;
  /** Sidebar app title shown in the top-left app switcher area */
  appTitle?: string;
  /** Sidebar app subtitle shown under the title */
  appSubtitle?: string;
  /** Current user info */
  user?: {
    name: string;
    email: string;
    avatar?: string;
    roles?: string[];
  };
  /** Navigation — flat list (legacy) or grouped */
  navigation?: NavItem[];
  navGroups?: NavGroup[];
  /** Breadcrumbs — if omitted, auto-generated from active menu item */
  breadcrumbs?: Array<{ title: string; href?: string }>;
  defaultVariant?: SidebarVariant;
  /** Whether to show a loading skeleton for the content area */
  loading?: boolean;
  /** Notifications to show in the notification drawer */
  notifications?: Notification[];
  /** Called when a single notification is marked as read */
  onNotificationRead?: (notification: Notification) => void | Promise<void>;
  /** Called when all unread notifications are marked as read */
  onNotificationsReadAll?: (notifications: Notification[]) => void | Promise<void>;
  /** Optional app switcher grid shown when provided */
  apps?: AdminApp[];
  /** Called when user clicks a nav item — use this to integrate with your router */
  onNavigate?: (href: string, item: NavItem) => void;
  /** Called when user clicks an app in the app switcher */
  onAppNavigate?: (href: string, app: AdminApp) => void;
  /** Called when user clicks logout */
  onLogout?: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultNavGroups: NavGroup[] = [
  {
    label: "核心功能",
    items: [
      {
        title: "仪表盘",
        href: "/dashboard",
        icon: LayoutDashboard,
        isActive: true,
      },
    ],
  },
  {
    label: "管理中心",
    items: [
      {
        title: "用户管理",
        icon: Users,
        badge: 3,
        roles: ["admin", "hr"],
        items: [
          { title: "用户列表", href: "/users", roles: ["admin", "hr"] },
          { title: "角色权限", href: "/roles", roles: ["admin"] },
          { title: "操作日志", href: "/logs", roles: ["admin"] },
        ],
      },
      {
        title: "系统设置",
        icon: Settings,
        roles: ["admin"],
        items: [
          { title: "基础配置", href: "/settings/basic" },
          { title: "邮件模板", href: "/settings/mail" },
          {
            title: "高级设置",
            items: [
              { title: "API 密钥", href: "/settings/advanced/api" },
              { title: "Webhooks", href: "/settings/advanced/webhooks" },
            ],
          },
        ],
      },
    ],
  },
];

const defaultNotifications: Notification[] = [
  { id: "1", title: "部署成功", description: "v2.4.1 已部署到生产环境", time: "刚刚", read: false, type: "success" },
  { id: "2", title: "磁盘用量告警", description: "服务器磁盘使用率已达 85%", time: "10分钟前", read: false, type: "warning" },
  { id: "3", title: "新用户注册", description: "张三 (zhangsan@abc.com) 完成了注册", time: "1小时前", read: true, type: "info" },
  { id: "4", title: "付款失败", description: "订单 #20240501 扣款失败", time: "昨天", read: true, type: "error" },
];

// ─── Color Presets ─────────────────────────────────────────────────────────────

const primaryColors = [
  { name: "品牌橙", hex: "#e85d2d", light: "oklch(0.553 0.195 38.402)", dark: "oklch(0.47 0.157 37.304)" },
  { name: "科技蓝", hex: "#3b82f6", light: "oklch(0.623 0.214 259.815)", dark: "oklch(0.55 0.18 259.815)" },
  { name: "生命绿", hex: "#10b981", light: "oklch(0.627 0.194 149.214)", dark: "oklch(0.56 0.17 149.214)" },
  { name: "活力橙", hex: "#f59e0b", light: "oklch(0.769 0.188 70.08)", dark: "oklch(0.65 0.18 70.08)" },
  { name: "警示红", hex: "#ef4444", light: "oklch(0.627 0.265 25.466)", dark: "oklch(0.56 0.22 25.466)" },
  { name: "高贵紫", hex: "#8b5cf6", light: "oklch(0.627 0.194 303.9)", dark: "oklch(0.55 0.17 303.9)" },
  { name: "玫瑰粉", hex: "#ec4899", light: "oklch(0.627 0.214 340)", dark: "oklch(0.55 0.18 340)" },
  { name: "靛蓝", hex: "#6366f1", light: "oklch(0.60 0.20 280)", dark: "oklch(0.52 0.17 280)" },
];
type ColorPreset = typeof primaryColors[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Check if nav item is accessible by user roles. No roles = public. */
function isAllowed(item: NavItem, userRoles: string[]): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  return item.roles.some((r) => userRoles.includes(r));
}

/** Recursively filter nav items by roles */
function filterByRole(items: NavItem[], userRoles: string[]): NavItem[] {
  return items
    .filter((item) => isAllowed(item, userRoles))
    .map((item) => ({
      ...item,
      items: item.items ? filterByRole(item.items, userRoles) : undefined,
    }));
}

function isAllowedRoles(roles: string[] | undefined, userRoles: string[]): boolean {
  if (!roles || roles.length === 0) return true;
  return roles.some((r) => userRoles.includes(r));
}

/** Auto-derive breadcrumbs from nav items */
function findActiveBreadcrumbs(
  items: NavItem[],
  trail: Array<{ title: string; href?: string }> = []
): Array<{ title: string; href?: string }> | null {
  for (const item of items) {
    const current = { title: item.title, href: item.href };
    if (item.isActive && !item.items?.length) return [...trail, current];
    if (item.items) {
      const found = findActiveBreadcrumbs(item.items, [...trail, current]);
      if (found) return found;
    }
  }
  return null;
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  error: Error | null;
}

class ContentErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center text-muted-foreground">
          <XCircle className="size-12 text-destructive opacity-50" />
          <div>
            <p className="font-semibold text-foreground">页面渲染出错</p>
            <p className="mt-1 text-sm">{this.state.error.message}</p>
          </div>
          <button
            className="rounded-md border px-4 py-1.5 text-sm hover:bg-accent"
            onClick={() => this.setState({ error: null })}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Skeleton Loading ─────────────────────────────────────────────────────────

function ContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

// ─── Notification Icon by type ────────────────────────────────────────────────

function NotifIcon({ type }: { type?: Notification["type"] }) {
  const cls = "size-4 flex-shrink-0";
  switch (type) {
    case "success": return <CheckCircle className={cn(cls, "text-green-500")} />;
    case "warning": return <AlertTriangle className={cn(cls, "text-amber-500")} />;
    case "error":   return <XCircle className={cn(cls, "text-red-500")} />;
    default:        return <Info className={cn(cls, "text-blue-500")} />;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminLayout({
  children,
  appTitle = "Admin Pro",
  appSubtitle = "Enterprise Edition",
  user = {
    name: "Yimo",
    email: "yimo@example.com",
    avatar: "https://github.com/shadcn.png",
    roles: ["admin"],
  },
  navigation,
  navGroups,
  breadcrumbs: breadcrumbsProp,
  defaultVariant = "sidebar",
  loading = false,
  notifications = defaultNotifications,
  onNotificationRead,
  onNotificationsReadAll,
  apps,
  onNavigate,
  onAppNavigate,
  onLogout,
}: AdminLayoutProps) {
  const [variant, setVariant] = React.useState<SidebarVariant>(defaultVariant);
  const [openCommand, setOpenCommand] = React.useState(false);
  const [openNotif, setOpenNotif] = React.useState(false);
  const [activeColor, setActiveColor] = React.useState(primaryColors[0]?.hex || "");
  const [notifList, setNotifList] = React.useState<Notification[]>(notifications);

  const { theme, setTheme, resolvedTheme } = useTheme();

  React.useEffect(() => {
    setNotifList(notifications);
  }, [notifications]);

  const userRoles = user.roles || [];

  const resolvedApps = React.useMemo(() => {
    if (!apps || apps.length === 0) return [];
    return apps.filter((a) => isAllowedRoles(a.roles, userRoles));
  }, [apps, userRoles]);

  // ── Resolve navigation groups ──────────────────────────────────────────────
  const resolvedGroups = React.useMemo<NavGroup[]>(() => {
    const groups = navGroups ?? (navigation
      ? [{ items: navigation }]
      : defaultNavGroups);
    return groups.map((g) => ({
      ...g,
      items: filterByRole(g.items, userRoles),
    }));
  }, [navGroups, navigation, userRoles]);

  // ── Auto breadcrumbs ───────────────────────────────────────────────────────
  const breadcrumbs = React.useMemo(() => {
    if (breadcrumbsProp) return breadcrumbsProp;
    const allItems = resolvedGroups.flatMap((g) => g.items);
    return findActiveBreadcrumbs(allItems) ?? [{ title: "Dashboard" }];
  }, [breadcrumbsProp, resolvedGroups]);

  // ── Sidebar collapsible state persisted to localStorage ───────────────────
  const STORAGE_KEY = "admin-layout-variant";
  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as SidebarVariant | null;
    if (saved) setVariant(saved);
  }, []);
  const changeVariant = (v: SidebarVariant) => {
    setVariant(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  // ── Command Palette shortcut ───────────────────────────────────────────────
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCommand((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // ── Color change ──────────────────────────────────────────────────────────
  const handleColorChange = (color: ColorPreset) => {
    setActiveColor(color.hex);
    const isDark = resolvedTheme === "dark";
    const primary = isDark ? color.dark : color.light;
    const el = document.documentElement;
    el.style.setProperty("--primary", primary);
    el.style.setProperty("--sidebar-primary", primary);
    el.style.setProperty("--ring", primary);
  };

  // ── Notification helpers ───────────────────────────────────────────────────
  const unreadCount = notifList.filter((n) => !n.read).length;
  const markNotificationRead = async (notification: Notification) => {
    if (notification.read) return;

    setNotifList((ns) =>
      ns.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      )
    );

    try {
      await onNotificationRead?.(notification);
    } catch {
      setNotifList((ns) =>
        ns.map((item) =>
          item.id === notification.id ? { ...item, read: false } : item
        )
      );
    }
  };

  const markAllRead = async () => {
    const unreadNotifications = notifList.filter((n) => !n.read);

    if (unreadNotifications.length === 0) return;

    setNotifList((ns) => ns.map((n) => ({ ...n, read: true })));

    try {
      await onNotificationsReadAll?.(unreadNotifications);
    } catch {
      setNotifList((ns) =>
        ns.map((item) => {
          const shouldRollback = unreadNotifications.some(
            (notification) => notification.id === item.id
          );

          return shouldRollback ? { ...item, read: false } : item;
        })
      );
    }
  };

  // ── Nav click handler ─────────────────────────────────────────────────────
  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    if (onNavigate && item.href) {
      e.preventDefault();
      onNavigate(item.href, item);
    }
  };

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <Sidebar variant={variant} collapsible="icon">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  {resolvedApps.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors duration-300">
                            <CommandIcon className="size-4" />
                          </div>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{appTitle}</span>
                            <span className="truncate text-xs opacity-60">{appSubtitle}</span>
                          </div>
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-96 overflow-hidden rounded-xl p-0"
                        sideOffset={8}
                      >
                        <div className="border-b bg-popover/40 px-4 py-3">
                          <p className="text-sm font-semibold leading-none text-foreground">更多应用</p>
                          <p className="mt-1 text-xs text-muted-foreground">快速切换到其他工作台</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 p-3">
                          {resolvedApps.map((app) => {
                            const Icon = app.icon;
                            return (
                              <DropdownMenuItem
                                key={app.href}
                                asChild
                                className="h-auto cursor-pointer items-start rounded-lg p-0 focus:bg-transparent data-highlighted:bg-transparent"
                              >
                                <a
                                  href={app.href}
                                  onClick={(e) => {
                                    if (!onAppNavigate) return;
                                    e.preventDefault();
                                    onAppNavigate(app.href, app);
                                  }}
                                  className={cn(
                                    "group flex w-full flex-col gap-2 rounded-lg border border-border/60 bg-card/60 p-3 text-left shadow-xs transition-colors",
                                    "hover:border-border hover:bg-accent/50",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                  )}
                                >
                                  <div className="flex items-start gap-2">
                                    <div
                                      className={cn(
                                        "flex size-9 items-center justify-center rounded-md border border-border/60",
                                        "bg-primary/10 text-primary",
                                        "ring-1 ring-primary/15",
                                        "group-hover:bg-primary/15"
                                      )}
                                    >
                                      {Icon ? <Icon className="size-4" /> : <Boxes className="size-4" />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-foreground">
                                        {app.title}
                                      </p>
                                      {app.description ? (
                                        <p className="line-clamp-2 text-xs text-muted-foreground">
                                          {app.description}
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                </a>
                              </DropdownMenuItem>
                            );
                          })}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors duration-300">
                        <CommandIcon className="size-4" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{appTitle}</span>
                        <span className="truncate text-xs opacity-60">{appSubtitle}</span>
                      </div>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
              {loading ? (
                <SidebarSkeleton />
              ) : (
                resolvedGroups.map((group, gi) => (
                  <SidebarGroup key={gi}>
                    {group.label && (
                      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                    )}
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => (
                          <NavMenuItem
                            key={item.title}
                            item={item}
                            onNavClick={handleNavClick}
                          />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                    {gi < resolvedGroups.length - 1 && (
                      <SidebarSeparator className="mt-2" />
                    )}
                  </SidebarGroup>
                ))
              )}
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="rounded-lg">
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">{user.name}</span>
                          <span className="truncate text-xs opacity-60">{user.email}</span>
                        </div>
                        <ChevronRight className="ml-auto size-4 opacity-50" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-lg" side="top" align="end" sideOffset={4}>
                      <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5 text-sm">
                          <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="rounded-lg">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{user.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem>
                          <User className="mr-2 size-4" />个人中心
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpenNotif(true)}>
                          <Bell className="mr-2 size-4" />
                          消息通知
                          {unreadCount > 0 && (
                            <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
                              {unreadCount}
                            </span>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={onLogout}
                      >
                        <LogOut className="mr-2 size-4" />退出登录
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          {/* ── Main content ────────────────────────────────────────────── */}
          <SidebarInset className="flex flex-col relative bg-muted/10">
            {/* Subtle background decoration */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/5 to-transparent" />

            {/* Header */}
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/60 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((crumb, i) => (
                      <React.Fragment key={crumb.title}>
                        <BreadcrumbItem className={cn(i < breadcrumbs.length - 1 && "hidden md:flex")}>
                          {crumb.href ? (
                            <BreadcrumbLink href={crumb.href}>{crumb.title}</BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                        {i < breadcrumbs.length - 1 && (
                          <BreadcrumbSeparator className="hidden md:block" />
                        )}
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <div className="flex items-center gap-2">
                {/* Search / Command trigger */}
                <button
                  onClick={() => setOpenCommand(true)}
                  className="hidden h-9 w-56 items-center gap-2 rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground transition-all hover:bg-muted/50 md:flex"
                >
                  <Search className="h-4 w-4" />
                  <span>搜索...</span>
                  <kbd className="pointer-events-none ml-auto flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
                    <span>⌘</span>K
                  </kbd>
                </button>

                {/* Layout & theme switcher */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-accent">
                      <Settings2 className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Settings2 className="size-4" />界面配置
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        侧边栏样式
                      </DropdownMenuLabel>
                      {(["sidebar", "floating", "inset"] as SidebarVariant[]).map((v) => (
                        <DropdownMenuItem key={v} onClick={() => changeVariant(v)}>
                          <Layout className="mr-2 size-4" />
                          {{ sidebar: "默认边栏", floating: "悬浮模式", inset: "嵌入模式" }[v]}
                          {variant === v && <Check className="ml-auto size-3.5 text-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        外观主题
                      </DropdownMenuLabel>
                      {[
                        { value: "light", label: "浅色", icon: Sun },
                        { value: "dark", label: "深色", icon: Moon },
                        { value: "system", label: "跟随系统", icon: Laptop },
                      ].map(({ value, label, icon: Icon }) => (
                        <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
                          <Icon className="mr-2 size-4" />{label}
                          {theme === value && <Check className="ml-auto size-3.5 text-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        主色调
                      </DropdownMenuLabel>
                      <div className="grid grid-cols-4 gap-1.5 px-2 pb-2">
                        {primaryColors.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => handleColorChange(color)}
                            className={cn(
                              "flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-black/10 px-1.5 text-[10px] font-medium transition-all hover:scale-105 active:scale-95 dark:border-white/10",
                              activeColor === color.hex && "ring-1 ring-offset-1 ring-offset-background"
                            )}
                            style={{
                              backgroundColor: color.hex + "22",
                              borderColor: activeColor === color.hex ? color.hex : undefined,
                            }}
                            title={color.name}
                          >
                            <span className="size-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color.hex }} />
                            <span className="truncate" style={{ color: color.hex }}>{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Notification bell */}
                <button
                  onClick={() => setOpenNotif(true)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-accent"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-destructive" />
                  )}
                </button>
              </div>
            </header>

            {/* Content */}
            <main className="relative flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 z-0">
              <div className="mx-auto w-full max-w-7xl animate-in fade-in slide-in-from-bottom-3 duration-500">
                <ContentErrorBoundary>
                  {loading ? <ContentSkeleton /> : children}
                </ContentErrorBoundary>
              </div>
            </main>
          </SidebarInset>
        </div>

        {/* ── Command Palette ─────────────────────────────────────────── */}
        {openCommand && (
          <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
            <CommandInput placeholder="输入指令或搜索页面..." />
            <CommandList>
              <CommandEmpty>未找到相关内容。</CommandEmpty>
              <CommandGroup heading="页面跳转">
                {resolvedGroups.flatMap((g) => g.items).filter(i => i.href).map(item => (
                  <CommandItem
                    key={item.href}
                    onSelect={() => {
                      if (item.href && onNavigate) onNavigate(item.href, item);
                      setOpenCommand(false);
                    }}
                  >
                    {item.icon && <item.icon className="mr-2 size-4" />}
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="偏好设置">
                <CommandItem onSelect={() => { changeVariant("floating"); setOpenCommand(false); }}>
                  <Monitor className="mr-2 size-4" />
                  <span>切换至悬浮布局</span>
                  <CommandShortcut>⌘F</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => { setTheme(resolvedTheme === "dark" ? "light" : "dark"); setOpenCommand(false); }}>
                  {resolvedTheme === "dark" ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
                  <span>切换至{resolvedTheme === "dark" ? "浅色" : "深色"}模式</span>
                  <CommandShortcut>⌘D</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => { setOpenNotif(true); setOpenCommand(false); }}>
                  <Bell className="mr-2 size-4" />
                  <span>打开通知中心</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        )}

        {/* ── Notification Drawer ─────────────────────────────────────── */}
        <Sheet open={openNotif} onOpenChange={setOpenNotif}>
          <SheetContent className="flex w-96 flex-col gap-0 p-0">
            <SheetHeader className="border-b px-4 py-4">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2">
                  <Bell className="size-4" />
                  通知中心
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
                      {unreadCount}
                    </span>
                  )}
                </SheetTitle>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    全部已读
                  </button>
                )}
              </div>
              <SheetDescription className="sr-only">系统通知列表</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">
              {notifList.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                  <Bell className="size-8 opacity-30" />
                  <p className="text-sm">暂无通知</p>
                </div>
              ) : (
                notifList.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "group flex gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/30",
                      !notif.read && "bg-primary/5"
                    )}
                  >
                    <div className="mt-0.5">
                      <NotifIcon type={notif.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-snug", !notif.read && "font-semibold")}>
                          {notif.title}
                        </p>
                        {!notif.read ? (
                          <button
                            onClick={() => void markNotificationRead(notif)}
                            className="flex-shrink-0 text-[11px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                          >
                            标记已读
                          </button>
                        ) : null}
                      </div>
                      {notif.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {notif.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/60">
                        <Clock className="size-3" />
                        {notif.time}
                        {!notif.read && (
                          <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </SidebarProvider>
    </TooltipProvider>
  );
}

// ─── NavMenuItem ──────────────────────────────────────────────────────────────

function NavMenuItem({
  item,
  onNavClick,
}: {
  item: NavItem;
  onNavClick: (e: React.MouseEvent, item: NavItem) => void;
}) {
  const hasItems = item.items && item.items.length > 0;

  if (!hasItems) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip={item.title}
          isActive={item.isActive}
          className={cn(
            "relative transition-all duration-200",
            item.isActive && "bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:text-primary"
          )}
        >
          <a href={item.href || "#"} onClick={(e) => onNavClick(e, item)}>
            {item.icon && (
              <item.icon className={cn("size-4 transition-colors", item.isActive && "text-primary")} />
            )}
            <span>{item.title}</span>
            {item.isActive && (
              <span className="absolute left-0 h-4 w-0.5 rounded-r-full bg-primary" />
            )}
          </a>
        </SidebarMenuButton>
        {item.badge !== undefined && (
          <SidebarMenuBadge
            className={cn(
              "text-[10px]",
              item.isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {item.badge}
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild className="group/collapsible" defaultOpen={item.isActive}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            className={cn(
              "transition-all duration-200",
              item.isActive && "text-primary font-semibold"
            )}
          >
            {item.icon && (
              <item.icon className={cn("size-4 transition-colors", item.isActive && "text-primary")} />
            )}
            <span>{item.title}</span>
            {item.badge !== undefined && (
              <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] text-muted-foreground">
                {item.badge}
              </span>
            )}
            <ChevronRight
              className={cn(
                "ml-auto flex-shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90",
                item.isActive && "text-primary"
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <NavSubMenuItem key={subItem.title} item={subItem} onNavClick={onNavClick} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

// ─── NavSubMenuItem ───────────────────────────────────────────────────────────

function NavSubMenuItem({
  item,
  onNavClick,
}: {
  item: NavItem;
  onNavClick: (e: React.MouseEvent, item: NavItem) => void;
}) {
  const hasItems = item.items && item.items.length > 0;

  if (!hasItems) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          asChild
          isActive={item.isActive}
          className={cn(
            "transition-all duration-200",
            item.isActive && "bg-primary/10 text-primary font-medium hover:bg-primary/15 hover:text-primary"
          )}
        >
          <a href={item.href || "#"} onClick={(e) => onNavClick(e, item)}>
            <span>{item.title}</span>
          </a>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <Collapsible asChild className="group/sub-collapsible">
        <>
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton className="justify-between pr-0">
              <span>{item.title}</span>
              <ChevronRight className="size-3.5 flex-shrink-0 transition-transform duration-200 group-data-[state=open]/sub-collapsible:rotate-90" />
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="ml-2 border-l border-sidebar-border pl-2">
              {item.items?.map((nestedItem) => (
                <NavSubMenuItem key={nestedItem.title} item={nestedItem} onNavClick={onNavClick} />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </>
      </Collapsible>
    </SidebarMenuSubItem>
  );
}
