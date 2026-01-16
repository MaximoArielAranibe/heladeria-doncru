import { useState } from "react";
import "../../styles/OrderHistory.scss";

const EVENT_LABELS = {
  ORDER_CREATED: "Pedido creado",
  STATUS_CHANGED: "Estado actualizado",
  WHATSAPP_SENT: "WhatsApp enviado",
  ORDER_CANCELLED: "Pedido cancelado",
  ORDER_DELETED: "Pedido eliminado",
};

const STATUS_LABELS = {
  pending: "Pendiente",
  in_transit: "En camino",
  completed: "Completado",
  cancelled: "Cancelado",
};


const OrderHistory = ({ events = [] }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="order-history">
      <button
        type="button"
        className="order-history__toggle"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Ocultar historial" : "Ver historial"}
      </button>

      {open && (
        <ul className="order-history__timeline">
          {events.length === 0 ? (
            <li className="order-history__empty">
              No hay eventos registrados
            </li>
          ) : (
            events.map((e) => (
              <li key={e.id} className="order-history__item">
                <span className="order-history__dot" />

                <div className="order-history__content">
                  <strong>
                    {EVENT_LABELS[e.type] || e.type}
                  </strong>

                  {e.from && e.to && (
                    <span className="order-history__change">
                      {STATUS_LABELS[e.from] || e.from} →{" "}
                      {STATUS_LABELS[e.to] || e.to}
                    </span>
                  )}


                  <time>
                    {e.timestamp?.toDate().toLocaleString()}
                  </time>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default OrderHistory;
