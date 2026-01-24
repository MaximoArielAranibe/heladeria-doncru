import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase/firebase";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOGIN / LOGOUT ================= */

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("auth");
    setUser(null);
    setRole(null);
  };

  /* ================= AUTH HANDLER ================= */

  useEffect(() => {
    // 1️⃣ Cargar cache primero
    const cached = localStorage.getItem("auth");

    if (cached) {
      const parsed = JSON.parse(cached);
      setUser(parsed.user);
      setRole(parsed.role);
    }

    // 2️⃣ Escuchar Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        localStorage.removeItem("auth");
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);

        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        };

        const userRole = snap.exists() ? snap.data().role : null;

        // 3️⃣ Actualizar estado
        setUser(userData);
        setRole(userRole);

        // 4️⃣ Guardar cache
        localStorage.setItem(
          "auth",
          JSON.stringify({
            user: userData,
            role: userRole,
          })
        );
      } catch (err) {
        console.error("Auth error:", err);
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ================= LOADING ================= */

  if (loading) return null; // o Loader

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
