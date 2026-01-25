import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import BrandContainer from '../components/BrandContainer';
import Text from '../components/Text';
import CategoriesCarousel from '../components/CategoriesCarousel';
import CardsContainer from '../components/CardsContainer';
import { CardsVerticalContainer } from '../components/CardsVerticalContainer';
import Why from '../components/why';
import CTA from '../components/CTA';
import CreateProductModal from '../components/admin/CreateProductModal';

const Home = () => {
  const { role, loading } = useAuth();

  // 🔽 Hook SIEMPRE primero
  const [open, setOpen] = useState(false);

  // 🔽 Después condiciones
  if (loading) {
    return <p>Cargando sesión...</p>;
  }


  const isAdmin = role === "admin";

  return (
    <main className="main">
      <BrandContainer />

      <section>
        <Text text="nuestros productos" />

        {isAdmin && (
          <button
            className="btn btn--primary"
            style={{ marginLeft: "9rem", marginTop: "1rem" }}
            onClick={() => setOpen(true)}
          >
            + Crear producto
          </button>
        )}

        <CreateProductModal
          open={open}
          onClose={() => setOpen(false)}
          defaultCategory="tamaños"
        />

        <CardsContainer category="tamaños" />
      </section>

      <Text text="nuestros sabores" />
      <CategoriesCarousel />
      <Text text="🌟 LOS MÁS PEDIDOS 🌟" />
      <CardsVerticalContainer />
      <Why />
      <CTA />
    </main>
  );
};
export default Home;
