import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const STATUS_COLORS = {
  pending: "#facc15",
  paid: "#22c55e",
  cancelled: "#ef4444",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setOrders(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status });
  };

  const openWhatsApp = (order) => {
    const phone = order.customer?.phone || "";
    const items = order.items
      .map(
        (i) =>
          `• ${i.title} x${i.quantity}${
            i.gustos?.length ? ` (${i.gustos.join(", ")})` : ""
          }`
      )
      .join("\n");

    const message = `
Hola 👋
Tu pedido es:

${items}

Total: $${order.total}
Estado: ${order.status}
    `.trim();

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return <p>Cargando pedidos...</p>;
  }

  if (!orders.length) {
    return <p>No hay pedidos aún</p>;
  }

  return (
    <section className="admin-orders">
      <h2>Pedidos</h2>

      {orders.map((order) => (
        <article
          key={order.id}
          className="order-card"
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <header style={{ marginBottom: 8 }}>
            <strong>Pedido #{order.id.slice(0, 6)}</strong>
            <span
              style={{
                marginLeft: 12,
                padding: "4px 10px",
                borderRadius: 999,
                background: STATUS_COLORS[order.status],
                color: "#111",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {order.status}
            </span>
          </header>

          <p><strong>Total:</strong> ${order.total}</p>

          {order.customer?.name && (
            <p><strong>Cliente:</strong> {order.customer.name}</p>
          )}

          <ul style={{ marginTop: 8 }}>
            {order.items.map((item, idx) => (
              <li key={idx}>
                {item.title} x{item.quantity}
                {item.gustos?.length > 0 && (
                  <> ({item.gustos.join(", ")})</>
                )}
              </li>
            ))}
          </ul>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => updateStatus(order.id, "paid")}>
              Marcar pagado
            </button>

            <button onClick={() => updateStatus(order.id, "cancelled")}>
              Cancelar
            </button>

            {order.customer?.phone && (
              <button onClick={() => openWhatsApp(order)}>
                WhatsApp
              </button>
            )}
          </div>
        </article>
      ))}
    </section>
  );
};

export default AdminOrders;


/*
.admin-orders button {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.admin-orders button:hover {
  opacity: 0.85;
}

*/