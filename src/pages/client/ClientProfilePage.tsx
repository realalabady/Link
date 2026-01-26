import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Bell,
  Globe,
  Moon,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  action?: React.ReactNode;
  onClick?: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  label,
  value,
  action,
  onClick,
}) => {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`flex w-full items-center justify-between py-3 ${
        onClick ? "transition-colors hover:bg-accent" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
        <span className="font-medium text-foreground">{label}</span>
      </div>
      {action ? (
        action
      ) : value ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{value}</span>
          <ChevronRight className="h-5 w-5 rtl:rotate-180" />
        </div>
      ) : (
        <ChevronRight className="h-5 w-5 text-muted-foreground rtl:rotate-180" />
      )}
    </Wrapper>
  );
};

const ClientProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLogoutDialogOpen(false);
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container py-4">
          <h1 className="text-xl font-semibold text-foreground">
            {t("nav.profile")}
          </h1>
        </div>
      </header>

      <main className="container py-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {/* Profile Card */}
          <motion.div
            variants={fadeInUp}
            className="mb-6 rounded-2xl bg-card p-6"
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl">
                👩
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">
                  {user?.name || t("profile.guest")}
                </h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <p className="mt-1 text-sm text-primary">{t("roles.client")}</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => {
                // TODO: Navigate to edit profile
              }}
            >
              {t("profile.editProfile")}
            </Button>
          </motion.div>

          {/* Account Settings */}
          <motion.section variants={fadeInUp} className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {t("profile.accountSettings")}
            </h3>
            <div className="rounded-2xl bg-card px-4">
              <SettingsItem
                icon={<User className="h-5 w-5" />}
                label={t("profile.personalInfo")}
                onClick={() => {}}
              />
              <Separator />
              <SettingsItem
                icon={<Mail className="h-5 w-5" />}
                label={t("auth.email")}
                value={user?.email}
              />
              <Separator />
              <SettingsItem
                icon={<Shield className="h-5 w-5" />}
                label={t("profile.security")}
                onClick={() => {}}
              />
            </div>
          </motion.section>

          {/* Preferences */}
          <motion.section variants={fadeInUp} className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {t("profile.preferences")}
            </h3>
            <div className="rounded-2xl bg-card px-4">
              <SettingsItem
                icon={<Bell className="h-5 w-5" />}
                label={t("profile.notifications")}
                action={
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                }
              />
              <Separator />
              <SettingsItem
                icon={<Globe className="h-5 w-5" />}
                label={t("profile.language")}
                action={<LanguageSwitcher />}
              />
              <Separator />
              <SettingsItem
                icon={<Moon className="h-5 w-5" />}
                label={t("profile.darkMode")}
                action={
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                }
              />
            </div>
          </motion.section>

          {/* Support */}
          <motion.section variants={fadeInUp} className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {t("profile.support")}
            </h3>
            <div className="rounded-2xl bg-card px-4">
              <SettingsItem
                icon={<HelpCircle className="h-5 w-5" />}
                label={t("profile.helpCenter")}
                onClick={() => {}}
              />
            </div>
          </motion.section>

          {/* Logout */}
          <motion.div variants={fadeInUp}>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="h-5 w-5" />
              {t("auth.logout")}
            </Button>
          </motion.div>
        </motion.div>
      </main>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.logoutTitle")}</DialogTitle>
            <DialogDescription>
              {t("profile.logoutDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              {t("auth.logout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientProfilePage;
