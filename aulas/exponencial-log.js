aulasMM.aulas['exponencial-log'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  function grafico() {
    const h = Number($('h').value), k = Number($('base').value), v = k ** h, topo = k ** 10;
    $('o-h').textContent = h + ' h'; $('o-base').textContent = '× ' + k;
    const X = t => 30 + t / 10 * 280, Y = y => 190 - y / topo * 180;
    const pts = Array.from({ length: 101 }, (_, i) => i / 10).map(t => `${X(t)},${Y(k ** t)}`).join(' ');
    const reta = `${X(0)},${Y(1)} ${X(10)},${Y(1 + 10 * (k - 1))}`;
    $('graf').innerHTML = `<line x1="30" y1="190" x2="312" y2="190" stroke="currentColor" opacity=".5"/><line x1="30" y1="190" x2="30" y2="6" stroke="currentColor" opacity=".5"/>
      ${[0, 2, 4, 6, 8, 10].map(t => `<text x="${X(t)}" y="204" text-anchor="middle">${t} h</text>`).join('')}
      <polyline points="${reta}" fill="none" stroke="#e9b949" stroke-width="2" stroke-dasharray="5 4"/>
      <polyline points="${pts}" fill="none" stroke="#8bc34a" stroke-width="3"/>
      <line x1="${X(h)}" y1="190" x2="${X(h)}" y2="${Y(v)}" stroke="var(--texto)" stroke-dasharray="3 3"/>
      <circle cx="${X(h)}" cy="${Y(v)}" r="7" fill="var(--texto)"/>
      <text x="40" y="20" style="fill:#8bc34a;font-weight:800">multiplicando (exponencial)</text>
      <text x="40" y="36" style="fill:#e9b949;font-weight:800">somando (afim)</text>`;
    $('lei').textContent = `f(x) = 1 · ${k}ˣ`;
    $('recado').innerHTML = `Depois de <b>${h} h</b>: ${k}<sup>${h}</sup> = <b>${br(v, 0)}</b> bactérias. Se fosse só somando ${k - 1} por hora, seriam ${1 + h * (k - 1)}. `
      + (h >= 6 ? 'Repare: no começo as duas curvas andam juntas, depois a exponencial dispara.' : 'Arraste as horas até o fim e veja a exponencial disparar.')
      + ` E o log responde ao contrário: log<sub>${k}</sub> ${br(v, 0)} = ${h}.`;
  }
  for (const id of ['h', 'base']) $(id).addEventListener('input', grafico);
  grafico();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const col = n => `<span class="au-colonia">${'<i></i>'.repeat(n)}</span>`;
  const ROTEIROS = {
    dobra: {
      montar(p) { return { c: ator(p, col(1), 50, 42), t: ator(p, N('1', 'au-medio'), 50, 86) }; },
      passos: [1, 2, 4, 8, 16, 32].map((n, i) => [i === 5 ? 3000 : 1700,
        i === 0 ? 'Começa com <b>1</b> bactéria.' : i === 5 ? `5 horas: <b>2⁵ = 32</b>. Em 10 horas seriam 1024!` : `${i} h: dobra para <b>${n}</b>.`,
        a => { a.c.innerHTML = col(n); por(a.t, { html: N(i ? `2<sup>${i}</sup> = ${n}` : '1', 'au-medio' + (i === 5 ? ' au-certo-txt' : '')) }); }])
    },
    meiavida: {
      montar(p) { return { b: ator(p, '<span style="display:block;width:220px;height:26px;border-radius:6px;background:#62a8ea;transition:width .6s"></span>', 50, 40), t: ator(p, N('800 mg', 'au-medio'), 50, 76) }; },
      passos: [[0, '800 mg'], [6, '400 mg'], [12, '200 mg'], [18, '100 mg']].map(([h, m], i) => [2000,
        i === 0 ? 'Tomou <b>800 mg</b> de remédio.' : `Mais 6 horas (uma meia-vida): cai pela <b>metade</b>.`,
        a => { a.b.firstChild.style.width = 220 / 2 ** i + 'px'; por(a.t, { html: N(`${h} h: ${m}`, 'au-medio') }); }])
    },
    escala: {
      montar(p) {
        const a = { t: ator(p, N('', 'au-pequeno'), 50, 90), d: [] };
        for (let i = 0; i < 4; i++) a.d.push(por(ator(p, `<span class="au-chip">Magnitude ${i + 3} · ${['1×', '10×', '100×', '1000×'][i]}</span>`, 50, 72 - i * 20), { o: .15 }));
        return a;
      },
      passos: [
        [1800, 'Magnitude <b>3</b>.', a => por(a.d[0], { o: 1 })],
        [1800, 'Magnitude 4: <b>10 vezes</b> maior.', a => por(a.d[1], { o: 1 })],
        [1800, 'Magnitude 5: mais 10 vezes, <b>100 vezes</b> a 3.', a => por(a.d[2], { o: 1 })],
        [3000, 'Magnitude 6: <b>1000 vezes</b> a 3. Cada degrau da escala log multiplica por 10.', a => { por(a.d[3], { o: 1 }); por(a.t, { html: N('+1 ponto = ×10', 'au-pequeno au-certo-txt') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
