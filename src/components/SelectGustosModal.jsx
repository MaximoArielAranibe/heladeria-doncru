import { useState, useEffect } from "react";
import Modal from "./Modal";
import { gustos } from "../data/gustos";
import { useCart } from "../components/context/CartContext.jsx";
import "../styles/SelectGustosModal.scss";

const SelectGustosModal = ({ product, open, onClose }) => {
  const { addToCart } = useCart();

  const [selected, setSelected] = useState([]);
  const [maxGustos, setMaxGustos] = useState(4);

  useEffect(() => {
    if (!product) return;
    setMaxGustos(product.size === "1/4" ? 3 : 4);
  }, [product]);

  useEffect(() => {
    if (!open) setSelected([]);
  }, [open]);

  const toggleGusto = (gusto) => {
    if (selected.includes(gusto)) {
      setSelected(selected.filter((g) => g !== gusto));
      return;
    }

    if (selected.length >= maxGustos) return;

    setSelected([...selected, gusto]);
  };

  const handleConfirm = () => {
    addToCart({
      ...product,
      gustos: selected,
    });
    onClose();
  };

  if (!product) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="select-modal">
        {/* HEADER */}
        <div className="select-modal__header">
          <h3>{product.title}</h3>
          <p>
            Elegí hasta <strong>{maxGustos}</strong> gustos
          </p>
        </div>

        {/* CONTENT SCROLL */}
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

        {/* FOOTER */}
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
