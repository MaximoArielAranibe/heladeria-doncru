import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export const createOrder = async ({ cart, total, customer }) => {
  const order = {
    items: cart.map((item) => ({
      productId: item.id,          // 🔑 importante
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      gustos: item.gustos || [],
      category: item.category,     // opcional pero útil
    })),

    total,
    status: "pending",
    customer: {
      name: customer?.name || null,
      phone: customer?.phone || null,
    },

    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, "orders"),
    order
  );

  return docRef.id;
};
