# Vape Cave Website

## Overview

This project is a full-stack e-commerce website for "Vape Cave," specifically tailored for its Frisco, TX location. It features a React frontend, an Express.js backend, and a PostgreSQL database. The primary goals are to establish a strong online presence, manage product catalogs, facilitate customer interactions, and offer local delivery services within a 3-mile radius of the Frisco store. The application emphasizes comprehensive SEO for local search visibility and integrates with the Clover POS system for inventory and order management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The design features a dual dark/light theme with a vibrant color palette including Vibrant Orange (#FF7100), Electric Green (#24A90D), and Hot Pink (#FB475E), using a pure charcoal background (#1A1A1A) for dark mode. Product cards incorporate an orange glow effect. The site uses Poppins and Open Sans fonts and incorporates icons from Font Awesome and Lucide React. UI components are built with Radix UI primitives and shadcn/ui.

### Technical Implementations
- **Frontend**: React with TypeScript, Vite for bundling, Tailwind CSS for styling, Wouter for routing, TanStack Query for state management, and Framer Motion for animations. Performance optimizations include lazy loading, code splitting, service worker caching, and PWA support.
- **Backend**: Node.js with Express.js (TypeScript, ES modules), Drizzle ORM for PostgreSQL. Features session-based authentication with bcrypt, comprehensive security headers, and static asset caching.
- **Key Features**:
    - **Frisco-Only Focus**: Dedicated local page with Google Maps, store hours, and local SEO.
    - **Brand Carousel System**: Dynamic, text-only brand carousels.
    - **SEO & Local Search Optimization**: Structured data (LocalBusiness, Organization), location-specific meta tags, sitemap, and robots.txt.
    - **Admin Dashboard**: Protected routes for managing content, products, and settings.
    - **Email Integration**: Contact forms and newsletters via Gmail API.
    - **3-Mile Delivery Radius**: Enforced on both frontend and backend based on Frisco store coordinates.
    - **Performance Optimization**: Significant page load speed improvements through various techniques like image optimization, resource hints, and server-side compression.
    - **Clover POS Integration**: OAuth 2.0-based integration for inventory sync, payment processing, and order management with automatic token refresh.
    - **Delivery Fee Configuration**: Dynamic calculation of delivery fees (flat, per-mile, per-item, or combined) managed via admin settings.
    - **Delivery Customer Data Export**: Admin feature to export customer data and photo IDs as a ZIP file.
    - **Promotional Codes**: Admin-managed promo codes with percentage/fixed discounts, usage limits, validity periods, and minimum order amounts. Server-side validation ensures secure discount application.
    - **Admin Refund Processing**: Admins can process refunds for exceptional cases via Clover integration. All sales are final for customers; only admins can issue refunds.
    - **Editable Customer Profiles**: Customers can update their name, phone, and delivery address from their account page with proper validation.
    - **Reorder Feature**: Customers can reorder previous orders with quantity validation and availability checking.
    - **PDF Receipt Generation**: Downloadable PDF receipts for orders using PDFKit, with separate endpoints for customers (own orders) and admins (any order).
    - **Abandoned Cart Reminders**: Automatic email reminders for abandoned carts. Tracks cart activity, sends max 2 reminders per customer at 48-hour intervals, clears tracking on checkout.
    - **Analytics Dashboard**: Admin dashboard with sales metrics, revenue charts (Recharts), order status breakdowns, top products, payment method analysis, customer analytics, and date range filtering.

### System Design Choices
The application adopts a modular architecture with clear separation between frontend and backend. It prioritizes performance and SEO for local businesses, ensuring fast load times and high search engine rankings. Security is addressed through robust authentication, session management, and security headers. The system is designed to be configurable, allowing administrators to manage delivery fees and other settings.

## Temporary Content Changes (December 2025)

**Hemp-Derived Product References Removed**: All references to hemp-derived products (Delta 8, Delta 9, Delta 10, THC-A, CBD, HHC, Carts) have been temporarily removed from public-facing marketing content and SEO metadata. This includes:
- HomePage.tsx: Title tags, meta descriptions, keywords, hero section, specialty badges
- FriscoLocationPage.tsx: Title tags, meta descriptions, keywords, structured data, hero section, FAQ schema, product descriptions
- ContactPage.tsx: Meta description
- BlogPage.tsx: Meta description, page content

**Content Retained**: The FAQ page (FAQPage.tsx) retains informational content about Texas SB 2024 law, as this is educational/legal information about the vape ban, not promotional content.

**Restoration**: To restore this content, use git history to revert the relevant commits or manually add back the removed terms.

## External Dependencies

- **Database**: PostgreSQL (configured for Neon serverless), `@neondatabase/serverless` driver, Drizzle Kit for migrations.
- **Maps & Location**: Google Maps (embedding), Apple Maps (deep linking), Geocoding (coordinate storage).
- **Email Services**: Nodemailer (testing), Gmail API (production emails).
- **Clover POS Integration**: OAuth 2.0 (authorization), `https://api.clover.com` (API base), `https://www.clover.com/oauth` (Auth base).
- **UI & Styling**: Google Fonts (Poppins, Open Sans), Font Awesome, Lucide React.
- **Archiving**: JSZip (for creating ZIP archives).

## Recent Updates (January 2026)

### Delivery Portal Enhancements
- **Enhanced Animations**: Added cool Framer Motion animations throughout the delivery portal including floating effects on featured products, pulsing badges, and smooth entrance animations.
- **Stock Status Display**: Consistent stock status indicators (Out of Stock, Low Stock, In Stock) across all delivery pages (category, brand, product line, sale pages).
- **Sale Price Display**: Strikethrough original pricing with sale prices displayed prominently across all product listings.
- **Navigation Active States**: Home and Shop buttons now glow with orange neon effect to show which page the customer is on.
- **Hero Section Improvements**: 
  - Video plays instantly with preload="auto"
  - Removed bottom fade gradient from video
  - Images auto-fit with object-cover
  - Free delivery banner moved above hero with reduced padding
  - Shop Now button with neon glow effect
  - Subtle neon glow borders on video and category banners
- **Category Filtering Fix**: Improved product-to-category matching to handle singular/plural differences (e.g., "E-Liquid" matches "E-Liquids").
- **Featured Tab Navigation**: Featured tab now correctly navigates to /delivery/shop.