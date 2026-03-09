"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

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

  return (
    <div 
      className="group relative flex flex-col space-y-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${slug}`} className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
        <Image
          src={isHovered && hoverImage ? hoverImage : image}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && <Badge className="bg-accent text-accent-foreground font-bold">NEW</Badge>}
          {isSale && <Badge className="bg-primary text-primary-foreground font-bold">SALE</Badge>}
          {isBestseller && <Badge className="bg-slate-900 text-white font-bold">BESTSELLER</Badge>}
        </div>

        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur"
        >
          <Heart className="h-5 w-5 text-primary" />
        </Button>

        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button 
            className="w-full bg-primary/90 hover:bg-primary shadow-lg"
            onClick={(e) => {
              e.preventDefault();
              addItem({
                id,
                name,
                price,
                image,
                quantity: 1,
                size: 'M'
              });
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </Link>

      <div className="flex flex-col space-y-1">
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          {category}
        </span>
        <Link href={`/products/${slug}`} className="text-sm font-medium hover:text-primary transition-colors line-clamp-1">
          {name}
        </Link>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-primary">₹{price.toLocaleString()}</span>
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