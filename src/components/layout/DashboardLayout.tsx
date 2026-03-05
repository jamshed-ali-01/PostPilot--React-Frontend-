import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ImagePlus,
  Calendar,
  BarChart3,
  Settings,
  CheckCircle,
  Menu,
  X,
  LogOut,
  Megaphone,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/graphqlClient";
import { NotificationBell } from "@/components/layout/NotificationBell";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: "admin" | "staff";
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const { data: pendingData } = useQuery({
    queryKey: ["pendingPosts", user?.businessId],
    queryFn: () => graphqlRequest(`
      query GetPendingPosts($businessId: ID!) {
        pendingPosts(businessId: $businessId) {
          id
        }
      }
    `, { businessId: user?.businessId }),
    enabled: !!user?.businessId && !user?.isSystemAdmin,
    refetchInterval: 30000,
  });

  const pendingCount = pendingData?.pendingPosts?.length || 0;

  const navItems: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Create Post", href: "/create-post", icon: ImagePlus },
    { title: "Create Ad", href: "/create-ad", icon: Megaphone },
    { title: "Pending Approval", href: "/approvals", icon: CheckCircle, badge: pendingCount > 0 ? String(pendingCount) : undefined },
    { title: "Schedule", href: "/schedule", icon: Calendar },
    { title: "Analytics", href: "/analytics", icon: BarChart3 },
    { title: "Settings", href: "/settings", icon: Settings },
  ];

  if (user?.isSystemAdmin) {
    navItems.push({ title: "Subscription Packages", href: "/subscriptions", icon: Package });
    navItems.push({ title: "Manage Businesses", href: "/admin/businesses", icon: LayoutDashboard });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card border-b border-border px-3 flex items-center justify-between">
        <BrandLogo size="sm" showText={false} />
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeSwitcher variant="icon" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
            <BrandLogo />
          </div>

          {/* Theme Switcher - Desktop (inside sidebar) */}
          <div className="hidden lg:flex items-center justify-center px-4 py-3 border-b border-sidebar-border">
            <ThemeSwitcher />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "nav-item group relative",
                    isActive && "active"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span className="bg-accent text-accent-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {(user?.firstName?.[0] || user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.isSystemAdmin ? (user?.name || user?.firstName || "Global Admin") : (user?.business?.name || "Business Account")}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.isSystemAdmin ? "System Account" : "Business Account"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "lg:ml-64",
        "pt-16 lg:pt-0"
      )}>
        {/* Desktop Topbar */}
        <div className="hidden lg:flex sticky top-0 z-30 h-14 bg-card/80 backdrop-blur-md border-b border-border items-center justify-end gap-2 px-6">
          <NotificationBell />
        </div>

        {children}
      </main>
    </div>
  );
};
