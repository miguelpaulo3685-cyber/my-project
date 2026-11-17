aulasMM.aulas['tabela-periodica'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  const br = aulasMM.br;
  // [símbolo, nome, período, coluna na tabela compacta (1, 2, 13..18 → 1..8), raio (pm), eletronegatividade, família]
  const EL = [
    ['H', 'Hidrogênio', 1, 1, 53, 2.20, 'não metal'], ['He', 'Hélio', 1, 8, 31, null, 'gás nobre'],
    ['Li', 'Lítio', 2, 1, 167, 0.98, 'metal alcalino'], ['Be', 'Berílio', 2, 2, 112, 1.57, 'alcalinoterroso'], ['B', 'Boro', 2, 3, 87, 2.04, 'semimetal'], ['C', 'Carbono', 2, 4, 67, 2.55, 'não metal'],
    ['N', 'Nitrogênio', 2, 5, 56, 3.04, 'não metal'], ['O', 'Oxigênio', 2, 6, 48, 3.44, 'calcogênio'], ['F', 'Flúor', 2, 7, 42, 3.98, 'halogênio'], ['Ne', 'Neônio', 2, 8, 38, null, 'gás nobre'],
    ['Na', 'Sódio', 3, 1, 190, 0.93, 'metal alcalino'], ['Mg', 'Magnésio', 3, 2, 145, 1.31, 'alcalinoterroso'], ['Al', 'Alumínio', 3, 3, 118, 1.61, 'metal'], ['Si', 'Silício', 3, 4, 111, 1.90, 'semimetal'],
    ['P', 'Fósforo', 3, 5, 98, 2.19, 'não metal'], ['S', 'Enxofre', 3, 6, 88, 2.58, 'calcogênio'], ['Cl', 'Cloro', 3, 7, 79, 3.16, 'halogênio'], ['Ar', 'Argônio', 3, 8, 71, null, 'gás nobre'],
    ['K', 'Potássio', 4, 1, 243, 0.82, 'metal alcalino'], ['Ca', 'Cálcio', 4, 2, 194, 1.00, 'alcalinoterroso']
  ];
  const COR_FAM = { 'metal alcalino': '#c96b4b', 'alcalinoterroso': '#e9b949', 'metal': '#9aa6b2', 'semimetal': '#7fae3a', 'não metal': '#62a8ea', 'calcogênio': '#4fb3bf', 'halogênio': '#8a55c9', 'gás nobre': '#e080b0' };
  const GRUPO = [1, 2, 13, 14, 15, 16, 17, 18];
  let prop = 'familia', escolhido = 'Na';
  function tabela() {
    const cab = GRUPO.map(g => `<i class="au-cab-g">${g}</i>`).join('');
    const cel = (r, c) => {
      const e = EL.find(x => x[2] === r && x[3] === c);
      if (!e) return '<span></span>';
      const [s, , , , raio, en, fam] = e;
      let estilo = '', extra = '';
      if (prop === 'familia') estilo = `background:${COR_FAM[fam]};--tx:#111`;
      if (prop === 'raio') extra = `<em style="width:${raio / 243 * 100}%"></em>`;
      if (prop === 'en') { const l = 78 - (en || 0) / 4 * 52; estilo = en ? `background:hsl(270 60% ${l}%);--tx:${l < 52 ? '#fff' : '#111'}` : 'background:var(--superficie-2)'; }
      return `<button type="button" data-el="${s}" class="${s === escolhido ? 'au-sel' : ''}" style="${estilo}">${extra}<b>${s}</b></button>`;
    };
    let html = `<i></i>${cab}`;
    for (let r = 1; r <= 4; r++) { html += `<i class="au-cab-g">${r}</i>`; for (let c = 1; c <= 8; c++) html += cel(r, c); }
    $('tabela').innerHTML = html;
    const [s, nome, per, , raio, en, fam] = EL.find(x => x[0] === escolhido);
    $('recado').innerHTML = `<b>${nome} (${s})</b>: ${per}º período (${per} camada${per > 1 ? 's' : ''}), ${fam}. Raio ≈ ${raio} pm. Eletronegatividade: ${en ? br(en, 2) : 'gases nobres quase não fazem ligação'}.<br>`
      + (prop === 'raio' ? 'O círculo mostra o tamanho: cresce para <b>baixo</b> e para a <b>esquerda</b>. O potássio é o maior; o hélio, o menor.'
        : prop === 'en' ? 'Quanto mais escura, mais forte puxa elétrons: cresce para <b>cima</b> e para a <b>direita</b>. O flúor é o campeão.'
        : 'Cada cor é uma família: elementos da mesma coluna têm o mesmo número de elétrons na última camada e se comportam parecido.');
    raiz.querySelectorAll('[data-prop]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.prop === prop)));
  }
  $('tabela').addEventListener('click', e => { const b = e.target.closest('[data-el]'); if (b) { escolhido = b.dataset.el; tabela(); } });
  raiz.querySelectorAll('[data-prop]').forEach(b => b.addEventListener('click', () => { prop = b.dataset.prop; tabela(); }));
  tabela();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const grade = (cor = () => '') => `<div class="au-grade-tab">${Array.from({ length: 32 }, (_, k) => `<i style="${cor(Math.floor(k / 8), k % 8)}"></i>`).join('')}</div>`;
  const ROTEIROS = {
    mapa: {
      montar(p) {
        const a = { g: ator(p, grade(), 50, 46) };
        a.t = ator(p, N('', 'au-pequeno'), 50, 92);
        return a;
      },
      passos: [
        [2600, 'Cada <b>linha</b> é um período: diz quantas <b>camadas</b> o átomo tem.', a => { a.g.innerHTML = grade((r) => `background:hsl(${210 + r * 25} 50% 50%)`); por(a.t, { html: N('linhas = número de camadas', 'au-pequeno au-cor-d') }); }],
        [2800, 'Cada <b>coluna</b> é uma família: mesmo número de elétrons na <b>última camada</b>.', a => { a.g.innerHTML = grade((r, c) => `background:hsl(${c * 45} 55% 55%)`); por(a.t, { html: N('colunas = elétrons na última camada', 'au-pequeno au-cor-u') }); }],
        [3000, 'Por isso sódio e potássio (mesma coluna) reagem do mesmo jeito: os dois perdem 1 elétron.', a => { a.g.innerHTML = grade((r, c) => c === 0 && r > 0 ? 'background:#c96b4b' : ''); por(a.t, { html: N('família 1: Li, Na, K', 'au-pequeno') }); }]
      ]
    },
    raio: {
      montar(p) {
        const a = { b: [] };
        [['Li', 167], ['C', 67], ['F', 42]].forEach(([s, r], k) => a.b.push(ator(p, `<span class="au-bolha-el" style="width:${r / 4}px;height:${r / 4}px">${s}</span>`, 24 + k * 26, 30)));
        [['Na', 190], ['K', 243]].forEach(([s, r], k) => a.b.push(por(ator(p, `<span class="au-bolha-el" style="width:${r / 4}px;height:${r / 4}px">${s}</span>`, 24, 58 + k * 26), { o: 0 })));
        a.t = ator(p, N('', 'au-pequeno'), 74, 80);
        return a;
      },
      passos: [
        [2800, 'No 2º período, da esquerda para a direita: Li, C, F. Mesma quantidade de camadas, mais prótons puxando: o átomo <b>encolhe</b>.', a => por(a.t, { html: N('→ menor', 'au-medio au-cor-u') })],
        [3000, 'Descendo a família 1: Li, Na, K. Cada período acrescenta uma camada: o átomo <b>cresce</b>.', a => { a.b.slice(3).forEach((b, k) => por(b, { o: 1, atraso: k * 400 })); por(a.t, { html: N('↓ maior', 'au-medio au-cor-d') }); }],
        [2600, 'Resumo: o raio cresce para <b>baixo</b> e para a <b>esquerda</b>.', a => por(a.t, { html: N('raio: ↙', 'au-medio au-certo-txt') })]
      ]
    },
    en: {
      montar(p) {
        const a = { g: ator(p, grade((r, c) => c === 7 ? 'opacity:.25' : ''), 50, 46) };
        a.seta = por(ator(p, '<span class="au-seta-grande">↗</span>', 50, 46), { o: 0 });
        a.f = por(ator(p, '<span class="au-balao">F: campeão</span>', 78, 14), { o: 0 });
        a.t = ator(p, N('', 'au-pequeno'), 50, 92);
        return a;
      },
      passos: [
        [2600, 'Eletronegatividade é a força para <b>puxar elétrons</b>. Os gases nobres (última coluna) ficam de fora.'],
        [3000, 'Átomos pequenos e com muitos prótons puxam mais: cresce para <b>cima</b> e para a <b>direita</b>.', a => {
          a.g.innerHTML = grade((r, c) => c === 7 ? 'opacity:.25' : `background:hsl(270 60% ${78 - (c / 6) * 30 - (3 - r) * 10}%)`); por(a.seta, { o: 1 });
        }],
        [2800, 'O <b>flúor</b>, lá em cima à direita, é o mais eletronegativo de todos. O raio é o contrário: ↙.', a => { por(a.f, { o: 1 }); por(a.t, { html: N('eletronegatividade: ↗', 'au-pequeno au-certo-txt') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
