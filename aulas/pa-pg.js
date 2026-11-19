aulasMM.aulas['pa-pg'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  let tipo = 'pa';
  function desenhar() {
    const a1 = Number($('a1').value), r = Number($('r').value), n = 8;
    $('o1').textContent = a1; $('o2').textContent = r;
    const termos = Array.from({ length: n }, (_, k) => tipo === 'pa' ? a1 + k * r : a1 * r ** k);
    const max = Math.max(...termos), soma = termos.reduce((s, x) => s + x, 0);
    const larg = 30, gap = 7, x0 = 20, base = 150, H = 120;
    $('graf').innerHTML = termos.map((t, k) => {
      const h = Math.max(2, t / max * H), x = x0 + k * (larg + gap);
      return `<rect x="${x}" y="${base - h}" width="${larg}" height="${h}" rx="4" fill="${tipo === 'pa' ? '#62a8ea' : '#e9b949'}"/>
        <text x="${x + larg / 2}" y="${base - h - 4}" text-anchor="middle" style="font-weight:800;fill:var(--texto);font-size:${t >= 10000 ? 8 : 11}px">${br(t, 0)}</text>
        <text x="${x + larg / 2}" y="${base + 14}" text-anchor="middle">a${k + 1}</text>`;
    }).join('');
    $('graf').setAttribute('aria-label', `${tipo === 'pa' ? 'PA' : 'PG'}: ${termos.join(', ')}`);
    raiz.querySelectorAll('[data-tipo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tipo === tipo)));
    $('conta').textContent = tipo === 'pa' ? `aₙ = ${a1} + (n − 1) × ${r}  →  a₈ = ${br(termos[7], 0)}` : `aₙ = ${a1} × ${r}ⁿ⁻¹  →  a₈ = ${br(termos[7], 0)}`;
    $('recado').textContent = tipo === 'pa'
      ? `Somando ${r} a cada passo, os degraus são iguais: a sequência cresce em linha reta. Soma dos 8 termos: (${a1} + ${br(termos[7], 0)}) × 8 ÷ 2 = ${br(soma, 0)}.`
      : (r === 1 ? 'Com razão 1, a PG fica parada: multiplicar por 1 não muda nada.'
        : `Multiplicando por ${r} a cada passo, cada degrau é ${r} vezes o anterior: os últimos disparam. Compare com a PA de mesma razão: ela chegaria só a ${a1 + 7 * r}, e a PG chega a ${br(termos[7], 0)}.`);
  }
  raiz.querySelectorAll('[data-tipo]').forEach(b => b.addEventListener('click', () => { tipo = b.dataset.tipo; desenhar(); }));
  ['a1', 'r'].forEach(id => $(id).addEventListener('input', desenhar));
  desenhar();

  // ---------- filminho: somar × dobrar ----------
  const { ator, por } = aulasMM;
  const N = (t, c = '') => `<span class="au-numero ${c}">${t}</span>`;
  const ROTEIROS = {
    corrida: {
      montar(p) {
        return {
          r1: ator(p, N('somar 10 por dia', 'au-pequeno'), 26, 22), r2: ator(p, N('dobrar por dia', 'au-pequeno'), 74, 22),
          v1: ator(p, N('10'), 26, 50), v2: ator(p, N('1'), 74, 50),
          dia: ator(p, N('dia 1', 'au-pequeno'), 50, 84)
        };
      },
      passos: [
        [2200, 'Dois desafios: começar com 10 e <b>somar 10</b> por dia (PA), ou começar com 1 e <b>dobrar</b> por dia (PG).'],
        [2600, 'No dia 5, a PA está em 50 e a PG em só 16. Parece que somar ganha…', a => { por(a.v1, { html: N('50') }); por(a.v2, { html: N('16') }); por(a.dia, { html: N('dia 5', 'au-pequeno') }); }],
        [3200, '…mas no dia 20 a PA está em 200, e a PG em <b>524 288</b>. A PG sempre ultrapassa.', a => { por(a.v1, { html: N('200') }); por(a.v2, { html: N('524 288') }); por(a.dia, { html: N('dia 20', 'au-pequeno') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
