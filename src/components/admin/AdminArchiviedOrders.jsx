import "../../styles/AdminOrders.scss";
import { useState, useCallback, useRef } from "react";
import { getArchivedOrders } from "../../services/orders.service";

const PAGE_SIZE = 10;

const AdminArchivedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState("");
  const [dateFilterDraft, setDateFilterDraft] = useState("");

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const hasInitialized = useRef(false);
  const isFetching = useRef(false);

  const fetchOrders = useCallback(
    async ({ reset = false, date = dateFilter } = {}) => {
      if (isFetching.current) return;

      isFetching.current = true;
      setLoading(true);

      const res = await getArchivedOrders({
        pageSize: PAGE_SIZE,
        lastDoc: reset ? null : lastDoc,
        date: date || null,
      });

      setOrders((prev) =>
        reset ? res.orders : [...prev, ...res.orders]
      );

      setLastDoc(res.lastDoc);
      setHasLoadedOnce(true);
      setLoading(false);
      isFetching.current = false;
    },
    [dateFilter, lastDoc]
  );

  // ✅ EJECUCIÓN INICIAL (SIN useEffect)
  if (!hasInitialized.current) {
    hasInitialized.current = true;
    fetchOrders({ reset: true });
  }

  const applyDateFilter = () => {
    setOrders([]);
    setLastDoc(null);
    setHasLoadedOnce(false);
    setDateFilter(dateFilterDraft);
    fetchOrders({ reset: true, date: dateFilterDraft });
  };

  return (
    <section className="admin-archived-orders">
      <h2>Pedidos archivados</h2>

      <div className="archived-filters">
        <input
          type="date"
          value={dateFilterDraft}
          onChange={(e) => setDateFilterDraft(e.target.value)}
        />

        <button
          className="btn btn--secondary"
          onClick={applyDateFilter}
          disabled={loading}
        >
          Aplicar filtro
        </button>
      </div>

      <p
        className={`archived-empty ${
          hasLoadedOnce && !loading && orders.length === 0
            ? "visible"
            : ""
        }`}
      >
        No hay pedidos archivados
      </p>

      {orders.map((order) => (
        <article key={order.id} className="order-card archived">
          <header className="order-card__header">
            <strong>Pedido #{order.id.slice(0, 6)}</strong>
            <span className="archived-badge">Archivado</span>
          </header>

          <section className="order-card__info">
            <p>
              <strong>Comprador:</strong>{" "}
              {order.customer?.name || "Cliente sin nombre"}
            </p>

            {order.customer?.phone && <p>📞 {order.customer.phone}</p>}

            <p>
              <strong>Total:</strong> ${order.total}
            </p>

            <p>
              <strong>Fecha:</strong>{" "}
              {order.createdAt?.toDate?.().toLocaleString() || "—"}
            </p>
          </section>

          <ul className="order-card__items">
            {order.items?.map((item, idx) => (
              <li key={idx}>
                {item.title} x{item.quantity}
              </li>
            ))}
          </ul>
        </article>
      ))}

      {lastDoc && (
        <button
          className="btn btn--secondary"
          disabled={loading}
          onClick={() => fetchOrders()}
        >
          {loading ? "Cargando..." : "Cargar más"}
        </button>
      )}
    </section>
  );
};

export default AdminArchivedOrders;
