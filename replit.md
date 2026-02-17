# Vape Cave Smoke & Stuff Website

## Overview
This project is a full-stack e-commerce website for "Vape Cave Smoke & Stuff" in Frisco, TX, featuring a React frontend, Express.js backend, and PostgreSQL database. Its core purpose is to establish an online presence, manage products, facilitate customer interactions, and offer local delivery within a 3-mile radius of the Frisco store. The website prioritizes comprehensive local SEO and integrates with the Clover POS system for inventory and order management.

## User Preferences
Preferred communication style: Simple, everyday language.

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