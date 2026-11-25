/* Modo offline do app: guarda as telas, os dados e o visual na primeira visita. */
const CACHE = "b3-app-v1";
const ARQUIVOS = ["./", "./index.html", "./app.css", "./app.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png",
  "../css/styles.css", "../assets/b3-logo.png", "../js/data.js", "../js/catalogo.js", "../js/util.js", "../js/mercado.js", "../js/charts.js", "../js/carteira.js",
  "../js/cripto.js", "../js/rentabilidade.js", "../js/proventos.js", "../js/feed.js", "../js/videos.js", "../js/views-perfil.js", "../js/chat.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
// Arquivos do próprio site: tenta a rede primeiro (para pegar a versão nova) e cai no cache se estiver offline.
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; }).catch(() => caches.match(e.request)));
});
