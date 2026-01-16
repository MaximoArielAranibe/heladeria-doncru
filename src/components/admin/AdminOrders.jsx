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

/* =====================
   STATUS LABELS
===================== */

const STATUS_LABELS = {
  pending: "Pendiente",
  in_transit: "En camino",
  completed: "Completado",
  cancelled: "Cancelado",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // 🔒 Evita doble suscripción (StrictMode)
  const isSubscribedRef = useRef(false);

  // 🔔 Sonido nuevo pedido
  const audioRef = useRef(null);
  const previousCountRef = useRef(0);

  /* =====================
     FIRESTORE LISTENER
  ===================== */

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

      // 🔔 Sonido SOLO si entra un pedido nuevo
      if (
        previousCountRef.current > 0 &&
        data.length > previousCountRef.current
      ) {
        audioRef.current?.play().catch(() => {});
      }

      previousCountRef.current = data.length;

      setOrders(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      isSubscribedRef.current = false;
    };
  }, []);

  /* =====================
     WHATSAPP AUTOMÁTICO
  ===================== */

  const sendWhatsAppStatus = (order, status) => {
    if (!order.customer?.phone) return;

    let text = "";

    if (status === "in_transit") {
      text = `Hola ${order.customer?.name || ""} 👋
Tu pedido ya está *EN CAMINO* 🚚🍦

Total: $${order.total}

¡Gracias por elegirnos!`;
    }

    if (status === "completed") {
      text = `Hola ${order.customer?.name || ""} 😊
Tu pedido fue *COMPLETADO* ✅🍦

¡Esperamos que lo disfrutes!`;
    }

    if (!text) return;

    window.open(
      `https://wa.me/${order.customer.phone}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  /* =====================
     ACTIONS
  ===================== */

  const updateStatus = async (order, status) => {
    await updateDoc(doc(db, "orders", order.id), { status });
    sendWhatsAppStatus(order, status);
  };

  const deleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
    } catch (error) {
      console.error("DELETE DENEGADO POR FIRESTORE:", error);
    }
  };

  const openWhatsAppManual = (order) => {
    if (!order.customer?.phone) return;

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
      `https://wa.me/${order.customer.phone}?text=${encodeURIComponent(message)}`,
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
    return (
      <p className="admin-orders__loading">
        Cargando pedidos...
      </p>
    );
  }

  /* =====================
     RENDER
  ===================== */

  return (
    <section className="admin-orders">
      {/* 🔊 AUDIO NUEVO PEDIDO */}
      <audio
        ref={audioRef}
        src="/sounds/new-order.wav"
        preload="auto"
      />

      <header className="admin-orders__header">
        <h2>Pedidos</h2>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="in_transit">En camino</option>
          <option value="completed">Completados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </header>

      <div className="admin-orders__list">
        {filteredOrders.length === 0 ? (
          <p className="admin-orders__empty">
            No hay pedidos para este filtro
          </p>
        ) : (
          filteredOrders.map((order) => (
            <article key={order.id} className="order-card">
              <header className="order-card__header">
                <strong>
                  Pedido #{order.id.slice(0, 6)}
                </strong>

                <span
                  className={`order-status order-status--${order.status}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </header>

              <div className="order-card__info">
                <p><strong>Total:</strong> ${order.total}</p>

                {order.customer?.name && (
                  <p><strong>Cliente:</strong> {order.customer.name}</p>
                )}

                {order.customer?.phone && (
                  <p>
                    <strong>Teléfono:</strong>{" "}
                    <a
                      href={`https://wa.me/${order.customer.phone}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {order.customer.phone}
                    </a>
                  </p>
                )}
              </div>

              <ul className="order-card__items">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.title} x{item.quantity}
                    {item.gustos?.length > 0 && (
                      <span> ({item.gustos.join(", ")})</span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="order-card__actions">
                <button
                  className="btn btn--secondary"
                  onClick={() => updateStatus(order, "pending")}
                >
                  Pendiente
                </button>

                <button
                  className="btn btn--whatsapp"
                  onClick={() => updateStatus(order, "in_transit")}
                >
                  En camino 🚚
                </button>

                <button
                  className="btn btn--primary"
                  onClick={() => updateStatus(order, "completed")}
                >
                  Completado
                </button>

                <button
                  className="btn btn--danger"
                  onClick={() => updateStatus(order, "cancelled")}
                >
                  Cancelar
                </button>

                <button
                  className="btn"
                  onClick={() => openWhatsAppManual(order)}
                >
                  WhatsApp
                </button>

                <button
                  className="order-delete-btn"
                  onClick={() => deleteOrder(order.id)}
                  title="Eliminar pedido"
                >
                  ✖
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default AdminOrders;
