const test = require('node:test');
const assert = require('node:assert');
const { lerLinkCanal, lerFeed, ehShort, idDoHandle, buscarNovos } = require('../canais');

const UC = 'UCabcdefghijklmnopqrstuv';

test('canais: lê os formatos de link de canal do YouTube', () => {
  assert.deepStrictEqual(lerLinkCanal(`https://www.youtube.com/channel/${UC}`), { id: UC });
  assert.deepStrictEqual(lerLinkCanal(UC), { id: UC });
  assert.deepStrictEqual(lerLinkCanal('https://www.youtube.com/@ProfFulano/shorts'), { handle: '@ProfFulano' });
  assert.deepStrictEqual(lerLinkCanal('@prof.fulano'), { handle: '@prof.fulano' });
  for (const ruim of ['https://youtube.com.golpe.com/@x', 'http://youtube.com/@abc', 'https://www.tiktok.com/@abc', 'javascript:1', '', null]) {
    assert.strictEqual(lerLinkCanal(ruim), null, String(ruim));
  }
});

const FEED = `<feed><author><name>Prof &amp; Cia</name></author>
  <entry><yt:videoId>aaaaaaaaaaa</yt:videoId><title>Questão 136 &quot;ENEM&quot;</title><published>2026-10-20T10:00:00+00:00</published></entry>
  <entry><yt:videoId>bbbbbbbbbbb</yt:videoId><title>Aula longa</title><published>2026-10-19T10:00:00+00:00</published></entry>
  <entry><yt:videoId>ccccccccccc</yt:videoId><title>Antigo</title><published>2020-01-01T10:00:00+00:00</published></entry></feed>`;

test('canais: lê o feed (nome, códigos, títulos e datas)', () => {
  const f = lerFeed(FEED);
  assert.strictEqual(f.nome, 'Prof & Cia');
  assert.deepStrictEqual(f.videos.map(v => v.id), ['aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc']);
  assert.strictEqual(f.videos[0].titulo, 'Questão 136 "ENEM"');
});

test('canais: Short fica, vídeo comum (mandado para /watch) sai', async () => {
  const resp = (status, location) => async () => ({ status, headers: { get: () => location } });
  assert.strictEqual(await ehShort('x', resp(200)), true);
  assert.strictEqual(await ehShort('x', resp(303, 'https://www.youtube.com/watch?v=x')), false);
  assert.strictEqual(await ehShort('x', async () => { throw new Error('sem rede'); }), true);
});

test('canais: acha o código do canal pela página do @nome', async () => {
  const pagina = async () => ({ ok: true, text: async () => `<link rel="alternate" href="https://www.youtube.com/feeds/videos.xml?channel_id=${UC}">` });
  assert.strictEqual(await idDoHandle('@x', pagina), UC);
  assert.strictEqual(await idDoHandle('@x', async () => ({ ok: false })), null);
});

test('canais: busca põe Shorts novos na fila, pula vídeo comum, antigo e repetido', async () => {
  const inseridos = [], ignorados = [];
  const pool = { query: async (sql, p) => {
    if (sql.startsWith('SELECT * FROM reels_canais')) return { rows: [{ id: 1, canal_id: UC, nome: 'x', area: 'matematica', tipo: 'resolucao', direto: false, desde: '2026-09-27' }] };
    if (sql.startsWith('SELECT 1 FROM reels')) return { rowCount: 0 };
    if (sql.includes('INSERT INTO reels_ignorados')) { ignorados.push(p[0]); return {}; }
    if (sql.includes('INSERT INTO reels')) { inseridos.push(p); return {}; }
    return {};
  } };
  const buscar = async (url, opc = {}) => {
    if (url.includes('feeds/videos.xml')) return { ok: true, text: async () => FEED };
    if (url.includes('/shorts/bbbbbbbbbbb') && opc.method === 'HEAD') return { status: 303, headers: { get: () => '/watch?v=bbbbbbbbbbb' } };
    if (opc.method === 'HEAD') return { status: 200, headers: { get: () => null } };
    if (url.includes('oembed')) return { ok: true, status: 200, json: async () => ({ title: 't', author_name: 'Prof' }) };
    throw new Error('inesperado: ' + url);
  };
  assert.strictEqual(await buscarNovos(pool, buscar), 1);
  assert.strictEqual(inseridos[0][0], 'aaaaaaaaaaa');
  assert.strictEqual(inseridos[0][6], 'pendente');
  assert.deepStrictEqual(ignorados, ['bbbbbbbbbbb']);
});
