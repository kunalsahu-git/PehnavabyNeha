"use client";

import Link from "next/link";
import { ShoppingBag, Search, Heart, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchModal } from "@/components/layout/SearchModal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { name: "Ethnic Wear", href: "/collections/ethnic-wear" },
  { name: "Sarees", href: "/collections/sarees" },
  { name: "Western & Fusion", href: "/collections/western-fusion" },
  { name: "Accessories", href: "/collections/accessories" },
  { name: "Sale", href: "/collections/sale", color: "text-primary font-bold" },
];

export function Header() {
  const { itemCount, setIsOpen } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Mobile Menu */}
          <div className="flex md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-6 mt-12">
                  <Link href="/" className="text-xl font-headline font-bold text-primary">Home</Link>
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`text-xl font-medium ${link.color || ""}`}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <Link href="/collections/new-arrivals" className="text-xl font-medium">New Arrivals</Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link href="/" className="flex flex-col items-center group">
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-headline font-bold text-primary tracking-tighter">
                PEHNAVA
              </span>
            </div>
            <span className="text-[10px] md:text-xs font-headline font-medium tracking-[0.2em] text-accent -mt-1 uppercase">
              by Neha
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${link.color || ""}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Link href="/account/login" className="hidden sm:flex">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/wishlist" className="hidden sm:flex">
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
      <CartDrawer />
      <SearchModal isOpen={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
}
