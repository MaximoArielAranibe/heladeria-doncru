import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export const getMetrics = async () => {
  const q = query(
    collection(db, "orders"),
    where("status", "==", "paid")
  );

  const snapshot = await getDocs(q);

  let totalRevenue = 0;
  let totalOrders = 0;
  const salesByDay = {};
  const products = {};

  snapshot.forEach((doc) => {
    const order = doc.data();
    totalRevenue += order.total;
    totalOrders++;

    const date = order.createdAt
      ?.toDate()
      .toISOString()
      .slice(0, 10);

    if (date) {
      salesByDay[date] = (salesByDay[date] || 0) + order.total;
    }

    order.items.forEach((item) => {
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
