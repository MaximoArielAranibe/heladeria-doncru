// UPDATED: src/components/GustosSection.jsx
import { useState, useMemo } from "react";
import "../styles/ProductsSection.scss";
import { useGustos } from "../hooks/useGustos";
import { useAuth } from "../hooks/useAuth";
import { products } from "../data/products";
import Modal from "./Modal";
import SelectGustosModal from "./SelectGustosModal";
import {
  createGusto,
  updateGusto,
  deleteGusto,
} from "../services/gustos.service";
import toast from "react-hot-toast";
import { formatCategory } from "../utils/formatCategory";

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

const GustosSection = ({ category = "todos", title }) => {
  const { gustos, loading } = useGustos();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const safeGustos = useMemo(
    () => (Array.isArray(gustos) ? gustos : []),
    [gustos]
  );

  const [activeCategory, setActiveCategory] = useState(category);

  /* =====================
     FLOW CLIENTE
  ===================== */
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [selectedGusto, setSelectedGusto] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [gustosModalOpen, setGustosModalOpen] = useState(false);

  const openSizeSelector = (gusto) => {
    if (isAdmin) return;
    setSelectedGusto(gusto);
    setSizeModalOpen(true);
  };

  const handleSizeSelect = (product) => {
    setSelectedProduct(product);
    setSizeModalOpen(false);
    setGustosModalOpen(true);
  };

  /* =====================
     ADMIN EDIT
  ===================== */
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    category: "",
    newCategory: "",
  });

  /* =====================
     ADMIN CREATE
  ===================== */
  const [creating, setCreating] = useState(false);
  const [newGusto, setNewGusto] = useState({
    name: "",
    weight: "",
    category: "",
  });

  /* =====================
     CATEGORÍAS
  ===================== */
  const categories = useMemo(() => {
    const unique = new Set(
      safeGustos.map((g) => g.category).filter(Boolean)
    );
    return ["todos", ...Array.from(unique)];
  }, [safeGustos]);

  const selectableCategories = categories.filter(
    (c) => c !== "todos"
  );

  const filteredGustos = useMemo(() => {
    return activeCategory === "todos"
      ? safeGustos
      : safeGustos.filter(
          (g) => g.category === activeCategory
        );
  }, [safeGustos, activeCategory]);

  /* =====================
     EDIT
  ===================== */
  const startEdit = (gusto) => {
    setEditingId(gusto.id);
    setEditData({
      name: gusto.name,
      category: gusto.category,
      newCategory: "",
    });
  };

  const saveEdit = async (id) => {
    if (!editData.name.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    const finalCategory =
      editData.category === "__new__"
        ? slugify(editData.newCategory)
        : editData.category;

    try {
      await updateGusto(id, {
        name: editData.name.trim(),
        category: finalCategory,
      });

      toast.success("Gusto actualizado 🍦");
      setEditingId(null);
    } catch {
      toast.error("Error al actualizar gusto");
    }
  };

  /* =====================
     CREATE
  ===================== */
  const handleCreate = async () => {
    if (!newGusto.name.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    if (!newGusto.weight || Number(newGusto.weight) <= 0) {
      toast.error("El stock inicial debe ser mayor a 0");
      return;
    }

    const finalCategory =
      newGusto.category === "__new__"
        ? slugify(newGusto.newCategory)
        : newGusto.category;

    if (!finalCategory) {
      toast.error("Completá la categoría");
      return;
    }

    try {
      await createGusto({
        name: newGusto.name.trim(),
        category: finalCategory,
        weight: Number(newGusto.weight),
        active: true,
        createdAt: new Date(),
      });

      toast.success("Gusto creado 🍨");

      setNewGusto({
        name: "",
        weight: "",
        category: "",
        newCategory: "",
      });

      setCreating(false);
    } catch {
      toast.error("Error al crear gusto");
    }
  };

  /* =====================
     DELETE
  ===================== */
  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar "${name}"?`)) return;

    try {
      await deleteGusto(id);
      toast.success("Gusto eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  if (loading) return <p>Cargando gustos...</p>;

  return (
    <section className="products">
      {/* CREATE ADMIN */}
      {isAdmin && (
        <div className="admin-create-gusto">
          {!creating ? (
            <button
              className="create-gusto-btn"
              onClick={() => setCreating(true)}
            >
              ➕ Agregar gusto
            </button>
          ) : (
            <div className="gusto-edit">
              <input
                placeholder="Nombre del gusto"
                value={newGusto.name}
                onChange={(e) =>
                  setNewGusto({
                    ...newGusto,
                    name: e.target.value,
                  })
                }
              />

              <input
                type="number"
                placeholder="Stock inicial (gramos)"
                value={newGusto.weight}
                onChange={(e) =>
                  setNewGusto({
                    ...newGusto,
                    weight: e.target.value,
                  })
                }
              />

              <select
                value={newGusto.category}
                onChange={(e) =>
                  setNewGusto({
                    ...newGusto,
                    category: e.target.value,
                  })
                }
              >
                <option value="">Seleccionar categoría</option>
                {selectableCategories.map((c) => (
                  <option key={c} value={c}>
                    {formatCategory(c)}
                  </option>
                ))}
              </select>

              <button className="save" onClick={handleCreate}>
                ✔ Crear
              </button>

              <button
                className="cancel"
                onClick={() => {
                  setCreating(false);
                  setNewGusto({
                    name: "",
                    weight: "",
                    category: "",
                  });
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      <header className="products__header">
        <h2 className="products__title">{title}</h2>
        <p className="products__subtitle">
          Elegí tu sabor favorito
        </p>
      </header>

      {/* FILTROS */}
      <div className="products__filters">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${
              activeCategory === cat ? "is-active" : ""
            }`}
            onClick={() => setActiveCategory(cat)}
          >
            {formatCategory(cat)}
          </button>
        ))}
      </div>

      {/* LISTA */}
      <div className="products__list">
        {filteredGustos.map((gusto) => {
          const isInactive =
            gusto.active === false || gusto.weight <= 0;
          const isClickable = !isAdmin && !isInactive;

          if (isAdmin && editingId === gusto.id) {
            return (
              <div key={gusto.id} className="gusto-card">
                <div className="gusto-edit">
                  <input
                    value={editData.name}
                    onChange={(e) =>
                      setEditData((p) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                  />

                  <select
                    value={editData.category}
                    onChange={(e) =>
                      setEditData((p) => ({
                        ...p,
                        category: e.target.value,
                      }))
                    }
                  >
                    <option value="">Categoría</option>
                    {selectableCategories.map((c) => (
                      <option key={c} value={c}>
                        {formatCategory(c)}
                      </option>
                    ))}
                    <option value="__new__">
                      + Nueva
                    </option>
                  </select>

                  {editData.category === "__new__" && (
                    <input
                      placeholder="Nueva categoría"
                      value={editData.newCategory}
                      onChange={(e) =>
                        setEditData((p) => ({
                          ...p,
                          newCategory: e.target.value,
                        }))
                      }
                    />
                  )}

                  <div className="gusto-actions">
                    <button
                      className="save"
                      onClick={() => saveEdit(gusto.id)}
                    >
                      Guardar
                    </button>
                    <button
                      className="cancel"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={gusto.id}
              className={`gusto-card ${
                isClickable ? "is-clickable" : ""
              } ${isInactive ? "is-disabled" : ""}`}
              onClick={() => {
                if (!isClickable) return;
                openSizeSelector(gusto);
              }}
            >
              <div className="gusto-info">
                <span className="gusto-name">
                  {gusto.name}
                </span>

                {isAdmin && (
                  <span
                    className={`gusto-stock ${
                      gusto.weight < 1000
                        ? "danger"
                        : gusto.weight < 3000
                        ? "warning"
                        : ""
                    }`}
                  >
                    {(gusto.weight / 1000).toFixed(2)} kg
                  </span>
                )}
              </div>

              {isAdmin && (
                <div className="gusto-actions">
                  <button
                    className="gusto-edit-btn"
                    onClick={() => startEdit(gusto)}
                  >
                    ✏️
                  </button>

                  <button
                    className="gusto-delete-btn"
                    onClick={() =>
                      handleDelete(
                        gusto.id,
                        gusto.name
                      )
                    }
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SIZE MODAL */}
      <Modal
        open={sizeModalOpen}
        onClose={() => setSizeModalOpen(false)}
      >
        <div className="select-modal">
          <h3>Elegí tamaño</h3>
          <div className="gustos-grid gustos-grid-center">
            {products.map((p) => (
              <button
                key={p.id}
                className="gusto-option"
                onClick={() => handleSizeSelect(p)}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* GUSTOS MODAL */}
      {selectedProduct && (
        <SelectGustosModal
          product={selectedProduct}
          open={gustosModalOpen}
          initialSelected={
            selectedGusto
              ? [selectedGusto.id]
              : []
          }
          onClose={() =>
            setGustosModalOpen(false)
          }
        />
      )}
    </section>
  );
};

export default GustosSection;
