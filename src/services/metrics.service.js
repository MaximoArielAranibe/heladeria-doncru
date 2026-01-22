import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

/* =====================
  HELPERS
===================== */

export const getDaysOfMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];

  while (date.getMonth() === month) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    days.push(`${y}-${m}-${d}`);
    date.setDate(date.getDate() + 1);
  }

  return days;
};

const getLocalDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const normalizeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/* =====================
  METRICS
===================== */

export const getMetrics = async () => {
  const q = query(
    collection(db, "orders"),
    where("status", "==", "completed"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  let totalRevenue = 0;
  let totalOrders = 0;
  let archivedCount = 0;

  const salesByDay = {};
  const ordersByDay = {}; // 👈 NUEVO
  const products = {};

  snapshot.forEach((doc) => {
    const order = doc.data();

    if (!order.createdAt?.toDate) return;

    const dateKey = getLocalDateKey(order.createdAt.toDate());

    /* =====================
      PEDIDOS POR DÍA
    ===================== */
    ordersByDay[dateKey] = (ordersByDay[dateKey] || 0) + 1;

    /* =====================
      ARCHIVADOS
    ===================== */
    if (order.archived === true) {
      archivedCount++;
    }

    const orderTotal = normalizeNumber(order.total);
    if (orderTotal <= 0) return;

    totalRevenue += orderTotal;
    totalOrders++;

    /* =====================
      VENTAS POR DÍA
    ===================== */
    salesByDay[dateKey] =
      (salesByDay[dateKey] || 0) + orderTotal;

    /* =====================
      PRODUCTS
    ===================== */
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const key =
          item.productId || item.id || item.title || "unknown";

        const qty = normalizeNumber(item.quantity);
        if (qty <= 0) return;

        products[key] = (products[key] || 0) + qty;
      });
    }
  });

  return {
    totalRevenue,
    totalOrders,
    archivedCount,
    salesByDay,
    ordersByDay, // 👈 EXPORTAMOS
    products,
  };
};
