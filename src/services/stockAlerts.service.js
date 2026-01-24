import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export const createStockAlert = async ({
  gustoId,
  gustoName,
  status,
  weight,
}) => {
  await addDoc(collection(db, "stock_alerts"), {
    gustoId,
    gustoName,
    status, // warning | danger
    weight,
    createdAt: serverTimestamp(),
  });
};
