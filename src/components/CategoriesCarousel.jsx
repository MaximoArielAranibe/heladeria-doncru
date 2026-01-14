import {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
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

  const activeIndex = useMemo(() => {
    const index = categories.findIndex(
      (cat) => cat.slug === categoria
    );
    return index !== -1 ? index : 0;
  }, [categoria]);

  const totalPages = Math.ceil(
    categories.length / ITEMS_PER_VIEW_MOBILE
  );

  const scrollToPage = useCallback((pageIndex) => {
    const track = trackRef.current;
    const item = itemRef.current;
    if (!track || !item) return;

    track.scrollTo({
      left:
        item.offsetWidth *
        ITEMS_PER_VIEW_MOBILE *
        pageIndex,
      behavior: "smooth",
    });
  }, []);

  /* Scroll automático según URL */
  useEffect(() => {
    scrollToPage(
      Math.floor(activeIndex / ITEMS_PER_VIEW_MOBILE)
    );
  }, [activeIndex, scrollToPage]);

  /* Scroll → dots */
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

    return () =>
      track.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="categories">
      <div className="categories__track" ref={trackRef}>
        {categories.map((cat, index) => (
          <button
            key={cat.slug}
            ref={index === 0 ? itemRef : null}
            className={`categories__item ${
              index === activeIndex ? "is-active" : ""
            }`}
            onClick={() =>
              navigate(`/gustos/${cat.slug}`)
            }
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

      <div className="categories__dots">
        {Array.from({ length: totalPages }).map(
          (_, index) => (
            <button
              key={index}
              className={`categories__dot ${
                activePage === index ? "is-active" : ""
              }`}
              onClick={() => scrollToPage(index)}
            />
          )
        )}
      </div>
    </section>
  );
};

export default CategoriesCarousel;
