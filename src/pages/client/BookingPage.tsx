import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useService } from "@/hooks/queries/useServices";
import { useProviderProfile } from "@/hooks/queries/useProviders";
import { useCreateBooking } from "@/hooks/queries/useBookings";
import { useCreatePayment } from "@/hooks/queries/usePayments";
import { useAuth } from "@/contexts/AuthContext";
import PayPalCheckout from "@/components/payments/PayPalCheckout";
import StripeApplePayButton from "@/components/payments/StripeApplePayButton";
import { toast } from "@/components/ui/sonner";

// Generate time slots
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 9; hour <= 20; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < 20) {
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const BookingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isArabic = i18n.language === "ar";

  // State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<
    "AT_PROVIDER" | "AT_CLIENT" | null
  >(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  // Fetch data
  const { data: service, isLoading: loadingService } = useService(
    serviceId || "",
  );
  const { data: provider, isLoading: loadingProvider } = useProviderProfile(
    service?.providerId || "",
  );

  const createBookingMutation = useCreateBooking();
  const createPaymentMutation = useCreatePayment();
  const handleBack = () => {
    navigate(-1);
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime || !selectedLocation) {
      toast.error(t("common.error"), {
        description: t("booking.validationError"),
      });
      return;
    }
    setBookingSuccess(false);
    setPaymentError(null);
    setShowConfirmation(true);
  };

  const handlePaymentAuthorized = async (payload: {
    orderId: string;
    authorizationId: string;
    amountUsd: number;
    fxRate: number;
  }) => {
    if (
      !service ||
      !selectedDate ||
      !selectedTime ||
      !selectedLocation ||
      !user
    ) {
      setPaymentError(t("booking.validationError"));
      return;
    }

    setIsPaying(true);
    setPaymentError(null);

    // Create start date/time
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startAt = new Date(selectedDate);
    startAt.setHours(hours, minutes, 0, 0);

    // Calculate end time
    const endAt = new Date(startAt);
    endAt.setMinutes(endAt.getMinutes() + service.durationMin);

    try {
      const bookingId = await createBookingMutation.mutateAsync({
        clientId: user.uid,
        providerId: service.providerId,
        serviceId: service.id,
        startAt,
        endAt,
        bookingDate: startAt.toISOString().split("T")[0], // "YYYY-MM-DD"
        status: "PENDING",
        priceTotal: service.priceFrom,
        depositAmount: 0,
        addressText:
          selectedLocation === "AT_PROVIDER"
            ? t("services.atProvider")
            : t("services.atClient"),
      });

      await createPaymentMutation.mutateAsync({
        bookingId,
        clientId: user.uid,
        providerId: service.providerId,
        payType: "FULL",
        status: "AUTHORIZED",
        gateway: "PAYPAL",
        amount: payload.amountUsd,
        currency: "USD",
        amountSar: service.priceFrom,
        amountUsd: payload.amountUsd,
        fxRate: payload.fxRate,
        orderId: payload.orderId,
        authorizationId: payload.authorizationId,
        platformFee: 0,
        gatewayFee: 0,
        providerAmount: service.priceFrom,
      });

      setBookingSuccess(true);
    } catch (error) {
      console.error("Failed to finalize booking:", error);
      setPaymentError(t("common.error"));
    } finally {
      setIsPaying(false);
    }
  };

  const handleStripePaymentSuccess = async (payload: {
    paymentIntentId: string;
  }) => {
    if (
      !service ||
      !selectedDate ||
      !selectedTime ||
      !selectedLocation ||
      !user
    ) {
      setPaymentError(t("booking.validationError"));
      return;
    }

    setIsPaying(true);
    setPaymentError(null);

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startAt = new Date(selectedDate);
    startAt.setHours(hours, minutes, 0, 0);

    const endAt = new Date(startAt);
    endAt.setMinutes(endAt.getMinutes() + service.durationMin);

    try {
      const bookingId = await createBookingMutation.mutateAsync({
        clientId: user.uid,
        providerId: service.providerId,
        serviceId: service.id,
        startAt,
        endAt,
        bookingDate: startAt.toISOString().split("T")[0],
        status: "PENDING",
        priceTotal: service.priceFrom,
        depositAmount: 0,
        addressText:
          selectedLocation === "AT_PROVIDER"
            ? t("services.atProvider")
            : t("services.atClient"),
      });

      await createPaymentMutation.mutateAsync({
        bookingId,
        clientId: user.uid,
        providerId: service.providerId,
        payType: "FULL",
        status: "CAPTURED",
        gateway: "STRIPE",
        amount: service.priceFrom,
        currency: "SAR",
        amountSar: service.priceFrom,
        orderId: payload.paymentIntentId,
        platformFee: 0,
        gatewayFee: 0,
        providerAmount: service.priceFrom,
      });

      setBookingSuccess(true);
    } catch (error) {
      console.error("Failed to finalize booking:", error);
      setPaymentError(t("common.error"));
    } finally {
      setIsPaying(false);
    }
  };

  const handleDone = () => {
    navigate("/client/bookings");
  };

  const canProceed = selectedDate && selectedTime && selectedLocation;

  // Disable past dates
  const disabledDays = { before: new Date() };

  if (loadingService || loadingProvider) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="mb-4 h-10 w-24" />
        <Skeleton className="mb-6 h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Service not found</p>
        <Button variant="outline" onClick={handleBack} className="mt-4">
          {t("common.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center gap-4 py-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Button>
          <h1 className="text-lg font-semibold">
            {t("booking.bookingDetails")}
          </h1>
        </div>
      </header>

      <main className="container py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Service Summary */}
          <div className="rounded-2xl bg-card p-4">
            <h2 className="font-semibold text-foreground">{service.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {service.description}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {service.durationMin} {t("search.min")}
                </span>
              </div>
              <p className="font-semibold text-primary">
                {service.priceFrom} SAR
              </p>
            </div>
          </div>

          {/* Select Date */}
          <div className="rounded-2xl bg-card p-4">
            <h3 className="mb-4 font-semibold text-foreground">
              {t("booking.selectDate")}
            </h3>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={disabledDays}
              className="mx-auto"
            />
          </div>

          {/* Select Time */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card p-4"
            >
              <h3 className="mb-4 font-semibold text-foreground">
                {t("booking.selectTime")}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`rounded-xl px-3 py-2 text-sm transition-all ${
                      selectedTime === slot
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-accent"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Select Location */}
          {selectedTime && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card p-4"
            >
              <h3 className="mb-4 font-semibold text-foreground">
                <MapPin className="me-2 inline h-5 w-5" />
                {t("services.locationType")}
              </h3>
              <div className="space-y-2">
                {(service.locationType === "AT_PROVIDER" ||
                  service.locationType === "BOTH") && (
                  <button
                    onClick={() => setSelectedLocation("AT_PROVIDER")}
                    className={`flex w-full items-center justify-between rounded-xl p-4 transition-all ${
                      selectedLocation === "AT_PROVIDER"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-accent"
                    }`}
                  >
                    <span>{t("services.atProvider")}</span>
                    {selectedLocation === "AT_PROVIDER" && (
                      <Check className="h-5 w-5" />
                    )}
                  </button>
                )}
                {(service.locationType === "AT_CLIENT" ||
                  service.locationType === "BOTH") && (
                  <button
                    onClick={() => setSelectedLocation("AT_CLIENT")}
                    className={`flex w-full items-center justify-between rounded-xl p-4 transition-all ${
                      selectedLocation === "AT_CLIENT"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-accent"
                    }`}
                  >
                    <span>{t("services.atClient")}</span>
                    {selectedLocation === "AT_CLIENT" && (
                      <Check className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-20 left-0 right-0 border-t border-border bg-card p-4">
        <div className="container">
          <Button
            className="w-full"
            size="lg"
            disabled={!canProceed}
            onClick={() => setShowConfirmation(true)}
          >
            {t("booking.confirmBooking")}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          {bookingSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Check className="h-6 w-6 text-green-500" />
                  {t("booking.bookingConfirmed")}
                </DialogTitle>
                <DialogDescription>
                  {t("booking.status.pending")}
                </DialogDescription>
              </DialogHeader>
              <Button onClick={handleDone} className="w-full">
                {t("common.done")}
              </Button>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t("booking.paymentRequired")}</DialogTitle>
                <DialogDescription>
                  {service.title} - {service.priceFrom} SAR
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedDate?.toLocaleDateString(
                        isArabic ? "ar-SA" : "en-US",
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedLocation === "AT_PROVIDER"
                        ? t("services.atProvider")
                        : t("services.atClient")}
                    </span>
                  </div>
                </div>

                {paymentError && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {paymentError}
                  </div>
                )}

                <StripeApplePayButton
                  amountSar={service.priceFrom}
                  onSuccess={handleStripePaymentSuccess}
                  onError={(message) => setPaymentError(message)}
                />

                <PayPalCheckout
                  amount={service.priceFrom}
                  currency="USD"
                  bookingMeta={{
                    serviceId: service.id,
                    providerId: service.providerId,
                  }}
                  onAuthorized={handlePaymentAuthorized}
                  onError={(message) => setPaymentError(message)}
                />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isPaying}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingPage;
