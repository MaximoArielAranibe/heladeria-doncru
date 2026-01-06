import "../styles/CardsContainer.scss";
import CardHorizontal from "./CardHorizontal";
import { products } from "../data/products";

const CardsContainer = () => {
  return (
    <div className="cards__container">
      {products.map((product, index) => (
        <CardHorizontal
          key={product.id}
          title={product.title}
          price={product.price}
          product={product}
          isFeatured={index === 0}
          imageRight={index % 2 !== 0}
        />
      ))}
    </div>
  );
};

export default CardsContainer;
