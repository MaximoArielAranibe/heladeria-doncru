import { useState } from "react";
import "../styles/CardHorizontal.scss";
import foto from "../assets/vertical-11.jpeg";
import Button from "./Button";
import StarBadge from "./StarBadge";
import SelectGustosModal from "./SelectGustosModal";
import { useAuth } from "../hooks/useAuth";
import { updateProductPrice, deleteProduct } from "../services/products.service";
import toast from "react-hot-toast";

const CardHorizontal = ({
  imageRight = false,
  title = "",
  price = 0,
  isFeatured = false,
  thumbnail = "",
  product,
}) => {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [openModal, setOpenModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [localPrice, setLocalPrice] = useState(price);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false); // 🗑️

  const imageSrc = thumbnail && thumbnail !== "" ? thumbnail : foto;

  const handleSavePrice = async () => {
    if (!product?.id) return;

    try {
      setSaving(true);
      await updateProductPrice(product.id, Number(localPrice));
      toast.success("Precio actualizado 💰");
      setEditingPrice(false);
    } catch (err) {
      toast.error("Error al actualizar el precio");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // 🗑️ ELIMINAR PRODUCTO
  const handleDelete = async () => {
    if (!product?.id) return;

    const confirmed = window.confirm(
      `¿Eliminar "${title}"?\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteProduct(product.id);
      toast.success("Producto eliminado 🗑️");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar producto");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        className={`
          card
          ${imageRight ? "card--reverse" : ""}
          ${isFeatured ? "card--glass" : ""}
        `}
      >
        {isFeatured && (
          <StarBadge className="card__badge" size={28} />
        )}

        {/* 🔧 ADMIN PRICE EDIT */}
        {isAdmin && editingPrice && (
          <div
            className={`card__price-edit ${imageRight ? "card__price-edit--right" : ""
              }`}
          >
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

        <img
          src={imageSrc}
          alt={title}
          className="card__img"
          onError={(e) => (e.target.src = foto)}
        />

        <div className="card__texts">
          <h4 className="card__texts__title">{title}</h4>

          {!editingPrice && (
            <p className="card__texts__subtitle">
              A tan solo ${price}
            </p>
          )}

          {/* 🔧 ADMIN ACTIONS */}
          {isAdmin && !editingPrice && (
            <>
              <button
                className="card__edit-price-btn"
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

          <p className="card__texts__p">¿Te lo pensás perder?</p>

          <Button
            text="Pedir ahora"
            onClick={() => setOpenModal(true)}
            className="card__texts__button"
          />
        </div>
      </div>

      {product && (
        <SelectGustosModal
          product={{ ...product, price }}
          open={openModal}
          onClose={() => setOpenModal(false)}
        />
      )}
    </>
  );
};

export default CardHorizontal;