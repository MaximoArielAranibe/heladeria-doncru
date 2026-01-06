import React from 'react';
import BrandContainer from '../components/BrandContainer';
import Text from '../components/Text';
import CategoriesCarousel from '../components/CategoriesCarousel';
import CardsContainer from '../components/CardsContainer';
import { CardsVerticalContainer } from '../components/CardsVerticalContainer';
import Why from '../components/why';
import CTA from '../components/CTA';

const Home = () => {
  return (
    <main className='main'>
      <BrandContainer />

      <Text text='nuestros productos' />
      <CardsContainer />
      <Text text='nuestros sabores' />
      <CategoriesCarousel />
      {/*         <Text text='es un antojo chiquitito?' />
 */}        <Text text='🌟 EL MÁS PEDIDO 🌟' />
      <CardsVerticalContainer />
      <Why />
      <CTA />
    </main>
  )
}

export default Home