import "./styles/normalize.css";
import "./styles/App.scss";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Gustos from "./pages/Gustos.jsx";
import WhatsAppButton from "./components/WhatsAppButton.jsx";
import ScrollToTop from "./components/ScrollTopTop.jsx";
import Carrito from "./pages/Carrito.jsx";
import Tamaños from "./pages/Tamaños.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import Orders from "./components/admin/Orders.jsx";
import AdminArchivedOrders from "./components/admin/AdminArchiviedOrders.jsx";
import AdminStock from "./components/admin/AdminStock.jsx";
import Postres from "./pages/Postres.jsx";
import { useAuth } from "./hooks/useAuth.js";

function App() {
  const { role, loading } = useAuth();
  if (loading) return null; // o spinner
  const isAdmin = role === "admin";

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />

      {/* 👉 mostrar WhatsApp SOLO si NO es admin */}
      {!isAdmin && <WhatsAppButton />}

      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Home />} />
        <Route path="/gustos" element={<Gustos />} />
        <Route path="/gustos/:categoria" element={<Gustos />} />
        <Route path="/tamaños" element={<Tamaños />} />
        <Route path="/postres" element={<Postres />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="pedidos" element={<Orders />} />
          <Route path="orders/archived" element={<AdminArchivedOrders />} />
          <Route path="stock" element={<AdminStock />} />
        </Route>
      </Routes>

      <Footer />

      <Toaster position="bottom-center" />
    </BrowserRouter>
  );
}

export default App;
