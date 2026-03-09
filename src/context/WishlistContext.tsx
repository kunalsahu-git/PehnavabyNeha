"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/lib/store-data";

type WishlistContextType = {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: string) => boolean;
  itemCount: number;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("pehnava_wishlist");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse wishlist", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pehnava_wishlist", JSON.stringify(items));
  }, [items]);

  const toggleWishlist = (product: Product) => {
    const exists = items.find((i) => i.id === product.id);
    if (exists) {
      setItems((prev) => prev.filter((i) => i.id !== product.id));
      toast({
        title: "Removed from wishlist",
        description: `${product.name} has been removed.`,
      });
    } else {
      setItems((prev) => [...prev, product]);
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been saved to your favorites.`,
      });
    }
  };

  const isInWishlist = (id: string) => items.some((i) => i.id === id);

  return (
    <WishlistContext.Provider
      value={{
        items,
        toggleWishlist,
        isInWishlist,
        itemCount: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
