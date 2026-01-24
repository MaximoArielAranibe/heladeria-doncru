import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { AuthProvider } from "./context/AuthProvider";
import { CartProvider } from "./context/CartContext";

// 🔁 Soporte para redirect en GitHub Pages
const redirect = sessionStorage.getItem("redirect");

if (redirect) {
  sessionStorage.removeItem("redirect");
  window.history.replaceState(null, null, redirect);
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
);
