import { useState, useEffect } from "react";
import { CartContext } from "./CartContext";

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart(prev => [
      ...prev,
      {
        ...item,
        cartId: crypto.randomUUID(),
        quantity: 1,
      },
    ]);
  };

  const removeFromCart = (cartId) => {
    setCart(prev =>
      prev.filter(i => i.cartId !== cartId)
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const updateQuantity = (cartId, qty) => {
    if (qty < 1) return;

    setCart(prev =>
      prev.map(i =>
        i.cartId === cartId
          ? { ...i, quantity: qty }
          : i
      )
    );
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    updateQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
