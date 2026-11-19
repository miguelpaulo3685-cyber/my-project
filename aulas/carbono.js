aulasMM.aulas['carbono'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const SUB = '₀₁₂₃₄₅₆₇₈₉', sub = n => String(n).split('').map(c => SUB[c]).join('');
  const PREF = ['', 'met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct'];
  let dupla = false, ram = false, anel = false;
  function desenhar() {
    const n = Number($('n').value);
    if (n < 2) dupla = false; if (n < 3) { ram = false; anel = false; }
    if (anel) { dupla = false; ram = false; }
    $('no').textContent = n;
    // Posições dos carbonos
    const P = [];
    for (let k = 0; k < n; k++) P.push(anel ? [160 + 44 * Math.cos(-Math.PI / 2 + k * 2 * Math.PI / n), 62 + 44 * Math.sin(-Math.PI / 2 + k * 2 * Math.PI / n)]
      : [160 - (n - 1) * 17 + k * 34, k % 2 ? 72 : 44]);
    const lig = [];
    for (let k = 0; k < n - 1; k++) lig.push([k, k + 1, dupla && k === 0 ? 2 : 1]);
    if (anel) lig.push([n - 1, 0, 1]);
    if (ram) { P.push([P[1][0], P[1][1] + 38]); lig.push([1, n, 1]); }
    const ordem = P.map((_, i) => lig.reduce((s, [a, b, o]) => s + (a === i || b === i ? o : 0), 0));
    const H = ordem.map(o => 4 - o), Ct = P.length, Ht = H.reduce((s, h) => s + h, 0);
    let s = '';
    lig.forEach(([a, b, o]) => {
      const [x1, y1] = P[a], [x2, y2] = P[b];
      if (o === 1) s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="2.5" opacity=".7"/>`;
      else { const d = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / d * 3.5, ny = (x2 - x1) / d * 3.5;
        s += `<line x1="${x1 + nx}" y1="${y1 + ny}" x2="${x2 + nx}" y2="${y2 + ny}" stroke="#e9b949" stroke-width="2.5"/><line x1="${x1 - nx}" y1="${y1 - ny}" x2="${x2 - nx}" y2="${y2 - ny}" stroke="#e9b949" stroke-width="2.5"/>`; }
    });
    P.forEach(([x, y], i) => {
      const rot = 'C' + (H[i] ? 'H' + (H[i] > 1 ? sub(H[i]) : '') : '');
      s += `<rect x="${x - 15}" y="${y - 10}" width="30" height="20" rx="6" fill="var(--superficie)"/><text x="${x}" y="${y + 5}" text-anchor="middle" style="font-size:13px;font-weight:800;fill:${i === n ? '#e9b949' : 'var(--texto)'}">${rot}</text>`;
    });
    $('graf').innerHTML = s;
    const nome = anel ? `ciclo${PREF[n]}ano` : `${ram ? '2-metil' : ''}${PREF[n]}${dupla ? (n >= 4 ? '-1-eno' : 'eno') : 'ano'}`;
    const form = `C${Ct > 1 ? sub(Ct) : ''}H${sub(Ht)}`;
    $('graf').setAttribute('aria-label', `${nome}, fórmula ${form}`);
    const cls = [anel ? 'fechada' : 'aberta', ram ? 'ramificada' : 'normal', dupla ? 'insaturada' : 'saturada'];
    $('leituras').innerHTML = leitura('Fórmula', form) + leitura('Nome', nome) + leitura('Cadeia', n === 1 ? '1 carbono só' : cls.join(', '));
    const familia = anel ? 'É um ciclano: anel com ligações simples, fórmula CₙH₂ₙ.' : dupla ? 'É um alceno: uma ligação dupla, fórmula CₙH₂ₙ. O eteno amadurece frutas e vira o plástico polietileno.' : 'É um alcano: só ligações simples, fórmula CₙH₂ₙ₊₂. O gás de cozinha é propano + butano; a gasolina tem alcanos de 5 a 10 carbonos.';
    $('recado').textContent = `${n === 1 ? 'Metano (CH₄): o carbono faz 4 ligações, todas com hidrogênio. É o gás natural e o gás dos pântanos.' : familia} Cada carbono faz exatamente 4 ligações: confira contando os H.`;
    $('dupla').disabled = n < 2 || anel; $('ram').disabled = n < 3 || anel; $('anel').disabled = n < 3;
    $('dupla').setAttribute('aria-pressed', dupla); $('ram').setAttribute('aria-pressed', ram); $('anel').setAttribute('aria-pressed', anel);
  }
  $('n').addEventListener('input', desenhar);
  $('dupla').addEventListener('click', () => { dupla = !dupla; desenhar(); });
  $('ram').addEventListener('click', () => { ram = !ram; desenhar(); });
  $('anel').addEventListener('click', () => { anel = !anel; desenhar(); });
  desenhar();

  // ---------- filminho: as 4 ligações do carbono ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const at = (c, t, w = 40) => `<span style="display:flex;align-items:center;justify-content:center;width:${w}px;height:${w}px;border-radius:50%;background:${c};font:800 14px var(--fonte);color:#10130f">${t}</span>`;
  const ROTEIROS = {
    quatro: {
      montar(p) {
        const a = { c: ator(p, at('#9aa4ab', 'C', 46), 50, 46), t: ator(p, N('4 elétrons para compartilhar'), 50, 86) };
        a.h = [[50, 14], [24, 56], [76, 56], [50, 74]].map(([x, y]) => por(ator(p, at('#f4f1ea', 'H', 28), x, y), { o: 0 }));
        return a;
      },
      passos: [
        [2400, 'O carbono tem 4 elétrons na camada de fora: faz <b>4 ligações</b>.'],
        [2800, 'Com 4 hidrogênios, forma o <b>metano</b> (CH₄), o gás natural.', a => { a.h.forEach(h => por(h, { o: 1 })); por(a.t, { html: N('metano: CH₄') }); }],
        [3000, 'Trocando H por outros carbonos, as cadeias crescem: daí os milhões de compostos orgânicos.', a => { por(a.h[2], { html: at('#9aa4ab', 'C', 34) }); por(a.t, { html: N('etano: CH₃–CH₃') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
