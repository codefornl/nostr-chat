self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // Laat alles gewoon door (geen caching nodig)
});
