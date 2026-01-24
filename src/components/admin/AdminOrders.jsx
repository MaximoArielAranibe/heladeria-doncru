import { useEffect, useState, useRef, useCallback } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import "../../styles/AdminOrders.scss";
import { logOrderEvent } from "../helper/logOrderEvent.jsx";
import OrderHistory from "./OrderHistory";
import { useOrderEvents } from "../../hooks/useOrderEvents.js";
import { deleteDoc } from "firebase/firestore";
import { archiveOrderWithStock } from "../../services/orders.service.js";
import toast from "react-hot-toast";

import { useGustos } from "../../hooks/useGustos.js";


/* =====================
  EMOJIS (UNICODE SAFE)
===================== */

const EMOJI = {
  wave: "\u{1F44B}",
  truck: "\u{1F69A}",
  sparkles: "\u{2728}",
  hands: "\u{1F64C}",
  iceCream: "\u{1F366}",
  iceCreamCup: "\u{1F368}",
  shavedIce: "\u{1F367}",
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


const deleteOrder = async (orderId) => {
  try {
    await deleteDoc(doc(db, "orders", orderId));

    await logOrderEvent({
      orderId,
      type: "ORDER_DELETED",
    });
  } catch (error) {
    console.error("deleteOrder error:", error);
  }
};

const _handleArchive = async (order) => {
  try {
    await archiveOrderWithStock(order);
    toast.success("Pedido archivado y stock descontado 🍦");
  } catch (error) {
    toast.error(error.message);
  }
};

/* =====================
  WHATSAPP HELPERS
===================== */

const sendWhatsAppMessage = (phone, message) => {
  if (!phone) return;

  const cleanPhone = phone.replace(/\D/g, "");
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
  const { gustos: allGustos } = useGustos()

  const orderEvents = useOrderEvents();
  const isSubscribedRef = useRef(false);

  // 🔊 AUDIO (COMO ANTES)
  const audioRef = useRef(null);
  const previousCountRef = useRef(0);

  const loadWithFallback = useCallback(async (unsubscribeFn) => {
    try {
      const colRef = collection(db, "orders");
      const snap = await getDocs(colRef);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(docs);
      setLoading(false);
      setFetchError(null);

      if (typeof unsubscribeFn === "function") {
        try {
          unsubscribeFn();
        } catch (e) {
          console.error(e);
        }
      }
    } catch (err) {
      console.error("Fallback getDocs failed:", err);
      setFetchError(err?.message || "Error desconocido al leer pedidos");
      setLoading(false);
    }
  }, []);

  const getGustoName = (id) => {
    const found = allGustos.find((g) => g.id === id);
    return found?.name || "—";
  };

  /* =====================
     FIRESTORE LISTENER
  ===================== */

  useEffect(() => {
    if (isSubscribedRef.current) return;
    isSubscribedRef.current = true;

    const colRef = collection(db, "orders");
    const q = colRef;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // 🔊 AUDIO NUEVO PEDIDO (IGUAL QUE ANTES)
        if (
          previousCountRef.current > 0 &&
          data.length > previousCountRef.current
        ) {
          audioRef.current?.play().catch(() => { });
        }

        previousCountRef.current = data.length;

        setOrders(data);
        setLoading(false);
        setFetchError(null);
      },
      (error) => {
        console.error("onSnapshot error:", error);
        setFetchError(error?.message || "Error al suscribirse a pedidos");
        loadWithFallback(unsubscribe);
      }
    );

    return () => {
      try {
        unsubscribe();
      } catch (e) {
        console.error(e);
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
        sendWhatsAppMessage(
          order.customer?.phone,
          buildInTransitMessage(order)
        );
      }

      if (status === "completed") {
        await updateDoc(doc(db, "orders", order.id), {
          status: "completed",
          completedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          archived: false,
        });
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

      sendWhatsAppMessage(
        order.customer?.phone,
        buildShippingMessage(order, value)
      );
    } catch (error) {
      console.error("updateShipping error:", error);
    }
  };
  const archiveOrder = async (orderId, adminName = "Admin") => {
    try {
      // 🔥 NUEVO: buscar el pedido actual
      const order = orders.find((o) => o.id === orderId);

      if (!order) {
        throw new Error("Pedido no encontrado");
      }

      // 🔥 NUEVO: descontar stock + validar
      await archiveOrderWithStock({...order, archivedBy: adminName});

      // ✅ TU LÓGICA ORIGINAL (INTACTA)

      await logOrderEvent({
        orderId,
        type: "ORDER_ARCHIVED",
        meta: {
          archivedBy: adminName,
        },
      });

      toast.success("Pedido archivado y stock descontado 🍦");
    } catch (error) {
      console.error("archiveOrder error:", error);
      toast.error(error.message || "Error al archivar pedido");
    }
  };


  const filteredOrders =
    (filter === "all"
      ? orders
      : orders.filter((o) => o.status === filter)
    ).filter((o) => !o.archived);


  /* =====================
     RENDER
  ===================== */

  if (loading) {
    return <p className="admin-orders__loading">Cargando pedidos...</p>;
  }

  return (
    <main className="admin-orders">
      {/* 🔊 AUDIO NUEVO PEDIDO (COMO ANTES) */}
      <audio
        ref={audioRef}
        src="/sounds/new-order.wav"
        preload="auto"
      />

      <header className="admin-orders__header">
        <h2>Pedidos</h2>

        <div
          className="admin-orders__controls"
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
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

          {fetchError && (
            <div style={{ color: "crimson", fontSize: 13 }}>
              Error al cargar: {fetchError}
              <button
                className="btn btn--secondary"
                style={{ marginLeft: 8 }}
                onClick={() => {
                  setLoading(true);
                  setFetchError(null);
                  isSubscribedRef.current = false;
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
                <strong>Envío estimado:</strong>{" "}
                {order.shipping?.estimated ?? "No informado"}
              </p>
              <p>
                <strong>Envío final:</strong>{" "}
                {order.shipping?.final ?? "Pendiente"}
              </p>
              {order.customer?.name && (
                <p>
                  <strong>Cliente:</strong> {order.customer.name}
                </p>
              )}
              {order.customer?.direction && (
                <p>
                  <strong>Dirección:</strong> {order.customer.direction}
                </p>
              )}
              {order.customer?.direction && (
                <p>
                  <strong>Total con envió:</strong> {order.total + order.shipping?.final}
                </p>
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
            </section>

            <ul className="order-card__items">
              {order.items?.map((item, idx) => (
                <li key={idx}>
                  {item.title} x{item.quantity}
                  {item.gustos?.length > 0 && (
                    <div className="archived-gustos">
                      🍦 Gustos:{" "}
                      {item.gustos
                        .map((id) => getGustoName(id))
                        .join(", ")}
                    </div>
                  )}

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
                onClick={() =>
                  updateShipping(order, order.shipping.final)
                }
              >
                Mandar costo de envío
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
              {/*
              <button
                className="btn btn--danger"
                onClick={() => updateStatus(order, "cancelled")}
              >
                Cancelar
              </button> */}


              {order.status === "completed" && (
                <button
                  className="btn btn--secondary"
                  onClick={() => archiveOrder(order.id)}
                >
                  Archivar
                </button>
              )}


              <button
                className="btn"
                onClick={() =>
                  sendWhatsAppMessage(
                    order.customer?.phone,
                    buildShippingMessage(
                      order,
                      order.shipping?.final ?? 0
                    )
                  )
                }
              >
                WhatsApp
              </button>
              <button
                className="order-delete-btn"
                onClick={() => deleteOrder(order.id)}
              >
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
