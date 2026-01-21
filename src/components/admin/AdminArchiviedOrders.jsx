import { useEffect, useState } from "react";
import { getArchivedOrders } from "../../services/orders.service";

const AdminArchivedOrders = () => {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    getArchivedOrders().then(setOrders);
  }, []);

  if (!orders) return <p>Cargando pedidos archivados...</p>;
  if (!orders.length) return <p>No hay pedidos archivados</p>;

  return (
    <section>
      <h2>Pedidos archivados</h2>

      {orders.map((order) => (
        <article key={order.id} style={{ opacity: 0.7 }}>
          <strong>Pedido #{order.id.slice(0, 6)}</strong>
          <p>Total: ${order.total}</p>
          <p>Estado: {order.status}</p>
          <p>
            Fecha:{" "}
            {order.createdAt?.toDate?.().toLocaleString() ||
              "—"}
          </p>
        </article>
      ))}
    </section>
  );
};

export default AdminArchivedOrders;
