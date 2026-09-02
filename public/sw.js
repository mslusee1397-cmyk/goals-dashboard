// Service worker disabled for the web build.
// Keep this file as a self-removing worker so browsers that installed the old
// cached version will unregister it and delete the old cache automatically.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))),
      self.registration.unregister()
    ]).then(() => self.clients.claim())
  )
})
