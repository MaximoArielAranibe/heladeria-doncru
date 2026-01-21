import { useEffect, useState, useMemo } from "react";
import { getMetrics, getDaysOfMonth } from "../../services/metrics.service";
import SalesBarChart from "./SalesBarChart";
import "../../styles/AdminDashboard.scss";
import AdminArchivedOrders from "./AdminArchiviedOrders";
import { useUserRole } from "../../hooks/useUserRole";

const ADMIN_PASSWORD =
  import.meta.env.VITE_ADMIN_DASHBOARD_PASSWORD;

const AdminDashboard = () => {
  const { role, loading: roleLoading } = useUserRole();

  const [metrics, setMetrics] = useState(null);

  const [showDailySales, setShowDailySales] = useState(false);
  const [hideEmptyDays, setHideEmptyDays] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [canSeeRevenue, setCanSeeRevenue] = useState(false);

  /* =====================
     FETCH METRICS
  ===================== */
  useEffect(() => {
    getMetrics().then(setMetrics);
  }, []);

  /* =====================
     SALES BY DAY (MONTH)
  ===================== */
  const salesByDayComplete = useMemo(() => {
    if (!metrics) return [];

    const today = new Date();
    const days = getDaysOfMonth(
      today.getFullYear(),
      today.getMonth()
    );

    return days.map((day) => ({
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
    const input = prompt("Ingresá la contraseña");

    if (input === ADMIN_PASSWORD) {
      setCanSeeRevenue(true);
    } else if (input !== null) {
      alert("Contraseña incorrecta");
    }
  };

  if (!metrics || roleLoading) {
    return <p>Cargando dashboard…</p>;
  }

  const isAdmin = role === "admin";

  return (
    <section className="admin-dashboard">
      <h2>Dashboard</h2>

      {/* =====================
          MÉTRICAS
      ===================== */}
      <div className="dashboard-grid">
        {/* 🔐 SOLO ADMIN */}
        {isAdmin && (
          <div
            className="metric-card"
            style={{ cursor: "pointer" }}
            onClick={
              !canSeeRevenue ? requestPassword : undefined
            }
          >
            <span>Ventas totales</span>
            <strong>
              {canSeeRevenue
                ? `$${metrics.totalRevenue}`
                : "••••••"}
            </strong>
            {!canSeeRevenue && (
              <small>Tocar para desbloquear</small>
            )}
          </div>
        )}

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
          onClick={() => setShowArchived((v) => !v)}
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
          ACCIONES
      ===================== */}
      <div className="dashboard-actions">
        {isAdmin && (
          <button
            className="toggle-sales-btn"
            onClick={() => {
              if (!canSeeRevenue) {
                requestPassword();
                return;
              }
              setShowDailySales((v) => !v);
            }}
          >
            {showDailySales
              ? "Ocultar ventas por día"
              : "Ver ventas por día"}
          </button>
        )}

        {isAdmin && showDailySales && canSeeRevenue && (
          <button
            className="toggle-sales-btn secondary"
            onClick={() =>
              setHideEmptyDays((v) => !v)
            }
          >
            {hideEmptyDays
              ? "Mostrar ventas"
              : "Ocultar dias"}
          </button>
        )}
      </div>

      {/* =====================
          VENTAS POR DÍA
      ===================== */}
      {isAdmin && showDailySales && canSeeRevenue && (
        <>
          <h3>Ventas del mes</h3>

          {!hideEmptyDays && (
            <ul className="sales-by-day">
              {salesByDayComplete.map(
                ({ day, total }) => (
                  <li
                    key={day}
                    className={
                      total > 0 ? "has-sales" : ""
                    }
                  >
                    <span>{day}</span>
                    <strong>${total}</strong>
                  </li>
                )
              )}
            </ul>
          )}

          <SalesBarChart data={salesByDayComplete} />
        </>
      )}
    </section>
  );
};

export default AdminDashboard;
