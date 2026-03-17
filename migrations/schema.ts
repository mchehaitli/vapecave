import { pgTable, unique, serial, text, boolean, integer, timestamp, numeric, json, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const blogPosts = pgTable("blog_posts", {
        id: serial().primaryKey().notNull(),
        title: text().notNull(),
        slug: text().notNull(),
        summary: text().notNull(),
        content: text().notNull(),
        featuredImage: text("featured_image").default('),
        isPublished: boolean("is_published").default(true),
        isFeatured: boolean("is_featured").default(false),
        metaTitle: text("meta_title").default('),
        metaDescription: text("meta_description").default('),
        jsonldSchema: text("jsonld_schema").default('),
        viewCount: integer("view_count").default(0),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        unique("blog_posts_slug_unique").on(table.slug),
]);

export const brandCategories = pgTable("brand_categories", {
        id: serial().primaryKey().notNull(),
        category: text().notNull(),
        bgClass: text("bg_class").default('bg-gradient-to-br from-gray-900 to-gray-800'),
        displayOrder: integer("display_order").default(0),
        intervalMs: integer("interval_ms").default(5000),
});

export const brands = pgTable("brands", {
        id: serial().primaryKey().notNull(),
        categoryId: integer("category_id").notNull(),
        name: text().notNull(),
        image: text().notNull(),
        description: text().notNull(),
        displayOrder: integer("display_order").default(0),
});

export const cloverOauthTokens = pgTable("clover_oauth_tokens", {
        id: serial().primaryKey().notNull(),
        merchantId: text("merchant_id").notNull(),
        accessToken: text("access_token").notNull(),
        refreshToken: text("refresh_token").notNull(),
        expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        unique("clover_oauth_tokens_merchant_id_unique").on(table.merchantId),
]);

export const deliveryCustomers = pgTable("delivery_customers", {
        id: serial().primaryKey().notNull(),
        email: text().notNull(),
        passwordHash: text("password_hash"),
        fullName: text("full_name").notNull(),
        phone: text().notNull(),
        address: text().notNull(),
        city: text().notNull(),
        state: text().notNull(),
        zipCode: text("zip_code").notNull(),
        lat: numeric().notNull(),
        lng: numeric().notNull(),
        photoIdUrl: text("photo_id_url").notNull(),
        approvalStatus: text("approval_status").default('pending').notNull(),
        approvedBy: integer("approved_by"),
        approvedAt: timestamp("approved_at", { mode: 'string' }),
        rejectionReason: text("rejection_reason"),
        passwordSetupToken: text("password_setup_token"),
        passwordSetupTokenExpiry: timestamp("password_setup_token_expiry", { mode: 'string' }),
        passwordResetToken: text("password_reset_token"),
        passwordResetExpiry: timestamp("password_reset_expiry", { mode: 'string' }),
        mustChangePassword: boolean("must_change_password").default(false),
        hasSeenWelcomeModal: boolean("has_seen_welcome_modal").default(false),
        emailConsent: boolean("email_consent").default(false).notNull(),
        marketingConsent: boolean("marketing_consent").default(false).notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        unique("delivery_customers_email_unique").on(table.email),
]);

export const cartItems = pgTable("cart_items", {
        id: serial().primaryKey().notNull(),
        customerId: integer("customer_id").notNull(),
        productId: integer("product_id").notNull(),
        quantity: integer().default(1).notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
        purchaseType: text("purchase_type").default('single'),
});

export const deliveryWindows = pgTable("delivery_windows", {
        id: serial().primaryKey().notNull(),
        date: text().notNull(),
        startTime: text("start_time").notNull(),
        endTime: text("end_time").notNull(),
        capacity: integer().default(10).notNull(),
        currentBookings: integer("current_bookings").default(0).notNull(),
        enabled: boolean().default(true).notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const heroSlides = pgTable("hero_slides", {
        id: serial().primaryKey().notNull(),
        title: text().notNull(),
        subtitle: text(),
        image: text(),
        buttonText: text("button_text"),
        buttonLink: text("button_link"),
        displayOrder: integer("display_order").default(0),
        enabled: boolean().default(true),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
        mediaType: text("media_type").default('image').notNull(),
        mediaUrl: text("media_url").notNull(),
});

export const newsletterSubscriptions = pgTable("newsletter_subscriptions", {
        id: serial().primaryKey().notNull(),
        email: text().notNull(),
        subscribedAt: timestamp("subscribed_at", { mode: 'string' }).defaultNow().notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        source: text().default('website'),
        ipAddress: text("ip_address").default('),
        lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        unique("newsletter_subscriptions_email_unique").on(table.email),
]);

export const productCategories = pgTable("product_categories", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        slug: text().notNull(),
        description: text().default('),
        displayOrder: integer("display_order").default(0),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        unique("product_categories_slug_unique").on(table.slug),
]);

export const products = pgTable("products", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        description: text().notNull(),
        price: text(),
        hidePrice: boolean("hide_price").default(false),
        image: text().notNull(),
        category: text().notNull(),
        categoryId: integer("category_id"),
        featured: boolean().default(false),
        featuredLabel: text("featured_label").default('),
        stock: integer().default(0),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
        id: serial().primaryKey().notNull(),
        key: text().notNull(),
        value: text().notNull(),
        description: text(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        unique("settings_key_unique").on(table.key),
]);

export const siteSettings = pgTable("site_settings", {
        id: serial().primaryKey().notNull(),
        infoBarMessage: text("info_bar_message").default('Free delivery on orders over $100!'),
        infoBarEnabled: boolean("info_bar_enabled").default(true),
        freeDeliveryThreshold: numeric("free_delivery_threshold", { precision: 10, scale:  2 }).default('100'),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const storeLocations = pgTable("store_locations", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        city: text().notNull(),
        address: text().notNull(),
        fullAddress: text("full_address").notNull(),
        phone: text().notNull(),
        hours: text().notNull(),
        closedDays: text("closed_days").default('),
        image: text().notNull(),
        lat: text().notNull(),
        lng: text().notNull(),
        googlePlaceId: text("google_place_id").default('),
        appleMapsLink: text("apple_maps_link").default('),
        mapEmbed: text("map_embed").notNull(),
        email: text().default('),
        storeCode: text("store_code").default('),
        openingHours: json("opening_hours").notNull(),
        services: json().notNull(),
        acceptedPayments: json("accepted_payments").notNull(),
        areaServed: json("area_served").notNull(),
        publicTransit: text("public_transit").default('),
        parking: text().default('),
        yearEstablished: integer("year_established").notNull(),
        priceRange: text("price_range").notNull(),
        socialProfiles: json("social_profiles"),
        description: text().notNull(),
        neighborhoodInfo: text("neighborhood_info").default('),
        amenities: json().notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
        sid: varchar({ length: 255 }).primaryKey().notNull(),
        sess: text().notNull(),
        expire: timestamp({ mode: 'string' }).notNull(),
});

export const users = pgTable("users", {
        id: serial().primaryKey().notNull(),
        username: text().notNull(),
        password: text().notNull(),
        isAdmin: boolean("is_admin").default(false).notNull(),
}, (table) => [
        unique("users_username_unique").on(table.username),
]);

export const weeklyDeliveryTemplates = pgTable("weekly_delivery_templates", {
        id: serial().primaryKey().notNull(),
        dayOfWeek: integer("day_of_week").notNull(),
        startTime: text("start_time").notNull(),
        endTime: text("end_time").notNull(),
        capacity: integer().default(10).notNull(),
        enabled: boolean().default(true).notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const deliveryBrands = pgTable("delivery_brands", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        slug: text().notNull(),
        categoryId: integer("category_id").notNull(),
        logo: text(),
        displayOrder: integer("display_order").default(0),
        isActive: boolean("is_active").default(true),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
        featuredProductIds: json("featured_product_ids").default([]),
}, (table) => [
        unique("delivery_brands_slug_unique").on(table.slug),
]);

export const deliveryProducts = pgTable("delivery_products", {
        id: serial().primaryKey().notNull(),
        cloverItemId: text("clover_item_id"),
        name: text().notNull(),
        brand: text(),
        price: numeric({ precision: 10, scale:  2 }).notNull(),
        salePrice: numeric("sale_price", { precision: 10, scale:  2 }),
        image: text(),
        images: json().default([]),
        description: text(),
        category: text(),
        badge: text(),
        displayOrder: integer("display_order").default(0),
        isFeaturedSlideshow: boolean("is_featured_slideshow").default(false),
        slideshowPosition: integer("slideshow_position").default(0),
        stockQuantity: numeric("stock_quantity").default('0'),
        enabled: boolean().default(true),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
        brandId: integer("brand_id"),
        showOnHomePage: boolean("show_on_home_page").default(false),
        homePageOrder: integer("home_page_order").default(0),
        productLineId: integer("product_line_id"),
        isHeroSlideshow: boolean("is_hero_slideshow").default(false),
        customName: text("custom_name"),
        nicotineOverride: text("nicotine_override"),
        allowPackToggle: boolean("allow_pack_toggle").default(false),
        packSize: integer("pack_size").default(1),
        packDiscountPercent: integer("pack_discount_percent").default(0),
        isPackOnly: boolean("is_pack_only").default(false),
}, (table) => [
        unique("delivery_products_clover_item_id_unique").on(table.cloverItemId),
]);

export const deliveryCategories = pgTable("delivery_categories", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        slug: text().notNull(),
        image: text(),
        displayOrder: integer("display_order").default(0),
        isActive: boolean("is_active").default(true),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
        featuredProductIds: json("featured_product_ids").default([]),
        mappedCategories: json("mapped_categories").default([]),
}, (table) => [
        unique("delivery_categories_slug_unique").on(table.slug),
]);

export const deliveryProductLines = pgTable("delivery_product_lines", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        slug: text().notNull(),
        brandId: integer("brand_id").notNull(),
        logo: text(),
        displayOrder: integer("display_order").default(0),
        isActive: boolean("is_active").default(true),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
        featuredProductIds: json("featured_product_ids").default([]),
        parentId: integer("parent_id"),
}, (table) => [
        unique("delivery_product_lines_slug_unique").on(table.slug),
]);

export const promotions = pgTable("promotions", {
        id: serial().primaryKey().notNull(),
        code: text().notNull(),
        description: text(),
        discountType: text("discount_type").notNull(),
        discountValue: numeric("discount_value", { precision: 10, scale:  2 }).notNull(),
        minimumOrderAmount: numeric("minimum_order_amount", { precision: 10, scale:  2 }).default('0'),
        maxUsageCount: integer("max_usage_count"),
        currentUsageCount: integer("current_usage_count").default(0).notNull(),
        maxUsagePerCustomer: integer("max_usage_per_customer").default(1),
        validFrom: timestamp("valid_from", { mode: 'string' }).notNull(),
        validUntil: timestamp("valid_until", { mode: 'string' }).notNull(),
        enabled: boolean().default(true).notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        unique("promotions_code_unique").on(table.code),
]);

export const promotionUsages = pgTable("promotion_usages", {
        id: serial().primaryKey().notNull(),
        promotionId: integer("promotion_id").notNull(),
        customerId: integer("customer_id").notNull(),
        orderId: integer("order_id").notNull(),
        discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }).notNull(),
        usedAt: timestamp("used_at", { mode: 'string' }).defaultNow().notNull(),
});

export const cartReminders = pgTable("cart_reminders", {
        id: serial().primaryKey().notNull(),
        customerId: integer("customer_id").notNull(),
        lastReminderSent: timestamp("last_reminder_sent", { mode: 'string' }),
        reminderCount: integer("reminder_count").default(0).notNull(),
        cartLastUpdated: timestamp("cart_last_updated", { mode: 'string' }),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        unique("cart_reminders_customer_id_unique").on(table.customerId),
]);

export const deliveryOrders = pgTable("delivery_orders", {
        id: serial().primaryKey().notNull(),
        customerId: integer("customer_id").notNull(),
        deliveryWindowId: integer("delivery_window_id"),
        deliveryAddress: text("delivery_address").notNull(),
        subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
        deliveryFee: numeric("delivery_fee", { precision: 10, scale:  2 }).default('0').notNull(),
        total: numeric({ precision: 10, scale:  2 }).notNull(),
        status: text().default('pending').notNull(),
        cloverPaymentId: text("clover_payment_id"),
        notes: text(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
        billingAddress: text("billing_address"),
        billingCity: text("billing_city"),
        billingState: text("billing_state"),
        billingZipCode: text("billing_zip_code"),
        sameAsDelivery: boolean("same_as_delivery").default(true),
        tax: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
        paymentMethod: text("payment_method").default('cash').notNull(),
        paymentStatus: text("payment_status").default('pending').notNull(),
        cloverChargeId: text("clover_charge_id"),
        cardLast4: text("card_last_4"),
        cardBrand: text("card_brand"),
        discount: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
        promoCode: text("promo_code"),
        promotionId: integer("promotion_id"),
        refundAmount: numeric("refund_amount", { precision: 10, scale:  2 }),
        refundReason: text("refund_reason"),
        refundedAt: timestamp("refunded_at", { mode: 'string' }),
        cloverRefundId: text("clover_refund_id"),
        fulfillmentMode: text("fulfillment_mode").default('delivery').notNull(),
});

export const categoryBanners = pgTable("category_banners", {
        id: serial().primaryKey().notNull(),
        categoryId: integer("category_id").notNull(),
        title: text(),
        subtitle: text(),
        image: text().notNull(),
        buttonText: text("button_text").default('Shop Now'),
        buttonLink: text("button_link"),
        displayOrder: integer("display_order").default(0),
        isActive: boolean("is_active").default(true),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const deliveryOrderItems = pgTable("delivery_order_items", {
        id: serial().primaryKey().notNull(),
        orderId: integer("order_id").notNull(),
        productId: integer("product_id").notNull(),
        quantity: integer().notNull(),
        price: numeric({ precision: 10, scale:  2 }).notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        purchaseType: text("purchase_type").default('single'),
});

export const emailTemplates = pgTable("email_templates", {
        id: serial().primaryKey().notNull(),
        templateId: text("template_id").notNull(),
        templateName: text("template_name").notNull(),
        subject: text().notNull(),
        bodyText: text("body_text").notNull(),
        availableVariables: text("available_variables").notNull(),
}, (table) => [
        unique("email_templates_template_id_unique").on(table.templateId),
]);

export const restockRequests = pgTable("restock_requests", {
        id: serial().primaryKey().notNull(),
        customerId: integer("customer_id").notNull(),
        productId: integer("product_id").notNull(),
        status: text().default('pending').notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        notifiedAt: timestamp("notified_at", { mode: 'string' }),
});
