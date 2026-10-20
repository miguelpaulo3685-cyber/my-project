const test = require('node:test');
const assert = require('node:assert');
const { idDoYoutube } = require('../reels');

test('reels: lê o código do vídeo dos formatos de link do YouTube', () => {
  const id = 'dQw4w9WgXcQ';
  for (const link of [
    `https://www.youtube.com/shorts/${id}`, `https://youtube.com/shorts/${id}?feature=share`,
    `https://youtu.be/${id}`, `https://www.youtube.com/watch?v=${id}&t=10s`, `https://m.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/embed/${id}`, `  https://youtu.be/${id}  `
  ]) assert.strictEqual(idDoYoutube(link), id, link);
});

test('reels: recusa link que não é do YouTube ou código inválido', () => {
  for (const link of ['https://www.tiktok.com/@x/video/1', 'https://youtube.com.golpe.com/shorts/dQw4w9WgXcQ',
    'javascript:alert(1)', 'https://youtu.be/curto', 'https://www.youtube.com/watch?v=<script>abcd', '', null, 42]) {
    assert.strictEqual(idDoYoutube(link), null, String(link));
  }
});

test('reels: título e canal pelo oEmbed; vídeo bloqueado fica de fora', async () => {
  const { infoDoYoutube } = require('../reels');
  const ok = async () => ({ ok: true, status: 200, json: async () => ({ title: ' Resolução ENEM 2019 Q.136 ', author_name: 'Prof. Fulano' }) });
  assert.deepStrictEqual(await infoDoYoutube('dQw4w9WgXcQ', ok), { titulo: 'Resolução ENEM 2019 Q.136', canal: 'Prof. Fulano' });
  assert.deepStrictEqual(await infoDoYoutube('dQw4w9WgXcQ', async () => ({ ok: false, status: 401 })), { indisponivel: true });
  assert.deepStrictEqual(await infoDoYoutube('dQw4w9WgXcQ', async () => { throw new Error('sem rede'); }), {});
});

test('reels: links do TikTok (completo e curto)', () => {
  const { lerLinkTiktok } = require('../reels');
  assert.deepStrictEqual(lerLinkTiktok('https://www.tiktok.com/@prof.fulano/video/7301234567890123456?is_from_webapp=1'),
    { id: '7301234567890123456', url: 'https://www.tiktok.com/@prof.fulano/video/7301234567890123456' });
  assert.deepStrictEqual(lerLinkTiktok('https://vt.tiktok.com/ZSgB2MjjX/'), { curto: true, url: 'https://vt.tiktok.com/ZSgB2MjjX/' });
  assert.ok(lerLinkTiktok('https://vm.tiktok.com/ZMabc123/').curto);
  assert.ok(lerLinkTiktok('https://www.tiktok.com/t/ZTabc123/').curto);
  for (const ruim of ['https://tiktok.com.golpe.com/@x/video/7301234567890123456', 'https://www.tiktok.com/@x', 'https://vt.tiktok.com/../../etc', 'javascript:alert(1)']) {
    assert.strictEqual(lerLinkTiktok(ruim), null, ruim);
  }
});

test('reels: link curto do TikTok vira o vídeo de verdade pelo oEmbed', async () => {
  const { infoDoVideo } = require('../reels');
  let pedido;
  const tiktok = async url => { pedido = url; return { ok: true, status: 200, json: async () => ({
    embed_product_id: '7301234567890123456', title: 'Dica de redação #enem', author_name: 'Prof. Fulano', author_url: 'https://www.tiktok.com/@prof.fulano' }) }; };
  assert.deepStrictEqual(await infoDoVideo('https://vt.tiktok.com/ZSgB2MjjX/', tiktok), {
    plataforma: 'tiktok', id: '7301234567890123456', titulo: 'Dica de redação #enem', canal: 'Prof. Fulano',
    link: 'https://www.tiktok.com/@prof.fulano/video/7301234567890123456' });
  assert.ok(pedido.startsWith('https://www.tiktok.com/oembed?url=https%3A%2F%2Fvt.tiktok.com%2FZSgB2MjjX%2F'));
  assert.deepStrictEqual(await infoDoVideo('https://vt.tiktok.com/ZSgB2MjjX/', async () => ({ ok: false, status: 404 })), { indisponivel: true });
  assert.deepStrictEqual(await infoDoVideo('https://vt.tiktok.com/ZSgB2MjjX/', async () => { throw new Error('rede'); }), {}, 'curto sem rede: tenta depois');
  assert.strictEqual((await infoDoVideo('https://youtu.be/dQw4w9WgXcQ', async () => { throw new Error('rede'); })).plataforma, 'youtube');
  assert.strictEqual(await infoDoVideo('https://www.instagram.com/reel/abc/'), null);
});
