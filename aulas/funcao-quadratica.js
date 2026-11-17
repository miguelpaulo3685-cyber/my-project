aulasMM.aulas['funcao-quadratica'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const num = v => br(v, Number.isInteger(v) ? 0 : 2);
  function grafico() {
    const a = Number($('a').value) || .5, b = Number($('b').value), c = Number($('c').value);
    $('o-a').textContent = num(a); $('o-b').textContent = b; $('o-c').textContent = c;
    if (Number($('a').value) === 0) $('a').value = .5;
    const f = x => a * x * x + b * x + c, xv = -b / (2 * a), yv = f(xv), D = b * b - 4 * a * c;
    const X = v => 160 + v * 24, Y = v => 110 - v * 9;
    const pts = []; for (let x = -6.5; x <= 6.5; x += .1) { const y = f(x); if (y > -12 && y < 12) pts.push(`${X(x)},${Y(y)}`); }
    const raizes = D < 0 ? [] : D === 0 ? [xv] : [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)];
    $('graf').innerHTML = `<line x1="4" y1="${Y(0)}" x2="316" y2="${Y(0)}" stroke="currentColor" opacity=".5"/><line x1="${X(0)}" y1="4" x2="${X(0)}" y2="216" stroke="currentColor" opacity=".5"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="#62a8ea" stroke-width="3"/>
      ${raizes.map(r => `<circle cx="${X(r)}" cy="${Y(0)}" r="5" fill="#e9b949"/>`).join('')}
      ${Math.abs(yv) < 12 && Math.abs(xv) < 6.5 ? `<circle cx="${X(xv)}" cy="${Y(yv)}" r="7" fill="${a < 0 ? '#e05252' : 'var(--certo)'}" stroke="#fff" stroke-width="2"/>
      <text x="${X(xv)}" y="${Y(yv) + (a < 0 ? -12 : 20)}" text-anchor="middle" style="fill:var(--texto);font-weight:800">vértice (${num(Math.round(xv * 100) / 100)}; ${num(Math.round(yv * 100) / 100)})</text>` : ''}`;
    $('lei').textContent = `f(x) = ${a === 1 ? '' : a === -1 ? '−' : num(a).replace('-', '−')}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
    $('recado').innerHTML = `a ${a < 0 ? '&lt; 0: abre para baixo (∩), o vértice é um <b>máximo</b>' : '&gt; 0: abre para cima (∪), o vértice é um <b>mínimo</b>'}. x do vértice = −b ÷ 2a = ${num(Math.round(xv * 100) / 100)}. `
      + (D < 0 ? 'Δ < 0: a parábola não corta o eixo x (sem raízes reais).' : D === 0 ? 'Δ = 0: toca o eixo x num ponto só.' : `Raízes (amarelas): ${raizes.map(r => num(Math.round(r * 100) / 100)).join(' e ')}. O vértice fica bem no meio delas.`);
  }
  for (const id of ['a', 'b', 'c']) $(id).addEventListener('input', grafico);
  grafico();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    bola: {
      montar(p) {
        const a = { chao: ator(p, '', 50, 86, 'au-reta'), bola: ator(p, '<span style="font-size:24px">⚽</span>', 10, 80) };
        a.marca = por(ator(p, '<span class="au-balao">altura máxima</span>', 50, 6), { o: 0 });
        a.t = ator(p, N('', 'au-pequeno'), 50, 96);
        return a;
      },
      passos: (() => {
        const pos = [[10, 80], [22, 48], [34, 28], [50, 18], [66, 28], [78, 48], [90, 80]];
        return [
          [2000, 'Um chute: a bola sobe…', a => [1, 2].forEach((k, i) => setTimeout(() => por(a.bola, { x: pos[k][0], y: pos[k][1] }), i * 600))],
          [2600, '…chega ao ponto mais alto, o <b>vértice</b>…', a => { por(a.bola, { x: pos[3][0], y: pos[3][1] }); por(a.marca, { o: 1 }); }],
          [2600, '…e desce de forma <b>simétrica</b>. O caminho é uma parábola com a &lt; 0.', a => [4, 5, 6].forEach((k, i) => setTimeout(() => por(a.bola, { x: pos[k][0], y: pos[k][1] }), i * 500))],
          [2600, 'Saiu do chão e voltou: as duas <b>raízes</b>. O vértice está bem no meio delas.', a => por(a.t, { html: N('vértice no meio das raízes', 'au-pequeno au-certo-txt') })]
        ];
      })()
    },
    cercado: {
      montar(p) {
        const a = { r: ator(p, '', 50, 44, 'au-cercado'), t: ator(p, N('', 'au-medio'), 50, 88) };
        return a;
      },
      passos: (() => {
        const ret = (x, txt, cls = '') => [2400, txt, a => { a.r.style.width = x * 16 + 'px'; a.r.style.height = (10 - x) * 16 + 'px'; por(a.t, { html: N(`${x} × ${10 - x} = ${x * (10 - x)} m²`, 'au-medio ' + cls) }); }];
        return [ret(1, 'Com 20 m de cerca: um retângulo de 1 × 9 tem só <b>9 m²</b>.'), ret(3, '3 × 7: <b>21 m²</b>.'), ret(5, '5 × 5, o quadrado: <b>25 m²</b>, a maior área. É o vértice.', 'au-certo-txt'), ret(8, '8 × 2: volta a cair, <b>16 m²</b>.')];
      })()
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
