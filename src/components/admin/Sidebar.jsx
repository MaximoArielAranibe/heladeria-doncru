import { NavLink } from "react-router-dom";
import "../../styles/Sidebar.scss";

const Sidebar = () => {
  return (
    <aside className="admin-sidebar">
      <h1 className="admin-sidebar__logo">Admin</h1>

      <nav className="admin-sidebar__nav">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          📊 Dashboard
        </NavLink>

        <NavLink
          to="/admin/pedidos"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          🧾 Pedidos
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
