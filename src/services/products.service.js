import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const updateProductPrice = async (productId, newPrice) => {
  const ref = doc(db, "products", productId);
  await updateDoc(ref,{
    price: Number(newPrice),
  });
};