aulasMM.aulas['decimais'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);

  // ---------- cofrinho (em centavos) ----------
  let centavos = 235, trocou = '';
  function cofre() {
    const r = Math.floor(centavos / 100), d = Math.floor(centavos / 10) % 10, c = centavos % 10;
    $('valor').innerHTML = `R$ <span class="au-cor-c">${r}</span>,<span class="au-cor-d">${d}</span><span class="au-cor-u">${c}</span>`;
    const col = (q, cls, nome, txt) => `<div class="au-col-cofre"><small>${nome}</small><div>${Array.from({ length: q }, () => `<i class="${cls}">${txt}</i>`).join('')}</div><b>${q}</b></div>`;
    $('cofre').innerHTML = col(r, 'au-real', 'inteiros (R$ 1)', '1') + '<span class="au-virgula-cofre">,</span>'
      + col(d, 'au-dez', 'décimos (10 ¢)', '10') + col(c, 'au-um', 'centésimos (1 ¢)', '1');
    $('recado').textContent = trocou || `R$ ${r},${d}${c}: ${r} ${r === 1 ? 'real' : 'reais'}, ${d} ${d === 1 ? 'moeda' : 'moedas'} de 10 centavos e ${c} de 1 centavo. Cada casa vale 10 vezes menos que a da esquerda.`;
    trocou = '';
  }
  raiz.querySelectorAll('[data-mais]').forEach(b => b.addEventListener('click', () => {
    const v = Number(b.dataset.mais), antes = centavos;
    centavos = Math.max(0, Math.min(999, centavos + v));
    if (v > 0 && Math.floor(antes / (v * 10)) !== Math.floor(centavos / (v * 10)) && v < 100)
      trocou = v === 1 ? 'Juntaram 10 moedas de 1 centavo: viraram 1 moeda de 10 centavos. É o "vai um" depois da vírgula.' : 'Juntaram 10 moedas de 10 centavos: viraram R$ 1 inteiro.';
    cofre();
  }));
  cofre();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const grade100 = (n, cor = 'au-on') => `<div class="au-grade-filme" style="grid-template-columns:repeat(10, var(--au-cel));--au-cel:9px;gap:2px">${Array.from({ length: 100 }, (_, k) => `<b class="${k < n ? cor : ''}"></b>`).join('')}</div>`;
  const xReta = (v, de, ate) => 8 + (v - de) / (ate - de) * 84;
  const ROTEIROS = {
    casas: {
      montar(p) {
        const a = { d: [['2', 'au-cor-c', 30], [',', '', 40], ['3', 'au-cor-d', 50], ['5', 'au-cor-u', 72]].map(([t, c, x]) => ator(p, N(t, c), 50 + (x - 50) * .45, 30)) };
        a.nomes = [['inteiros', 22], ['décimos', 50], ['centésimos', 78]].map(([t, x]) => por(ator(p, N(t, 'au-pequeno'), x, 12), { o: 0 }));
        a.din = [];
        for (let k = 0; k < 2; k++) a.din.push(por(ator(p, '<i class="au-real">1</i>', 18 + k * 8, 56), { o: 0 }));
        for (let k = 0; k < 3; k++) a.din.push(por(ator(p, '<i class="au-dez">10</i>', 44 + k * 6, 56), { o: 0 }));
        for (let k = 0; k < 5; k++) a.din.push(por(ator(p, '<i class="au-um">1</i>', 73 + (k % 3) * 5, 54 + Math.floor(k / 3) * 9), { o: 0 }));
        a.conta = por(ator(p, N('2 + 0,3 + 0,05 = 2,35', 'au-medio'), 50, 88), { o: 0 });
        return a;
      },
      passos: [
        [2200, 'O número <b>2,35</b>.'],
        [2800, 'Abra as casas: <b>2 inteiros</b>, <b>3 décimos</b> e <b>5 centésimos</b>.', a => {
          [[22], [36], [50], [78]].forEach(([x], k) => por(a.d[k], { x })); a.nomes.forEach(n => por(n, { o: 1 }));
        }],
        [3000, 'Em dinheiro: 2 reais, 3 moedas de 10 centavos e 5 de 1 centavo.', a => a.din.forEach((m, k) => por(m, { o: 1, atraso: k * 80 }))],
        [3000, '<b>2,35 = 2 + 0,3 + 0,05</b>. Igual ao 247 = 200 + 40 + 7 da soma.', a => por(a.conta, { o: 1 })]
      ]
    },
    lupa: {
      montar(p) {
        const a = { r1: ator(p, '', 50, 30, 'au-reta'), r2: por(ator(p, '', 50, 72, 'au-reta'), { o: 0 }) };
        a.t1 = Array.from({ length: 11 }, (_, k) => ator(p, `<span class="au-tique"></span>${N(k === 0 ? '0' : k === 10 ? '1' : '0,' + k, 'au-pequeno')}`, xReta(k, 0, 10), 37, 'au-marca-reta'));
        a.t2 = Array.from({ length: 11 }, (_, k) => por(ator(p, `<span class="au-tique"></span>${k % 5 === 0 ? N(['0,30', '0,35', '0,40'][k / 5], 'au-pequeno') : ''}`, xReta(k, 0, 10), 79, 'au-marca-reta'), { o: 0 }));
        a.janela = por(ator(p, '', (xReta(3, 0, 10) + xReta(4, 0, 10)) / 2, 30, 'au-janela'), { o: 0 });
        a.ponto = por(ator(p, '<i class="au-ponto"></i>', xReta(5, 0, 10), 72), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'A reta de 0 a 1 dividida em <b>10 décimos</b>. Onde fica <b>0,35</b>?'],
        [2600, 'Fica entre <b>0,3 e 0,4</b>. Ponha uma lupa nesse pedaço.', a => por(a.janela, { o: 1 })],
        [3000, 'Aumentado, esse pedaço também se divide em <b>10 centésimos</b>: de 0,30 a 0,40.', a => { por(a.r2, { o: 1 }); a.t2.forEach((t, k) => por(t, { o: 1, atraso: k * 60 })); }],
        [2800, '<b>0,35</b> fica bem no meio. Cada casa depois da vírgula é uma lupa 10 vezes mais forte.', a => por(a.ponto, { o: 1 })]
      ]
    },
    comparar: {
      montar(p) {
        const a = { g1: ator(p, grade100(0, 'au-on'), 27, 44), g2: ator(p, grade100(0, 'au-on2'), 73, 44) };
        a.t1 = ator(p, N('0,5', 'au-medio'), 27, 88); a.t2 = ator(p, N('0,45', 'au-medio'), 73, 88);
        a.maior = por(ator(p, N('>', 'au-medio au-certo-txt'), 50, 88), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Cada quadrado tem <b>100 quadradinhos</b>: é o inteiro. Vamos pintar 0,5 e 0,45.'],
        [3000, '<b>0,5 = 0,50</b>: 50 quadradinhos. <b>0,45</b>: 45 quadradinhos.', a => {
          a.g1.querySelectorAll('b').forEach((c, k) => { if (k < 50) c.className = 'au-on'; });
          a.g2.querySelectorAll('b').forEach((c, k) => { if (k < 45) c.className = 'au-on2'; });
          por(a.t1, { html: N('0,50', 'au-medio') });
        }],
        [3000, 'Completando com zero fica claro: <b>0,50 &gt; 0,45</b>.', a => por(a.maior, { o: 1 })]
      ]
    },
    virgula: {
      montar(p) {
        const casas = ['0', '0', '3', '7', '5', '0'];
        const xs = k => 30 + k * 8;
        const a = { dig: casas.map((t, k) => ator(p, N(t, k < 2 || k === 5 ? 'au-apagado' : ''), xs(k), 40)), xs };
        a.dig[1].style.opacity = 0; a.dig[0].style.opacity = 0; a.dig[5].style.opacity = 0;
        a.v = ator(p, N(','), xs(2) + 4, 42);
        a.t = ator(p, N('3,75', 'au-medio au-cor-d'), 50, 80);
        return a;
      },
      passos: [
        [2200, 'O número <b>3,75</b>. Repare na vírgula.'],
        [2800, '<b>× 10</b>: a vírgula anda <b>uma casa</b> para a direita. Fica <b>37,5</b>.', a => { por(a.v, { x: a.xs(3) + 4 }); por(a.t, { html: N('3,75 × 10 = 37,5', 'au-medio au-cor-d') }); }],
        [2800, '<b>× 100</b> (a partir de 3,75): duas casas. Fica <b>375</b>.', a => { por(a.v, { x: a.xs(4) + 4, o: 0 }); por(a.t, { html: N('3,75 × 100 = 375', 'au-medio au-cor-d') }); }],
        [3000, '<b>÷ 10</b>: a vírgula volta para a esquerda. 3,75 ÷ 10 = <b>0,375</b>.', a => {
          por(a.dig[1], { o: 1 }); por(a.v, { x: a.xs(1) + 4, o: 1 }); por(a.t, { html: N('3,75 ÷ 10 = 0,375', 'au-medio au-cor-u') });
        }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
