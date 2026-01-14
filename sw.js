 Service Worker untuk PWA capabilities (Optional)
# Cache static files for offline access

CACHE_NAME = 'asset-app-v1'
urls_to_cache = [
    '/',
    '/index.html',
    '/app.js',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js'
]

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urls_to_cache))
    )
})

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                # Cache hit - return response
                if (response) {
                    return response
                }
                return fetch(event.request)
            })
    )
})
