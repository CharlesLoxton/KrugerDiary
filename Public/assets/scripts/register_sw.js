// register-sw.js
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/assets/scripts/register_sw.js')
            .then(function(registration) {
                console.log('Service Worker registered with scope:', registration);
            }, function(err) {
                console.log('Service Worker registration failed:', err);
            });
    });
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('v1').then((cache) => {
            return cache.addAll([
                '/assets/css/timeline.css',
                '/assets/img/favicon.png',
                '/assets/img/icon.png',
                '/assets/img/krugerdiary.png',
                '/assets/scripts/db.js',
                '/create',
                '/'
            ]);
        })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
                console.log("made valid repsonse")
                return response;
            }
  
            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = response.clone();
  
            caches.open('v1')
                .then((cache) => {
                    cache.put(event.request, responseToCache);
                });
  
            return response;
        }).catch(() => {
            // Network request failed, try to get it from the cache.
            return caches.match(event.request).then((response) => {
                return response || caches.match('/'); // Provide a default fallback if both network and cache fail
            });
        })
    );
  });
  
    
