import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Search, Calendar, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGuest } from "@/contexts/GuestContext";

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ReactNode;
  guestAllowed?: boolean;
}

const clientNavItems: NavItem[] = [
  {
    path: "/client",
    labelKey: "nav.home",
    icon: <Home className="h-5 w-5" />,
    guestAllowed: true,
  },
  {
    path: "/client/search",
    labelKey: "nav.search",
    icon: <Search className="h-5 w-5" />,
    guestAllowed: true,
  },
  {
    path: "/client/bookings",
    labelKey: "nav.bookings",
    icon: <Calendar className="h-5 w-5" />,
    guestAllowed: false,
  },
  {
    path: "/client/chats",
    labelKey: "nav.chats",
    icon: <MessageSquare className="h-5 w-5" />,
    guestAllowed: false,
  },
  {
    path: "/client/profile",
    labelKey: "nav.profile",
    icon: <User className="h-5 w-5" />,
    guestAllowed: true,
  },
];

export const ClientBottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isGuest } = useGuest();

  // Filter nav items based on guest status
  const visibleNavItems = isGuest
    ? clientNavItems.filter((item) => item.guestAllowed)
    : clientNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom">
      <div className="flex items-center justify-around py-2">
        {visibleNavItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/client" &&
              location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] transition-colors min-w-0",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.icon}
              <span className="truncate max-w-[56px]">{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
