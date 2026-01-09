import './styles/normalize.css'
import './styles/App.scss'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx';
import Gustos from './pages/Gustos.jsx';
import WhatsAppButton from './components/WhatsAppButton.jsx';
import ScrollToTop from './components/ScrollTopTop.jsx';
import { CartProvider } from './components/context/CartContext.jsx';
import Carrito from './pages/Carrito.jsx';
function App() {

  return (
    <>
      <CartProvider>
        <BrowserRouter>

          <ScrollToTop />
          <Navbar />
          <WhatsAppButton />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gustos" element={<Gustos />} />
            <Route path="/gustos/:categoria" element={<Gustos />} />
            <Route path="/carrito" element={<Carrito />} />
          </Routes>

          <Footer />
        </BrowserRouter>
      </CartProvider>

    </>
  )
}

export default App
