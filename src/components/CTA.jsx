import "../styles/CTA.scss";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="cta">
      <div className="cta__content">
        <h2 className="cta__title">
          El momento ideal para un buen helado
        </h2>

        <p className="cta__text">
          Elegí el tamaño perfecto y disfrutá como más te gusta.
        </p>

        <Link to="/tamaños" className="cta__button">
          Ver tamaños
        </Link>
      </div>
    </section>
  );
};

export default CTA;
