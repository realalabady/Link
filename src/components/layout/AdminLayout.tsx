import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  CheckCircle,
  CreditCard,
  LayoutDashboard,
  Gift,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";

const adminNavItems = [
  {
    path: "/admin",
    labelKey: "admin.nav.dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    path: "/admin/users",
    labelKey: "admin.nav.users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    path: "/admin/verifications",
    labelKey: "admin.nav.verifications",
    icon: <CheckCircle className="h-5 w-5" />,
  },
  {
    path: "/admin/payouts",
    labelKey: "admin.nav.payouts",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    path: "/admin/subscriptions",
    labelKey: "admin.nav.subscriptions",
    icon: <Gift className="h-5 w-5" />,
  },
];

export const AdminLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 z-40 h-screen w-64 border-e border-border bg-sidebar",
          isRTL ? "right-0" : "left-0",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-sidebar-border p-4">
            <h1 className="text-xl font-bold text-sidebar-foreground">
              {t("common.appName")} {t("admin.title")}
            </h1>
            <LanguageSwitcher />
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )
                }
              >
                {item.icon}
                <span>{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-sidebar-border p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50"
            >
              <LogOut className="h-5 w-5" />
              <span>{t("common.logout")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="ms-64 flex-1">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
