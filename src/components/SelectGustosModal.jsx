import { useState, useEffect } from "react";
import Modal from "./Modal";
import { gustos } from "../data/gustos";
import { useCart } from "../components/context/useCart";
import "../styles/SelectGustosModal.scss";

const SelectGustosModal = ({ product, open, onClose }) => {
  const { addToCart } = useCart();

  const [selected, setSelected] = useState([]);
  const [maxGustos, setMaxGustos] = useState(0);

  useEffect(() => {
    if (!product) return;
    setMaxGustos(product.maxGustos);
  }, [product]);

  useEffect(() => {
    if (!open) setSelected([]);
  }, [open]);

  const toggleGusto = (gusto) => {
    if (selected.includes(gusto)) {
      setSelected((prev) => prev.filter((g) => g !== gusto));
      return;
    }

    if (selected.length >= maxGustos) return;

    setSelected((prev) => [...prev, gusto]);
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;

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
