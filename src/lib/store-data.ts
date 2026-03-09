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
  images?: string[];
  description?: string;
  details?: string[];
  isNew?: boolean;
  isSale?: boolean;
  isBestseller?: boolean;
  createdAt: string; 
  colors?: string[];
  sizes?: string[];
  fabric?: string;
};

export type CategoryMeta = {
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  bannerImage: string;
  bannerHint: string;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    name: "Ethnic Sets",
    slug: "ethnic-wear",
    description: "Discover timeless elegance with our curated collection of traditional South Asian ethnic sets.",
    longDescription: `
      <p>Suits are a quintessential part of every woman's wardrobe. At Pehnava by Neha, we offer a wide range of suit sets including hand-blocked Jaipur prints, classy Chanderi, and breathable Cotton sets.</p>
      <p><strong>Explore our variety:</strong></p>
      <ul>
        <li><strong>Jaipur Hand-Block:</strong> Traditional motifs meets modern silhouettes.</li>
        <li><strong>Chanderi Silk:</strong> Sheer texture and subtle sheen for festive occasions.</li>
        <li><strong>Cotton Comfort:</strong> Ideal for everyday elegance and summer heat.</li>
      </ul>
    `,
    bannerImage: PlaceHolderImages.find(i => i.id === 'hero-1')?.imageUrl || '',
    bannerHint: "ethnic fashion model"
  },
  {
    name: "Sarees",
    slug: "sarees",
    description: "Grace in six yards. Explore our exquisite range of sarees from heavy silks to light chiffons.",
    longDescription: "<p>Our saree collection celebrates the timeless beauty of the drape. From heavy Banarasi silks to delicate organzas, each piece is handpicked for its unique story.</p>",
    bannerImage: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '',
    bannerHint: "silk saree drape"
  },
  {
    name: "Western & Fusion",
    slug: "western-fusion",
    description: "Where tradition meets modern silhouettes for the modern woman.",
    bannerImage: PlaceHolderImages.find(i => i.id === 'hero-2')?.imageUrl || '',
    bannerHint: "fusion fashion"
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Complete your look with our handcrafted luxury accessories.",
    bannerImage: PlaceHolderImages.find(i => i.id === 'hero-3')?.imageUrl || '',
    bannerHint: "ethnic jewellery"
  },
  {
    name: "Sale",
    slug: "sale",
    description: "Luxury fashion at exceptional prices. Find your next favorite piece at a steal.",
    bannerImage: PlaceHolderImages.find(i => i.id === 'product-3')?.imageUrl || '',
    bannerHint: "sale event banner"
  },
  {
    name: "New Arrivals",
    slug: "new-arrivals",
    description: "Stay ahead of the curve with our latest drops. Fresh designs and the season's hottest trends.",
    bannerImage: PlaceHolderImages.find(i => i.id === 'cat-western')?.imageUrl || '',
    bannerHint: "new arrivals fashion"
  }
];

export const ALL_PRODUCTS: Product[] = [
  { 
    id: '1', 
    slug: 'crimson-silk-saree', 
    name: 'Crimson Embroidered Silk Saree', 
    category: 'Sarees', 
    categorySlug: 'sarees', 
    price: 4999, 
    originalPrice: 6999, 
    image: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '', 
    images: [
      PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '',
      PlaceHolderImages.find(i => i.id === 'hero-1')?.imageUrl || '',
      PlaceHolderImages.find(i => i.id === 'cat-ethnic')?.imageUrl || '',
      PlaceHolderImages.find(i => i.id === 'product-2')?.imageUrl || '',
    ],
    description: "Embrace elegance with our Crimson Embroidered Silk Saree. Handcrafted with precision, this piece features intricate zari work and a luxurious drape perfect for weddings and festive celebrations.",
    details: [
      "Fabric: Premium Silk",
      "Work: Hand Embroidery with Zari",
      "Occasion: Wedding, Festive",
      "Care: Dry Clean Only",
      "In the Box: 1 Saree with unstitched blouse piece"
    ],
    isNew: true, 
    createdAt: '2024-01-01', 
    colors: ['Crimson', 'Gold'], 
    sizes: ['Free Size'], 
    fabric: 'Silk' 
  },
  { 
    id: '2', 
    slug: 'gold-motif-kurta', 
    name: 'Gold Floral Motif Kurta Set', 
    category: 'Ethnic Sets', 
    categorySlug: 'ethnic-wear', 
    price: 3499, 
    originalPrice: 4499, 
    image: PlaceHolderImages.find(i => i.id === 'product-2')?.imageUrl || '', 
    images: [
      PlaceHolderImages.find(i => i.id === 'product-2')?.imageUrl || '',
      PlaceHolderImages.find(i => i.id === 'cat-ethnic')?.imageUrl || '',
      PlaceHolderImages.find(i => i.id === 'product-3')?.imageUrl || '',
    ],
    description: "This Gold Floral Motif Kurta Set is a testament to timeless grace. Crafted from breathable cotton, it features delicate floral prints highlighted with golden motifs.",
    details: [
      "Fabric: Cotton",
      "Style: Straight Fit",
      "Occasion: Daily Wear, Festive",
      "Care: Gentle Hand Wash",
      "In the Box: Kurta, Pants, and Dupatta"
    ],
    isBestseller: true, 
    createdAt: '2024-01-05', 
    colors: ['Gold', 'Yellow'], 
    sizes: ['S', 'M', 'L', 'XL'], 
    fabric: 'Cotton' 
  },
  { id: '3', slug: 'pastel-pink-lehanga', name: 'Pastel Pink Zari Lehanga', category: 'Ethnic Sets', categorySlug: 'ethnic-wear', price: 8999, originalPrice: 12999, image: PlaceHolderImages.find(i => i.id === 'product-3')?.imageUrl || '', isSale: true, createdAt: '2023-12-15', colors: ['Pink'], sizes: ['M', 'L', 'XL'], fabric: 'Silk' },
  { id: '4', slug: 'emerald-fusion-jumpsuit', name: 'Emerald Green Fusion Jumpsuit', category: 'Fusion', categorySlug: 'western-fusion', price: 2999, image: PlaceHolderImages.find(i => i.id === 'product-4')?.imageUrl || '', isNew: true, createdAt: '2024-02-10', colors: ['Green'], sizes: ['XS', 'S', 'M'], fabric: 'Chiffon' },
  { id: '5', slug: 'pearl-choker-set', name: 'Pearl & Stone Choker Set', category: 'Jewellery', categorySlug: 'accessories', price: 1599, originalPrice: 2299, image: PlaceHolderImages.find(i => i.id === 'cat-accessories')?.imageUrl || '', isNew: true, createdAt: '2024-02-15', colors: ['White', 'Pearl'], fabric: 'Mixed Media' },
  { id: '6', slug: 'ivory-anarkali', name: 'Ivory Hand-painted Anarkali', category: 'Ethnic Sets', categorySlug: 'ethnic-wear', price: 5499, image: PlaceHolderImages.find(i => i.id === 'hero-1')?.imageUrl || '', isBestseller: true, createdAt: '2024-01-20', colors: ['Ivory', 'White'], sizes: ['S', 'M', 'L', 'XL'], fabric: 'Georgette' },
  { id: '7', slug: 'midnight-silk-gown', name: 'Midnight Blue Silk Fusion Gown', category: 'Fusion', categorySlug: 'western-fusion', price: 4299, image: PlaceHolderImages.find(i => i.id === 'hero-2')?.imageUrl || '', isNew: true, createdAt: '2024-02-01', colors: ['Blue'], sizes: ['M', 'L'], fabric: 'Silk' },
  { id: '8', slug: 'kundan-jhumkas', name: 'Premium Kundan Pearl Jhumkas', category: 'Jewellery', categorySlug: 'accessories', price: 1299, originalPrice: 1999, image: PlaceHolderImages.find(i => i.id === 'hero-3')?.imageUrl || '', isSale: true, createdAt: '2023-11-20', colors: ['Gold', 'White'], fabric: 'Kundan' },
  { id: '9', slug: 'ruby-earrings', name: 'Royal Ruby Drop Earrings', category: 'Jewellery', categorySlug: 'accessories', price: 1899, image: PlaceHolderImages.find(i => i.id === 'hero-3')?.imageUrl || '', isNew: true, createdAt: '2024-02-20', colors: ['Red'], fabric: 'Gemstone' },
  { id: '10', slug: 'white-chiffon-saree', name: 'White Cloud Chiffon Saree', category: 'Sarees', categorySlug: 'sarees', price: 3299, originalPrice: 3999, image: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '', createdAt: '2024-01-10', colors: ['White'], sizes: ['Free Size'], fabric: 'Chiffon' },
  { id: '11', slug: 'black-velvet-suit', name: 'Black Velvet Embroidery Suit', category: 'Ethnic Sets', categorySlug: 'ethnic-wear', price: 6599, originalPrice: 7999, image: PlaceHolderImages.find(i => i.id === 'product-2')?.imageUrl || '', isBestseller: true, createdAt: '2024-01-25', colors: ['Black'], sizes: ['M', 'L', 'XL'], fabric: 'Velvet' },
  { id: '12', slug: 'floral-maxi-dress', name: 'Floral Garden Maxi Dress', category: 'Fusion', categorySlug: 'western-fusion', price: 2199, image: PlaceHolderImages.find(i => i.id === 'cat-western')?.imageUrl || '', createdAt: '2024-02-22', colors: ['Multi', 'Floral'], sizes: ['S', 'M', 'L'], fabric: 'Rayon' },
];
