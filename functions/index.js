require("dotenv").config();
const admin = require("firebase-admin");
const { Resend } = require("resend");
const { defineSecret } = require("firebase-functions/params");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");

admin.initializeApp();
const db = admin.firestore();

const resendApiKeyParam = defineSecret("RESEND_API_KEY");
const emailFromParam = defineSecret("EMAIL_FROM");
const clientAppUrlParam = defineSecret("CLIENT_APP_URL");

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

    const clientAppUrl = "https://link-22.com";
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
    secrets: [resendApiKeyParam, emailFromParam],
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
      await doc.ref.update({
        status: "REJECTED",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const booking = doc.data();
      const [client, providerUser, service] = await Promise.all([
        getUserById(booking.clientId),
        getUserById(booking.providerId),
        getServiceById(booking.serviceId),
      ]);

      const clientEmail = client?.email;
      const providerEmail = providerUser?.email;

      if (clientEmail) {
        await sendEmail({
          to: clientEmail,
          subject: "Booking auto-rejected",
          text: "Your booking was auto-rejected because the provider did not respond within 24 hours.",
          html: `
            <p>Your booking was auto-rejected because the provider did not respond within 24 hours.</p>
            <p>Service: ${service?.title || "Service"}</p>
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
