import { createPortal } from "react-dom";
import "../styles/Modal.scss";

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ❌ BOTÓN CERRAR */}
        <button
          className="modal__close"
          onClick={onClose}
          aria-label="Cerrar modal"
        >
          ×
        </button>

        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
