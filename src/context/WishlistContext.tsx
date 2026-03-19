"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Product, ALL_PRODUCTS } from "@/lib/store-data";
import { useUser, useFirestore } from "@/firebase";
import { getUserWishlist, toggleWishlistItem, syncWishlist } from "@/firebase/firestore/wishlist";

type WishlistContextType = {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: string) => boolean;
  itemCount: number;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();
  const [items, setItems] = useState<Product[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("pehnava_wishlist");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setItems(parsed);
      } catch (e) {
        console.error("Failed to parse wishlist", e);
      }
    }
    setIsInitialLoad(false);
  }, []);

  // Sync with Firestore when user logs in
  useEffect(() => {
    if (!user || !db || isInitialLoad) return;

    const performSync = async () => {
      try {
        const cloudProductIds = await getUserWishlist(db, user.uid);
        const localProductIds = items.map(i => i.id);
        
        // Merge: unique set of IDs
        const mergedIds = Array.from(new Set([...cloudProductIds, ...localProductIds]));
        
        // If there were local items not in cloud, sync back to cloud
        if (localProductIds.some(id => !cloudProductIds.includes(id))) {
          await syncWishlist(db, user.uid, mergedIds);
        }

        // Map IDs back to full Product objects
        const mergedProducts = mergedIds
          .map(id => ALL_PRODUCTS.find(p => p.id === id))
          .filter((p): p is Product => !!p);
        
        setItems(mergedProducts);
      } catch (err) {
        console.error("Error syncing wishlist with Firestore:", err);
      }
    };

    performSync();
  }, [user?.uid, db, isInitialLoad]);

  // Save to LocalStorage whenever items change
  useEffect(() => {
    localStorage.setItem("pehnava_wishlist", JSON.stringify(items));
  }, [items]);

  const toggleWishlist = useCallback(async (product: Product) => {
    const exists = items.find((i) => i.id === product.id);
    
    // Update Local State
    if (exists) {
      setItems((prev) => prev.filter((i) => i.id !== product.id));
    } else {
      setItems((prev) => [...prev, product]);
    }

    // Update Firestore if logged in
    if (user && db) {
      try {
        await toggleWishlistItem(db, user.uid, product.id, !exists);
      } catch (err) {
        console.error("Error updating cloud wishlist:", err);
      }
    }
  }, [items, user, db]);

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
