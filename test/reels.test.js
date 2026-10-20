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
