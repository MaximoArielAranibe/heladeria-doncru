import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import CartItem from "../components/CartItem";
import { createOrder } from "../services/orders.service";
import { normalizePhoneAR, isValidPhoneAR } from "../utils/phone";
import "../styles/Carrito.scss";

const BUSINESS_PHONE = "5492477361535";

const Carrito = () => {
  const { cart, removeFromCart, clearCart, updateQuantity } =
    useContext(CartContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsModalOpen(false);
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

  const isFormInvalid =
    !customer.name.trim() ||
    !customer.phone.trim() ||
    !isValidPhoneAR(customer.phone);

  const buildWhatsappMessage = (cart, total, orderId) => {
    const items = cart
      .map((item) => {
        const gustosText =
          item.gustos?.length > 0
            ? ` (${item.gustos.join(", ")})`
            : "";
        return `- ${item.title} x${item.quantity}${gustosText}`;
      })
      .join("\n");

    return `
Hola! Soy *${customer.name}* 👋

*Quiero hacer este pedido:*

${items}

*Total productos:* $${total}

*Pedido ID:* ${orderId}
    `.trim();
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;

    if (!isValidPhoneAR(customer.phone)) {
      setPhoneError("Ingresá un teléfono válido");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = await createOrder({
        cart,
        total,
        customer: {
          ...customer,
          phone: normalizePhoneAR(customer.phone),
        },
      });

      const encodedMessage = encodeURIComponent(
        buildWhatsappMessage(cart, total, orderId)
      );

      window.open(
        `https://api.whatsapp.com/send?phone=${BUSINESS_PHONE}&text=${encodedMessage}`,
        "_blank"
      );

      clearCart();
      setOrderSent(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && !orderSent) {
    return (
      <section className="carrito carrito--empty">
        <h2>Tu carrito está vacío</h2>
        <p>Agregá productos para continuar</p>
      </section>
    );
  }

  return (
    <section className="carrito">
      <header>
        <h2 className="carrito__title">Tu pedido</h2>
      </header>

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

      <footer className="carrito__footer">
        <div className="carrito__total">
          <span>
            Total productos <strong>${total}</strong>
          </span>

          <span className="carrito__shipping-badge">
            Envío desde $2.000
          </span>
        </div>

        <aside className="carrito__shipping-info">
          🚚 <strong>Envío:</strong> Dentro de los 4 bulevares el costo
          es de <strong>$2.000</strong>. Fuera de esa zona, el valor se
          ajusta según la distancia. <strong>SE CONFIRMA POR WHATSAPP.</strong>
        </aside>

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
            disabled={hasInvalidItems}
          >
            Confirmar pedido
          </button>
        </div>
      </footer>

      {isModalOpen && (
        <div
          className="carrito-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="carrito-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {!orderSent ? (
              <>
                <h3>Datos del pedido</h3>

                <div className="carrito-form">
                  <input
                    placeholder="Tu nombre"
                    value={customer.name}
                    onChange={(e) =>
                      setCustomer({ ...customer, name: e.target.value })
                    }
                  />
                  <input
                    placeholder="Tu teléfono"
                    value={customer.phone}
                    onChange={(e) => {
                      setCustomer({
                        ...customer,
                        phone: e.target.value,
                      });
                      setPhoneError("");
                    }}
                    onBlur={() =>
                      !isValidPhoneAR(customer.phone) &&
                      setPhoneError("Teléfono inválido")
                    }
                  />
                  {phoneError && (
                    <span className="form-error">{phoneError}</span>
                  )}
                </div>

                <div className="carrito-modal__actions">
                  <button
                    className="btn btn--secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Volver
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={handleConfirm}
                    disabled={isFormInvalid || isSubmitting}
                  >
                    Confirmar pedido
                  </button>
                </div>
              </>
            ) : (
              <div className="order-success">
                <h3>¡Pedido enviado! 🎉</h3>
                <p>Te contactamos por WhatsApp.</p>
                <Link to="/" className="btn btn--primary">
                  Volver al inicio
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Carrito;
