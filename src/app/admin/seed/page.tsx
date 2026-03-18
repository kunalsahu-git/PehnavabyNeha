'use client';

import React, { useState } from 'react';
import { collection, doc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Database, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore } from '@/firebase';

// ── Seed Data ──────────────────────────────────────────────────────────────────

const COLLECTIONS_DATA = [
  {
    name: 'Bridal Edit 2025',
    slug: 'bridal-edit-2025',
    description: 'The most coveted bridal pieces of the season — crafted for your forever moment.',
    imageUrl: 'https://picsum.photos/seed/bridal2025/1200/600',
    published: true,
  },
  {
    name: 'Festive Glow',
    slug: 'festive-glow',
    description: 'Shimmer, shine, and celebrate. Statement pieces for every festival and occasion.',
    imageUrl: 'https://picsum.photos/seed/festiveglow/1200/600',
    published: true,
  },
  {
    name: 'Summer Pastels',
    slug: 'summer-pastels',
    description: 'Soft hues, breathable fabrics, and effortless silhouettes for the warm season.',
    imageUrl: 'https://picsum.photos/seed/summerpastels/1200/600',
    published: true,
  },
  {
    name: 'New Arrivals',
    slug: 'new-arrivals',
    description: 'Fresh drops straight from our atelier — be the first to own the newest pieces.',
    imageUrl: 'https://picsum.photos/seed/newarrivals/1200/600',
    published: true,
  },
];

const CATEGORIES_DATA = [
  {
    name: 'Sarees',
    slug: 'sarees',
    description: 'Drape yourself in six yards of elegance. From Banarasi to Kanjeevaram.',
    longDescription: '<p>The saree is the soul of Indian fashion — timeless, versatile, and endlessly expressive. Our curated saree collection spans the finest silk weaves, handloom traditions, and contemporary drapes, each piece a work of art.</p>',
    imageUrl: 'https://picsum.photos/seed/sarees-cat/1200/500',
    published: true,
  },
  {
    name: 'Lehengas',
    slug: 'lehengas',
    description: 'Statement silhouettes for weddings, engagements, and grand occasions.',
    longDescription: '<p>A lehenga speaks before you do. Our collection ranges from heavily embroidered bridal sets to lightweight festive pieces — each skirt swirl telling a story of craftsmanship and heritage.</p>',
    imageUrl: 'https://picsum.photos/seed/lehengas-cat/1200/500',
    published: true,
  },
  {
    name: 'Salwar Kameez',
    slug: 'salwar-kameez',
    description: 'Where comfort meets tradition. Everyday elegance for every woman.',
    longDescription: '<p>The salwar kameez is the wardrobe essential that adapts to every occasion. Our range covers casual cotton sets, festive georgettes, and everything in between.</p>',
    imageUrl: 'https://picsum.photos/seed/salwar-cat/1200/500',
    published: true,
  },
  {
    name: 'Anarkalis',
    slug: 'anarkalis',
    description: 'Flowing Mughal-inspired silhouettes that celebrate every woman\'s grace.',
    longDescription: '<p>Named after the legendary Anarkali, these floor-grazing kurtas are the epitome of regal Indian fashion. Perfect for festive events and formal occasions.</p>',
    imageUrl: 'https://picsum.photos/seed/anarkali-cat/1200/500',
    published: true,
  },
  {
    name: 'Kurtas & Tops',
    slug: 'kurtas-tops',
    description: 'Everyday ethnic chic — from office to outings.',
    longDescription: '<p>Our kurtas and tops collection bridges the gap between everyday wear and ethnic fashion. Lightweight, versatile, and always elegant.</p>',
    imageUrl: 'https://picsum.photos/seed/kurtas-cat/1200/500',
    published: true,
  },
  {
    name: 'Dupattas',
    slug: 'dupattas',
    description: 'The finishing touch that transforms any outfit.',
    longDescription: '<p>A dupatta is not just an accessory — it is the soul of ethnic wear. Our collection features hand-embroidered, printed, and embellished dupattas to complete every look.</p>',
    imageUrl: 'https://picsum.photos/seed/dupattas-cat/1200/500',
    published: true,
  },
  {
    name: 'Bridal Wear',
    slug: 'bridal-wear',
    description: 'Your most important outfit, crafted with unmatched care and artistry.',
    longDescription: '<p>A bride deserves nothing less than extraordinary. Our bridal collection is built for the woman who wants to be remembered — featuring hand-embroidered lehengas, silk sarees, and custom bridal sets.</p>',
    imageUrl: 'https://picsum.photos/seed/bridal-cat/1200/500',
    published: true,
  },
  {
    name: 'Indo-Western',
    slug: 'indo-western',
    description: 'Where cultures meet — fusion fashion done with intention.',
    longDescription: '<p>For the modern Indian woman who lives between worlds. Our Indo-Western collection blends Eastern silhouettes with contemporary cuts, fabrics, and sensibilities.</p>',
    imageUrl: 'https://picsum.photos/seed/indowestern-cat/1200/500',
    published: true,
  },
  {
    name: 'Ethnic Sets',
    slug: 'ethnic-sets',
    description: 'Curated co-ord sets that take the guesswork out of getting dressed.',
    longDescription: '<p>Matching sets in ethnic wear are the new power move. Our ethnic co-ord sets pair perfectly for a put-together look every time — no styling required.</p>',
    imageUrl: 'https://picsum.photos/seed/ethnicsets-cat/1200/500',
    published: true,
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Complete the look — jewellery, bags, and finishing touches.',
    longDescription: '<p>The right accessory elevates any outfit from beautiful to unforgettable. From kundan jewellery sets and jhumkas to embroidered potli bags — every piece is chosen with intention.</p>',
    imageUrl: 'https://picsum.photos/seed/accessories-cat/1200/500',
    published: true,
  },
];

const PRODUCTS_DATA = [
  {
    name: 'Ivory Banarasi Silk Saree',
    slug: 'ivory-banarasi-silk-saree',
    category: 'Sarees', categorySlug: 'sarees',
    collections: ['bridal-edit-2025'],
    price: 8500, originalPrice: 11000,
    image: 'https://picsum.photos/seed/p1/400/600',
    images: ['https://picsum.photos/seed/p1/400/600', 'https://picsum.photos/seed/p1b/400/600', 'https://picsum.photos/seed/p1c/400/600'],
    fabric: 'Pure Banarasi Silk', colors: ['Ivory', 'Gold'],
    sizes: ['Free Size'],
    description: 'A timeless ivory Banarasi silk saree adorned with intricate gold zari work. Woven by master weavers in Varanasi, each thread carries centuries of craft tradition. Perfect for bridal ceremonies and festive celebrations.',
    details: ['Fabric: Pure Banarasi Silk', 'Work: Gold Zari Weaving', 'Blouse: Unstitched blouse piece included', 'Length: 6.3 metres', 'Occasion: Bridal, Wedding, Festive', 'Care: Dry Clean Only'],
    isNew: false, isSale: true, isBestseller: true, published: true, stock: 5,
  },
  {
    name: 'Rose Gold Sequin Lehenga Set',
    slug: 'rose-gold-sequin-lehenga-set',
    category: 'Lehengas', categorySlug: 'lehengas',
    collections: ['bridal-edit-2025', 'festive-glow'],
    price: 24999,
    image: 'https://picsum.photos/seed/p2/400/600',
    images: ['https://picsum.photos/seed/p2/400/600', 'https://picsum.photos/seed/p2b/400/600'],
    fabric: 'Velvet with Sequin Embroidery', colors: ['Rose Gold', 'Champagne'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Pure glamour in every stitch. This rose gold sequin lehenga catches light from every angle, making you the centrepiece of any celebration. Pair with the matching choli and dupatta for a complete statement look.',
    details: ['Fabric: Premium Velvet + Georgette dupatta', 'Work: Hand-applied sequin embroidery', 'Set: Lehenga + Choli + Dupatta', 'Occasion: Wedding Reception, Sangeet, Festive', 'Care: Dry Clean Only'],
    isNew: true, isSale: false, isBestseller: true, published: true, stock: 8,
  },
  {
    name: 'Teal Chanderi Anarkali',
    slug: 'teal-chanderi-anarkali',
    category: 'Anarkalis', categorySlug: 'anarkalis',
    collections: ['summer-pastels'],
    price: 4200, originalPrice: 5500,
    image: 'https://picsum.photos/seed/p3/400/600',
    images: ['https://picsum.photos/seed/p3/400/600', 'https://picsum.photos/seed/p3b/400/600'],
    fabric: 'Pure Chanderi Silk', colors: ['Teal', 'Mint'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Effortlessly regal, this teal Chanderi anarkali features a sheer flared silhouette with delicate floral block print. A summer evening staple that transitions beautifully from day to festive night.',
    details: ['Fabric: Pure Chanderi Silk', 'Work: Block Print with Zari Border', 'Length: Floor Length', 'Dupatta: Matching Chanderi Dupatta', 'Occasion: Festive, Casual, Eid', 'Care: Gentle Hand Wash'],
    isNew: false, isSale: true, isBestseller: false, published: true, stock: 12,
  },
  {
    name: 'Midnight Blue Velvet Salwar Kameez',
    slug: 'midnight-blue-velvet-salwar-kameez',
    category: 'Salwar Kameez', categorySlug: 'salwar-kameez',
    collections: ['festive-glow'],
    price: 6800,
    image: 'https://picsum.photos/seed/p4/400/600',
    images: ['https://picsum.photos/seed/p4/400/600', 'https://picsum.photos/seed/p4b/400/600'],
    fabric: 'Pure Velvet', colors: ['Midnight Blue', 'Royal Blue'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Deep, rich, and utterly luxurious. This midnight blue velvet salwar kameez is finished with silver thread embroidery at the neckline and cuffs. A wardrobe investment that commands attention.',
    details: ['Fabric: Pure Crushed Velvet', 'Work: Silver Thread Embroidery', 'Bottom: Matching Palazzo Pants', 'Dupatta: Net dupatta with embroidered border', 'Occasion: Festive, Diwali, Party', 'Care: Dry Clean Only'],
    isNew: false, isSale: false, isBestseller: false, published: true, stock: 6,
  },
  {
    name: 'Pastel Pink Organza Lehenga',
    slug: 'pastel-pink-organza-lehenga',
    category: 'Lehengas', categorySlug: 'lehengas',
    collections: ['summer-pastels', 'new-arrivals'],
    price: 15999,
    image: 'https://picsum.photos/seed/p5/400/600',
    images: ['https://picsum.photos/seed/p5/400/600', 'https://picsum.photos/seed/p5b/400/600', 'https://picsum.photos/seed/p5c/400/600'],
    fabric: 'Premium Organza', colors: ['Blush Pink', 'Dusty Rose'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Like a petal in the breeze — this blush organza lehenga is femininity distilled. Lightweight layers and hand-embroidered floral motifs make this the perfect choice for mehendi, Haldi or a summer wedding.',
    details: ['Fabric: Multi-layer Organza', 'Work: Hand-embroidered Floral Motifs', 'Set: Lehenga + Bralette Choli + Dupatta', 'Occasion: Mehendi, Haldi, Engagement', 'Care: Dry Clean Only'],
    isNew: true, isSale: false, isBestseller: false, published: true, stock: 10,
  },
  {
    name: 'Emerald Tissue Silk Saree',
    slug: 'emerald-tissue-silk-saree',
    category: 'Sarees', categorySlug: 'sarees',
    collections: ['festive-glow'],
    price: 11200,
    image: 'https://picsum.photos/seed/p6/400/600',
    images: ['https://picsum.photos/seed/p6/400/600', 'https://picsum.photos/seed/p6b/400/600'],
    fabric: 'Tissue Silk with Gold Zari', colors: ['Emerald Green', 'Gold'],
    sizes: ['Free Size'],
    description: 'The mesmerising sheen of tissue silk in a deep emerald that catches every light. Woven with fine gold zari throughout the body and a richly embellished pallu — this saree makes every entrance unforgettable.',
    details: ['Fabric: Pure Tissue Silk', 'Work: All-over Zari Weaving', 'Blouse: Running blouse included', 'Length: 6.5 metres', 'Occasion: Diwali, Karwa Chauth, Festive', 'Care: Dry Clean Only'],
    isNew: false, isSale: false, isBestseller: true, published: true, stock: 4,
  },
  {
    name: 'White Hand-Embroidered Kurta Set',
    slug: 'white-hand-embroidered-kurta-set',
    category: 'Ethnic Sets', categorySlug: 'ethnic-sets',
    collections: ['new-arrivals'],
    price: 3200,
    image: 'https://picsum.photos/seed/p7/400/600',
    images: ['https://picsum.photos/seed/p7/400/600', 'https://picsum.photos/seed/p7b/400/600'],
    fabric: 'Mulmul Cotton', colors: ['White', 'Off-White'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: "Pure and artful. This white mulmul kurta set features hand-embroidered chikankari work across the yoke and hem. Breathable and weightless, it's the perfect ensemble for summer festivities or casual days.",
    details: ['Fabric: Soft Mulmul Cotton', 'Work: Lucknowi Chikankari Embroidery', 'Set: Kurta + Straight Pants + Stole', 'Occasion: Casual, Eid, Summer Parties', 'Care: Gentle Machine Wash Cold'],
    isNew: true, isSale: false, isBestseller: false, published: true, stock: 20,
  },
  {
    name: 'Bridal Red Zari Lehenga',
    slug: 'bridal-red-zari-lehenga',
    category: 'Bridal Wear', categorySlug: 'bridal-wear',
    collections: ['bridal-edit-2025'],
    price: 45000,
    image: 'https://picsum.photos/seed/p8/400/600',
    images: ['https://picsum.photos/seed/p8/400/600', 'https://picsum.photos/seed/p8b/400/600', 'https://picsum.photos/seed/p8c/400/600', 'https://picsum.photos/seed/p8d/400/600'],
    fabric: 'Heavy Silk with Zari and Stonework', colors: ['Bridal Red', 'Deep Crimson'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'The lehenga every bride dreams of. Crafted from the finest heavy silk and covered in intricate zari, dabka, and stone embroidery by our master artisans — each piece takes over 400 hours to complete. Your forever dress deserves nothing less.',
    details: ['Fabric: Heavy Silk + Net Dupatta', 'Work: Zari, Dabka, Kundan and Stone Embroidery', 'Set: Lehenga + Velvet Choli + Net Dupatta', 'Custom Sizing: Available on request', 'Delivery: 3–4 weeks', 'Care: Professional Dry Clean Only'],
    isNew: false, isSale: false, isBestseller: true, published: true, stock: 3,
  },
  {
    name: 'Mint Cotton Salwar Kameez',
    slug: 'mint-cotton-salwar-kameez',
    category: 'Salwar Kameez', categorySlug: 'salwar-kameez',
    collections: ['summer-pastels'],
    price: 2800,
    image: 'https://picsum.photos/seed/p9/400/600',
    images: ['https://picsum.photos/seed/p9/400/600', 'https://picsum.photos/seed/p9b/400/600'],
    fabric: 'Cotton Slub', colors: ['Mint Green', 'Sage'],
    sizes: ['S', 'M', 'L', 'XL', 'Free Size'],
    description: 'Your everyday companion reimagined. This mint cotton salwar kameez features delicate pintucks and a relaxed silhouette — dressed down for casual days or elevated with jewellery for a festive lunch.',
    details: ['Fabric: Pure Cotton Slub', 'Work: Pintucks and Lace Trim', 'Set: Kameez + Salwar + Dupatta', 'Occasion: Casual, Work, Family Gatherings', 'Care: Machine Wash Gentle'],
    isNew: false, isSale: false, isBestseller: false, published: true, stock: 25,
  },
  {
    name: 'Mustard Block Print Anarkali',
    slug: 'mustard-block-print-anarkali',
    category: 'Anarkalis', categorySlug: 'anarkalis',
    collections: ['new-arrivals'],
    price: 3500,
    image: 'https://picsum.photos/seed/p10/400/600',
    images: ['https://picsum.photos/seed/p10/400/600', 'https://picsum.photos/seed/p10b/400/600'],
    fabric: 'Cambric Cotton', colors: ['Mustard', 'Yellow'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Bold, earthy, and brimming with character. This mustard cambric anarkali features hand-done block printing in a traditional rajasthani motif. The flared A-line cut is universally flattering and effortlessly festive.',
    details: ['Fabric: Cambric Cotton', 'Work: Hand Block Print + Tassel Hem', 'Dupatta: Printed cotton dupatta', 'Occasion: Navratri, Festive, Casual', 'Care: Hand Wash Cold'],
    isNew: true, isSale: false, isBestseller: false, published: true, stock: 18,
  },
  {
    name: 'Pearl & Kundan Choker Set',
    slug: 'pearl-kundan-choker-set',
    category: 'Accessories', categorySlug: 'accessories',
    collections: ['bridal-edit-2025'],
    price: 2200,
    image: 'https://picsum.photos/seed/p11/400/600',
    images: ['https://picsum.photos/seed/p11/400/600', 'https://picsum.photos/seed/p11b/400/600'],
    fabric: 'Gold-plated brass with pearl and kundan',
    colors: ['Gold', 'White Pearl'],
    sizes: ['Free Size'],
    description: 'Adorned in the language of queens. This kundan choker set pairs a layered pearl necklace with matching jhumka earrings and a maang tikka. Handcrafted by artisans in Jaipur — the fine detail speaks for itself.',
    details: ['Material: Gold-plated Brass, Fresh Water Pearls, Kundan Stones', 'Set: Necklace + Earrings + Maang Tikka', 'Occasion: Bridal, Wedding Guests, Festive', 'Care: Wipe clean with soft cloth, avoid water'],
    isNew: false, isSale: false, isBestseller: true, published: true, stock: 15,
  },
  {
    name: 'Gold Jhumka Earrings',
    slug: 'gold-jhumka-earrings',
    category: 'Accessories', categorySlug: 'accessories',
    collections: ['festive-glow'],
    price: 850, originalPrice: 1200,
    image: 'https://picsum.photos/seed/p12/400/600',
    images: ['https://picsum.photos/seed/p12/400/600'],
    fabric: 'Antique Gold-plated Brass',
    colors: ['Gold', 'Antique Gold'],
    sizes: ['Free Size'],
    description: 'The classic Indian earring, perfected. These antique gold jhumkas feature intricate filigree work and small pearl drops — the right weight, the right swing, the right statement for every occasion.',
    details: ['Material: Antique Gold-plated Brass', 'Closure: Push Back', 'Weight: 18g per pair', 'Occasion: Festive, Daily, Office', 'Care: Avoid contact with perfume and water'],
    isNew: false, isSale: true, isBestseller: false, published: true, stock: 30,
  },
  {
    name: 'Powder Blue Indo-Western Co-ord',
    slug: 'powder-blue-indo-western-coord',
    category: 'Indo-Western', categorySlug: 'indo-western',
    collections: ['new-arrivals'],
    price: 5600,
    image: 'https://picsum.photos/seed/p13/400/600',
    images: ['https://picsum.photos/seed/p13/400/600', 'https://picsum.photos/seed/p13b/400/600'],
    fabric: 'Georgette', colors: ['Powder Blue', 'Sky Blue'],
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'East meets West in the most elegant way. This powder blue georgette co-ord features a cropped embroidered jacket paired with wide-leg palazzo pants. A study in the beauty of fusion dressing.',
    details: ['Fabric: Georgette with Embroidered Jacket', 'Set: Cropped Jacket + Palazzo Pants', 'Inner: Slip cami included', 'Occasion: Cocktail, Engagement, Festive', 'Care: Dry Clean Preferred'],
    isNew: true, isSale: false, isBestseller: false, published: true, stock: 9,
  },
  {
    name: 'Ruby Red Kanjeevaram Saree',
    slug: 'ruby-red-kanjeevaram-saree',
    category: 'Sarees', categorySlug: 'sarees',
    collections: ['bridal-edit-2025', 'festive-glow'],
    price: 18500,
    image: 'https://picsum.photos/seed/p14/400/600',
    images: ['https://picsum.photos/seed/p14/400/600', 'https://picsum.photos/seed/p14b/400/600', 'https://picsum.photos/seed/p14c/400/600'],
    fabric: 'Pure Kanjeevaram Silk', colors: ['Ruby Red', 'Deep Red', 'Gold'],
    sizes: ['Free Size'],
    description: 'The heirloom you will pass down. Pure ruby Kanjeevaram silk with a gold temple border and a richly woven pallu depicting peacock motifs — a saree that transcends seasons and trends to become part of your story.',
    details: ['Fabric: Pure Kanjeevaram Silk (GI Tagged)', 'Work: Traditional Temple Border with Gold Zari Pallu', 'Blouse: Running blouse included (1 metre)', 'Length: 6 metres', 'Occasion: Wedding, Pooja, Festive, Bridal', 'Care: Dry Clean Only'],
    isNew: false, isSale: false, isBestseller: true, published: true, stock: 3,
  },
  {
    name: 'Lavender Organza Dupatta',
    slug: 'lavender-organza-dupatta',
    category: 'Dupattas', categorySlug: 'dupattas',
    collections: ['summer-pastels'],
    price: 1200,
    image: 'https://picsum.photos/seed/p15/400/600',
    images: ['https://picsum.photos/seed/p15/400/600'],
    fabric: 'Pure Organza with Mukaish Work', colors: ['Lavender', 'Lilac'],
    sizes: ['Free Size'],
    description: 'Weightless and ethereal, this lavender organza dupatta is finished with silver mukaish work along the border — a whisper of shimmer that elevates any outfit it accompanies.',
    details: ['Fabric: Pure Organza', 'Work: Silver Mukaish (Wire-work) Border', 'Dimensions: 2.5 metres', 'Occasion: Pairs with salwar kameez, anarkali, or kurta sets', 'Care: Dry Clean Only'],
    isNew: false, isSale: false, isBestseller: false, published: true, stock: 22,
  },
  {
    name: 'Coral Printed Kurta',
    slug: 'coral-printed-kurta',
    category: 'Kurtas & Tops', categorySlug: 'kurtas-tops',
    collections: ['new-arrivals', 'summer-pastels'],
    price: 1800,
    image: 'https://picsum.photos/seed/p16/400/600',
    images: ['https://picsum.photos/seed/p16/400/600', 'https://picsum.photos/seed/p16b/400/600'],
    fabric: 'Rayon', colors: ['Coral', 'Peach', 'Orange'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Your go-to ethnic top for the season. This vibrant coral kurta features a bold floral print and a contemporary A-line cut. Style with white palazzo pants for a fresh, modern ethnic look.',
    details: ['Fabric: Soft Rayon', 'Work: Digital Floral Print', 'Style: A-line with Side Slits', 'Occasion: Casual, Work, Family Lunch', 'Care: Machine Wash Gentle'],
    isNew: true, isSale: false, isBestseller: false, published: true, stock: 35,
  },
  {
    name: 'Gold Beaded Potli Bag',
    slug: 'gold-beaded-potli-bag',
    category: 'Accessories', categorySlug: 'accessories',
    collections: ['festive-glow', 'bridal-edit-2025'],
    price: 1500,
    image: 'https://picsum.photos/seed/p17/400/600',
    images: ['https://picsum.photos/seed/p17/400/600', 'https://picsum.photos/seed/p17b/400/600'],
    fabric: 'Velvet with Gold Bead Embroidery',
    colors: ['Gold', 'Champagne'],
    sizes: ['Free Size'],
    description: 'The perfect companion for evening events and weddings. This hand-beaded potli in deep gold velvet is a work of craft — every bead placed by hand, every closure finished with a silk tassel. Small but unforgettable.',
    details: ['Material: Velvet + Gold Seed Beads + Silk Lining', 'Closure: Drawstring with tassel', 'Size: 20cm x 15cm', 'Interior: Full silk lining with card slot', 'Occasion: Wedding, Festive, Evening Events', 'Care: Spot clean only'],
    isNew: false, isSale: false, isBestseller: true, published: true, stock: 12,
  },
  {
    name: 'Sage Green Linen Ethnic Set',
    slug: 'sage-green-linen-ethnic-set',
    category: 'Ethnic Sets', categorySlug: 'ethnic-sets',
    collections: ['summer-pastels'],
    price: 4800, originalPrice: 5800,
    image: 'https://picsum.photos/seed/p18/400/600',
    images: ['https://picsum.photos/seed/p18/400/600', 'https://picsum.photos/seed/p18b/400/600'],
    fabric: 'Premium Linen', colors: ['Sage Green', 'Olive'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Effortless, grounded, and quietly beautiful. This sage linen ethnic set features a mandarin collar kurta with hand-embroidered hem, paired with matching wide-leg pants. The kind of outfit that feels like second skin.',
    details: ['Fabric: 100% Belgian Linen', 'Work: Hand Embroidery at Hem and Neckline', 'Set: Kurta + Wide-leg Pants', 'Occasion: Casual, Office, Weekend', 'Care: Hand Wash Cold, Dry Flat'],
    isNew: false, isSale: true, isBestseller: false, published: true, stock: 14,
  },
  {
    name: 'Crimson Bridal Dupatta',
    slug: 'crimson-bridal-dupatta',
    category: 'Dupattas', categorySlug: 'dupattas',
    collections: ['bridal-edit-2025'],
    price: 3500,
    image: 'https://picsum.photos/seed/p19/400/600',
    images: ['https://picsum.photos/seed/p19/400/600', 'https://picsum.photos/seed/p19b/400/600'],
    fabric: 'Pure Silk with Gotta Work',
    colors: ['Crimson', 'Red', 'Gold'],
    sizes: ['Free Size'],
    description: 'A bridal dupatta that tells its own story. Crafted from pure silk and finished with traditional gotta patti along all four borders — drape it over your head for a bridal veil or across your shoulder for maximum impact.',
    details: ['Fabric: Pure Silk', 'Work: Gotta Patti (Silver + Gold) all borders', 'Embellishments: Pearl drops at corners', 'Dimensions: 2.7 metres', 'Occasion: Bridal, Wedding Guest', 'Care: Dry Clean Only'],
    isNew: false, isSale: false, isBestseller: false, published: true, stock: 7,
  },
  {
    name: 'Terracotta Bandhani Salwar Kameez',
    slug: 'terracotta-bandhani-salwar-kameez',
    category: 'Salwar Kameez', categorySlug: 'salwar-kameez',
    collections: ['festive-glow', 'new-arrivals'],
    price: 3200,
    image: 'https://picsum.photos/seed/p20/400/600',
    images: ['https://picsum.photos/seed/p20/400/600', 'https://picsum.photos/seed/p20b/400/600'],
    fabric: 'Georgette Bandhani', colors: ['Terracotta', 'Rust', 'Orange'],
    sizes: ['S', 'M', 'L', 'XL', 'Free Size'],
    description: 'The ancient art of tie-dye, elevated. This terracotta Bandhani salwar kameez celebrates Rajasthani craft tradition in a contemporary silhouette. The earthy warmth of terracotta pairs beautifully with the intricate dot patterns of authentic Bandhani.',
    details: ['Fabric: Georgette with Bandhani Tie-Dye', 'Work: Authentic Rajasthani Bandhani', 'Set: Kameez + Palazzo Pants + Stole', 'Occasion: Navratri, Festive, Casual Ethnic', 'Care: Dry Clean Only'],
    isNew: true, isSale: false, isBestseller: false, published: true, stock: 16,
  },
];

const HERO_SLIDES_DATA = [
  { title: 'Elegance Redefined', description: "Discover curated pieces that celebrate the modern woman's heritage.", tag: 'Collection 2025', href: '/collections/new-arrivals', ctaLabel: 'Shop Now', order: 0, imageUrl: 'https://picsum.photos/seed/hero1/1400/600', published: true },
  { title: 'The Wedding Edit', description: 'Exquisite bridal and occasion wear for your most special moments.', tag: 'Bridal 2025', href: '/collections/bridal-edit-2025', ctaLabel: 'Shop Bridal', order: 1, imageUrl: 'https://picsum.photos/seed/hero2/1400/600', published: true },
  { title: 'Luxury in Every Stitch', description: 'Timeless designs meet modern craftsmanship in our premium collection.', tag: 'Festive Glow', href: '/collections/festive-glow', ctaLabel: 'Shop Now', order: 2, imageUrl: 'https://picsum.photos/seed/hero3/1400/600', published: true },
];

const STUDIO_REELS_DATA = [
  { title: 'Boutique BTS', tag: '#StudioVibes', imageUrl: 'https://picsum.photos/seed/reel1/400/700', order: 0, published: true },
  { title: 'Styling the Silk', tag: '#NehaStyles', imageUrl: 'https://picsum.photos/seed/reel2/400/700', order: 1, published: true },
  { title: 'Happy Customer', tag: '#PehnavaFamily', imageUrl: 'https://picsum.photos/seed/reel3/400/700', order: 2, published: true },
  { title: 'Jaipur Diaries', tag: '#Heritage', imageUrl: 'https://picsum.photos/seed/reel4/400/700', order: 3, published: true },
  { title: 'Fusion Friday', tag: '#ModernEthnic', imageUrl: 'https://picsum.photos/seed/reel5/400/700', order: 4, published: true },
];

// ── Component ──────────────────────────────────────────────────────────────────
type SeedStatus = 'idle' | 'seeding' | 'done' | 'error';

export default function SeedPage() {
  const db = useFirestore();
  const [status, setStatus] = useState<SeedStatus>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [counts, setCounts] = useState({ collections: 0, categories: 0, products: 0, heroSlides: 0, reels: 0 });

  const appendLog = (msg: string) => setLog(prev => [...prev, msg]);

  const handleSeed = async () => {
    if (!db) return;
    setStatus('seeding');
    setLog([]);
    setCounts({ collections: 0, categories: 0, products: 0, heroSlides: 0, reels: 0 });

    try {
      // Seed Collections
      appendLog('Seeding collections…');
      let colCount = 0;
      for (const col of COLLECTIONS_DATA) {
        await addDoc(collection(db, 'collections'), { ...col, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        colCount++;
        appendLog(`  ✓ Collection: ${col.name}`);
      }

      // Seed Categories
      appendLog('Seeding categories…');
      let catCount = 0;
      for (const cat of CATEGORIES_DATA) {
        await addDoc(collection(db, 'categories'), { ...cat, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        catCount++;
        appendLog(`  ✓ Category: ${cat.name}`);
      }

      // Seed Products
      appendLog('Seeding products…');
      let prodCount = 0;
      for (const prod of PRODUCTS_DATA) {
        await addDoc(collection(db, 'products'), { ...prod, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        prodCount++;
        appendLog(`  ✓ Product: ${prod.name}`);
      }

      // Seed Hero Slides
      appendLog('Seeding hero slides…');
      let slideCount = 0;
      for (const slide of HERO_SLIDES_DATA) {
        await addDoc(collection(db, 'hero_slides'), { ...slide, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        slideCount++;
        appendLog(`  ✓ Slide: ${slide.title}`);
      }

      // Seed Studio Reels
      appendLog('Seeding studio reels…');
      let reelCount = 0;
      for (const reel of STUDIO_REELS_DATA) {
        await addDoc(collection(db, 'studio_reels'), { ...reel, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        reelCount++;
        appendLog(`  ✓ Reel: ${reel.title}`);
      }

      // Seed featured product config (use first product with a slug from PRODUCTS_DATA)
      appendLog('Seeding featured product config…');
      await setDoc(doc(db, 'configs', 'featured_product'), {
        productSlug: 'rose-gold-sequin-lehenga-set',
        headline: '',
        updatedAt: serverTimestamp(),
      });
      appendLog("  ✓ Featured product: rose-gold-sequin-lehenga-set");

      setCounts({ collections: colCount, categories: catCount, products: prodCount, heroSlides: slideCount, reels: reelCount });
      appendLog('');
      appendLog(`Done! Created ${colCount} collections, ${catCount} categories, ${prodCount} products, ${slideCount} hero slides, ${reelCount} reels.`);
      setStatus('done');
    } catch (e: any) {
      appendLog(`ERROR: ${e.message}`);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Demo Data Seed</h1>
        <p className="text-sm text-muted-foreground">Populate Firestore with 4 collections, 10 categories, 20 products, 3 hero slides, 5 reels, and 1 featured product config.</p>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-amber-50 border border-amber-100">
        <CardContent className="p-6 flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Run once only</p>
            <p className="text-xs text-amber-700 mt-1">This will add new records each time it runs. Do not click twice. Remove this page or restrict it after seeding.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-white">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> Seed Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-3">
          {[
            { label: 'Collections', count: 4, items: COLLECTIONS_DATA.map(c => c.name) },
            { label: 'Categories', count: 10, items: CATEGORIES_DATA.map(c => c.name) },
            { label: 'Products', count: 20, items: PRODUCTS_DATA.map(p => p.name) },
            { label: 'Hero Slides', count: 3, items: HERO_SLIDES_DATA.map(s => s.title) },
            { label: 'Studio Reels', count: 5, items: STUDIO_REELS_DATA.map(r => r.title) },
            { label: 'Config', count: 1, items: ['featured_product → rose-gold-sequin-lehenga-set'] },
          ].map(group => (
            <details key={group.label} className="group">
              <summary className="flex items-center justify-between p-4 rounded-xl bg-slate-50 cursor-pointer list-none hover:bg-slate-100 transition-colors">
                <span className="text-sm font-bold text-slate-700">{group.label}</span>
                <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-full">{group.count}</span>
              </summary>
              <div className="pl-4 pt-2 pb-1 flex flex-wrap gap-1.5">
                {group.items.map(name => (
                  <span key={name} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{name}</span>
                ))}
              </div>
            </details>
          ))}
        </CardContent>
      </Card>

      {status === 'idle' && (
        <Button
          onClick={handleSeed}
          className="w-full h-14 rounded-full font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Seed Demo Data
        </Button>
      )}

      {status === 'seeding' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Seeding Firestore…</p>
        </div>
      )}

      {(status === 'seeding' || status === 'done' || status === 'error') && log.length > 0 && (
        <Card className="border-none shadow-sm rounded-3xl bg-slate-900">
          <CardContent className="p-6 font-mono text-xs text-green-400 max-h-96 overflow-y-auto space-y-0.5">
            {log.map((line, i) => (
              <p key={i} className={line.startsWith('ERROR') ? 'text-red-400' : line.startsWith('Done') ? 'text-white font-bold' : ''}>{line || '\u00A0'}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {status === 'done' && (
        <Card className="border-none shadow-sm rounded-3xl bg-green-50 border border-green-100">
          <CardContent className="p-6 flex items-start gap-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-800">Seeding complete!</p>
              <p className="text-xs text-green-700 mt-1">
                Created {counts.collections} collections, {counts.categories} categories, {counts.products} products, {counts.heroSlides} hero slides, {counts.reels} studio reels. Head to the live site to see them.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'error' && (
        <Button
          onClick={handleSeed}
          variant="outline"
          className="w-full h-14 rounded-full font-bold uppercase text-[10px] tracking-[0.2em] border-red-200 text-red-600 hover:bg-red-50"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
