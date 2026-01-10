import React from 'react'
import "../styles/CardsContainer.scss";
import CardHorizontal from "../components/CardHorizontal";
import { products } from "../data/products";

const Tamaños = () => {
  return (

    <div className="cards__container">
      {products.map((product, index) => (
        <CardHorizontal
          key={product.id}
          title={product.title}
          price={product.price}
          thumbnail={product.thumbnail}
          product={product}
          isFeatured={index === 0}
          imageRight={index % 2 !== 0}
        />
      ))}
    </div>

  )
}

export default Tamaños