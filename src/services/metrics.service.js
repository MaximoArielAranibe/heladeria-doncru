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
    days.push(date.toISOString().slice(0, 10));
    date.setDate(date.getDate() + 1);
  }

  return days;
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
  const products = {};

  snapshot.forEach((doc) => {
    const order = doc.data();

    /* =====================
    ARCHIVED COUNT
    ===================== */
    if (order.archived === true) {
      archivedCount++;
    }

    // 🛡️ defensive checks
    if (!order.createdAt?.toDate) return;

    const orderTotal = normalizeNumber(order.total);
    if (orderTotal <= 0) return;

    // ✅ LOS ARCHIVADOS TAMBIÉN CUENTAN
    totalRevenue += orderTotal;
    totalOrders++;

    /* =====================
    SALES BY DAY
    ===================== */

    const dateKey = order.createdAt
      .toDate()
      .toISOString()
      .slice(0, 10);

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
    products,
  };
};
