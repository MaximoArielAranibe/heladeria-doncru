import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,       // 🔑 string ID real
          ...doc.data(),
        }));

        setProducts(data);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return { products, loading };
};
