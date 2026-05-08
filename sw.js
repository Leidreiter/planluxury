const CACHE_NAME = 'lemora-shop-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/producto.html',
    '/carrito.html',
    '/favoritos.html',
    '/nosotros.html',
    '/faq.html',
    '/contacto.html',
    '/gracias.html',
    '/404.html',
    '/css/styles.css',
    '/js/template.js',
    '/js/menu.js',
    '/js/salida-popup.js',
    '/js/utils.js',
    '/js/productos.js',
    '/js/carrito.js',
    '/js/busqueda.js',
    '/js/productos-categorias.js',
    '/js/hero-slider.js',
    '/js/formulario.js',
    '/js/contacto-form.js',
    '/js/gracias.js',
    '/js/favoritos.js',
    '/js/faq.js',
    '/js/producto-detalle.js',
    '/img/lemora.svg',
    '/img/imagen-preview.jpg',
    '/img/logo.svg',
    '/img/banners/banner1.jpg',
    '/img/banners/banner2.jpg',
    '/img/banners/banner3.jpg',
    '/img/banners/banner4.jpg',
    '/img/banners/banner5.jpg',
    '/img/icon-banner1.png',
    '/img/icon-banner2.png',
    '/img/icon-banner3.png',
    '/img/hero.jpg',
    '/img/sliders/slider1.jpg',
    '/img/sliders/slider2.jpg',
    '/img/sliders/slider3.jpg',
    '/img/sliders/slider4.jpg',
    '/img/sliders/slider5.jpg',
    '/img/sliders/slider6.jpg',
    '/img/icono-pagos.png',
    '/img/icono-envios.png',
    '/img/icono-stock.png',
    '/img/productos/placeholder.png',
    '/img/icons/icon-72x72.png',
    '/img/icons/icon-96x96.png',
    '/img/icons/icon-128x128.png',
    '/img/icons/icon-144x144.png',
    '/img/icons/icon-152x152.png',
    '/img/icons/icon-192x192.png',
    '/img/icons/icon-384x384.png',
    '/img/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    (response) => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});