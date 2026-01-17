import { useEffect, useState, useRef, useCallback } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import "../../styles/AdminOrders.scss";
import { logOrderEvent } from "../helper/logOrderEvent.jsx";
import OrderHistory from "./OrderHistory";
import { useOrderEvents } from "../../hooks/useOrderEvents.js";

/* =====================
  EMOJIS (UNICODE SAFE)
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
  });
};


const EMOJI = {
  wave: "\u{1F44B}",
  truck: "\u{1F69A}",
  sparkles: "\u{2728}",
  hands: "\u{1F64C}",
  iceCream: "\u{1F366}",     // 🍦
  iceCreamCup: "\u{1F368}", // 🍨
  shavedIce: "\u{1F367}",   // 🍧
};

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
  WHATSAPP HELPERS
===================== */

const sendWhatsAppMessage = (phone, message) => {
  if (!phone) return;

  const cleanPhone = phone.replace(/\D/g, "");

  // ✅ UTF-8 correcto (emojis + acentos)
  const encodedMessage = encodeURIComponent(message);

  window.open(
    `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
    "_blank"
  );
};


const buildShippingMessage = (order, value) =>
  [
    `Hola ${order.customer?.name || ""} ${EMOJI.wave} ${EMOJI.iceCream}`,
    ``,
    `¡Tu pedido está casi listo!`,
    ``,
    `🚚 El costo de envío hasta tu dirección es de $${value}.`,
    ``,
    `🧾 Resumen del pedido:`,
    `• Productos: $${order.total}`,
    `• Envío: $${value}`,
    ``,
    `• TOTAL con envío: $*${(order.total ?? 0) + value}*`,
    ``,
    `¿Confirmás el pedido para enviarlo? ${EMOJI.sparkles}`,
  ].join("\n");

const buildInTransitMessage = (order) =>
  [
    `Tu pedido ya está en camino ${EMOJI.sparkles}`,
    ``,
    `¡Gracias ${order.customer?.name || ""} por elegir Helados Doncru! ${EMOJI.iceCream} ${EMOJI.hands}`,
  ].join("\n");


/* =====================
  COMPONENT
===================== */

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [fetchError, setFetchError] = useState(null);
  const orderEvents = useOrderEvents();
  const isSubscribedRef = useRef(false);

  const loadWithFallback = useCallback(async (unsubscribeFn) => {
    // fallback: try a plain getDocs read (no orderBy) to at least fetch data once
    try {
      const colRef = collection(db, "orders");
      const snap = await getDocs(colRef);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(docs);
      setLoading(false);
      setFetchError(null);
      // unsubscribe the failing onSnapshot (if provided)
      if (typeof unsubscribeFn === "function") {
        try {
          unsubscribeFn();
        } catch (e) {
          console.log(e);

        }
      }
    } catch (err) {
      console.error("Fallback getDocs failed:", err);
      setFetchError(err?.message || "Error desconocido al leer pedidos");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  };

  requestNotificationPermission();
    if (isSubscribedRef.current) return;
    isSubscribedRef.current = true;

    // Prefer simple collection streaming (no orderBy) to avoid issues
    const colRef = collection(db, "orders");
    const q = colRef; // keep it plain; if you want ordering add checks/migration

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setFetchError(null);
      },
      (error) => {
        // If onSnapshot errors (rules, invalid index, etc.) -> try fallback once
        console.error("onSnapshot error:", error);
        setFetchError(error?.message || "Error al suscribirse a pedidos");
        // fallback to getDocs so the UI can at least show data
        loadWithFallback(unsubscribe);
      }

    );

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        {
          console.error(e);
        }
      }
      isSubscribedRef.current = false;
    };
  }, [loadWithFallback]);

  /* =====================
  ACTIONS
  ===================== */

  const updateStatus = async (order, status) => {
    try {
      await updateDoc(doc(db, "orders", order.id), { status });

      await logOrderEvent({
        orderId: order.id,
        type: "STATUS_CHANGED",
        from: order.status,
        to: status,
      });

      if (status === "in_transit") {
        sendWhatsAppMessage(order.customer?.phone, buildInTransitMessage(order));
      }
    } catch (error) {
      console.error("updateStatus error:", error);
    }
  };

  const updateShipping = async (order, value) => {
    if (!value || value <= 0) return;

    try {
      await updateDoc(doc(db, "orders", order.id), {
        "shipping.final": value,
      });

      await logOrderEvent({
        orderId: order.id,
        type: "SHIPPING_ADJUSTED",
        meta: { to: value },
      });

      sendWhatsAppMessage(order.customer?.phone, buildShippingMessage(order, value));
    } catch (error) {
      console.error("updateShipping error:", error);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await logOrderEvent({
        orderId,
        type: "ORDER_DELETED",
      });

      await deleteDoc(doc(db, "orders", orderId));
    } catch (error) {
      console.error("deleteOrder error:", error);
    }
  };

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  /* =====================
    RENDER
  ===================== */

  if (loading) {
    return <p className="admin-orders__loading">Cargando pedidos...</p>;
  }

  return (
    <main className="admin-orders">
      <header className="admin-orders__header">
        <h2>Pedidos</h2>

        <div className="admin-orders__controls" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="in_transit">En camino</option>
            <option value="completed">Completados</option>
            <option value="cancelled">Cancelados</option>
          </select>

          {fetchError && (
            <div style={{ color: "crimson", fontSize: 13 }}>
              Error al cargar: {fetchError}
              <button
                className="btn btn--secondary"
                style={{ marginLeft: 8 }}
                onClick={() => {
                  setLoading(true);
                  setFetchError(null);
                  // Forzar re-mount of effect by toggling isSubscribedRef (simple hack)
                  isSubscribedRef.current = false;
                  // small timeout to ensure effect can re-run
                  setTimeout(() => {
                    setLoading(true);
                    // no-op: effect will run because isSubscribedRef was set false
                  }, 50);
                }}
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="admin-orders__list">
        {filteredOrders.map((order) => (
          <article key={order.id} className="order-card">
            <header className="order-card__header">
              <strong>Pedido #{order.id.slice(0, 6)}</strong>
              <span className={`order-status order-status--${order.status}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </header>

            <section className="order-card__info">
              <p>
                <strong>Productos:</strong> ${order.total}
              </p>
              <p>
                <strong>Envío estimado:</strong> {order.shipping?.estimated ?? "No informado"}
              </p>
              <p>
                <strong>Envío final:</strong> {order.shipping?.final ?? "Pendiente"}
              </p>
              {order.customer?.name && (
                <p>
                  <strong>Cliente:</strong> {order.customer.name}
                </p>
              )}
              {order.customer?.phone && (
                <p>
                  <strong>Teléfono:</strong>{" "}
                  <a href={`https://wa.me/${order.customer.phone}`} target="_blank" rel="noreferrer">
                    {order.customer.phone}
                  </a>
                </p>
              )}
            </section>

            <ul className="order-card__items">
              {order.items?.map((item, idx) => (
                <li key={idx}>
                  {item.title} x{item.quantity}
                  {item.gustos?.length ? ` (${item.gustos.join(", ")})` : ""}
                </li>
              ))}
            </ul>

            <footer className="order-card__actions">
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
                onClick={() => updateShipping(order, order.shipping.final)}
              >
                Mandar costo de envío
              </button>

              <button className="btn btn--secondary" onClick={() => updateStatus(order, "pending")}>
                Pendiente
              </button>

              <button
                className="btn btn--whatsapp"
                disabled={!order.shipping?.final}
                onClick={() => updateStatus(order, "in_transit")}
              >
                En camino 🚚
              </button>

              <button className="btn btn--primary" onClick={() => updateStatus(order, "completed")}>
                Completado
              </button>

              <button className="btn btn--danger" onClick={() => updateStatus(order, "cancelled")}>
                Cancelar
              </button>

              <button className="btn" onClick={() => sendWhatsAppMessage(order.customer?.phone, buildShippingMessage(order, order.shipping?.final ?? 0))}>
                WhatsApp
              </button>

              <button className="order-delete-btn" onClick={() => deleteOrder(order.id)}>
                ✖
              </button>
            </footer>

            <aside>
              <OrderHistory events={orderEvents[order.id] || []} />
            </aside>
          </article>
        ))}
      </section>
    </main>
  );
};

export default AdminOrders;
