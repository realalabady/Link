import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentCallbackPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Moyasar redirects with query params: id, status, message
    const paymentId = searchParams.get("id");
    const paymentStatus = searchParams.get("status");
    const paymentMessage = searchParams.get("message");

    console.log("Payment callback received:", {
      paymentId,
      paymentStatus,
      paymentMessage,
    });

    if (paymentStatus === "paid") {
      setStatus("success");
      setMessage(t("booking.bookingConfirmed"));
    } else if (paymentStatus === "failed") {
      setStatus("failed");
      setMessage(paymentMessage || t("payment.paymentFailed"));
    } else {
      // Unknown status, treat as pending/loading
      setTimeout(() => {
        setStatus("failed");
        setMessage(t("payment.paymentNotCompleted"));
      }, 3000);
    }
  }, [searchParams, t]);

  const handleGoToBookings = () => {
    navigate("/client/bookings");
  };

  const handleTryAgain = () => {
    navigate(-2); // Go back to booking page
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full rounded-2xl bg-card p-8 text-center shadow-lg"
      >
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              {t("payment.processing")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t("common.pleaseWait")}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
            >
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            </motion.div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              {t("booking.bookingConfirmed")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t("booking.status.pending")}
            </p>
            <Button className="mt-6 w-full" onClick={handleGoToBookings}>
              {t("nav.bookings")}
            </Button>
          </>
        )}

        {status === "failed" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
            >
              <XCircle className="mx-auto h-16 w-16 text-destructive" />
            </motion.div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              {t("payment.paymentFailed")}
            </h1>
            <p className="mt-2 text-muted-foreground">{message}</p>
            <div className="mt-6 space-y-2">
              <Button className="w-full" onClick={handleTryAgain}>
                {t("common.tryAgain")}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoToBookings}
              >
                {t("nav.bookings")}
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentCallbackPage;
