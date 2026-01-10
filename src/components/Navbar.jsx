import { useState } from "react";
import "../styles/Navbar.scss";
import cartIcon from "../assets/cart.svg";
import logo from "../assets/logo-desktop.svg";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className={`navbar ${isOpen ? "is-open" : ""}`}>
        {/* Fila Superior */}
        <div className="navbar__main">
          <Link to='/' className="navbar__logo">
            <img src={logo} alt="Heladería Don Cru" />
          </Link>

          <div className="navbar__buttons">
            <div className="navbar__buttons__cart">
              <Link to='/carrito'>
                <img src={cartIcon} alt="Carrito" />
              </Link>
            </div>

            <div
              className={`navbar__buttons__burger ${isOpen ? "is-active" : ""}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              <button
                className="navbar__buttons__burger__button"
                aria-label="Menú"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>

        {/* Menú Rosa */}
        <nav className={`navbar__menu ${isOpen ? "is-active" : ""}`}>
          <ul className="navbar__menu__list">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/gustos/todos">Gustos</Link></li>
            {/*             <li><Link to="/postres">Postres</Link></li> */}
            <li><Link to="/tamaños">Tamaños</Link></li>
            <li><Link to="/contacto">Contacto</Link></li>
          </ul>
        </nav>
      </header>

      {/* 👉 NUEVA FRANJA INFO */}
      <div className="navbar__info">
        <p className="navbar__info__text">
          ❄️ Helado artesanal · Entrega en 20–30 min
        </p>
      </div>
    </>
  );
};

export default Navbar;
