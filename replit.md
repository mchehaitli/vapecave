# Vape Cave Smoke & Stuff Website

## Overview
This project is a full-stack e-commerce website for "Vape Cave Smoke & Stuff" in Frisco, TX, featuring a React frontend, Express.js backend, and PostgreSQL database. Its core purpose is to establish an online presence, manage products, facilitate customer interactions, and offer local delivery within a 3-mile radius of the Frisco store. The website prioritizes comprehensive local SEO and integrates with the Clover POS system for inventory and order management.

## User Preferences
Preferred communication style: Simple, everyday language.
Custom domain: vapecavetx.com (NOT vapecavefrisco.com)

## System Architecture
### UI/UX Decisions
The design incorporates a dark/light theme with a vibrant palette (Vibrant Orange, Electric Green, Hot Pink) and a charcoal background for dark mode. Product cards feature an orange glow. It uses Poppins and Open Sans fonts, Font Awesome and Lucide React icons, and UI components built with Radix UI and shadcn/ui.

### Technical Implementations
- **Frontend**: React with TypeScript, Vite, Tailwind CSS, Wouter, TanStack Query, and Framer Motion. Optimizations include lazy loading, code splitting, service worker caching, and PWA support.
- **Backend**: Node.js with Express.js (TypeScript, ES modules), and Drizzle ORM for PostgreSQL. Features session-based authentication, security headers, and static asset caching.
- **Key Features**:
    - **Frisco-Only Focus**: Dedicated local page with Google Maps, store hours, and local SEO.
    - **SEO & Local Search Optimization**: Structured data, location-specific meta tags, sitemap, and robots.txt.
    - **Admin Dashboard**: Protected routes for managing content, products, and settings.
    - **Email Integration**: Contact forms and newsletters via Gmail API.
    - **3-Mile Delivery Radius**: Enforced on both frontend and backend.
    - **Performance Optimization**: Image optimization, resource hints, and server-side compression.
    - **Clover POS Integration**: OAuth 2.0 for inventory sync, payment processing, and order management.
    - **Delivery Fee Configuration**: Dynamic calculation of delivery fees via admin settings.
    - **Delivery Customer Data Export**: Admin feature to export customer data and photo IDs.
    - **Promotional Codes**: Admin-managed promo codes with various discount types and validation.
    - **Admin Refund Processing**: Admins can process refunds via Clover.
    - **Editable Customer Profiles**: Customers can update personal and delivery information.
    - **Reorder Feature**: Customers can reorder previous orders with availability checks.
    - **PDF Receipt Generation**: Downloadable PDF receipts using PDFKit.
    - **Abandoned Cart Reminders**: Automatic email reminders for abandoned carts.
    - **Analytics Dashboard**: Admin dashboard with sales metrics, revenue charts, order status, top products, payment analysis, and customer analytics.

### System Design Choices
The application uses a modular architecture, separating frontend and backend. It prioritizes performance and SEO for local businesses, robust security through authentication and session management, and configurability for administrators.

## External Dependencies
- **Database**: PostgreSQL (Neon serverless), `@neondatabase/serverless`, Drizzle Kit.
- **Maps & Location**: Google Maps, Apple Maps, Geocoding.
- **Email Services**: Nodemailer, Gmail API.
- **Clover POS Integration**: OAuth 2.0, `https://api.clover.com`, `https://www.clover.com/oauth`.
- **UI & Styling**: Google Fonts, Font Awesome, Lucide React.
- **Archiving**: JSZip.

## Cart System Architecture
- **POST /api/delivery/cart**: Adds items. If item already exists, increments quantity (clamped to stock). If `quantity: 0`, removes the item. New items get inserted.
- **PATCH /api/delivery/cart/:id**: Sets absolute quantity on an existing cart item (validates against stock).
- **DELETE /api/delivery/cart/:id**: Removes a cart item.
- **Frontend pattern**: `addToCartMutation` (POST) for "Add" buttons. `updateCartMutation` (PATCH/DELETE) for +/- quantity controls. All pages parse server error messages for toast display.
- **Navbar cart count**: `cartItemCount` prop passed to `DeliveryHeader` on all browse pages (Brand, Category, Sale, ProductLine, Cart, Checkout).
- **Variant grouping**: E-liquid/salt products with multiple nic levels grouped into single cards with selectable nic pills on Brand, Category, ProductLine, and Sale pages.
- **Card style**: All delivery portal product cards (grid and list) use the standardized Category page style — always-visible compact Eye (Quick View) + Plus (Add) icon buttons next to price. No hover gradient overlays, no quantity steppers in browse cards.

## Multi-Unit Pricing (Singles vs. Full Pack)
- **Schema fields** (web-only, never pushed to Clover catalog): `allowPackToggle` (boolean), `packSize` (integer, default 1), `packDiscountPercent` (integer, default 0), `isPackOnly` (boolean).
- **purchaseType** field on `cartItems` and `deliveryOrderItems`: `"single"` (default) or `"pack"`.
- **Pack price formula**: `Math.round(price × packSize × (1 − discountPercent/100) × 100) / 100`.
- **Inventory multiplier**: Pack purchases deduct `quantity × packSize` units from Clover stock.
- **Active Stock Push**: On order completion, `cloverService.deductStockForOrder()` pushes stock deductions to Clover immediately. The 5-min passive sync remains as a safety net.
- **Clover sync protection**: `syncProductsFromClover` and `refreshProductStockAndPrice` never touch pack fields.
- **Admin UI**: "Bulk/Pack Pricing" section in product edit dialog with toggle, pack size, discount %, pack-only, and live price preview.
- **Frontend**: Single/Pack toggle on product cards across all pages (DeliveryPortal, Category, Brand, Sale, ProductLine) and QuickView modal. Cart/Checkout display pack labels and correct pricing. All pages pass `purchaseType` through add-to-cart mutations; pack-only products default to `'pack'`.
- **UI enhancements**: "each" suffix on prices for pack-eligible products; green "Save X%" badge on product images; `[Single | Pack]` toggle on grid cards (not list mode — too compact).
- **Stock guardrails**: Pack toggle disabled when `stockQuantity < packSize`; QuickView caps pack quantity to `Math.floor(stockQuantity / packSize)`; DeliveryPortal auto-reverts toggle to Single when stock insufficient.
- **Cart warning**: Amber inline alert on pack cart items when `stockQuantity < quantity × packSize` — "Insufficient stock for a full pack."

## Fulfillment Hybrid System (Pickup/Delivery)
- **FulfillmentContext** (`client/src/contexts/FulfillmentContext.tsx`): React context providing `{fulfillmentMode, setFulfillmentMode}` with `"delivery" | "pickup"` modes (default: `"delivery"`). Wrapped around all routes via `App.tsx`.
- **DeliveryHeader toggle**: Clickable pill badge next to logo — green "Delivery" or yellow "Pickup". Toggles between modes globally.
- **DeliveryCart**: In pickup mode, delivery fee = $0, delivery progress bars hidden, pickup banner shown instead.
- **DeliveryCheckout**: In pickup mode, delivery address/window cards hidden; "Pickup Information" card shown instead; payment options show "Pay in Store" instead of "Cash on Delivery"; delivery fee hidden from order summary; delivery zone validation skipped.
- **Confirmation Popup**: On "Place Order" click, shows confirmation dialog with fulfillment method, total, payment method. Cash/pay-in-store orders show "Items will be held until end of business day" warning. Order only processes on confirm.
- **FloatingCartButton**: Uses fulfillment context to hide delivery fees/progress in pickup mode.
- **Stock badge rule**: Only "Out of Stock" badge/overlay on customer-facing cards; QuickView retains all stock states (In Stock, Low Stock, Out of Stock).
- **Two-tier sort**: All product listings sorted by Brand Name A-Z → Product Name A-Z.