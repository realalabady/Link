import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";

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
  const [isProcessing, setIsProcessing] = useState(false);
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
      if (!stripe) return;

      const paymentRequest = stripe.paymentRequest({
        country: "SA",
        currency: "sar",
        total: {
          label: "Booking",
          amount: Math.round(amountSar * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      const result = await paymentRequest.canMakePayment();
      if (mounted) {
        setCanUseApplePay(!!result?.applePay);
      }
    };

    checkApplePay();

    return () => {
      mounted = false;
    };
  }, [amountSar, stripePromise]);

  const handleApplePay = async () => {
    if (isProcessing) return;
    const stripe = await stripePromise;
    if (!stripe) {
      onError?.("Stripe not configured.");
      return;
    }

    setIsProcessing(true);

    const paymentRequest = stripe.paymentRequest({
      country: "SA",
      currency: "sar",
      total: {
        label: "Booking",
        amount: Math.round(amountSar * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

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

        const confirm = await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: event.paymentMethod.id,
        }, {
          handleActions: false,
        });

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

  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return null;
  }

  if (!canUseApplePay) {
    return null;
  }

  return (
    <Button
      type="button"
      className="w-full"
      onClick={handleApplePay}
      disabled={isProcessing}
    >
      {isProcessing ? t("payment.processing") : t("payment.applePay")}
    </Button>
  );
};

export default StripeApplePayButton;
