aulasMM.aulas['triangulos'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br, num = v => br(v, Number.isInteger(v) ? 0 : 1);
  const AZUL = '#62a8ea', AMARELO = '#e9b949', VERDE = 'var(--certo)';
  const CONTROLES = {
    pitagoras: [['Cateto a', 1, 12, 1, 3], ['Cateto b', 1, 12, 1, 4]],
    sombra: [['Sombra da pessoa', 0.5, 4, 0.5, 1.5], ['Sombra do prédio', 4, 36, 1, 18]]
  };
  const TERNOS = ['3,4', '6,8', '9,12', '5,12', '8,6', '4,3', '12,9', '12,5'];
  let modo = 'pitagoras';
  const texto = (x, y, t, cor, ancora = 'middle') => `<text x="${x}" y="${y}" text-anchor="${ancora}" style="fill:${cor};font-weight:800;font-size:13px">${t}</text>`;
  function pitagoras() {
    const a = Number($('v1').value), b = Number($('v2').value), c = Math.hypot(a, b);
    $('o1').textContent = a; $('o2').textContent = b;
    const k = Math.min(250 / b, 180 / a), x0 = 40, y0 = 200, xb = x0 + b * k, ya = y0 - a * k;
    $('graf').innerHTML = `<path d="M${x0} ${y0} L${xb} ${y0} L${x0} ${ya} Z" fill="color-mix(in srgb, var(--certo) 14%, transparent)" stroke="currentColor" stroke-width="2.5"/>
      <path d="M${x0} ${y0 - 14} h14 v14" fill="none" stroke="currentColor"/>
      ${texto(x0 - 10, (y0 + ya) / 2 + 4, 'a = ' + a, AZUL, 'end')}${texto((x0 + xb) / 2, y0 + 16, 'b = ' + b, AMARELO)}
      ${texto((x0 + xb) / 2 + 14, (y0 + ya) / 2 - 6, 'c = ' + num(Math.round(c * 10) / 10), VERDE, 'start')}`;
    $('graf').setAttribute('aria-label', `Triângulo retângulo com catetos ${a} e ${b}`);
    $('conta').innerHTML = `<span style="color:${AZUL}">${a}²</span> + <span style="color:${AMARELO}">${b}²</span> = ${a * a} + ${b * b} = <span style="color:${VERDE}">${a * a + b * b}</span> → c = √${a * a + b * b} ${Number.isInteger(c) ? '= ' + c : '≈ ' + br(c, 2)}`;
    $('recado').textContent = Number.isInteger(c)
      ? `Deu exato: ${a}, ${b} e ${c} é um terno pitagórico.${TERNOS.includes(a + ',' + b) ? ' Esse aparece muito no ENEM!' : ''}`
      : 'A hipotenusa (c) é sempre o maior lado, mas é menor que a + b: o caminho reto é mais curto que dar a volta pelos catetos.';
  }
  function sombra() {
    const s = Number($('v1').value), S = Number($('v2').value), h = 1.8, H = h * S / s;
    $('o1').textContent = num(s) + ' m'; $('o2').textContent = S + ' m';
    // Escala única para os dois triângulos caberem
    const k = Math.min(170 / H, 120 / S, 60 / s), base = 196;
    const xp = 40, xpr = 150;
    $('graf').innerHTML = `<line x1="8" y1="${base}" x2="314" y2="${base}" stroke="currentColor" opacity=".5"/>
      <rect x="${xp - 3}" y="${base - h * k}" width="6" height="${h * k}" rx="3" fill="${AZUL}"/>
      <path d="M${xp} ${base - h * k} L${xp + s * k} ${base}" stroke="${AMARELO}" stroke-dasharray="4 3"/><line x1="${xp}" y1="${base}" x2="${xp + s * k}" y2="${base}" stroke="${AMARELO}" stroke-width="4"/>
      <rect x="${xpr - 14}" y="${base - H * k}" width="28" height="${H * k}" fill="color-mix(in srgb, currentColor 22%, transparent)" stroke="currentColor"/>
      <path d="M${xpr} ${base - H * k} L${xpr + S * k} ${base}" stroke="${AMARELO}" stroke-dasharray="4 3"/><line x1="${xpr}" y1="${base}" x2="${xpr + S * k}" y2="${base}" stroke="${AMARELO}" stroke-width="4"/>
      ${texto(xp, base - h * k - 6, '1,8 m', AZUL)}${texto(xpr, base - H * k - 6, 'H = ' + num(Math.round(H * 10) / 10) + ' m', VERDE)}
      ${texto(xp + s * k / 2, base + 16, num(s) + ' m', AMARELO)}${texto(xpr + S * k / 2, base + 16, S + ' m', AMARELO)}
      ${texto(300, 22, '☀️', 'currentColor')}`;
    $('graf').setAttribute('aria-label', `Pessoa de 1,8 m com sombra de ${num(s)} m e prédio com sombra de ${S} m`);
    $('conta').innerHTML = `<span style="color:${VERDE}">H</span> = ${S} × <span style="color:${AZUL}">1,8</span> ÷ ${num(s)} = <span style="color:${VERDE}">${num(Math.round(H * 10) / 10)} m</span>`;
    $('recado').textContent = `O sol bate com o mesmo ângulo na pessoa e no prédio: os dois triângulos são semelhantes. A sombra do prédio é ${num(Math.round(S / s * 10) / 10)} vezes a da pessoa, então a altura também é ${num(Math.round(S / s * 10) / 10)} vezes: 1,8 ÷ ${num(s)} = H ÷ ${S}.`;
  }
  function desenhar() { (modo === 'pitagoras' ? pitagoras : sombra)(); }
  function trocar(m) {
    modo = m;
    CONTROLES[m].forEach(([rot, min, max, step, val], i) => { $('r' + (i + 1)).textContent = rot; Object.assign($('v' + (i + 1)), { min, max, step, value: val }); });
    raiz.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === m)));
    desenhar();
  }
  raiz.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => trocar(b.dataset.modo)));
  $('v1').addEventListener('input', desenhar); $('v2').addEventListener('input', desenhar);
  trocar('pitagoras');

  // ---------- filminho: os quadrados de Pitágoras ----------
  const { ator, por } = aulasMM;
  const grade = (n, cor) => `<span style="display:grid;grid-template-columns:repeat(${n},9px);gap:1px">${('<i style="width:9px;height:9px;border-radius:2px;background:' + cor + '"></i>').repeat(n * n)}</span>`;
  const ROTEIROS = {
    quadrados: {
      montar(p) {
        return {
          q3: ator(p, grade(3, AZUL), 20, 40), t3: ator(p, '<span class="au-numero au-pequeno">3² = 9</span>', 20, 66),
          q4: ator(p, grade(4, AMARELO), 46, 40), t4: ator(p, '<span class="au-numero au-pequeno">4² = 16</span>', 46, 66),
          q5: por(ator(p, grade(5, 'var(--certo)'), 78, 40), { o: 0 }), t5: por(ator(p, '<span class="au-numero au-pequeno">5² = 25</span>', 78, 70), { o: 0 }),
          mais: ator(p, '<span class="au-numero au-medio">+</span>', 33, 40), igual: por(ator(p, '<span class="au-numero au-medio">=</span>', 61, 40), { o: 0 })
        };
      },
      passos: [
        [2600, 'Triângulo de catetos <b>3</b> e <b>4</b>. Faça um quadrado em cada cateto: 9 e 16 quadradinhos.'],
        [3000, 'Juntando, dá <b>25</b> quadradinhos: exatamente um quadrado de lado <b>5</b>, a hipotenusa.', a => { por(a.igual, { o: 1 }); por(a.q5, { o: 1 }); por(a.t5, { o: 1 }); }],
        [2800, 'É isso que diz Pitágoras: <b>a² + b² = c²</b>. 9 + 16 = 25.']
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
