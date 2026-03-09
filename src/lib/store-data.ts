
import { PlaceHolderImages } from "./placeholder-images";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  originalPrice?: number;
  image: string;
  isNew?: boolean;
  isSale?: boolean;
  isBestseller?: boolean;
};

export type CategoryMeta = {
  name: string;
  slug: string;
  description: string;
  bannerImage: string;
  bannerHint: string;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    name: "Ethnic Sets",
    slug: "ethnic-wear",
    description: "Discover timeless elegance with our curated collection of traditional South Asian ethnic sets, featuring intricate handwork and premium fabrics.",
    bannerImage: PlaceHolderImages.find(i => i.id === 'hero-1')?.imageUrl || '',
    bannerHint: "ethnic fashion model"
  },
  {
    name: "Sarees",
    slug: "sarees",
    description: "Grace in six yards. Explore our exquisite range of sarees from heavy silks for weddings to light chiffons for festive evenings.",
    bannerImage: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '',
    bannerHint: "silk saree drape"
  },
  {
    name: "Western & Fusion",
    slug: "western-fusion",
    description: "Where tradition meets modern silhouettes. Our fusion collection is designed for the modern woman who values her roots and her comfort.",
    bannerImage: PlaceHolderImages.find(i => i.id === 'hero-2')?.imageUrl || '',
    bannerHint: "fusion fashion"
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Complete your look with our handcrafted luxury accessories, from statement jewellery sets to embroidered potlis.",
    bannerImage: PlaceHolderImages.find(i => i.id === 'hero-3')?.imageUrl || '',
    bannerHint: "ethnic jewellery"
  },
  {
    name: "Sale",
    slug: "sale",
    description: "Luxury fashion at exceptional prices. Browse our clearance selection and find your next favorite piece at a steal.",
    bannerImage: PlaceHolderImages.find(i => i.id === 'product-3')?.imageUrl || '',
    bannerHint: "sale event banner"
  },
  {
    name: "New Arrivals",
    slug: "new-arrivals",
    description: "Stay ahead of the curve with our latest drops. Fresh designs, new fabrics, and the season's hottest trends.",
    bannerImage: PlaceHolderImages.find(i => i.id === 'cat-western')?.imageUrl || '',
    bannerHint: "new arrivals fashion"
  }
];

export const ALL_PRODUCTS: Product[] = [
  { id: '1', slug: 'crimson-silk-saree', name: 'Crimson Embroidered Silk Saree', category: 'Sarees', categorySlug: 'sarees', price: 4999, originalPrice: 6999, image: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '', isNew: true },
  { id: '2', slug: 'gold-motif-kurta', name: 'Gold Floral Motif Kurta Set', category: 'Ethnic Sets', categorySlug: 'ethnic-wear', price: 3499, originalPrice: 4499, image: PlaceHolderImages.find(i => i.id === 'product-2')?.imageUrl || '', isBestseller: true },
  { id: '3', slug: 'pastel-pink-lehanga', name: 'Pastel Pink Zari Lehanga', category: 'Ethnic Sets', categorySlug: 'ethnic-wear', price: 8999, originalPrice: 12999, image: PlaceHolderImages.find(i => i.id === 'product-3')?.imageUrl || '', isSale: true },
  { id: '4', slug: 'emerald-fusion-jumpsuit', name: 'Emerald Green Fusion Jumpsuit', category: 'Fusion', categorySlug: 'western-fusion', price: 2999, image: PlaceHolderImages.find(i => i.id === 'product-4')?.imageUrl || '', isNew: true },
  { id: '5', slug: 'pearl-choker-set', name: 'Pearl & Stone Choker Set', category: 'Jewellery', categorySlug: 'accessories', price: 1599, originalPrice: 2299, image: PlaceHolderImages.find(i => i.id === 'cat-accessories')?.imageUrl || '', isNew: true },
  { id: '6', slug: 'ivory-anarkali', name: 'Ivory Hand-painted Anarkali', category: 'Ethnic Sets', categorySlug: 'ethnic-wear', price: 5499, image: PlaceHolderImages.find(i => i.id === 'hero-1')?.imageUrl || '', isBestseller: true },
  { id: '7', slug: 'midnight-silk-gown', name: 'Midnight Blue Silk Fusion Gown', category: 'Fusion', categorySlug: 'western-fusion', price: 4299, image: PlaceHolderImages.find(i => i.id === 'hero-2')?.imageUrl || '', isNew: true },
  { id: '8', slug: 'kundan-jhumkas', name: 'Premium Kundan Pearl Jhumkas', category: 'Jewellery', categorySlug: 'accessories', price: 1299, originalPrice: 1999, image: PlaceHolderImages.find(i => i.id === 'hero-3')?.imageUrl || '', isSale: true },
];
