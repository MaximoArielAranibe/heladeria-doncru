import React, { useState } from 'react';
import BrandContainer from '../components/BrandContainer';
import Text from '../components/Text';
import CategoriesCarousel from '../components/CategoriesCarousel';
import CardsContainer from '../components/CardsContainer';
import { CardsVerticalContainer } from '../components/CardsVerticalContainer';
import Why from '../components/why';
import CTA from '../components/CTA';
import CreateProductModal from '../components/admin/CreateProductModal';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [open, setOpen] = useState(false);
  return (
    <main className='main'>
      <BrandContainer />
      <section>
        <Text text='nuestros productos' />

          {isAdmin && (
            <button className="btn btn--primary btn--addProduct" onClick={() => setOpen(true)}>
              + Agregar producto
            </button>
          )}

          <CreateProductModal
            open={open}
            onClose={() => setOpen(false)}
          />

        <CardsContainer />
      </section>
      <Text text='nuestros sabores' />
      <CategoriesCarousel />
      <Text text='🌟 LOS MÁS PEDIDOS 🌟' />
      <CardsVerticalContainer />
      <Why />
      <CTA />
    </main>
  )
}

export default Home