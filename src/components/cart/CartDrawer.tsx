"use client";

import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { normalizeColor, colorToCSS, isLightColor } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, subtotal, isOpen, setIsOpen } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader className="px-1">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Your Shopping Bag ({items.length})
          </SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-secondary p-8">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Your bag is empty</h3>
            <p className="text-center text-sm text-muted-foreground px-8">
              Looks like you haven&apos;t added any beautiful pieces to your cart yet.
            </p>
            <Button asChild onClick={() => setIsOpen(false)}>
              <Link href="/collections/ethnic-wear">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size ?? ''}-${item.color ?? ''}`} className="flex gap-4">
                    <div className="relative h-24 w-18 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {item.size && (
                              <span className="text-xs text-muted-foreground">Size: {item.size}</span>
                            )}
                            {item.color && (() => {
                              const c = normalizeColor(item.color);
                              return (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  {item.size && <span className="text-muted-foreground/50">·</span>}
                                  <span
                                    className={cn("h-3 w-3 rounded-full inline-block border", isLightColor(c.hex) ? "border-slate-300" : "border-transparent")}
                                    style={{ background: colorToCSS(c.hex) }}
                                  />
                                  {c.name}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <p className="text-sm font-bold">₹{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center rounded-md border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => updateQuantity(item.id, -1, item.size, item.color)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() => updateQuantity(item.id, 1, item.size, item.color)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id, item.size, item.color)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="pt-6 space-y-4">
              <div className="flex items-center justify-between text-base font-medium">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full h-12 text-base font-bold" onClick={() => setIsOpen(false)}>
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}