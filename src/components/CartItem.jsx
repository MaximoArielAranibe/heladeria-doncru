import { useState, useRef } from "react";
import toast from "react-hot-toast";
import "../styles/CartItem.scss";

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  const { cartId, title, price, gustos = [], quantity = 1 } = item;

  const startX = useRef(0);
  const currentX = useRef(0);

  const [offsetX, setOffsetX] = useState(0);
  const [removing, setRemoving] = useState(false);

  /* =====================
     SWIPE (MOBILE)
  ====================== */

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    if (diff < 0) {
      setOffsetX(Math.max(diff, -120));
    }
  };

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => {
      onRemove(cartId);
      toast.success("Producto eliminado");
    }, 250);
  };

  const handleTouchEnd = () => {
    if (offsetX < -90) {
      handleRemove();
    } else {
      setOffsetX(0);
    }
  };

  return (
    <li className={`cart-item ${removing ? "cart-item--removing" : ""}`}>
      {/* Fondo swipe */}
      <div className="cart-item__swipe-bg">Eliminar</div>

      <div
        className="cart-item__content"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* BOTÓN X (DESKTOP) */}
        <button
          className="cart-item__remove"
          aria-label="Eliminar producto"
          onClick={handleRemove}
        >
          ✕
        </button>

        {/* INFO */}
        <div className="cart-item__info">
          <h4 className="cart-item__title">{title}</h4>

          {gustos.length > 0 && (
            <p className="cart-item__flavors">{gustos.join(", ")}</p>
          )}
        </div>

        {/* RIGHT */}
        <div className="cart-item__right">
          <div className="cart-item__quantity">
            <button
              onClick={() => onUpdateQuantity(cartId, quantity - 1)}
              disabled={quantity === 1}
            >
              −
            </button>

            <span>{quantity}</span>

            <button onClick={() => onUpdateQuantity(cartId, quantity + 1)}>
              +
            </button>
          </div>

          <span className="cart-item__price">
            ${price * quantity}
          </span>
        </div>
      </div>
    </li>
  );
};

export default CartItem;
