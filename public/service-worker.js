const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "index.js",
    "/indexedDB.js",
    "/styles.css"
];

const CACHE_NAME = "precache";
const DATA_CACHE_NAME = "data-cache";

// install
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches
        .open(CACHE_NAME)
        .then(cache => {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// activate
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches
        .keys()
        .then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// fetch
self.addEventListener("fetch", event => {
    if (event.request.url.includes('/api/')) {
        console.log('[Service Worker] Fetch(data)', event.request.url);

        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(event.request)
                    .then(response => {
                        if (response.status === 200) {
                            cache.put(event.request.url, response.clone());
                        }
                        return response;
                    })
                    .catch(err => {
                        return cache.match(event.request);
                    });
            })
        );
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                return response || fetch(event.request);
            });
        })
    );
});