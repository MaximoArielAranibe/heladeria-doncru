import { useContext } from "react";
import { CartContext } from "../components/context/CartContext";
import CartItem from "../components/CartItem";
import "../styles/Carrito.scss";

const Carrito = () => {
  const { cart, removeFromCart, clearCart } = useContext(CartContext);

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  if (cart.length === 0) {
    return (
      <section className="carrito carrito--empty">
        <h2>Tu carrito está vacío</h2>
        <p>Agregá productos para continuar</p>
      </section>
    );
  }

  return (
    <section className="carrito">
      <h2 className="carrito__title">Tu pedido</h2>

      <ul className="carrito__list">
        {cart.map((item) => (
          <CartItem
            key={item.cartId}
            item={item}
            onRemove={removeFromCart}
          />
        ))}
      </ul>

      <div className="carrito__footer">
        <div className="carrito__total">
          Total <strong>${total}</strong>
        </div>

        <div className="carrito__actions">
          <button className="btn btn--secondary" onClick={clearCart}>
            Vaciar carrito
          </button>

          <button className="btn btn--primary">
            Confirmar pedido
          </button>
        </div>
      </div>
    </section>
  );
};

export default Carrito;
