// Service worker do M&M Estudos: deixa o site ser instalado como app,
// abre mesmo sem internet (a casca da página) e mostra os avisos.
//
// A página vem sempre da rede primeiro, para cada atualização do site
// aparecer na hora; o que está guardado só serve quando a rede falha.

const CACHE = 'mm-estudos-v1';
const CASCA = ['./', './index.html', './manifest.webmanifest', './img/icone-192.png', './img/icone-512.png', './img/favicon-32.png'];

self.addEventListener('install', evento => {
  evento.waitUntil(caches.open(CACHE).then(c => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evento => {
  const pedido = evento.request;
  const url = new URL(pedido.url);
  // Servidor, fontes e vídeos ficam de fora: só os arquivos do próprio site.
  if (pedido.method !== 'GET' || url.origin !== self.location.origin) return;

  if (pedido.mode === 'navigate') {
    evento.respondWith(
      fetch(pedido)
        .then(resposta => {
          const copia = resposta.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copia));
          return resposta;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Imagens e ícones: usa o guardado e atualiza por trás.
  if (url.pathname.includes('/img/')) {
    evento.respondWith(caches.open(CACHE).then(async c => {
      const guardado = await c.match(pedido);
      const daRede = fetch(pedido).then(r => { if (r.ok) c.put(pedido, r.clone()); return r; }).catch(() => guardado);
      return guardado || daRede;
    }));
  }
});

self.addEventListener('push', evento => {
  let dados = {};
  try { dados = evento.data ? evento.data.json() : {}; } catch (e) { dados = { titulo: evento.data && evento.data.text() }; }
  evento.waitUntil(self.registration.showNotification(dados.titulo || 'M&M Estudos', {
    body: dados.corpo || '',
    icon: './img/icone-192.png',
    badge: './img/icone-192.png',
    tag: dados.tag || 'mm',
    renotify: true,
    data: { url: dados.url || './' },
    lang: 'pt-BR'
  }));
});

// Clicou no aviso: se o site já está aberto, vai para lá; senão, abre.
self.addEventListener('notificationclick', evento => {
  evento.notification.close();
  const destino = new URL(evento.notification.data.url, self.location.href);
  const abrir = destino.searchParams.get('abrir');
  evento.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const aqui = abertas.find(c => new URL(c.url).origin === self.location.origin);
    if (aqui) {
      await aqui.focus();
      aqui.postMessage({ abrir });
      return;
    }
    // O link aponta para o site publicado; abre com o mesmo pedido aqui.
    const local = new URL('./', self.location.href);
    if (abrir) local.searchParams.set('abrir', abrir);
    await self.clients.openWindow(local.href);
  })());
});
