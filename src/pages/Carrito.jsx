import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import CartItem from "../components/CartItem";
import { createOrder } from "../services/orders.service";
import { normalizePhoneAR, isValidPhoneAR } from "../utils/phone";
import "../styles/Carrito.scss";

// 📞 TELÉFONO DEL NEGOCIO (WhatsApp destino)
const BUSINESS_PHONE = "5492477567514"; // SIN +, SIN espacios

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

  /* =====================
     ESC PARA CERRAR MODAL
  ===================== */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  /* =====================
     TOTAL
  ===================== */
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

  /* =====================
     WHATSAPP MESSAGE
  ===================== */
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

    return encodeURIComponent(
      `Hola! Soy ${customer.name} 👋

Quiero hacer este pedido:

${items}

Total: $${total}
Teléfono: ${customer.phone}`
    );
  };

  /* =====================
     CONFIRMAR PEDIDO
  ===================== */
  const handleConfirm = async () => {
    if (isSubmitting) return;

    if (!isValidPhoneAR(customer.phone)) {
      setPhoneError("Ingresá un teléfono válido");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedPhone = normalizePhoneAR(customer.phone);

      const orderId = await createOrder({
        cart,
        total,
        customer: {
          ...customer,
          phone: normalizedPhone,
        },
      });

      const message = buildWhatsappMessage(cart, total);

      // 👉 SIEMPRE abre WhatsApp del NEGOCIO
      window.open(
        `https://wa.me/${BUSINESS_PHONE}?text=${message}%0A%0APedido ID: ${orderId}`,
        "_blank"
      );

      clearCart();
      setOrderSent(true);
    } catch (error) {
      console.error("Error creando pedido", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =====================
     EMPTY STATE
  ===================== */
  if (cart.length === 0 && !orderSent) {
    return (
      <section className="carrito carrito--empty">
        <h2>Tu carrito está vacío</h2>
        <p>Agregá productos para continuar</p>
      </section>
    );
  }

  /* =====================
     RENDER
  ===================== */
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
            disabled={hasInvalidItems}
          >
            Confirmar pedido
          </button>
        </div>
      </div>

      {/* =============================
          MODAL
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
            {!orderSent ? (
              <>
                <h3>Datos del pedido</h3>

                <div className="carrito-form">
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={customer.name}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        name: e.target.value,
                      })
                    }
                  />

                  <input
                    type="tel"
                    placeholder="Tu teléfono"
                    value={customer.phone}
                    onChange={(e) => {
                      setCustomer({
                        ...customer,
                        phone: e.target.value,
                      });
                      setPhoneError("");
                    }}
                    onBlur={() => {
                      if (!isValidPhoneAR(customer.phone)) {
                        setPhoneError("Teléfono inválido");
                      }
                    }}
                  />

                  {phoneError && (
                    <span className="form-error">
                      {phoneError}
                    </span>
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
                    disabled={isSubmitting || isFormInvalid}
                  >
                    {isSubmitting
                      ? "Enviando..."
                      : "Confirmar pedido"}
                  </button>
                </div>
              </>
            ) : (
              <div className="order-success">
                <h3>¡Pedido enviado! 🎉</h3>
                <p>
                  Recibimos tu pedido y te contactamos por WhatsApp.
                </p>

                <Link
                  to="/"
                  className="btn btn--primary"
                  onClick={() => {
                    setOrderSent(false);
                    setIsModalOpen(false);
                    setCustomer({ name: "", phone: "" });
                  }}
                >
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
