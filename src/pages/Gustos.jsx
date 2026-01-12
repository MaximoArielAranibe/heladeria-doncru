import { useParams } from "react-router-dom";
import GustosSection from "../components/GustosSection";

const Gustos = () => {
  const { categoria } = useParams();

  return (
    <main>
      <GustosSection
        category={categoria ?? "todos"}
        title={
          categoria
            ? `Sabores de ${categoria.replace("-", " ")}`
            : "Todos nuestros gustos"
        }
      />
    </main>
  );
};

export default Gustos;
