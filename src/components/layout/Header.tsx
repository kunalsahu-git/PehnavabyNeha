"use client";

import Link from "next/link";
import { ShoppingBag, Search, Heart, User, Menu, LogOut, UserCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchModal } from "@/components/layout/SearchModal";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem,
  NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { getPublishedNavItemsQuery, type NavItemData } from "@/firebase/firestore/nav_items";
import { cn } from "@/lib/utils";

// ── Static fallback nav — used while Firestore loads or if nav_items is empty ──
const FALLBACK_NAV: NavItemData[] = [
  { label: 'Our Story', href: '/about', order: 0, published: true, createdAt: null, updatedAt: null },
  {
    label: 'Collections', order: 1, published: true, createdAt: null, updatedAt: null,
    children: [
      { label: 'Sarees', href: '/collections/sarees', order: 0 },
      { label: 'Lehengas', href: '/collections/lehengas', order: 1 },
      { label: 'Anarkalis', href: '/collections/anarkalis', order: 2 },
      { label: 'Ethnic Sets', href: '/collections/ethnic-sets', order: 3 },
      { label: 'Salwar Kameez', href: '/collections/salwar-kameez', order: 4 },
      { label: 'Kurtas & Tops', href: '/collections/kurtas-tops', order: 5 },
    ],
  },
  {
    label: 'Occasions', order: 2, published: true, createdAt: null, updatedAt: null,
    children: [
      { label: 'Bridal Wear', href: '/collections/bridal-wear', order: 0 },
      { label: 'Indo-Western', href: '/collections/indo-western', order: 1 },
      { label: 'Accessories', href: '/collections/accessories', order: 2 },
    ],
  },
  { label: 'New Arrivals', href: '/collections/new-arrivals', order: 3, published: true, createdAt: null, updatedAt: null },
  { label: 'Sale', href: '/collections/sale', order: 4, published: true, highlight: true, createdAt: null, updatedAt: null },
];

export function Header() {
  const { itemCount, setIsOpen } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  // Live nav from Firestore — fallback to FALLBACK_NAV if empty
  const navQuery = useMemoFirebase(
    () => db ? getPublishedNavItemsQuery(db) : null,
    [db]
  );
  const { data: navData } = useCollection<NavItemData>(navQuery);
  const publishedNav = (navData ?? []).filter(n => n.published !== false);
  const navItems = publishedNav.length > 0 ? publishedNav : FALLBACK_NAV;

  const handleLogout = async () => { await signOut(auth); };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">

          {/* Mobile Menu */}
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
                  <nav className="flex flex-col space-y-2">
                    {navItems.map((item, idx) => (
                      item.children?.length ? (
                        // Collapsible group for items with children
                        <Collapsible key={idx}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-xl font-headline font-semibold text-foreground hover:text-primary transition-colors group">
                            <span>{item.label}</span>
                            <ChevronDown className="h-4 w-4 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pl-4 pb-2 space-y-1 border-l-2 border-primary/10 ml-2 mt-1">
                              {[...item.children].sort((a, b) => a.order - b.order).map((child, ci) => (
                                <Link
                                  key={ci}
                                  href={child.href}
                                  className="block py-2 text-base font-medium text-muted-foreground hover:text-primary transition-colors"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <Link
                          key={idx}
                          href={item.href || '/'}
                          target={item.openInNewTab ? '_blank' : undefined}
                          className={cn(
                            "py-3 text-xl font-headline font-semibold transition-colors block",
                            item.highlight ? "text-primary font-bold" : "text-foreground hover:text-primary"
                          )}
                        >
                          {item.label}
                        </Link>
                      )
                    ))}

                    <Separator className="opacity-50 my-2" />

                    <Link href="/wishlist" className="py-3 text-xl font-headline font-semibold text-foreground hover:text-primary flex items-center justify-between">
                      My Wishlist
                      {wishlistCount > 0 && (
                        <Badge variant="secondary" className="bg-accent/10 text-accent font-bold px-2 py-0.5">{wishlistCount}</Badge>
                      )}
                    </Link>
                    {user ? (
                      <button onClick={handleLogout} className="py-3 text-xl font-headline font-semibold text-foreground hover:text-primary flex items-center gap-3">
                        <LogOut className="h-5 w-5 opacity-40" /> Logout
                      </button>
                    ) : (
                      <Link href="/account/login" className="py-3 text-xl font-headline font-semibold text-foreground hover:text-primary flex items-center gap-3">
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

          {/* Logo */}
          <Link href="/" className="flex flex-col items-center group transition-transform active:scale-95 shrink-0">
            <span className="text-2xl md:text-3xl lg:text-4xl font-headline font-bold text-primary tracking-tighter leading-none group-hover:opacity-80 transition-opacity">
              PEHNAVA
            </span>
            <span className="text-[8px] md:text-[10px] lg:text-[11px] font-headline font-medium tracking-[0.4em] text-accent -mt-0.5 md:-mt-1 uppercase">
              by Neha
            </span>
          </Link>

          {/* Desktop Nav — Radix NavigationMenu with dropdown support */}
          <div className="hidden lg:flex flex-1 justify-center px-4">
            <NavigationMenu>
              <NavigationMenuList className="gap-0">
                {navItems.map((item, idx) => (
                  item.children?.length ? (
                    // Parent with dropdown
                    <NavigationMenuItem key={idx}>
                      <NavigationMenuTrigger
                        className={cn(
                          "h-auto py-2 px-3 xl:px-4 bg-transparent hover:bg-transparent data-[state=open]:bg-transparent text-[11px] font-bold uppercase tracking-[0.2em] transition-colors",
                          item.highlight ? "text-primary" : "text-foreground/70 hover:text-primary data-[state=open]:text-primary"
                        )}
                      >
                        {item.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="p-4 w-[280px]">
                          {item.href && (
                            <>
                              <li>
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={item.href}
                                    className="block p-3 rounded-xl hover:bg-primary/5 transition-colors"
                                  >
                                    <p className="text-sm font-bold text-primary uppercase tracking-wide">View All {item.label}</p>
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                              <li><Separator className="my-2" /></li>
                            </>
                          )}
                          {[...item.children].sort((a, b) => a.order - b.order).map((child, ci) => (
                            <li key={ci}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={child.href}
                                  className="group block p-3 rounded-xl hover:bg-primary/5 transition-colors"
                                >
                                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-none">
                                    {child.label}
                                  </p>
                                  {child.description && (
                                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                                      {child.description}
                                    </p>
                                  )}
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ) : (
                    // Flat link — no dropdown
                    <NavigationMenuItem key={idx}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href || '/'}
                          target={item.openInNewTab ? '_blank' : undefined}
                          className={cn(
                            "inline-flex items-center h-auto py-2 px-3 xl:px-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:-translate-y-0.5 whitespace-nowrap",
                            item.highlight ? "text-primary" : "text-foreground/70 hover:text-primary"
                          )}
                        >
                          {item.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-secondary/60 transition-colors" onClick={() => setIsSearchOpen(true)}>
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
                  <DropdownMenuItem asChild><Link href="/account/profile" className="cursor-pointer py-2">Profile Details</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/account/orders" className="cursor-pointer py-2">Order History</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/wishlist" className="cursor-pointer py-2">My Wishlist</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-2 text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /><span>Logout</span>
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

            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-secondary/60 transition-colors" onClick={() => setIsOpen(true)}>
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
