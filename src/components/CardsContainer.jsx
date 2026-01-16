import "../styles/CardsContainer.scss";
import CardHorizontal from "./CardHorizontal";
import { useProducts } from "../hooks/useProducts";

const CardsContainer = () => {
  const { products, loading } = useProducts();

  if (loading) return <p>Cargando productos...</p>;

  // ✅ ORDENAR DE MENOR A MAYOR POR PRECIO
  const sortedProducts = [...products].sort(
    (a, b) => a.price - b.price
  );

  return (
    <div className="cards__container">
      {sortedProducts.map((product, index) => (
        <CardHorizontal
          key={product.id}
          product={product}
          title={product.title}
          price={product.price}
          thumbnail={product.thumbnail}
          isFeatured={index === 0}     // el más barato queda destacado
          imageRight={index % 2 !== 0}
        />
      ))}
    </div>
  );
};

export default CardsContainer;
