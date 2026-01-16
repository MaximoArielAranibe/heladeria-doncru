import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";

/* =====================
   DATA
===================== */

export const gustosSeed = [
  // 🍫 CHOCOLATES
  { name: "Chocolate marroc", slug: "chocolate-marroc", category: "chocolates" },
  { name: "Chocolate shot", slug: "chocolate-shot", category: "chocolates" },
  { name: "Chocolate toblerone", slug: "chocolate-toblerone", category: "chocolates" },
  { name: "Chocolate buenardo", slug: "chocolate-buenardo", category: "chocolates" },
  { name: "Chocolate blanco especial", slug: "chocolate-blanco-especial", category: "chocolates" },
  { name: "Chocolate mix", slug: "chocolate-mix", category: "chocolates" },
  { name: "Chocolate con pasas de uva", slug: "chocolate-pasas", category: "chocolates" },
  { name: "Chocolate rasta", slug: "chocolate-rasta", category: "chocolates" },
  { name: "Chocolate dubai", slug: "chocolate-dubai", category: "chocolates" },
  { name: "Chocotorta", slug: "chocotorta", category: "chocolates" },
  { name: "Nutella", slug: "nutella", category: "chocolates" },
  { name: "Toddy", slug: "toddy", category: "chocolates" },

  // 🍯 DULCE DE LECHE
  { name: "Dulce de leche vaquita", slug: "ddl-vaquita", category: "dulce-de-leche" },
  { name: "Dulce de leche cabsha", slug: "ddl-cabsha", category: "dulce-de-leche" },
  { name: "Dulce de leche brownie", slug: "ddl-brownie", category: "dulce-de-leche" },
  { name: "Dulce de leche oreo", slug: "ddl-oreo", category: "dulce-de-leche" },
  { name: "Banana split granizada", slug: "banana-split", category: "dulce-de-leche" },

  // 🍦 CREMAS
  { name: "Crema fortnite", slug: "crema-fortnite", category: "cremas" },
  { name: "Crema rocklet", slug: "crema-rocklet", category: "cremas" },
  { name: "Crema bon o bon", slug: "crema-bon-o-bon", category: "cremas" },
  { name: "Reina chantilly", slug: "reina-chantilly", category: "cremas" },
  { name: "Perla del sur", slug: "perla-del-sur", category: "cremas" },
  { name: "Pistacho", slug: "pistacho", category: "cremas" },
  { name: "Sambayón especial", slug: "sambayon-especial", category: "cremas" },

  // 🍓 FRUTALES
  { name: "Frutilla a la crema con oreo", slug: "frutilla-crema-oreo", category: "frutales" },
  { name: "Mousse de limón", slug: "mousse-limon", category: "frutales" },
  { name: "Coco con dulce de leche", slug: "coco-ddl", category: "frutales" },
  { name: "Banana dolca", slug: "banana-dolca", category: "frutales" },
];

/* =====================
   SEED FUNCTION
===================== */

export const seedGustos = async () => {
  const ref = collection(db, "gustos");

  // 🔒 Evitar duplicados
  const snapshot = await getDocs(ref);
  if (!snapshot.empty) {
    console.warn("⚠️ Gustos ya existen. Seed cancelado.");
    return;
  }

  for (const gusto of gustosSeed) {
    await addDoc(ref, gusto);
  }

  console.log("✅ Gustos cargados correctamente");
};
