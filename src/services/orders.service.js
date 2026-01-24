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
  const t = title.toLowerCase();

  // 1/4
  if (t.includes("1/4") || t.includes("cuarto")) return 250;

  // 3/4
  if (t.includes("3/4") || t.includes("tres cuartos")) return 750;

  // medio
  if (t.includes("medio") || t.includes("1/2")) return 500;

  // 1kg
  if (t.includes("1 kg") || t.includes("1kg") || t.includes("kilo"))
    return 1000;

  // fallback
  return null;
};

/* =====================
   ARCHIVE ORDER + STOCK
===================== */

export const archiveOrderWithStock = async (order) => {
  const orderRef = doc(db, "orders", order.id);

  await runTransaction(db, async (transaction) => {
    /* =====================
       READS FIRST
    ===================== */

    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Pedido no existe");
    }

    const orderData = orderSnap.data();

    if (orderData.archived === true) return;

    if (
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0
    ) {
      throw new Error("Pedido sin items");
    }

    // Guardamos los refs que vamos a usar
    const gustosMap = new Map();

    for (const item of orderData.items) {
      if (!Array.isArray(item.gustos) || item.gustos.length === 0) {
        continue;
      }

      const totalWeight = getWeightFromTitle(item.title);

      if (!totalWeight) {
        throw new Error(`Peso desconocido para ${item.title}`);
      }

      const weightPerGusto = totalWeight / item.gustos.length;

      for (const gustoName of item.gustos) {
        // Buscar gusto por nombre
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

        // Leer dentro de la transaction
        const gustoSnap = await transaction.get(gustoRef);

        if (!gustoSnap.exists()) {
          throw new Error(`Gusto "${gustoName}" no existe`);
        }

        const currentWeight = gustoSnap.data().weight ?? 0;

        if (currentWeight < weightPerGusto) {
          throw new Error(
            `Stock insuficiente para ${gustoSnap.data().name}`
          );
        }

        // Guardamos para después
        gustosMap.set(gustoRef.path, {
          ref: gustoRef,
          newWeight: currentWeight - weightPerGusto,
        });
      }
    }

    /* =====================
       WRITES AFTER READS
    ===================== */

    for (const { ref, newWeight } of gustosMap.values()) {
      transaction.update(ref, {
        weight: newWeight,
      });
    }

    transaction.update(orderRef, {
      archived: true,
      archivedAt: serverTimestamp(),
    });
  });
};

