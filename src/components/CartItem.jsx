import { useState, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import "../styles/CartItem.scss";
import { useGustos } from "../hooks/useGustos";

const CartItem = ({ item, onRemove, onUpdateQuantity }) => {
  const { cartId, title, price, gustos = [], quantity = 1 } = item;

  const { gustos: allGustos } = useGustos();

  /* =====================
     MAP ID → NAME
  ===================== */
  const gustoNames = useMemo(() => {
    if (!Array.isArray(gustos)) return [];

    return gustos.map((id) => {
      const found = allGustos.find((g) => g.id === id);
      return found?.name || "—";
    });
  }, [gustos, allGustos]);

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
        {/* BOTÓN X */}
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

          {gustoNames.length > 0 && (
            <p className="cart-item__flavors">
              {gustoNames.join(", ")}
            </p>
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

            <button
              onClick={() => onUpdateQuantity(cartId, quantity + 1)}
            >
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
