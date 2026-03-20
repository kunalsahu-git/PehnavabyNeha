import type {Metadata} from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { StorefrontLayout } from "@/components/layout/StorefrontLayout";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export const metadata: Metadata = {
  title: 'Pehnava by Neha | Wear Your Story',
  description: 'Curated luxury women\'s fashion boutique specializing in South Asian heritage ethnic wear and fusion clothing.',
  icons: {
    icon: [
      { url: '/images/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/favicon/favicon.ico', sizes: 'any' },
    ],
    apple: { url: '/images/favicon/apple-touch-icon.png', sizes: '180x180' },
    other: [
      { rel: 'android-chrome', url: '/images/favicon/android-chrome-192x192.png', sizes: '192x192' },
      { rel: 'android-chrome', url: '/images/favicon/android-chrome-512x512.png', sizes: '512x512' },
    ],
  },
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
              <StorefrontLayout>
                {children}
              </StorefrontLayout>
              <Toaster />
            </CartProvider>
          </WishlistProvider>
        </FirebaseClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
