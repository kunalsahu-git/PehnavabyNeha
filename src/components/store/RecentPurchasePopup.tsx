
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { ALL_PRODUCTS } from '@/lib/store-data';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

const LOCATIONS = ["Jaipur", "Mumbai", "Delhi", "Bengaluru", "Ahmedabad", "Pune", "Hyderabad", "Udaipur", "Indore", "Surat", "Kolkata", "Chennai"];
const NAMES = ["Neha S.", "Priya K.", "Anjali R.", "Mehak G.", "Ritu M.", "Sneha V.", "Pooja B.", "Isha D.", "Babita J.", "Zoya F.", "Radhika P."];

type Purchase = {
  name: string;
  location: string;
  productName: string;
  image: string;
  time: string;
};

export function RecentPurchasePopup() {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showRandomPurchase = () => {
      const randomProduct = ALL_PRODUCTS[Math.floor(Math.random() * ALL_PRODUCTS.length)];
      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randomLoc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      const randomMins = Math.floor(Math.random() * 15) + 1;

      setPurchase({
        name: randomName,
        location: randomLoc,
        productName: randomProduct.name,
        image: randomProduct.image,
        time: `${randomMins} minutes ago`
      });
      setIsVisible(true);

      // Hide after 6 seconds
      setTimeout(() => setIsVisible(false), 6000);
    };

    // Initial delay
    const initialTimeout = setTimeout(showRandomPurchase, 8000);

    // Repeat every 30-50 seconds
    const interval = setInterval(() => {
      showRandomPurchase();
    }, Math.floor(Math.random() * 20000) + 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!purchase) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-[60] pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="pointer-events-auto flex w-[280px] md:w-[360px] bg-white rounded-lg shadow-[0_15px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden relative"
          >
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 p-1 hover:bg-slate-50 rounded-full transition-colors z-10"
            >
              <X className="h-3.5 w-3.5 text-slate-400" />
            </button>

            <div className="relative w-20 md:w-28 aspect-square flex-shrink-0 bg-secondary/10">
              <Image
                src={purchase.image}
                alt={purchase.productName}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex flex-col justify-center p-3 md:p-4 pr-7 space-y-0.5 md:space-y-1">
              <p className="text-[12px] md:text-sm font-medium text-slate-600 leading-tight">
                <span className="font-bold text-slate-900">{purchase.name}</span> from <span className="font-bold text-slate-900">{purchase.location}</span> purchased
              </p>
              <p className="text-[12px] md:text-sm font-bold text-primary truncate">
                {purchase.productName}
              </p>
              <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {purchase.time}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
