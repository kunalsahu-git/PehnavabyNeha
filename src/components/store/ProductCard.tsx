"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  hoverImage?: string;
  isNew?: boolean;
  isSale?: boolean;
  isBestseller?: boolean;
};

export function ProductCard({
  id,
  slug,
  name,
  category,
  price,
  originalPrice,
  image,
  hoverImage,
  isNew,
  isSale,
  isBestseller,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorited = isInWishlist(id);

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id,
      name,
      price,
      image,
      quantity: 1,
      size: 'M'
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Reconstruct the product object for the context
    toggleWishlist({
      id,
      slug,
      name,
      category,
      categorySlug: '', // Context doesn't strictly need this for basic list
      price,
      originalPrice,
      image,
      isNew,
      isSale,
      isBestseller,
      createdAt: new Date().toISOString()
    } as any);
  };

  return (
    <div 
      className="group relative flex flex-col space-y-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${slug}`} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary shadow-sm transition-shadow hover:shadow-md">
        <Image
          src={isHovered && hoverImage ? hoverImage : image}
          alt={name}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        
        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {isNew && <Badge className="bg-primary text-primary-foreground font-bold border-none px-3 text-[10px] h-5">NEW</Badge>}
          {isSale && <Badge className="bg-accent text-accent-foreground font-bold border-none px-3 text-[10px] h-5">SALE</Badge>}
          {isBestseller && <Badge className="bg-slate-900 text-white font-bold border-none px-3 text-[10px] h-5">BESTSELLER</Badge>}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-3 right-3 h-9 w-9 rounded-full transition-all duration-300 z-10",
            "bg-white/60 backdrop-blur-md hover:bg-white/90",
            isFavorited ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
          )}
          onClick={handleWishlistToggle}
        >
          <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
        </Button>
      </Link>

      <div className="flex flex-col space-y-3 px-1 flex-1">
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold">
            {category}
          </span>
          <Link href={`/products/${slug}`} className="text-base font-medium hover:text-primary transition-colors line-clamp-1 font-headline">
            {name}
          </Link>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-primary">₹{price.toLocaleString()}</span>
            {originalPrice && (
              <>
                <span className="text-xs text-muted-foreground line-through">₹{originalPrice.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-green-600">({discount}% OFF)</span>
              </>
            )}
          </div>
        </div>

        <Button 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg h-11 rounded-full font-bold text-xs mt-auto group/btn transition-all active:scale-95"
          onClick={handleAddToCart}
        >
          <ShoppingBag className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
          Add to Bag
        </Button>
      </div>
    </div>
  );
}
