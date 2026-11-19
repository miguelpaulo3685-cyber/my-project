aulasMM.aulas['areas'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br, num = v => br(v, Number.isInteger(v) ? 0 : 1);
  const U = 24, X0 = 16, Y0 = 194; // 1 m = 24 px; malha de 12 × 7
  const P = (x, y) => `${X0 + x * U},${Y0 - y * U}`;
  const ROTULOS = {
    retangulo: ['Base', 'Altura'], triangulo: ['Base', 'Altura'], paralelogramo: ['Base', 'Altura'],
    trapezio: ['Base maior', 'Altura'], circulo: ['Raio', null]
  };
  let fig = 'retangulo';
  function malha() {
    let s = '';
    for (let i = 0; i <= 12; i++) s += `<line x1="${X0 + i * U}" y1="${Y0}" x2="${X0 + i * U}" y2="${Y0 - 7 * U}" stroke="currentColor" opacity=".12"/>`;
    for (let j = 0; j <= 7; j++) s += `<line x1="${X0}" y1="${Y0 - j * U}" x2="${X0 + 12 * U}" y2="${Y0 - j * U}" stroke="currentColor" opacity=".12"/>`;
    return s;
  }
  const forma = pts => `<polygon points="${pts.map(([x, y]) => P(x, y)).join(' ')}" fill="color-mix(in srgb, var(--certo) 30%, transparent)" stroke="var(--certo)" stroke-width="2.5"/>`;
  const alturaTracejada = (x, h) => `<line x1="${X0 + x * U}" y1="${Y0}" x2="${X0 + x * U}" y2="${Y0 - h * U}" stroke="#e9b949" stroke-width="2" stroke-dasharray="5 4"/>`;
  function desenhar() {
    let b = Number($('v1').value), h = Number($('v2').value), m = Math.min(Number($('v3').value), b);
    const [r1, r2] = ROTULOS[fig];
    $('r1').textContent = r1; $('c2').hidden = !r2; $('c3').hidden = fig !== 'trapezio';
    if (r2) $('r2').textContent = r2;
    let svg = malha(), conta, area;
    if (fig === 'retangulo') { svg += forma([[0, 0], [b, 0], [b, h], [0, h]]); area = b * h; conta = `A = ${b} × ${h} = ${area} m²`; }
    if (fig === 'paralelogramo') {
      const d = Math.min(3, 12 - b); svg += forma([[0, 0], [b, 0], [b + d, h], [d, h]]) + alturaTracejada(d, h);
      area = b * h; conta = `A = ${b} × ${h} = ${area} m²`;
    }
    if (fig === 'triangulo') { const t = Math.min(b, 2); svg += forma([[0, 0], [b, 0], [t, h]]) + alturaTracejada(t, h); area = b * h / 2; conta = `A = ${b} × ${h} ÷ 2 = ${num(area)} m²`; }
    if (fig === 'trapezio') {
      const d = (b - m) / 2; svg += forma([[0, 0], [b, 0], [d + m, h], [d, h]]) + alturaTracejada(d, h);
      area = (b + m) * h / 2; conta = `A = (${b} + ${m}) × ${h} ÷ 2 = ${num(area)} m²`;
      $('o3').textContent = m + ' m';
    }
    if (fig === 'circulo') {
      const r = b;
      svg += `<circle cx="${X0 + 6 * U}" cy="${Y0 - 3.5 * U}" r="${r * U}" fill="color-mix(in srgb, var(--certo) 30%, transparent)" stroke="var(--certo)" stroke-width="2.5"/>
        <line x1="${X0 + 6 * U}" y1="${Y0 - 3.5 * U}" x2="${X0 + (6 + r) * U}" y2="${Y0 - 3.5 * U}" stroke="#e9b949" stroke-width="2.5"/>`;
      area = Math.PI * r * r; conta = `A = π × ${num(r)}² ≈ ${br(area, 1)} m²`;
      $('o1').textContent = num(r) + ' m';
    } else $('o1').textContent = b + ' m';
    $('o2').textContent = h + ' m';
    $('graf').innerHTML = svg;
    $('graf').setAttribute('aria-label', `${fig} com área de ${br(area, 1)} metros quadrados sobre uma malha de quadradinhos de 1 metro quadrado`);
    $('conta').textContent = conta;
    const dicas = {
      retangulo: `Conte os quadradinhos: ${h} fileiras de ${b} = ${area}. A fórmula só conta mais rápido.`,
      paralelogramo: 'A altura é a linha amarela, em pé. O lado inclinado é mais comprido, mas não entra na conta: recorte o triângulo de um lado e encaixe do outro, vira um retângulo.',
      triangulo: `É exatamente metade do retângulo ${b} × ${h} (= ${b * h} m²). A altura é a linha amarela, não o lado inclinado.`,
      trapezio: `É como a média das bases vezes a altura: (${b} + ${m}) ÷ 2 = ${num((b + m) / 2)}, vezes ${h}.`,
      circulo: `Com π = 3, daria 3 × ${num(Math.min(b, 3.5))}² = ${num(3 * b * b)} m². Nem todo quadradinho fica inteiro: por isso a área do círculo usa π. Com raio 2 vezes maior, a área fica 4 vezes maior.`
    };
    $('recado').textContent = dicas[fig];
  }
  raiz.querySelectorAll('[data-fig]').forEach(btn => btn.addEventListener('click', () => {
    fig = btn.dataset.fig;
    raiz.querySelectorAll('[data-fig]').forEach(x => x.setAttribute('aria-pressed', String(x === btn)));
    Object.assign($('v1'), fig === 'circulo' ? { max: 3.5, step: .5, value: Math.min(Number($('v1').value), 3) } : { max: 12, step: 1 });
    desenhar();
  }));
  ['v1', 'v2', 'v3'].forEach(id => $(id).addEventListener('input', desenhar));
  raiz.querySelector('[data-fig="retangulo"]').setAttribute('aria-pressed', 'true');
  desenhar();

  // ---------- filminho: o triângulo é metade do retângulo ----------
  const { ator, por } = aulasMM;
  const ROTEIROS = {
    metade: {
      montar(p) {
        return {
          ret: ator(p, '<svg viewBox="0 0 160 100" style="width:min(220px,58vw);margin:0"><rect x="4" y="4" width="152" height="92" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6 4"/></svg>', 50, 44),
          t1: ator(p, '<svg viewBox="0 0 160 100" style="width:min(220px,58vw);margin:0"><path d="M4 96 L156 96 L156 4 Z" fill="color-mix(in srgb, var(--certo) 40%, transparent)" stroke="var(--certo)" stroke-width="2.5"/></svg>', 50, 44),
          t2: por(ator(p, '<svg viewBox="0 0 160 100" style="width:min(220px,58vw);margin:0"><path d="M4 96 L4 4 L156 4 Z" fill="color-mix(in srgb, #e9b949 40%, transparent)" stroke="#e9b949" stroke-width="2.5"/></svg>', 50, 44), { o: 0 }),
          t: por(ator(p, '<span class="au-numero au-pequeno">triângulo = base × altura ÷ 2</span>', 50, 90), { o: 0 })
        };
      },
      passos: [
        [2600, 'Um triângulo dentro de um retângulo com a mesma base e a mesma altura.'],
        [2800, 'Uma cópia do triângulo, virada, preenche o resto do retângulo.', a => por(a.t2, { o: 1 })],
        [3000, 'Dois triângulos iguais formam o retângulo: cada um vale <b>metade</b>. Daí o <b>÷ 2</b>.', a => por(a.t, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
