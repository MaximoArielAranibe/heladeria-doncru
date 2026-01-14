import './styles/normalize.css'
import './styles/App.scss'

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Gustos from './pages/Gustos.jsx'
import WhatsAppButton from './components/WhatsAppButton.jsx'
import ScrollToTop from './components/ScrollTopTop.jsx'
import { CartProvider } from './context/CartContext.jsx'
import Carrito from './pages/Carrito.jsx'
import Tamaños from './pages/Tamaños.jsx'
import { AuthProvider } from "./context/AuthProvider.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import Orders from './components/admin/Orders.jsx';



function App() {
  return (
    <CartProvider>
      <AuthProvider>

        <BrowserRouter>
          <ScrollToTop />
          <Navbar />
          <WhatsAppButton />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gustos" element={<Gustos />} />
            <Route path="/gustos/:categoria" element={<Gustos />} />
            <Route path="/tamaños" element={<Tamaños />} />
            <Route path="/carrito" element={<Carrito />} />
            <Route path="/admin/login" element={<AdminLogin />} />

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
            </Route>

          </Routes>

          <Footer />

          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 2200,
              style: {
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: '#111',
                borderRadius: '16px',
                padding: '12px 16px',
                fontWeight: 600,
                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              },
              success: {
                iconTheme: {
                  primary: '#16a34a',
                  secondary: '#ecfdf5',
                },
              },
              error: {
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#fee2e2',
                },
              },
            }}
          />

        </BrowserRouter>
      </AuthProvider>
    </CartProvider>
  )
}

export default App
