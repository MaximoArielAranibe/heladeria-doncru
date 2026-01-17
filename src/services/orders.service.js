import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getOrCreateUserId } from "../utils/user.js";

export const createOrder = async ({ cart, total, customer, shipping }) => {
  const userId = getOrCreateUserId();

  const order = {
    userId, // 🔑 CLAVE
    items: cart.map((item) => ({
      productId: item.id,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      gustos: item.gustos || [],
      category: item.category,
    })),
    total,
    shipping:{
      estimated: shipping?.estimated?? null,
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