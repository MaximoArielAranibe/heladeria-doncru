import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  limit,
  startAfter,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getOrCreateUserId } from "../utils/user.js";

/* =====================
   CREATE ORDER
===================== */

export const createOrder = async ({ cart, total, customer, shipping }) => {
  const userId = getOrCreateUserId();

  const order = {
    userId,
    items: cart.map((item) => ({
      productId: item.id,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      gustos: item.gustos || [],
      category: item.category,
    })),
    total,
    shipping: {
      estimated: shipping?.estimated ?? null,
      final: null,
      zone: shipping?.zone ?? null,
    },
    status: "pending",
    customer,
    createdAt: serverTimestamp(),
    archived: false,
  };

  const docRef = await addDoc(collection(db, "orders"), order);
  return docRef.id;
};

/* =====================
   ARCHIVE ORDER (simple)
===================== */

export const archiveOrder = async (orderId) => {
  await updateDoc(doc(db, "orders", orderId), {
    archived: true,
  });
};

/* =====================
   GET ACTIVE ORDERS
===================== */

export const getActiveOrders = async () => {
  const q = query(
    collection(db, "orders"),
    where("archived", "==", false),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

/* =====================
   GET ARCHIVED ORDERS
===================== */

export const getArchivedOrders = async ({
  pageSize,
  lastDoc,
  date,
} = {}) => {
  if (!pageSize) {
    const q = query(
      collection(db, "orders"),
      where("archived", "==", true),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  }

  const baseConstraints = [
    collection(db, "orders"),
    where("archived", "==", true),
  ];

  if (date) {
    const start = Timestamp.fromDate(
      new Date(`${date}T00:00:00`)
    );
    const end = Timestamp.fromDate(
      new Date(`${date}T23:59:59`)
    );

    baseConstraints.push(
      where("createdAt", ">=", start),
      where("createdAt", "<=", end)
    );
  }

  baseConstraints.push(
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  if (lastDoc) {
    baseConstraints.push(startAfter(lastDoc));
  }

  const q = query(...baseConstraints);
  const snapshot = await getDocs(q);

  return {
    orders: snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })),
    lastDoc:
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1]
        : null,
  };
};

/* =====================
   WEIGHT PARSER (ROBUSTO)
===================== */

const getWeightFromTitle = (title = "") => {
  const t = title.toLowerCase().replace(/\s+/g, " ");

  // fracciones explícitas
  if (t.includes("1/4")) return 250;
  if (t.includes("3/4")) return 750;

  // medio kilo
  if (t.includes("medio")) return 500;
  if (t.includes("1/2")) return 500;

  // 1 kg explícito
  if (t.includes("1 kg") || t.includes("1kg")) return 1000;

  // kg sin número → asumir 1kg
  if (t.includes("kg")) return 1000;

  return null;
};

/* =====================
   ARCHIVE ORDER + STOCK
===================== */

export const archiveOrderWithStock = async (order) => {
  const orderRef = doc(db, "orders", order.id);

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Pedido no existe");
    }

    const orderData = orderSnap.data();

    if (orderData.archived === true) return;

    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error("Pedido sin items");
    }

    for (const item of orderData.items) {
      const totalWeight = getWeightFromTitle(item.title);

      if (!totalWeight) {
        throw new Error(`Peso desconocido para ${item.title}`);
      }

      if (!Array.isArray(item.gustos) || item.gustos.length === 0) continue;

      const weightPerGusto = totalWeight / item.gustos.length;

      for (const gustoName of item.gustos) {
        const q = query(
          collection(db, "gustos"),
          where("name", "==", gustoName)
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          throw new Error(`Gusto "${gustoName}" no existe`);
        }

        const gustoDoc = snap.docs[0];
        const gustoRef = doc(db, "gustos", gustoDoc.id);

        const currentWeight = gustoDoc.data().weight ?? 0;

        if (currentWeight < weightPerGusto) {
          throw new Error(
            `Stock insuficiente para ${gustoDoc.data().name}`
          );
        }

        transaction.update(gustoRef, {
          weight: currentWeight - weightPerGusto,
        });
      }
    }

    transaction.update(orderRef, {
      archived: true,
      archivedAt: serverTimestamp(),
    });
  });
};
