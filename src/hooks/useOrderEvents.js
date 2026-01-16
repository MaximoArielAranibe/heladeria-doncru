import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export const useOrderEvents = () => {
  const [eventsByOrder, setEventsByOrder] = useState({});

  useEffect(() => {
    const q = query(
      collection(db, "order_events"),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const grouped = {};

      snapshot.docs.forEach((doc) => {
        const e = { id: doc.id, ...doc.data() };

        if (!grouped[e.orderId]) {
          grouped[e.orderId] = [];
        }

        grouped[e.orderId].push(e);
      });

      setEventsByOrder(grouped);
    });

    return unsub;
  }, []);

  return eventsByOrder;
};
