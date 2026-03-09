# **App Name**: Pehnava by Neha

## Core Features:

- Product Catalog & Discovery: Browse, filter, and search through ethnic wear, western/fusion clothing, accessories, and jewelry categories. Features include detailed product pages, product cards with quick add functionality, and live search results.
- WhatsApp OTP Authentication: Secure login and signup flow using only phone number verification via a one-time password (OTP) sent through WhatsApp Business Cloud API, eliminating the need for traditional passwords.
- Shopping Cart & Checkout: Manage items in a slide-in cart, input delivery details, and proceed to checkout with a manual UPI payment process involving a static QR code, UPI ID, and the upload of a payment screenshot.
- Customer Account & Order Tracking: Customers can access their personalized dashboard, view order history, track order status with a visual step tracker, manage saved addresses, and update their profile details.
- Admin Product & Content Management: An administrative interface for adding, editing, and managing product listings (including images, variants, stock, and pricing) and configuring dynamic homepage content like hero banners, featured products, and collection grids.
- Admin Order Processing & WhatsApp Notification Tool: A dedicated admin tool to review and manage customer orders, confirm UPI payments, update order statuses (e.g., 'Packed', 'Shipped', 'Delivered'), and automate customer communication using smart, templated WhatsApp messages based on order status changes and order details.
- Payment Gateway & External Integrations: Handle storage for product images and payment screenshots, and orchestrate all backend logic including Supabase (PostgreSQL) database operations, custom phone/OTP authentication, and Meta WhatsApp Business Cloud API communication for messages.

## Style Guidelines:

- Primary color: Deep Crimson (#8B1A3A). A rich and bold hue conveying luxury and heritage, it provides strong contrast against lighter backgrounds and is used for key interactive elements.
- Accent color: Warm Gold (#C9A96E). A sophisticated, earthy gold providing an elegant contrast and used to highlight important information or secondary call-to-actions, maintaining the luxury feel.
- Background color: Warm White (#FEFAF8). A light, clean, and inviting off-white that serves as the main canvas for content, providing an airy and feminine backdrop.
- Secondary UI elements color: Blush Pink (#FDF0F2). A very light, desaturated pink, harmonizing with the crimson, suitable for subtle backgrounds, dividers, or softer text, reinforcing the feminine aesthetic.
- Headline and display font: 'Cormorant Garamond' (serif). Its elegant, classic structure imparts an editorial and luxurious feel for titles and prominent text. Note: currently only Google Fonts are supported.
- Body text font: 'DM Sans' (sans-serif). A clean, modern sans-serif that ensures high readability for longer text passages and general interface elements, complementing the display font without competing.
- Icons should be minimalist and refined, consistent with a luxury boutique aesthetic. The logo will feature a crown/floral motif alongside custom typography.
- The layout emphasizes a modern, mobile-first, and elegant design, utilizing generous whitespace, a sticky header/announcement bar, a floating WhatsApp support button, and responsive grids for product displays, adapting seamlessly across devices.
- Implement subtle and smooth page transitions, fading auto-rotating hero banner slides, and use content-aware loading skeletons instead of spinners for a more polished user experience during data fetching.