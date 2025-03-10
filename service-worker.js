const CACHE_NAME = 'menu-cache-v1';
const urlsToCache = [
    'https://docs.google.com/gview?url=https://drive.google.com/uc?id=1KY8vSR1zdysLWHWT_MjiaKoMUCvN9qKm&embedded=true',
    'https://docs.google.com/gview?url=https://drive.google.com/uc?id=1oVyHAZ5xnMceZcolkbiZC6U99qNIzct3&embedded=true',
    'https://docs.google.com/gview?url=https://drive.google.com/uc?id=1aIc6KCSoPyrcZIe4Z_6b9MSSh-N7neyy&embedded=true',
    'https://docs.google.com/gview?url=https://drive.google.com/uc?id=140piNM28iJzAVrxEKVpQrOxdCsaHf6kB&embedded=true'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return caches.open(CACHE_NAME).then(cache => {
                return fetch(event.request).then(response => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            });
        })
    );
}); 