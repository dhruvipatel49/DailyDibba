import React, { createContext, useState } from "react";
import { food_list } from "../assets/assets";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [wishlistItems, setWishlistItems] = useState({});

  const addToCart = (itemId) => {
    if (!itemId) return;
    const key = String(itemId);
    setCartItems((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1
    }));
  };

  const removeFromCart = (itemId) => {
    if (!itemId) return;
    const key = String(itemId);
    setCartItems((prev) => ({
      ...prev,
      [key]: Math.max((prev[key] || 0) - 1, 0)
    }));
  };

  const deleteFromCart = (itemId) => {
    if (!itemId) return;
    const key = String(itemId);
    setCartItems((prev) => ({
      ...prev,
      [key]: 0
    }));
  };

  // Toggle wishlist state for any cook ID
  const toggleWishlist = (cookId) => {
    if (!cookId) return;
    const key = String(cookId);
    setWishlistItems((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const contextValue = {
    food_list,
    cartItems,
    wishlistItems,
    addToCart,
    removeFromCart,
    deleteFromCart,
    toggleWishlist,
    setCartItems,
    setWishlistItems
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;