import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MoreVertical,
  User,
  ShieldCheck,
  Shield,
  Ban,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUsers, useUpdateUserStatus } from "@/hooks/queries/useUsers";
import { User as UserType, UserRole, UserStatus } from "@/types";

const AdminUsersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "suspend" | "activate" | null;
  }>({ open: false, action: null });

  // Fetch users
  const { data: users = [], isLoading } = useUsers();
  const updateStatusMutation = useUpdateUserStatus();

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !searchQuery ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleAction = (user: UserType, action: "suspend" | "activate") => {
    setSelectedUser(user);
    setActionDialog({ open: true, action });
  };

  const confirmAction = async () => {
    if (!selectedUser || !actionDialog.action) return;

    const newStatus: UserStatus =
      actionDialog.action === "suspend" ? "SUSPENDED" : "ACTIVE";

    try {
      await updateStatusMutation.mutateAsync({
        userId: selectedUser.uid,
        status: newStatus,
      });
      setActionDialog({ open: false, action: null });
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const getRoleBadge = (role: UserRole | null) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge variant="default" className="gap-1">
            <Shield className="h-3 w-3" />
            {t("roles.admin")}
          </Badge>
        );
      case "PROVIDER":
        return (
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            {t("roles.provider")}
          </Badge>
        );
      case "CLIENT":
        return (
          <Badge variant="outline" className="gap-1">
            <User className="h-3 w-3" />
            {t("roles.client")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("admin.noRole")}</Badge>;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="default" className="bg-green-500">
            {t("admin.active")}
          </Badge>
        );
      case "SUSPENDED":
        return <Badge variant="destructive">{t("admin.suspended")}</Badge>;
      case "PENDING":
        return <Badge variant="secondary">{t("admin.pending")}</Badge>;
      default:
        return null;
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {/* Header */}
        <motion.div variants={fadeInUp} className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {t("admin.usersManagement")}
          </h1>
          <p className="text-muted-foreground">{t("admin.usersDescription")}</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          variants={fadeInUp}
          className="mb-6 flex flex-col gap-4 md:flex-row md:items-center"
        >
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("admin.searchUsers")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>

          <Select
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value as UserRole | "ALL")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("admin.role")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("admin.allRoles")}</SelectItem>
              <SelectItem value="CLIENT">{t("roles.client")}</SelectItem>
              <SelectItem value="PROVIDER">{t("roles.provider")}</SelectItem>
              <SelectItem value="ADMIN">{t("roles.admin")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as UserStatus | "ALL")
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("admin.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("admin.allStatuses")}</SelectItem>
              <SelectItem value="ACTIVE">{t("admin.active")}</SelectItem>
              <SelectItem value="SUSPENDED">{t("admin.suspended")}</SelectItem>
              <SelectItem value="PENDING">{t("admin.pending")}</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Users List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 text-center"
          >
            <User className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t("admin.noUsers")}</p>
          </motion.div>
        ) : (
          <motion.div variants={fadeInUp} className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.uid}
                className="flex items-center justify-between rounded-xl bg-card p-4"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h3 className="font-semibold text-foreground">
                      {user.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user.status === "ACTIVE" ? (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleAction(user, "suspend")}
                      >
                        <Ban className="me-2 h-4 w-4" />
                        {t("admin.suspendUser")}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleAction(user, "activate")}
                      >
                        <CheckCircle className="me-2 h-4 w-4" />
                        {t("admin.activateUser")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog({ open, action: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "suspend"
                ? t("admin.suspendTitle")
                : t("admin.activateTitle")}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === "suspend"
                ? t("admin.suspendDescription", { name: selectedUser?.name })
                : t("admin.activateDescription", { name: selectedUser?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, action: null })}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant={
                actionDialog.action === "suspend" ? "destructive" : "default"
              }
              onClick={confirmAction}
              disabled={updateStatusMutation.isPending}
            >
              {actionDialog.action === "suspend"
                ? t("admin.suspend")
                : t("admin.activate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
