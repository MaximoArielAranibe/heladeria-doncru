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
===================== */


export const getArchivedOrders = async () => {
  const q = query(
    collection(db, "orders"),
    where("archived", "==", true),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
