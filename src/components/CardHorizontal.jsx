import { useState } from "react";
import "../styles/CardHorizontal.scss";

import foto from "../assets/vertical-11.jpeg";

import Button from "./Button";
import StarBadge from "./StarBadge";
import SelectGustosModal from "./SelectGustosModal";

import { useAuth } from "../hooks/useAuth";
import { useCart } from "../context/useCart";

import {
  updateProductImage,
  deleteProduct,
} from "../services/products.service";

import { uploadProductImage } from "../services/uploadImage.service";

import toast from "react-hot-toast";

const CardHorizontal = ({
  imageRight = false,
  title = "",
  price = 0,
  featured = false,
  thumbnail = "",
  product,
}) => {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const { addToCart } = useCart();

  /* =====================
     STATES
  ===================== */

  const [openModal, setOpenModal] = useState(false);

  const [editingImage, setEditingImage] = useState(false);

  const [dragging, setDragging] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* =====================
     IMAGE SRC
  ===================== */

  const imageSrc = preview
    ? preview
    : thumbnail && thumbnail !== ""
    ? thumbnail
    : foto;

  /* =====================
     IMAGE HANDLER
  ===================== */

  const handleImage = (file) => {
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  /* =====================
     SAVE IMAGE
  ===================== */

  const handleSaveImage = async () => {
    if (!product?.id || !imageFile) {
      toast.error("Seleccioná una imagen");
      return;
    }

    try {
      setSaving(true);

      const url = await uploadProductImage(imageFile);

      await updateProductImage(product.id, url);

      toast.success("Imagen actualizada 📷");

      setEditingImage(false);
      setImageFile(null);
      setPreview(null);

    } catch (err) {
      console.error(err);
      toast.error("Error al subir imagen");
    } finally {
      setSaving(false);
    }
  };

  /* =====================
     DELETE
  ===================== */

  const handleDelete = async () => {
    if (!product?.id) return;

    const ok = window.confirm(
      `¿Eliminar "${title}"?`
    );

    if (!ok) return;

    try {
      setDeleting(true);

      await deleteProduct(product.id);

      toast.success("Producto eliminado 🗑️");

    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  /* =====================
     ORDER
  ===================== */

  const handleOrder = () => {
    if (product?.category === "postres") {
      addToCart({
        ...product,
        price,
        quantity: 1,
        gustos: [],
      });

      toast.success("Postre agregado 🧁");
      return;
    }

    setOpenModal(true);
  };

  /* =====================
     RENDER
  ===================== */

  return (
    <>
      <div
        className={`
          card
          ${imageRight ? "card--reverse" : ""}
          ${featured ? "card--glass" : ""}
        `}
      >
        {product?.featured && (
          <StarBadge
            className="card__badge"
            size={32}
          />
        )}

        {/* =====================
            EDIT IMAGE
        ===================== */}

        {isAdmin && editingImage && (
          <div
            className={`card__image-upload ${
              dragging ? "is-dragging" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleImage(e.dataTransfer.files[0]);
            }}
          >
            <input
              type="file"
              hidden
              accept="image/*"
              id={`edit-${product.id}`}
              onChange={(e) =>
                handleImage(e.target.files[0])
              }
            />

            {!preview ? (
              <label htmlFor={`edit-${product.id}`}>
                <span style={{ fontSize: 32 }}>📤</span>

                <span>Arrastrá tu imagen</span>

                <small
                  style={{
                    fontSize: 12,
                    opacity: 0.7,
                  }}
                >
                  o hacé click para seleccionar
                </small>
              </label>
            ) : (
              <div className="card__image-preview">
                <img src={preview} alt="preview" />

                <div className="card__image-actions">
                  <button
                    onClick={handleSaveImage}
                    disabled={saving}
                  >
                    {saving
                      ? "Subiendo…"
                      : "Guardar"}
                  </button>

                  <button
                    className="cancel"
                    onClick={() => {
                      setEditingImage(false);
                      setPreview(null);
                      setImageFile(null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================
            IMAGE
        ===================== */}

        <img
          src={imageSrc}
          alt={title}
          className="card__img"
          onError={(e) =>
            (e.target.src = foto)
          }
        />

        {/* =====================
            TEXTS
        ===================== */}

        <div className="card__texts">
          <h4 className="card__texts__title">
            {title}
          </h4>

          <p className="card__texts__subtitle">
            A tan solo ${price}
          </p>

          {isAdmin && !editingImage && (
            <>
              <button
                className="card__edit-image-btn"
                onClick={() =>
                  setEditingImage(true)
                }
              >
                📷 Imagen
              </button>

              <button
                className="card__delete-icon"
                onClick={handleDelete}
                disabled={deleting}
              >
                🗑️
              </button>
            </>
          )}

          <p className="card__texts__p">
            ¿Te lo pensás perder?
          </p>

          <Button
            text="Pedir ahora"
            onClick={handleOrder}
            className="card__texts__button"
          />
        </div>
      </div>

      {/* =====================
          MODAL
      ===================== */}

      {product &&
        product.category !== "postres" && (
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
