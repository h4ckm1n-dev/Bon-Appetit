const CACHE_NAME = 'menu-cache-v1';
const STATIC_CACHE_NAME = 'static-cache-v1';

// Liste des menus PDF et des ressources statiques à mettre en cache
const menuURLs = [
    'https://docs.google.com/gview?url=https://drive.google.com/uc?id=1KY8vSR1zdysLWHWT_MjiaKoMUCvN9qKm&embedded=true',
    'https://docs.google.com/gview?url=https://drive.google.com/uc?id=1oVyHAZ5xnMceZcolkbiZC6U99qNIzct3&embedded=true',
    'https://docs.google.com/gview?url=https://drive.google.com/uc?id=1aIc6KCSoPyrcZIe4Z_6b9MSSh-N7neyy&embedded=true',
    'https://docs.google.com/gview?url=https://drive.google.com/uc?id=140piNM28iJzAVrxEKVpQrOxdCsaHf6kB&embedded=true'
];

const staticAssets = [
    '/',
    '/index.html',
    'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2'
];

// Installation: mise en cache des ressources statiques
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            // Cache pour les ressources statiques
            caches.open(STATIC_CACHE_NAME)
                .then(cache => {
                    console.log('Mise en cache des ressources statiques');
                    return cache.addAll(staticAssets);
                }),
            // Cache pour les menus (on ne les précache pas tous pour économiser la bande passante)
            caches.open(CACHE_NAME)
                .then(() => {
                    console.log('Cache des menus initialisé');
                    // Nous ne préchargeons pas les menus ici - ils seront ajoutés au cache lors de leur accès
                    return Promise.resolve();
                })
        ])
    );
    // Activer immédiatement le nouveau service worker
    self.skipWaiting();
});

// Activation: nettoyage des anciens caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
                        console.log('Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Faire que ce service worker prenne le contrôle de toutes les pages
    return self.clients.claim();
});

// Stratégie de mise en cache des menus: Network-first avec fallback sur le cache
self.addEventListener('fetch', event => {
    
    // Vérifier si la demande est pour un menu PDF
    const isMenuPDF = menuURLs.some(menuURL => event.request.url.includes(menuURL));
    
    if (isMenuPDF) {
        // Stratégie Network-first pour les menus PDF
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Mettre en cache la réponse fraîche
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    return response;
                })
                .catch(() => {
                    // Fallback sur le cache si le réseau échoue
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            console.log('Menu non trouvé dans le cache et réseau indisponible');
                            // On pourrait retourner une page d'erreur personnalisée ici
                        });
                })
        );
    } else {
        // Pour les autres ressources, utiliser une stratégie Cache-first
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    // Sinon, demander au réseau
                    return fetch(event.request)
                        .then(response => {
                            // Ne mettre en cache que les réponses valides
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }
                            
                            // Mettre en cache pour utilisation future
                            const responseToCache = response.clone();
                            caches.open(STATIC_CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                            
                            return response;
                        });
                })
        );
    }
}); 