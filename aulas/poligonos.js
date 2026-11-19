aulasMM.aulas['poligonos'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br, rad = g => g * Math.PI / 180;
  const NOMES = { 3: 'Triângulo', 4: 'Quadrado', 5: 'Pentágono', 6: 'Hexágono', 7: 'Heptágono', 8: 'Octógono', 9: 'Eneágono', 10: 'Decágono', 11: 'Undecágono', 12: 'Dodecágono' };
  const CONTROLE = { poligono: ['Lados (n)', 3, 12, 1, 5], circulo: ['Raio', 1, 10, 1, 4] };
  let modo = 'poligono';
  const leitura = (rot, val) => `<div class="au-leitura"><small>${rot}</small><strong>${val}</strong></div>`;
  function poligono() {
    const n = Number($('v').value);
    $('o').textContent = n;
    const cx = 160, cy = 112, r = 92;
    const pts = Array.from({ length: n }, (_, k) => [cx + r * Math.cos(rad(-90 + k * 360 / n)), cy + r * Math.sin(rad(-90 + k * 360 / n))]);
    let diag = '';
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) if (!(i === 0 && j === n - 1))
      diag += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" stroke="${i === 0 ? 'var(--certo)' : '#62a8ea'}" stroke-width="${i === 0 ? 2 : 1}" opacity="${i === 0 ? .95 : .35}"/>`;
    $('graf').innerHTML = `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="color-mix(in srgb, #e9b949 16%, transparent)" stroke="currentColor" stroke-width="2.5"/>${diag}
      ${pts.map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="${k ? 3 : 5}" fill="${k ? 'currentColor' : 'var(--certo)'}"/>`).join('')}`;
    $('graf').setAttribute('aria-label', `${NOMES[n]} regular com suas diagonais`);
    const soma = (n - 2) * 180, d = n * (n - 3) / 2;
    $('leituras').innerHTML = leitura('Soma dos ângulos', soma + '°') + leitura('Cada ângulo', br(soma / n, Number.isInteger(soma / n) ? 0 : 1) + '°') + leitura('Diagonais', d);
    $('recado').textContent = `${NOMES[n]}: do vértice verde saem ${n - 3} diagonais (verdes), que dividem a figura em ${n - 2} triângulos. Por isso a soma é (${n} − 2) × 180° = ${soma}°.`
      + ([3, 4, 6].includes(n) ? ` E ele ladrilha o chão: ${360 / (soma / n)} cantos fecham 360°.` : '');
  }
  function circulo() {
    const r = Number($('v').value), C = 2 * Math.PI * r, A = Math.PI * r * r;
    $('o').textContent = r + ' m';
    const k = 9;
    $('graf').innerHTML = `<circle cx="120" cy="110" r="${r * k}" fill="color-mix(in srgb, #62a8ea 22%, transparent)" stroke="#62a8ea" stroke-width="3"/>
      <line x1="120" y1="110" x2="${120 + r * k}" y2="110" stroke="#e9b949" stroke-width="3"/><circle cx="120" cy="110" r="3" fill="currentColor"/>
      <text x="${120 + r * k / 2}" y="104" text-anchor="middle" style="fill:#e9b949;font-weight:800;font-size:12px">r</text>
      <line x1="232" y1="200" x2="${232 + Math.min(C, 63) * 1.3}" y2="200" stroke="#62a8ea" stroke-width="4"/>
      <text x="232" y="190" style="font-size:11px">a volta esticada${C > 63 ? ' (cortada)' : ''}</text>`;
    $('graf').setAttribute('aria-label', `Círculo de raio ${r} metros`);
    $('leituras').innerHTML = leitura('Diâmetro', 2 * r + ' m') + leitura('Volta (2πr)', br(C, 1) + ' m') + leitura('Área (πr²)', br(A, 1) + ' m²');
    $('recado').textContent = `Com π = 3, a volta seria ${6 * r} m e a área, ${3 * r * r} m². Dobre o raio e veja: a volta dobra, mas a área fica 4 vezes maior.`;
  }
  function desenhar() { (modo === 'poligono' ? poligono : circulo)(); }
  function trocar(m) {
    modo = m;
    const [rot, min, max, step, val] = CONTROLE[m];
    $('rot').textContent = rot; Object.assign($('v'), { min, max, step, value: val });
    raiz.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === m)));
    desenhar();
  }
  raiz.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => trocar(b.dataset.modo)));
  $('v').addEventListener('input', desenhar);
  trocar('poligono');

  // ---------- filminho: ladrilhos ----------
  const { ator, por } = aulasMM;
  // n polígonos regulares de lado L em volta de um ponto (cx, cy)
  function roseta(n, quantos, cor) {
    const ang = (n - 2) * 180 / n, L = 34, R = L / (2 * Math.sin(Math.PI / n));
    let s = '';
    for (let q = 0; q < quantos; q++) {
      const giro = q * ang + ang / 2;
      // centro do polígono fica na bissetriz do canto, à distância R do vértice comum
      const cx = 70 + R * Math.cos(rad(giro)), cy = 70 - R * Math.sin(rad(giro));
      const pts = Array.from({ length: n }, (_, k) => { const t = giro + 180 + k * 360 / n; return [cx + R * Math.cos(rad(t)), cy - R * Math.sin(rad(t))]; });
      s += `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${cor}" stroke="var(--superficie-2)" stroke-width="2"/>`;
    }
    return `<svg viewBox="0 0 140 140" style="width:min(150px,38vw);margin:0">${s}<circle cx="70" cy="70" r="3" fill="currentColor"/></svg>`;
  }
  const ROTEIROS = {
    ladrilho: {
      montar(p) {
        return {
          hex: ator(p, roseta(6, 3, '#e9b949'), 27, 44), th: por(ator(p, '<span class="au-numero au-pequeno">3 × 120° = 360° ✓</span>', 27, 86), { o: 0 }),
          pen: ator(p, roseta(5, 3, '#62a8ea'), 73, 44), tp: por(ator(p, '<span class="au-numero au-pequeno">3 × 108° = 324° ✗</span>', 73, 86), { o: 0 })
        };
      },
      passos: [
        [2600, 'Três hexágonos e três pentágonos em volta de um ponto.'],
        [3000, 'Hexágono: cada ângulo tem <b>120°</b>. Três fecham <b>360°</b>, sem buraco.', a => por(a.th, { o: 1 })],
        [3200, 'Pentágono: <b>108°</b>. Três dão 324° e sobra um buraco de 36°; quatro passariam de 360°. Não ladrilha.', a => por(a.tp, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
