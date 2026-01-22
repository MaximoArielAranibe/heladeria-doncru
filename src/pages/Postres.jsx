// src/pages/Postres.jsx
import Text from "../components/Text";
import CardsContainer from "../components/CardsContainer";

const Postres = () => {
  return (
    <main className="main">
      <Text text="Nuestros postres" />
      <CardsContainer category="postres" />
    </main>
  );
};

export default Postres;
