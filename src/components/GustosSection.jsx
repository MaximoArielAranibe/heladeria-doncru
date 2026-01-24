import { useState, useMemo } from "react";
import "../styles/ProductsSection.scss";
import { useGustos } from "../hooks/useGustos";
import { useAuth } from "../hooks/useAuth";
import {
  createGusto,
  updateGusto,
  deleteGusto,
} from "../services/gustos.service";
import toast from "react-hot-toast";
import { formatCategory } from "../utils/formatCategory";

/* =====================
   HELPERS
===================== */
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
     EDIT
  ===================== */
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    category: "",
    newCategory: "",
  });

  /* =====================
    CREATE
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

  /* =====================
     FILTRADO
  ===================== */
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

    if (!finalCategory) {
      toast.error("Completá la categoría");
      return;
    }

    try {
      await updateGusto(id, {
        name: editData.name.trim(),
        category: finalCategory,
      });

      toast.success("Gusto actualizado 🍦");
      setEditingId(null);
    } catch (error) {
      toast.error("Error al actualizar gusto");
      console.error(error);
    }
  };


  const handleCreate = async () => {
    // 🧪 VALIDACIONES
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
        weight: Number(newGusto.weight), // 🔥 CLAVE
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
    } catch (error) {
      toast.error("Error al crear gusto");
      console.error(error);
    }
  };

  /* =====================
     DELETE
  ===================== */
  const handleDelete = async (id, name) => {
    const ok = window.confirm(
      `¿Eliminar el gusto "${name}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!ok) return;

    try {
      await deleteGusto(id);
      toast.success("Gusto eliminado 🗑️");
    } catch (error) {
      toast.error("Error al eliminar gusto");
      console.error(error);
    }
  };

  if (loading) return <p>Cargando gustos...</p>;

  return (
    <section className="products">
      <header className="products__header">
        <h2 className="products__title">{title}</h2>
        <p className="products__subtitle">
          Elegí tu sabor favorito
        </p>
      </header>

      {/* ➕ CREATE GUSTO */}
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
                name="weight"
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

                {/*  <option value="__new__">
                  ➕ Nueva categoría
                </option> */} {/* Posible feature nueva categoria */}
              </select>

              {newGusto.category === "__new__" && (
                <input
                  placeholder="Nombre de la nueva categoría"
                  value={newGusto.newCategory}
                  onChange={(e) =>
                    setNewGusto({
                      ...newGusto,
                      newCategory: e.target.value,
                    })
                  }
                />
              )}

              <button className="save" onClick={handleCreate}>
                ✔ Crear
              </button>

              <button
                className="cancel"
                onClick={() => {
                  setCreating(false);
                  setNewGusto({
                    name: "",
                    category: "",
                    newCategory: "",
                  });
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* 🔍 FILTROS */}
      <div className="products__filters">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${activeCategory === cat ? "is-active" : ""
              }`}
            onClick={() => setActiveCategory(cat)}
          >
            {formatCategory(cat)}
          </button>
        ))}
      </div>

      {/* 🍦 LISTA */}
      <div className="products__list">
        {filteredGustos.map((gusto) => (
          <div key={gusto.id} className="gusto-card">
            {editingId === gusto.id ? (
              <div className="gusto-edit">
                <input
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      name: e.target.value,
                    })
                  }
                />

                <select
                  value={editData.category}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      category: e.target.value,
                    })
                  }
                >
                  {selectableCategories.map((c) => (
                    <option key={c} value={c}>
                      {formatCategory(c)}
                    </option>
                  ))}
                  <option value="__new__">
                    ➕ Nueva categoría
                  </option>
                </select>

                {editData.category === "__new__" && (
                  <input
                    placeholder="Nueva categoría"
                    value={editData.newCategory}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        newCategory: e.target.value,
                      })
                    }
                  />
                )}

                <button
                  className="save"
                  onClick={() => saveEdit(gusto.id)}
                >
                  ✔
                </button>

                <button
                  className="cancel"
                  onClick={() => setEditingId(null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="gusto-info">
                  <span className="gusto-name">{gusto.name}</span>

                  {isAdmin && (
                    <span
                      className={`gusto-stock ${gusto.weight < 1000
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
                      ✏️ Editar
                    </button>

                    <button
                      className="gusto-delete-btn"
                      onClick={() =>
                        handleDelete(gusto.id, gusto.name)
                      }
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default GustosSection;
