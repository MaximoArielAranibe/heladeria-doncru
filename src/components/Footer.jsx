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
          <p>📞 <a href="tel:+5492477361535">+54 9 2477-361535</a></p>
          <p>📞 <a href="tel:+5492477349023">+54 9 2477-349023</a></p>
          <p>🕒 Todos los días</p>
          <p>☀️ <strong>10:30am a 01:30am🌙</strong></p>
          <p><strong>📍 Blvd. Almafuerte 718.</strong> Pergamino, Buenos Aires.</p>
        </div>
      </div>

      {/* MAPA */}
      <div className="footer__map">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4684.491525214265!2d-60.58302593813583!3d-33.878430422366705!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95b9cb0014ef18d1%3A0xee50fb39f4042de7!2sHELADOS%20DONCRU!5e0!3m2!1ses-419!2sar!4v1769115741718!5m2!1ses-419!2sar"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          title="Mapa Heladería Don Cru"
        />
      </div>

      {/* Copyright */}
      <div className="footer__bottom">
        <p>© 2025 Don Cru — Todos los derechos reservados</p>
      </div>
    </footer>
  );
};

export default Footer;
