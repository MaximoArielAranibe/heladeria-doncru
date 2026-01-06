import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/CategoriesCarousel.scss";

import { categories } from "../data/categories";

const ITEMS_PER_VIEW_MOBILE = 2;

const CategoriesCarousel = () => {
  const trackRef = useRef(null);
  const itemRef = useRef(null);

  const navigate = useNavigate();
  const { categoria } = useParams();

  const [activePage, setActivePage] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const totalPages = Math.ceil(
    categories.length / ITEMS_PER_VIEW_MOBILE
  );

  const scrollToPage = (pageIndex) => {
    const track = trackRef.current;
    const item = itemRef.current;
    if (!track || !item) return;

    const scrollX =
      item.offsetWidth * ITEMS_PER_VIEW_MOBILE * pageIndex;

    track.scrollTo({
      left: scrollX,
      behavior: "smooth",
    });

    setActivePage(pageIndex);
  };

  /* 📜 Sync scroll → dots (SIN RENDERS EN CASCADA) */
  useEffect(() => {
    const track = trackRef.current;
    const item = itemRef.current;
    if (!track || !item) return;

    const pageWidth =
      item.offsetWidth * ITEMS_PER_VIEW_MOBILE;

    const onScroll = () => {
      const page = Math.round(track.scrollLeft / pageWidth);

      setActivePage((prev) =>
        prev !== page ? page : prev
      );
    };

    track.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section className="categories">
      <div className="categories__track" ref={trackRef}>
        {categories.map((cat, index) => (
          <button
            key={cat.slug}
            ref={index === 0 ? itemRef : null}
            className={`categories__item ${
              activeIndex === index ? "is-active" : ""
            }`}
            onClick={() => {
              setActiveIndex(index);
              scrollToPage(
                Math.floor(index / ITEMS_PER_VIEW_MOBILE)
              );
              navigate(`/gustos/${cat.slug}`);
            }}
            aria-label={`Categoría ${cat.title}`}
          >
            <div className="categories__circle">
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
              />
            </div>

            <span className="categories__text">
              {cat.title}
            </span>
          </button>
        ))}
      </div>

      {/* DOTS MOBILE */}
      <div className="categories__dots">
        {Array.from({ length: totalPages }).map(
          (_, index) => (
            <button
              key={index}
              className={`categories__dot ${
                activePage === index ? "is-active" : ""
              }`}
              onClick={() => scrollToPage(index)}
              aria-label={`Página ${index + 1}`}
            />
          )
        )}
      </div>
    </section>
  );
};

export default CategoriesCarousel;
