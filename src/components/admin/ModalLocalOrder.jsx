import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import toast from "react-hot-toast";
import "../../styles/ModalLocalOrder.scss";

const ModalLocalOrder = ({ open, onClose }) => {
  const [name, setName] = useState("");
  const [total, setTotal] = useState("");
  const [payment, setPayment] = useState("efectivo");
  const [comments, setComments] = useState("");

  if (!open) return null;

  const handleCreate = async () => {
    if (!name || !total) {
      toast.error("Completá nombre y total");
      return;
    }

    try {
      await addDoc(collection(db, "orders"), {
        customer: {
          name,
          phone: "",
          direction: "Retiro en local",
        },

        items: [],

        total: Number(total),

        payment: {
          method: payment,
          status: "paid",
          paidBy: auth.currentUser?.email || "Admin",
          paidAt: serverTimestamp(),
        },

        shipping: {
          final: 0,
        },

        comments,

        status: "pending",

        delivery: "local",

        archived: false,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Pedido creado ✔");

      setName("");
      setTotal("");
      setComments("");

      onClose();

    } catch (err) {
      console.error(err);
      toast.error("Error al crear pedido");
    }
  };

  return (
    <div className="modal-local-backdrop">

      <div className="modal-local">

        <h3>🛍 Pedido en local</h3>

        <input
          placeholder="Nombre cliente"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Total $"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />

        <select
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
        >
          <option value="efectivo">💵 Efectivo</option>
          <option value="transferencia">💳 Transferencia</option>
        </select>

        <textarea
          placeholder="Comentarios"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />

        <div className="modal-local__actions">

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
    </div>
  );
};

export default ModalLocalOrder;
