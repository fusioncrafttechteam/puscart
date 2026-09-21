// Service Worker for Puscart Delivery
const CACHE_NAME = 'puscart-v1.1.0'; // Bumped to force cache invalidation
const STATIC_CACHE = 'puscart-static-v2'; // Bumped to force cache invalidation
const DYNAMIC_CACHE = 'puscart-dynamic-v2'; // Bumped to force cache invalidation

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/puscart-192.jpeg',
  '/icons/puscart-512.jpeg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching, but let them through
  if (request.method !== 'GET') {
    // For POST/PUT/DELETE requests, always go to network
    // This includes payment requests, checkout requests, etc.
    return;
  }
  
  // Handle different request types with enhanced security
  if (url.origin === self.location.origin) {
    // Same origin requests - but skip critical routes
    if (url.pathname.includes('/checkout') || 
        url.pathname.includes('/order') ||
        url.pathname.includes('/auth/') ||
        url.pathname.includes('/functions/v1/')) {
      // Critical checkout/auth routes - always network first
      event.respondWith(handleCriticalRequest(request));
    } else {
      // Regular same origin requests
      event.respondWith(handleSameOriginRequest(request));
    }
  } else if (url.href.includes('supabase.co')) {
    // All Supabase requests (Edge Functions and REST API) - network only
    event.respondWith(handleSupabaseRequest(request));
  } else if (url.href.includes('razorpay.com')) {
    // CRITICAL: Razorpay requests must NEVER be intercepted by Service Worker
    // Bypass Service Worker completely to prevent CSP violations and cache issues
    return;
  } else {
    // Other cross-origin requests - network only
    event.respondWith(fetch(request));
  }
});

// Handle critical requests (checkout, order) with network-first strategy
async function handleCriticalRequest(request) {
  try {
    // Don't intercept POST requests or Supabase API calls
    if (request.method !== 'GET' || 
        request.url.includes('supabase.co') ||
        request.url.includes('razorpay.com')) {
      return fetch(request);
    }
    
    const networkResponse = await fetch(request);
    
    return networkResponse;
  } catch (error) {
    // For critical requests, don't fall back to cache - let the error propagate
    throw error;
  }
}

// Handle Supabase Edge Functions and API requests
async function handleSupabaseRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Handle same-origin requests with cache-first strategy
async function handleSameOriginRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Serve from cache, update in background
      updateCacheInBackground(request);
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response('Offline - Please check your internet connection', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}


// Update cache in background
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silent background update failure
  }
}


// Handle push notifications for order updates
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icons/puscart-192.jpeg',
      badge: '/icons/puscart-192.jpeg',
      vibrate: [200, 100, 200],
      data: data,
      actions: [
        { action: 'view', title: 'View Order' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(`/order-details/${event.notification.data.orderId}`)
    );
  }
});

