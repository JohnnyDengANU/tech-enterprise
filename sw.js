/**
 * Service Worker — 视频缓存优化 v3
 * 简化缓存策略：m3u8 网络优先，TS 分片依赖浏览器 HTTP 缓存
 * 支持 jsDelivr CDN 跨域 URL
 */

const CACHE_VERSION = 'video-hls-v3';
const HLS_CACHE = 'hls-segments-v3';
const MAX_TS_CACHE = 60; // 最多缓存 60 个 TS 分片（约 6 分钟视频）

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_VERSION && key !== HLS_CACHE)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // TS 分片 — 缓存优先，但限制总缓存数量
    if (url.pathname.endsWith('.ts')) {
        event.respondWith(
            caches.open(HLS_CACHE).then(cache =>
                cache.match(event.request).then(cached => {
                    if (cached) return cached;
                    return fetch(event.request).then(response => {
                        if (response.status === 200) {
                            // 缓存前检查数量限制
                            cache.keys().then(keys => {
                                if (keys.length >= MAX_TS_CACHE) {
                                    // 删除最早的分片
                                    keys.slice(0, keys.length - MAX_TS_CACHE + 1).forEach(key => {
                                        cache.delete(key);
                                    });
                                }
                            });
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    }).catch(() => cached);
                })
            )
        );
        return;
    }

    // M3U8 播放列表 — 网络优先（需获取最新版本），失败则用缓存
    if (url.pathname.endsWith('.m3u8')) {
        event.respondWith(
            fetch(event.request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_VERSION).then(cache =>
                    cache.put(event.request, clone)
                );
                return response;
            }).catch(() =>
                caches.match(event.request)
            )
        );
        return;
    }

    // poster.jpg — 缓存优先
    if (url.pathname.endsWith('poster.jpg') || url.pathname.endsWith('poster_backup.jpg')) {
        event.respondWith(
            caches.match(event.request).then(cached =>
                cached || fetch(event.request).then(response => {
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_VERSION).then(cache =>
                            cache.put(event.request, clone)
                        );
                    }
                    return response;
                })
            )
        );
        return;
    }
});
