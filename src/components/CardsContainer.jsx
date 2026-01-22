import "../styles/CardsContainer.scss";
import CardHorizontal from "./CardHorizontal";
import { useProducts } from "../hooks/useProducts";

const CardsContainer = ({ category }) => {
  const { products, loading } = useProducts();

  if (loading) {
    return (
      <div className="cards__container cards__container--loading">
        <div className="loader">
          <span className="spinner" />
          <p>Cargando productos...</p>
        </div>
      </div>
    );
  }

  /* =====================
     FILTRO POR CATEGORÍA (SI EXISTE)
  ===================== */
  const filteredProducts = category
    ? products.filter(
        (product) => product.category === category
      )
    : products;

  /* =====================
     ORDENAR POR PRECIO
  ===================== */
  const sortedProducts = [...filteredProducts].sort(
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
          isFeatured={index === 0}
          imageRight={index % 2 !== 0}
        />
      ))}
    </div>
  );
};

export default CardsContainer;
