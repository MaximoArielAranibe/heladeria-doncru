import "../styles/CartItem.scss";

const CartItem = ({ item, onRemove }) => {
  return (
    <li className="cart-item">
      <div className="cart-item__info">
        <h4 className="cart-item__title">{item.title}</h4>

        {item.gustos && (
          <p className="cart-item__gustos">
            {item.gustos.join(", ")}
          </p>
        )}

        <span className="cart-item__price">
          ${item.price}
        </span>
      </div>

      <button
        className="cart-item__remove"
        onClick={() => onRemove(item.cartId)}
        aria-label="Eliminar producto"
      >
        ✕
      </button>
    </li>
  );
};

export default CartItem;
