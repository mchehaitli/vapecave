# Vape Cave Smoke & Stuff Website

## Overview

This project is a full-stack e-commerce website for "Vape Cave Smoke & Stuff," specifically tailored for its Frisco, TX location. It features a React frontend, an Express.js backend, and a PostgreSQL database. The primary goals are to establish a strong online presence, manage product catalogs, facilitate customer interactions, and offer local delivery services within a 3-mile radius of the Frisco store. The application emphasizes comprehensive SEO for local search visibility and integrates with the Clover POS system for inventory and order management.

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

## SEO Enhancement Plan (February 2026)

A comprehensive Local SEO overhaul aligned with the Google Maps profile to rank #1 in Frisco, TX. Source of truth constants:
- **Business Name:** "Vape Cave Smoke & Stuff" (Short: "Vape Cave")
- **Single Location:** Frisco, TX ONLY
- **Address:** 6958 Main St, Suite 200, Frisco, TX 75033
- **Phone:** (469) 294-0061
- **Email:** vapecavetx@gmail.com
- **Hours:** Mon-Sun: 10:00 AM – 12:00 AM (Midnight)
- **Coordinates:** 33.1507 (Lat), -96.8236 (Long)

Tasks completed:
1. Removed all Arlington references (AdminPage placeholders, manifest.json)
2. Updated logo alt tag to "Vape Cave Smoke & Stuff - Frisco, TX"
3. Updated JSON-LD schema in index.html (added VaporizerStore type, alternateName)
4. Updated title, meta description, and canonical tag in index.html
5. Updated hero sub-text to "Located on Main Street | Open Daily 10AM - Midnight"
6. Fixed footer: correct phone (469) 294-0061, hard-coded address, hours
7. Audited sitemap.xml, robots.txt, added loading="lazy" and Frisco alt tags to product images
8. Added 4 hyper-local SEO landing pages (/disposables, /thca-flower, /glass-hookah, /vape-juice) via reusable SeoLandingPage component
9. Inserted 3 Frisco-themed blog posts into database (disposables guide, THCA/Delta-8 legal guide, community spotlight)
10. Updated sitemap.xml with all SEO landing page URLs
11. **Removed all Kratom references** from entire codebase (meta tags, routes, sitemaps) - product not sold
12. Renamed /thca-hemp route to /thca-flower, removed /kratom-cbd route entirely
13. Updated SeoLandingPage meta description formula: "{headline}. Visit Vape Cave in Frisco, TX for {title}. Open Daily 10AM-12AM on Main St. Call (469) 294-0061."
14. Updated HomePage meta title: "Vape Cave | #1 Vape Shop in Frisco, TX (Open Late)"
15. Updated index.html JSON-LD schema to `SmokeShop` type with `@id`, `url`, `priceRange`, `hasMap`, and multiple images
16. Updated /disposables title to include "Raz" brand
16. Added neighborhood text to Footer for "near me" SEO targeting
17. Updated phone click tracking to use gtag event 'click_phone'
18. Added loading="lazy" and Frisco-branded alt text to all img tags across codebase

## Mobile SEO Optimization (February 2026)

### Changes Made:
1. **Enhanced JSON-LD Schema**: Separated LocalBusiness and FAQPage into distinct schema blocks for proper Google rich results. Added `alternateName`, `email`, `logo`, `description`, `sameAs` (social profiles), `areaServed` (6 nearby cities), `paymentAccepted`, `currenciesAccepted`, `potentialAction` (SearchAction). Expanded `openingHoursSpecification` to individual days per Google's recommendation. Changed `makesOffer` items from `Service` to `Product` type.
2. **Click-to-Call Everywhere**: Converted all plain-text phone numbers to `<a href="tel:+14692940061">` links with gtag click tracking on TermsPage, RefundPolicyPage, PrivacyPage, HomePage contact section, and GlobalFooter.
3. **Fixed Wrong Phone Number**: GlobalFooter had incorrect phone (469) 714-8888, corrected to (469) 294-0061.
4. **Mobile Tap Targets**: Increased mobile menu item height to min 44px (Navigation) and 48px (GlobalHeader) per Google's mobile-friendly guidelines. Added hover states and padding for easier tapping.
5. **Mobile Click-to-Call Buttons**: Added prominent "Call (469) 294-0061" buttons in both Navigation mobile menu and GlobalHeader mobile slide-out menu.
6. **Contact Page Quick Actions**: Added clickable phone, email, and directions cards above the contact form for instant mobile engagement.
7. **Mobile Meta Tags**: Added `geo.region`, `geo.placename`, `geo.position`, `ICBM` geo-targeting meta tags. Added `format-detection` for phone number detection. Added `mobile-web-app-capable`. Changed `theme-color` from green to brand orange (#FF7100).
8. **Footer Links Fixed**: Privacy Policy, Terms of Service, and Refund Policy links in Footer now route to actual pages instead of being non-functional spans.
9. **Email Typo Fixed**: Corrected "vapecavetex@gmail.com" to "vapecavetx@gmail.com" on Terms, Refund, and Privacy pages.

## Googlebot Visibility Fix (February 2026)

### Critical SEO Fixes:
1. **Invisible Content Fix**: Framer Motion animations use `initial={{ opacity: 0 }}` with `whileInView` which means Googlebot (which doesn't scroll) sees blank content. Added three layers of protection:
   - `<noscript>` CSS override for non-JS bots
   - `prefers-reduced-motion` CSS override for accessibility
   - Inline bot detection script that sets `data-bot` attribute on `<html>`, with CSS forcing `opacity: 1 !important` and `transform: none !important` on all animated elements
2. **Age Gate Bot Bypass**: Age verification modal is now skipped for detected search engine bots so they can see the actual page content without the overlay.
3. **Google Maps Links Fixed**: Replaced all `maps.app.goo.gl` shortened links with proper direct Google Maps URLs using Place ID (`ChIJZ2EXpXw9TIYRjUEpqkkI6Lg`).
4. **Bot Detection Covers**: Googlebot, Bingbot, Yandex, Baidu, DuckDuckBot, Slurp, Facebook, Twitter, LinkedIn, Semrush, Ahrefs, Mj12bot, Applebot, Petalbot.
5. **Timeout Fallback**: After 3.5 seconds, `data-visible` attribute set on `<html>` forces any still-hidden elements visible regardless of UA detection.

## Rich Results / Structured Data Fix (February 2026)

### Changes Made:
1. **Schema Type Fixed**: Changed `SmokeShop` (not a valid schema.org type) to `TobaccoStore` (official schema.org type recognized by Google).
2. **Product Schema Fixed**: Replaced `makesOffer` with `Offer`/`Product` items (which triggered incomplete Product validation errors in Rich Results test) with `hasOfferCatalog` using `OfferCatalog` type (doesn't require price/availability fields).
3. **Removed CBD & Delta Products**: Removed "CBD & Delta Products" entry from structured data per December 2025 temporary content removal.
4. **Removed OrderAction**: Removed unsupported `potentialAction: OrderAction` from LocalBusiness schema. `SearchAction` remains on the separate WebSite schema.
5. **Opening Hours Consolidated**: Consolidated 7 individual day entries into one using `dayOfWeek` array. Kept `23:59` closing time (safest representation for midnight that avoids ambiguity).
6. **Image URLs Fixed**: Updated `image` and `logo` fields to use actual file names (`vapecave-logo.png`, `vapecave-logo.svg`) instead of non-existent `logo.png` and `storefront.jpg`.
7. **hasMap URL Updated**: Changed from CID-based URL to proper Google Maps search URL with Place ID.
8. **WebSite Schema dateModified Updated**: Changed from `2025-05-09` to `2026-02-17`.

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