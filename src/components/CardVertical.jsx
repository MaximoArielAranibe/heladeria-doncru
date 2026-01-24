import { useState } from "react";
import "../styles/CardVertical.scss";
import Button from "./Button.jsx";
import StarBadge from "./StarBadge.jsx";
import SelectGustosModal from "./SelectGustosModal";
import { useAuth } from "../hooks/useAuth";
import { updateProductPrice, deleteProduct } from "../services/products.service";
import toast from "react-hot-toast";

const CardVertical = ({ product }) => {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [openModal, setOpenModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [localPrice, setLocalPrice] = useState(product?.price ?? 0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!product) return null;

  const handleDelete = async () => {
    if (!product?.id) return;

    const confirmed = window.confirm(`¿Eliminar "${product.title}"?\nEsta acción no se puede deshacer.`)

    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteProduct(product.id);
      toast.success("Producto eliminado 🗑️");
    } catch (error) {
      console.error(error);
      toast.error("Errorr al eliminar producto");
    } finally {
      setDeleting(false);
    }
  }

  const handleSavePrice = async () => {
    try {
      setSaving(true);
      await updateProductPrice(product.id, Number(localPrice));
      product.price = Number(localPrice); // update visual
      toast.success("Precio actualizado 💰");
      setEditingPrice(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el precio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="card-v">
        <div className="card-v__img-container">
          {product.featured && (
            <StarBadge className="card-v__badge" size={32} />
          )}

          <img
            src={product.thumbnail}
            alt={product.title}
            className="card-v__img"
            loading="lazy"
          />

          {isAdmin && editingPrice && (
            <div className="card-v__price-edit">
              <input
                type="number"
                min="0"
                value={localPrice}
                onChange={(e) => setLocalPrice(e.target.value)}
              />

              <button onClick={handleSavePrice} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>

              <button
                className="cancel"
                onClick={() => setEditingPrice(false)}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="card-v__texts">
          <h4 className="card-v__texts__title">{product.title}</h4>

          <p className="card-v__texts__subtitle">
            {product.description}
          </p>

          {!editingPrice && (
            <p className="card-v__texts__price">
              ${Number(product.price).toLocaleString()}
            </p>
          )}
          {isAdmin && !editingPrice && (
            <>
              <button
                className="card-v__edit-price-btn"
                onClick={() => setEditingPrice(true)}
              >
                ✏️ Editar precio
              </button>

              <button
                className="card__delete-icon"
                onClick={handleDelete}
                disabled={deleting}
                title="Eliminar producto"
              >
                🗑️
              </button>
            </>
          )}


          <Button
            text="Comprar ahora"
            onClick={() => setOpenModal(true)}
            className="card-v__texts__button"
          />
        </div>
      </div>

      {/* ✅ NO PASAR GUSTOS ACÁ */}
      <SelectGustosModal
        product={{ ...product, price: Number(localPrice) }}
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  );
};

export default CardVertical;
