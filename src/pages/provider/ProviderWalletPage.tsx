import React, { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
} from "firebase/firestore";

const wallet = {
  balance: 0,
  pendingBalance: 0,
  currency: "SAR",
};

const transactions: Array<{
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: Date;
  status?: "pending" | "completed";
}> = [];

const payouts: Array<{
  id: string;
  amount: number;
  status: "PAID" | "APPROVED" | "REQUESTED" | "REJECTED";
  createdAt: Date;
}> = [];

const ProviderWalletPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isArabic = i18n.language === "ar";

  const [walletData, setWalletData] = useState(wallet);
  const [transactionsData, setTransactionsData] = useState(transactions);
  const [payoutsData, setPayoutsData] = useState(payouts);
  const [loading, setLoading] = useState(true);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch wallet data from Firestore
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);

        // Run all queries in parallel
        const acceptedBookingsQ = query(
          collection(db, "bookings"),
          where("providerId", "==", user.uid),
          where("status", "==", "ACCEPTED"),
        );

        const completedBookingsQ = query(
          collection(db, "bookings"),
          where("providerId", "==", user.uid),
          where("status", "==", "COMPLETED"),
        );

        const payoutsQ = query(
          collection(db, "payouts"),
          where("providerId", "==", user.uid),
        );

        // Execute all queries in parallel
        const [acceptedSnap, completedSnap, payoutsSnap] = await Promise.all([
          getDocs(acceptedBookingsQ),
          getDocs(completedBookingsQ),
          getDocs(payoutsQ),
        ]);

        // Combine booking results
        const allBookings = [...acceptedSnap.docs, ...completedSnap.docs];

        let totalEarnings = 0;
        const txns: typeof transactions = [];

        allBookings.forEach((doc) => {
          const booking = doc.data();
          const amount =
            booking.priceTotal || booking.price || booking.amount || 0;
          totalEarnings += amount;

          txns.push({
            id: doc.id,
            type: "credit",
            amount,
            description: `Booking #${doc.id.slice(0, 4)} - ${booking.serviceName || "Service"}`,
            date:
              booking.completedAt?.toDate?.() ||
              booking.acceptedAt?.toDate?.() ||
              new Date(),
            status: booking.status === "COMPLETED" ? "completed" : "pending",
          });
        });

        let totalPending = 0;
        const pyts: typeof payouts = [];

        payoutsSnap.docs.forEach((doc) => {
          const payout = doc.data();
          pyts.push({
            id: doc.id,
            amount: payout.amount || 0,
            status: payout.status || "REQUESTED",
            createdAt: payout.createdAt?.toDate?.() || new Date(),
          });

          if (payout.status === "REQUESTED" || payout.status === "APPROVED") {
            totalPending += payout.amount || 0;
          }
        });

        // Sort payouts by date (newest first)
        pyts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const balance = totalEarnings - totalPending;

        setWalletData({
          balance: Math.max(0, balance),
          pendingBalance: totalPending,
          currency: "SAR",
        });
        setTransactionsData(
          txns.sort((a, b) => b.date.getTime() - a.date.getTime()),
        );
        setPayoutsData(pyts);
      } catch (error) {
        console.error("Failed to fetch wallet data:", error);
        // Keep default empty data on error
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [user?.uid]);

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ${walletData.currency}`;
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
    if (
      isNaN(amount) ||
      amount <= 0 ||
      amount > walletData.balance ||
      !user?.uid
    )
      return;

    try {
      setIsLoading(true);

      // Create payout request in Firestore
      await addDoc(collection(db, "payouts"), {
        providerId: user.uid,
        amount,
        status: "REQUESTED",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Refresh wallet data - fetch accepted bookings
      const bookingsQ = query(
        collection(db, "bookings"),
        where("providerId", "==", user.uid),
        where("status", "==", "ACCEPTED"),
      );
      const acceptedSnap = await getDocs(bookingsQ);

      // Fetch completed bookings
      const completedQ = query(
        collection(db, "bookings"),
        where("providerId", "==", user.uid),
        where("status", "==", "COMPLETED"),
      );
      const completedSnap = await getDocs(completedQ);

      // Combine both
      const allBookings = [...acceptedSnap.docs, ...completedSnap.docs];

      let totalEarnings = 0;
      const txns: typeof transactions = [];

      allBookings.forEach((doc) => {
        const booking = doc.data();
        const bookAmount =
          booking.priceTotal || booking.price || booking.amount || 0;
        totalEarnings += bookAmount;

        txns.push({
          id: doc.id,
          type: "credit",
          amount: bookAmount,
          description: `Booking #${doc.id.slice(0, 4)} - ${booking.serviceName || "Service"}`,
          date:
            booking.completedAt?.toDate?.() ||
            booking.acceptedAt?.toDate?.() ||
            new Date(),
          status: booking.status === "COMPLETED" ? "completed" : "pending",
        });
      });

      // Fetch updated payout requests
      const payoutsQ = query(
        collection(db, "payouts"),
        where("providerId", "==", user.uid),
      );
      const payoutsSnap = await getDocs(payoutsQ);

      let totalPending = 0;
      const pyts: typeof payouts = [];

      payoutsSnap.docs.forEach((doc) => {
        const payout = doc.data();
        pyts.push({
          id: doc.id,
          amount: payout.amount || 0,
          status: payout.status || "REQUESTED",
          createdAt: payout.createdAt?.toDate?.() || new Date(),
        });

        if (payout.status === "REQUESTED" || payout.status === "APPROVED") {
          totalPending += payout.amount || 0;
        }
      });

      // Sort payouts by date (newest first)
      pyts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const balance = totalEarnings - totalPending;

      setWalletData({
        balance: Math.max(0, balance),
        pendingBalance: totalPending,
        currency: "SAR",
      });
      setTransactionsData(
        txns.sort((a, b) => b.date.getTime() - a.date.getTime()),
      );
      setPayoutsData(pyts);

      // Show success toast
      toast({
        title: t("wallet.payoutRequestSuccess") || "Success",
        description: `${t("wallet.payoutRequested") || "Payout request sent"} - ${amount} SAR`,
      });

      setPayoutDialogOpen(false);
      setPayoutAmount("");
    } catch (error) {
      console.error("Failed to request payout:", error);
      toast({
        title: t("wallet.error") || "Error",
        description:
          t("wallet.payoutRequestFailed") || "Failed to request payout",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                {formatCurrency(walletData.balance)}
              </p>
              <Button
                variant="secondary"
                className="mt-4 w-full"
                onClick={() => setPayoutDialogOpen(true)}
                disabled={walletData.balance <= 0}
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
                {formatCurrency(walletData.pendingBalance)}
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
              {transactionsData.length === 0 ? (
                <div className="rounded-xl bg-card p-6 text-center text-muted-foreground">
                  {t("wallet.noTransactions")}
                </div>
              ) : (
                transactionsData.map((transaction) => (
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
                ))
              )}
            </div>
          </motion.section>

          {/* Payout History */}
          <motion.section variants={fadeInUp}>
            <h2 className="mb-3 font-medium text-foreground">
              {t("wallet.payoutHistory")}
            </h2>
            {payoutsData.length === 0 ? (
              <div className="rounded-xl bg-card p-6 text-center text-muted-foreground">
                {t("wallet.noPayouts")}
              </div>
            ) : (
              <div className="space-y-2">
                {payoutsData.map((payout) => (
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
                {t("wallet.available")}: {formatCurrency(walletData.balance)}
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
                parseFloat(payoutAmount) > walletData.balance
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
