import { useParams } from "react-router-dom";
import GustosSection from "../components/GustosSection";

const Gustos = () => {
  const { categoria } = useParams();

  return (
    <main>
      <GustosSection
        category={categoria ?? "todos"}
        title="Nuestros Sabores"
      />
    </main>
  );
};

export default Gustos;
