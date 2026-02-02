import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, Apple, Smartphone } from "lucide-react";

type MoyasarCheckoutProps = {
  amount: number; // Amount in SAR
  onSuccess: (payload: { paymentId: string; status: string }) => Promise<void>;
  onError?: (message: string) => void;
  metadata?: Record<string, string>;
};

declare global {
  interface Window {
    Moyasar?: {
      init: (config: MoyasarConfig) => void;
    };
  }
}

interface MoyasarConfig {
  element: string;
  amount: number;
  currency: string;
  description: string;
  publishable_api_key: string;
  callback_url: string;
  methods: string[];
  apple_pay?: {
    country: string;
    label: string;
    validate_merchant_url: string;
  };
  on_completed?: (payment: MoyasarPayment) => void;
  on_failure?: (error: Error) => void;
}

interface MoyasarPayment {
  id: string;
  status: string;
  amount: number;
  currency: string;
  source: {
    type: string;
    company?: string;
    name?: string;
    number?: string;
  };
}

const MoyasarCheckout: React.FC<MoyasarCheckoutProps> = ({
  amount,
  onSuccess,
  onError,
  metadata,
}) => {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const moyasarRef = useRef<HTMLDivElement>(null);
  const isArabic = i18n.language === "ar";

  const publishableKey = import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY;
  const callbackUrl =
    import.meta.env.VITE_MOYASAR_CALLBACK_URL ||
    `${window.location.origin}/client/payment-callback`;

  useEffect(() => {
    // Load Moyasar script
    if (document.getElementById("moyasar-script")) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "moyasar-script";
    script.src = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      onError?.(t("payment.scriptLoadError"));
      setIsLoading(false);
    };
    document.body.appendChild(script);

    // Load Moyasar CSS
    if (!document.getElementById("moyasar-css")) {
      const link = document.createElement("link");
      link.id = "moyasar-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.moyasar.com/mpf/1.14.0/moyasar.css";
      document.head.appendChild(link);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  useEffect(() => {
    if (
      !scriptLoaded ||
      !window.Moyasar ||
      !moyasarRef.current ||
      !publishableKey
    ) {
      return;
    }

    // Clear previous instance
    moyasarRef.current.innerHTML = "";

    try {
      window.Moyasar.init({
        element: ".moyasar-form",
        amount: Math.round(amount * 100), // Convert to halalas
        currency: "SAR",
        description: "Booking Payment",
        publishable_api_key: publishableKey,
        callback_url: callbackUrl,
        methods: ["creditcard", "applepay", "stcpay"],
        apple_pay: {
          country: "SA",
          label: "Link Booking",
          validate_merchant_url: `${import.meta.env.VITE_PAYPAL_API_BASE_URL}/moyasar/apple-pay-session`,
        },
        on_completed: async (payment: MoyasarPayment) => {
          console.log("Moyasar payment completed:", payment);
          if (payment.status === "paid") {
            await onSuccess({
              paymentId: payment.id,
              status: payment.status,
            });
          } else {
            onError?.(t("payment.paymentNotCompleted"));
          }
        },
        on_failure: (error: Error) => {
          console.error("Moyasar payment failed:", error);
          onError?.(error.message || t("payment.paymentFailed"));
        },
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Moyasar init error:", error);
      onError?.(t("payment.initError"));
      setIsLoading(false);
    }
  }, [
    scriptLoaded,
    amount,
    publishableKey,
    callbackUrl,
    onSuccess,
    onError,
    t,
  ]);

  if (!publishableKey) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
        {t("payment.moyasarNotConfigured")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ms-2 text-sm text-muted-foreground">
            {t("payment.loadingPayment")}
          </span>
        </div>
      )}

      <div
        ref={moyasarRef}
        className="moyasar-form"
        style={{ display: isLoading ? "none" : "block" }}
      />

      <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CreditCard className="h-4 w-4" />
          <span>Mada</span>
        </div>
        <div className="flex items-center gap-1">
          <CreditCard className="h-4 w-4" />
          <span>Visa/MC</span>
        </div>
        <div className="flex items-center gap-1">
          <Apple className="h-4 w-4" />
          <span>Apple Pay</span>
        </div>
        <div className="flex items-center gap-1">
          <Smartphone className="h-4 w-4" />
          <span>STC Pay</span>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t("payment.securedBy")} Moyasar
      </p>
    </div>
  );
};

export default MoyasarCheckout;
