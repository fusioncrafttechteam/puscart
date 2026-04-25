// Service Worker for Puscart Delivery
const CACHE_NAME = 'puscart-v1.0.0';
const STATIC_CACHE = 'puscart-static-v1';
const DYNAMIC_CACHE = 'puscart-dynamic-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/assets/Puscart logo.jpeg',
  'https://checkout.razorpay.com/v1/checkout.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
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
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Handle different request types
  if (url.origin === self.location.origin) {
    // Same origin requests
    event.respondWith(handleSameOriginRequest(request));
  } else if (url.href.includes('razorpay.com')) {
    // Razorpay requests - always network first
    event.respondWith(handleRazorpayRequest(request));
  } else {
    // Other cross-origin requests - network only
    event.respondWith(fetch(request));
  }
});

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
    console.error('❌ Service Worker: Fetch failed:', error);
    
    // Try to serve from cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for HTML requests
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

// Handle Razorpay requests with network-first strategy
async function handleRazorpayRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache Razorpay script for offline use
    if (request.url.includes('checkout.js') && networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Service Worker: Razorpay request failed:', error);
    
    // Try to serve cached Razorpay script
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
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
    console.log('🔄 Service Worker: Background update failed:', error);
  }
}

// Handle background sync for offline payments
self.addEventListener('sync', (event) => {
  if (event.tag === 'payment-sync') {
    event.waitUntil(syncPendingPayments());
  }
});

// Sync pending payments when back online
async function syncPendingPayments() {
  try {
    console.log('🔄 Service Worker: Syncing pending payments...');
    
    // Get pending payments from IndexedDB
    const pendingPayments = await getPendingPayments();
    
    for (const payment of pendingPayments) {
      try {
        // Retry payment verification
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment.data)
        });
        
        if (response.ok) {
          // Remove from pending payments
          await removePendingPayment(payment.id);
          console.log('✅ Service Worker: Payment synced successfully');
        }
      } catch (error) {
        console.error('❌ Service Worker: Payment sync failed:', error);
      }
    }
  } catch (error) {
    console.error('❌ Service Worker: Sync failed:', error);
  }
}

// IndexedDB helpers for offline payment storage
async function getPendingPayments() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PuscartDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingPayments'], 'readonly');
      const store = transaction.objectStore('pendingPayments');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingPayments')) {
        db.createObjectStore('pendingPayments', { keyPath: 'id' });
      }
    };
  });
}

async function removePendingPayment(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PuscartDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingPayments'], 'readwrite');
      const store = transaction.objectStore('pendingPayments');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Handle push notifications for order updates
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/src/assets/Puscart logo.jpeg',
      badge: '/src/assets/Puscart logo.jpeg',
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

console.log('🚀 Service Worker: Loaded successfully');
