import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Briefcase,
  Clock,
  MessageSquare,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ReactNode;
}

const providerNavItems: NavItem[] = [
  {
    path: "/provider",
    labelKey: "nav.requests",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    path: "/provider/services",
    labelKey: "nav.services",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    path: "/provider/schedule",
    labelKey: "nav.schedule",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    path: "/provider/wallet",
    labelKey: "nav.wallet",
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    path: "/provider/chats",
    labelKey: "nav.chats",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    path: "/provider/profile",
    labelKey: "nav.profile",
    icon: <User className="h-5 w-5" />,
  },
];

export const ProviderBottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom">
      <div className="flex items-center justify-around py-1.5">
        {providerNavItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/provider" &&
              location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1 py-1 text-[9px] transition-colors min-w-0",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="h-4 w-4 flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                {item.icon}
              </span>
              <span className="truncate max-w-[48px]">{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
