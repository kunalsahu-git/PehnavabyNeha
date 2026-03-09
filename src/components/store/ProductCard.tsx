"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
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

  return (
    <div 
      className="group relative flex flex-col space-y-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${slug}`} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-secondary shadow-sm transition-shadow hover:shadow-md">
        <Image
          src={isHovered && hoverImage ? hoverImage : image}
          alt={name}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        
        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {isNew && <Badge className="bg-primary text-primary-foreground font-bold border-none px-3">NEW</Badge>}
          {isSale && <Badge className="bg-accent text-accent-foreground font-bold border-none px-3">SALE</Badge>}
          {isBestseller && <Badge className="bg-slate-900 text-white font-bold border-none px-3">BESTSELLER</Badge>}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-10 w-10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/40 backdrop-blur-md hover:bg-white/60 text-primary z-10"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <Heart className="h-5 w-5" />
        </Button>

        {/* Awesome Add to Cart Button Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20">
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl h-12 rounded-full font-bold group/btn"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            Add to Bag
          </Button>
        </div>

        {/* Mobile quick add button - visible without hover on small screens */}
        <div className="absolute right-3 bottom-3 md:hidden z-10">
          <Button 
            size="icon"
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-xl"
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <div className="flex flex-col space-y-1 px-1">
        <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-accent font-bold">
          {category}
        </span>
        <Link href={`/products/${slug}`} className="text-sm md:text-base font-medium hover:text-primary transition-colors line-clamp-1 font-headline">
          {name}
        </Link>
        <div className="flex items-center space-x-2">
          <span className="text-base font-bold text-primary">₹{price.toLocaleString()}</span>
          {originalPrice && (
            <>
              <span className="text-xs text-muted-foreground line-through">₹{originalPrice.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-green-600">({discount}% OFF)</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
