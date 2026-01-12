import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const createOrder = async ({ cart, total }) => {
  const order = {
    items: cart.map((item) => ({
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      gustos: item.gustos || [],
    })),
    total,
    status: "pending", // pending | paid | cancelled
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "orders"), order);
  return docRef.id;
};
