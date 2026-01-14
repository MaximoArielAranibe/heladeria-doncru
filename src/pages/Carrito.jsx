import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import CartItem from "../components/CartItem";
import { createOrder } from "../services/orders.service";
import "../styles/Carrito.scss";

const Carrito = () => {
  const { cart, removeFromCart, clearCart, updateQuantity } =
    useContext(CartContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const total = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const hasInvalidItems = cart.some(
    (item) => !item.gustos || item.gustos.length === 0
  );

  const buildWhatsappMessage = (cart, total) => {
    const items = cart
      .map((item) => {
        const gustosText =
          item.gustos?.length > 0
            ? ` (${item.gustos.join(", ")})`
            : "";

        return `• ${item.title} x${item.quantity}${gustosText}`;
      })
      .join("\n");

    const message = `Hola! Quiero hacer este pedido:

${items}

Total: $${total}`;

    return encodeURIComponent(message);
  };

  const phone = "+5492477567514";

  const handleConfirm = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const orderId = await createOrder({
        cart,
        total,
        customer: {
          name: "Cliente WhatsApp", // después lo pedís en un form
          phone,
        },
      });

      const message = buildWhatsappMessage(cart, total);

      // 👉 Abrimos WhatsApp
      window.open(
        `https://wa.me/${phone}?text=${message}%0A%0APedido ID: ${orderId}`,
        "_blank"
      );

      // ✅ Limpiamos carrito y cerramos modal
      clearCart();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creando pedido", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            onUpdateQuantity={updateQuantity}
          />
        ))}
      </ul>

      <div className="carrito__footer">
        <div className="carrito__total">
          Total: <strong>${total}</strong>
        </div>

        <div className="carrito__actions">
          <button
            className="btn btn--secondary"
            onClick={clearCart}
            disabled={isSubmitting}
          >
            Vaciar carrito
          </button>

          <button
            className="btn btn--primary"
            onClick={() => setIsModalOpen(true)}
            disabled={hasInvalidItems || isSubmitting}
          >
            Confirmar pedido
          </button>
        </div>
      </div>

      {/* =============================
          MODAL DEL CARRITO
      ============================== */}

      {isModalOpen && (
        <div
          className="carrito-modal-overlay"
          onClick={() => !isSubmitting && setIsModalOpen(false)}
        >
          <div
            className="carrito-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirmar pedido</h3>

            <ul className="carrito-modal__list">
              {cart.map((item) => (
                <li key={item.cartId}>
                  <strong>{item.title}</strong> x{item.quantity}
                  {item.gustos?.length > 0 && (
                    <div className="carrito-modal__gustos">
                      Gustos: {item.gustos.join(", ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="carrito-modal__total">
              Total: <strong>${total}</strong>
            </div>

            <div className="carrito-modal__actions">
              <button
                className="btn btn--secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Volver
              </button>

              <button
                className="btn btn--primary"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Enviando..."
                  : "Enviar por WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Carrito;
