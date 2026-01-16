import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export const getDaysOfMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];

  while (date.getMonth() === month) {
    days.push(date.toISOString().slice(0, 10));
    date.setDate(date.getDate() + 1);
  }

  return days;
};

export const getMetrics = async () => {
  const q = query(
    collection(db, "orders"),
    where("status", "==", "completed")
  );

  const snapshot = await getDocs(q);

  let totalRevenue = 0;
  let totalOrders = 0;
  const salesByDay = {};
  const products = {};

  snapshot.forEach((doc) => {
    const order = doc.data();

    if (!order.total) return;

    totalRevenue += order.total;
    totalOrders++;

    // ✅ FIX TIMESTAMP
    if (order.createdAt?.toDate) {
      const date = order.createdAt
        .toDate()
        .toISOString()
        .slice(0, 10);

      salesByDay[date] =
        (salesByDay[date] || 0) + order.total;
    }

    order.items?.forEach((item) => {
      products[item.title] =
        (products[item.title] || 0) + item.quantity;
    });
  });



  return {
    totalRevenue,
    totalOrders,
    salesByDay,
    products,
  };
};
