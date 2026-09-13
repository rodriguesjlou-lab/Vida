/* =========================================================
   SERVICE WORKER — Meu Planner
   - Cacheia o "app shell" (arquivos locais) para funcionar offline
   - Cacheia em segundo plano os pacotes externos (React, Babel,
     Recharts, ícones) usados pelo app, para que também funcionem
     offline depois do primeiro carregamento
========================================================= */

const VERSAO_CACHE = "meu-planner-cache-v1";

const ARQUIVOS_APP_SHELL = [
  "./",
  "./index.html",
  "./app.jsx",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(VERSAO_CACHE)
      .then((cache) => cache.addAll(ARQUIVOS_APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves
            .filter((chave) => chave !== VERSAO_CACHE)
            .map((chave) => caches.delete(chave))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;

  // Só lidamos com requisições GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const mesmaOrigem = url.origin === self.location.origin;

  if (mesmaOrigem) {
    // App shell local: cache-first, com atualização em segundo plano
    evento.respondWith(
      caches.match(request).then((emCache) => {
        const buscaRede = fetch(request)
          .then((resposta) => {
            if (resposta && resposta.status === 200) {
              const copia = resposta.clone();
              caches.open(VERSAO_CACHE).then((cache) => cache.put(request, copia));
            }
            return resposta;
          })
          .catch(() => emCache);

        return emCache || buscaRede;
      })
    );
  } else {
    // Recursos externos (React, Babel, Recharts, ícones de lucide-react):
    // stale-while-revalidate — responde rápido com o cache e atualiza depois
    evento.respondWith(
      caches.open(VERSAO_CACHE).then(async (cache) => {
        const emCache = await cache.match(request);
        const buscaRede = fetch(request, { mode: "cors" })
          .then((resposta) => {
            if (resposta && resposta.status === 200) {
              cache.put(request, resposta.clone());
            }
            return resposta;
          })
          .catch(() => emCache);

        return emCache || buscaRede;
      })
    );
  }
});
