// UPDATED: src/components/SelectGustosModal.jsx
import { useState, useMemo, useEffect } from "react";
import Modal from "./Modal";
import { useCart } from "../context/useCart";
import { useGustos } from "../hooks/useGustos";
import "../styles/SelectGustosModal.scss";
import toast from "react-hot-toast";

const SelectGustosModal = ({ product, open, onClose, onConfirm, initialSelected = [] }) => {
  const { addToCart } = useCart();
  const { gustos, loading } = useGustos();

  const [selected, setSelected] = useState([]);

  const maxGustos = product?.maxGustos ?? 0;

  // 👉 preload when opening
  useEffect(() => {
    if (open && initialSelected?.length) {
      setSelected(initialSelected);
    }
  }, [open, initialSelected]);

  const safeGustos = useMemo(
    () => (Array.isArray(gustos) ? gustos : []),
    [gustos]
  );

  const toggleGusto = (gustoId, isInactive) => {
    if (isInactive) return;

    setSelected((prev) => {
      if (prev.includes(gustoId)) {
        return prev.filter((g) => g !== gustoId);
      }

      if (prev.length >= maxGustos) {
        toast.error(`Máximo ${maxGustos} gustos`);
        return prev;
      }

      return [...prev, gustoId];
    });
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;

    const item = {
      ...product,
      gustos: selected,
      quantity: 1,
    };

    if (onConfirm) {
      onConfirm(item);
    } else {
      addToCart(item);
    }

    toast.success("Producto agregado 🛒");

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
                const isSelected = selected.includes(gusto.id);

                const isInactive =
                  gusto.active === false || gusto.weight <= 0;

                const maxReached =
                  selected.length >= maxGustos && !isSelected;

                return (
                  <button
                    key={gusto.id}
                    type="button"
                    className={`gusto-option
                      ${isSelected ? "is-selected" : ""}
                      ${isInactive ? "is-disabled" : ""}
                    `}
                    disabled={isInactive || maxReached}
                    onClick={() =>
                      toggleGusto(gusto.id, isInactive)
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