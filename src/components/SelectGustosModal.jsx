import { useState } from "react";
import "../styles/SelectGustosModal.scss"
import Modal from "./Modal";
import { gustos } from "../data/gustos";
import { useCart } from "../components/context/CartContext.jsx";

const SelectGustosModal = ({ product, open, onClose }) => {
  const { addToCart } = useCart();
  const [selected, setSelected] = useState([]);

  const toggleGusto = (gusto) => {
    if (selected.includes(gusto)) {
      setSelected(selected.filter((g) => g !== gusto));
      return;
    }

    if (selected.length >= product.maxGustos) return;

    setSelected([...selected, gusto]);
  };

  const handleConfirm = () => {
    addToCart({
      ...product,
      gustos: selected,
    });
    onClose();
    setSelected([]);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h3>{product.title}</h3>
      <p>
        Elegí hasta {product.maxGustos} gustos
      </p>

      <div className="gustos-grid">
        {gustos.map((gusto) => (
          <button
            key={gusto.id}
            className={`gusto-option ${
              selected.includes(gusto.name)
                ? "is-selected"
                : ""
            }`}
            onClick={() => toggleGusto(gusto.name)}
          >
            {gusto.name}
          </button>
        ))}
      </div>

      <button
        className="confirm-btn"
        disabled={selected.length === 0}
        onClick={handleConfirm}
      >
        Confirmar helado
      </button>
    </Modal>
  );
};

export default SelectGustosModal;
