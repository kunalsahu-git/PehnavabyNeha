
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { WhatsAppFAB } from "@/components/layout/WhatsAppFAB";
import { AIAssistant } from "@/components/layout/AIAssistant";
import { RecentPurchasePopup } from "@/components/store/RecentPurchasePopup";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export const metadata: Metadata = {
  title: 'Pehnava by Neha | Wear Your Story',
  description: 'Curated luxury women\'s fashion boutique specializing in South Asian heritage ethnic wear and fusion clothing.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background selection:bg-primary selection:text-primary-foreground">
        <FirebaseClientProvider>
          <WishlistProvider>
            <CartProvider>
              <AnnouncementBar />
              <Header />
              <main className="min-h-screen">
                {children}
              </main>
              <Footer />
              <WhatsAppFAB />
              <AIAssistant />
              <RecentPurchasePopup />
              <Toaster />
            </CartProvider>
          </WishlistProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
