aulasMM.aulas['excretor-endocrino'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  // Glicose (mg/dL) a cada meia hora, durante 6 horas
  const CURVAS = {
    comer: [90, 130, 160, 145, 120, 100, 92, 90, 90, 90, 90, 90, 90],
    jejum: [90, 86, 81, 77, 74, 74, 76, 78, 79, 80, 80, 80, 80],
    comerD: [190, 230, 265, 280, 285, 285, 283, 280, 277, 274, 272, 270, 268],
    jejumD: [190, 186, 182, 178, 175, 172, 170, 168, 166, 165, 164, 163, 162]
  };
  let evento = 'comer', diab = false;
  const X = k => 34 + k * 22, Y = g => 150 - (g - 40) / 260 * 140;
  function desenhar() {
    const c = CURVAS[evento + (diab ? 'D' : '')], fim = c[c.length - 1], max = Math.max(...c);
    let s = `<rect x="34" y="${Y(110)}" width="264" height="${Y(70) - Y(110)}" fill="var(--certo)" opacity=".15"/>
      <text x="296" y="${Y(70) + 12}" text-anchor="end" style="fill:var(--certo)">faixa normal</text>
      <line x1="34" y1="${Y(180)}" x2="298" y2="${Y(180)}" stroke="var(--errado)" stroke-dasharray="4 3" opacity=".7"/>
      <text x="296" y="${Y(180) - 4}" text-anchor="end" style="fill:var(--errado)">acima disso: glicose na urina</text>`;
    [50, 100, 150, 200, 250, 300].forEach(g => { s += `<text x="28" y="${Y(g) + 4}" text-anchor="end">${g}</text>`; });
    [0, 2, 4, 6].forEach(h => { s += `<text x="${X(h * 2)}" y="166" text-anchor="middle">${h} h</text>`; });
    s += `<polyline points="${c.map((g, k) => `${X(k)},${Y(g)}`).join(' ')}" fill="none" stroke="#e9b949" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<circle cx="${X(12)}" cy="${Y(fim)}" r="5" fill="#e9b949"/>`;
    $('graf').innerHTML = s;
    $('graf').setAttribute('aria-label', `Glicose no sangue: começa em ${c[0]} e termina em ${fim} mg/dL`);
    const hormonio = diab ? (evento === 'comer' ? 'falta insulina' : 'glucagon') : (evento === 'comer' ? 'insulina' : 'glucagon');
    $('leituras').innerHTML = leitura('Maior valor', max + ' mg/dL') + leitura('Hormônio', hormonio) + leitura('Urina', max > 180 ? '⚠️ com glicose' : 'sem glicose');
    $('recado').textContent = !diab
      ? (evento === 'comer' ? 'Depois da refeição a glicose sobe, o pâncreas solta insulina, as células absorvem a glicose e o nível volta ao normal em umas 3 horas.'
        : 'No jejum a glicose começa a cair; o pâncreas solta glucagon, o fígado libera a glicose guardada e o nível se mantém no normal.')
      : (evento === 'comer' ? 'Sem insulina, as células não conseguem absorver a glicose: ela sobe e fica alta. Acima de 180, o rim não reabsorve tudo e aparece glicose na urina. É o que acontece no diabetes não tratado.'
        : 'Mesmo em jejum, sem insulina a glicose fica alta: as células não conseguem usá-la. A pessoa sente fome e cansaço, mesmo com açúcar sobrando no sangue.');
    $('diab').setAttribute('aria-pressed', diab);
    $('comer').setAttribute('aria-pressed', evento === 'comer'); $('jejum').setAttribute('aria-pressed', evento === 'jejum');
  }
  $('comer').addEventListener('click', () => { evento = 'comer'; desenhar(); });
  $('jejum').addEventListener('click', () => { evento = 'jejum'; desenhar(); });
  $('diab').addEventListener('click', () => { diab = !diab; desenhar(); });
  desenhar();

  // ---------- filminho: o néfron ----------
  const { ator, por } = aulasMM;
  const N = t => `<span class="au-numero au-pequeno">${t}</span>`;
  const ROTEIROS = {
    nefron: {
      montar(p) {
        return {
          s: ator(p, '<span style="font-size:34px">🩸</span>', 12, 40), t1: ator(p, N('sangue'), 12, 62),
          f: por(ator(p, N('filtrado: água, glicose,<br>sais e ureia'), 46, 40), { o: 0 }),
          v: por(ator(p, N('volta ao sangue:<br>glicose, sais, água'), 46, 78), { o: 0 }),
          u: por(ator(p, '<span style="font-size:30px">🚽</span>', 86, 40), { o: 0 }), t2: por(ator(p, N('urina: ureia<br>e pouca água'), 86, 64), { o: 0 })
        };
      },
      passos: [
        [2600, '<b>Filtração</b>: no glomérulo, a pressão empurra para fora do sangue água e pequenas moléculas.', a => por(a.f, { o: 1 })],
        [3000, '<b>Reabsorção</b>: no túbulo, quase tudo que é útil volta ao sangue: toda a glicose, sais e a maior parte da água.', a => por(a.v, { o: 1 })],
        [3200, 'O que sobra, com a <b>ureia</b>, vira urina. O ADH controla quanta água volta.', a => { por(a.u, { o: 1 }); por(a.t2, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
