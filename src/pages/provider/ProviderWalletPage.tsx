import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

// Mock data for wallet - would come from Firestore
const mockWallet = {
  balance: 1250.0,
  pendingBalance: 350.0,
  currency: "SAR",
};

const mockTransactions = [
  {
    id: "1",
    type: "credit",
    amount: 150,
    description: "Booking #1234 completed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: "completed",
  },
  {
    id: "2",
    type: "credit",
    amount: 200,
    description: "Booking #1233 completed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: "completed",
  },
  {
    id: "3",
    type: "debit",
    amount: 500,
    description: "Payout to bank account",
    date: new Date(Date.now() - 1000 * 60 * 60 * 48),
    status: "completed",
  },
  {
    id: "4",
    type: "credit",
    amount: 350,
    description: "Booking #1232 - pending release",
    date: new Date(Date.now() - 1000 * 60 * 60 * 72),
    status: "pending",
  },
];

const mockPayouts = [
  {
    id: "1",
    amount: 500,
    status: "PAID",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    id: "2",
    amount: 750,
    status: "PAID",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
  },
];

const ProviderWalletPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isArabic = i18n.language === "ar";

  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ${mockWallet.currency}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffHours < 24) {
      return date.toLocaleTimeString(isArabic ? "ar-SA" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffHours < 48) {
      return t("chat.yesterday");
    } else {
      return date.toLocaleDateString(isArabic ? "ar-SA" : "en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0 || amount > mockWallet.balance) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setPayoutDialogOpen(false);
    setPayoutAmount("");
    // In real app, this would trigger a payout request
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="default">{t("wallet.paid")}</Badge>;
      case "APPROVED":
        return <Badge variant="secondary">{t("wallet.approved")}</Badge>;
      case "REQUESTED":
        return <Badge variant="outline">{t("wallet.requested")}</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">{t("wallet.rejected")}</Badge>;
      default:
        return null;
    }
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
            {t("nav.wallet")}
          </h1>
        </div>
      </header>

      <main className="container py-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Balance Cards */}
          <motion.div
            variants={fadeInUp}
            className="mb-6 grid gap-4 md:grid-cols-2"
          >
            {/* Available Balance */}
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
              <div className="mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <span className="text-sm opacity-90">
                  {t("wallet.balance")}
                </span>
              </div>
              <p className="text-3xl font-bold">
                {formatCurrency(mockWallet.balance)}
              </p>
              <Button
                variant="secondary"
                className="mt-4 w-full"
                onClick={() => setPayoutDialogOpen(true)}
              >
                {t("wallet.requestPayout")}
              </Button>
            </div>

            {/* Pending Balance */}
            <div className="rounded-2xl bg-card p-6">
              <div className="mb-4 flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span className="text-sm">{t("wallet.pendingBalance")}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(mockWallet.pendingBalance)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("wallet.pendingNote")}
              </p>
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.section variants={fadeInUp} className="mb-6">
            <h2 className="mb-3 font-medium text-foreground">
              {t("wallet.transactions")}
            </h2>
            <div className="space-y-2">
              {mockTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-xl bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        transaction.type === "credit"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {transaction.type === "credit" ? (
                        <ArrowDownRight className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p
                      className={`font-semibold ${
                        transaction.type === "credit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "credit" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    {transaction.status === "pending" && (
                      <Badge variant="outline" className="mt-1">
                        {t("wallet.pending")}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Payout History */}
          <motion.section variants={fadeInUp}>
            <h2 className="mb-3 font-medium text-foreground">
              {t("wallet.payoutHistory")}
            </h2>
            {mockPayouts.length === 0 ? (
              <div className="rounded-xl bg-card p-6 text-center text-muted-foreground">
                {t("wallet.noPayouts")}
              </div>
            ) : (
              <div className="space-y-2">
                {mockPayouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between rounded-xl bg-card p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {t("wallet.payoutTo")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payout.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(payout.amount)}
                      </p>
                      {getStatusBadge(payout.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        </motion.div>
      </main>

      {/* Request Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("wallet.requestPayout")}</DialogTitle>
            <DialogDescription>
              {t("wallet.payoutDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">{t("wallet.amount")}</Label>
              <Input
                id="amount"
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                {t("wallet.available")}: {formatCurrency(mockWallet.balance)}
              </p>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">{t("wallet.payoutWarning")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayoutDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleRequestPayout}
              disabled={
                isLoading ||
                !payoutAmount ||
                parseFloat(payoutAmount) <= 0 ||
                parseFloat(payoutAmount) > mockWallet.balance
              }
            >
              {isLoading ? t("common.loading") : t("wallet.requestPayout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderWalletPage;
