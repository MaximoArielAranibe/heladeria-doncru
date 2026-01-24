import { useState, useMemo } from "react";
import Modal from "./Modal";
import { useCart } from "../context/useCart";
import { useGustos } from "../hooks/useGustos";
import "../styles/SelectGustosModal.scss";
import toast from "react-hot-toast";

const SelectGustosModal = ({ product, open, onClose }) => {
  const { addToCart } = useCart();
  const { gustos, loading } = useGustos();

  const [selected, setSelected] = useState([]);

  const maxGustos = product?.maxGustos ?? 0;

  /* =====================
     SAFE GUSTOS
  ===================== */
  const safeGustos = useMemo(
    () => (Array.isArray(gustos) ? gustos : []),
    [gustos]
  );

  /* =====================
     TOGGLE
  ===================== */
  const toggleGusto = (gustoName, isInactive) => {
    if (isInactive) return;

    setSelected((prev) => {
      if (prev.includes(gustoName)) {
        return prev.filter((g) => g !== gustoName);
      }

      if (prev.length >= maxGustos) {
        toast.error(`Máximo ${maxGustos} gustos`);
        return prev;
      }

      return [...prev, gustoName];
    });
  };

  /* =====================
     CONFIRM
  ===================== */
  const handleConfirm = () => {
    if (selected.length === 0) return;

    addToCart({
      ...product,
      gustos: selected,
    });

    toast.success("Producto agregado al carrito 🛒");
    setSelected([]);
    onClose();
  };

  const handleClose = () => {
    setSelected([]);
    onClose();
  };

  if (!product || !open) return null;

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="select-modal">
        <div className="select-modal__header">
          <h3>{product.title}</h3>
          <p>
            Elegí hasta <strong>{maxGustos}</strong> gustos
          </p>
        </div>

        <div className="select-modal__content">
          {loading ? (
            <p>Cargando gustos...</p>
          ) : (
            <div className="gustos-grid">
              {safeGustos.map((gusto) => {
                const isSelected = selected.includes(gusto.name);
                const isInactive =
                  gusto.active === false || gusto.weight <= 0;

                const maxReached =
                  selected.length >= maxGustos && !isSelected;

                return (
                  <button
                    key={gusto.id || gusto.name}
                    type="button"
                    className={`gusto-option
                      ${isSelected ? "is-selected" : ""}
                      ${isInactive ? "is-disabled" : ""}
                    `}
                    disabled={isInactive || maxReached}
                    onClick={() =>
                      toggleGusto(gusto.name, isInactive)
                    }
                    title={
                      isInactive
                        ? "Gusto no disponible"
                        : gusto.name
                    }
                  >
                    {gusto.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="select-modal__footer">
          <button
            className="confirm-btn"
            disabled={selected.length === 0}
            onClick={handleConfirm}
          >
            Confirmar helado ({selected.length}/{maxGustos})
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SelectGustosModal;
