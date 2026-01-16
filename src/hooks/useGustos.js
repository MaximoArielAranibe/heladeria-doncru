import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const useGustos = () => {
  const [gustos, setGustos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "gustos"),
      orderBy("category"),
      orderBy("name")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setGustos(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { gustos, loading };
};
