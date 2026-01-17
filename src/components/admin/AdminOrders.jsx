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
import { logOrderEvent } from "../helper/logOrderEvent.jsx";
import OrderHistory from "./OrderHistory";
import { useOrderEvents } from "../../hooks/useOrderEvents.js";

/* =====================
   STATUS LABELS
===================== */

const STATUS_LABELS = {
  pending: "Pendiente",
  in_transit: "En camino",
  completed: "Completado",
  cancelled: "Cancelado",
};

/* =====================
   NOTIFICATIONS
===================== */

const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

const showNewOrderNotification = (order) => {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;

  new Notification("🛎️ Nuevo pedido", {
    body: `Pedido de ${order.customer?.name || "Cliente"} · $${order.total}`,
    icon: "/public/vite.svg",
    silent: false,
  });
};

/* =====================
   COMPONENT
===================== */

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const orderEvents = useOrderEvents();

  const isSubscribedRef = useRef(false);
  const audioRef = useRef(null);
  const previousCountRef = useRef(0);

  /* =====================
     FIRESTORE LISTENER
  ===================== */

  useEffect(() => {
    requestNotificationPermission();

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

      if (
        previousCountRef.current > 0 &&
        data.length > previousCountRef.current
      ) {
        const newOrder = data[0];
        audioRef.current?.play().catch(() => {});
        showNewOrderNotification(newOrder);
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
     ACTIONS
  ===================== */

  const updateStatus = async (order, status) => {
    await updateDoc(doc(db, "orders", order.id), { status });

    await logOrderEvent({
      orderId: order.id,
      type: "STATUS_CHANGED",
      from: order.status,
      to: status,
    });

    // 📲 WhatsApp automático SOLO cuando está "En camino"
    if (status === "in_transit" && order.customer?.phone) {
      const text = `Hola ${order.customer?.name || ""} 👋

  Tu pedido ya está *EN CAMINO* 🚚✨

  Productos: $${order.total}
  Envío: $${order.shipping?.final}
  TOTAL: $${order.total + order.shipping?.final}

  ¡Gracias por elegirnos! 🙌🍔`;

      window.open(
        `https://wa.me/${order.customer.phone}?text=${encodeURIComponent(text)}`,
        "_blank"
      );
    }
  };


  const updateShipping = async (order, value) => {
    if (!value || value <= 0) return;

    await updateDoc(doc(db, "orders", order.id), {
      "shipping.final": value,
    });

    await logOrderEvent({
      orderId: order.id,
      type: "SHIPPING_ADJUSTED",
      meta: { to: value },
    });

    const text = `Hola ${order.customer?.name || ""} !!

  El costo de envio hasta tu dirección es de $${value}.

Productos: $${order.total} + Envío: $${value}

*TOTAL:* $${order.total + value}

¿Confirmás el pedido?`;

    window.open(
      `https://wa.me/${order.customer.phone}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };


  const deleteOrder = async (orderId) => {
    await logOrderEvent({
      orderId,
      type: "ORDER_DELETED",
    });

    await deleteDoc(doc(db, "orders", orderId));
  };

  const openWhatsAppManual = async (order) => {
    if (!order.customer?.phone) return;

    const items = order.items
      .map(
        (i) =>
          `• ${i.title} x${i.quantity}${
            i.gustos?.length ? ` (${i.gustos.join(", ")})` : ""
          }`
      )
      .join("\n");

    const message = `Hola 👋
Tu pedido es:

${items}

Productos: $${order.total}
Envío: ${
      order.shipping?.final ? `$${order.shipping.final}` : "a confirmar"
    }
Estado: ${STATUS_LABELS[order.status]}`;

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

  if (loading) {
    return <p className="admin-orders__loading">Cargando pedidos...</p>;
  }

  /* =====================
     RENDER
  ===================== */

  return (
    <section className="admin-orders">
      <audio ref={audioRef} src="/sounds/new-order.wav" preload="auto" />

      <header className="admin-orders__header">
        <h2>Pedidos</h2>

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="in_transit">En camino</option>
          <option value="completed">Completados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </header>

      <div className="admin-orders__list">
        {filteredOrders.map((order) => (
          <article key={order.id} className="order-card">
            <header className="order-card__header">
              <strong>Pedido #{order.id.slice(0, 6)}</strong>
              <span className={`order-status order-status--${order.status}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </header>

            <div className="order-card__info">
              <p>
                <strong>Productos:</strong> ${order.total}
              </p>

              <p>
                <strong>Envío estimado:</strong>{" "}
                {order.shipping?.estimated
                  ? `$${order.shipping.estimated}`
                  : "No informado"}
              </p>

              <p>
                <strong>Envío final:</strong>{" "}
                {order.shipping?.final
                  ? `$${order.shipping.final}`
                  : "Pendiente"}
              </p>
            </div>

            <ul className="order-card__items">
              {order.items.map((item, idx) => (
                <li key={idx}>
                  {item.title} x{item.quantity}
                </li>
              ))}
            </ul>

            {/* 🔥 INPUT + BOTÓN SIEMPRE VISIBLES */}
            <div className="order-card__actions">
              <input
                type="number"
                min={0}
                placeholder="Envío $"
                className="order-shipping-input"
                value={order.shipping?.final ?? ""}
                onChange={(e) =>
                  updateDoc(doc(db, "orders", order.id), {
                    "shipping.final": Number(e.target.value),
                  })
                }
              />

              <button
                className="btn btn--primary"
                disabled={!order.shipping?.final}
                onClick={() =>
                  updateShipping(order, order.shipping.final)
                }
              >
                Mandar costo de envio
              </button>

              <button
                className="btn btn--secondary"
                onClick={() => updateStatus(order, "pending")}
              >
                Pendiente
              </button>

              <button
                className="btn btn--whatsapp"
                disabled={!order.shipping?.final}
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
              >
                ✖
              </button>
            </div>

            <OrderHistory events={orderEvents[order.id] || []} />
          </article>
        ))}
      </div>
    </section>
  );
};

export default AdminOrders;
