aulasMM.aulas['leis-newton'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const X0 = 62, ESC = 246 / 30; // 30 m de pista entre x = 62 e 308
  let quadro = null;
  function cena(t) {
    const F = Number($('f').value), m = Number($('m').value), a = F / m;
    const s = Math.min(a * t * t / 2, 27), lado = 14 + m * 0.5;
    const x = X0 + s * ESC;
    const seta = F ? `<line x1="${x - 6 - F * 0.45}" y1="70" x2="${x - 6}" y2="70" stroke="#e9b949" stroke-width="4"/><path d="M${x - 6} 70 l-8 -6 v12 z" fill="#e9b949"/>
      <text x="${x - 8 - F * 0.25}" y="60" text-anchor="middle" style="fill:#e9b949;font-weight:800">${F} N</text>` : '';
    $('graf').innerHTML = `<line x1="0" y1="100" x2="320" y2="100" stroke="currentColor" opacity=".5"/>
      ${[0, 5, 10, 15, 20, 25, 30].map(d => `<text x="${X0 + d * ESC}" y="118" text-anchor="middle">${d} m</text>`).join('')}
      <rect x="${x}" y="${100 - lado}" width="${lado}" height="${lado}" rx="3" fill="#62a8ea"/>
      <text x="${x + lado / 2}" y="${100 - lado / 2 + 4}" text-anchor="middle" style="fill:#10130f;font-weight:800">${m}</text>${seta}`;
    return a * t * t / 2 >= 27;
  }
  function resumo() {
    const F = Number($('f').value), m = Number($('m').value), a = F / m;
    $('of').textContent = F + ' N'; $('om').textContent = m + ' kg';
    $('leituras').innerHTML = leitura('Aceleração', br(a, a % 1 ? 1 : 0) + ' m/s²') + leitura('Velocidade em 3 s', br(a * 3, 1) + ' m/s') + leitura('Anda em 3 s', br(a * 4.5, 1) + ' m');
    $('graf').setAttribute('aria-label', `Caixa de ${m} kg empurrada com ${F} N`);
    $('recado').textContent = F === 0
      ? 'Sem força resultante, a caixa parada continua parada (1ª lei). Se estivesse andando, continuaria andando.'
      : `a = F ÷ m = ${F} ÷ ${m} = ${br(a, a % 1 ? 1 : 0)} m/s². Dobre a massa com a mesma força e a aceleração cai pela metade.`;
  }
  function parar() { cancelAnimationFrame(quadro); quadro = null; }
  $('empurrar').addEventListener('click', () => {
    parar();
    if (aulasMM.calmo) { cena(3); return; }
    const t0 = performance.now();
    const passo = agora => { const t = Math.min(3, (agora - t0) / 1000); if (!cena(t) && t < 3) quadro = requestAnimationFrame(passo); else quadro = null; };
    quadro = requestAnimationFrame(passo);
  });
  ['f', 'm'].forEach(id => $(id).addEventListener('input', () => { parar(); resumo(); cena(0); }));
  resumo(); cena(0);

  // ---------- filminho: o cinto de segurança ----------
  const { ator, por } = aulasMM;
  const ROTEIROS = {
    cinto: {
      montar(p) {
        const a = {
          carro: ator(p, '<span style="display:block;width:96px;height:34px;border-radius:12px 22px 6px 6px;background:#62a8ea"></span>', 20, 62),
          boneco: ator(p, '<span style="font-size:30px">🧍</span>', 20, 40),
          muro: ator(p, '<span style="display:block;width:14px;height:90px;background:#8a7a68;border-radius:3px"></span>', 80, 52),
          t: por(ator(p, '<span class="au-balao">inércia: continua indo</span>', 50, 12), { o: 0 })
        };
        a.carro.style.transition = a.boneco.style.transition = 'left 1s ease-in';
        return a;
      },
      passos: [
        [2200, 'O carro e o passageiro andam juntos, na mesma velocidade.'],
        [2400, 'O carro bate e <b>para de repente</b>…', a => { por(a.carro, { x: 64 }); por(a.boneco, { x: 64 }); }],
        [3000, '…mas o passageiro <b>continua indo para frente</b>: nada parou ele. É a inércia. O cinto é a força que faz ele parar junto com o carro.', a => { por(a.boneco, { x: 72, y: 36 }); por(a.t, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => { parar(); paradas.forEach(p => p()); };
};
