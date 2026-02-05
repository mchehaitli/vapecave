// Service Worker for Vape Cave - Aggressive Performance Optimization
const CACHE_NAME = 'vape-cave-v2';
const RUNTIME_CACHE = 'runtime-v2';

// Uncacheable URL schemes that should be skipped
const UNCACHEABLE_SCHEMES = [
  'chrome-extension:',
  'moz-extension:',
  'safari-extension:',
  'edge-extension:',
  'about:',
  'blob:',
  'data:',
];

// Critical resources to cache immediately
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
];

// Resources to cache on runtime
const CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com\//,
  /^https:\/\/fonts\.gstatic\.com\//,
  /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp)$/,
  /\/api\/store-locations/,
  /\/api\/featured-brands/,
];

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip requests with uncacheable URL schemes (browser extensions, etc.)
  try {
    const url = new URL(request.url);
    if (UNCACHEABLE_SCHEMES.some(scheme => url.protocol === scheme)) {
      return;
    }
    
    // Skip cross-origin requests that aren't in our cache patterns
    if (url.origin !== self.location.origin && 
        !CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
      return;
    }
  } catch (error) {
    // Invalid URL, skip it
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);

  // Handle different types of resources with appropriate strategies
  if (request.destination === 'document') {
    // Network first for HTML documents
    event.respondWith(networkFirstStrategy(request));
  } else if (CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    // Cache first for static assets and fonts
    event.respondWith(cacheFirstStrategy(request));
  } else if (url.pathname.startsWith('/api/')) {
    // Network first with short cache for API calls
    event.respondWith(networkFirstWithTimeout(request, 3000));
  }
});

// Network first strategy (for HTML documents)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline fallback if available
    return new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return a fallback or placeholder if needed
    if (request.destination === 'image') {
      return new Response('', { status: 404 });
    }
    throw error;
  }
}

// Network first with timeout (for API calls)
async function networkFirstWithTimeout(request, timeout = 3000) {
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), timeout)
      )
    ]);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Background sync for failed API calls
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Handle any queued requests here
  console.log('Background sync triggered');
}