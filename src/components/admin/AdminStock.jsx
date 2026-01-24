import "../../styles/AdminStock.scss";
import { useState, useMemo, useEffect } from "react";
import { useGustos } from "../../hooks/useGustos";
import { updateGusto } from "../../services/gustos.service";
import toast from "react-hot-toast";

/* =====================
   HELPERS
===================== */

const getStockStatus = (weight = 0) => {
  if (weight <= 3000) return "danger";   // 3kg o menos
  if (weight <= 5000) return "warning";  // 5kg o menos
  return "ok";
};

/* =====================
   WHATSAPP
===================== */

const ADMIN_PHONE = "5492477361535"; // 👈 TU NÚMERO

const sendLowStockAlert = (gusto, weight) => {
  const kg = (weight / 1000).toFixed(2);

  const message = `
⚠️ STOCK BAJO ⚠️

Gusto: ${gusto.name}
Stock: ${kg} kg

Reponer urgente 🍦
  `.trim();

  const url = `https://api.whatsapp.com/send?phone=${ADMIN_PHONE}&text=${encodeURIComponent(
    message
  )}`;

  window.open(url, "_blank");
};

/* =====================
   COMPONENT
===================== */

const AdminStock = () => {
  const { gustos, loading } = useGustos();

  /* =====================
     EDIT STATE
  ===================== */
  const [editingId, setEditingId] = useState(null);
  const [localWeight, setLocalWeight] = useState("");
  const [saving, setSaving] = useState(false);

  /* =====================
     FILTER STATE
  ===================== */
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  /* =====================
     ALERTA VISUAL (NO AUTO WHATSAPP)
  ===================== */

  useEffect(() => {
    if (!gustos.length) return;

    gustos.forEach((gusto) => {
      const status = getStockStatus(gusto.weight);

      // 🔴 Toast cuando entra en crítico
      if (status === "danger") {
        toast.error(`⚠️ Stock crítico: ${gusto.name}`, {
          id: `danger-${gusto.id}`, // evita spam
        });
      }

      // 🟡 Toast warning
      if (status === "warning") {
        toast(`🟡 Stock bajo: ${gusto.name}`, {
          id: `warning-${gusto.id}`,
        });
      }
    });
  }, [gustos]);

  /* =====================
     CATEGORIES
  ===================== */
  const categories = useMemo(() => {
    const set = new Set(gustos.map((g) => g.category).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [gustos]);

  /* =====================
     FILTERED DATA
  ===================== */
  const filteredGustos = useMemo(() => {
    return gustos.filter((gusto) => {
      const status = getStockStatus(gusto.weight);

      const matchCategory =
        categoryFilter === "all" ||
        gusto.category === categoryFilter;

      const matchStatus =
        statusFilter === "all" || status === statusFilter;

      const matchSearch =
        gusto.name.toLowerCase().includes(search.toLowerCase());

      return matchCategory && matchStatus && matchSearch;
    });
  }, [gustos, categoryFilter, statusFilter, search]);

  /* =====================
     EDIT HANDLERS
  ===================== */
  const startEdit = (gusto) => {
    setEditingId(gusto.id);
    setLocalWeight(gusto.weight);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setLocalWeight("");
  };

  const saveWeight = async (gusto) => {
    if (saving) return;

    const value = Number(localWeight);

    if (isNaN(value) || value < 0) {
      toast.error("El peso debe ser un número válido");
      return;
    }

    try {
      setSaving(true);

      await updateGusto(gusto.id, {
        weight: value,
      });

      toast.success("Stock actualizado 🧊");
      cancelEdit();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar stock");
    } finally {
      setSaving(false);
    }
  };

  /* =====================
     TOGGLE ACTIVE
  ===================== */
  const toggleActive = async (gusto) => {
    try {
      await updateGusto(gusto.id, {
        active: gusto.active === false ? true : false,
      });

      toast.success(
        gusto.active === false
          ? "Gusto habilitado 🍦"
          : "Gusto inhabilitado 🚫"
      );
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar estado del gusto");
    }
  };

  /* =====================
     AVISO MANUAL
  ===================== */

  const handleSendAlert = (gusto) => {
    sendLowStockAlert(gusto, gusto.weight);
    toast.success("Aviso enviado por WhatsApp 📲");
  };

  /* =====================
     RENDER
  ===================== */

  if (loading) {
    return <p className="admin-stock__loading">Cargando stock…</p>;
  }

  return (
    <section className="admin-stock">
      <h2>📦 Stock de gustos</h2>

      {/* =====================
          FILTERS
      ===================== */}
      <div className="admin-stock__filters">
        <input
          type="text"
          placeholder="Buscar gusto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "Todas las categorías" : c}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="ok">🟢 OK</option>
          <option value="warning">🟡 Bajo</option>
          <option value="danger">🔴 Crítico</option>
        </select>
      </div>

      {/* =====================
          LIST
      ===================== */}
      <div className="admin-stock__list">
        {filteredGustos.length === 0 && (
          <p className="admin-stock__empty">
            No hay gustos que coincidan con los filtros
          </p>
        )}

        {filteredGustos.map((gusto) => {
          const status = getStockStatus(gusto.weight);
          const isEditing = editingId === gusto.id;
          const isDisabled = gusto.active === false;

          return (
            <div
              key={gusto.id}
              className={`admin-stock__item ${status} ${
                isDisabled ? "disabled" : ""
              }`}
            >
              <div className="admin-stock__info">
                <strong>{gusto.name}</strong>
                <span className="category">{gusto.category}</span>

                {isDisabled && (
                  <span
                    className="category"
                    style={{ color: "crimson" }}
                  >
                    INHABILITADO
                  </span>
                )}
              </div>

              <div className="admin-stock__weight">
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={localWeight}
                    onChange={(e) =>
                      setLocalWeight(e.target.value)
                    }
                  />
                ) : (
                  `${(gusto.weight / 1000).toFixed(2)} kg`
                )}
              </div>

              <div className="admin-stock__actions">
                {isEditing ? (
                  <>
                    <button
                      className="btn-save"
                      disabled={saving}
                      onClick={() => saveWeight(gusto)}
                    >
                      ✔
                    </button>

                    <button
                      className="btn-cancel"
                      onClick={cancelEdit}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <span className="admin-stock__status">
                      {status === "ok" && "🟢 OK"}
                      {status === "warning" && "🟡 Bajo"}
                      {status === "danger" && "🔴 Crítico"}
                    </span>

                    {/* 📲 BOTÓN SOLO SI ESTA BAJO */}
                    {(status === "warning" ||
                      status === "danger") && (
                      <button
                        className="btn-alert"
                        onClick={() =>
                          handleSendAlert(gusto)
                        }
                        title="Avisar por WhatsApp"
                      >
                        📲
                      </button>
                    )}

                    <button
                      className="btn-edit"
                      onClick={() => startEdit(gusto)}
                      title="Editar stock"
                    >
                      ✏️
                    </button>

                    <button
                      className="btn-edit"
                      onClick={() => toggleActive(gusto)}
                      title={
                        isDisabled
                          ? "Habilitar gusto"
                          : "Inhabilitar gusto"
                      }
                    >
                      {isDisabled ? "✅" : "🚫"}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AdminStock;
