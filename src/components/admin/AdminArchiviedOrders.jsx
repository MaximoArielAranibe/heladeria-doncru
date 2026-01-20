import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const AdminArchivedOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("archived", "==", true),
      orderBy("completedAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setOrders(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, []);

  if (!orders.length) return <p>No hay pedidos archivados</p>;

  return (
    <section>
      <h2>Pedidos archivados</h2>

      {orders.map((o) => (
        <article key={o.id}>
          <strong>Pedido #{o.id.slice(0, 6)}</strong>
          <p>Total: ${o.total}</p>
          <p>Completado: {o.completedAt?.toDate().toLocaleString()}</p>
        </article>
      ))}
    </section>
  );
};

export default AdminArchivedOrders;
