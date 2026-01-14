import { useEffect, useState, useRef } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import "../../styles/AdminOrders.scss";

import { useAuth } from "../../hooks/useAuth";




const STATUS_LABELS = {
  pending: "Pendiente",
  paid: "Pagado",
  cancelled: "Cancelado",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // 🔒 Evita doble suscripción en StrictMode
  const isSubscribedRef = useRef(false);

  /* =====================
     FIRESTORE LISTENER
  ====================*/

  useEffect(() => {
    if (isSubscribedRef.current) return;
    isSubscribedRef.current = true;

    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setOrders(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, []);

  /* =====================
     ACTIONS
  ===================== */

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status });
  };
  const deleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
    } catch (error) {
      console.error("DELETE DENEGADO POR FIRESTORE:", error);
    }
  };


  const openWhatsApp = (order) => {
    const phone = order.customer?.phone;
    if (!phone) return;

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
Estado: ${STATUS_LABELS[order.status]}
    `.trim();

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  /* =====================
     FILTER
  ===================== */

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((o) => o.status === filter);

  /* =====================
     STATES
  ===================== */

  if (loading) {
    return <p className="admin-orders__loading">Cargando pedidos...</p>;
  }

  if (!filteredOrders.length) {
    return (
      <p className="admin-orders__empty">
        No hay pedidos para este filtro
      </p>
    );
  }

  /* =====================
     RENDER
  ===================== */

  return (
    <section className="admin-orders">
      <header className="admin-orders__header">
        <h2>Pedidos</h2>

        {/* ❗ NO se tocan las options */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="paid">Pagados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </header>

      <div className="admin-orders__list">
        {filteredOrders.map((order) => (
          <article key={order.id} className="order-card">
            <header className="order-card__header">
              <strong>Pedido #{order.id.slice(0, 6)}</strong>

              <div className="order-card__header-actions">
                <span
                  className={`order-status order-status--${order.status}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>

                {/* ❌ ELIMINAR */}
                <button
                  className="order-delete-btn"
                  title="Eliminar pedido"
                  onClick={() => deleteOrder(order.id)}
                >
                  ✖
                </button>
              </div>
            </header>

            <div className="order-card__info">
              <p>
                <strong>Total:</strong> ${order.total}
              </p>

              {order.customer?.name && (
                <p>
                  <strong>Cliente:</strong>{" "}
                  {order.customer.name}
                </p>
              )}
            </div>

            <ul className="order-card__items">
              {order.items.map((item, idx) => (
                <li key={idx}>
                  {item.title} x{item.quantity}
                  {item.gustos?.length > 0 && (
                    <span>
                      {" "}
                      ({item.gustos.join(", ")})
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <div className="order-card__actions">
              <button
                className="btn btn--success"
                onClick={() =>
                  updateStatus(order.id, "paid")
                }
              >
                Marcar pagado
              </button>

              <button
                className="btn btn--danger"
                onClick={() =>
                  updateStatus(order.id, "cancelled")
                }
              >
                Cancelar
              </button>

              {order.customer?.phone && (
                <button
                  className="btn btn--whatsapp"
                  onClick={() => openWhatsApp(order)}
                >
                  WhatsApp
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AdminOrders;
