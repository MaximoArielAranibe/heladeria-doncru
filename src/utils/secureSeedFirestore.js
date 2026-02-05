import { db, auth } from "../firebase/firebase";
import {
  doc,
  collection,
  serverTimestamp,
  getDoc,
  writeBatch,
} from "firebase/firestore";

/**
 * Seeder seguro (solo 1 vez)
 */
export const secureSeedFirestore = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Tenés que estar logueado");
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("Usuario no existe en Firestore");
  }

  if (userSnap.data().role !== "admin") {
    throw new Error("No sos admin");
  }

  const metaRef = doc(db, "meta", "seed");
  const metaSnap = await getDoc(metaRef);

  // Ya fue ejecutado
  if (metaSnap.exists()) {
    throw new Error("Seeder ya fue ejecutado");
  }

  console.log("🌱 Secure seeding...");

  const batch = writeBatch(db);

  /* =====================
     META LOCK
  ===================== */

  batch.set(metaRef, {
    executedAt: serverTimestamp(),
    by: user.email,
  });

  /* =====================
     USER ADMIN
  ===================== */

  batch.set(userRef, {
    email: user.email,
    role: "admin",
    createdAt: serverTimestamp(),
  });

  /* =====================
     PRODUCTS
  ===================== */

  const products = [
    {
      name: "Chocolate",
      price: 1200,
      stock: 20,
      category: "cremas",
      active: true,
    },
    {
      name: "Dulce de Leche",
      price: 1300,
      stock: 15,
      category: "cremas",
      active: true,
    },
    {
      name: "Frutilla",
      price: 1100,
      stock: 18,
      category: "frutales",
      active: true,
    },
  ];

  products.forEach((p) => {
    const ref = doc(collection(db, "products"));
    batch.set(ref, {
      ...p,
      createdAt: serverTimestamp(),
    });
  });

  /* =====================
     GUSTOS
  ===================== */

  ["Chocolate", "DDL", "Frutilla", "Vainilla"].forEach((name) => {
    const ref = doc(collection(db, "gustos"));
    batch.set(ref, {
      name,
      active: true,
      createdAt: serverTimestamp(),
    });
  });

  /* =====================
     STOCK ALERT
  ===================== */

  const alertRef = doc(collection(db, "stock_alerts"));
  batch.set(alertRef, {
    productName: "Chocolate",
    stock: 2,
    createdAt: serverTimestamp(),
  });

  /* =====================
     ORDER + EVENT
  ===================== */

  const orderRef = doc(collection(db, "orders"));

  batch.set(orderRef, {
    clientName: "Cliente Demo",
    phone: "2477000000",
    address: "Calle Falsa 123",
    total: 2500,
    status: "pendiente",
    archived: false,
    createdAt: serverTimestamp(),
  });

  const eventRef = doc(collection(db, "order_events"));

  batch.set(eventRef, {
    orderId: orderRef.id,
    action: "created",
    by: user.email,
    createdAt: serverTimestamp(),
  });

  /* =====================
     COMMIT ATOMIC
  ===================== */

  await batch.commit();

  console.log("✅ Secure seed completo");
};
