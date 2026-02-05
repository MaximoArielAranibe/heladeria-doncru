import {
  doc, updateDoc, collection,
  addDoc,
  serverTimestamp,deleteDoc
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export const updateProductPrice = async (productId, newPrice) => {
  const ref = doc(db, "products", productId);
  await updateDoc(ref, {
    price: Number(newPrice),
  });
};

export const updateProductImage = async (id, imageUrl) => {
  if (!id) throw new Error("Missing product id");

  await updateDoc(doc(db, "products", id), {
    thumbnail: imageUrl,
    updatedAt: new Date(),
  });
};

export const createProduct = async (product) => {
  const docRef = await addDoc(collection(db, "products"), {
    ...product,
    active: true,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

export const deleteProduct = async (productId) => {
  if (!productId) throw new Error("ID inválido");
  await deleteDoc(doc(db, "products", productId));
};
