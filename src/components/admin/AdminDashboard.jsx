import { useEffect, useState, useMemo } from "react";
import { getMetrics, getDaysOfMonth } from "../../services/metrics.service";
import SalesBarChart from "./SalesBarChart";
import "../../styles/AdminDashboard.scss";
import AdminArchivedOrders from "./AdminArchiviedOrders";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_DASHBOARD_PASSWORD;

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [showDailySales, setShowDailySales] = useState(false);
  const [hideEmptyDays, setHideEmptyDays] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // 🔐 control de ventas totales
  const [canSeeTotalRevenue, setCanSeeTotalRevenue] = useState(false);

  /* =====================
     FETCH METRICS
  ===================== */
  useEffect(() => {
    getMetrics().then(setMetrics);
  }, []);

  /* =====================
     SALES BY DAY (MES)
  ===================== */
  const salesByDayComplete = useMemo(() => {
    if (!metrics) return [];

    const today = new Date();
    const daysOfMonth = getDaysOfMonth(
      today.getFullYear(),
      today.getMonth()
    );

    return daysOfMonth.map((day) => ({
      day,
      total: metrics.salesByDay[day] || 0,
    }));
  }, [metrics]);

  /* =====================
     TODAY SALES
  ===================== */
  const todaySales = useMemo(() => {
    if (!metrics) return 0;

    const todayKey = new Date()
      .toISOString()
      .slice(0, 10);

    return metrics.salesByDay[todayKey] || 0;
  }, [metrics]);

  /* =====================
     PASSWORD HANDLER
  ===================== */
  const requestPassword = () => {
    const input = prompt("Ingresá la contraseña para ver las ventas totales");

    if (input === ADMIN_PASSWORD) {
      setCanSeeTotalRevenue(true);
    } else {
      alert("Contraseña incorrecta");
    }
  };

  if (!metrics) return <p>Cargando métricas...</p>;

  return (
    <section className="admin-dashboard">
      <h2>Dashboard</h2>

      {/* =====================
          MÉTRICAS
      ===================== */}
      <div className="dashboard-grid">
        {/* 🔐 VENTAS TOTALES PROTEGIDAS */}
        <div
          className="metric-card"
          style={{ cursor: "pointer" }}
          onClick={!canSeeTotalRevenue ? requestPassword : undefined}
        >
          <span>Ventas totales</span>
          <strong>
            {canSeeTotalRevenue ? (
              `$${metrics.totalRevenue}`
            ) : (
              "••••••"
            )}
          </strong>
          {!canSeeTotalRevenue && (
            <small>Tocar para desbloquear</small>
          )}
        </div>

        <div className="metric-card highlight">
          <span>Ventas de hoy</span>
          <strong>${todaySales}</strong>
        </div>

        <div className="metric-card">
          <span>Pedidos</span>
          <strong>{metrics.totalOrders}</strong>
        </div>

        <div
          className="metric-card muted"
          style={{ cursor: "pointer" }}
          onClick={() => setShowArchived((prev) => !prev)}
        >
          <span>Pedidos archivados</span>
          <strong>{metrics.archivedCount}</strong>
          <small>
            {showArchived ? "Ocultar" : "Ver detalle"}
          </small>
        </div>
      </div>

      {/* =====================
          ARCHIVADOS
      ===================== */}
      {showArchived && <AdminArchivedOrders />}

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

          {!hideEmptyDays && (
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
          )}

          <SalesBarChart data={salesByDayComplete} />
        </>
      )}
    </section>
  );
};

export default AdminDashboard;
