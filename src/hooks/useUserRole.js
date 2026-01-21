import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth } from "../firebase/firebase";
import { db } from "../firebase/firebase";

export const useUserRole = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      if (!auth.currentUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(ref);

      setRole(snap.exists() ? snap.data().role : null);
      setLoading(false);
    };

    loadRole();
  }, []);

  return { role, loading };
};
