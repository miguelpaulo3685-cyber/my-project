aulasMM.aulas['cadeias-alimentares'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);

  // ---------- teia do campo ----------
  const SP = {
    capim: { nome: 'Capim', e: '🌾', x: 160, y: 205, papel: 'produtor' },
    gafanhoto: { nome: 'Gafanhoto', e: '🦗', x: 70, y: 150, papel: 'consumidor primário' },
    rato: { nome: 'Rato', e: '🐀', x: 250, y: 150, papel: 'consumidor primário' },
    sapo: { nome: 'Sapo', e: '🐸', x: 70, y: 90, papel: 'consumidor secundário' },
    cobra: { nome: 'Cobra', e: '🐍', x: 160, y: 70, papel: 'consumidor secundário ou terciário' },
    gaviao: { nome: 'Gavião', e: '🦅', x: 250, y: 25, papel: 'consumidor do topo' },
    fungos: { nome: 'Fungos e bactérias', e: '🍄', x: 25, y: 205, papel: 'decompositores' }
  };
  // [quem é comido, quem come]
  const SETAS = [['capim', 'gafanhoto'], ['capim', 'rato'], ['gafanhoto', 'sapo'], ['sapo', 'cobra'], ['rato', 'cobra'], ['rato', 'gaviao'], ['cobra', 'gaviao']];
  // O que acontece ao tirar cada espécie: [sobem, descem, explicação]
  const EFEITO = {
    capim: [[], ['gafanhoto', 'rato', 'sapo', 'cobra', 'gaviao'], 'Sem o produtor, nenhuma energia do Sol entra na teia. Todos os consumidores perdem a base e a teia desaba.'],
    gafanhoto: [['capim'], ['sapo'], 'Os sapos perdem o alimento e diminuem. O capim, com menos quem o coma, cresce mais. A cobra passa a depender mais do rato.'],
    rato: [['capim'], ['cobra', 'gaviao'], 'Cobra e gavião perdem uma presa importante e diminuem. O capim fica com um comedor a menos.'],
    sapo: [['gafanhoto'], ['cobra', 'capim'], 'Sem predador, os gafanhotos se multiplicam e comem mais capim. A cobra só tem o rato para comer.'],
    cobra: [['sapo', 'rato'], ['capim'], 'Sapos e ratos aumentam sem a cobra. Mais ratos comendo capim: o capim diminui. O gavião ainda tem ratos.'],
    gaviao: [['rato', 'cobra'], ['capim'], 'Sem o predador do topo, ratos e cobras aumentam. Mais ratos, menos capim. Um predador ajuda a controlar a teia toda.'],
    fungos: [[], ['capim'], 'Sem decompositores, folhas e corpos mortos não viram nutriente. O solo empobrece e o capim cresce menos: a matéria para de circular.']
  };
  let tirado = null;
  function teia() {
    const [sobe, desce, txt] = tirado ? EFEITO[tirado] : [[], [], ''];
    const seta = ([a, b]) => {
      const A = SP[a], B = SP[b], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), r = 18;
      const x1 = A.x + dx / d * r, y1 = A.y + dy / d * r, x2 = B.x - dx / d * r, y2 = B.y - dy / d * r;
      const fora = tirado && (a === tirado || b === tirado);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${fora ? 'var(--errado)' : '#62a8ea'}" stroke-width="2" opacity="${fora ? .25 : .9}" ${fora ? 'stroke-dasharray="4 4"' : ''} marker-end="url(#au-ponta)"/>`;
    };
    $('teia').innerHTML = `<defs><marker id="au-ponta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#62a8ea"/></marker></defs>
      ${SETAS.map(seta).join('')}
      <path d="M45 205 Q 90 228 140 208" fill="none" stroke="#a07a4a" stroke-dasharray="3 4" stroke-width="1.5"/>
      ${Object.entries(SP).map(([id, s]) => {
        const cor = id === tirado ? 'var(--errado)' : sobe.includes(id) ? 'var(--certo)' : desce.includes(id) ? '#e9b949' : 'var(--borda)';
        const sinal = sobe.includes(id) ? '▲' : desce.includes(id) ? '▼' : '';
        return `<g opacity="${id === tirado ? .35 : 1}"><circle cx="${s.x}" cy="${s.y}" r="17" fill="var(--superficie)" stroke="${cor}" stroke-width="3"/>
          <text x="${s.x}" y="${s.y + 6}" text-anchor="middle" style="font-size:17px">${s.e}</text>
          ${sinal ? `<text x="${s.x + 19}" y="${s.y - 10}" style="fill:${cor};font-size:12px;font-weight:800">${sinal}</text>` : ''}</g>`;
      }).join('')}`;
    $('especies').innerHTML = Object.entries(SP).map(([id, s]) => `<button type="button" aria-pressed="${id === tirado}" data-sp="${id}">${s.e} ${s.nome}</button>`).join('')
      + (tirado ? '<button type="button" data-sp="">↺ Devolver</button>' : '');
    $('recado').innerHTML = tirado
      ? `<b>Sem ${SP[tirado].nome.toLowerCase()}</b> (${SP[tirado].papel}): ${txt} <span style="color:var(--certo)">▲ aumenta</span> · <span style="color:#e9b949">▼ diminui</span>`
      : 'As setas apontam para quem come, no sentido em que a energia anda. Toque numa espécie para tirá-la e ver quem sobe e quem desce.';
  }
  $('especies').addEventListener('click', e => { const b = e.target.closest('[data-sp]'); if (b) { tirado = b.dataset.sp || null; teia(); } });
  teia();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const E = (e, tam = 30) => `<span style="font-size:${tam}px">${e}</span>`;
  const ROTEIROS = {
    cadeia: {
      montar(p) {
        const seres = [['🌾', 'produtor'], ['🦗', 'consumidor primário'], ['🐸', 'consumidor secundário'], ['🐍', 'consumidor terciário']];
        const a = { s: seres.map(([e], k) => por(ator(p, E(e), 13 + k * 25, 40), { o: 0 })), r: seres.map(([, t], k) => por(ator(p, `<span class="au-rotulo-filme">${t}</span>`, 13 + k * 25, 64), { o: 0 })) };
        a.setas = [0, 1, 2].map(k => por(ator(p, N('→', 'au-medio au-cor-d'), 25.5 + k * 25, 40), { o: 0 }));
        a.sol = ator(p, E('☀️', 26), 13, 12);
        a.t = ator(p, N('', 'au-pequeno'), 50, 88);
        return a;
      },
      passos: [
        [2400, 'Tudo começa no <b>Sol</b>. O capim faz fotossíntese: é o <b>produtor</b>.', a => { por(a.s[0], { o: 1 }); por(a.r[0], { o: 1 }); }],
        [2400, 'O gafanhoto come o capim: <b>consumidor primário</b>. A seta aponta para quem come.', a => { por(a.setas[0], { o: 1 }); por(a.s[1], { o: 1 }); por(a.r[1], { o: 1 }); }],
        [2400, 'O sapo come o gafanhoto: <b>consumidor secundário</b>.', a => { por(a.setas[1], { o: 1 }); por(a.s[2], { o: 1 }); por(a.r[2], { o: 1 }); }],
        [3000, 'A cobra come o sapo: <b>consumidor terciário</b>. As setas mostram o caminho da energia.', a => {
          por(a.setas[2], { o: 1 }); por(a.s[3], { o: 1 }); por(a.r[3], { o: 1 }); por(a.t, { html: N('a energia anda no sentido das setas →', 'au-pequeno au-cor-d') });
        }]
      ]
    },
    energia: {
      montar(p) {
        const niveis = [['🌾', '10 000 kcal', 84], ['🦗', '1 000 kcal', 62], ['🐸', '100 kcal', 40], ['🐍', '10 kcal', 18]];
        const a = { b: niveis.map(([e, v, y], k) => {
          const el = ator(p, `${e} ${v}`, 38, y, 'au-barra-filme');
          el.style.cssText += `;width:${[64, 40, 24, 14][k]}%;height:30px;line-height:30px;background:${['#2f9e6a', '#7fae3a', '#c9971d', '#c94b4b'][k]}`;
          return por(el, { o: k ? 0 : 1 });
        }) };
        a.calor = [0, 1, 2].map(k => por(ator(p, '<span class="au-balao" style="background:#e05252;color:#fff">🔥 90% vira calor</span>', 82, [73, 51, 29][k]), { o: 0 }));
        return a;
      },
      passos: [
        [2400, 'O capim guardou <b>10 000 kcal</b> de energia do Sol.'],
        [2800, 'Só uns <b>10%</b> chegam ao gafanhoto: <b>1 000 kcal</b>. O resto foi gasto para viver e saiu como calor.', a => { por(a.b[1], { o: 1 }); por(a.calor[0], { o: 1 }); }],
        [2600, 'No sapo, de novo 10%: <b>100 kcal</b>.', a => { por(a.b[2], { o: 1 }); por(a.calor[1], { o: 1 }); }],
        [3200, 'Na cobra, só <b>10 kcal</b>. A energia vai se perdendo e <b>não volta</b>: por isso as cadeias são curtas.', a => { por(a.b[3], { o: 1 }); por(a.calor[2], { o: 1 }); }]
      ]
    },
    piramides: {
      montar(p) {
        const nivel = (x, y, larg, cor, txt) => { const el = ator(p, txt, x, y, 'au-barra-filme'); el.style.cssText += `;width:${larg}%;height:26px;line-height:26px;background:${cor};font-size:11px`; return el; };
        const a = {
          n: [nivel(27, 76, 8, '#2f9e6a', '1 🌳'), nivel(27, 52, 40, '#7fae3a', '500 🐛'), nivel(27, 28, 18, '#c9971d', '20 🐦')],
          e: [nivel(75, 76, 42, '#2f9e6a', 'árvore'), nivel(75, 52, 22, '#7fae3a', 'insetos'), nivel(75, 28, 8, '#c9971d', '')]
        };
        a.t1 = ator(p, N('números', 'au-pequeno'), 27, 92); a.t2 = ator(p, N('energia', 'au-pequeno'), 75, 92);
        a.e.forEach(x => por(x, { o: 0 })); por(a.t2, { o: 0 });
        return a;
      },
      passos: [
        [2600, 'Uma única árvore alimenta <b>500 insetos</b>, que alimentam 20 pássaros.'],
        [2800, 'Contando indivíduos, a base é estreita: é a <b>pirâmide de números invertida</b>.'],
        [3400, 'Mas em <b>energia</b> a árvore tem muito mais que os insetos. A pirâmide de energia <b>nunca inverte</b>.', a => { a.e.forEach((x, k) => por(x, { o: 1, atraso: k * 300 })); por(a.t2, { o: 1 }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
