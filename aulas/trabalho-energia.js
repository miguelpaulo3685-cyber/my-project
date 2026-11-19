aulasMM.aulas['trabalho-energia'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const kj = j => j >= 10000 ? br(j / 1000, 0) + ' kJ' : br(j, 0) + ' J';
  const MODOS = {
    cinetica: { m: [50, 2000, 50, 1000], x: ['Velocidade', 10, 120, 10, 40] },
    potencial: { m: [1, 50, 1, 10], x: ['Altura', 1, 30, 1, 5] }
  };
  let modo = 'cinetica';
  function desenhar() {
    const m = Number($('m').value), x = Number($('x').value);
    $('om').textContent = m + ' kg';
    let txt;
    if (modo === 'cinetica') {
      const v = x / 3.6, E = m * v * v / 2, E40 = m * (40 / 3.6) ** 2 / 2;
      $('ox').textContent = x + ' km/h';
      const larg = Math.min(280, 280 * E / (2000 * (120 / 3.6) ** 2 / 2) * 4);
      $('graf').innerHTML = `<text x="20" y="22">energia do movimento</text><rect x="20" y="30" width="${Math.max(2, larg)}" height="22" rx="5" fill="#e9b949"/>
        <text x="20" y="74">mesmo carro a 40 km/h</text><rect x="20" y="82" width="${Math.max(2, Math.min(280, 280 * E40 / (2000 * (120 / 3.6) ** 2 / 2) * 4))}" height="14" rx="4" fill="#62a8ea"/>
        <text x="20" y="128" style="font-size:20px">🚗</text><line x1="48" y1="122" x2="${48 + x * 2}" y2="122" stroke="#e9b949" stroke-width="3" stroke-dasharray="4 3"/>`;
      $('conta').textContent = `Ec = ${m} × (${br(v, 1)})² ÷ 2 ≈ ${kj(E)}`;
      txt = `A ${x} km/h (${br(v, 1)} m/s), o carro tem ${kj(E)} de energia. É ${br(E / E40, 1)} vezes a energia a 40 km/h: a velocidade entra ao quadrado. É essa energia que os freios precisam tirar, ou que vira estrago numa batida.`;
    } else {
      const E = m * 10 * x;
      $('ox').textContent = x + ' m';
      const y = 130 - x * 3.8;
      $('graf').innerHTML = `<line x1="20" y1="132" x2="300" y2="132" stroke="currentColor" opacity=".5"/>
        <line x1="120" y1="132" x2="120" y2="${y + 14}" stroke="currentColor" stroke-dasharray="3 3" opacity=".6"/>
        <rect x="${108 - m * 0.3}" y="${y - m * 0.5}" width="${24 + m * 0.6}" height="${14 + m * 0.5}" rx="3" fill="#b98a52"/>
        <text x="130" y="${(y + 132) / 2 + 4}">h = ${x} m</text>
        <rect x="220" y="${132 - Math.min(120, E / 150)}" width="40" height="${Math.min(120, E / 150)}" rx="4" fill="#62a8ea"/><text x="240" y="${126 - Math.min(120, E / 150)}" text-anchor="middle" style="font-weight:800;fill:var(--texto)">${kj(E)}</text>`;
      $('conta').textContent = `Ep = ${m} × 10 × ${x} = ${kj(E)}`;
      txt = `A caixa guarda ${kj(E)} por estar a ${x} m de altura. Se cair, essa energia vira movimento: chega ao chão a ${br(Math.sqrt(2 * 10 * x) * 3.6, 0)} km/h. Dobre a altura e a energia dobra (não quadruplica).`;
    }
    $('graf').setAttribute('aria-label', txt);
    $('recado').textContent = txt;
  }
  function trocar(m) {
    modo = m;
    const c = MODOS[m];
    Object.assign($('m'), { min: c.m[0], max: c.m[1], step: c.m[2], value: c.m[3] });
    $('rx').textContent = c.x[0]; Object.assign($('x'), { min: c.x[1], max: c.x[2], step: c.x[3], value: c.x[4] });
    raiz.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === m)));
    desenhar();
  }
  raiz.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => trocar(b.dataset.modo)));
  ['m', 'x'].forEach(id => $(id).addEventListener('input', desenhar));
  trocar('cinetica');

  // ---------- filminho: a velocidade ao quadrado ----------
  const { ator, por } = aulasMM;
  const barra = (n, cor) => `<span style="display:flex;gap:3px">${('<i style="width:22px;height:22px;border-radius:4px;background:' + cor + '"></i>').repeat(n)}</span>`;
  const ROTEIROS = {
    quadrado: {
      montar(p) {
        return {
          c1: ator(p, '<span class="au-numero au-pequeno">🚗 a 40 km/h</span>', 24, 26), b1: ator(p, barra(1, '#62a8ea'), 60, 26),
          c2: por(ator(p, '<span class="au-numero au-pequeno">🚗 a 80 km/h</span>', 24, 56), { o: 0 }), b2: por(ator(p, barra(4, '#e9b949'), 60, 56), { o: 0 }),
          t: por(ator(p, '<span class="au-balao">2 × a velocidade = 4 × a energia</span>', 50, 86), { o: 0 })
        };
      },
      passos: [
        [2400, 'A 40 km/h, o carro tem 1 "pacote" de energia.'],
        [2800, 'Dobrando para 80 km/h, ele não tem 2 pacotes: tem <b>4</b>, porque a velocidade entra <b>ao quadrado</b>.', a => { por(a.c2, { o: 1 }); por(a.b2, { o: 1 }); }],
        [3000, 'Os freios precisam tirar 4 vezes mais energia: a distância para parar fica 4 vezes maior.', a => por(a.t, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
