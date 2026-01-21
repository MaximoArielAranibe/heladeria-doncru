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
  runTransaction
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
   ARCHIVE ORDER
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
   (simple OR paginated)
===================== */

export const getArchivedOrders = async ({
  pageSize,
  lastDoc,
  date,
} = {}) => {
  /* =====================
     SIMPLE MODE (legacy)
  ===================== */
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

  /* =====================
     PAGINATED MODE
  ===================== */

  const baseConstraints = [
    collection(db, "orders"),
    where("archived", "==", true),
  ];

  // 📅 filtro por día
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

export const archiveOrderWithStock = async (order) => {
  const orderRef = doc(db, "orders", order.id);

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Pedido no existe");
    }

    const orderData = orderSnap.data();

    // 🛑 ya archivado
    if (orderData.archived === true) {
      return;
    }

    const { productWeight, gustos } = orderData;

    if (!productWeight || !Array.isArray(gustos)) {
      throw new Error("Pedido mal formado");
    }

    const weightPerGusto =
      productWeight / gustos.length;

    // 1️⃣ VALIDAR STOCK
    for (const gusto of gustos) {
      const gustoRef = doc(db, "gustos", gusto.id);
      const gustoSnap = await transaction.get(gustoRef);

      if (!gustoSnap.exists()) {
        throw new Error(
          `Gusto ${gusto.name} no existe`
        );
      }

      const currentWeight = gustoSnap.data().weight;

      if (currentWeight < weightPerGusto) {
        throw new Error(
          `Stock insuficiente para ${gustoSnap.data().name}`
        );
      }
    }

    // 2️⃣ DESCONTAR STOCK
    for (const gusto of gustos) {
      const gustoRef = doc(db, "gustos", gusto.id);

      transaction.update(gustoRef, {
        weight:
          doc(db, "gustos", gusto.id) &&
          Number(
            -weightPerGusto
          ),
      });

      transaction.update(gustoRef, {
        weight: (
          (await transaction.get(gustoRef)).data()
            .weight - weightPerGusto
        ),
      });
    }

    // 3️⃣ ARCHIVAR PEDIDO
    transaction.update(orderRef, {
      archived: true,
      archivedAt: serverTimestamp(),
    });
  });
};