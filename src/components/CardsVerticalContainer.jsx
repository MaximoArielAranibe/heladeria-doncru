import CardVertical from "./CardVertical";
import "../styles/CardsVerticalContainer.scss";
import { products } from "../data/products";

export const CardsVerticalContainer = () => {
  // Filtramos el array para que solo contenga los productos con masVendido: true
  const bestSellers = products.filter((product) => product.masVendido === true);

  return (
    <div className="cards__vertical__container">
      {bestSellers.map((product) => (
        <CardVertical key={product.id} product={product} />
      ))}
    </div>
  );
};