import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const createGusto = async (data) => {
  await addDoc(collection(db, "gustos"), data);
};

export const updateGusto = async (id, data) => {
  await updateDoc(doc(db, "gustos", id), data);
};

export const deleteGusto = async (id) => {
  await deleteDoc(doc(db, "gustos", id));
};


