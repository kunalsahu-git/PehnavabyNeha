import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, Truck, RefreshCw, MessageSquare, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/ProductCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const CATEGORIES = [
  { name: "Ethnic Sets", image: PlaceHolderImages.find(i => i.id === 'cat-ethnic')?.imageUrl || '', href: "/collections/ethnic-wear" },
  { name: "Sarees", image: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '', href: "/collections/sarees" },
  { name: "Dresses", image: PlaceHolderImages.find(i => i.id === 'cat-western')?.imageUrl || '', href: "/collections/western-fusion" },
  { name: "Jewellery", image: PlaceHolderImages.find(i => i.id === 'cat-accessories')?.imageUrl || '', href: "/collections/jewellery" },
  { name: "Sale", image: PlaceHolderImages.find(i => i.id === 'product-3')?.imageUrl || '', href: "/collections/sale" },
];

const NEW_ARRIVALS = [
  { id: '1', slug: 'crimson-silk-saree', name: 'Crimson Embroidered Silk Saree', category: 'Sarees', price: 4999, originalPrice: 6999, image: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '', isNew: true },
  { id: '2', slug: 'gold-motif-kurta', name: 'Gold Floral Motif Kurta Set', category: 'Ethnic Sets', price: 3499, originalPrice: 4499, image: PlaceHolderImages.find(i => i.id === 'product-2')?.imageUrl || '', isBestseller: true },
  { id: '3', slug: 'pastel-pink-lehanga', name: 'Pastel Pink Zari Lehanga', category: 'Ethnic Sets', price: 8999, originalPrice: 12999, image: PlaceHolderImages.find(i => i.id === 'product-3')?.imageUrl || '', isSale: true },
  { id: '4', slug: 'emerald-fusion-jumpsuit', name: 'Emerald Green Fusion Jumpsuit', category: 'Fusion', price: 2999, image: PlaceHolderImages.find(i => i.id === 'product-4')?.imageUrl || '', isNew: true },
];

export default function Home() {
  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Hero Banner Section */}
      <section className="relative h-[60vh] md:h-[85vh] w-full">
        <Carousel opts={{ loop: true }} className="h-full w-full">
          <CarouselContent className="h-full ml-0">
            {[1, 2, 3].map((index) => (
              <CarouselItem key={index} className="h-full p-0">
                <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
                  <Image
                    src={PlaceHolderImages.find(i => i.id === `hero-${index}`)?.imageUrl || ''}
                    alt={`Pehnava Hero ${index}`}
                    fill
                    className="object-cover brightness-[0.85]"
                    priority
                  />
                  <div className="relative z-10 text-center text-white px-4 max-w-4xl space-y-6">
                    <span className="text-sm font-bold tracking-[0.3em] uppercase opacity-90 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      New Collection 2024
                    </span>
                    <h1 className="text-5xl md:text-8xl font-headline font-bold leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                      {index === 1 ? 'Elegance Redefined' : index === 2 ? 'The Wedding Edit' : 'Luxury in Every Stitch'}
                    </h1>
                    <p className="text-lg md:text-xl font-light max-w-2xl mx-auto opacity-90 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                      Discover curated pieces that celebrate the modern woman&apos;s heritage.
                    </p>
                    <div className="pt-4 flex items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-700">
                      <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-10 text-lg rounded-full">
                        Shop Collection
                      </Button>
                      <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 h-14 px-10 text-lg rounded-full">
                        View Lookbook
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex left-8 h-12 w-12 border-white/40 text-white bg-white/10 hover:bg-white/20" />
          <CarouselNext className="hidden md:flex right-8 h-12 w-12 border-white/40 text-white bg-white/10 hover:bg-white/20" />
        </Carousel>
      </section>

      {/* Category Grid Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-5xl font-headline font-bold">Shop by Category</h2>
          <div className="h-1 w-20 bg-accent rounded-full"></div>
          <p className="text-muted-foreground max-w-xl">Curated collections for every occasion and style preference.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
          {CATEGORIES.map((cat) => (
            <Link key={cat.name} href={cat.href} className="group relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white font-headline text-2xl font-semibold">
                {cat.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="bg-secondary/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-headline font-bold">New Arrivals</h2>
              <p className="text-muted-foreground">The latest trends fresh from our boutique.</p>
            </div>
            <Link href="/collections/new-arrivals" className="hidden md:flex items-center text-primary font-bold hover:underline">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
            {NEW_ARRIVALS.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
          <div className="mt-12 flex md:hidden justify-center">
             <Button variant="outline" asChild className="rounded-full px-8">
               <Link href="/collections/new-arrivals">View All Products</Link>
             </Button>
          </div>
        </div>
      </section>

      {/* Shop the Look / Editorial */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center mb-16 space-y-3">
          <span className="text-primary font-bold uppercase tracking-widest text-sm">Editorial</span>
          <h2 className="text-3xl md:text-5xl font-headline font-bold">Shop the Look</h2>
          <p className="text-muted-foreground max-w-xl">Get inspired by our curated ensembles for the modern South Asian woman.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-2xl cursor-pointer">
              <Image
                src={PlaceHolderImages[i + 4].imageUrl}
                alt="Shop the look"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-3xl font-headline font-bold mb-4">Midnight Soiree</h3>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary rounded-full">
                  Shop Outfit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Strip */}
      <section className="border-y bg-background py-12">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
              <Truck className="h-7 w-7 text-primary" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Free Delivery</h4>
            <p className="text-xs text-muted-foreground">On orders above ₹2999</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
              <RefreshCw className="h-7 w-7 text-primary" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Easy Returns</h4>
            <p className="text-xs text-muted-foreground">Within 7 days of delivery</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider">WhatsApp Support</h4>
            <p className="text-xs text-muted-foreground">Instant help via chat</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Secure Payment</h4>
            <p className="text-xs text-muted-foreground">Verified UPI Scan & Pay</p>
          </div>
        </div>
      </section>
    </div>
  );
}