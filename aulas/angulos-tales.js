aulasMM.aulas['angulos-tales'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br, rad = g => g * Math.PI / 180;
  const VERDE = 'var(--certo)', AMARELO = '#e9b949';
  let modo = 'paralelas';
  const CONTROLE = { paralelas: ['Ângulo α', 20, 160, 60], tales: ['Rua do meio', 60, 160, 100] };
  function rotulo(x, y, txt, cor) { return `<text x="${x}" y="${y + 4}" text-anchor="middle" style="fill:${cor};font-weight:800;font-size:12px">${txt}</text>`; }
  function paralelas() {
    const a = Number($('v').value), c = Math.cos(rad(a)), s = Math.sin(rad(a));
    $('o').textContent = a + '°';
    const P = t => [160 + t * c, 110 - t * s];
    const [x1, y1] = P(-110 / s), [x2, y2] = P(110 / s);
    const cruz = [P(40 / s), P(-40 / s)]; // cruzamentos com y = 70 e y = 150
    const marcas = cruz.map(([x, y]) => [[a / 2, a], [(a + 180) / 2, 180 - a], [180 + a / 2, a], [270 + a / 2, 180 - a]]
      .map(([dir, v]) => rotulo(x + 24 * Math.cos(rad(dir)), y - 24 * Math.sin(rad(dir)), v + '°', v === a ? VERDE : AMARELO)).join('')).join('');
    $('graf').innerHTML = `<line x1="10" y1="70" x2="310" y2="70" stroke="#62a8ea" stroke-width="3"/><line x1="10" y1="150" x2="310" y2="150" stroke="#62a8ea" stroke-width="3"/>
      <text x="14" y="62">r</text><text x="14" y="142">s</text>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="2.5"/>${cruz.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="currentColor"/>`).join('')}${marcas}`;
    $('graf').setAttribute('aria-label', `Duas paralelas cortadas por uma transversal: quatro ângulos de ${a} graus e quatro de ${180 - a} graus`);
    $('recado').textContent = a === 90
      ? 'Com 90°, a transversal é perpendicular: os oito ângulos são retos.'
      : `Só aparecem dois valores: ${a}° (verde) e ${180 - a}° (amarelo), que somam 180°. Correspondentes e alternos internos são iguais; colaterais internos somam 180°.`;
  }
  function tales() {
    const ym = Number($('v').value);
    $('o').textContent = '';
    // Transversal r passa por (50,15) e (120,205); s passa por (190,15) e (300,205). Ruas em y = 30, ym e 190.
    const xr = y => 50 + (y - 15) * 70 / 190, xs = y => 190 + (y - 15) * 110 / 190;
    const kr = Math.hypot(70, 190) / 190, ks = Math.hypot(110, 190) / 190; // comprimento por unidade de altura
    const esc = 1 / 16; // 16 px = 1 m
    const a = (ym - 30) * kr * esc, b = (190 - ym) * kr * esc, c = (ym - 30) * ks * esc, d = (190 - ym) * ks * esc;
    const rua = y => `<line x1="10" y1="${y}" x2="315" y2="${y}" stroke="#62a8ea" stroke-width="3"/>`;
    const pt = (x, y) => `<circle cx="${x}" cy="${y}" r="3.5" fill="currentColor"/>`;
    $('graf').innerHTML = rua(30) + rua(ym) + rua(190) +
      `<line x1="50" y1="15" x2="120" y2="205" stroke="currentColor" stroke-width="2.5"/><line x1="190" y1="15" x2="300" y2="205" stroke="currentColor" stroke-width="2.5"/>` +
      [30, ym, 190].map(y => pt(xr(y), y) + pt(xs(y), y)).join('') +
      rotulo(xr((30 + ym) / 2) - 18, (30 + ym) / 2, 'a', VERDE) + rotulo(xr((ym + 190) / 2) - 18, (ym + 190) / 2, 'b', AMARELO) +
      rotulo(xs((30 + ym) / 2) + 16, (30 + ym) / 2, 'c', VERDE) + rotulo(xs((ym + 190) / 2) + 16, (ym + 190) / 2, 'd', AMARELO);
    $('graf').setAttribute('aria-label', 'Três ruas paralelas cortadas por duas transversais');
    $('recado').textContent = `a = ${br(a, 1)} m e b = ${br(b, 1)} m; c = ${br(c, 1)} m e d = ${br(d, 1)} m. a/b = ${br(a / b, 2)} e c/d = ${br(c / d, 2)}: sempre iguais, para qualquer posição da rua do meio. Isso é Tales.`;
  }
  function desenhar() { (modo === 'paralelas' ? paralelas : tales)(); }
  function trocar(m) {
    modo = m;
    const [rot, min, max, val] = CONTROLE[m];
    $('rot').textContent = rot; Object.assign($('v'), { min, max, value: val });
    raiz.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === m)));
    desenhar();
  }
  raiz.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => trocar(b.dataset.modo)));
  $('v').addEventListener('input', desenhar);
  trocar('paralelas');

  // ---------- filminho: a soma dos ângulos do triângulo ----------
  const { ator, por } = aulasMM;
  // Setor de círculo de t1 a t2 graus (0° = direita, sentido anti-horário), centro (cx, cy).
  const setor = (cx, cy, r, t1, t2, cor) => `<path d="M${cx} ${cy} L${cx + r * Math.cos(rad(t1))} ${cy - r * Math.sin(rad(t1))} A${r} ${r} 0 0 0 ${cx + r * Math.cos(rad(t2))} ${cy - r * Math.sin(rad(t2))} Z" fill="${cor}"/>`;
  // Triângulo A(10,120) B(150,120) C(70,15): ângulos ≈ 60° em A, 53° em B, 67° em C.
  const A = 60.3, B = 52.7, C = 180 - A - B;
  const triangulo = `<svg viewBox="0 0 160 130" style="width:min(220px,58vw);margin:0">${setor(10, 120, 22, 0, A, '#62a8ea')}${setor(150, 120, 22, 180 - B, 180, '#e9b949')}
    ${setor(70, 15, 22, 180 + A, 360 - B, 'var(--certo)')}<path d="M10 120 L150 120 L70 15 Z" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>`;
  const meiaVolta = `<svg viewBox="0 0 140 76" style="width:min(200px,52vw);margin:0">${setor(70, 70, 62, 0, B, '#e9b949')}${setor(70, 70, 62, B, B + C, 'var(--certo)')}
    ${setor(70, 70, 62, B + C, 180, '#62a8ea')}<line x1="2" y1="70" x2="138" y2="70" stroke="currentColor" stroke-width="2.5"/></svg>`;
  const ROTEIROS = {
    triangulo: {
      montar(p) {
        return {
          tri: ator(p, triangulo, 50, 42),
          meia: por(ator(p, meiaVolta, 50, 46), { o: 0 }),
          t: por(ator(p, '<span class="au-numero au-pequeno">60° + 67° + 53° = 180°</span>', 50, 90), { o: 0 })
        };
      },
      passos: [
        [2600, 'Um triângulo qualquer, com os três cantos pintados.'],
        [3200, 'Recorte os três cantos e junte um ao lado do outro…', a => { por(a.tri, { o: 0, s: .6 }); por(a.meia, { o: 1 }); }],
        [3000, 'Eles formam uma <b>meia-volta</b>: os ângulos internos de qualquer triângulo somam <b>180°</b>.', a => por(a.t, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
