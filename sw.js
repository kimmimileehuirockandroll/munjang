// 문장서랍 - 서비스워커 (네트워크 우선 → 항상 최신, 오프라인일 때만 캐시)
const CACHE = 'munjang-v3';
const SHELL = ['./', './index.html', './icon.svg', './manifest.webmanifest'];

self.addEventListener('install', e => {
  // 새 버전 즉시 적용 (대기 안 함)
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // 예전 캐시(구 버전) 모두 삭제
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 외부(CDN: tesseract, 폰트 등)는 브라우저 기본 처리에 맡김
  if (url.origin !== self.location.origin) return;
  // 같은 사이트 파일은 "네트워크 우선": 인터넷 되면 항상 최신, 안 되면 캐시로 폴백
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
