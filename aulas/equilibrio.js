aulasMM.aulas['equilibrio'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // Fração de NO₂ no equilíbrio, conforme temperatura (T) e pressão (P), de -1 a 1
  const fracao = (T, P) => Math.min(.9, Math.max(.1, .5 + .22 * T - .15 * P));
  const ICONE = { 'T+': '🔥', 'T-': '❄️', 'P+': '⬇️', 'P-': '⬆️' };
  const TEXTO = {
    'T+': 'Aquecer favorece o sentido que absorve calor (endotérmico). Como a reação direta é exotérmica, o equilíbrio vai para a esquerda: mais NO₂, cor mais escura.',
    'T-': 'Esfriar favorece o sentido que libera calor (exotérmico): o equilíbrio vai para a direita, forma mais N₂O₄ e a cor clareia.',
    'P+': 'Mais pressão favorece o lado com menos mols de gás. 2 NO₂ são 2 mols; N₂O₄ é 1 mol: o equilíbrio vai para a direita e a cor clareia.',
    'P-': 'Menos pressão favorece o lado com mais mols de gás, o NO₂: o equilíbrio vai para a esquerda e a cor escurece.'
  };
  let T, P, hist, ultima;
  function reiniciar() { T = 0; P = 0; hist = [[null, fracao(0, 0)]]; ultima = null; desenhar(); }
  function desenhar() {
    const f = fracao(T, P), X0 = 96, larg = 216 / Math.max(4, hist.length), Y = v => 120 - v * 100;
    let s = `<rect x="14" y="14" width="60" height="110" rx="12" fill="none" stroke="currentColor" stroke-width="3" opacity=".6"/>
      <rect x="18" y="18" width="52" height="102" rx="9" fill="#a0522d" opacity="${(0.05 + f ** 1.5 * 0.95).toFixed(2)}" style="transition:opacity .6s"/>
      <text x="44" y="142" text-anchor="middle">gás no frasco</text>
      <line x1="${X0}" y1="120" x2="312" y2="120" stroke="currentColor" opacity=".4"/><line x1="${X0}" y1="16" x2="${X0}" y2="120" stroke="currentColor" opacity=".4"/>
      <text x="${X0 + 4}" y="12">% de NO₂ (castanho)</text>`;
    let ant = hist[0][1];
    hist.forEach(([acao, alvo], k) => {
      const x0 = X0 + k * larg, pts = [];
      for (let t = 0; t <= 1.0001; t += .05) pts.push(`${x0 + t * larg},${Y(alvo + (ant - alvo) * Math.exp(-t * 6))}`);
      s += `<polyline points="${pts.join(' ')}" fill="none" stroke="#e9b949" stroke-width="3"/>`;
      if (acao) s += `<line x1="${x0}" y1="16" x2="${x0}" y2="120" stroke="currentColor" stroke-dasharray="3 3" opacity=".35"/><text x="${x0 + 3}" y="${acao[0] === 'T' ? 32 : 32}" style="font-size:14px">${ICONE[acao]}</text>`;
      ant = alvo;
    });
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', `No equilíbrio, ${br(f * 100, 0)}% de NO₂`);
    const desl = !ultima ? '—' : ['T+', 'P-'].includes(ultima) ? '← NO₂ (esquerda)' : 'N₂O₄ (direita) →';
    $('leituras').innerHTML = leitura('NO₂ no equilíbrio', `${br(f * 100, 0)}%`) + leitura('Cor', f > .65 ? 'castanho escuro' : f < .35 ? 'quase incolor' : 'castanho claro') + leitura('Deslocou para', desl);
    $('recado').textContent = ultima ? TEXTO[ultima] : 'O sistema está em equilíbrio: metade NO₂, metade N₂O₄ (em mols). Aqueça, esfrie, comprima ou expanda.';
    raiz.querySelectorAll('[data-acao]').forEach(b => {
      const a = b.dataset.acao;
      b.disabled = (a === 'T+' && T >= 1) || (a === 'T-' && T <= -1) || (a === 'P+' && P >= 1) || (a === 'P-' && P <= -1) || hist.length >= 7 && a !== '0';
    });
  }
  raiz.querySelectorAll('[data-acao]').forEach(b => b.addEventListener('click', () => {
    const a = b.dataset.acao;
    if (a === '0') return reiniciar();
    if (a[0] === 'T') T += a[1] === '+' ? 1 : -1; else P += a[1] === '+' ? 1 : -1;
    ultima = a; hist.push([a, fracao(T, P)]); desenhar();
  }));
  reiniciar();

  // ---------- filminho: equilíbrio dinâmico ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const bola = c => `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${c}"></span>`;
  const ROTEIROS = {
    dinamico: {
      montar(p) {
        return {
          e: [[20, 30], [30, 52], [16, 70]].map(([x, y]) => ator(p, bola('#a0522d'), x, y)),
          d: [[80, 34], [70, 58], [84, 72]].map(([x, y]) => ator(p, bola('#f4f1ea'), x, y)),
          s: ator(p, '<span style="font-size:30px">⇄</span>', 50, 50),
          t1: ator(p, N('NO₂'), 22, 90), t2: ator(p, N('N₂O₄'), 78, 90)
        };
      },
      passos: [
        [2600, 'No equilíbrio, parece que nada acontece: a cor fica igual.'],
        [3000, 'Mas, por dentro, NO₂ vira N₂O₄ o tempo todo…', a => { por(a.e[0], { x: 74, y: 30 }); por(a.d[1], { x: 26, y: 58 }); por(a.d[1], { html: bola('#a0522d') }); por(a.e[0], { html: bola('#f4f1ea') }); }],
        [3000, '…e N₂O₄ volta a ser NO₂, na mesma velocidade. As quantidades não mudam: o equilíbrio é <b>dinâmico</b>.', a => { por(a.e[0], { x: 20, y: 30, html: bola('#a0522d') }); por(a.d[1], { x: 70, y: 58, html: bola('#f4f1ea') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
