import CardVertical from "./CardVertical";
import "../styles/CardsVerticalContainer.scss";
import { products } from "../data/products";
import { useParams } from "react-router-dom";

export const CardsVerticalContainer = () => {
  const { categoria } = useParams(); // 👈 viene de la URL

  const filteredProducts =
    !categoria || categoria === "todos"
      ? products
      : products.filter(
          (product) => product.category === categoria
        );

  return (
    <div className="cards__vertical__container">
      {filteredProducts.map((product) => (
        <CardVertical key={product.id} product={product} />
      ))}
    </div>
  );
};
