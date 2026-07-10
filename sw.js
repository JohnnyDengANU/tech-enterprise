/**
 * Service Worker — 视频分片缓存
 * 缓存 HLS TS 分片以加速重复访问
 */

const CACHE_VERSION = 'video-hls-v1';
const HLS_CACHE = 'hls-segments-v1';

// 安装时激活
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
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // TS 分片 — 缓存优先（永久缓存已下载的分片）
    if (url.pathname.endsWith('.ts')) {
        event.respondWith(
            caches.open(HLS_CACHE).then(cache =>
                cache.match(event.request).then(cached => {
                    if (cached) return cached;
                    return fetch(event.request).then(response => {
                        // 仅缓存成功响应
                        if (response.status === 200) {
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
    if (url.pathname.endsWith('poster.jpg')) {
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
