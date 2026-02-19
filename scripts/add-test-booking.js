/**
 * Script to add a test booking directly to Firestore
 * Run with: node scripts/add-test-booking.js
 *
 * Make sure to set your Firebase config in the script or via environment variables
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Firebase configuration - update these with your actual values
const firebaseConfig = {
  apiKey: "AIzaSyAaNjIQIPFdrFUgo_D75L-rpJlpWXwOgrY",
  authDomain: "link-e843b.firebaseapp.com",
  projectId: "link-e843b",
  storageBucket: "link-e843b.firebasestorage.app",
  messagingSenderId: "190979667993",
  appId: "1:190979667993:web:0222938bb271d568665288",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findUserByEmail(email) {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", email));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function findProviderServices(providerId) {
  const servicesRef = collection(db, "services");
  const q = query(servicesRef, where("providerId", "==", providerId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function createTestBooking() {
  const clientEmail = "fakealabady@gmail.com";
  const providerEmail = "fakealabady+1@gmail.com";

  console.log("Finding client...");
  const client = await findUserByEmail(clientEmail);
  if (!client) {
    console.error(`Client not found: ${clientEmail}`);
    return;
  }
  console.log(
    `Found client: ${client.displayName || client.name || client.email} (${client.id})`,
  );

  console.log("Finding provider...");
  const provider = await findUserByEmail(providerEmail);
  if (!provider) {
    console.error(`Provider not found: ${providerEmail}`);
    return;
  }
  console.log(
    `Found provider: ${provider.displayName || provider.name || provider.email} (${provider.id})`,
  );

  console.log("Finding provider services...");
  const services = await findProviderServices(provider.id);
  if (services.length === 0) {
    console.error("No services found for this provider");
    return;
  }

  const service = services[0]; // Use first service
  console.log(
    `Using service: ${service.title || service.name} (${service.id})`,
  );

  // Create booking for tomorrow at 10:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const endTime = new Date(tomorrow);
  endTime.setMinutes(endTime.getMinutes() + (service.durationMin || 60));

  const bookingData = {
    clientId: client.id,
    providerId: provider.id,
    serviceId: service.id,
    startAt: tomorrow,
    endAt: endTime,
    bookingDate: tomorrow.toISOString().split("T")[0],
    status: "PENDING",
    priceTotal: service.price || 100,
    depositAmount: 0,
    locationType: "AT_CLIENT",
    clientName:
      client.displayName ||
      client.name ||
      client.email?.split("@")[0] ||
      "Test Client",
    serviceName: service.title || service.name || "Test Service",
    addressText: "At client's location",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  console.log("\nCreating booking with data:");
  console.log(JSON.stringify(bookingData, null, 2));

  const bookingsRef = collection(db, "bookings");
  const docRef = await addDoc(bookingsRef, bookingData);

  console.log(`\n✅ Booking created successfully!`);
  console.log(`Booking ID: ${docRef.id}`);
  console.log(`\nClient: ${bookingData.clientName}`);
  console.log(
    `Provider: ${provider.displayName || provider.name || provider.email}`,
  );
  console.log(`Service: ${bookingData.serviceName}`);
  console.log(`Date: ${tomorrow.toLocaleDateString()}`);
  console.log(`Time: ${tomorrow.toLocaleTimeString()}`);
  console.log(`Status: PENDING`);
}

createTestBooking()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
