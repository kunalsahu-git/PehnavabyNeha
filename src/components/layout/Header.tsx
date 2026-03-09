
"use client";

import Link from "next/link";
import { ShoppingBag, Search, Heart, User, Menu, X, LogOut, UserCircle } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchModal } from "@/components/layout/SearchModal";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { name: "Ethnic Wear", href: "/collections/ethnic-wear" },
  { name: "Sarees", href: "/collections/sarees" },
  { name: "Western & Fusion", href: "/collections/western-fusion" },
  { name: "Accessories", href: "/collections/accessories" },
  { name: "Sale", href: "/collections/sale", color: "text-primary font-bold" },
];

export function Header() {
  const { itemCount, setIsOpen } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useUser();
  const auth = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 md:h-24 items-center justify-between gap-4">
          
          {/* Mobile Menu Trigger - Visible on small/medium screens */}
          <div className="flex lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:max-w-sm flex flex-col p-0 border-r-0 shadow-2xl">
                <SheetHeader className="p-6 border-b text-left">
                  <SheetTitle className="text-2xl font-headline font-bold text-primary tracking-tight">Browse Boutique</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar">
                  <nav className="flex flex-col space-y-7">
                    <Link href="/" className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors">Home</Link>
                    <Link href="/about" className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors">Our Story</Link>
                    <Separator className="opacity-50" />
                    {NAV_LINKS.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`text-xl font-headline font-semibold tracking-wide transition-colors ${link.color || "text-foreground hover:text-primary"}`}
                      >
                        {link.name}
                      </Link>
                    ))}
                    <Separator className="opacity-50" />
                    <Link href="/collections/new-arrivals" className="text-xl font-headline font-semibold text-foreground hover:text-primary">New Arrivals</Link>
                    <Link href="/wishlist" className="text-xl font-headline font-semibold text-foreground hover:text-primary flex items-center justify-between">
                      My Wishlist
                      {wishlistCount > 0 && (
                        <Badge variant="secondary" className="bg-accent/10 text-accent font-bold px-2 py-0.5">{wishlistCount}</Badge>
                      )}
                    </Link>
                    {user ? (
                      <button onClick={handleLogout} className="text-xl font-headline font-semibold text-foreground hover:text-primary flex items-center gap-3">
                        <LogOut className="h-5 w-5 opacity-40" /> Logout
                      </button>
                    ) : (
                      <Link href="/account/login" className="text-xl font-headline font-semibold text-foreground hover:text-primary flex items-center gap-3">
                        <User className="h-5 w-5 opacity-40" /> Login
                      </Link>
                    )}
                  </nav>
                </div>
                <div className="p-8 border-t bg-secondary/10 mt-auto">
                   <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-center text-muted-foreground/60">Wear Your Story • Pehnava</p>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo - Centered layout for a balanced boutique feel */}
          <Link href="/" className="flex flex-col items-center group transition-transform active:scale-95 shrink-0">
            <span className="text-2xl md:text-3xl lg:text-4xl font-headline font-bold text-primary tracking-tighter leading-none group-hover:opacity-80 transition-opacity">
              PEHNAVA
            </span>
            <span className="text-[8px] md:text-[10px] lg:text-[11px] font-headline font-medium tracking-[0.4em] text-accent -mt-0.5 md:-mt-1 uppercase">
              by Neha
            </span>
          </Link>

          {/* Desktop Nav - Hidden on Mobile/Tablet */}
          <nav className="hidden lg:flex items-center space-x-10 xl:space-x-12">
             <Link
                href="/about"
                className="text-[11px] font-bold uppercase tracking-[0.25em] transition-all hover:text-primary hover:-translate-y-0.5 whitespace-nowrap text-foreground/70"
              >
                Our Story
              </Link>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-[11px] font-bold uppercase tracking-[0.25em] transition-all hover:text-primary hover:-translate-y-0.5 whitespace-nowrap ${link.color || "text-foreground/70"}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full hover:bg-secondary/60 transition-colors"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-secondary/60 transition-colors">
                    <UserCircle className="h-5 w-5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl">
                  <DropdownMenuLabel className="font-headline text-lg">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile" className="cursor-pointer py-2">Profile Details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/orders" className="cursor-pointer py-2">Order History</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="cursor-pointer py-2">My Wishlist</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-2 text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/account/login">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-secondary/60 transition-colors">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            <Link href="/wishlist" className="hidden sm:flex relative">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-secondary/60 transition-colors">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <Badge className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center p-0 text-[9px] bg-accent font-bold text-white border-none shadow-sm">
                    {wishlistCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full hover:bg-secondary/60 transition-colors"
              onClick={() => setIsOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center p-0 text-[9px] font-bold bg-primary text-white border-none shadow-sm">
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
