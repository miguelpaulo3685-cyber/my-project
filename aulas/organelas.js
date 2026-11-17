aulasMM.aulas['organelas'] = raiz => {
  const $ = id => raiz.querySelector('#au-' + id);
  // [id, nome, na fábrica, função, x %, y %, classe]
  const ORG = [
    ['nucleo', 'Núcleo', 'a diretoria', 'Guarda o DNA, com todas as receitas da célula, e manda cópias (RNA) para a produção.', 50, 48, 'au-o-nucleo'],
    ['ribossomo', 'Ribossomos', 'a linha de montagem', 'Leem o RNA e montam as proteínas, aminoácido por aminoácido. Existem em todas as células, até nas bactérias.', 26, 28, 'au-o-ribo'],
    ['reticulo', 'Retículo endoplasmático', 'os corredores', 'O rugoso (com ribossomos) produz e transporta proteínas; o liso produz lipídios e ajuda a desintoxicar (no fígado).', 30, 64, 'au-o-ret'],
    ['golgi', 'Complexo de Golgi', 'a expedição', 'Modifica, embala em bolsinhas (vesículas) e despacha as proteínas. Também forma os lisossomos.', 74, 30, 'au-o-golgi'],
    ['mitocondria', 'Mitocôndria', 'a usina de energia', 'Faz a respiração celular: usa glicose e oxigênio e produz ATP, a energia da célula.', 76, 68, 'au-o-mito'],
    ['lisossomo', 'Lisossomo', 'a reciclagem', 'Bolsinha com enzimas que digerem o que a célula engole e as partes velhas da própria célula.', 58, 80, 'au-o-liso'],
    ['membrana', 'Membrana', 'a portaria', 'A membrana plasmática controla o que entra e o que sai (aula anterior).', 88, 52, 'au-o-memb']
  ];
  let sel = 'mitocondria';
  function desenhar() {
    $('celula').innerHTML = '<div class="au-citoplasma"></div>' + ORG.map(([id, nome, , , x, y, cls]) =>
      `<button type="button" class="au-org ${cls}${id === sel ? ' au-sel' : ''}" data-o="${id}" style="left:${x}%;top:${y}%" aria-label="${nome}"><span></span><b>${nome}</b></button>`).join('');
    const [, nome, fab, fun] = ORG.find(o => o[0] === sel);
    $('recado').innerHTML = `<b>${nome}</b> (${fab}): ${fun}`;
  }
  $('celula').addEventListener('click', e => { const b = e.target.closest('[data-o]'); if (b) { sel = b.dataset.o; desenhar(); } });
  desenhar();

  // ---------- filminhos ----------
  const { ator, por } = aulasMM;
  const N = (t, cls = '') => `<span class="au-numero ${cls}">${t}</span>`;
  const ROTEIROS = {
    caminho: {
      montar(p) {
        const est = [['🧬', 'núcleo', 10], ['⚙️', 'ribossomo', 29], ['🛤️', 'retículo', 48], ['📦', 'Golgi', 67]];
        const a = { e: est.map(([ic, n, x]) => ator(p, `<div class="au-estacao"><span>${ic}</span><small>${n}</small></div>`, x, 40)) };
        a.saida = ator(p, '<div class="au-estacao"><span>🚪</span><small>saída</small></div>', 87, 40);
        a.item = ator(p, '<span class="au-molecula" style="background:#62a8ea">RNA</span>', 10, 68);
        a.t = ator(p, N('', 'au-pequeno'), 50, 92);
        return a;
      },
      passos: [
        [2400, 'O <b>núcleo</b> copia a receita da insulina do DNA para um <b>RNA</b>.'],
        [2400, 'O RNA vai até o <b>ribossomo</b>, que monta a proteína.', a => por(a.item, { x: 29, html: '<span class="au-molecula" style="background:#c96b4b">proteína</span>' })],
        [2400, 'A proteína anda pelos corredores do <b>retículo</b>.', a => por(a.item, { x: 48 })],
        [2600, 'O <b>Golgi</b> dá os acabamentos e embala numa bolsinha.', a => por(a.item, { x: 67, html: '<span class="au-molecula" style="background:#8a55c9">vesícula</span>' })],
        [2800, 'A bolsinha chega à membrana e solta a insulina no sangue.', a => { por(a.item, { x: 85 }); por(a.t, { html: N('núcleo → ribossomo → retículo → Golgi', 'au-pequeno au-certo-txt') }); }]
      ]
    }
  };
  const paradas = [...raiz.querySelectorAll('[data-filme]')].map(el => aulasMM.filme(el, ROTEIROS[el.dataset.filme]));
  return () => paradas.forEach(p => p());
};
