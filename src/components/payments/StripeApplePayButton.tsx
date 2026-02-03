import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadStripe, PaymentRequest } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Apple } from "lucide-react";

type StripeApplePayButtonProps = {
  amountSar: number;
  onSuccess: (payload: { paymentIntentId: string }) => Promise<void>;
  onError?: (message: string) => void;
};

const StripeApplePayButton: React.FC<StripeApplePayButtonProps> = ({
  amountSar,
  onSuccess,
  onError,
}) => {
  const [canUseApplePay, setCanUseApplePay] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null,
  );
  const { t } = useTranslation();

  const stripePromise = useMemo(() => {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
      | string
      | undefined;
    if (!key) return null;
    return loadStripe(key);
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkApplePay = async () => {
      const stripe = await stripePromise;
      if (!stripe) {
        setIsChecking(false);
        return;
      }

      const pr = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: {
          label: "Booking Payment",
          amount: Math.round(amountSar * 100 * 0.27),
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      const result = await pr.canMakePayment();

      if (mounted) {
        const applePayAvailable = !!result?.applePay;
        setCanUseApplePay(applePayAvailable);
        if (applePayAvailable) {
          setPaymentRequest(pr);
        }
        setIsChecking(false);
      }
    };

    checkApplePay();

    return () => {
      mounted = false;
    };
  }, [amountSar, stripePromise]);

  // Update amount when it changes
  useEffect(() => {
    if (paymentRequest) {
      paymentRequest.update({
        total: {
          label: "Booking Payment",
          amount: Math.round(amountSar * 100 * 0.27),
        },
      });
    }
  }, [amountSar, paymentRequest]);

  const handleApplePay = async () => {
    if (isProcessing || !paymentRequest) return;
    const stripe = await stripePromise;
    if (!stripe) {
      onError?.("Stripe not configured.");
      return;
    }

    setIsProcessing(true);

    paymentRequest.on("paymentmethod", async (event) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_PAYPAL_API_BASE_URL}/stripe/create-payment-intent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amountSar }),
          },
        );

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.clientSecret) {
          throw new Error(data?.error || "Failed to create payment intent");
        }

        const confirm = await stripe.confirmCardPayment(
          data.clientSecret,
          {
            payment_method: event.paymentMethod.id,
          },
          {
            handleActions: false,
          },
        );

        if (confirm.error) {
          throw new Error(confirm.error.message || "Payment failed");
        }

        if (confirm.paymentIntent?.status === "requires_action") {
          const next = await stripe.confirmCardPayment(data.clientSecret);
          if (next.error) {
            throw new Error(next.error.message || "Payment failed");
          }
          await onSuccess({ paymentIntentId: next.paymentIntent.id });
          event.complete("success");
        } else {
          await onSuccess({ paymentIntentId: confirm.paymentIntent.id });
          event.complete("success");
        }
      } catch (error) {
        console.error("Apple Pay error", error);
        onError?.("Apple Pay payment failed.");
        event.complete("fail");
      } finally {
        setIsProcessing(false);
      }
    });

    paymentRequest.show();
  };

  // Don't render if Stripe not configured or still checking
  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || isChecking) {
    return null;
  }

  // Only show if Apple Pay is available
  if (!canUseApplePay) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2 bg-black text-white hover:bg-black/90 hover:text-white"
      onClick={handleApplePay}
      disabled={isProcessing}
    >
      <Apple className="h-5 w-5" />
      {isProcessing ? t("payment.processing") : t("payment.applePay")}
    </Button>
  );
};

export default StripeApplePayButton;
