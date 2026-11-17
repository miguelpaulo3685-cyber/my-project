aulasMM.aulas['regra-de-tres'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  const num = v => br(v, Number.isInteger(v) ? 0 : 2);

  // ---------- montar a regra de três ----------
  // [enunciado, nome A, nome B, a1, b1, a2, inversa, unidade de A, unidade de B, pergunta de sentido]
  const PROBS = [
    ['3 kg de carne custam R$ 84. Quanto custam 5 kg?', 'Carne (kg)', 'Preço (R$)', 3, 84, 5, false, 'kg', 'reais', 'Mais carne, mais caro.'],
    ['Com 5 litros, um carro roda 60 km. Quantos km roda com 18 litros?', 'Combustível (litros)', 'Distância (km)', 5, 60, 18, false, 'litros', 'km', 'Mais combustível, mais distância.'],
    ['4 pedreiros fazem um muro em 12 dias. Em quantos dias 6 pedreiros fazem o mesmo muro?', 'Pedreiros', 'Dias', 4, 12, 6, true, 'pedreiros', 'dias', 'Mais pedreiros, menos dias.'],
    ['A 80 km/h, uma viagem dura 3 horas. Quanto dura a 120 km/h?', 'Velocidade (km/h)', 'Horas', 80, 3, 120, true, 'km/h', 'horas', 'Mais rápido, menos tempo.']
  ];
  let prob = 0, passo = 0;
  function desenhar() {
    const [enun, nA, nB, a1, b1, a2, inv, uA, uB, sentido] = PROBS[prob];
    const x = inv ? a1 * b1 / a2 : b1 * a2 / a1;
    $('enunciado').textContent = enun;
    $('tabela').innerHTML = `<div class="au-t3-cab"><b>${nA}</b><b>${nB}</b></div>
      <div class="au-t3-lin"><span>${num(a1)}</span><span>${num(b1)}</span></div>
      <div class="au-t3-lin"><span>${num(a2)}</span><span class="${passo >= 3 ? 'au-certo-txt' : 'au-x'}">${passo >= 3 ? num(x) : 'x'}</span></div>
      ${passo >= 1 ? `<i class="au-seta au-seta-a">↓</i><i class="au-seta au-seta-b ${inv ? 'au-sobe' : ''}">${inv ? '↑' : '↓'}</i>` : ''}`;
    const textos = [
      'Passo 1: as duas grandezas crescem juntas (direta) ou uma cresce e a outra diminui (inversa)? Toque em "Próximo passo".',
      `${inv ? 'Inversa' : 'Direta'}: ${sentido} ${inv ? 'As setas apontam para lados opostos.' : 'As setas apontam para o mesmo lado.'}`,
      inv ? `Passo 2, quanto vale 1: com 1 ${uA === 'km/h' ? 'km/h' : uA.replace(/s$/, '')}, seria ${num(a1)} × ${num(b1)} = ${num(a1 * b1)} ${uB}. Com ${num(a2)}, divida: ${num(a1 * b1)} ÷ ${num(a2)}.`
        : `Passo 2, quanto vale 1: ${num(b1)} ÷ ${num(a1)} = ${num(b1 / a1)} ${uB} para cada 1 ${uA.replace(/s$/, '')}. Para ${num(a2)}, multiplique: ${num(a2)} × ${num(b1 / a1)}.`,
      `Passo 3: x = ${num(x)} ${uB}. Faz sentido? ${sentido} ${inv ? (x < b1 ? 'Diminuiu, então está certo.' : '') : (x > b1 === a2 > a1 ? 'Está coerente.' : '')}`
    ];
    $('recado').textContent = textos[passo];
    $('passo').disabled = passo >= 3;
    raiz.querySelectorAll('[data-prob]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.prob) === prob)));
  }
  $('passo').addEventListener('click', () => { passo = Math.min(3, passo + 1); desenhar(); });
  $('recomecar').addEventListener('click', () => { passo = 0; desenhar(); });
  raiz.querySelectorAll('[data-prob]').forEach(b => b.addEventListener('click', () => { prob = Number(b.dataset.prob); passo = 0; desenhar(); }));
  desenhar();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    unidade: {
      montar(p) {
        const a = {
          l: [['3 kg', 'R$ 84', 20], ['1 kg', 'R$ 28', 50], ['5 kg', 'R$ 140', 80]].map(([k, r, y]) => [ator(p, N(k, 'au-medio'), 30, y), por(ator(p, N(r, 'au-medio'), 70, y), { o: y === 20 ? 1 : 0 })]),
          d: por(ator(p, N('÷ 3', 'au-pequeno au-cor-u'), 92, 35), { o: 0 }), m: por(ator(p, N('× 5', 'au-pequeno au-cor-u'), 92, 65), { o: 0 })
        };
        por(a.l[1][0], { o: 0 }); por(a.l[2][0], { o: 0 });
        return a;
      },
      passos: [
        [2400, '<b>3 kg</b> custam <b>R$ 84</b>.'],
        [2800, 'Quanto custa <b>1 kg</b>? Divida por 3: 84 ÷ 3 = <b>R$ 28</b>.', a => { por(a.l[1][0], { o: 1 }); por(a.l[1][1], { o: 1 }); por(a.d, { o: 1 }); }],
        [2800, 'Agora <b>5 kg</b> é só multiplicar: 5 × 28 = <b>R$ 140</b>.', a => { por(a.l[2][0], { o: 1 }); por(a.l[2][1], { o: 1, html: N('R$ 140', 'au-medio au-certo-txt') }); por(a.m, { o: 1 }); }]
      ]
    },
    cruz: {
      montar(p) {
        const a = { t: [['3', 30, 30], ['84', 64, 30], ['5', 30, 56], ['x', 64, 56]].map(([t, x, y]) => ator(p, N(t, 'au-medio'), x, y)) };
        a.s1 = por(ator(p, N('↓', 'au-medio au-cor-d'), 16, 43), { o: 0 }); a.s2 = por(ator(p, N('↓', 'au-medio au-cor-d'), 80, 43), { o: 0 });
        a.x1 = por(ator(p, '', 47, 43, 'au-cruz'), { o: 0 }); a.x2 = por(ator(p, '', 47, 43, 'au-cruz au-cruz2'), { o: 0 });
        a.c = ator(p, N('', 'au-medio'), 50, 86);
        return a;
      },
      passos: [
        [2200, 'Monte a tabela: kg numa coluna, reais na outra.'],
        [2600, 'Mais kg, mais reais: as <b>setas apontam para o mesmo lado</b>. É direta.', a => { por(a.s1, { o: 1 }); por(a.s2, { o: 1 }); }],
        [3000, 'Multiplique <b>em cruz</b>: 3 · x = 5 · 84.', a => { por(a.x1, { o: 1 }); por(a.x2, { o: 1 }); por(a.c, { html: N('3 · x = 5 · 84 = 420', 'au-medio') }); }],
        [3000, 'x = 420 ÷ 3 = <b>140</b>. O mesmo resultado do "quanto vale 1".', a => { por(a.t[3], { html: N('140', 'au-medio au-certo-txt') }); por(a.c, { html: N('x = 420 ÷ 3 = 140', 'au-medio au-certo-txt') }); }]
      ]
    },
    inversa: {
      montar(p) {
        const tijolos = n => `<div class="au-equipe">${'<span>👷</span>'.repeat(n)}</div>`;
        const a = { eq: ator(p, tijolos(4), 50, 24), t: ator(p, N('4 pedreiros · 12 dias', 'au-medio'), 50, 52), c: ator(p, N('', 'au-medio'), 50, 82) };
        a.tij = tijolos;
        return a;
      },
      passos: [
        [2400, '<b>4 pedreiros</b> fazem o muro em <b>12 dias</b>.'],
        [3000, 'Um pedreiro sozinho faria todo o trabalho: levaria <b>4 × 12 = 48 dias</b>.', a => { por(a.eq, { html: a.tij(1) }); por(a.t, { html: N('1 pedreiro · 48 dias', 'au-medio') }); }],
        [3000, 'Com <b>6 pedreiros</b>, divida o trabalho: 48 ÷ 6 = <b>8 dias</b>.', a => { por(a.eq, { html: a.tij(6) }); por(a.t, { html: N('6 pedreiros · 8 dias', 'au-medio au-certo-txt') }); }],
        [2800, 'Faz sentido? Mais pedreiros, <b>menos dias</b>. Sim.', a => por(a.c, { html: N('4 × 12 = 6 × 8 = 48', 'au-medio') })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
