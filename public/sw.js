// Minimal service worker. Chrome's PWA install criteria require a registered
// service worker with a fetch handler — this provides exactly that and nothing
// more (no offline caching yet; kept intentionally simple).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // Pass-through: requests go to the network as normal. The handler's presence
  // is what satisfies installability.
});
