const CACHE_NAME = 'vmix-master-v3';
const CORE_ASSETS = [
    './',
    './index.html',
    './output.css',
    './logo.svg',
    './manifest.webmanifest',
    './Sortable.min.js',
    './js/tools.js',
    './js/vmix-api.js',
    './js/box.js',
    './js/vmix-info.js',
    './js/vmix-web.js',
    './js/compare-vmix-info.js',
    './js/custom-functions.js',
    './js/script.js',
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
                ),
            ),
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then(async (response) => {
                if (response.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(event.request, response.clone());
                }
                return response;
            })
            .catch(async () => {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;

                if (event.request.mode === 'navigate') {
                    const cachedIndex = await caches.match('./index.html');
                    if (cachedIndex) return cachedIndex;
                }

                return Response.error();
            }),
    );
});
