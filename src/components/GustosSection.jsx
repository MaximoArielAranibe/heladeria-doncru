import "../styles/ProductsSection.scss";
import { gustos } from "../data/gustos";

const GustosSection = ({ category = "todos", title }) => {
  const filteredGustos =
    category === "todos"
      ? gustos
      : gustos.filter(
          (gusto) => gusto.category === category
        );

  return (
    <section className="products">
      <header className="products__header">
        <h2 className="products__title">{title}</h2>
        <p className="products__subtitle">
          Elegí tu sabor favorito
        </p>
      </header>

      <div className="products__list">
        {filteredGustos.map((gusto) => (
          <div key={gusto.id} className="gusto-card">
            {gusto.name}
          </div>
        ))}
      </div>
    </section>
  );
};

export default GustosSection;
