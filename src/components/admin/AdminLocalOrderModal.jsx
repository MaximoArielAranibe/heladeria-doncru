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

  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [openGustos, setOpenGustos] =
    useState(false);

  const [payment, setPayment] =
    useState("efectivo");

  const total = useMemo(() => {
    return cart.reduce(
      (acc, i) => acc + i.price * i.quantity,
      0
    );
  }, [cart]);

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

    try {
      await addDoc(collection(db, "orders"), {
        customer: {
          name: "Venta local",
          phone: "",
          direction: "",
        },

        items: cart,

        total,

        payment: {
          method: payment,
          status: "paid",
          paidBy: auth.currentUser?.email,
          paidAt: serverTimestamp(),
        },

        shipping: {
          final: 0,
        },

        deliveryType: "pickup",

        archived: false,

        status: "pending",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Pedido creado 🏪");

      setCart([]);
      onClose();

    } catch (err) {
      console.error(err);
      toast.error("Error creando pedido");
    }
  };

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

                // 👉 Si NO tiene gustos (ej: postres)
                if (!p.maxGustos || p.maxGustos === 0) {
                  addItem({
                    ...p,
                    gustos: [],
                    quantity: 1,
                  });

                  toast.success("Producto agregado 🛒");
                  return;
                }

                // 👉 Si TIENE gustos (helados)
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

          {cart.length === 0 && (
            <p>Vacío</p>
          )}

          {cart.map((item, i) => (
            <div key={i} className="cart-row">

              <span>
                {item.title} x{item.quantity}
              </span>

              <small>
                🍦 {item.gustos
                  .map((id) =>
                    gustos.find(
                      (g) => g.id === id
                    )?.name
                  )
                  .join(", ")}
              </small>

              <button
                onClick={() => removeItem(i)}
              >
                ✖
              </button>

            </div>
          ))}

        </div>

        {/* PAYMENT */}

        <select
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
