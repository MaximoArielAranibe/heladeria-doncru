import { useState, useCallback, useRef } from "react";
import { getArchivedOrders } from "../services/orders.service";

const PAGE_SIZE = 10;

export const useArchivedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchOrders = useCallback(
    async ({ reset = false } = {}) => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      setLoading(true);

      const res = await getArchivedOrders({
        pageSize: PAGE_SIZE,
        lastDoc: reset ? null : lastDoc,
        date: dateFilter,
      });

      setOrders((prev) =>
        reset ? res.orders : [...prev, ...res.orders]
      );

      setLastDoc(res.lastDoc);
      setHasLoadedOnce(true);
      setLoading(false);
      isFetchingRef.current = false;
    },
    [lastDoc, dateFilter]
  );

  const applyDateFilter = async (date) => {
    if (loading) return;

    setDateFilter(date || null);
    setOrders([]);
    setLastDoc(null);
    setHasLoadedOnce(false);

    await fetchOrders({ reset: true });
  };

  return {
    orders,
    loading,
    hasLoadedOnce,
    lastDoc,
    fetchOrders,
    applyDateFilter,
  };
};
