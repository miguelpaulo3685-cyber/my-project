aulasMM.aulas['proporcao'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const num = v => br(v, Number.isInteger(v) ? 0 : Number.isInteger(v * 2) ? 1 : 2);

  // ---------- receita ----------
  const ING = [['🌾', .5, 'xícara de farinha', 'xícaras de farinha'], ['🥚', .5, 'ovo', 'ovos'], ['🥛', .25, 'copo de leite', 'copos de leite'], ['🍬', .25, 'xícara de açúcar', 'xícaras de açúcar']];
  function receita() {
    const n = Number($('pessoas').value);
    $('o-pessoas').textContent = n;
    $('receita').innerHTML = ING.map(([ic, por, um, varios]) => {
      const q = n * por;
      return `<div class="au-ingrediente"><span>${ic}</span><b>${num(q)}</b><small>${q <= 1 ? um : varios}</small></div>`;
    }).join('');
    // Gráfico: pessoas (0 a 24) × xícaras de farinha (0 a 12).
    const X = v => 34 + v / 24 * 270, Y = v => 145 - v / 12 * 125;
    const pts = Array.from({ length: 12 }, (_, k) => (k + 1) * 2);
    $('grafico').innerHTML = `<line x1="34" y1="145" x2="306" y2="145" stroke="currentColor" opacity=".5"/><line x1="34" y1="145" x2="34" y2="14" stroke="currentColor" opacity=".5"/>
      <line x1="${X(0)}" y1="${Y(0)}" x2="${X(24)}" y2="${Y(12)}" stroke="#62a8ea" stroke-width="2" stroke-dasharray="4 4"/>
      ${pts.map(p => `<circle cx="${X(p)}" cy="${Y(p / 2)}" r="${p === n ? 7 : 3.5}" fill="${p === n ? '#e9b949' : '#62a8ea'}"/>`).join('')}
      <text x="306" y="162" text-anchor="end">pessoas</text><text x="38" y="12">xícaras de farinha</text>
      <text x="${X(n)}" y="${Y(n / 2) - 12}" text-anchor="middle" style="fill:var(--texto);font-weight:700">${n} → ${num(n / 2)}</text>
      <text x="${X(0) - 4}" y="${Y(0) + 4}" text-anchor="end">0</text>`;
    $('recado').textContent = `Para ${n} pessoas: ${num(n / 2)} xícaras de farinha. Farinha ÷ pessoas = ${num(n / 2)} ÷ ${n} = 0,5, sempre igual. Por isso os pontos ficam numa reta que sai do zero.`;
  }
  $('pessoas').addEventListener('input', receita);
  receita();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    tabela: {
      montar(p) {
        const a = {
          c1: ator(p, N('pessoas', 'au-pequeno'), 26, 12), c2: ator(p, N('xícaras', 'au-pequeno'), 58, 12),
          l: [[4, 2], [8, 4], [12, 6]].map(([x, y], k) => [ator(p, N(x, 'au-medio'), 26, 32 + k * 20), por(ator(p, N(y, 'au-medio'), 58, 32 + k * 20), { o: k ? 0 : 1 })]),
          s1: por(ator(p, N('× 2', 'au-pequeno au-cor-u'), 42, 52), { o: 0 }), s2: por(ator(p, N('× 3', 'au-pequeno au-cor-u'), 42, 72), { o: 0 }),
          d: por(ator(p, N('÷ → 0,5', 'au-medio au-certo-txt'), 84, 52), { o: 0 })
        };
        return a;
      },
      passos: [
        [2400, 'Para <b>4 pessoas</b>, a receita usa <b>2 xícaras</b>.'],
        [2800, '<b>8 pessoas</b> é o dobro (× 2). A farinha também dobra: <b>4 xícaras</b>.', a => { por(a.l[1][1], { o: 1 }); por(a.s1, { o: 1 }); }],
        [2800, '<b>12 pessoas</b> é o triplo (× 3): <b>6 xícaras</b>.', a => { por(a.l[2][1], { o: 1 }); por(a.s2, { o: 1 }); }],
        [3200, 'Em todas as linhas, xícaras ÷ pessoas dá <b>0,5</b>. Divisão sempre igual = <b>diretamente proporcional</b>.', a => por(a.d, { o: 1 })]
      ]
    },
    inversa: {
      montar(p) {
        const a = { r: ator(p, '', 50, 44, 'au-barra-filme') };
        a.r.style.cssText += ';width:24%;height:104px;line-height:104px;background:#3f87c9;transition:width .8s, height .8s, line-height .8s !important';
        a.v = ator(p, N('60 km/h', 'au-pequeno'), 50, 8); a.t = ator(p, N('4 h', 'au-pequeno'), 18, 44);
        a.conta = ator(p, N('60 × 4 = 240 km', 'au-medio'), 50, 88);
        return a;
      },
      passos: [
        [2600, 'Viagem de <b>240 km</b>. A <b>60 km/h</b>, leva <b>4 horas</b>. A largura é a velocidade e a altura é o tempo.'],
        [3200, 'Dobre a velocidade: <b>120 km/h</b>. O tempo cai pela metade: <b>2 horas</b>. O retângulo muda de forma, mas a área (240 km) é a mesma.', a => {
          a.r.style.width = '48%'; a.r.style.height = '52px'; a.r.style.lineHeight = '52px';
          por(a.v, { html: N('120 km/h', 'au-pequeno') }); por(a.t, { html: N('2 h', 'au-pequeno'), x: 18 }); por(a.conta, { html: N('120 × 2 = 240 km', 'au-medio') });
        }],
        [3200, 'Multiplicação sempre igual = <b>inversamente proporcional</b>. Um dobra, o outro cai pela metade.', a => por(a.conta, { html: N('60 × 4 = 120 × 2 = 240', 'au-medio au-certo-txt') })]
      ]
    },
    taxi: {
      montar(p) {
        const barra = (km, x) => {
          const el = ator(p, `<div class="au-taxi"><i class="au-km" style="height:${km * 16}px">${km > 1 ? km + ' × 2' : '2'}</i><i class="au-fixa">5</i></div>`, x, 80);
          el.style.transform = 'translate(-50%, -100%)';
          return por(el, { o: 0 });
        };
        const a = { b: [[1, 22], [2, 50], [4, 78]].map(([km, x]) => barra(km, x)) };
        a.r = [['1 km: R$ 7', 22], ['2 km: R$ 9', 50], ['4 km: R$ 13', 78]].map(([t, x]) => por(ator(p, N(t, 'au-pequeno'), x, 92), { o: 0 }));
        a.balao = por(ator(p, '<span class="au-balao">taxa fixa: R$ 5</span>', 50, 10), { o: 0 });
        return a;
      },
      passos: [
        [2600, 'Corrida: <b>R$ 5 de taxa fixa</b> (cinza) + <b>R$ 2 por km</b> (azul). 1 km custa <b>R$ 7</b>.', a => { por(a.b[0], { o: 1 }); por(a.r[0], { o: 1 }); por(a.balao, { o: 1 }); }],
        [2800, '2 km custam <b>R$ 9</b>, e não R$ 14. A parte cinza não dobrou.', a => { por(a.b[1], { o: 1 }); por(a.r[1], { o: 1 }); }],
        [3200, '4 km: R$ 13. Preço ÷ km muda a cada linha: <b>não é proporcional</b>, por causa da taxa fixa.', a => { por(a.b[2], { o: 1 }); por(a.r[2], { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
