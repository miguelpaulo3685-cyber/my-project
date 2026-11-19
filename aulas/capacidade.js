aulasMM.aulas['capacidade'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  // Largura (raio relativo) do recipiente na altura y (0 a 1) e volume acumulado até y
  const FORMAS = {
    cilindro: [y => 1, 'Cilindro: a largura é sempre a mesma, então a altura sobe sempre igual. O gráfico é uma reta.'],
    cone: [y => Math.max(0.02, y), 'Ponta para baixo: no começo o fundo é estreito e a água sobe rápido; depois o cone alarga e ela sobe cada vez mais devagar. A curva vai "deitando".'],
    funil: [y => Math.max(0.02, 1 - y), 'Ponta para cima: embaixo é largo e a água sobe devagar; perto da ponta, estreita, ela dispara. A curva vai ficando "em pé".'],
    esfera: [y => Math.max(0.02, 2 * Math.sqrt(y * (1 - y))), 'Esfera: estreita embaixo e em cima, larga no meio. A água sobe rápido, desacelera no meio e acelera de novo no fim.']
  };
  let forma = 'cone';
  const N = 200;
  function curva() { // altura em função do tempo (tempo total = 1)
    const larg = FORMAS[forma][0], vol = [0];
    for (let i = 1; i <= N; i++) { const y = (i - 0.5) / N; vol.push(vol[i - 1] + larg(y) ** 2 / N); }
    const total = vol[N];
    return t => { const alvo = t * total; let i = 0; while (i < N && vol[i + 1] < alvo) i++; return Math.min(1, (i + (alvo - vol[i]) / Math.max(1e-9, vol[i + 1] - vol[i])) / N); };
  }
  function desenhar() {
    const t = Number($('t').value) / 100, h = curva(), larg = FORMAS[forma][0];
    $('o').textContent = br(t * 100, 0) + '%';
    // Recipiente (esquerda): contorno e água até a altura h(t)
    const x0 = 70, base = 160, H = 130, R = 45;
    let esq = '', dir = '', agua = '';
    const nivel = h(t);
    for (let i = 0; i <= 40; i++) { const y = i / 40, w = larg(y) * R; esq += `${i ? 'L' : 'M'}${x0 - w} ${base - y * H}`; dir = `L${x0 + w} ${base - y * H}` + dir; }
    for (let i = 0; i <= 40; i++) { const y = nivel * i / 40, w = larg(y) * R; agua += `${i ? 'L' : 'M'}${x0 - w} ${base - y * H}`; }
    for (let i = 40; i >= 0; i--) { const y = nivel * i / 40, w = larg(y) * R; agua += `L${x0 + w} ${base - y * H}`; }
    // Gráfico (direita): altura × tempo
    const gx = 160, gy = 160, gw = 150, gh = 130;
    let g = '';
    for (let i = 0; i <= 60; i++) { const tt = i / 60; g += `${i ? 'L' : 'M'}${gx + tt * gw} ${gy - h(tt) * gh}`; }
    $('graf').innerHTML = `<path d="${agua} Z" fill="#2f7bd8" opacity=".6"/><path d="${esq}${dir}" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <line x1="${gx}" y1="${gy}" x2="${gx + gw}" y2="${gy}" stroke="currentColor" opacity=".5"/><line x1="${gx}" y1="${gy}" x2="${gx}" y2="${gy - gh}" stroke="currentColor" opacity=".5"/>
      <text x="${gx + gw}" y="${gy + 14}" text-anchor="end">tempo</text><text x="${gx + 4}" y="${gy - gh + 4}">altura</text>
      <path d="${g}" fill="none" stroke="#e9b949" stroke-width="2.5"/><circle cx="${gx + t * gw}" cy="${gy - nivel * gh}" r="5" fill="#e9b949"/>`;
    $('graf').setAttribute('aria-label', `Recipiente em forma de ${forma}: gráfico da altura da água pelo tempo`);
    raiz.querySelectorAll('[data-forma]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.forma === forma)));
    $('recado').textContent = FORMAS[forma][1];
  }
  raiz.querySelectorAll('[data-forma]').forEach(b => b.addEventListener('click', () => { forma = b.dataset.forma; desenhar(); }));
  $('t').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: o tronco de cone ----------
  const { ator, por } = aulasMM;
  const ROTEIROS = {
    tronco: {
      montar(p) {
        return {
          baixo: ator(p, '<svg viewBox="0 0 120 60" style="width:120px;margin:0"><path d="M0 60 L30 0 H90 L120 60 Z" fill="#62a8ea" opacity=".8"/></svg>', 50, 66),
          ponta: ator(p, '<svg viewBox="0 0 60 60" style="width:60px;margin:0"><path d="M0 60 L30 0 L60 60 Z" fill="#e9b949"/></svg>', 50, 34),
          t1: por(ator(p, '<span class="au-numero au-pequeno">1/8</span>', 72, 26), { o: 0 }), t2: por(ator(p, '<span class="au-numero au-pequeno">tronco: 7/8</span>', 50, 92), { o: 0 })
        };
      },
      passos: [
        [2400, 'Um cone cortado na <b>metade da altura</b>.'],
        [3000, 'A ponta é um cone menor com todas as medidas pela metade: volume (1/2)³ = <b>1/8</b> do cone inteiro.', a => { a.ponta.style.transition = 'top 1s'; por(a.ponta, { y: 22 }); por(a.t1, { o: 1 }); }],
        [3000, 'Sobra o <b>tronco</b>, com 7/8 do volume. Um copo de tronco cheio até a metade da altura tem bem menos da metade da bebida!', a => por(a.t2, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
