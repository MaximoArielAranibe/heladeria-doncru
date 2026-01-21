import CardVertical from "./CardVertical";
import "../styles/ProductsSection.scss";
import { products } from "../data/products";

const ProductsSection = ({ category = "todos", title }) => {
  const filteredProducts =
    category === "todos"
      ? products
      : products.filter(
          (product) => product.category === category
        );

  return (
    <section className="products">
      <header className="products__header">
        <h2 className="products__title">{title}</h2>
        <p className="products__subtitle">
          Elegí el tamaño del helado
        </p>
      </header>

      <div className="products__list">
        {filteredProducts.map((product) => (
          <CardVertical
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </section>
  );
};

export default ProductsSection;
