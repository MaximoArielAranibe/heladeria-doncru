import { useEffect, useState, useMemo } from "react";
import { getMetrics, getDaysOfMonth } from "../../services/metrics.service";
import "../../styles/AdminDashboard.scss";

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [showDailySales, setShowDailySales] = useState(false);
  const [hideEmptyDays, setHideEmptyDays] = useState(false);

  useEffect(() => {
    getMetrics().then(setMetrics);
  }, []);

  const salesByDayComplete = useMemo(() => {
    if (!metrics) return [];

    const today = new Date();
    const daysOfMonth = getDaysOfMonth(
      today.getFullYear(),
      today.getMonth()
    );

    const days = daysOfMonth.map((day) => ({
      day,
      total: metrics.salesByDay[day] || 0,
    }));

    if (hideEmptyDays) {
      return days.filter((d) => d.total > 0);
    }

    return days;
  }, [metrics, hideEmptyDays]);

  if (!metrics) return <p>Cargando métricas...</p>;

  return (
    <section className="admin-dashboard">
      <h2>Dashboard</h2>

      {/* =====================
          MÉTRICAS
      ===================== */}
      <div className="dashboard-grid">
        <div className="metric-card">
          <span>Ventas totales</span>
          <strong>${metrics.totalRevenue}</strong>
        </div>

        <div className="metric-card">
          <span>Pedidos</span>
          <strong>{metrics.totalOrders}</strong>
        </div>
      </div>

      {/* =====================
          BOTONES
      ===================== */}
      <div className="dashboard-actions">
        <button
          className="toggle-sales-btn"
          onClick={() => setShowDailySales((prev) => !prev)}
        >
          {showDailySales
            ? "Ocultar ventas por día"
            : "Ver ventas por día"}
        </button>

        {showDailySales && (
          <button
            className="toggle-sales-btn secondary"
            onClick={() => setHideEmptyDays((prev) => !prev)}
          >
            {hideEmptyDays
              ? "Mostrar días sin ventas"
              : "Ocultar días sin ventas"}
          </button>
        )}
      </div>

      {/* =====================
          VENTAS POR DÍA
      ===================== */}
      {showDailySales && (
        <>
          <h3>Ventas del mes</h3>

          <ul className="sales-by-day">
            {salesByDayComplete.map(({ day, total }) => (
              <li
                key={day}
                className={total > 0 ? "has-sales" : ""}
              >
                <span>{day}</span>
                <strong>${total}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
};

export default AdminDashboard;
