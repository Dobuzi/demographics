/**
 * Service Worker for Demographics app.
 * Caches static assets (HTML, CSS, JS, GeoJSON) and recent KOSIS data
 * for offline viewing. Uses a cache-first strategy for static assets
 * and a network-first strategy for data files.
 */

const CACHE_NAME = "demographics-v1";

/** Static assets that form the application shell. */
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./styles.css",
  "./geo/region_mapping.js",
  "./geo/flow_style.js",
  "./geo/geo_utils.js",
  "./geo/data_utils.js",
  "./geo/data_processing.js",
  "./assets/geo/korea_sido.geojson",
  "./assets/geo/sido_office_centers.json",
];

/** Maximum number of data responses to keep in cache. */
const MAX_DATA_ENTRIES = 5;

/**
 * Install event — pre-cache static assets.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/**
 * Activate event — clean up old cache versions.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

/**
 * Check whether a URL points to a KOSIS data file.
 * @param {string} url
 * @returns {boolean}
 */
function isDataRequest(url) {
  return url.includes("kosis_") && (url.endsWith(".json") || url.endsWith(".json.gz"));
}

/**
 * Trim data entries in cache to stay within MAX_DATA_ENTRIES.
 * Removes the oldest data entries first.
 * @param {Cache} cache
 * @returns {Promise<void>}
 */
async function trimDataCache(cache) {
  const keys = await cache.keys();
  const dataKeys = keys.filter((req) => isDataRequest(req.url));
  while (dataKeys.length > MAX_DATA_ENTRIES) {
    const oldest = dataKeys.shift();
    await cache.delete(oldest);
  }
}

/**
 * Fetch event — route requests through caching strategies.
 *
 * Static assets: cache-first (fall back to network).
 * Data files: network-first (fall back to cache for offline use).
 * External resources (fonts, CDN): cache-first after first fetch.
 */
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  /* Skip non-GET requests */
  if (event.request.method !== "GET") return;

  if (isDataRequest(url)) {
    /* Network-first for data files */
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
              trimDataCache(cache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  /* Cache-first for everything else */
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
