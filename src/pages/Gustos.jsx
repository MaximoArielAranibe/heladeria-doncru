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
            : "Todos los sabores"
        }
      />
    </main>
  );
};

export default Gustos;
