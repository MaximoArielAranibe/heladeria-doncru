import { useState } from "react";
import "../../styles/OrderHistory.scss";

/* =====================
   EVENT LABELS
===================== */

const EVENT_LABELS = {
  ORDER_CREATED: "Pedido creado",
  STATUS_CHANGED: "Estado actualizado",
  WHATSAPP_SENT: "WhatsApp enviado",
  ORDER_CANCELLED: "Pedido cancelado",
  ORDER_DELETED: "Pedido eliminado",
  ORDER_ARCHIVED: "Pedido archivado",

  SHIPPING_ADJUSTED: "Costo de envío enviado",

  PAYMENT_CONFIRMED: "Pago confirmado",
  PAYMENT_METHOD_CHANGED: "Método de pago cambiado",
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

/* =====================
   EVENT COLORS
===================== */

const EVENT_COLORS = {
  ORDER_CREATED: "blue",
  STATUS_CHANGED: "purple",
  WHATSAPP_SENT: "green",
  ORDER_ARCHIVED: "gray",
  ORDER_DELETED: "red",

  SHIPPING_ADJUSTED: "cyan",

  PAYMENT_CONFIRMED: "green",
  PAYMENT_METHOD_CHANGED: "orange",
};

/* =====================
   COMPONENT
===================== */

const OrderHistory = ({ events = [] }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="order-history">

      {/* TOGGLE */}

      <button
        type="button"
        className="order-history__toggle"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Ocultar historial" : "Ver historial"}
      </button>

      {/* TIMELINE */}

      {open && (

        <ul className="order-history__timeline">

          {events.length === 0 ? (

            <li className="order-history__empty">
              No hay eventos registrados
            </li>

          ) : (

            events.map((e) => {

              const color =
                EVENT_COLORS[e.type] || "default";

              return (
                <li
                  key={e.id}
                  className={`order-history__item ${color}`}
                >

                  {/* DOT */}

                  <span className="order-history__dot" />

                  {/* CONTENT */}

                  <div className="order-history__content">

                    {/* TITLE */}

                    <strong>
                      {EVENT_LABELS[e.type] || e.type}
                    </strong>

                    {/* WHO */}

                    {e.meta?.changedBy && (
                      <small className="order-history__meta">
                        👤 {e.meta.changedBy}
                      </small>
                    )}

                    {/* STATUS CHANGE */}

                    {e.from && e.to && (
                      <span className="order-history__change">
                        {STATUS_LABELS[e.from] || e.from}
                        {" → "}
                        {STATUS_LABELS[e.to] || e.to}
                      </span>
                    )}

                    {/* EXTRA DATA (AMOUNT, ETC) */}

                    {typeof e.meta?.to === "number" && (
                      <span className="order-history__meta">
                        💰 ${e.meta.to}
                      </span>
                    )}

                    {typeof e.meta?.amount === "number" && (
                      <span className="order-history__meta">
                        💵 ${e.meta.amount}
                      </span>
                    )}

                    {/* DATE */}

                    <time>
                      {e.timestamp
                        ?.toDate?.()
                        .toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }) || "—"}
                    </time>

                  </div>

                </li>
              );
            })

          )}

        </ul>

      )}

    </div>
  );
};

export default OrderHistory;
