// Folha de revisão: original do caderno | como fica no site. Uso: node folha.js saida.png ano dia chave...
const { chromium } = require('playwright');
const fs = require('fs');
const [saida, ano, dia, ...chaves] = process.argv.slice(2);
const S = __dirname + '/..';
const d = JSON.parse(fs.readFileSync(`${S}/x${ano}d${dia}/extraido.json`));
const g = JSON.parse(fs.readFileSync(`${S}/gab${ano}.json`));
let rev = {}; try { rev = JSON.parse(fs.readFileSync(`${S}/revisao.json`)); } catch (e) {}
const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const fmt = (t, k) => esc(t).replace(/\{fig(\d*)\}/g, (_, n) => `<img src="file://${S}/figs${ano}/${k}${n ? '-' + n : ''}.jpg">`)
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[\s(“"])_([^_\n<>]{2,200}?)_(?=[\s.,;:)”"!?]|$)/g, '$1<i>$2</i>');
const blocos = chaves.map(k => {
  const q = { ...d[k], ...(rev[k] || {}) };
  const gab = g[q.lingua ? `${q.numero}-${q.lingua}` : String(q.numero)];
  const alts = q.alternativas.map((a, i) => {
    const img = (q.alt_img || [])[i] ? `<img src="file://${S}/figs${ano}/${k}-alt${'ABCDE'[i]}.jpg">` : '';
    return `<li class="${'ABCDE'[i] === gab ? 'certa' : ''}"><b>${'ABCDE'[i]}</b> ${fmt(a, k)} ${img}</li>`;
  }).join('');
  return `<section><div class="orig"><img src="file://${S}/x${ano}d${dia}/${k}.png"></div>
    <div class="site"><h3>${k} · gabarito ${gab}</h3><div class="enun">${fmt(q.contexto, k)}</div><ol>${alts}</ol></div></section>`;
}).join('');
const html = `<html><head><meta charset="utf-8"><style>
 body{margin:0;font:13px/1.45 Arial;background:#ddd} section{display:flex;gap:6px;margin:0 0 6px;background:#fff}
 .orig{flex:0 0 380px} .orig img{width:380px} .site{flex:1;padding:6px 10px;max-width:420px}
 .enun{white-space:pre-line} .enun img,li img{max-width:100%;display:block;margin:4px 0;border:1px solid #c33}
 ol{list-style:none;padding:0;margin:6px 0} li{margin:3px 0} li.certa{background:#dfd} h3{margin:0 0 4px;font-size:12px;color:#06c}
</style></head><body>${blocos}</body></html>`;
fs.writeFileSync(`${S}/folha.html`, html);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 820, height: 800 } });
  await p.goto('file://' + S + '/folha.html'); await p.waitForTimeout(300);
  await p.screenshot({ path: saida, fullPage: true }); await b.close();
})();
