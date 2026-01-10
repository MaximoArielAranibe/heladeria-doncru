import { useState } from "react";
import "../styles/CardVertical.scss";
import Button from "./Button.jsx";
import StarBadge from "./StarBadge.jsx";
import SelectGustosModal from "./SelectGustosModal";

const CardVertical = ({ product }) => {
  if (!product) return null;

  const [openModal, setOpenModal] = useState(false);

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
        </div>

        <div className="card-v__texts">
          <h4 className="card-v__texts__title">{product.title}</h4>
          <p className="card-v__texts__subtitle">
            {product.description}
          </p>

          <div className="card-v__texts__footer">
            <p className="card-v__texts__price">
              ${product.price.toLocaleString()}
            </p>

            <Button
              text="Comprar ahora"
              onClick={() => setOpenModal(true)}
              className="card-v__texts__button"
            />
          </div>
        </div>
      </div>

      {/* 🧊 MODAL DE GUSTOS */}
      <SelectGustosModal
        product={product}
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  );
};

export default CardVertical;
