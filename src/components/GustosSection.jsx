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

  // FLOW CLIENTE
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

  // ADMIN EDIT
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    category: "",
    newCategory: "",
  });

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
    } catch (error) {
      toast.error("Error al actualizar gusto", error);
    }
  };

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
      {isAdmin && (
        <button onClick={() => createGusto()}>Crear gusto</button>
      )}
      <header className="products__header">
        <h2 className="products__title">{title}</h2>
        <p className="products__subtitle">
          Elegí tu sabor favorito
        </p>
      </header>

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

      <div className="products__list">
        {filteredGustos.map((gusto) => {
          const isInactive =
            gusto.active === false || gusto.weight <= 0;
          const isClickable = !isAdmin && !isInactive;

          // INLINE EDIT
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
                      onClick={() =>
                        saveEdit(gusto.id)
                      }
                    >
                      Guardar
                    </button>
                    <button
                      className="cancel"
                      onClick={() =>
                        setEditingId(null)
                      }
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
              onClick={(e) => {
                if (!isClickable) return;
                openSizeSelector(gusto);
              }}

            >
              <div className="gusto-info">
                <span className="gusto-name">
                  {gusto.name}
                </span>
              </div>

              {isAdmin && (
                <div className="gusto-actions">
                  <button
                    className="gusto-edit-btn"
                    onClick={() =>
                      startEdit(gusto)
                    }
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
                onClick={() =>
                  handleSizeSelect(p)
                }
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
