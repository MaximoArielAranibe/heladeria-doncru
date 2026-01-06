import "../styles/Footer.scss";
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
            <li><a href="#productos">Productos</a></li>
            <li><a href="#gustos">Gustos</a></li>
            <li><a href="#postres">Postres</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ul>
        </div>

        {/* Contacto */}
        <div className="footer__contact">
          <h4>Contacto</h4>
          <p>📍 Pergamino, Buenos Aires</p>
          <p>📞 +54 9 2477-361535</p>
          <p>🕒 Todos los días 20:00 a 02:00 hs</p>
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
