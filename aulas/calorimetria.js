aulasMM.aulas['calorimetria'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // 100 g de água, em kcal: gelo −20→0 (c=0,5): 1; fusão: 8; água 0→100: 10; vaporização: 54; vapor 100→120 (c=0,5): 1
  const ETAPAS = [
    [1, -20, 0, 'gelo esquentando', 'O gelo esquenta: c do gelo = 0,5 cal/g·°C. Q = m · c · ΔT.'],
    [8, 0, 0, 'gelo derretendo', 'Fusão a 0 °C: o calor vai todo para derreter o gelo e a temperatura fica parada. Q = m · L = 100 × 80 = 8 000 cal.'],
    [10, 0, 100, 'água esquentando', 'A água líquida esquenta: c = 1 cal/g·°C. Ela pede o dobro de calor por grau que o gelo.'],
    [54, 100, 100, 'água fervendo', 'Ebulição a 100 °C: é a etapa mais longa (540 cal/g). Por mais que o fogo esteja alto, a temperatura não passa de 100 °C enquanto houver água.'],
    [1, 100, 120, 'vapor esquentando', 'Só o vapor: agora a temperatura volta a subir.']
  ];
  const TOTAL = ETAPAS.reduce((s, e) => s + e[0], 0);
  const X = q => 30 + q / TOTAL * 280, Y = T => 170 - (T + 20) / 140 * 150;
  function estado(q) {
    let acc = 0;
    for (const e of ETAPAS) { if (q <= acc + e[0]) { const f = (q - acc) / e[0]; return { T: e[1] + (e[2] - e[1]) * f, etapa: e, f }; } acc += e[0]; }
    return { T: 120, etapa: ETAPAS[4], f: 1 };
  }
  function desenhar() {
    const q = Number($('q').value), { T, etapa } = estado(q);
    $('o').textContent = br(q, 1) + ' kcal';
    let acc = 0, d = `M${X(0)} ${Y(-20)}`;
    for (const e of ETAPAS) { acc += e[0]; d += ` L${X(acc)} ${Y(e[2])}`; }
    $('graf').innerHTML = `<line x1="30" y1="170" x2="312" y2="170" stroke="currentColor" opacity=".5"/><line x1="30" y1="170" x2="30" y2="14" stroke="currentColor" opacity=".5"/>
      ${[-20, 0, 50, 100, 120].map(t => `<text x="26" y="${Y(t) + 4}" text-anchor="end">${t}°</text><line x1="30" y1="${Y(t)}" x2="312" y2="${Y(t)}" stroke="currentColor" opacity=".07"/>`).join('')}
      <path d="${d}" fill="none" stroke="currentColor" stroke-width="2" opacity=".35"/>
      <text x="${X(5)}" y="${Y(0) - 6}" text-anchor="middle" style="font-size:10px">fusão</text><text x="${X(46)}" y="${Y(100) - 6}" text-anchor="middle" style="font-size:10px">ebulição</text>
      <circle cx="${X(q)}" cy="${Y(T)}" r="6" fill="#e9b949"/><text x="170" y="192" text-anchor="middle">calor dado (kcal) →</text>`;
    $('graf').setAttribute('aria-label', `Depois de ${br(q, 1)} kcal: ${etapa[3]} a ${br(T, 0)} graus`);
    $('leituras').innerHTML = leitura('Temperatura', br(T, 0) + ' °C') + leitura('Agora', etapa[3]) + leitura('Calor dado', br(q, 1) + ' kcal');
    $('recado').textContent = etapa[4];
  }
  $('q').addEventListener('input', desenhar);
  desenhar();

  // ---------- filminho: o patamar da ebulição ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero">${t}</span>`;
  const ROTEIROS = {
    patamar: {
      montar(p) {
        return {
          panela: ator(p, '<span style="font-size:48px">🍲</span>', 34, 56), fogo: ator(p, '<span style="font-size:26px">🔥</span>', 34, 84),
          termo: ator(p, N('80 °C'), 70, 40), t: ator(p, '<span class="au-numero au-pequeno">termômetro</span>', 70, 58)
        };
      },
      passos: [
        [2200, 'A água esquenta: 80 °C…', a => por(a.termo, { html: N('80 °C') })],
        [2200, '…90, 100 °C: começa a ferver.', a => por(a.termo, { html: N('100 °C') })],
        [3200, 'Mais fogo, mais tempo… e o termômetro <b>não sai de 100 °C</b>. O calor está indo para transformar água em vapor (calor latente).', a => { por(a.fogo, { s: 1.6 }); por(a.termo, { html: N('100 °C') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
