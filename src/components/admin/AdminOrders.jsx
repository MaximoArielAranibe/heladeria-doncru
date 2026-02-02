import { useEffect, useState, useRef, useCallback } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import "../../styles/AdminOrders.scss";
import { logOrderEvent } from "../helper/logOrderEvent.jsx";
import OrderHistory from "./OrderHistory";
import { useOrderEvents } from "../../hooks/useOrderEvents.js";
import { deleteDoc } from "firebase/firestore";
import { archiveOrderWithStock } from "../../services/orders.service.js";
import toast from "react-hot-toast";
import { useGustos } from "../../hooks/useGustos.js";
import { getAuth, onAuthStateChanged } from "firebase/auth";

/* =====================
  EMOJIS
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
  cost_send: "Costo enviado",
  in_transit: "En camino",
  completed: "Completado",
  cancelled: "Cancelado",
};

const hasShippingFinal = (order) =>
  typeof order.shipping?.final === "number" && order.shipping.final > 0;


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
  const [shippingDraft, setShippingDraft] = useState({});
  const { gustos: allGustos } = useGustos();
  const orderEvents = useOrderEvents();
  const _isSubscribedRef = useRef(false);

  const audioRef = useRef(null);
  const previousCountRef = useRef(0);

  /* =====================
     FALLBACK LOAD
  ===================== */

  const _loadWithFallback = useCallback(async (unsubscribeFn) => {
    try {
      const colRef = collection(db, "orders");
      const snap = await getDocs(colRef);

      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setOrders(docs);
      setLoading(false);
      setFetchError(null);

      if (typeof unsubscribeFn === "function") {
        unsubscribeFn();
      }
    } catch (err) {
      console.error("Fallback getDocs failed:", err);

      setFetchError(err?.message || "Error al leer pedidos");
      setLoading(false);
    }
  }, []);

  const getGustoName = (id) => {
    const found = allGustos.find((g) => g.id === id);
    return found?.name || "—";
  };

  /* =====================
     LISTENER
  ===================== */

  useEffect(() => {
    const auth = getAuth();

    let unsubscribeOrders = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.log("AdminOrders: usuario no autenticado");
        return;
      }


      const colRef = collection(db, "orders");

      unsubscribeOrders = onSnapshot(
        colRef,

        (snapshot) => {
          const data = snapshot.docs.map((d) => ({
            id: d.id,
            comments: "",
            ...d.data(),
          }));

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

          setFetchError(error?.message || "Error al suscribirse");
        }
      );
    });

    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      unsubscribeAuth();
    };
  }, []);

  /* =====================
     ACTIONS
  ===================== */

  const updateStatus = async (order, status) => {
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status,
      });

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
        });
      }
    } catch (error) {
      console.error("updateStatus error:", error);
      toast.error("Error al actualizar estado");
    }
  };

  const updateShipping = async (order) => {
    const value = shippingDraft[order.id];

    if (!value || value <= 0) {
      toast.error("Ingresá un monto válido");
      return;
    }

    try {
      const currentUser = auth.currentUser;

      await updateDoc(doc(db, "orders", order.id), {
        "shipping.final": value,
        "shipping.sentBy": currentUser?.email || "Admin",
        "shipping.sentAt": serverTimestamp(),

        // ✅ CAMBIAMOS EL STATUS
        status: "cost_send",

        updatedAt: serverTimestamp(),
      });

      await logOrderEvent({
        orderId: order.id,
        type: "SHIPPING_ADJUSTED",
        meta: {
          to: value,
          by: currentUser?.email || "Admin",
        },
      });

      sendWhatsAppMessage(
        order.customer?.phone,
        buildShippingMessage(order, value)
      );

      setShippingDraft((prev) => ({
        ...prev,
        [order.id]: value,
      }));

      toast.success("Costo enviado 🚚");

    } catch (error) {
      console.error("updateShipping error:", error);
      toast.error("No se pudo actualizar el envío");
    }
  };

  const markAsPaid = async (orderId) => {
    try {
      const user = auth.currentUser;

      await updateDoc(doc(db, "orders", orderId), {
        "payment.status": "paid",
        "payment.paidAt": serverTimestamp(),
        "payment.paidBy": user?.email || "Admin",
      });

      toast.success("Pago confirmado 💰");

    } catch (err) {
      console.error(err);
      toast.error("Error al marcar pago");
    }
  };


  const cancelPayment = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        "payment.status": "pending",
        "payment.paidAt": null,
        "payment.cancelledAt": serverTimestamp(),
      });

      toast.success("Pago anulado ⚠️");

    } catch (err) {
      console.error(err);
      toast.error("Error al anular pago");
    }
  };
  const updatePaymentMethod = async (orderId, method) => {
    try {
      const order = orders.find((o) => o.id === orderId);

      const updateData = {
        "payment.method": method,
        "payment.updatedAt": serverTimestamp(),
      };

      if (order?.payment?.status === "paid") {
        updateData["payment.methodChangedAt"] = serverTimestamp();
      }

      await updateDoc(doc(db, "orders", orderId), updateData);

      toast.success(`Método actualizado: ${method} 💳`);

    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar método de pago");
    }
  };



  const archiveOrder = async (orderId, adminName = "Admin") => {
    try {
      const order = orders.find((o) => o.id === orderId);

      if (!order) {
        throw new Error("Pedido no encontrado");
      }

      await archiveOrderWithStock({
        ...order,
        archivedBy: adminName,
      });

      await logOrderEvent({
        orderId,
        type: "ORDER_ARCHIVED",
        meta: { archivedBy: adminName },
      });

      toast.success("Pedido archivado 🍦");
    } catch (error) {
      console.error("archiveOrder error:", error);
      toast.error("Error al archivar pedido");
    }
  };

  /* =====================
     FILTER
  ===================== */

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
      <audio ref={audioRef} src="/sounds/new-order.wav" preload="auto" />

      <header className="admin-orders__header">
        <h2>Pedidos</h2>

        <div className="admin-orders__controls">
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
              Error: {fetchError}
            </div>
          )}
        </div>
      </header>

      <section className="admin-orders__list">
        {filteredOrders.map((order) => (
          <article key={order.id} className="order-card">
            <header className="order-card__header">
              <strong>Pedido #{order.id.slice(0, 6)}</strong>

              <span
                className={`order-status order-status--${order.status}`}
              >
                {STATUS_LABELS[order.status]}
              </span>
            </header>

            <section className="order-card__info">
              <p>
                <strong>Cliente:</strong> {order.customer?.name}
              </p>

              <p>
                <strong>Dirección:</strong> {order.customer?.direction}
              </p>

              <p>
                <strong>Teléfono:</strong> {order.customer?.phone}
              </p>

              <p>
                <strong>Productos:</strong> ${order.total}
              </p>

              {order.payment?.paidBy && (
                <small style={{ color: "#64748b" }}>
                  Cobrado por: {order.payment.paidBy}
                </small>
              )}


              <p>
                <strong>Pago:</strong>{" "}
                <select
                  value={order.payment?.method || "efectivo"}
                  onChange={(e) =>
                    updatePaymentMethod(order.id, e.target.value)
                  }
                  className="payment-method-select"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">💳 Transferencia</option>
                </select>
              </p>

              {order.payment?.methodChangedAt && (
                <small style={{ color: "#64748b" }}>
                  Método modificado:{" "}
                  {order.payment.methodChangedAt.toDate().toLocaleString()}
                </small>
              )}



              <p>
                <strong>Estado pago:</strong>{" "}
                {order.payment?.status === "paid" ? (
                  <span className="payment-paid">
                    ✅ Pagado{" "}
                    {order.payment?.paidAt &&
                      `(${order.payment.paidAt.toDate().toLocaleString()})`}
                  </span>
                ) : (
                  <span className="payment-pending">
                    ⏳ Pendiente
                  </span>
                )}
              </p>


              <p className="order-shipping">
                <strong>Envío:</strong>{" "}
                {hasShippingFinal(order) ? (
                  <span className="shipping-sent">
                    💸 ${order.shipping.final}
                    {" "} (Enviado por {order.shipping?.sentBy}) a las {order.shipping?.sentAt?.toDate().toLocaleString()}
                  </span>
                ) : (
                  <span className="shipping-pending">
                    ⏳ Pendiente
                  </span>
                )}
              </p>



              {order.comments && order.comments.trim() !== "" && (
                <p className="order-comments">
                  <strong>Comentarios:</strong>{" "}
                  {order.comments || "— Sin comentarios —"}
                </p>

              )}


            </section>

            <ul className="order-card__items">
              {order.items?.map((item, idx) => (
                <li key={idx}>
                  {item.title} x{item.quantity}

                  {item.gustos?.length > 0 && (
                    <div>
                      🍦{" "}
                      {item.gustos
                        .map((id) => getGustoName(id))
                        .join(", ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <footer className="order-card__actions">
              <div className="shipping-select-wrapper">
                <select
                  value={shippingDraft[order.id] ?? ""}
                  onChange={(e) =>
                    setShippingDraft((prev) => ({
                      ...prev,
                      [order.id]: Number(e.target.value),
                    }))
                  }
                >
                  <option value="" disabled>
                    Costo envío
                  </option>

                  <option value={2000}>$2000</option>
                  <option value={2500}>$2500</option>
                  <option value={3000}>$3000</option>
                  <option value={4000}>$4000</option>
                  <option value={4500}>$4500</option>
                  <option value={5000}>$5000</option>
                </select>

                <input
                  type="number"
                  min="0"
                  placeholder="Otro $"
                  value={shippingDraft[order.id] ?? order.shipping?.final ?? ""}
                  onChange={(e) =>
                    setShippingDraft((prev) => ({
                      ...prev,
                      [order.id]: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <button
                className="btn btn--primary"
                disabled={!shippingDraft[order.id]}
                onClick={() => updateShipping(order)}
              >
                Enviar costo
              </button>

              <button
                className="btn btn--secondary"
                onClick={() => updateStatus(order, "pending")}
              >
                Pendiente
              </button>

              <button
                className="btn btn--whatsapp"
                disabled={!shippingDraft[order.id]}
                onClick={() => updateStatus(order, "in_transit")}
              >
                En camino 🚚
              </button>

              {/* Marcar pagado */}
              {order.payment?.status !== "paid" && (
                <button
                  className="btn btn--success"
                  onClick={() => markAsPaid(order.id)}
                >
                  💰 Marcar pagado
                </button>
              )}

              {/* Anular pago */}
              {order.payment?.status === "paid" && (
                <button
                  className="btn btn--danger"
                  onClick={() => cancelPayment(order.id)}
                >
                  ❌ Anular pago
                </button>
              )}





              <button
                className="btn btn--primary"
                onClick={() => updateStatus(order, "completed")}
              >
                Completado
              </button>

              {order.status === "completed" && (
                <button
                  className="btn btn--secondary"
                  onClick={() => archiveOrder(order.id)}
                >
                  Archivar
                </button>
              )}

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
