'use client';

import { usePathname } from 'next/navigation';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { WhatsAppFAB } from "@/components/layout/WhatsAppFAB";
import { AIAssistant } from "@/components/layout/AIAssistant";
import { RecentPurchasePopup } from "@/components/store/RecentPurchasePopup";
import { cn } from "@/lib/utils";

/**
 * A wrapper component that conditionally renders storefront-specific UI elements.
 * It hides elements like the Header, Footer, and floating widgets when on admin routes.
 */
export function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdmin && <AnnouncementBar />}
      {!isAdmin && <Header />}
      <main className={cn(isAdmin ? "w-full" : "min-h-screen")}>
        {children}
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppFAB />}
      {!isAdmin && <AIAssistant />}
      {!isAdmin && <RecentPurchasePopup />}
    </>
  );
}
