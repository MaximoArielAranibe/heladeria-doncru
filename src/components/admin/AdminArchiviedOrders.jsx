import "../../styles/AdminOrders.scss";
import { useEffect, useState, useCallback } from "react";
import { getArchivedOrders } from "../../services/orders.service";

const PAGE_SIZE = 10;

const AdminArchivedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState("");
  const [dateDraft, setDateDraft] = useState("");

  const [hasFetched, setHasFetched] = useState(false);

  const fetchOrders = useCallback(
    async ({ reset = false } = {}) => {
      if (loading) return;

      setLoading(true);

      const res = await getArchivedOrders({
        pageSize: PAGE_SIZE,
        lastDoc: reset ? null : lastDoc,
        date: dateFilter || null,
      });

      setOrders((prev) =>
        reset ? res.orders : [...prev, ...res.orders]
      );

      setLastDoc(res.lastDoc);
      setHasFetched(true);
      setLoading(false);
    },
    [dateFilter, lastDoc, loading]
  );

  useEffect(() => {
    fetchOrders({ reset: true });
  }, [fetchOrders]);

  return (
    <section className="admin-archived-orders">
      <h2>Pedidos archivados</h2>

      {/* FILTRO */}
      <div className="archived-filters">
        <input
          type="date"
          value={dateDraft}
          onChange={(e) => setDateDraft(e.target.value)}
        />

        <button
          className="btn btn--secondary"
          onClick={() => setDateFilter(dateDraft)}
        >
          Aplicar filtro
        </button>
      </div>

      {/* EMPTY STATE ESTABLE */}
      <p
        className={`archived-empty ${hasFetched && !loading && orders.length === 0
            ? "visible"
            : ""
          }`}
      >
        {dateFilter
          ? "No hay pedidos archivados en este día"
          : "No hay pedidos archivados"}
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
              {order.customer?.name || "Sin nombre"}
            </p>
            <p><strong>Total:</strong> ${order.total}</p>
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
