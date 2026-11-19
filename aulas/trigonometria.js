aulasMM.aulas['trigonometria'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br, rad = g => g * Math.PI / 180;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const L = 10;
  function desenhar() {
    const ang = Number($('ang').value), t = rad(ang), s = Math.sin(t), c = Math.cos(t);
    $('o').textContent = ang + '°';
    const k = 14, x0 = 30, y0 = 150, xa = x0 + L * c * k, ya = y0 - L * s * k;
    $('graf').innerHTML = `<path d="M${x0} ${y0} L${xa} ${y0} L${xa} ${ya} Z" fill="color-mix(in srgb, #62a8ea 18%, transparent)"/>
      <line x1="${x0}" y1="${y0}" x2="${xa}" y2="${ya}" stroke="currentColor" stroke-width="3"/>
      <line x1="${xa}" y1="${y0}" x2="${xa}" y2="${ya}" stroke="#e9b949" stroke-width="3"/><line x1="${x0}" y1="${y0}" x2="${xa}" y2="${y0}" stroke="#62a8ea" stroke-width="3"/>
      <path d="M${xa - 10} ${y0} v-10 h10" fill="none" stroke="currentColor"/>
      <path d="M${x0 + 26} ${y0} A26 26 0 0 0 ${x0 + 26 * c} ${y0 - 26 * s}" fill="none" stroke="var(--certo)" stroke-width="2"/>
      <text x="${x0 + 32}" y="${y0 - 6}" style="fill:var(--certo);font-weight:800">${ang}°</text>
      <text x="${(x0 + xa) / 2 - 8}" y="${(y0 + ya) / 2 - 8}" text-anchor="end" style="font-weight:800;fill:var(--texto)">rampa 10 m</text>
      <text x="${xa + 6}" y="${(y0 + ya) / 2 + 4}" style="fill:#e9b949;font-weight:800">${br(L * s, 2)} m</text>
      <text x="${(x0 + xa) / 2}" y="${y0 + 15}" text-anchor="middle" style="fill:#62a8ea;font-weight:800">${br(L * c, 2)} m</text>`;
    $('graf').setAttribute('aria-label', `Rampa de 10 metros a ${ang} graus: sobe ${br(L * s, 2)} metros`);
    $('leituras').innerHTML = leitura('Seno', br(s, 2)) + leitura('Cosseno', br(c, 2)) + leitura('Tangente', br(s / c, 2));
    $('recado').textContent = `Altura = 10 × sen ${ang}° = ${br(L * s, 2)} m (amarelo). Avanço no chão = 10 × cos ${ang}° = ${br(L * c, 2)} m (azul). Inclinação (tangente) = ${br(s / c * 100, 0)}%.${ang === 45 ? ' Em 45°, sobe exatamente o mesmo que avança.' : ang === 30 ? ' Em 30°, a altura é metade da rampa: sen 30° = 1/2.' : ''}`;
  }
  $('ang').addEventListener('input', desenhar);
  raiz.querySelectorAll('[data-ang]').forEach(b => b.addEventListener('click', () => { $('ang').value = b.dataset.ang; desenhar(); }));
  desenhar();

  // ---------- filminho: a altura do prédio ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    predio: {
      montar(p) {
        return {
          predio: ator(p, '<span style="display:block;width:46px;height:120px;background:#8a7a68;border-radius:3px"></span>', 78, 52),
          pessoa: ator(p, '<span style="font-size:24px">🧍</span>', 14, 80),
          linha: por(ator(p, '<svg viewBox="0 0 200 110" style="width:min(220px,58vw);margin:0"><line x1="0" y1="108" x2="200" y2="2" stroke="var(--certo)" stroke-width="2.5" stroke-dasharray="6 4"/></svg>', 46, 50), { o: 0 }),
          d: ator(p, N('30 m'), 46, 94), ang: por(ator(p, N('ângulo: 60°'), 26, 66), { o: 0 }), h: por(ator(p, N('altura = 30 × tg 60° ≈ 52 m'), 50, 10), { o: 0 })
        };
      },
      passos: [
        [2400, 'Você está a <b>30 m</b> do prédio e não dá para medir a altura dele com a trena.'],
        [2800, 'Com um aplicativo ou transferidor, você mede o ângulo até o topo: <b>60°</b>.', a => { por(a.linha, { o: 1 }); por(a.ang, { o: 1 }); }],
        [3200, 'A altura é o cateto oposto e os 30 m são o adjacente: <b>tg 60° = altura ÷ 30</b>. Altura ≈ 30 × 1,73 ≈ 52 m.', a => por(a.h, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
