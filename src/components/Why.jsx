import '../styles/Why.scss';

const Why = () => {
  return (
    <section className="why">
      <h2 className="why__title">¿Por qué elegir Don Cru?</h2>

      <div className="why__items">
        <div className="why__item">
          <span className="why__icon">🍦</span>
          <h3>Helado artesanal</h3>
          <p>Hecho con dedicación y recetas propias.</p>
        </div>

        <div className="why__item">
          <span className="why__icon">⭐</span>
          <h3>Calidad en cada tamaño</h3>
          <p>Cuarto, medio o kilo. Siempre la misma cremosidad.</p>
        </div>

        <div className="why__item">
          <span className="why__icon">🤍</span>
          <h3>Ideal para compartir</h3>
          <p>Para disfrutar solo o con quien vos quieras.</p>
        </div>

        <div className="why__item">
          <span className="why__icon">📍</span>
          <h3>Negocio de barrio</h3>
          <p>Cercano, simple y con atención real.</p>
        </div>
      </div>
    </section>

  )
}

export default Why