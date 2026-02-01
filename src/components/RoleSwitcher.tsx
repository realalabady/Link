import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Briefcase, User, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";

interface RoleSwitcherProps {
  className?: string;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, switchRole } = useAuth();

  // Only show if user has multiple roles
  if (!user || !user.roles || user.roles.length <= 1) {
    return null;
  }

  const handleSwitchRole = async (role: UserRole) => {
    if (role === user.activeRole) return;

    try {
      await switchRole(role);
      // Navigate to the new role's home page
      if (role === "CLIENT") {
        navigate("/client");
      } else if (role === "PROVIDER") {
        navigate("/provider");
      } else if (role === "ADMIN") {
        navigate("/admin");
      }
    } catch (error) {
      console.error("Failed to switch role:", error);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "CLIENT":
        return <User className="h-4 w-4" />;
      case "PROVIDER":
        return <Briefcase className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "CLIENT":
        return t("roles.client", "Client");
      case "PROVIDER":
        return t("roles.provider", "Provider");
      case "ADMIN":
        return t("roles.admin", "Admin");
      default:
        return role;
    }
  };

  const currentIcon = user.activeRole ? (
    getRoleIcon(user.activeRole)
  ) : (
    <ArrowLeftRight className="h-4 w-4" />
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          title={t("roles.switch", "Switch Role")}
        >
          <ArrowLeftRight className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {user.roles.map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => handleSwitchRole(role)}
            className={`flex items-center gap-2 ${
              role === user.activeRole ? "bg-accent" : ""
            }`}
          >
            {getRoleIcon(role)}
            <span>{getRoleLabel(role)}</span>
            {role === user.activeRole && (
              <span className="ms-auto text-xs text-muted-foreground">
                {t("roles.current", "Current")}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
