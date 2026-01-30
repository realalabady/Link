import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Lock,
  Unlock,
  Calendar,
  AlertCircle,
  Edit2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useUsers } from "@/hooks/queries/useUsers";
import { useUpdateProviderProfile } from "@/hooks/queries/useProviders";
import { ProviderProfile } from "@/types";
import {
  getProviderProfile,
  verifySubscriptionPayment,
  updateSubscriptionStatus,
} from "@/lib/firestore";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const AdminSubscriptionsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isArabic = i18n.language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "EXPIRED" | "LOCKED"
  >("ALL");
  const [lockDialog, setLockDialog] = useState<{
    open: boolean;
    provider: ProviderProfile | null;
    action: "lock" | "unlock" | null;
  }>({ open: false, provider: null, action: null });

  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    provider: ProviderProfile | null;
  }>({ open: false, provider: null });

  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    provider: ProviderProfile | null;
    notes: string;
    paymentDate: string;
    paymentAmount: string;
    paymentMethod: "BANK_TRANSFER" | "CARD" | "OTHER";
  }>({
    open: false,
    provider: null,
    notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentAmount: "",
    paymentMethod: "BANK_TRANSFER",
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  const { data: users = [], isLoading } = useUsers();
  const updateProviderMutation = useUpdateProviderProfile();

  // Get all providers
  const providers = useMemo(() => {
    return users.filter((user) => user.role === "PROVIDER");
  }, [users]);

  // Get provider profiles and subscription data
  const [providerProfiles, setProviderProfiles] = useState<
    Map<string, ProviderProfile>
  >(new Map());

  React.useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoadingProfiles(true);
      try {
        const profiles = new Map<string, ProviderProfile>();
        for (const provider of providers) {
          try {
            const profileData = await getProviderProfile(provider.uid);
            if (profileData) {
              profiles.set(provider.uid, profileData);
            }
          } catch (error) {
            console.warn(`Failed to fetch profile for ${provider.uid}:`, error);
          }
        }
        setProviderProfiles(profiles);
      } finally {
        setIsLoadingProfiles(false);
      }
    };
    if (providers.length > 0) {
      fetchProfiles();
    } else {
      setIsLoadingProfiles(false);
    }
  }, [providers]);

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    return providers
      .map((user) => {
        const profile = providerProfiles.get(user.uid);
        return {
          user,
          profile,
        };
      })
      .filter((item) => {
        const name = item.user.name.toLowerCase();
        const email = item.user.email.toLowerCase();
        const query = searchQuery.toLowerCase();

        const matchesSearch = name.includes(query) || email.includes(query);

        if (statusFilter === "ALL") return matchesSearch;
        if (statusFilter === "LOCKED")
          return matchesSearch && item.profile?.accountStatus === "LOCKED";
        return (
          matchesSearch && item.profile?.subscriptionStatus === statusFilter
        );
      });
  }, [providers, providerProfiles, searchQuery, statusFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const profiles = Array.from(providerProfiles.values());
    const active = profiles.filter(
      (p) => p.subscriptionStatus === "ACTIVE" && p.accountStatus === "ACTIVE",
    ).length;
    const expired = profiles.filter(
      (p) => p.subscriptionStatus === "EXPIRED",
    ).length;
    const locked = profiles.filter((p) => p.accountStatus === "LOCKED").length;

    return { active, expired, locked };
  }, [providerProfiles]);

  const handleLockUnlock = async (
    provider: ProviderProfile,
    action: "lock" | "unlock",
  ) => {
    try {
      await updateProviderMutation.mutateAsync({
        uid: provider.uid,
        updates: {
          accountStatus: action === "lock" ? "LOCKED" : "ACTIVE",
        },
      });

      // Update local state
      const updated = new Map(providerProfiles);
      const existing = updated.get(provider.uid);
      if (existing) {
        updated.set(provider.uid, {
          ...existing,
          accountStatus: action === "lock" ? "LOCKED" : "ACTIVE",
        });
        setProviderProfiles(updated);
      }

      toast({
        title: t("common.success"),
        description: `Account ${action === "lock" ? "locked" : "unlocked"} successfully`,
      });
      setLockDialog({ open: false, provider: null, action: null });
    } catch (error) {
      console.error("Failed to update account status:", error);
      toast({
        title: t("common.error"),
        description: "Failed to update account status",
        variant: "destructive",
      });
    }
  };

  const handleVerifyPayment = async (
    provider: ProviderProfile,
    paymentDate: string,
    paymentAmount: string,
    paymentMethod: "BANK_TRANSFER" | "CARD" | "OTHER",
    notes: string,
  ) => {
    try {
      setIsUpdating(true);
      const amount =
        parseFloat(paymentAmount) || provider.subscriptionPrice || 10;
      const date = new Date(paymentDate);

      await verifySubscriptionPayment(provider.uid, {
        date,
        amount,
        method: paymentMethod,
        notes,
      });

      // Update local state
      const updated = new Map(providerProfiles);
      const existing = updated.get(provider.uid);
      if (existing) {
        const endDate = new Date(date);
        const months =
          existing.subscriptionPrice === 27
            ? 3
            : existing.subscriptionPrice === 96
              ? 12
              : 1;
        endDate.setMonth(endDate.getMonth() + months);

        updated.set(provider.uid, {
          ...existing,
          subscriptionStatus: "ACTIVE",
          subscriptionStartDate: date,
          subscriptionEndDate: endDate,
          lastPaymentDate: date,
          lastSubscriptionPaymentDate: date,
          lastSubscriptionPaymentAmount: amount,
          lastSubscriptionPaymentMethod: paymentMethod,
          paymentVerificationStatus: "VERIFIED",
          paymentNotes: notes || "Payment verified by admin",
          accountStatus: "ACTIVE",
        });
        setProviderProfiles(updated);
      }

      toast({
        title: t("common.success"),
        description: "Payment verified successfully",
      });
      setPaymentDialog({
        open: false,
        provider: null,
        notes: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentAmount: "",
        paymentMethod: "BANK_TRANSFER",
      });
    } catch (error) {
      console.error("Failed to verify payment:", error);
      toast({
        title: t("common.error"),
        description: "Failed to verify payment",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (
    provider: ProviderProfile,
    newStatus: "ACTIVE" | "EXPIRED" | "CANCELLED",
  ) => {
    try {
      setIsUpdating(true);
      await updateSubscriptionStatus(provider.uid, newStatus);

      // Update local state
      const updated = new Map(providerProfiles);
      const existing = updated.get(provider.uid);
      if (existing) {
        const updates: Partial<ProviderProfile> = {
          ...existing,
          subscriptionStatus: newStatus,
        };
        if (newStatus === "CANCELLED") {
          updates.cancellationDate = new Date();
        }
        updated.set(provider.uid, updates as ProviderProfile);
        setProviderProfiles(updated);
      }

      toast({
        title: t("common.success"),
        description: `Subscription status updated to ${newStatus}`,
      });
      setStatusDialog({ open: false, provider: null });
    } catch (error) {
      console.error("Failed to update subscription status:", error);
      toast({
        title: t("common.error"),
        description: "Failed to update subscription status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return t("admin.notProvided");
    return new Date(date).toLocaleDateString();
  };

  const daysUntilExpiry = (endDate: Date | undefined) => {
    if (!endDate) return -1;
    const today = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff;
  };

  const isLoading_ = isLoading || isLoadingProfiles;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="mb-8 text-3xl font-bold text-foreground">
        {t("admin.subscriptions")}
      </h1>

      {/* Metrics Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.activeSubscriptions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.active}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.expiredSubscriptions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {metrics.expired}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.lockedAccounts")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {metrics.locked}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("admin.searchProviders")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "ALL" | "ACTIVE" | "EXPIRED" | "LOCKED")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("admin.filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("common.all")}</SelectItem>
            <SelectItem value="ACTIVE">{t("admin.active")}</SelectItem>
            <SelectItem value="EXPIRED">{t("admin.expired")}</SelectItem>
            <SelectItem value="LOCKED">{t("admin.locked")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions List */}
      <Card>
        <CardContent className="p-0">
          {isLoading_ ? (
            <div className="space-y-4 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {t("admin.noSubscriptions")}
            </div>
          ) : (
            <div className="divide-y">
              {filteredSubscriptions.map(({ user, profile }) => (
                <div
                  key={user.uid}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {user.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={
                            profile?.subscriptionStatus === "ACTIVE"
                              ? "default"
                              : profile?.subscriptionStatus === "EXPIRED"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {profile?.subscriptionStatus || "EXPIRED"}
                        </Badge>
                      </div>
                    </div>

                    {profile?.subscriptionEndDate && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {t("admin.expiresOn")}:{" "}
                          {formatDate(profile.subscriptionEndDate)}
                        </span>
                        {daysUntilExpiry(profile.subscriptionEndDate) <= 7 &&
                          daysUntilExpiry(profile.subscriptionEndDate) > 0 && (
                            <AlertCircle className="ml-2 h-4 w-4 text-amber-600" />
                          )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile?.subscriptionStatus === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPaymentDialog({
                            open: true,
                            provider: profile,
                            notes: "",
                            paymentDate: new Date().toISOString().split("T")[0],
                            paymentAmount: "",
                            paymentMethod: "BANK_TRANSFER",
                          })
                        }
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Paid
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setStatusDialog({
                          open: true,
                          provider: profile,
                        })
                      }
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Status
                    </Button>

                    {profile?.accountStatus === "LOCKED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setLockDialog({
                            open: true,
                            provider: profile,
                            action: "unlock",
                          })
                        }
                      >
                        <Unlock className="mr-2 h-4 w-4" />
                        {t("admin.unlockAccount")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          setLockDialog({
                            open: true,
                            provider: profile,
                            action: "lock",
                          })
                        }
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        {t("admin.lockAccount")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lock/Unlock Dialog */}
      <Dialog
        open={lockDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setLockDialog({ open: false, provider: null, action: null });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {lockDialog.action === "lock"
                ? t("admin.lockAccountTitle")
                : t("admin.unlockAccountTitle")}
            </DialogTitle>
            <DialogDescription>
              {lockDialog.provider?.displayName || lockDialog.provider?.uid}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {lockDialog.action === "lock"
              ? t("admin.lockAccountMessage")
              : t("admin.unlockAccountMessage")}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setLockDialog({ open: false, provider: null, action: null })
              }
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant={lockDialog.action === "lock" ? "destructive" : "default"}
              disabled={updateProviderMutation.isPending}
              onClick={() => {
                if (lockDialog.provider && lockDialog.action) {
                  handleLockUnlock(lockDialog.provider, lockDialog.action);
                }
              }}
            >
              {lockDialog.action === "lock"
                ? t("admin.lockAccount")
                : t("admin.unlockAccount")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog
        open={statusDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialog({ open: false, provider: null });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Subscription Status</DialogTitle>
            <DialogDescription>
              {statusDialog.provider?.displayName || statusDialog.provider?.uid}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {["ACTIVE", "EXPIRED", "CANCELLED"].map((status) => (
                <Button
                  key={status}
                  variant={
                    statusDialog.provider?.subscriptionStatus === status
                      ? "default"
                      : "outline"
                  }
                  onClick={() => {
                    if (statusDialog.provider) {
                      handleUpdateStatus(
                        statusDialog.provider,
                        status as "ACTIVE" | "EXPIRED" | "CANCELLED",
                      );
                    }
                  }}
                  disabled={isUpdating}
                  className="text-xs sm:text-sm"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Verification Dialog */}
      <Dialog
        open={paymentDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentDialog({
              open: false,
              provider: null,
              notes: "",
              paymentDate: new Date().toISOString().split("T")[0],
              paymentAmount: "",
              paymentMethod: "BANK_TRANSFER",
            });
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verify Subscription Payment</DialogTitle>
            <DialogDescription>
              {paymentDialog.provider?.displayName ||
                paymentDialog.provider?.uid}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Current Plan</Label>
              <p className="mt-1 text-sm font-medium">
                {paymentDialog.provider?.subscriptionPrice === 27
                  ? "Quarterly (3 months) - 27 SAR"
                  : paymentDialog.provider?.subscriptionPrice === 96
                    ? "Yearly (12 months) - 96 SAR"
                    : "Monthly - 10 SAR"}
              </p>
            </div>

            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDialog.paymentDate}
                onChange={(e) =>
                  setPaymentDialog({
                    ...paymentDialog,
                    paymentDate: e.target.value,
                  })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="paymentAmount">Amount Received (SAR)</Label>
              <Input
                id="paymentAmount"
                type="number"
                placeholder={`${paymentDialog.provider?.subscriptionPrice || 10}`}
                value={paymentDialog.paymentAmount}
                onChange={(e) =>
                  setPaymentDialog({
                    ...paymentDialog,
                    paymentAmount: e.target.value,
                  })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentDialog.paymentMethod}
                onValueChange={(value) =>
                  setPaymentDialog({
                    ...paymentDialog,
                    paymentMethod: value as "BANK_TRANSFER" | "CARD" | "OTHER",
                  })
                }
              >
                <SelectTrigger id="paymentMethod" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CARD">Card Payment</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">
                Admin Notes (e.g., Transaction Reference)
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g., Bank transfer received, ref: TXN123456"
                value={paymentDialog.notes}
                onChange={(e) =>
                  setPaymentDialog({
                    ...paymentDialog,
                    notes: e.target.value,
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setPaymentDialog({
                  open: false,
                  provider: null,
                  notes: "",
                  paymentDate: new Date().toISOString().split("T")[0],
                  paymentAmount: "",
                  paymentMethod: "BANK_TRANSFER",
                })
              }
              disabled={isUpdating}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (
                  paymentDialog.provider &&
                  paymentDialog.paymentDate &&
                  paymentDialog.paymentAmount
                ) {
                  handleVerifyPayment(
                    paymentDialog.provider,
                    paymentDialog.paymentDate,
                    paymentDialog.paymentAmount,
                    paymentDialog.paymentMethod,
                    paymentDialog.notes,
                  );
                } else {
                  toast({
                    title: t("common.error"),
                    description: "Please fill in all required fields",
                    variant: "destructive",
                  });
                }
              }}
              disabled={isUpdating}
            >
              Verify Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminSubscriptionsPage;
