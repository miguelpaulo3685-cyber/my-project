aulasMM.aulas['pressao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  const CONTROLE = { mergulho: ['Profundidade', 0, 40, 1, 10], prensa: ['Área grande', 2, 50, 1, 20] };
  let modo = 'mergulho';
  function mergulho() {
    const h = Number($('v').value), p = 1 + h / 10;
    $('o').textContent = h + ' m';
    const y = 20 + h * 4.2;
    $('graf').innerHTML = `<rect x="20" y="16" width="280" height="176" fill="#2f7bd8" opacity=".35"/>
      ${[0, 10, 20, 30, 40].map(m => `<line x1="20" y1="${20 + m * 4.2}" x2="34" y2="${20 + m * 4.2}" stroke="currentColor"/><text x="38" y="${24 + m * 4.2}">${m} m</text>`).join('')}
      <text x="160" y="${y + 8}" text-anchor="middle" style="font-size:24px">🤿</text>
      ${[0, 1, 2, 3].map(k => { const a = k * Math.PI / 2, r = 14 + p * 3; return `<line x1="${160 + Math.cos(a) * (r + 10)}" y1="${y - Math.sin(a) * (r + 10)}" x2="${160 + Math.cos(a) * r}" y2="${y - Math.sin(a) * r}" stroke="#e9b949" stroke-width="${1 + p}"/>`; }).join('')}`;
    $('graf').setAttribute('aria-label', `Mergulhador a ${h} metros: ${br(p, 1)} atmosferas`);
    $('leituras').innerHTML = leitura('Do ar', '1 atm') + leitura('Da água', br(h / 10, 1) + ' atm') + leitura('Total', br(p, 1) + ' atm');
    $('recado').textContent = h === 0
      ? 'Na superfície, só o ar pesa sobre você: 1 atmosfera.'
      : `A ${h} m, a água em cima soma ${br(h / 10, 1)} atm à pressão do ar: total de ${br(p, 1)} atm. ${h >= 10 ? 'Por isso o ouvido dói: a água aperta o tímpano por fora.' : 'A cada 10 m, mais 1 atm.'}`;
  }
  function prensa() {
    const A2 = Number($('v').value), A1 = 2, k = br(A2 / A1, A2 % 2 ? 1 : 0), F1 = 200, F2 = F1 * A2 / A1, desce = 10, sobe = desce * A1 / A2;
    $('o').textContent = A2 * 10 + ' cm²';
    const w1 = 16, w2 = 16 + A2 * 2.6, y1 = 70 + desce * 2, y2 = 70 - sobe * 2;
    $('graf').innerHTML = `<path d="M40 ${y1} V170 H${150 + w2} V${y2} H150 V150 H${40 + w1} V${y1} Z" fill="#e9b949" opacity=".55"/>
      <rect x="40" y="${y1 - 8}" width="${w1}" height="8" fill="currentColor"/><rect x="150" y="${y2 - 8}" width="${w2}" height="8" fill="currentColor"/>
      <text x="${150 + w2 / 2}" y="${y2 - 14}" text-anchor="middle" style="font-size:22px">🚗</text>
      <text x="${40 + w1 / 2}" y="${y1 - 14}" text-anchor="middle" style="fill:#62a8ea;font-weight:800">${F1} N</text>
      <text x="${150 + w2 / 2}" y="190" text-anchor="middle" style="fill:var(--certo);font-weight:800">${br(F2, 0)} N</text>`;
    $('graf').setAttribute('aria-label', `Prensa hidráulica: 200 newtons viram ${br(F2, 0)} newtons`);
    $('leituras').innerHTML = leitura('Força na mão', F1 + ' N') + leitura('Força no carro', br(F2, 0) + ' N') + leitura('Ganho', k + '×');
    $('recado').textContent = `O pistão grande tem ${k} vezes a área do pequeno: a mesma pressão vira uma força ${k} vezes maior (${br(F2, 0)} N). Mas, para o carro subir 1 cm, você precisa empurrar ${k} cm.`;
  }
  function desenhar() { (modo === 'mergulho' ? mergulho : prensa)(); }
  function trocar(m) {
    modo = m;
    const [rot, min, max, step, val] = CONTROLE[m];
    $('rot').textContent = rot; Object.assign($('v'), { min, max, step, value: val });
    raiz.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === m)));
    desenhar();
  }
  raiz.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => trocar(b.dataset.modo)));
  $('v').addEventListener('input', desenhar);
  trocar('mergulho');

  // ---------- filminho: a garrafa furada ----------
  const { ator, por } = aulasMM;
  const jato = (comp, y) => `<svg viewBox="0 0 ${comp + 10} 60" style="width:${comp + 10}px;margin:0"><path d="M0 4 q${comp * 0.6} 0 ${comp} 50" fill="none" stroke="#62a8ea" stroke-width="4"/></svg>`;
  const ROTEIROS = {
    garrafa: {
      montar(p) {
        return {
          garrafa: ator(p, '<span style="display:block;width:48px;height:120px;border-radius:10px 10px 6px 6px;background:color-mix(in srgb, #2f7bd8 55%, transparent);border:2px solid currentColor"></span>', 30, 48),
          j1: por(ator(p, jato(30), 47, 30), { o: 0 }), j2: por(ator(p, jato(60), 55, 48), { o: 0 }), j3: por(ator(p, jato(100), 66, 68), { o: 0 })
        };
      },
      passos: [
        [2200, 'Uma garrafa cheia de água com três furos, um acima do outro.'],
        [3000, 'O jato de baixo sai <b>mais forte e mais longe</b>: lá a coluna de água em cima é maior, e a pressão também.', a => [a.j1, a.j2, a.j3].forEach((j, k) => por(j, { o: 1, atraso: k * 300 }))],
        [2800, 'Pressão no líquido depende da <b>profundidade</b>: p = d · g · h.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
