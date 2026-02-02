import { useContext, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import CartItem from "../components/CartItem";
import { createOrder } from "../services/orders.service";
import { normalizePhoneAR, isValidPhoneAR } from "../utils/phone";
import "../styles/Carrito.scss";
import { useGustos } from "../hooks/useGustos";

const BUSINESS_PHONE = "5492477361535";

/* =====================
   ZONAS DE ENVÍO
===================== */

const SHIPPING_ZONES = {
  centro: { label: "Dentro de los 4 bulevares", price: 2000 },
  media: { label: "Zona intermedia", price: 2500 },
  lejana: { label: "Zona lejana", price: 3000 },
  muylejana: { label: "Zona muy lejana", price: null },
};

const Carrito = () => {
  const { cart, removeFromCart, clearCart, updateQuantity } =
    useContext(CartContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const { gustos } = useGustos();
  const [envio, setEnvio] = useState("conenvio");
  const [comments, setComments] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo")

  const handleEnvio = (e) => {
    setEnvio(e.target.value);
  }


  const nameRef = useRef("");
  const directionRef = useRef("");
  const phoneRef = useRef("");

  const [zone, setZone] = useState("centro");

  const getGustoName = (id) => {
    return gustos.find((g) => g.id === id)?.name || "Desconocido";
  };


  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setIsModalOpen(false);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const total = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const shippingEstimated = SHIPPING_ZONES[zone]?.price ?? null;

  const hasInvalidItems = cart.some(
    (item) =>
      item.category !== "postres" &&
      (!item.gustos || item.gustos.length === 0)
  );


  const buildWhatsappMessage = (orderId) => {
    const items = cart
      .map((item) => {
        const gustosText = item.gustos?.length
          ? ` (${item.gustos
            .map((id) => getGustoName(id))
            .join(", ")})`
          : "";

        return `- ${item.title} x${item.quantity}${gustosText}`;
      })
      .join("\n");

    return `
  *Pedido ID:* ${orderId}

  Hola! Soy *${nameRef.current}* 👋

  Dirección: *${directionRef.current}*
  Zona estimada: *${SHIPPING_ZONES[zone].label}*

  ${comments
        ? `\n📝 *Comentarios adicionales:*\n${comments}\n`
        : ""
      }


  *Pedido:*
  ${items}

  Productos: $${total}
  Envío estimado: ${shippingEstimated !== null ? `$${shippingEstimated}` : "A confirmar"
      }

  *El costo de envío te lo confirmamos en breve!!*
    `.trim();
  };


  const handleConfirm = async () => {
    if (isSubmitting) return;

    if (!isValidPhoneAR(phoneRef.current)) {
      setPhoneError("Ingresá un teléfono válido");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = await createOrder({
        cart,
        total,
        customer: {
          name: nameRef.current,
          direction: directionRef.current,
          phone: normalizePhoneAR(phoneRef.current),
        },
        shipping: {
          estimated: shippingEstimated,
          zone,
        },
        payment: paymentMethod,
        comments: comments || "",
      });

      window.open(
        `https://api.whatsapp.com/send?phone=${BUSINESS_PHONE}&text=${encodeURIComponent(
          buildWhatsappMessage(orderId)
        )}`,
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

      <footer className="carrito__footer">
        <div className="carrito__total">
          <span>
            Productos <strong>${total}</strong>
          </span>
          <span>
            Envío estimado{" "}
            <strong>
              {shippingEstimated !== null
                ? `$${shippingEstimated}`
                : "A confirmar"}
            </strong>
          </span>
        </div>

        <aside className="carrito__shipping-info">
          🚚 <strong>Te pasamos el costo del envío en breve.</strong>
        </aside>

        <div className="carrito__actions">
          <button className="btn btn--secondary" onClick={clearCart}>
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
        <div className="carrito-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="carrito-modal" onClick={(e) => e.stopPropagation()}>
            {!orderSent ? (
              <>
                <h3>Datos del pedido</h3>
                <p> 🚚 <strong>Envío:</strong> Dentro de los 4 bulevares el costo es de <strong>$2.000</strong>. Fuera de esa zona, el valor se ajusta según la distancia. <strong>SE CONFIRMA POR WHATSAPP.</strong></p>

                <div className="carrito-form">
                  <input placeholder="Tu nombre" onBlur={(e) => (nameRef.current = e.target.value)} />
                  <input
                    placeholder="Tu teléfono"
                    onBlur={(e) => {
                      phoneRef.current = e.target.value;
                      setPhoneError("");
                    }}
                  />
                  {envio === "conenvio" && (<input placeholder="Tu dirección" onBlur={(e) => (directionRef.current = e.target.value)} />)}

                  <textarea maxLength={200} placeholder="Comentarios adicionales (ej: Porton negro, timbre roto, llamar antes, etc.)" rows={3} onChange={(e) => setComments(e.target.value)} />
                  <small>{comments.length}/200</small>

                  <div className="carrito-radiobuttons-container">
                    <div>
                      <input
                        type="radio"
                        id="envio"
                        name="envio-sinenvio"
                        value="conenvio"
                        onChange={handleEnvio}
                        checked={envio === "conenvio"} />
                      <label htmlFor="envio">Con envío</label>
                    </div>
                    <div>
                      <input
                        type="radio"
                        id="sinenvio"
                        name="envio-sinenvio"
                        value="sinenvio"
                        onChange={handleEnvio}
                        checked={envio === "sinenvio"} />
                      <label htmlFor="sinenvio">Paso a retirar</label>
                    </div>
                  </div>

                  <div className="carrito-payment-method">
  <p><strong>Forma de pago</strong></p>

  <div className="carrito-radiobuttons-container">
    <div>
      <input
        type="radio"
        id="efectivo"
        name="payment"
        value="efectivo"
        checked={paymentMethod === "efectivo"}
        onChange={(e) => setPaymentMethod(e.target.value)}
      />
      <label htmlFor="efectivo">💵 Efectivo</label>
    </div>

    <div>
      <input
        type="radio"
        id="transferencia"
        name="payment"
        value="transferencia"
        checked={paymentMethod === "transferencia"}
        onChange={(e) => setPaymentMethod(e.target.value)}
      />
      <label htmlFor="transferencia">💳 Transferencia</label>
    </div>
  </div>
</div>


                  {envio === "conenvio" && (
                    <div className="">

                      <p>Elige una zona aproximada</p>
                      <select value={zone} onChange={(e) => setZone(e.target.value)}>
                        <option value="centro">Dentro de los 4 bulevares ($2000)</option>
                        <option value="media">Zona intermedia ($2500)</option>
                        <option value="lejana">Zona lejana ($3000)</option>
                        <option value="muylejana">Zona muy lejana</option>
                      </select>
                    </div>
                  )}


                  {phoneError && <span className="form-error">{phoneError}</span>}
                </div>

                <div className="carrito-modal__actions">
                  <button className="btn btn--secondary" onClick={() => setIsModalOpen(false)}>
                    Volver
                  </button>
                  <button className="btn btn--primary" onClick={handleConfirm}>
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
