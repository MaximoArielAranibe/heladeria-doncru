import { useState } from "react";
import Modal from "./Modal";
import { gustos } from "../data/gustos";
import { useCart } from "../context/useCart";
import "../styles/SelectGustosModal.scss";
import toast from "react-hot-toast";

const SelectGustosModal = ({ product, open, onClose }) => {
  const { addToCart } = useCart();

  const [selected, setSelected] = useState([]);

  // 👉 Derivado directamente del producto (NO state)
  const maxGustos = product?.maxGustos ?? 0;

  const toggleGusto = (gusto) => {
    setSelected((prev) => {
      if (prev.includes(gusto)) {
        return prev.filter((g) => g !== gusto);
      }

      if (prev.length >= maxGustos) return prev;

      return [...prev, gusto];
    });
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;

    addToCart({
      ...product,
      gustos: selected,
    });

    toast.success("Producto agregado al carrito 🛒");

    setSelected([]); // limpiamos acá
    onClose();
  };

  const handleClose = () => {
    setSelected([]); // limpiamos al cerrar
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
          <div className="gustos-grid">
            {gustos.map((gusto) => {
              const isSelected = selected.includes(gusto.name);
              const isDisabled =
                selected.length >= maxGustos && !isSelected;

              return (
                <button
                  key={gusto.id}
                  className={`gusto-option ${
                    isSelected ? "is-selected" : ""
                  }`}
                  onClick={() => toggleGusto(gusto.name)}
                  disabled={isDisabled}
                >
                  {gusto.name}
                </button>
              );
            })}
          </div>
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
