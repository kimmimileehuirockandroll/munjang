// 모락모락 독서로그 - 앱 껍데기 오프라인 캐시
const CACHE = 'moramoram-v1';
const SHELL = ['./', './index.html', './icon.svg', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  // OCR 라이브러리/언어데이터 등 외부 리소스는 네트워크 우선
  if (url.includes('tesseract') || url.includes('fonts.') || url.includes('jsdelivr') || url.includes('unpkg')) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (e.request.method === 'GET' && res.ok && url.startsWith(self.location.origin)) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
