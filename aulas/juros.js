aulasMM.aulas['juros'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const reais = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

  // ---------- simulador ----------
  const C = 1000;
  function simular() {
    const i = Number($('taxa').value) / 100, n = Number($('meses').value);
    $('o-taxa').textContent = Math.round(i * 100) + '%'; $('o-meses').textContent = n;
    const simples = m => C * (1 + i * m), compostos = m => C * (1 + i) ** m;
    const maxY = compostos(n), X = m => 40 + m / n * 266, Y = v => 150 - (v - 0) / maxY * 132;
    const pts = f => Array.from({ length: n + 1 }, (_, m) => `${X(m)},${Y(f(m))}`).join(' ');
    $('grafico').innerHTML = `<line x1="40" y1="150" x2="306" y2="150" stroke="currentColor" opacity=".5"/><line x1="40" y1="150" x2="40" y2="14" stroke="currentColor" opacity=".5"/>
      <polyline points="${pts(simples)}" fill="none" stroke="#62a8ea" stroke-width="2.5"/>
      <polyline points="${pts(compostos)}" fill="none" stroke="#e9b949" stroke-width="2.5"/>
      <circle cx="${X(n)}" cy="${Y(simples(n))}" r="4" fill="#62a8ea"/><circle cx="${X(n)}" cy="${Y(compostos(n))}" r="4" fill="#e9b949"/>
      <line x1="40" y1="${Y(C)}" x2="306" y2="${Y(C)}" stroke="currentColor" stroke-dasharray="3 4" opacity=".4"/>
      <text x="36" y="${Y(C) + 4}" text-anchor="end">1 mil</text><text x="306" y="168" text-anchor="end">${n} ${n === 1 ? 'mês' : 'meses'}</text><text x="44" y="12">dívida (R$)</text>`;
    $('simples').textContent = reais(simples(n)); $('compostos').textContent = reais(compostos(n));
    const dif = compostos(n) - simples(n);
    $('recado').textContent = `Simples: ${Math.round(i * 100)}% de R$ 1.000 = ${reais(C * i)} todo mês, em linha reta. Compostos: os juros de cada mês incidem sobre a dívida já crescida; depois de ${n} ${n === 1 ? 'mês' : 'meses'}, a diferença é de ${reais(dif)}.`
      + (n === 1 ? ' No 1º mês os dois dão igual: a diferença começa no 2º.' : '');
  }
  for (const id of ['taxa', 'meses']) $(id).addEventListener('input', simular);
  simular();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  // Coluna empilhada: a dívida inicial embaixo e os juros de cada mês por cima.
  const coluna = (p, x, partes) => {
    const el = ator(p, `<div class="au-coluna-juros">${partes.map(([h, cls, t]) => `<i class="${cls}" style="height:${h}px">${t}</i>`).join('')}</div>`, x, 84);
    el.style.transform = 'translate(-50%, -100%)';
    return por(el, { o: 0 });
  };
  const ROTEIROS = {
    simples: {
      montar(p) {
        const a = { c: [0, 1, 2, 3].map(m => coluna(p, 16 + m * 23, [...Array(m)].map(() => [12, 'au-j1', '+100']).reverse().concat([[60, 'au-base', '1000']]))) };
        a.r = ['1 000', '1 100', '1 200', '1 300'].map((t, m) => por(ator(p, N(t, 'au-pequeno'), 16 + m * 23, 92), { o: 0 }));
        return a;
      },
      passos: [
        [2200, 'Dívida de <b>R$ 1 000</b>, juros simples de <b>10% ao mês</b>.', a => { por(a.c[0], { o: 1 }); por(a.r[0], { o: 1 }); }],
        [2200, 'Mês 1: 10% de 1 000 = <b>+100</b>.', a => { por(a.c[1], { o: 1 }); por(a.r[1], { o: 1 }); }],
        [2200, 'Mês 2: de novo 10% de <b>1 000</b> = +100.', a => { por(a.c[2], { o: 1 }); por(a.r[2], { o: 1 }); }],
        [3000, 'Mês 3: +100. Os juros são <b>sempre iguais</b>: R$ 1 300.', a => { por(a.c[3], { o: 1 }); por(a.r[3], { o: 1 }); }]
      ]
    },
    compostos: {
      montar(p) {
        const juros = [[12, 'au-j1', '+100'], [13, 'au-j2', '+110'], [15, 'au-j3', '+121']];
        const a = { c: [0, 1, 2, 3].map(m => coluna(p, 16 + m * 23, juros.slice(0, m).reverse().concat([[60, 'au-base', '1000']]))) };
        a.r = ['1 000', '1 100', '1 210', '1 331'].map((t, m) => por(ator(p, N(t, 'au-pequeno'), 16 + m * 23, 92), { o: 0 }));
        return a;
      },
      passos: [
        [2200, 'A mesma dívida, agora com juros <b>compostos</b> de 10% ao mês.', a => { por(a.c[0], { o: 1 }); por(a.r[0], { o: 1 }); }],
        [2400, 'Mês 1: 10% de 1 000 = <b>+100</b>. Deve 1 100.', a => { por(a.c[1], { o: 1 }); por(a.r[1], { o: 1 }); }],
        [2600, 'Mês 2: 10% de <b>1 100</b> = <b>+110</b>. Os juros do mês 1 também rendem juros.', a => { por(a.c[2], { o: 1 }); por(a.r[2], { o: 1 }); }],
        [3200, 'Mês 3: 10% de 1 210 = <b>+121</b>. Deve <b>1 331</b>. Cada mês cresce mais que o anterior.', a => { por(a.c[3], { o: 1 }); por(a.r[3], { o: 1 }); }]
      ]
    },
    avista: {
      montar(p) {
        const parc = Array.from({ length: 10 }, () => [9, 'au-j1', '100']);
        const a = { p: coluna(p, 30, parc), v: coluna(p, 70, [[81, 'au-base', 'R$ 900']]) };
        a.t1 = por(ator(p, N('10 × 100 = R$ 1 000', 'au-pequeno'), 30, 92), { o: 0 }); a.t2 = por(ator(p, N('à vista R$ 900', 'au-pequeno'), 70, 92), { o: 0 });
        a.dif = por(ator(p, '<span class="au-balao" style="background:var(--errado);color:#fff">R$ 100 de juros escondidos</span>', 50, 12), { o: 0 });
        return a;
      },
      passos: [
        [2600, 'Parcelado "sem juros": <b>10 × R$ 100 = R$ 1 000</b>.', a => { por(a.p, { o: 1 }); por(a.t1, { o: 1 }); }],
        [2600, 'À vista: <b>R$ 900</b>.', a => { por(a.v, { o: 1 }); por(a.t2, { o: 1 }); }],
        [3200, 'Quem parcela paga <b>R$ 100 a mais</b> pelo mesmo produto. O "sem juros" tinha juros embutidos.', a => por(a.dif, { o: 1 })]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
