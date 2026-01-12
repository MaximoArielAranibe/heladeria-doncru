import { useState } from "react";
import "../styles/CardHorizontal.scss";
import foto from "../assets/vertical-11.jpeg";
import Button from "./Button";
import StarBadge from "./StarBadge";
import SelectGustosModal from "./SelectGustosModal";

const CardHorizontal = ({
  imageRight = false,
  title = "",
  price = 0,
  isFeatured = false, // ahora solo controla glass
  thumbnail = "",
  product,
}) => {
  const [openModal, setOpenModal] = useState(false);
  const imageSrc = thumbnail && thumbnail !== "" ? thumbnail : foto;

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

        <img
          src={imageSrc}
          alt="Foto helados Don Cru"
          className="card__img"
          onError={(e) => {
            e.target.src = foto;
          }}
        />

        <div className="card__texts">
          <h4 className="card__texts__title">{title}</h4>
          <p className="card__texts__subtitle">
            A tan solo ${price || ""}
          </p>
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
          product={product}
          open={openModal}
          onClose={() => setOpenModal(false)}
        />
      )}
    </>
  );
};

export default CardHorizontal;
