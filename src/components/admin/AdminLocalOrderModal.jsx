import { useState, useMemo } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../../firebase/firebase";
import { useProducts } from "../../hooks/useProducts";
import { useGustos } from "../../hooks/useGustos";

import SelectGustosModal from "../SelectGustosModal";
import toast from "react-hot-toast";

import "../../styles/AdminLocalOrderModal.scss";

const AdminLocalOrderModal = ({ open, onClose }) => {
  const { products } = useProducts();
  const { gustos } = useGustos();

  /* =====================
     STATE
  ===================== */

  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [openGustos, setOpenGustos] = useState(false);

  const [payment, setPayment] = useState("efectivo");

  const [deliveryType, setDeliveryType] = useState("pickup"); // pickup | delivery
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingCost, setShippingCost] = useState("");

  /* =====================
     TOTALS
  ===================== */

  const productsTotal = useMemo(() => {
    return cart.reduce(
      (acc, i) => acc + i.price * i.quantity,
      0
    );
  }, [cart]);

  const shippingValue = Number(shippingCost) || 0;

  const total = useMemo(() => {
    return productsTotal + shippingValue;
  }, [productsTotal, shippingValue]);

  if (!open) return null;

  /* =====================
     CART
  ===================== */

  const addItem = (item) => {
    setCart((prev) => [...prev, item]);
  };

  const removeItem = (index) => {
    setCart((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  /* =====================
     CREATE ORDER
  ===================== */

  const handleCreate = async () => {

    if (cart.length === 0) {
      toast.error("Agregá productos");
      return;
    }

    // ✅ Validaciones envío
    if (deliveryType === "delivery") {

      if (!address.trim()) {
        toast.error("Ingresá la dirección");
        return;
      }

      if (!phone.trim()) {
        toast.error("Ingresá el teléfono");
        return;
      }

      if (!shippingCost || Number(shippingCost) <= 0) {
        toast.error("Ingresá costo de envío");
        return;
      }
    }

    try {

      const shipping =
        deliveryType === "delivery"
          ? Number(shippingCost)
          : 0;

      await addDoc(collection(db, "orders"), {

        customer: {
          name: "Venta local",
          phone:
            deliveryType === "delivery"
              ? phone
              : "",
          direction:
            deliveryType === "delivery"
              ? address
              : "Retiro en local",
        },

        items: cart,

        total: productsTotal,

        totalWithShipping:
          deliveryType === "delivery"
            ? total
            : null,

        payment: {
          method: payment,
          status: "paid",
          paidBy: auth.currentUser?.email,
          paidAt: serverTimestamp(),
        },

        shipping: {
          final: shipping,
          sentBy:
            shipping > 0
              ? auth.currentUser?.email
              : null,
          sentAt:
            shipping > 0
              ? serverTimestamp()
              : null,
        },

        deliveryType,

        archived: false,

        status:
          deliveryType === "delivery"
            ? "cost_send"
            : "pending",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Pedido creado 🏪");

      // ✅ RESET
      setCart([]);
      setAddress("");
      setPhone("");
      setShippingCost("");
      setDeliveryType("pickup");
      setPayment("efectivo");

      onClose();

    } catch (err) {
      console.error(err);
      toast.error("Error creando pedido");
    }
  };

  /* =====================
     UI
  ===================== */

  return (
    <div className="admin-local-backdrop">

      <div className="admin-local-modal">

        <h3>🏪 Pedido en local</h3>

        {/* PRODUCTS */}

        <div className="local-products">

          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => {

                // 👉 Sin gustos
                if (!p.maxGustos || p.maxGustos === 0) {

                  addItem({
                    ...p,
                    gustos: [],
                    quantity: 1,
                  });

                  toast.success("Producto agregado 🛒");
                  return;
                }

                // 👉 Con gustos
                setSelectedProduct(p);
                setOpenGustos(true);
              }}
            >
              {p.title}
            </button>
          ))}

        </div>

        {/* CART */}

        <div className="local-cart">

          <h4>🛒 Carrito</h4>

          {cart.length === 0 && <p>Vacío</p>}

          {cart.map((item, i) => (
            <div key={i} className="cart-row">

              <span>
                {item.title} x{item.quantity}
              </span>

              <small>
                🍦{" "}
                {item.gustos
                  .map((id) =>
                    gustos.find(
                      (g) => g.id === id
                    )?.name
                  )
                  .join(", ")}
              </small>

              <button onClick={() => removeItem(i)}>
                ✖
              </button>

            </div>
          ))}

        </div>

        {/* DELIVERY TYPE */}

        <div className="local-delivery">

          <select
            value={deliveryType}
            onChange={(e) =>
              setDeliveryType(e.target.value)
            }
          >
            <option value="pickup">
              🏪 Retiro en local
            </option>

            <option value="delivery">
              🚚 Envío a domicilio
            </option>
          </select>

        </div>

        {/* DELIVERY FORM */}

        {deliveryType === "delivery" && (

          <div className="local-delivery-form">

            <input
              type="text"
              placeholder="📍 Dirección"
              value={address}
              onChange={(e) =>
                setAddress(e.target.value)
              }
            />

            <input
              type="tel"
              placeholder="📞 Teléfono"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
            />

            <div className="shipping-row">

              <select
                value={shippingCost}
                onChange={(e) =>
                  setShippingCost(e.target.value)
                }
              >
                <option value="">
                  Costo Envío 🚚
                </option>

                {[2000, 2500, 3000, 4000, 4500, 5000].map(
                  (v) => (
                    <option key={v} value={v}>
                      ${v}
                    </option>
                  )
                )}

              </select>

              <input
                type="number"
                min="0"
                placeholder="Comentarios adicionales"
                value={shippingCost}
                onChange={(e) =>
                  setShippingCost(e.target.value)
                }
              />

            </div>

          </div>
        )}

        {/* PAYMENT */}
        <div className="local-delivery">

          <select
            className="payment__select"
            value={payment}
            onChange={(e) =>
              setPayment(e.target.value)
            }
          >
            <option value="efectivo">
              💵 Efectivo
            </option>

            <option value="transferencia">
              💳 Transferencia
            </option>
          </select>
        </div>

        {/* TOTAL */}

        <p className="local-total">
          Total: <b>${total}</b>
        </p>

        {/* ACTIONS */}

        <div className="local-actions">

          <button
            className="btn btn--secondary"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="btn btn--primary"
            onClick={handleCreate}
          >
            Crear pedido
          </button>

        </div>

      </div>

      {/* GUSTOS MODAL */}

      <SelectGustosModal
        product={selectedProduct}
        open={openGustos}
        onClose={() => setOpenGustos(false)}
        onConfirm={(item) => {
          addItem(item);
          setOpenGustos(false);
        }}
      />

    </div>
  );
};

export default AdminLocalOrderModal;
