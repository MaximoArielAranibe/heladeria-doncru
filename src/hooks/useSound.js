import { useEffect, useState, useRef } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useSound } from "../hooks/useSound";

/* =====================
   CONSTANTES
===================== */

const STATUS_COLORS = {
  pending: "#facc15",
  paid: "#22c55e",
  cancelled: "#ef4444",
};

/* =====================
   NOTIFICACIONES
===================== */

const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

const showNewOrderNotification = (order) => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification("🛎️ Nuevo pedido", {
    body: `Pedido de ${order.customer?.name || "Cliente"} · $${order.total}`,
    icon: "/vite.svg",
  });
};

/* =====================
   COMPONENT
===================== */

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const prevOrdersCountRef = useRef(0);

  // 🔊 Hook de sonido (CORRECTO)
  const sound = useSound("/sounds/new-order.wav");

  /* =====================
     INIT
  ===================== */

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  /* =====================
     FIRESTORE LISTENER
  ===================== */

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 🔔 + 🔊 pedido nuevo
      if (
        prevOrdersCountRef.current > 0 &&
        data.length > prevOrdersCountRef.current
      ) {
        showNewOrderNotification(data[0]);
        sound.play();
      }

      prevOrdersCountRef.current = data.length;
      setOrders(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* =====================
     ACTIONS
  ===================== */

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status });
  };

  const openWhatsApp = (order) => {
    const phone = order.customer?.phone;
    if (!phone) return;

    const items = order.items
      .map(
        (i) =>
          `• ${i.title} x${i.quantity}${
            i.gustos?.length ? ` (${i.gustos.join(", ")})` : ""
          }`
      )
      .join("\n");

    const message = `
Hola 👋
Tu pedido es:

${items}

Total: $${order.total}
Estado: ${order.status}
    `.trim();

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  /* =====================
     RENDER
  ===================== */

  if (loading) return <p>Cargando pedidos...</p>;
  if (!orders.length) return <p>No hay pedidos aún</p>;

  return (
    <section className="admin-orders">
      <header style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <h2>Pedidos</h2>

        {!sound.enabled ? (
          <button onClick={sound.unlock}>
            🔔 Activar sonido
          </button>
        ) : (
          <span>🔊 Sonido activado</span>
        )}
      </header>

      {orders.map((order) => (
        <article
          key={order.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <header style={{ marginBottom: 8 }}>
            <strong>Pedido #{order.id.slice(0, 6)}</strong>
            <span
              style={{
                marginLeft: 12,
                padding: "4px 10px",
                borderRadius: 999,
                background: STATUS_COLORS[order.status],
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {order.status}
            </span>
          </header>

          <p>
            <strong>Total:</strong> ${order.total}
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => updateStatus(order.id, "paid")}>
              Marcar pagado
            </button>
            <button onClick={() => updateStatus(order.id, "cancelled")}>
              Cancelar
            </button>
            {order.customer?.phone && (
              <button onClick={() => openWhatsApp(order)}>
                WhatsApp
              </button>
            )}
          </div>
        </article>
      ))}
    </section>
  );
};

export default AdminOrders;
