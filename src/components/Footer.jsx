import "../styles/Footer.scss";
import { Link } from "react-router-dom";
import logo from "../assets/logo-desktop.svg";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__container">

        {/* Logo + descripción */}
        <div className="footer__brand">
          <img src={logo} alt="Heladería Don Cru" />
          <p>
            Helado artesanal hecho con ingredientes reales.
            Entregas rápidas en tu barrio.
          </p>
        </div>

        {/* Links */}
        <div className="footer__links">
          <h4>Secciones</h4>
          <ul>
            <li><Link to="/gustos">Gustos</Link></li>
            <li><Link to="/tamaños">Tamaños</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
          </ul>
        </div>

        {/* Contacto */}
        <div className="footer__contact">
          <h4>Contacto</h4>
          <p>📍 Pergamino, Buenos Aires</p>
          <p>📞 +54 9 2477-361535</p> {/* Link */}
          <p>📞 +54 9 2477-349023</p> {/* Link */}
          <p>🕒 Todos los días</p>
          <p>☀️<strong> 12:00hs a 17:30hs</strong></p>
          <p>🌙<strong>19:00hs a 00:30h</strong></p>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer__bottom">
        <p>© 2025 Don Cru — Todos los derechos reservados</p>
      </div>
    </footer>
  );
};

export default Footer;
