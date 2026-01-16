import CardVertical from "./CardVertical";
import "../styles/CardsVerticalContainer.scss";
import { useProducts } from "../hooks/useProducts";

export const CardsVerticalContainer = () => {
  const { products, loading } = useProducts();

  if (loading) return null;

  // 🔥 BEST SELLERS DESDE FIRESTORE
  const bestSellers = products.filter(
    (product) => product.masVendido === true
  );

  return (
    <div className="cards__vertical__container">
      {bestSellers.map((product) => (
        <CardVertical key={product.id} product={product} />
      ))}
    </div>
  );
};
