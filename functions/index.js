require("dotenv").config();
const admin = require("firebase-admin");
const { Resend } = require("resend");
const { defineSecret } = require("firebase-functions/params");
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");

admin.initializeApp();
const db = admin.firestore();

const resendApiKeyParam = defineSecret("RESEND_API_KEY");
const emailFromParam = defineSecret("EMAIL_FROM");
const clientAppUrlParam = defineSecret("CLIENT_APP_URL");
const moyasarSecretKeyParam = defineSecret("MOYASAR_SECRET_KEY");

const getResend = () => {
  const key = resendApiKeyParam.value();
  if (!key) return null;
  return new Resend(key);
};

const sendEmail = async ({ to, subject, html, text }) => {
  const resend = getResend();
  if (!resend) {
    console.warn("Resend not configured. Skipping email to", to);
    return;
  }

  await resend.emails.send({
    from: "Link <noreply@link-22.com>",
    to,
    subject,
    html,
    text,
  });
};

const getUserById = async (uid) => {
  if (!uid) return null;
  const snap = await db.collection("users").doc(uid).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
};

const getProviderById = async (uid) => {
  if (!uid) return null;
  const snap = await db.collection("providers").doc(uid).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
};

const getServiceById = async (id) => {
  if (!id) return null;
  const snap = await db.collection("services").doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
};

// Get payment by booking ID
const getPaymentByBookingId = async (bookingId) => {
  const snapshot = await db
    .collection("payments")
    .where("bookingId", "==", bookingId)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

// Process refund via Moyasar API
const processRefund = async (paymentId, amount = null) => {
  const secretKey = moyasarSecretKeyParam.value();
  if (!secretKey) {
    console.error("MOYASAR_SECRET_KEY not configured");
    return { success: false, error: "Moyasar not configured" };
  }

  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  try {
    const body = amount ? { amount: Math.round(Number(amount) * 100) } : {};

    const response = await fetch(
      `https://api.moyasar.com/v1/payments/${paymentId}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Moyasar refund error:", data);
      return { success: false, error: data.message || "Refund failed" };
    }

    console.log("Moyasar refund successful:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Moyasar refund exception:", error);
    return { success: false, error: error.message };
  }
};

// Refund booking payment and update records
const refundBookingPayment = async (bookingId, reason = "rejected") => {
  const payment = await getPaymentByBookingId(bookingId);

  if (!payment) {
    console.warn(`No payment found for booking ${bookingId}`);
    return { success: false, error: "No payment found" };
  }

  if (payment.status === "REFUNDED") {
    console.log(`Payment for booking ${bookingId} already refunded`);
    return { success: true, alreadyRefunded: true };
  }

  const moyasarPaymentId = payment.orderId;
  if (!moyasarPaymentId) {
    console.error(`No Moyasar payment ID for booking ${bookingId}`);
    return { success: false, error: "No Moyasar payment ID" };
  }

  const refundResult = await processRefund(moyasarPaymentId);

  if (refundResult.success) {
    // Update payment record
    await db.collection("payments").doc(payment.id).update({
      status: "REFUNDED",
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      refundReason: reason,
    });

    // Update booking record
    await db.collection("bookings").doc(bookingId).update({
      paymentStatus: "REFUNDED",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return refundResult;
};

exports.onBookingCreated = onDocumentCreated(
  {
    document: "bookings/{bookingId}",
    secrets: [resendApiKeyParam, emailFromParam, clientAppUrlParam],
  },
  async (event) => {
    const booking = event.data?.data();
    if (!booking) return;

    const [client, providerProfile, providerUser, service] = await Promise.all([
      getUserById(booking.clientId),
      getProviderById(booking.providerId),
      getUserById(booking.providerId),
      getServiceById(booking.serviceId),
    ]);

    const clientEmail = client?.email;
    const providerEmail = providerUser?.email;

    const clientAppUrl = "https://www.link-22.com";
    const bookingUrl = `${clientAppUrl}/client/bookings/${event.params.bookingId}`;
    const providerUrl = `${clientAppUrl}/provider/booking/${event.params.bookingId}`;

    if (clientEmail) {
      await sendEmail({
        to: clientEmail,
        subject: "Booking received - awaiting provider confirmation",
        text: `Your booking is confirmed and awaiting provider acceptance. View: ${bookingUrl}`,
        html: `
          <p>Your booking is successful and is waiting for the provider to accept.</p>
          <p>Service: ${service?.title || "Service"}</p>
          <p>Date: ${booking.bookingDate}</p>
          <p><a href="${bookingUrl}">View booking</a></p>
        `,
      });
    }

    if (providerEmail) {
      await sendEmail({
        to: providerEmail,
        subject: "New booking request",
        text: `You have a new booking request. Please accept within 24 hours. View: ${providerUrl}`,
        html: `
          <p>You have a new booking request.</p>
          <p>Service: ${service?.title || "Service"}</p>
          <p>Client: ${client?.name || "Client"}</p>
          <p>Date: ${booking.bookingDate}</p>
          <p>Please accept within 24 hours or it will be auto-rejected.</p>
          <p><a href="${providerUrl}">View request</a></p>
        `,
      });
    }
  },
);

exports.autoRejectExpiredBookings = onSchedule(
  {
    schedule: "every 60 minutes",
    secrets: [resendApiKeyParam, emailFromParam, moyasarSecretKeyParam],
  },
  async () => {
    const now = admin.firestore.Timestamp.now();
    const cutoff = admin.firestore.Timestamp.fromMillis(
      now.toMillis() - 24 * 60 * 60 * 1000,
    );

    const snapshot = await db
      .collection("bookings")
      .where("status", "==", "PENDING")
      .where("createdAt", "<=", cutoff)
      .get();

    if (snapshot.empty) return;

    const updates = snapshot.docs.map(async (doc) => {
      const bookingId = doc.id;
      const booking = doc.data();

      // Process refund first
      const refundResult = await refundBookingPayment(
        bookingId,
        "auto_rejected_timeout",
      );
      console.log(`Refund for booking ${bookingId}:`, refundResult);

      // Update booking status
      await doc.ref.update({
        status: "REJECTED",
        rejectionReason: "auto_rejected_timeout",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const [client, providerUser, service] = await Promise.all([
        getUserById(booking.clientId),
        getUserById(booking.providerId),
        getServiceById(booking.serviceId),
      ]);

      const clientEmail = client?.email;
      const providerEmail = providerUser?.email;

      if (clientEmail) {
        const refundMessage = refundResult.success
          ? "Your payment has been refunded automatically."
          : "Please contact support for your refund.";

        await sendEmail({
          to: clientEmail,
          subject: "Booking auto-rejected - Payment refunded",
          text: `Your booking was auto-rejected because the provider did not respond within 24 hours. ${refundMessage}`,
          html: `
            <p>Your booking was auto-rejected because the provider did not respond within 24 hours.</p>
            <p>Service: ${service?.title || "Service"}</p>
            <p><strong>${refundMessage}</strong></p>
          `,
        });
      }

      if (providerEmail) {
        await sendEmail({
          to: providerEmail,
          subject: "Booking request expired",
          text: "A booking request was auto-rejected after 24 hours.",
          html: `
            <p>A booking request was auto-rejected after 24 hours.</p>
            <p>Service: ${service?.title || "Service"}</p>
          `,
        });
      }
    });

    await Promise.all(updates);
  },
);

// Trigger when booking status changes - auto-refund on rejection
exports.onBookingStatusChanged = onDocumentUpdated(
  {
    document: "bookings/{bookingId}",
    secrets: [resendApiKeyParam, emailFromParam, moyasarSecretKeyParam],
  },
  async (event) => {
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    if (!beforeData || !afterData) return;

    const bookingId = event.params.bookingId;
    const oldStatus = beforeData.status;
    const newStatus = afterData.status;

    // Only process if status changed TO REJECTED (and wasn't already rejected)
    if (newStatus !== "REJECTED" || oldStatus === "REJECTED") {
      return;
    }

    // Skip if this was from auto-reject (already handled by autoRejectExpiredBookings)
    if (afterData.rejectionReason === "auto_rejected_timeout") {
      console.log(
        `Booking ${bookingId} was auto-rejected, skipping duplicate refund`,
      );
      return;
    }

    console.log(
      `Booking ${bookingId} manually rejected by provider, processing refund...`,
    );

    // Process refund
    const refundResult = await refundBookingPayment(
      bookingId,
      "provider_rejected",
    );
    console.log(`Refund result for booking ${bookingId}:`, refundResult);

    // Send email to client about refund
    const [client, service] = await Promise.all([
      getUserById(afterData.clientId),
      getServiceById(afterData.serviceId),
    ]);

    const clientEmail = client?.email;
    if (clientEmail) {
      const refundMessage = refundResult.success
        ? "Your payment has been refunded automatically."
        : "Please contact support for your refund.";

      await sendEmail({
        to: clientEmail,
        subject: "Booking rejected - Payment refunded",
        text: `Unfortunately, the provider was unable to accept your booking. ${refundMessage}`,
        html: `
          <p>Unfortunately, the provider was unable to accept your booking.</p>
          <p>Service: ${service?.title || "Service"}</p>
          <p><strong>${refundMessage}</strong></p>
          <p>We apologize for the inconvenience. Please try booking with another provider.</p>
        `,
      });
    }
  },
);
