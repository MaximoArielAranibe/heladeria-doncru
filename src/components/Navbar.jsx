import { useState } from "react";
import "../styles/Navbar.scss";
import cartIcon from "../assets/cart.svg";
import logo from "../assets/logo-desktop.svg";
import { Link, useLocation } from "react-router-dom";
import HideForAdmin from "./common/HideForAdmin";
import { useAuth } from "../hooks/useAuth";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, role } = useAuth();
  const { pathname } = useLocation();

  const handleLogoClick = () => {
    setIsOpen(false);

    // 👉 Si ya estoy en home, solo scrolleo
    if (pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <header
        className={`navbar
          ${isOpen ? "is-open" : ""}
          ${user && role === "admin" ? "is-admin" : ""}
        `}
      >
        {/* Fila Superior */}
        <div className="navbar__main">
          <Link
            to="/"
            className="navbar__logo"
            onClick={handleLogoClick}
          >
            <img src={logo} alt="Heladería Don Cru" />
          </Link>

          <div className="navbar__buttons">
            <div className="navbar__buttons__cart">
              <Link to="/carrito" onClick={handleLinkClick}>
                <img src={cartIcon} alt="Carrito" />
              </Link>
            </div>

            <div
              className={`navbar__buttons__burger ${
                isOpen ? "is-active" : ""
              }`}
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
            <li>
              <Link to="/" onClick={handleLinkClick}>Inicio</Link>
            </li>
            <li>
              <Link to="/gustos" onClick={handleLinkClick}>Gustos</Link>
            </li>
            <li>
              <Link to="/tamaños" onClick={handleLinkClick}>Tamaños</Link>
            </li>
            <li>
              <Link to="/postres" onClick={handleLinkClick}>Postres</Link>
            </li>
            <li>
              <Link to="/contacto" onClick={handleLinkClick}>Contacto</Link>
            </li>

            {user && role === "admin" && (
              <li className="navbar__menu__admin">
                <Link to="/admin" onClick={handleLinkClick}>
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </header>

      {/* Franja info solo para usuarios */}
      <HideForAdmin>
        <div className="navbar__info">
          <p className="navbar__info__text">
            ❄️ Helado artesanal · Entrega en 20–30 min
          </p>
        </div>
      </HideForAdmin>
    </>
  );
};

export default Navbar;
