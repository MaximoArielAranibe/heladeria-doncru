import "../../styles/AdminOrders.scss";
import { useState, useCallback, useEffect } from "react";
import { getArchivedOrders } from "../../services/orders.service";

const PAGE_SIZE = 10;

const AdminArchivedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  // null = sin filtro (ver todos)
  const [dateFilter, setDateFilter] = useState(null);

  // buffer del input
  const [dateDraft, setDateDraft] = useState("");

  const [hasFetched, setHasFetched] = useState(false);

  const fetchOrders = useCallback(
    async ({ reset = false } = {}) => {
      if (loading) return;

      setLoading(true);

      const res = await getArchivedOrders({
        pageSize: PAGE_SIZE,
        lastDoc: reset ? null : lastDoc,
        date: dateFilter,
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

  // ✅ FETCH INICIAL (una sola vez)
  useEffect(() => {
    fetchOrders({ reset: true });
  }, []); // 👈 intencionalmente vacío

  const applyFilter = () => {
    setOrders([]);
    setLastDoc(null);
    setHasFetched(false);

    setDateFilter(dateDraft || null);

    fetchOrders({ reset: true });
  };

  return (
    <section className="admin-archived-orders">
      <h2>Pedidos archivados</h2>

      {/* =====================
          FILTRO MANUAL
      ===================== */}
      <div className="archived-filters">
        <input
          type="date"
          value={dateDraft}
          onChange={(e) => setDateDraft(e.target.value)}
        />

        <button
          className="btn btn--secondary"
          disabled={loading}
          onClick={applyFilter}
        >
          Aplicar filtro
        </button>
      </div>

      {/* =====================
          LOADING REAL
      ===================== */}
      {loading && (
        <p className="admin-orders__loading">
          Cargando pedidos archivados…
        </p>
      )}

      {/* =====================
          EMPTY STATE REAL
      ===================== */}
      {!loading && hasFetched && orders.length === 0 && (
        <p className="archived-empty visible">
          {dateFilter
            ? "No hay pedidos archivados en este día"
            : "No hay pedidos archivados"}
        </p>
      )}

      {/* =====================
          LISTA
      ===================== */}
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

      {/* =====================
          PAGINACIÓN
      ===================== */}
      {!loading && orders.length >= PAGE_SIZE && lastDoc && (
        <button
          className="btn btn--secondary"
          onClick={() => fetchOrders()}
        >
          Cargar más
        </button>
      )}
    </section>
  );
};

export default AdminArchivedOrders;
