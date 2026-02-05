import "../../styles/AdminOrders.scss";
import { useState, useCallback, useEffect, useMemo } from "react";
import { getArchivedOrders } from "../../services/orders.service";
import { useGustos } from "../../hooks/useGustos";
import OrderHistory from "./OrderHistory";
import { useOrderEvents } from "../../hooks/useOrderEvents";


const PAGE_SIZE = 10;

const BRANCH_BY_EMAIL = {
  "heladosdoncru@gmail.com": "Almafuerte",
  "nicolabrandon89@gmail.com": "Gral Paz",
  "darknesswong@gmail.com": "Maximo programador",

};

const getBranchName = (email) => {
  if (!email) return "—";

  return BRANCH_BY_EMAIL[email] || email;
};


const AdminArchivedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [isReloading, setIsReloading] = useState(false);


  const { gustos: allGustos } = useGustos();
  const orderEvents = useOrderEvents();


  /* =====================
     FILTRO FECHA
  ===================== */

  const [dateFilter, setDateFilter] = useState(null);
  const [dateDraft, setDateDraft] = useState("");

  /* =====================
     GUSTOS MAP
  ===================== */

  const gustosMap = useMemo(() => {
    return new Map(allGustos.map((g) => [g.id, g.name]));
  }, [allGustos]);

  const getGustoName = (id) =>
    gustosMap.get(id) || "—";

  /* =====================
     FETCH
  ===================== */

  const fetchOrders = useCallback(
    async ({ reset = false } = {}) => {

      try {
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

      } catch (err) {
        console.error("fetchOrders error:", err);

      } finally {
        setLoading(false);
        setIsReloading(false);
      }

    },
    [dateFilter, lastDoc]
  );


  /* =====================
     FETCH INICIAL
  ===================== */

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      await fetchOrders({ reset: true });
    };

    init();

    return () => {
      mounted = false;
    };
  }, [fetchOrders]);


  /* =====================
     FILTRO
  ===================== */
  const applyFilter = () => {
    setIsReloading(true);

    setLastDoc(null);
    setHasFetched(false);

    setDateFilter(dateDraft || null);

    fetchOrders({ reset: true });
  };



  /* =====================
     HELPERS
  ===================== */

  const formatDate = (ts) => {
    if (!ts?.toDate) return "—";

    return ts.toDate().toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  /* =====================
     RENDER
  ===================== */

  return (
    <section className="admin-archived-orders">

      <h2>Pedidos archivados</h2>

      {/* =====================
          FILTRO
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
          LOADING
      ===================== */}

      {/* LOADING */}

      {(loading || isReloading) && (
        <p className="admin-orders__loading">
          <span className="spinner" />
          Cargando pedidos archivados…
        </p>
      )}


      {/* =====================
          EMPTY
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

      {orders.map((order) => {
        const productsTotal = order.total ?? 0;
        const shipping = order.shipping?.final ?? 0;
        const finalTotal = productsTotal + shipping;

        return (
          <div className="order-archived-container">

            <article key={order.id} className="order-card archived">

              {/* HEADER */}

              <header className="order-card__header">

                <strong>#{order.id.slice(0, 6)}</strong>

                <span className="archived-badge">
                  Archivado
                </span>

              </header>

              {/* INFO */}

              <section className="order-card__info">

                <p>
                  <b>Cliente:</b> {order.customer?.name || "—"}
                </p>

                <p>
                  <b>Dirección:</b> {order.customer?.direction || "—"}
                </p>

                <p>
                  <b>Teléfono:</b> {order.customer?.phone || "—"}
                </p>

                <p>
                  <b>Fecha:</b> {formatDate(order.createdAt)}
                </p>

                <p>
                  <b>Pago:</b>{" "}
                  {order.payment?.method || "—"}
                </p>

                {order.payment?.paidBy && (
                  <small>
                    Pedido tomado por: <strong>{getBranchName(order.payment.paidBy)}</strong>
                  </small>
                )}


                <p>
                  <b>Envío:</b>{" "}
                  {shipping
                    ? `$${shipping}`
                    : "Pendiente"}
                </p>

                <p>
                  <b>Productos:</b> ${productsTotal}
                </p>

                <p>
                  <b>Total final:</b> ${finalTotal}
                </p>

                <p>
                  <b>Estado pago:</b>{" "}
                  {order.payment?.status === "paid"
                    ? "✅ Pagado"
                    : "⏳ Pendiente"}
                </p>

                {order.comments?.trim() && (
                  <p>
                    <b>Comentarios:</b> {order.comments}
                  </p>
                )}

              </section>

              {/* ITEMS */}

              <ul className="order-card__items">

                {order.items?.map((item, idx) => {

                  const gustosText = item.gustos?.length
                    ? ` (${item.gustos
                      .map(getGustoName)
                      .join(", ")})`
                    : "";

                  return (
                    <li key={idx}>
                      {item.title} x{item.quantity}
                      {gustosText}
                    </li>
                  );
                })}

              </ul>
              <aside>
                <OrderHistory
                  events={orderEvents[order.id] || []}
                />
              </aside>

            </article>
          </div>

        );
      })}

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
