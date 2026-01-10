import cuartoImg from "../assets/vertical-11.jpeg";
import medioImg from "../assets/vertical-horizontal.jpg";
import kiloImg from "../assets/vertical-para-ser-horizontal.jpeg";

export const products = [
  {
    id: 1,
    title: "Cuarto de helado",
    description: "Podés elegir hasta 3 gustos.",
    price: 2500,
    category: "tamaños",
    thumbnail: cuartoImg,
    maxGustos: 3,
    featured: true,
    masVendido: true,
  },
  {
    id: 2,
    title: "Medio KG de helado",
    description: "Hasta 4 gustos.",
    price: 4500,
    category: "tamaños",
    thumbnail: medioImg,
    maxGustos: 4,
    featured: false,
  },
  {
    id: 3,
    title: "KG de helado",
    description: "Hasta 4 gustos.",
    price: 8000,
    category: "tamaños",
    thumbnail: kiloImg,
    maxGustos: 4,
    featured: false,
  },
];
