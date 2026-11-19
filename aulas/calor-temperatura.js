aulasMM.aulas['calor-temperatura'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  // "Rapidez" com que o calor sobe pelo cabo (escala didática, proporcional à condutividade)
  const MATERIAIS = { cobre: ['cobre', 1, '#c87533', 'O'], aco: ['aço', 0.15, '#9aa3ad', 'O'], madeira: ['madeira', 0.0015, '#b98a52', 'A'], plastico: ['plástico', 0.002, '#e9e3d4', 'O'] };
  let mat = 'aco';
  const cor = T => { // 25 °C azulado → 90 °C vermelho
    const f = Math.min(1, Math.max(0, (T - 25) / 65));
    return `rgb(${Math.round(80 + 175 * f)},${Math.round(140 - 90 * f)},${Math.round(220 - 190 * f)})`;
  };
  function desenhar() {
    const t = Number($('t').value), [nome, k, corMat, art] = MATERIAIS[mat];
    $('o').textContent = t + ' s';
    // Temperatura ao longo do cabo (0 = dentro da sopa a 90 °C, 1 = ponta da mão)
    const T = x => 25 + 65 * Math.exp(-x / Math.max(0.02, Math.sqrt(k * t * 0.05) + 0.02));
    let gomos = '';
    for (let i = 0; i < 24; i++) { const x = i / 23; gomos += `<rect x="${60 + i * 9.5}" y="40" width="10" height="12" fill="${cor(T(x))}"/>`; }
    const ponta = T(1);
    $('graf').innerHTML = `<path d="M20 30 h70 v80 q0 20 -20 20 h-30 q-20 0 -20 -20 z" fill="#c86a3a" opacity=".85"/><text x="55" y="100" text-anchor="middle" style="fill:#fff;font-weight:800">90 °C</text>
      <rect x="58" y="38" width="234" height="16" rx="6" fill="none" stroke="${corMat}" stroke-width="2"/>${gomos}
      <text x="296" y="34" text-anchor="end" style="font-weight:800;fill:var(--texto)">ponta: ${br(ponta, 0)} °C</text>
      <text x="296" y="74" text-anchor="end">${ponta > 45 ? '🔥 queima a mão' : '✋ dá para segurar'}</text>`;
    $('graf').setAttribute('aria-label', `Colher de ${nome} depois de ${t} segundos: a ponta está a ${br(ponta, 0)} graus`);
    raiz.querySelectorAll('[data-mat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mat === mat)));
    $('recado').textContent = k > 0.1
      ? `${art} ${nome} é bom condutor: o calor passa de partícula em partícula e sobe rápido pelo cabo. Em ${t} s, a ponta já está a ${br(ponta, 0)} °C.`
      : `${art} ${nome} é isolante: o calor quase não sobe. Mesmo depois de ${t} s, a ponta continua perto da temperatura ambiente (${br(ponta, 0)} °C). Por isso cabos de panela são de madeira ou plástico.`;
  }
  raiz.querySelectorAll('[data-mat]').forEach(b => b.addEventListener('click', () => { mat = b.dataset.mat; desenhar(); }));
  $('t').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: convecção ----------
  const { ator, por } = aulasMM;
  const ar = c => `<i style="width:16px;height:16px;border-radius:50%;background:${c}"></i>`;
  const ROTEIROS = {
    conveccao: {
      montar(p) {
        const a = { aquec: ator(p, '<span style="font-size:28px">♨️</span>', 20, 86), sala: ator(p, '<span style="display:block;width:min(300px,80vw);height:150px;border:2px solid currentColor;border-radius:8px;opacity:.4"></span>', 50, 50) };
        a.bolhas = [0, 1, 2].map(k => ator(p, ar('#f08a8a'), 20, 74 - k * 6));
        a.bolhas.forEach(b => { b.style.transition = 'left 1.6s linear, top 1.6s linear, background 1s'; });
        return a;
      },
      passos: [
        [2400, 'O aquecedor esquenta o ar perto dele.'],
        [2800, 'O ar quente fica <b>menos denso</b> e <b>sobe</b>; no alto ele se espalha…', a => a.bolhas.forEach((b, k) => por(b, { x: 30 + k * 22, y: 16, atraso: k * 200 }))],
        [3000, '…esfria, fica mais denso e <b>desce</b> do outro lado. Essa roda de ar é a <b>convecção</b>.', a => a.bolhas.forEach((b, k) => { por(b, { x: 80, y: 30 + k * 22, atraso: k * 200, html: ar('#62a8ea') }); })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
