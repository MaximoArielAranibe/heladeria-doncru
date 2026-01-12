import { useAuth } from "../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <section>
      <h2>Panel Admin</h2>
      <p>Logueado como: {user.email}</p>

      <button onClick={() => navigate("/admin/pedidos")}>
        Ver pedidos
      </button>

      <button onClick={handleLogout}>Cerrar sesión</button>
    </section>
  );
};

export default AdminDashboard;
