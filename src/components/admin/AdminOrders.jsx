import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp,
  deleteDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { logOrderEvent } from "../helper/logOrderEvent.jsx";
import OrderHistory from "./OrderHistory";
import { useOrderEvents } from "../../hooks/useOrderEvents.js";
import toast from "react-hot-toast";
import { archiveOrderWithStock } from "../../services/orders.service.js";
import { useGustos } from "../../hooks/useGustos.js";
import "../../styles/AdminOrders.scss";
import ModalLocalOrder from "./ModalLocalOrder.jsx";


/* =====================
   CONSTANTS
===================== */

const STATUS_LABELS = {
  pending: "Pendiente",
  cost_send: "Costo enviado",
  in_transit: "En camino",
  completed: "Completado",
  cancelled: "Cancelado",
};

/* =====================
   ADMIN / SUCURSALES
===================== */

const ADMIN_BRANCH_MAP = {
  "heladosdoncru@gmail.com": "Almafuerte",
  "nicolabrandon89@gmail.com": "Gral Paz",
  "darknesswong@gmail.com": "Maximo programador"
};


const hasShippingFinal = (order) =>
  typeof order.shipping?.final === "number" && order.shipping.final > 0;



/* =====================
   COMPONENT
===================== */

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [fetchError, setFetchError] = useState(null);
  const [shippingDraft, setShippingDraft] = useState({});
  const [newOrders, setNewOrders] = useState(0);
  const [openLocalOrder, setOpenLocalOrder] = useState(false);



  const { gustos } = useGustos();
  const orderEvents = useOrderEvents();

  const audioRef = useRef(null);
  const previousCountRef = useRef(0);

  /* =====================
     HELPERS
  ===================== */


  const gustosMap = useMemo(() => {
    return new Map(gustos.map(g => [g.id, g.name]));
  }, [gustos]);


  const getGustoName = (id) =>
    gustosMap.get(id) || "—";


  const playNewOrderSound = (count) => {
    if (
      previousCountRef.current > 0 &&
      count > previousCountRef.current
    ) {
      audioRef.current?.play().catch(() => { });
    }

    previousCountRef.current = count;
  };


  const getBranchByEmail = (email) => {
    if (!email) return "—";

    return ADMIN_BRANCH_MAP[email] || "Sucursal desconocida";
  };

  /* =====================
     LOAD FALLBACK
  ===================== */

  const loadFallback = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "orders"));

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setOrders(data);
      setFetchError(null);
    } catch (err) {
      console.error(err);
      setFetchError("Error al leer pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  /* =====================
     REALTIME LISTENER
  ===================== */

  useEffect(() => {
    const authInstance = getAuth();

    let unsubscribeOrders = null;

    const unsubscribeAuth = onAuthStateChanged(
      authInstance,
      (user) => {
        if (!user) return;

        const ordersQuery = query(
          collection(db, "orders"),
          where("archived", "==", false),
          orderBy("createdAt", "desc")
        );

        unsubscribeOrders = onSnapshot(
          ordersQuery,

          (snapshot) => {
            const data = snapshot.docs
              .map((d) => ({
                id: d.id,
                comments: "",
                ...d.data(),
              }))
              .sort((a, b) => {
                return (
                  (b.createdAt?.toMillis?.() || 0) -
                  (a.createdAt?.toMillis?.() || 0)
                );
              });


            /* =====================
               NUEVOS PEDIDOS
            ===================== */

            if (data.length > previousCountRef.current) {
              setNewOrders((prev) => prev + 1);
            }

            /* =====================
               NO TOCAR AUDIO
            ===================== */

            playNewOrderSound(data.length);

            setOrders(data);
            setFetchError(null);
            setLoading(false);
          },

          (error) => {
            console.error("onSnapshot error:", error);
            setFetchError("Error al suscribirse");
            loadFallback();
          }
        );
      }

    );


    return () => {
      unsubscribeOrders?.();
      unsubscribeAuth();
    };
  }, [loadFallback]);


  useEffect(() => {
    if (filter === "all" && orders.length > 0) {
      setNewOrders(0);
    }
  }, [filter, orders]);


  /* =====================
     ACTIONS
  ===================== */

  const updateStatus = useCallback(async (order, status) => {
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status,
        ...(status === "completed" && {
          completedAt: serverTimestamp(),
        }),
      });

      await logOrderEvent({
        orderId: order.id,
        type: "STATUS_CHANGED",
        from: order.status,
        to: status,
        meta: {
          changedBy: auth.currentUser?.email || "Admin"
        }
      });

      if (status === "in_transit") {
        const message = buildInTransitMessage(order);

        await sendWhatsAppMessage(
          order.customer?.phone,
          message,
          order.id
        );
      }

      toast.success("Estado actualizado");

      toast.success("Estado actualizado");

    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar estado");
    }
  }, []);


  const updateShipping = useCallback(async (order) => {
    const value = shippingDraft[order.id];

    if (!value || value <= 0) {
      toast.error("Monto inválido");
      return;
    }

    try {
      const user = auth.currentUser;

      await updateDoc(doc(db, "orders", order.id), {
        "shipping.final": value,
        "shipping.sentBy": user?.email || "Admin",
        "shipping.sentAt": serverTimestamp(),
        status: "cost_send",
        updatedAt: serverTimestamp(),
      });

      await logOrderEvent({
        orderId: order.id,
        type: "SHIPPING_ADJUSTED",
        meta: {
          to: value,
          changedBy: auth.currentUser?.email || "Admin"
        },

      });

      sendWhatsAppMessage(
        order.customer?.phone,
        buildShippingMessage(order, value, getGustoName),
        order.id
      );

      setShippingDraft((p) => ({ ...p, [order.id]: value }));

      toast.success("Costo enviado 🚚");

    } catch (err) {
      console.error(err);
      toast.error("Error envío");
    }
  }, [shippingDraft]);

  const markAsPaid = useCallback(async (orderId) => {
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
      toast.error("Error pago");
    }
  }, []);

  const markAsPickup = useCallback(async (order) => {
    try {
      const user = auth.currentUser;

      await updateDoc(doc(db, "orders", order.id), {
        deliveryType: "pickup",
        "shipping.final": 0,
        "shipping.sentBy": user?.email || "Admin",
        "shipping.sentAt": serverTimestamp(),
        status: "in_transit",
        updatedAt: serverTimestamp(),
      });

      await logOrderEvent({
        orderId: order.id,
        type: "PICKUP_SELECTED",
        meta: {
          changedBy: user?.email || "Admin",
        },
      });

      toast.success("Pedido marcado como retiro en local 🏪");

    } catch (err) {
      console.error(err);
      toast.error("Error al marcar retiro");
    }
  }, []);


  const cancelPayment = useCallback(async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        "payment.status": "pending",
        "payment.paidAt": null,
        "payment.cancelledAt": serverTimestamp(),
      });

      toast.success("Pago anulado");

    } catch (err) {
      console.error(err);
      toast.error("Error anular");
    }
  }, []);

  const ordersMap = useMemo(() => {
    return new Map(orders.map(o => [o.id, o]));
  }, [orders]);

  const updatePaymentMethod = useCallback(async (orderId, method) => {
    try {
      const order = ordersMap.get(orderId);

      if (!order) return;

      const prevMethod = order.payment?.method || "efectivo";

      if (prevMethod === method) return;

      const data = {
        "payment.method": method,
        "payment.updatedAt": serverTimestamp(),
      };

      if (order?.payment?.status === "paid") {
        data["payment.methodChangedAt"] = serverTimestamp();
      }

      await updateDoc(doc(db, "orders", orderId), data);

      // ✅ LOG EVENTO
      await logOrderEvent({
        orderId,
        type: "PAYMENT_METHOD_CHANGED",
        from: prevMethod,
        to: method,
        meta: {
          changedBy: auth.currentUser?.email || "Admin",
        },
      });

      toast.success("Método actualizado");

    } catch (err) {
      console.error(err);
      toast.error("Error método");
    }
  }, [ordersMap]);


  const deleteOrder = useCallback(async (orderId) => {
    const ok = confirm("¿Eliminar este pedido?")

    if (!ok) return;

    try {
      await deleteDoc(doc(db, "orders", orderId));

      await logOrderEvent({
        orderId,
        type: "ORDER_DELETED",
        meta: {
          changedBy: auth.currentUser?.email || "Admin"
        }

      });

      toast.success("Pedido eliminado");

    } catch (err) {
      console.error(err);
      toast.error("Error eliminar");
    }
  }, []);

  const archiveOrder = useCallback(async (order) => {
    try {
      if (!order) return;

      await archiveOrderWithStock(order);

      await logOrderEvent({
        orderId: order.id,
        type: "ORDER_ARCHIVED",
        meta: {
          changedBy: auth.currentUser?.email || "Admin",
        },
      });

      toast.success("Pedido archivado 🍦");

    } catch (err) {
      console.error("Archive error:", err);
      toast.error("Error al archivar");
    }
  }, []);

  const sendWhatsAppMessage = async (phone, message, orderId) => {
    if (!phone || !message || !orderId) return;

    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const encodedMessage = encodeURIComponent(message);

      window.open(
        `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
        "_blank"
      );

      // ✅ LOG EVENTO WHATSAPP
      await logOrderEvent({
        orderId,
        type: "WHATSAPP_SENT",

        meta: {
          changedBy: auth.currentUser?.email || "Admin",
        },
      });

    } catch (err) {
      console.error("WhatsApp log error:", err);
    }
  };


  const buildShippingMessage = (order, shippingValue, getGustoName) => {
    const productsTotal = order.total ?? 0;
    const finalTotal = productsTotal + shippingValue;

    const itemsText = order.items
      ?.map((item) => {
        const gustosText = item.gustos?.length
          ? ` (${item.gustos
            .map((id) => getGustoName(id))
            .join(", ")})`
          : "";

        return `• ${item.title} x${item.quantity}${gustosText}`;
      })
      .join("\n");

    return `
  ¡Tu pedido está casi listo!

  🚚 El costo de envío hasta tu dirección es de $${shippingValue}.

  🧾 Resumen del pedido:

  ${itemsText || "• Sin productos"}

  • Productos: $${productsTotal}
  • Envío: $${shippingValue}

  • TOTAL con envío: $*${finalTotal}*

  ¿Confirmás el pedido para enviarlo? ✨
    `.trim();
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.archived) return false;

      if (filter === "all") return true;

      return o.status === filter;
    });
  }, [orders, filter]);

  const buildInTransitMessage = (order) => {
    const name = order.customer?.name || "Hola";
    const productsTotal = order.total ?? 0;
    const shipping = order.shipping?.final ?? 0;
    const finalTotal = productsTotal + shipping;

    return `
  Tu pedido ya está en camino ✨

  ¡Gracias ${name} por elegir Helados Doncru! 🍦 🙌

  🧾 Resumen:

  • Productos: $${productsTotal}
  • Envío: $${shipping}

  • TOTAL: $${finalTotal}

  ¡Que lo disfrutes! 😄
    `.trim();
  };

  if (loading) {
    return (

      <div className="admin-orders__loading">
        <span className="spinner" />
        Cargando pedidos...
      </div>
    );
  }

  return (
    <main className="admin-orders">
      <audio ref={audioRef} src="/sounds/new-order.wav" preload="auto" />

      {/* HEADER */}

      <header className="admin-orders__header">
        <h2>Pedidos</h2>
        <button
          className="btn btn--primary"
          onClick={() => setOpenLocalOrder(true)}
        >
          ➕ Pedido en local
        </button>


        {newOrders > 0 && (
          <span className="new-badge">
            <strong>🔔 {newOrders} nuevos</strong>
          </span>
        )}

        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setNewOrders(0);
          }}
        >
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="in_transit">En camino</option>
          <option value="completed">Completados</option>
          <option value="cost_send">Costo enviado</option>
          <option value="cancelled">Cancelados</option>
        </select>

        {fetchError && (
          <small style={{ color: "crimson" }}>
            {fetchError}
          </small>
        )}
      </header>

      {/* LIST */}

      <section className="admin-orders__list">
        {filteredOrders.map((order) => (
          <article key={order.id} className="order-card">

            {/* HEADER */}

            <header className="order-card__header">
              <strong>#{order.id.slice(0, 6)}</strong>

              <span
                className={`order-status order-status--${order.status}`}
              >
                {STATUS_LABELS[order.status]}
              </span>
            </header>

            {/* INFO */}

            <section className="order-card__info">

              <p><b>Cliente:</b> {order.customer?.name}</p>
              <p><b>Dirección:</b> {order.customer?.direction}</p>
              <p><b>Teléfono:</b> {order.customer?.phone}</p>
              <p><b>Total:</b> ${order.total}</p>

              {order.payment?.paidBy && (
                <small className="order-branch">
                  🏪 Pedido tomado por:{" "}
                  <strong>
                    {getBranchByEmail(order.payment.paidBy)}
                  </strong>
                </small>
              )}


              {/* MÉTODO */}

              <p>
                <b>Pago:</b>{" "}
                <select
                  value={order.payment?.method || "efectivo"}
                  onChange={(e) =>
                    updatePaymentMethod(
                      order.id,
                      e.target.value
                    )
                  }
                  className="payment-method-select"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">💳 Transferencia</option>
                </select>
              </p>

              {/* ESTADO */}

              <p>
                <b>Estado pagó:</b>{" "}
                {order.payment?.status === "paid" ? (
                  <span className="payment-paid">
                    ✅ Pagado{" "}
                    {order.payment?.paidAt &&
                      `(${order.payment.paidAt
                        .toDate()
                        .toLocaleString()})`}
                  </span>
                ) : (
                  <span className="payment-pending">
                    ⏳ Pendiente
                  </span>
                )}
              </p>

              {/* ENVÍO */}
              <p className="order-shipping">
                <b>Envío:</b>{" "}
                {order.deliveryType === "pickup" ? (
                  <span className="shipping-pickup">
                    🏪 Retira en local
                  </span>
                ) : hasShippingFinal(order) ? (
                  <span className="shipping-sent">
                    💸 ${order.shipping.final}
                  </span>
                ) : (
                  <span className="shipping-pending">
                    ⏳ Pendiente
                  </span>
                )}
              </p>


              {/* COMENTARIOS */}

              {order.comments?.trim() && (
                <p>
                  <b>Comentarios:</b> {order.comments}
                </p>
              )}

            </section>

            {/* ITEMS */}

            <ul className="order-card__items">
              {order.items?.map((item, i) => (
                <li key={i}>
                  {item.title} x{item.quantity}

                  {item.gustos?.length > 0 && (
                    <div>
                      🍦{" "}
                      {item.gustos
                        .map(getGustoName)
                        .join(", ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* ACTIONS */}

            <footer className="order-card__actions">

              <div className="shipping-select-wrapper">

                <select className="shipping-select"
                  value={shippingDraft[order.id] ?? ""}
                  onChange={(e) =>
                    setShippingDraft((p) => ({
                      ...p,
                      [order.id]: Number(e.target.value),
                    }))
                  }
                >
                  <option value="" disabled>
                    Costo envío
                  </option>

                  {[2000, 2500, 3000, 4000, 4500, 5000].map(v => (
                    <option key={v} value={v}>
                      ${v}
                    </option>
                  ))}
                </select>

                <input
                  className="shipping-input"
                  type="number"
                  min="0"
                  placeholder="Otro"
                  value={
                    shippingDraft[order.id] ??
                    order.shipping?.final?.toString() ??
                    ""
                  }
                  onChange={(e) =>
                    setShippingDraft((p) => ({
                      ...p,
                      [order.id]: e.target.value, // 👈 STRING
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
                className="btn btn--pickup"
                onClick={() => markAsPickup(order)}
              >
                🏪 Retira en local.
              </button>


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
                En camino
              </button>

              {order.payment?.status !== "paid" && (
                <button
                  className="btn btn--success"
                  onClick={() => markAsPaid(order.id)}
                >
                  💰 Pagado
                </button>
              )}

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
                Completar
              </button>

              {order.status === "completed" && (
                <button
                  className="btn btn--archive"
                  onClick={() => archiveOrder(order)}
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

              <small className="order-date">
                🕒{" "}
                {order.createdAt
                  ?.toDate()
                  .toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
              </small>


            </footer>

            <aside>
              <OrderHistory
                events={orderEvents[order.id] || []}
              />
            </aside>

          </article>
        ))}
      </section>
      <ModalLocalOrder
        open={openLocalOrder}
        onClose={() => setOpenLocalOrder(false)}
      />

    </main>
  );
};

export default AdminOrders;
