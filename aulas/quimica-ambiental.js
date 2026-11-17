aulasMM.aulas['quimica-ambiental'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;

  // ---------- escala de pH da chuva ----------
  const COR_PH = ['#d7263d', '#e8492f', '#f06a2a', '#f59b2b', '#f4c430', '#c9d23a', '#7fc04a', '#3fae6a', '#2f9e9e', '#3f87c9', '#4f6fc9', '#5f58b9', '#6f45a9', '#7a3594', '#6a2a7a'];
  function chuva() {
    const pol = Number($('pol').value), ph = Math.round((5.6 - pol * 0.18) * 10) / 10;
    $('o-pol').textContent = ['nenhum', 'pouco', 'pouco', 'médio', 'médio', 'muito', 'muito', 'muito', 'demais', 'demais', 'demais'][pol];
    const X = v => v / 14 * 100;
    $('escala').innerHTML = `<div class="au-faixa-ph">${COR_PH.map((c, k) => `<i style="background:${c}"><small>${k}</small></i>`).join('')}</div>
      <div class="au-marca-ph" style="left:${X(ph)}%"><b>🌧️ ${br(ph, 1)}</b></div>
      <div class="au-marca-ph au-ref" style="left:${X(7)}%"><span>água pura 7</span></div>
      <div class="au-marca-ph au-ref" style="left:${X(3)}%"><span>vinagre ≈ 3</span></div>`;
    $('escala').setAttribute('aria-label', `pH da chuva ${br(ph, 1)}`);
    const vezes = Math.round(10 ** (5.6 - ph));
    $('recado').textContent = pol === 0 ? 'Chuva sem poluição: pH ≈ 5,6, um pouco ácida por causa do CO₂ do ar. Isso é normal.'
      : `Com SO₂ e NOₓ no ar, a chuva cai para pH ${br(ph, 1)}. ${vezes > 1 ? `Isso é cerca de ${vezes} vezes mais ácido que a chuva normal: cada ponto a menos no pH é 10 vezes mais ácido.` : ''} Abaixo de 5,6 já é chuva ácida.`;
  }
  $('pol').addEventListener('input', chuva);
  chuva();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const mol = (t, c) => `<span class="au-molecula" style="background:${c}">${t}</span>`;
  const ROTEIROS = {
    marmore: {
      montar(p) {
        const a = { est: ator(p, '<span style="font-size:52px">🗿</span>', 50, 58), base: ator(p, '<span class="au-pedestal">CaCO₃ (mármore)</span>', 50, 86) };
        a.g = [36, 50, 64].map(x => por(ator(p, mol('H₂SO₄', '#c94b4b'), x, 8), { o: 0 }));
        a.co2 = [42, 58].map(x => por(ator(p, mol('CO₂', '#7d7d84'), x, 50), { o: 0 }));
        a.t = ator(p, N('', 'au-pequeno'), 50, 10);
        return a;
      },
      passos: [
        [2400, 'Uma estátua de <b>mármore</b>, feita de carbonato de cálcio (CaCO₃).'],
        [2800, 'A chuva ácida traz <b>ácido sulfúrico</b>.', a => a.g.forEach((g, k) => por(g, { o: 1, y: 44, atraso: k * 250 }))],
        [3200, 'O ácido reage com o carbonato e solta <b>CO₂</b>: a pedra vai sendo dissolvida, e a estátua perde os detalhes.', a => {
          a.g.forEach(g => por(g, { o: 0 })); a.co2.forEach(c => por(c, { o: 1, y: 34 })); por(a.est, { o: .55 }); por(a.t, { html: N('CaCO₃ + H₂SO₄ → CaSO₄ + H₂O + CO₂', 'au-pequeno') });
        }]
      ]
    },
    ozonio: {
      montar(p) {
        const a = { o3: [18, 38, 58, 78].map((x, k) => ator(p, mol('O₃', '#62a8ea'), x, 30 + (k % 2) * 22)), cl: ator(p, mol('Cl', '#7fd17f'), 6, 80) };
        a.t = ator(p, N('', 'au-pequeno'), 50, 92);
        return a;
      },
      passos: (() => {
        const ataque = (k, txt) => [1900, txt, a => { por(a.cl, { x: [18, 38, 58, 78][k], y: 30 + (k % 2) * 22 }); setTimeout(() => por(a.o3[k], { html: mol('O₂', '#9aa6b2'), s: .85 }), 650); }];
        return [
          [2200, 'A luz UV solta um átomo de <b>cloro</b> de uma molécula de CFC.'],
          ataque(0, 'O cloro quebra um <b>O₃</b>, que vira O₂ (e o O₂ não filtra a UV)…'),
          ataque(1, '…e sai <b>inteiro</b> da reação, pronto para atacar de novo.'),
          ataque(2, 'Outro ozônio destruído…'),
          [2800, 'Um único átomo de cloro destrói <b>milhares</b> de moléculas de ozônio.', a => { por(a.cl, { x: 78, y: 52 }); setTimeout(() => por(a.o3[3], { html: mol('O₂', '#9aa6b2'), s: .85 }), 650); por(a.t, { html: N('o cloro age como catalisador', 'au-pequeno au-errado-txt') }); }]
        ];
      })()
    },
    dbo: {
      montar(p) {
        const coluna = (x, rot) => ({ o2: ator(p, '', x, 70, 'au-barra-vert'), r: ator(p, N(rot, 'au-pequeno'), x, 92) });
        const a = { limpo: coluna(30, 'nascente'), sujo: coluna(70, 'perto do esgoto') };
        a.limpo.o2.style.cssText += ';top:84%;transform:translate(-50%,-100%);height:60%;background:#62a8ea';
        a.sujo.o2.style.cssText += ';top:84%;transform:translate(-50%,-100%);height:60%;background:#62a8ea';
        a.t = ator(p, N('oxigênio dissolvido', 'au-pequeno au-cor-d'), 50, 10);
        a.lixo = por(ator(p, '<span style="font-size:26px">💩🦠</span>', 88, 40), { o: 0 });
        return a;
      },
      passos: [
        [2400, 'Dois trechos do rio, com o mesmo oxigênio dissolvido no começo.'],
        [2800, 'Perto do esgoto há muita <b>matéria orgânica</b>, e as bactérias se multiplicam para decompô-la.', a => por(a.lixo, { o: 1 })],
        [3200, 'Elas gastam o oxigênio: a <b>DBO é alta</b> e sobra pouco O₂ para os peixes. Na nascente, DBO baixa, oxigênio sobrando.', a => { a.sujo.o2.style.height = '12%'; a.sujo.o2.style.background = '#c94b4b'; }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
